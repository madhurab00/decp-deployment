const amqp = require('amqplib');
const opossum = require('opossum');

let channel;

async function connectRabbitMQ() {
  try {
    const amqpServer = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    console.log('Content Service: Connected to RabbitMQ');
  } catch (ex) {
    console.error('RabbitMQ Connection Error (Content Service):', ex);
  }
}

const publishEvent = async (exchange, routingKey, data) => {
  if (!channel) {
    console.error('RabbitMQ channel is not initialized');
    return;
  }
  try {
    await channel.assertExchange(exchange, 'topic', { durable: true });
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), {
      persistent: true
    });
    console.log(`Event published to ${exchange}/${routingKey}`);
  } catch (error) {
    console.error('Failed to publish event:', error);
  }
};

// Example Circuit Breaker configuration for calling User Service
const breakerOptions = {
  timeout: 3000, 
  errorThresholdPercentage: 50,
  resetTimeout: 30000 
};
// const breaker = new opossum(axiosCallToUserService, breakerOptions);

module.exports = {
  connectRabbitMQ,
  publishEvent,
  getChannel: () => channel
};
