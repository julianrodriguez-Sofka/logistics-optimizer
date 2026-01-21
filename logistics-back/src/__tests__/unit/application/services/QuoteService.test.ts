import { QuoteService } from '../../../../application/services/QuoteService';
import { FedExAdapter } from '../../../../infrastructure/adapters/FedExAdapter';
import { DHLAdapter } from '../../../../infrastructure/adapters/DHLAdapter';
import { LocalAdapter } from '../../../../infrastructure/adapters/LocalAdapter';
import { QuoteRequest } from '../../../../domain/entities/QuoteRequest';
import { Quote } from '../../../../domain/entities/Quote';
import { IShippingProvider } from '../../../../domain/interfaces/IShippingProvider';
import { IQuoteRepository } from '../../../../domain/interfaces/IQuoteRepository';

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

      // FedEx: (25000 + 10*12000*1.0) = 145000 * 1.15 = 166,750 COP
      expect(quotes[0].price).toBeCloseTo(166750, 0);
      
      // DHL: (20000 + 10*10500*1.0) = 125000 * 1.15 = 143,750 COP
      expect(quotes[1].price).toBeCloseTo(143750, 0);
      
      // Local (Zone 1, 1.8x): (15000 + 10*7500*1.8) = 150000 * 1.15 = 172,500 COP
      expect(quotes[2].price).toBeCloseTo(172500, 0);
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

      // FedEx: 25000 + 10*12000*1.0 = 145,000 COP
      expect(quotes[0].price).toBe(145000);
      
      // DHL: 20000 + 10*10500*1.0 = 125,000 COP
      expect(quotes[1].price).toBe(125000);
      
      // Local (Zone 1, 1.8x): 15000 + 10*7500*1.8 = 150,000 COP
      expect(quotes[2].price).toBe(150000);
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

      // FedEx: (25000 + 5.5*12000*1.0) = 91,000 * 1.15 = 104,650 COP
      expect(quotes[0].price).toBeCloseTo(104650, 0);
      
      // DHL: (20000 + 5.5*10500*1.0) = 77,750 * 1.15 = 89,412.50 COP
      expect(quotes[1].price).toBeCloseTo(89412.5, 0);
      
      // Local (Zone 1, 1.8x): (15000 + 5.5*7500*1.8) = 89,250 * 1.15 = 102,637.50 COP
      expect(quotes[2].price).toBeCloseTo(102637.5, 0);
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

  describe('getAllQuotesWithMessages', () => {
    it('should include error messages when providers fail', async () => {
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

      const { quotes, messages } = await serviceWithFailure.getAllQuotesWithMessages(request);

      expect(quotes).toHaveLength(2);
      expect(messages).toHaveLength(1);
      expect(messages[0].provider).toBe('Provider 2');
      expect(messages[0].message).toContain('not available');
    });

    it('should apply badges to quotes', async () => {
      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const { quotes } = await quoteService.getAllQuotesWithMessages(request);

      // At least one quote should have isCheapest = true
      const cheapestCount = quotes.filter(q => q.isCheapest).length;
      expect(cheapestCount).toBeGreaterThanOrEqual(1);

      // At least one quote should have isFastest = true
      const fastestCount = quotes.filter(q => q.isFastest).length;
      expect(fastestCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cache functionality', () => {
    it('should return cached quotes when cache hit occurs', async () => {
      const cachedQuote = new Quote({
        providerId: 'cached',
        providerName: 'Cached Provider',
        price: 5000,
        currency: 'COP',
        minDays: 1,
        maxDays: 3,
        transportMode: 'Air',
        isCheapest: false,
        isFastest: true,
      });

      const mockRepository: IQuoteRepository = {
        findCached: jest.fn().mockResolvedValue([cachedQuote]),
        saveMany: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        findAll: jest.fn().mockResolvedValue([]),
      };

      const serviceWithCache = new QuoteService(
        [fedexAdapter, dhlAdapter, localAdapter],
        mockRepository
      );

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const { quotes } = await serviceWithCache.getAllQuotesWithMessages(request);

      // Should return cached quote
      expect(quotes).toHaveLength(1);
      expect(quotes[0].price).toBe(5000);
      expect(mockRepository.findCached).toHaveBeenCalledTimes(1);
      // saveMany should not be called when returning cached quotes
      expect(mockRepository.saveMany).not.toHaveBeenCalled();
    });

    it('should handle cache error gracefully and fetch fresh quotes', async () => {
      const mockRepository: IQuoteRepository = {
        findCached: jest.fn().mockRejectedValue(new Error('Cache connection failed')),
        saveMany: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        findAll: jest.fn().mockResolvedValue([]),
      };

      const serviceWithFailingCache = new QuoteService(
        [fedexAdapter, dhlAdapter, localAdapter],
        mockRepository
      );

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      // Should not throw, should continue and fetch fresh quotes
      const { quotes } = await serviceWithFailingCache.getAllQuotesWithMessages(request);

      // Should still return quotes from providers
      expect(quotes.length).toBeGreaterThan(0);
      // Should still try to save to database
      expect(mockRepository.saveMany).toHaveBeenCalled();
    });

    it('should save quotes to database after fetching fresh quotes', async () => {
      const mockRepository: IQuoteRepository = {
        findCached: jest.fn().mockResolvedValue([]), // Cache miss
        saveMany: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        findAll: jest.fn().mockResolvedValue([]),
      };

      const serviceWithCache = new QuoteService(
        [fedexAdapter, dhlAdapter, localAdapter],
        mockRepository
      );

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      await serviceWithCache.getAllQuotesWithMessages(request);

      // Should call saveMany to persist quotes
      expect(mockRepository.saveMany).toHaveBeenCalledTimes(1);
      expect(mockRepository.saveMany).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should handle database save error gracefully', async () => {
      const mockRepository: IQuoteRepository = {
        findCached: jest.fn().mockResolvedValue([]), // Cache miss
        saveMany: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        save: jest.fn().mockResolvedValue(undefined),
        findAll: jest.fn().mockResolvedValue([]),
      };

      const serviceWithFailingDb = new QuoteService(
        [fedexAdapter, dhlAdapter, localAdapter],
        mockRepository
      );

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      // Should not throw even if saveMany fails
      const { quotes } = await serviceWithFailingDb.getAllQuotesWithMessages(request);

      // Should still return quotes from providers
      expect(quotes.length).toBeGreaterThan(0);
      // Should have tried to save
      expect(mockRepository.saveMany).toHaveBeenCalled();
    });

    it('should not save empty quotes to database', async () => {
      const mockRepository: IQuoteRepository = {
        findCached: jest.fn().mockResolvedValue([]), // Cache miss
        saveMany: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
        findAll: jest.fn().mockResolvedValue([]),
      };

      const failingAdapters = [
        { calculateShipping: jest.fn().mockRejectedValue(new Error('Timeout')) },
        { calculateShipping: jest.fn().mockRejectedValue(new Error('Timeout')) },
      ];

      const serviceWithFailingAdapters = new QuoteService(
        failingAdapters as IShippingProvider[],
        mockRepository
      );

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const { quotes } = await serviceWithFailingAdapters.getAllQuotesWithMessages(request);

      // No quotes returned
      expect(quotes).toHaveLength(0);
      // Should not save empty quotes array
      expect(mockRepository.saveMany).not.toHaveBeenCalled();
    });

    it('should handle service without repository gracefully', async () => {
      const serviceWithoutCache = new QuoteService([fedexAdapter, dhlAdapter, localAdapter]);

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: new Date(Date.now() + 86400000),
        fragile: false,
      });

      const { quotes } = await serviceWithoutCache.getAllQuotesWithMessages(request);

      // Should work without repository
      expect(quotes).toHaveLength(3);
    });
  });
});
