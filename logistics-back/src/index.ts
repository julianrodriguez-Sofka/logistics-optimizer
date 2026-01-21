// Load environment variables first
import 'dotenv/config';

import { createServer } from 'http';
import app, { initializeRoutes } from './app';
import { MongoDBConnection } from './infrastructure/database/connection';
import { RabbitMQConnection } from './infrastructure/messaging/RabbitMQConnection';
import { MessageQueueService } from './infrastructure/messaging/MessageQueueService';
import { WebSocketService } from './infrastructure/websocket/WebSocketService';

const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Environment variables validation
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}
if (!process.env.RABBITMQ_URI) {
  throw new Error('RABBITMQ_URI environment variable is required');
}

const mongoUri = process.env.MONGODB_URI;
const rabbitmqUri = process.env.RABBITMQ_URI;

async function startServer() {
  // Validate optional environment variables
  const optionalEnvVars = ['OPENROUTESERVICE_API_KEY'];
  const missingVars = optionalEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && !IS_PRODUCTION) {
    console.warn(`⚠️  Missing optional environment variables: ${missingVars.join(', ')}`);
    console.warn('   Some features may not work correctly without these variables.');
  }

  try {
    // Step 1: Connect to MongoDB
    if (!IS_PRODUCTION) console.log('🔌 Connecting to MongoDB...');
    await MongoDBConnection.getInstance().connect(mongoUri);
    if (!IS_PRODUCTION) console.log(' MongoDB connected - quotes will be cached');
  } catch (error) {
    console.error('MongoDB connection failed:', IS_PRODUCTION ? 'Check configuration' : error);
    throw error; // Don't continue without database
  }

  // Step 2: Connect to RabbitMQ (optional, won't block startup)
  try {
    if (!IS_PRODUCTION) console.log('🐰 Connecting to RabbitMQ...');
    const rabbitMQ = RabbitMQConnection.getInstance();
    await rabbitMQ.connect(rabbitmqUri);
    
    const messageQueue = MessageQueueService.getInstance();
    await messageQueue.initialize();
    if (!IS_PRODUCTION) console.log(' RabbitMQ connected - message queuing enabled');
  } catch (error) {
    console.warn('RabbitMQ connection failed - message queuing disabled');
  }

  // Step 3: Initialize routes
  await initializeRoutes();

  // Step 4: Create HTTP server and initialize WebSocket
  const httpServer = createServer(app);
  
  try {
    const webSocketService = WebSocketService.getInstance();
    webSocketService.initialize(httpServer);
    if (!IS_PRODUCTION) console.log(' WebSocket service initialized - real-time updates enabled');
  } catch (error) {
    console.warn('WebSocket initialization failed - real-time updates disabled');
  }

  // Step 5: Start server
  httpServer.listen(PORT, () => {
    if (!IS_PRODUCTION) {
      console.log(`🚀 Logistics Backend running on http://localhost:${PORT}`);
      console.log(`📦 API endpoint: http://localhost:${PORT}/api/quotes`);
      console.log(`📮 Shipments API: http://localhost:${PORT}/api/shipments`);
      console.log(`👤 Customers API: http://localhost:${PORT}/api/customers`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Adapter status: http://localhost:${PORT}/api/adapters/status`);
    } else {
      console.log(`Server started on port ${PORT}`);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(async () => {
      console.log('HTTP server closed');
      
      // Close connections
      await MongoDBConnection.getInstance().disconnect();
      await RabbitMQConnection.getInstance().close();
      await WebSocketService.getInstance().close();
      
      process.exit(0);
    });
  });
}

startServer();

