const Comment = require('../models/Comment');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Post = require('../models/Post');
const { getChannel } = require('./connection');

const startConsumers = async () => {
  const channel = getChannel();
  if (!channel) {
    console.error('Content Service consumer cannot start without a RabbitMQ channel');
    return;
  }

  const exchange = 'decp_events';
  const queue = 'content_service_user_updates';

  await channel.assertExchange(exchange, 'topic', { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, 'user.updated');

  channel.consume(queue, async (message) => {
    if (!message) return;

    try {
      const payload = JSON.parse(message.content.toString());
      const { userId, snapshot } = payload;

      if (!userId || !snapshot) {
        channel.ack(message);
        return;
      }

      await Promise.all([
        Post.updateMany(
          { authorId: userId },
          {
            $set: {
              'authorSnapshot.name': snapshot.name || 'Unknown User',
              'authorSnapshot.profilePicUrl': snapshot.profilePicUrl || '',
              'authorSnapshot.headline': snapshot.headline || '',
            },
          }
        ),
        Comment.updateMany(
          { userId },
          {
            $set: {
              'authorSnapshot.name': snapshot.name || 'Unknown User',
              'authorSnapshot.profilePicUrl': snapshot.profilePicUrl || '',
              'authorSnapshot.headline': snapshot.headline || '',
            },
          }
        ),
        Job.updateMany(
          { postedById: userId },
          {
            $set: {
              'postedBySnapshot.name': snapshot.name || 'Unknown User',
              'postedBySnapshot.profilePicUrl': snapshot.profilePicUrl || '',
            },
          }
        ),
        JobApplication.updateMany(
          { applicantId: userId },
          {
            $set: {
              'applicantSnapshot.name': snapshot.name || 'Unknown User',
              'applicantSnapshot.profilePicUrl': snapshot.profilePicUrl || '',
              'applicantSnapshot.headline': snapshot.headline || '',
            },
          }
        ),
      ]);

      channel.ack(message);
    } catch (error) {
      console.error('Failed to process user.updated event in content-service:', error);
      channel.nack(message, false, false);
    }
  });

  console.log('Content Service: Listening for user.updated events');
};

module.exports = { startConsumers };
