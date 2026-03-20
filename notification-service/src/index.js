require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { connectRabbitMQ } = require('./rabbitmq/consumer');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/health', (req, res) => res.send('Notification Service is running'));
app.use(errorHandler);

// Setup Service Connections
const startServer = async () => {
  try {
    // Database connection
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Notification Service: Connected to MongoDB Database');

    // Message Broker consumer connection
    await connectRabbitMQ();

    // Start Express listener
    const port = process.env.PORT || 3003;
    app.listen(port, () => {
      console.log(`Notification Service is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start Notification Service:', error);
    process.exit(1);
  }
};

startServer();
