import request from 'supertest';
import express, { Express } from 'express';
import { QuoteController } from '../../infrastructure/controllers/QuoteController';
import { QuoteService } from '../../application/services/QuoteService';
import { BadgeService } from '../../application/services/BadgeService';
import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';
import { Quote } from '../../domain/entities/Quote';

describe('POST /api/quotes - Error Handling Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
  });

  describe('Partial Provider Availability', () => {
    it('should return 200 with 2 quotes when 1 provider times out', async () => {
      const mockFastProvider1: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'fedex',
            providerName: 'FedEx Ground',
            price: 85,
            currency: 'USD',
            minDays: 3,
            maxDays: 4,
            transportMode: 'Truck',
          })
        ),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const mockFastProvider2: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'dhl',
            providerName: 'DHL Express',
            price: 90,
            currency: 'USD',
            minDays: 2,
            maxDays: 3,
            transportMode: 'Air',
          })
        ),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const mockSlowProvider: IShippingProvider = {
        calculateShipping: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            providerId: 'slow',
            providerName: 'Slow Provider',
            price: 100,
            currency: 'USD',
            minDays: 5,
            maxDays: 7,
            transportMode: 'Truck',
          }), 6000)) // 6 seconds - will timeout
        ),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const quoteService = new QuoteService([mockFastProvider1, mockSlowProvider, mockFastProvider2]);
      const badgeService = new BadgeService();
      const quoteController = new QuoteController(quoteService, badgeService);

      app.post('/api/quotes', (req, res) => quoteController.requestQuotes(req, res));

      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: new Date(Date.now() + 86400000).toISOString(),
          fragile: false,
        })
        .expect(200);

      expect(response.body.quotes).toHaveLength(2);
      expect(response.body.quotes[0].providerName).toBe('FedEx Ground');
      expect(response.body.quotes[1].providerName).toBe('DHL Express');
      
      // Should include message about failed provider
      expect(response.body.messages).toBeDefined();
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].provider).toBe('Provider 2');
      expect(response.body.messages[0].message).toContain('not available');
    }, 10000);

    it('should return 200 with messages array when some providers fail', async () => {
      const mockOnlineProvider: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'fedex',
            providerName: 'FedEx Ground',
            price: 85,
            currency: 'USD',
            minDays: 3,
            maxDays: 4,
            transportMode: 'Truck',
          })
        ),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const mockOfflineProvider: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Service unavailable')),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const quoteService = new QuoteService([mockOnlineProvider, mockOfflineProvider]);
      const badgeService = new BadgeService();
      const quoteController = new QuoteController(quoteService, badgeService);

      app.post('/api/quotes-partial', (req, res) => quoteController.requestQuotes(req, res));

      const response = await request(app)
        .post('/api/quotes-partial')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: new Date(Date.now() + 86400000).toISOString(),
          fragile: false,
        })
        .expect(200);

      expect(response.body.quotes).toHaveLength(1);
      expect(response.body.messages).toBeDefined();
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].message).toContain('not available');
    });
  });

  describe('All Providers Offline', () => {
    it('should return 503 when all providers are offline', async () => {
      const mockOfflineProvider1: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Timeout')),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const mockOfflineProvider2: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Service down')),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const quoteService = new QuoteService([mockOfflineProvider1, mockOfflineProvider2]);
      const badgeService = new BadgeService();
      const quoteController = new QuoteController(quoteService, badgeService);

      app.post('/api/quotes-offline', (req, res) => quoteController.requestQuotes(req, res));

      const response = await request(app)
        .post('/api/quotes-offline')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: new Date(Date.now() + 86400000).toISOString(),
          fragile: false,
        })
        .expect(503);

      expect(response.body.error).toContain('Service unavailable');
      expect(response.body.retryAfter).toBe(30);
      expect(response.body.messages).toBeDefined();
      expect(response.body.messages).toHaveLength(2);
    });

    it('should include retry-after in 503 response', async () => {
      const mockOfflineProvider: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('All down')),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const quoteService = new QuoteService([mockOfflineProvider]);
      const badgeService = new BadgeService();
      const quoteController = new QuoteController(quoteService, badgeService);

      app.post('/api/quotes-retry', (req, res) => quoteController.requestQuotes(req, res));

      const response = await request(app)
        .post('/api/quotes-retry')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: new Date(Date.now() + 86400000).toISOString(),
          fragile: false,
        })
        .expect(503);

      expect(response.body.retryAfter).toBe(30);
    });
  });

  describe('Timeout Scenarios', () => {
    it('should timeout slow providers after 5 seconds', async () => {
      const mockFastProvider: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'fast',
            providerName: 'Fast Provider',
            price: 85,
            currency: 'USD',
            minDays: 3,
            maxDays: 4,
            transportMode: 'Truck',
          })
        ),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const mockSlowProvider: IShippingProvider = {
        calculateShipping: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            providerId: 'slow',
            providerName: 'Slow Provider',
            price: 100,
            currency: 'USD',
            minDays: 5,
            maxDays: 7,
            transportMode: 'Truck',
          }), 7000)) // 7 seconds
        ),
        trackShipment: jest.fn(),
        validateAddress: jest.fn(),
      };

      const quoteService = new QuoteService([mockFastProvider, mockSlowProvider]);
      const badgeService = new BadgeService();
      const quoteController = new QuoteController(quoteService, badgeService);

      app.post('/api/quotes-timeout', (req, res) => quoteController.requestQuotes(req, res));

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/quotes-timeout')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 10,
          pickupDate: new Date(Date.now() + 86400000).toISOString(),
          fragile: false,
        })
        .expect(200);
      const duration = Date.now() - startTime;

      expect(response.body.quotes).toHaveLength(1);
      expect(response.body.quotes[0].providerName).toBe('Fast Provider');
      expect(duration).toBeLessThan(6000); // Should complete around 5s, not 7s
      expect(response.body.messages).toHaveLength(1);
    }, 10000);
  });
});
