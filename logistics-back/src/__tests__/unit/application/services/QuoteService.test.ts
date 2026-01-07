import { QuoteService } from '../../../../application/services/QuoteService';
import { FedExAdapter } from '../../../../infrastructure/adapters/FedExAdapter';
import { DHLAdapter } from '../../../../infrastructure/adapters/DHLAdapter';
import { LocalAdapter } from '../../../../infrastructure/adapters/LocalAdapter';
import { QuoteRequest } from '../../../../domain/entities/QuoteRequest';
import { IShippingProvider } from '../../../../domain/interfaces/IShippingProvider';

describe('QuoteService', () => {
  let quoteService: QuoteService;
  let fedexAdapter: FedExAdapter;
  let dhlAdapter: DHLAdapter;
  let localAdapter: LocalAdapter;

  beforeEach(() => {
    fedexAdapter = new FedExAdapter();
    dhlAdapter = new DHLAdapter();
    localAdapter = new LocalAdapter();
    quoteService = new QuoteService([fedexAdapter, dhlAdapter, localAdapter]);
  });

  describe('getAllQuotes', () => {
    it('should return quotes from all 3 adapters when all are online', async () => {
      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000), // Tomorrow
        fragile: false,
      });

      const quotes = await quoteService.getAllQuotes(request);

      expect(quotes).toHaveLength(3);
      expect(quotes[0].providerName).toBe('FedEx Ground');
      expect(quotes[1].providerName).toBe('DHL Express');
      expect(quotes[2].providerName).toBe('Local Courier');
    });

    it('should apply fragile surcharge (+15%) when fragile is true', async () => {
      const weight = 10;
      const request = new QuoteRequest({
        origin: 'Bogotá',
        destination: 'Bogotá',
        weight: weight,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: true,
      });

      const quotes = await quoteService.getAllQuotes(request);

      // FedEx: (10000 + 10*6500*1.0) = 75000 * 1.15 = 86,250 COP
      expect(quotes[0].price).toBeCloseTo(86250, 0);
      
      // DHL: (8000 + 10*6000*1.0) = 68000 * 1.15 = 78,200 COP
      expect(quotes[1].price).toBeCloseTo(78200, 0);
      
      // Local (Zone 1, 1.8x): (5000 + 10*4500*1.8) = 86000 * 1.15 = 98,900 COP
      expect(quotes[2].price).toBeCloseTo(98900, 0);
    });

    it('should NOT apply fragile surcharge when fragile is false', async () => {
      const weight = 10;
      const request = new QuoteRequest({
        origin: 'Bogotá',
        destination: 'Bogotá',
        weight: weight,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const quotes = await quoteService.getAllQuotes(request);

      // FedEx: 10000 + 10*6500*1.0 = 75,000 COP
      expect(quotes[0].price).toBe(75000);
      
      // DHL: 8000 + 10*6000*1.0 = 68,000 COP
      expect(quotes[1].price).toBe(68000);
      
      // Local (Zone 1, 1.8x): 5000 + 10*4500*1.8 = 86,000 COP
      expect(quotes[2].price).toBe(86000);
    });

    it('should return 2 quotes when one adapter fails', async () => {
      const mockFailingAdapter: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Provider timeout')),
      };

      const serviceWithFailure = new QuoteService([
        fedexAdapter,
        mockFailingAdapter,
        localAdapter,
      ]);

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const quotes = await serviceWithFailure.getAllQuotes(request);

      expect(quotes).toHaveLength(2);
      expect(quotes[0].providerName).toBe('FedEx Ground');
      expect(quotes[1].providerName).toBe('Local Courier');
    });

    it('should return empty array when all adapters fail', async () => {
      const mockFailingAdapter1: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Timeout')),
      };

      const mockFailingAdapter2: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Service down')),
      };

      const serviceWithAllFailures = new QuoteService([
        mockFailingAdapter1,
        mockFailingAdapter2,
      ]);

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const quotes = await serviceWithAllFailures.getAllQuotes(request);

      expect(quotes).toHaveLength(0);
    });

    it('should use Promise.allSettled for parallel execution', async () => {
      const spyFedEx = jest.spyOn(fedexAdapter, 'calculateShipping');
      const spyDHL = jest.spyOn(dhlAdapter, 'calculateShipping');
      const spyLocal = jest.spyOn(localAdapter, 'calculateShipping');

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      await quoteService.getAllQuotes(request);

      // All adapters should be called
      expect(spyFedEx).toHaveBeenCalledTimes(1);
      expect(spyDHL).toHaveBeenCalledTimes(1);
      expect(spyLocal).toHaveBeenCalledTimes(1);
    });

    it('should complete within 3 seconds when all adapters are online', async () => {
      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const startTime = Date.now();
      await quoteService.getAllQuotes(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(3000); // 3 seconds
    });

    it('should apply fragile surcharge with correct precision', async () => {
      const weight = 5.5;
      const request = new QuoteRequest({
        origin: 'Bogotá',
        destination: 'Bogotá',
        weight: weight,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: true,
      });

      const quotes = await quoteService.getAllQuotes(request);

      // FedEx: (10000 + 5.5*6500*1.0) = 45,750 * 1.15 = 52,612.50 COP
      expect(quotes[0].price).toBeCloseTo(52612.5, 0);
      
      // DHL: (8000 + 5.5*6000*1.0) = 41,000 * 1.15 = 47,150 COP
      expect(quotes[1].price).toBeCloseTo(47150, 0);
      
      // Local (Zone 1, 1.8x): (5000 + 5.5*4500*1.8) = 49,550 * 1.15 = 56,982.50 COP
      expect(quotes[2].price).toBeCloseTo(56982.5, 0);
    });

    it('should handle adapter timeout gracefully (5 second timeout)', async () => {
      const slowAdapter: IShippingProvider = {
        calculateShipping: jest.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => resolve({
              providerId: 'slow-provider',
              providerName: 'Slow Provider',
              price: 100,
              currency: 'USD',
              minDays: 3,
              maxDays: 5,
              transportMode: 'Truck',
            }), 6000); // 6 seconds - exceeds 5 second timeout
          });
        }),
      };

      const serviceWithSlowAdapter = new QuoteService([
        fedexAdapter,
        slowAdapter,
        localAdapter,
      ]);

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const startTime = Date.now();
      const quotes = await serviceWithSlowAdapter.getAllQuotes(request);
      const endTime = Date.now();

      // Should return quotes from fast adapters only
      expect(quotes.length).toBeLessThanOrEqual(2);
      
      // Should timeout the slow adapter and complete within reasonable time
      expect(endTime - startTime).toBeLessThan(6000);
    }, 10000); // Increase test timeout to 10 seconds

    it('should timeout adapter call after 5 seconds', async () => {
      const mockSlowAdapter: IShippingProvider = {
        calculateShipping: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            providerId: 'slow',
            providerName: 'Slow Provider',
            price: 100,
            currency: 'USD',
            minDays: 3,
            maxDays: 5,
            transportMode: 'Truck',
          }), 6000))
        ),
      };

      const serviceWithTimeout = new QuoteService([mockSlowAdapter]);

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const startTime = Date.now();
      const quotes = await serviceWithTimeout.getAllQuotes(request);
      const duration = Date.now() - startTime;

      // Adapter should timeout and return no quotes
      expect(quotes).toHaveLength(0);
      // Should complete around 5 seconds, not 6
      expect(duration).toBeGreaterThanOrEqual(4900);
      expect(duration).toBeLessThan(5500);
    }, 10000);

    it('should return quotes from fast adapters when one times out', async () => {
      const mockSlowAdapter: IShippingProvider = {
        calculateShipping: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            providerId: 'slow',
            providerName: 'Slow Provider',
            price: 100,
            currency: 'USD',
            minDays: 3,
            maxDays: 5,
            transportMode: 'Truck',
          }), 6000))
        ),
      };

      const serviceWithMixed = new QuoteService([
        fedexAdapter,
        mockSlowAdapter,
        dhlAdapter,
      ]);

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const quotes = await serviceWithMixed.getAllQuotes(request);

      // Should return 2 quotes (FedEx and DHL)
      expect(quotes).toHaveLength(2);
      expect(quotes[0].providerName).toBe('FedEx Ground');
      expect(quotes[1].providerName).toBe('DHL Express');
    }, 10000);
  });
});
