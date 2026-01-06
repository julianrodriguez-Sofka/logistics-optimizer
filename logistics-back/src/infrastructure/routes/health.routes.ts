import { Router, Request, Response } from 'express';
import { HealthController } from '../controllers/HealthController';
import { ProviderHealthService } from '../../application/services/ProviderHealthService';
import { FedExAdapter } from '../adapters/FedExAdapter';
import { DHLAdapter } from '../adapters/DHLAdapter';
import { LocalAdapter } from '../adapters/LocalAdapter';

// Initialize dependencies
const fedexAdapter = new FedExAdapter();
const dhlAdapter = new DHLAdapter();
const localAdapter = new LocalAdapter();

// Create health service with named adapters
const adapters = [
  { provider: fedexAdapter, name: 'FedEx' },
  { provider: dhlAdapter, name: 'DHL' },
  { provider: localAdapter, name: 'Local' },
];
const healthService = new ProviderHealthService(adapters);
const healthController = new HealthController(healthService);

// Create router
const router = Router();

// GET /api/adapters/status - Get health status of all adapters
router.get('/adapters/status', (req: Request, res: Response) => {
  healthController.getAdaptersStatus(req, res);
});

export default router;
