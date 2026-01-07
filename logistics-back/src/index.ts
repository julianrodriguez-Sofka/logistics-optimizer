import app, { initializeRoutes } from './app';
import { MongoDBConnection } from './infrastructure/database/connection';

const PORT = process.env.PORT || 3000;

// Wait for MongoDB connection before starting server
// Use admin:adminpassword for local development with authentication
const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:adminpassword@localhost:27017/logistics-optimizer?authSource=admin';

async function startServer() {
  try {
    // Attempt MongoDB connection with timeout
    console.log('🔌 Connecting to MongoDB...');
    await MongoDBConnection.getInstance().connect(mongoUri);
    console.log('✅ MongoDB connected - quotes will be cached');
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed - running without caching');
  }

  // Initialize routes AFTER MongoDB connection
  await initializeRoutes();

  // Start Express server
  app.listen(PORT, () => {
    console.log(`🚀 Logistics Backend running on http://localhost:${PORT}`);
    console.log(`📦 API endpoint: http://localhost:${PORT}/api/quotes`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Adapter status: http://localhost:${PORT}/api/adapters/status`);
  });
}

startServer();

