const amqp = require('amqplib');
const Notification = require('../models/Notification');
const {
  canSendInAppNotification,
  getUsersEligibleForType
} = require('../services/preferenceService');

let channel;

const buildNotificationPayload = (routingKey, event) => {
  switch (routingKey) {
    case 'post.liked':
      if (!event.postAuthorId || event.postAuthorId === event.actorId) {
        return null;
      }
      return {
        userId: event.postAuthorId,
        type: 'POST_LIKED',
        title: 'New like on your post',
        body: `${event.actorSnapshot?.name || 'Someone'} liked your post`,
        data: {
          actorId: event.actorId,
          actorName: event.actorSnapshot?.name || 'Someone',
          targetType: 'post',
          targetId: event.postId
        }
      };
    case 'post.commented':
      if (!event.postAuthorId || event.postAuthorId === event.actorId) {
        return null;
      }
      return {
        userId: event.postAuthorId,
        type: 'COMMENT_ADDED',
        title: 'New comment on your post',
        body: `${event.actorSnapshot?.name || 'Someone'} commented on your post`,
        data: {
          actorId: event.actorId,
          actorName: event.actorSnapshot?.name || 'Someone',
          targetType: 'post',
          targetId: event.postId,
          commentId: event.commentId || ''
        }
      };
    case 'job.applied':
      if (!event.postedById || event.postedById === event.applicantId) {
        return null;
      }
      return {
        userId: event.postedById,
        type: 'JOB_APPLIED',
        title: 'New job application',
        body: `${event.applicantSnapshot?.name || 'Someone'} applied for ${event.title || 'your job'}`,
        data: {
          actorId: event.applicantId,
          actorName: event.applicantSnapshot?.name || 'Someone',
          targetType: 'job',
          targetId: event.jobId
        }
      };
    case 'job.posted':
      return {
        type: 'JOB_POSTED',
        title: 'New job posted',
        body: `${event.postedBySnapshot?.name || 'Someone'} posted ${event.title || 'a new job'} at ${event.companyName || 'a company'}`,
        data: {
          actorId: event.postedById,
          actorName: event.postedBySnapshot?.name || 'Someone',
          targetType: 'job',
          targetId: event.jobId
        }
      };
    default:
      return null;
  }
};

const handleEvent = async (routingKey, event) => {
  const notificationPayload = buildNotificationPayload(routingKey, event);

  if (!notificationPayload) {
    return;
  }

  if (routingKey === 'job.posted') {
    const recipientIds = await getUsersEligibleForType(notificationPayload.type, [event.postedById]);

    if (recipientIds.length === 0) {
      return;
    }

    await Notification.insertMany(
      recipientIds.map((userId) => ({
        ...notificationPayload,
        userId
      }))
    );
    return;
  }

  const canSend = await canSendInAppNotification(notificationPayload.userId, notificationPayload.type);
  if (!canSend) {
    return;
  }

  await Notification.create(notificationPayload);
};

async function connectRabbitMQ() {
  try {
    const amqpServer = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    console.log('Notification Service: Connected to RabbitMQ');
    
    // Ensure the exchange and queue exist, and bind them
    const exchange = 'decp_events';
    const queue = 'notification_queue';
    
    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    
    // Bind the queue to all routing keys we care about
    const routingKeys = ['user.*', 'post.*', 'job.*'];
    for (const key of routingKeys) {
      await channel.bindQueue(queue, exchange, key);
    }
    
    // Start consuming messages
    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString());
          console.log(`Received event on ${msg.fields.routingKey}:`, event);
          
          await handleEvent(msg.fields.routingKey, event);

          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          // For Dead Letter Queue (DLQ), we might want to nack and not requeue:
          // channel.nack(msg, false, false);
        }
      }
    });

  } catch (ex) {
    console.error('RabbitMQ Connection Error (Notification Service):', ex);
  }
}

module.exports = {
  connectRabbitMQ
};
