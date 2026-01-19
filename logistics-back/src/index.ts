import { createServer } from 'http';
import app, { initializeRoutes } from './app';
import { MongoDBConnection } from './infrastructure/database/connection';
import { RabbitMQConnection } from './infrastructure/messaging/RabbitMQConnection';
import { MessageQueueService } from './infrastructure/messaging/MessageQueueService';
import { WebSocketService } from './infrastructure/websocket/WebSocketService';

const PORT = process.env.PORT || 3000;

// Wait for MongoDB connection before starting server
// Use admin:adminpassword for local development with authentication
const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:adminpassword@localhost:27017/logistics-optimizer?authSource=admin';
const rabbitmqUri = process.env.RABBITMQ_URI || 'amqp://guest:guest@localhost:5672';

async function startServer() {
  try {
    // Step 1: Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await MongoDBConnection.getInstance().connect(mongoUri);
    console.log(' MongoDB connected - quotes will be cached');
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed - running without caching');
  }

  // Step 2: Connect to RabbitMQ (optional, won't block startup)
  try {
    console.log('🐰 Connecting to RabbitMQ...');
    const rabbitMQ = RabbitMQConnection.getInstance();
    await rabbitMQ.connect(rabbitmqUri);
    
    const messageQueue = MessageQueueService.getInstance();
    await messageQueue.initialize();
    console.log(' RabbitMQ connected - message queuing enabled');
  } catch (error) {
    console.warn('⚠️  RabbitMQ connection failed - running without message queuing');
  }

  // Step 3: Initialize routes
  await initializeRoutes();

  // Step 4: Create HTTP server and initialize WebSocket
  const httpServer = createServer(app);
  
  try {
    const webSocketService = WebSocketService.getInstance();
    webSocketService.initialize(httpServer);
    console.log(' WebSocket service initialized - real-time updates enabled');
  } catch (error) {
    console.warn('⚠️  WebSocket initialization failed - running without real-time updates');
  }

  // Step 5: Start server
  httpServer.listen(PORT, () => {
    console.log(`🚀 Logistics Backend running on http://localhost:${PORT}`);
    console.log(`📦 API endpoint: http://localhost:${PORT}/api/quotes`);
    console.log(`📮 Shipments API: http://localhost:${PORT}/api/shipments`);
    console.log(`👤 Customers API: http://localhost:${PORT}/api/customers`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Adapter status: http://localhost:${PORT}/api/adapters/status`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(async () => {
      console.log('HTTP server closed');
      
      // Close connections
      await MongoDBConnection.getInstance().close();
      await RabbitMQConnection.getInstance().close();
      await WebSocketService.getInstance().close();
      
      process.exit(0);
    });
  });
}

startServer();

