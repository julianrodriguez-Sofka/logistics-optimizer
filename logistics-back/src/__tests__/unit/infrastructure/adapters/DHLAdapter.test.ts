import { DHLAdapter } from '../../../../infrastructure/adapters/DHLAdapter';

describe('DHLAdapter', () => {
  let adapter: DHLAdapter;

  beforeEach(() => {
    adapter = new DHLAdapter();
  });

  // Current DHL pricing configuration:
  // BASE_PRICE = 20000 COP
  // MIN_DELIVERY_DAYS = 3
  // MAX_DELIVERY_DAYS = 5
  // Weight tiers (from WeightPricingCalculator.getDHLTiers()):
  //   - 0-5kg: 13000 COP/kg
  //   - 5-20kg: 10500 COP/kg
  //   - 20-50kg: 9000 COP/kg
  //   - 50+kg: 7800 COP/kg

  describe('calculateShipping', () => {
    it('should return a Quote with correct structure', async () => {
      const weight = 10;
      const destination = 'Bogotá';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote).toBeDefined();
      expect(quote.providerId).toBe('dhl-express');
      expect(quote.providerName).toBe('DHL Express');
      expect(quote.currency).toBe('COP');
      expect(quote.transportMode).toBe('Air');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.minDays).toBe(3);
      expect(quote.maxDays).toBe(5);
    });

    it('should calculate price using dynamic formula: basePrice(20000) + (weightCost × zoneMultiplier)', async () => {
      const weight = 10;
      const destination = 'Bogotá'; // Zone 1, multiplier = 1.0
      // Weight: 10kg @ tier 2 (10500 COP/kg) = 105,000 COP
      // Price: 20000 + (105000 × 1.0) = 125,000 COP
      const expectedPrice = 125000;

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should calculate correct price for different weights', async () => {
      // All in Zone 1 (multiplier 1.0)
      const testCases = [
        { weight: 1, expectedPrice: 20000 + (1 * 13000) },     // tier 1: 33,000
        { weight: 5, expectedPrice: 20000 + (5 * 10500) },     // tier 2: 72,500
        { weight: 20, expectedPrice: 20000 + (20 * 9000) },    // tier 3: 200,000
        { weight: 100, expectedPrice: 20000 + (100 * 7800) },  // tier 4: 800,000
      ];

      for (const testCase of testCases) {
        const quote = await adapter.calculateShipping(testCase.weight, 'Bogotá');
        expect(quote.price).toBe(testCase.expectedPrice);
      }
    });

    it('should calculate estimatedDays as average of minDays (3) and maxDays (5)', async () => {
      const weight = 10;
      const destination = 'Bogotá';

      const quote = await adapter.calculateShipping(weight, destination);

      // (3 + 5) / 2 = 4
      expect(quote.estimatedDays).toBe(4);
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
      // 5.5kg @ tier 2 (10500 COP/kg) = 57,750 COP
      // Price: 20000 + (57750 × 1.0) = 77,750 COP
      const expectedPrice = 77750;

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
      const destination = 'Bogotá';
      // 0.1kg @ tier 1 (13000 COP/kg) in Zone 1 (multiplier 1.0)
      const expectedPrice = 20000 + (weight * 13000 * 1.0); // 20000 + 1300 = 21,300

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should accept weight at maximum boundary (1000 kg)', async () => {
      const weight = 1000;
      const destination = 'Bogotá';
      // 1000kg @ tier 4 (7800 COP/kg) in Zone 1 (multiplier 1.0)
      const expectedPrice = 20000 + (weight * 7800 * 1.0); // 20000 + 7800000 = 7,820,000

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
