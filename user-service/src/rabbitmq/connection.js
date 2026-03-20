const amqp = require('amqplib');
const opossum = require('opossum');

let channel;

async function connectRabbitMQ() {
  try {
    const amqpServer = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    console.log('User Service: Connected to RabbitMQ');
  } catch (ex) {
    console.error('RabbitMQ Connection Error (User Service):', ex);
    // In production, we should probably implement retry logic here
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

// Example of circuit breaker for an external call (e.g. if User Service needs to call another service synchronously)
const breakerOptions = {
  timeout: 3000, // If function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the breaker
  resetTimeout: 30000 // After 30 seconds, try again.
};

// const exampleExternalCall = async (userId) => { /* axios call here */ };
// const circuitBreaker = new opossum(exampleExternalCall, breakerOptions);

module.exports = {
  connectRabbitMQ,
  publishEvent
};
