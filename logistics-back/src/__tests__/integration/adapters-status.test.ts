import request from 'supertest';
import express, { Express } from 'express';
import { HealthController } from '../../infrastructure/controllers/HealthController';
import { ProviderHealthService } from '../../application/services/ProviderHealthService';
import { FedExAdapter } from '../../infrastructure/adapters/FedExAdapter';
import { DHLAdapter } from '../../infrastructure/adapters/DHLAdapter';
import { LocalAdapter } from '../../infrastructure/adapters/LocalAdapter';

describe('GET /api/adapters/status - Integration Test', () => {
  let app: Express;
  let healthService: ProviderHealthService;
  let healthController: HealthController;

  beforeAll(() => {
    // Initialize adapters
    const fedexAdapter = new FedExAdapter();
    const dhlAdapter = new DHLAdapter();
    const localAdapter = new LocalAdapter();

    // Create health service with adapters
    const adapters = [
      { provider: fedexAdapter, name: 'FedEx' },
      { provider: dhlAdapter, name: 'DHL' },
      { provider: localAdapter, name: 'Local' },
    ];
    healthService = new ProviderHealthService(adapters);
    healthController = new HealthController(healthService);

    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Register health endpoint
    app.get('/api/adapters/status', (req, res) => 
      healthController.getAdaptersStatus(req, res)
    );
  });

  it('should return 200 and system status with all adapters', async () => {
    const response = await request(app)
      .get('/api/adapters/status')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('activeCount');
    expect(response.body).toHaveProperty('totalCount');
    expect(response.body).toHaveProperty('providers');
    
    // Verify we have status for all 3 adapters
    expect(response.body.providers).toHaveLength(3);
    expect(response.body.totalCount).toBe(3);
    
    // Verify each provider has required fields
    response.body.providers.forEach((provider: any) => {
      expect(provider).toHaveProperty('providerName');
      expect(provider).toHaveProperty('status');
      expect(provider).toHaveProperty('responseTime');
      expect(provider).toHaveProperty('lastCheck');
      expect(['online', 'offline']).toContain(provider.status);
    });
  });

  it('should return valid system status (ONLINE, DEGRADED, or OFFLINE)', async () => {
    const response = await request(app)
      .get('/api/adapters/status')
      .expect('Content-Type', /json/);

    expect(['ONLINE', 'DEGRADED', 'OFFLINE']).toContain(response.body.status);
    
    // If status is ONLINE, all adapters should be online
    if (response.body.status === 'ONLINE') {
      expect(response.body.activeCount).toBe(response.body.totalCount);
    }
    
    // If status is OFFLINE, no adapters should be online
    if (response.body.status === 'OFFLINE') {
      expect(response.body.activeCount).toBe(0);
      expect(response.statusCode).toBe(503);
    }
    
    // If status is DEGRADED, some but not all adapters should be online
    if (response.body.status === 'DEGRADED') {
      expect(response.body.activeCount).toBeGreaterThan(0);
      expect(response.body.activeCount).toBeLessThan(response.body.totalCount);
      expect(response.statusCode).toBe(200);
    }
  });

  it('should measure response time for each adapter', async () => {
    const response = await request(app)
      .get('/api/adapters/status')
      .expect('Content-Type', /json/);

    response.body.providers.forEach((provider: any) => {
      expect(provider.responseTime).toBeGreaterThanOrEqual(0);
      expect(typeof provider.responseTime).toBe('number');
    });
  });

  it('should return timestamp for each check', async () => {
    const response = await request(app)
      .get('/api/adapters/status')
      .expect('Content-Type', /json/);

    response.body.providers.forEach((provider: any) => {
      expect(provider.lastCheck).toBeDefined();
      const checkDate = new Date(provider.lastCheck);
      expect(checkDate.getTime()).not.toBeNaN();
    });
  });
});
