import request from 'supertest';
import express, { Express } from 'express';
import { QuoteController } from '../../infrastructure/controllers/QuoteController';
import { QuoteService } from '../../application/services/QuoteService';
import { BadgeService } from '../../application/services/BadgeService';
import { FedExAdapter } from '../../infrastructure/adapters/FedExAdapter';
import { DHLAdapter } from '../../infrastructure/adapters/DHLAdapter';
import { LocalAdapter } from '../../infrastructure/adapters/LocalAdapter';  


describe.skip('POST /api/quotes - Integration Tests', () => {
  let app: Express;
  let quoteController: QuoteController;

  beforeEach(() => {
    // Setup dependencies
    const fedexAdapter = new FedExAdapter();
    const dhlAdapter = new DHLAdapter();
    const localAdapter = new LocalAdapter();
    const quoteService = new QuoteService([fedexAdapter, dhlAdapter, localAdapter]);
    const badgeService = new BadgeService();
    
    quoteController = new QuoteController(quoteService, badgeService);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.post('/api/quotes', (req, res) => quoteController.requestQuotes(req, res));
  });

  describe('Happy Path', () => {
    it('should return 200 with 3 quotes when all providers online', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: tomorrow.toISOString(),
          fragile: false,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('quotes');
      expect(response.body.quotes).toHaveLength(3);
      
      // Verify quote structure
      const quote = response.body.quotes[0];
      expect(quote).toHaveProperty('providerId');
      expect(quote).toHaveProperty('providerName');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('currency');
      expect(quote).toHaveProperty('minDays');
      expect(quote).toHaveProperty('maxDays');
      expect(quote).toHaveProperty('transportMode');
      expect(quote).toHaveProperty('isCheapest');
      expect(quote).toHaveProperty('isFastest');
    });

    it('should assign badges correctly', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: tomorrow.toISOString(),
          fragile: false,
        });

      expect(response.status).toBe(200);
      
      const quotes = response.body.quotes;
      
      // Exactly one quote should be cheapest
      const cheapestCount = quotes.filter((q: any) => q.isCheapest).length;
      expect(cheapestCount).toBe(1);
      
      // Exactly one quote should be fastest
      const fastestCount = quotes.filter((q: any) => q.isFastest).length;
      expect(fastestCount).toBe(1);
    });

    it('should apply fragile surcharge when fragile is true', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const responseNormal = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: tomorrow.toISOString(),
          fragile: false,
        });

      const responseFragile = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: tomorrow.toISOString(),
          fragile: true,
        });

      expect(responseNormal.status).toBe(200);
      expect(responseFragile.status).toBe(200);

      // Fragile prices should be approximately 15% higher
      const normalPrice = responseNormal.body.quotes[0].price;
      const fragilePrice = responseFragile.body.quotes[0].price;
      expect(fragilePrice).toBeCloseTo(normalPrice * 1.15, 2);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing origin', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/quotes')
        .send({
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: tomorrow.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Origin');
    });

    it('should return 400 for missing destination', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          weight: 10,
          pickupDate: tomorrow.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Destination');
    });

    it('should return 400 for invalid weight (zero)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 0,
          pickupDate: tomorrow.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Weight');
    });

    it('should return 400 for invalid weight (negative)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: -5,
          pickupDate: tomorrow.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Weight');
    });

    it('should return 400 for weight exceeding maximum', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 1001,
          pickupDate: tomorrow.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Weight');
    });

    it('should return 400 for past pickup date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: yesterday.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('date');
    });

    it('should return 400 for pickup date more than 30 days ahead', async () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 31);

      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: farFuture.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('date');
    });
  });

  describe('Service Degradation', () => {
    it('should return 503 when all providers are down', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create service with all failing adapters
      const mockFailingAdapter1: any = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Service down')),
      };
      const mockFailingAdapter2: any = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Service down')),
      };
      const mockFailingAdapter3: any = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Service down')),
      };

      const failingQuoteService = new QuoteService([
        mockFailingAdapter1,
        mockFailingAdapter2,
        mockFailingAdapter3,
      ]);
      const badgeService = new BadgeService();
      const failingController = new QuoteController(failingQuoteService, badgeService);

      const failingApp = express();
      failingApp.use(express.json());
      failingApp.post('/api/quotes', (req, res) => failingController.requestQuotes(req, res));

      const response = await request(failingApp)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: tomorrow.toISOString(),
        });

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('unavailable');
    });
  });

  describe('Response Time', () => {
    it('should respond within 3 seconds for all providers online', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: tomorrow.toISOString(),
          fragile: false,
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000);
    });
  });
});
