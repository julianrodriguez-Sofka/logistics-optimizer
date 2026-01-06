import { Router, Request, Response } from 'express';
import { QuoteController } from '../controllers/QuoteController';
import { QuoteService } from '../../application/services/QuoteService';
import { BadgeService } from '../../application/services/BadgeService';
import { FedExAdapter } from '../adapters/FedExAdapter';
import { DHLAdapter } from '../adapters/DHLAdapter';
import { LocalAdapter } from '../adapters/LocalAdapter';

// Initialize dependencies
const fedexAdapter = new FedExAdapter();
const dhlAdapter = new DHLAdapter();
const localAdapter = new LocalAdapter();

const quoteService = new QuoteService([fedexAdapter, dhlAdapter, localAdapter]);
const badgeService = new BadgeService();
const quoteController = new QuoteController(quoteService, badgeService);

// Create router
const router = Router();

// POST /api/quotes - Request shipping quotes
router.post('/quotes', (req: Request, res: Response) => {
  quoteController.requestQuotes(req, res);
});

export default router;
