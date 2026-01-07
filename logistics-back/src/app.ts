import express, { Application, Request, Response, NextFunction } from 'express';

const app: Application = express();

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

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Function to initialize routes (called after MongoDB connection)
export async function initializeRoutes() {
  // Dynamic imports to ensure MongoDB is connected first
  const quotesRouter = (await import('./infrastructure/routes/quotes.routes')).default;
  const healthRouter = (await import('./infrastructure/routes/health.routes')).default;
  
  // API Routes
  app.use('/api', quotesRouter);
  app.use('/api', healthRouter);
  
  // 404 handler - MUST BE AFTER ALL ROUTES
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ error: 'Not Found' });
  });

  console.log('✅ Routes initialized');
}

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
