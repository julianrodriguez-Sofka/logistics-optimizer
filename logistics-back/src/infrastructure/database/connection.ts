import mongoose from 'mongoose';

/**
 * MongoDB Connection Manager
 * Singleton pattern to manage database connection
 */
export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private isConnected = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  /**
   * Connect to MongoDB
   * @param uri - MongoDB connection string
   */
  async connect(uri: string): Promise<void> {
    if (this.isConnected) {
      console.log(' MongoDB already connected');
      return;
    }

    try {
      await mongoose.connect(uri);
      this.isConnected = true;
      console.log(' MongoDB connected successfully');
    } catch (error) {
      console.error(' MongoDB connection error:', error);
      // Don't throw - allow app to run without database (graceful degradation)
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await mongoose.disconnect();
    this.isConnected = false;
    console.log('MongoDB disconnected');
  }

  /**
   * Get mongoose connection
   */
  getConnection() {
    return mongoose.connection;
  }

  /**
   * Check if connected
   */
  isMongoConnected(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}
