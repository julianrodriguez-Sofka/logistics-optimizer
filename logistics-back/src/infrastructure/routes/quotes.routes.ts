import { Router, Request, Response } from 'express';
import { QuoteController } from '../controllers/QuoteController';
import { QuoteService } from '../../application/services/QuoteService';
import { BadgeService } from '../../application/services/BadgeService';
import { FedExAdapter } from '../adapters/FedExAdapter';
import { DHLAdapter } from '../adapters/DHLAdapter';
import { LocalAdapter } from '../adapters/LocalAdapter';
import { QuoteRepository } from '../database/repositories/QuoteRepository';
import { MongoDBConnection } from '../database/connection';
import { validateQuoteRequest } from '../middlewares/validateQuoteRequest';

console.log('🔧 Initializing quote routes...');

// Initialize adapters
const fedexAdapter = new FedExAdapter();
const dhlAdapter = new DHLAdapter();
const localAdapter = new LocalAdapter();

// Initialize repository only if MongoDB is connected
let quoteRepository;
const isConnected = MongoDBConnection.getInstance().isMongoConnected();
console.log('📊 MongoDB connection status at route init:', isConnected);

if (isConnected) {
  quoteRepository = new QuoteRepository();
  console.log('✅ Quote repository initialized with MongoDB');
} else {
  console.warn('⚠️  Running without quote repository (MongoDB not connected)');
}

const quoteService = new QuoteService(
  [fedexAdapter, dhlAdapter, localAdapter],
  quoteRepository // Optional - graceful degradation if undefined
);

console.log('📝 QuoteService created with repository:', !!quoteRepository);

const badgeService = new BadgeService();
const quoteController = new QuoteController(quoteService, badgeService);

// Create router
const router = Router();

// POST /api/quotes - Request shipping quotes
// Apply validation middleware before controller (Task 2.4 from HU-02)
router.post('/quotes', validateQuoteRequest, (req: Request, res: Response) => {
  quoteController.requestQuotes(req, res);
});

export default router;
