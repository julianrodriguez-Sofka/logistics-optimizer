import { FedExAdapter } from '../../../../infrastructure/adapters/FedExAdapter';

describe('FedExAdapter', () => {
  let adapter: FedExAdapter;

  beforeEach(() => {
    adapter = new FedExAdapter();
  });

  // Current FedEx pricing configuration:
  // BASE_PRICE = 25000 COP
  // MIN_DELIVERY_DAYS = 2
  // MAX_DELIVERY_DAYS = 4
  // Weight tiers (from WeightPricingCalculator.getFedExTiers()):
  //   - 0-5kg: 15000 COP/kg
  //   - 5-20kg: 12000 COP/kg
  //   - 20-50kg: 10000 COP/kg
  //   - 50+kg: 8500 COP/kg

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
      expect(quote.minDays).toBe(2);
      expect(quote.maxDays).toBe(4);
    });

    it('should calculate price using dynamic formula: basePrice(25000) + (weightCost × zoneMultiplier)', async () => {
      const weight = 10;
      const destination = 'Bogotá'; // Zone 1, multiplier = 1.0
      // Weight: 10kg @ tier 2 (12000 COP/kg) = 120,000 COP
      // Price: 25000 + (120000 × 1.0) = 145,000 COP
      const expectedPrice = 145000;

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should calculate correct price for different weights in Bogotá', async () => {
      // All in Zone 1 (multiplier 1.0)
      const testCases = [
        { weight: 1, expectedPrice: 25000 + (1 * 15000) },      // tier 1: 40,000
        { weight: 5, expectedPrice: 25000 + (5 * 12000) },      // tier 2: 85,000
        { weight: 20, expectedPrice: 25000 + (20 * 10000) },    // tier 3: 225,000
        { weight: 100, expectedPrice: 25000 + (100 * 8500) },   // tier 4: 875,000
      ];

      for (const testCase of testCases) {
        const quote = await adapter.calculateShipping(testCase.weight, 'Bogotá');
        expect(quote.price).toBe(testCase.expectedPrice);
      }
    });

    it('should set estimatedDays to 3 (average of minDays 2 and maxDays 4)', async () => {
      const weight = 10;
      const destination = 'Bogotá';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.estimatedDays).toBe(3); // Math.round((2 + 4) / 2) = 3
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
      // 5.5kg @ tier 2 (12000 COP/kg) = 66,000 COP
      // Price: 25000 + (66000 × 1.0) = 91,000 COP
      const expectedPrice = 91000;

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
      // 0.1kg @ tier 1 (15000 COP/kg) = 1,500 COP
      // Price: 25000 + (1500 × 1.0) = 26,500 COP
      const expectedPrice = 26500;

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should accept weight at maximum boundary (1000 kg)', async () => {
      const weight = 1000;
      const destination = 'Bogotá'; // Zone 1, multiplier 1.0
      // 1000kg @ tier 4 (8500 COP/kg) = 8,500,000 COP
      // Price: 25000 + (8500000 × 1.0) = 8,525,000 COP
      const expectedPrice = 8525000;

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
