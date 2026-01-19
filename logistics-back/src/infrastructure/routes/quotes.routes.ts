import { Router, Request, Response } from 'express';
import { QuoteController } from '../controllers/QuoteController.js';
import { QuoteService } from '../../application/services/QuoteService.js';
import { BadgeService } from '../../application/services/BadgeService.js';
import { FedExAdapter } from '../adapters/FedExAdapter.js';
import { DHLAdapter } from '../adapters/DHLAdapter.js';
import { LocalAdapter } from '../adapters/LocalAdapter.js';
import { OpenRouteServiceAdapter } from '../adapters/OpenRouteServiceAdapter.js';
import { MultiModalRouteAdapter } from '../adapters/MultiModalRouteAdapter.js';
import { QuoteRepository } from '../database/repositories/QuoteRepository.js';
import { MongoDBConnection } from '../database/connection.js';
import { validateQuoteRequest } from '../middlewares/validateQuoteRequest.js';

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
  console.log(' Quote repository initialized with MongoDB');
} else {
  console.warn('⚠️  Running without quote repository (MongoDB not connected)');
}

// Initialize OpenRouteService adapter (Free alternative to Google Maps)
let routeCalculator;
let multiModalCalculator;
const openRouteServiceKey = process.env.OPENROUTESERVICE_API_KEY;
if (openRouteServiceKey && openRouteServiceKey !== 'your_openrouteservice_api_key_here') {
  routeCalculator = new OpenRouteServiceAdapter(openRouteServiceKey);
  multiModalCalculator = new MultiModalRouteAdapter(openRouteServiceKey);
  console.log('🗺️  OpenRouteService adapter initialized (Free - 2000 requests/day)');
  console.log('✈️  Multi-Modal adapter initialized (Air + Ground routes)');
} else {
  console.warn('⚠️  Running without route calculation (API key not configured)');
  console.warn('   Set OPENROUTESERVICE_API_KEY in .env to enable route calculation');
  console.warn('   Get free API key at: https://openrouteservice.org/dev/#/signup');
}

const quoteService = new QuoteService(
  [fedexAdapter, dhlAdapter, localAdapter],
  quoteRepository, // Optional - graceful degradation if undefined
  routeCalculator, // Optional - graceful degradation if undefined
  multiModalCalculator // Optional - for air+ground routes
);

console.log('📝 QuoteService created with repository:', !!quoteRepository);
console.log('🗺️  QuoteService created with route calculator:', !!routeCalculator);

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
