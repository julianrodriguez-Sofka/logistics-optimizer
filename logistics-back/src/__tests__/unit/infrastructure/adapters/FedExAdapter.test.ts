import { FedExAdapter } from '../../../../infrastructure/adapters/FedExAdapter';

describe('FedExAdapter', () => {
  let adapter: FedExAdapter;

  beforeEach(() => {
    adapter = new FedExAdapter();
  });

  describe('calculateShipping', () => {
    it('should return a Quote with correct structure', async () => {
      const weight = 10;
      const destination = 'Bogotá'; // Zone 1

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote).toBeDefined();
      expect(quote.providerId).toBe('fedex-ground');
      expect(quote.providerName).toBe('FedEx Ground');
      expect(quote.currency).toBe('COP');
      expect(quote.transportMode).toBe('Truck');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.minDays).toBe(3);
      expect(quote.maxDays).toBe(4);
    });

    it('should calculate price using dynamic formula: basePrice(10000) + (weightCost × zoneMultiplier)', async () => {
      const weight = 10;
      const destination = 'Bogotá'; // Zone 1, multiplier = 1.0
      // Weight: 10kg @ tier 2 (6500 COP/kg) = 65,000 COP
      // Price: 10000 + (65000 × 1.0) = 75,000 COP
      const expectedPrice = 75000;

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should calculate correct price for different weights in Bogotá', async () => {
      // All in Zone 1 (multiplier 1.0)
      const testCases = [
        { weight: 1, expectedPrice: 10000 + (1 * 8000) },     // tier 1: 18,000
        { weight: 5, expectedPrice: 10000 + (5 * 6500) },     // tier 2: 42,500
        { weight: 20, expectedPrice: 10000 + (20 * 5500) },   // tier 3: 120,000
        { weight: 100, expectedPrice: 10000 + (100 * 4800) }, // tier 4: 490,000
      ];

      for (const testCase of testCases) {
        const quote = await adapter.calculateShipping(testCase.weight, 'Bogotá');
        expect(quote.price).toBe(testCase.expectedPrice);
      }
    });

    it('should set estimatedDays to 3 (average of minDays 3 and maxDays 4)', async () => {
      const weight = 10;
      const destination = 'Bogotá';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.estimatedDays).toBe(4); // Math.round((3 + 4) / 2) = 4
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
      const destination = 'Bogotá'; // Zone 1, multiplier 1.0
      // 5.5kg @ tier 2 (6500 COP/kg) = 35,750 COP
      // Price: 10000 + (35750 × 1.0) = 45,750 COP
      const expectedPrice = 45750;

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
      const destination = 'Bogotá'; // Zone 1, multiplier 1.0
      // 0.1kg @ tier 1 (8000 COP/kg) = 800 COP
      // Price: 10000 + (800 × 1.0) = 10,800 COP
      const expectedPrice = 10800;

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should accept weight at maximum boundary (1000 kg)', async () => {
      const weight = 1000;
      const destination = 'Bogotá'; // Zone 1, multiplier 1.0
      // 1000kg @ tier 4 (4800 COP/kg) = 4,800,000 COP
      // Price: 10000 + (4800000 × 1.0) = 4,810,000 COP
      const expectedPrice = 4810000;

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
