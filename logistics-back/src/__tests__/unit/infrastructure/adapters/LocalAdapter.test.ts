
import { LocalAdapter } from '../../../../infrastructure/adapters/LocalAdapter';

describe('LocalAdapter', () => {
  let adapter: LocalAdapter;

  beforeEach(() => {
    adapter = new LocalAdapter();
  });

  describe('calculateShipping', () => {
    it('should return a Quote with correct structure', async () => {
      const weight = 10;
      const destination = 'Bogotá';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote).toBeDefined();
      expect(quote.providerId).toBe('local-courier');
      expect(quote.providerName).toBe('Local Courier');
      expect(quote.currency).toBe('COP');
      expect(quote.transportMode).toBe('Truck');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.minDays).toBe(7);
      expect(quote.maxDays).toBe(7);
    });

    it('should calculate price using dynamic formula: basePrice + (weight * tierRate * zoneMultiplier)', async () => {
      const weight = 10;
      const destination = 'Bogotá'; // Zone 1, multiplier 1.8 (dynamic)
      // 10kg @ tier 2 (4500 COP/kg) in Zone 1 (multiplier 1.8)
      const expectedPrice = 5000 + (10 * 4500 * 1.8); // 5000 + 81000 = 86,000 COP

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should calculate correct price for different weights', async () => {
      const testCases = [
        // 1kg @ tier 1 (5000 COP/kg) with multiplier 1.8: 5000 + (1 * 5000 * 1.8) = 14,000 COP
        { weight: 1, expectedPrice: 14000 },
        // 5kg @ tier 2 (4500 COP/kg) with multiplier 1.8: 5000 + (5 * 4500 * 1.8) = 45,500 COP
        { weight: 5, expectedPrice: 45500 },
        // 20kg @ tier 3 (4000 COP/kg) with multiplier 1.8: 5000 + (20 * 4000 * 1.8) = 149,000 COP
        { weight: 20, expectedPrice: 149000 },
        // 100kg @ tier 4 (3800 COP/kg) with multiplier 1.8: 5000 + (100 * 3800 * 1.8) = 689,000 COP
        { weight: 100, expectedPrice: 689000 },
      ];

      for (const testCase of testCases) {
        const quote = await adapter.calculateShipping(testCase.weight, 'Bogotá');
        expect(quote.price).toBe(testCase.expectedPrice);
      }
    });

    it('should set estimatedDays to 7 (minDays and maxDays both 7)', async () => {
      const weight = 10;
      const destination = 'Bogotá';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.estimatedDays).toBe(7);
    });

    it('should set isCheapest and isFastest to false by default', async () => {
      const weight = 10;
      const destination = 'Bogotá';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.isCheapest).toBe(false);
      expect(quote.isFastest).toBe(false);
    });

    it('should handle decimal weights correctly', async () => {
      const weight = 5.5;
      const destination = 'Bogotá'; // Zone 1, multiplier 1.8
      // 5.5kg @ tier 2 (4500 COP/kg) in Zone 1 (multiplier 1.8)
      const expectedPrice = 5000 + (5.5 * 4500 * 1.8); // 5000 + 44550 = 49,550 COP

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should throw error for invalid weight (zero)', async () => {
      const weight = 0;
      const destination = 'Bogotá';

      await expect(adapter.calculateShipping(weight, destination))
        .rejects
        .toThrow('Weight must be greater than 0.1 kg');
    });

    it('should throw error for invalid weight (negative)', async () => {
      const weight = -5;
      const destination = 'Bogotá';

      await expect(adapter.calculateShipping(weight, destination))
        .rejects
        .toThrow('Weight must be greater than 0.1 kg');
    });

    it('should throw error for weight exceeding maximum (1000 kg)', async () => {
      const weight = 1001;
      const destination = 'Bogotá';

      await expect(adapter.calculateShipping(weight, destination))
        .rejects
        .toThrow('Weight must be less than or equal to 1000 kg');
    });

    it('should accept weight at minimum boundary (0.1 kg)', async () => {
      const weight = 0.1;
      const destination = 'Bogotá'; // Zone 1, multiplier 1.8
      // 0.1kg @ tier 1 (5000 COP/kg) in Zone 1 (multiplier 1.8)
      const expectedPrice = 5000 + (0.1 * 5000 * 1.8); // 5000 + 900 = 5,900 COP

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should accept weight at maximum boundary (1000 kg)', async () => {
      const weight = 1000;
      const destination = 'Bogotá'; // Zone 1, multiplier 1.8
      // 1000kg @ tier 4 (3800 COP/kg) in Zone 1 (multiplier 1.8)
      const expectedPrice = 5000 + (1000 * 3800 * 1.8); // 5000 + 6840000 = 6,845,000 COP

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
      const destination = 'Bogotá';
      
      const startTime = Date.now();
      await adapter.calculateShipping(weight, destination);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds in milliseconds
    });
  });
});
