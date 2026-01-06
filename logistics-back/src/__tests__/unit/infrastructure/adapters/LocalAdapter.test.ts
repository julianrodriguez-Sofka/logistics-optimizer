
import { LocalAdapter } from '../../../../infrastructure/adapters/LocalAdapter';

describe('LocalAdapter', () => {
  let adapter: LocalAdapter;

  beforeEach(() => {
    adapter = new LocalAdapter();
  });

  describe('calculateShipping', () => {
    it('should return a Quote with correct structure', async () => {
      const weight = 10;
      const destination = 'Los Angeles, CA';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote).toBeDefined();
      expect(quote.providerId).toBe('local-courier');
      expect(quote.providerName).toBe('Local Courier');
      expect(quote.currency).toBe('USD');
      expect(quote.transportMode).toBe('Truck');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.minDays).toBe(7);
      expect(quote.maxDays).toBe(7);
    });

    it('should calculate price using formula: basePrice(60) + weight * 2.5', async () => {
      const weight = 10;
      const destination = 'Los Angeles, CA';
      const expectedPrice = 60 + (weight * 2.5); // 60 + 25 = 85

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should calculate correct price for different weights', async () => {
      const testCases = [
        { weight: 1, expectedPrice: 60 + (1 * 2.5) },    // 62.5
        { weight: 5, expectedPrice: 60 + (5 * 2.5) },    // 72.5
        { weight: 20, expectedPrice: 60 + (20 * 2.5) },  // 110
        { weight: 100, expectedPrice: 60 + (100 * 2.5) }, // 310
      ];

      for (const testCase of testCases) {
        const quote = await adapter.calculateShipping(testCase.weight, 'Test Location');
        expect(quote.price).toBe(testCase.expectedPrice);
      }
    });

    it('should set estimatedDays to 7 (minDays and maxDays both 7)', async () => {
      const weight = 10;
      const destination = 'New York, NY';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.estimatedDays).toBe(7);
    });

    it('should set isCheapest and isFastest to false by default', async () => {
      const weight = 10;
      const destination = 'Chicago, IL';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.isCheapest).toBe(false);
      expect(quote.isFastest).toBe(false);
    });

    it('should handle decimal weights correctly', async () => {
      const weight = 5.5;
      const destination = 'Miami, FL';
      const expectedPrice = 60 + (weight * 2.5); // 60 + 13.75 = 73.75

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should throw error for invalid weight (zero)', async () => {
      const weight = 0;
      const destination = 'Boston, MA';

      await expect(adapter.calculateShipping(weight, destination))
        .rejects
        .toThrow('Weight must be greater than 0.1 kg');
    });

    it('should throw error for invalid weight (negative)', async () => {
      const weight = -5;
      const destination = 'Seattle, WA';

      await expect(adapter.calculateShipping(weight, destination))
        .rejects
        .toThrow('Weight must be greater than 0.1 kg');
    });

    it('should throw error for weight exceeding maximum (1000 kg)', async () => {
      const weight = 1001;
      const destination = 'Denver, CO';

      await expect(adapter.calculateShipping(weight, destination))
        .rejects
        .toThrow('Weight must be less than or equal to 1000 kg');
    });

    it('should accept weight at minimum boundary (0.1 kg)', async () => {
      const weight = 0.1;
      const destination = 'Portland, OR';
      const expectedPrice = 60 + (weight * 2.5); // 60 + 0.25 = 60.25

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should accept weight at maximum boundary (1000 kg)', async () => {
      const weight = 1000;
      const destination = 'Austin, TX';
      const expectedPrice = 60 + (weight * 2.5); // 60 + 2500 = 2560

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should throw error for empty destination', async () => {
      const weight = 10;
      const destination = '';

      await expect(adapter.calculateShipping(weight, destination))
        .rejects
        .toThrow('Destination is required');
    });
  });

  describe('Response Time', () => {
    it('should respond within 5 seconds', async () => {
      const weight = 10;
      const destination = 'San Francisco, CA';
      
      const startTime = Date.now();
      await adapter.calculateShipping(weight, destination);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds in milliseconds
    });
  });
});
