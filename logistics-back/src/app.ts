import express, { Application, Request, Response, NextFunction } from 'express';
import quotesRouter from './infrastructure/routes/quotes.routes';
import healthRouter from './infrastructure/routes/health.routes';
import { MongoDBConnection } from './infrastructure/database/connection';

const app: Application = express();

// Initialize MongoDB connection (graceful degradation if fails)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics-optimizer';
MongoDBConnection.getInstance().connect(mongoUri).catch(err => {
  console.warn('⚠️  MongoDB connection failed - running without database', err.message);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware (simple implementation)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API Routes
app.use('/api', quotesRouter);
app.use('/api', healthRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

export default app;
