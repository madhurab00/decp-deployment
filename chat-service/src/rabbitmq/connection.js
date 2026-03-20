const amqp = require('amqplib');

let channel;

async function connectRabbitMQ() {
  try {
    const amqpServer = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    console.log('Chat Service: Connected to RabbitMQ');
    
    // Setup exchange if Chat needs to listen to events like user updates
    const exchange = 'decp_events';
    await channel.assertExchange(exchange, 'topic', { durable: true });
  } catch (ex) {
    console.error('RabbitMQ Connection Error (Chat Service):', ex);
  }
}

const publishEvent = async (exchange, routingKey, data) => {
  if (!channel) return;
  try {
    await channel.assertExchange(exchange, 'topic', { durable: true });
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), {
      persistent: true
    });
  } catch (error) {
    console.error('Failed to publish event:', error);
  }
};

module.exports = {
  connectRabbitMQ,
  publishEvent
};
