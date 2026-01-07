import { Router, Request, Response } from 'express';
import { QuoteController } from '../controllers/QuoteController';
import { QuoteService } from '../../application/services/QuoteService';
import { BadgeService } from '../../application/services/BadgeService';
import { FedExAdapter } from '../adapters/FedExAdapter';
import { DHLAdapter } from '../adapters/DHLAdapter';
import { LocalAdapter } from '../adapters/LocalAdapter';
import { QuoteRepository } from '../database/repositories/QuoteRepository';
import { MongoDBConnection } from '../database/connection';

// Initialize dependencies
const fedexAdapter = new FedExAdapter();
const dhlAdapter = new DHLAdapter();
const localAdapter = new LocalAdapter();

// Initialize repository only if MongoDB is connected
let quoteRepository;
if (MongoDBConnection.getInstance().isMongoConnected()) {
  quoteRepository = new QuoteRepository();
  console.log('✅ Quote repository initialized');
} else {
  console.warn('⚠️  Running without quote repository (MongoDB not connected)');
}

const quoteService = new QuoteService(
  [fedexAdapter, dhlAdapter, localAdapter],
  quoteRepository // Optional - graceful degradation if undefined
);
const badgeService = new BadgeService();
const quoteController = new QuoteController(quoteService, badgeService);

// Create router
const router = Router();

// POST /api/quotes - Request shipping quotes
router.post('/quotes', (req: Request, res: Response) => {
  quoteController.requestQuotes(req, res);
});

export default router;
