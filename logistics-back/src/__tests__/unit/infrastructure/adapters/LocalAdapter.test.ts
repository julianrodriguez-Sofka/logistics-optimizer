import { LocalAdapter } from '../../../../infrastructure/adapters/LocalAdapter';

describe('LocalAdapter', () => {
  let adapter: LocalAdapter;

  beforeEach(() => {
    adapter = new LocalAdapter();
  });

  // Current Local pricing configuration:
  // BASE_PRICE = 15000 COP
  // MIN_DELIVERY_DAYS = 4
  // MAX_DELIVERY_DAYS = 7
  // Weight tiers (from WeightPricingCalculator.getLocalTiers()):
  //   - 0-5kg: 9000 COP/kg
  //   - 5-20kg: 7500 COP/kg
  //   - 20-50kg: 6500 COP/kg
  //   - 50+kg: 5800 COP/kg
  // Zone multipliers (from ZoneConfig for Local):
  //   - Zone 1: 1.8
  //   - Zone 2: 1.4
  //   - Zone 3: 1.12
  //   - Zone 4: 1.5
  //   - Zone 5: 1.6

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
      expect(quote.minDays).toBe(4);
      expect(quote.maxDays).toBe(7);
    });

    it('should calculate price using dynamic formula: basePrice + (weight * tierRate * zoneMultiplier)', async () => {
      const weight = 10;
      const destination = 'Bogotá'; // Zone 1, multiplier 1.8
      // 10kg @ tier 2 (7500 COP/kg) in Zone 1 (multiplier 1.8)
      const expectedPrice = 15000 + (10 * 7500 * 1.8); // 15000 + 135000 = 150,000 COP

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should calculate correct price for different weights', async () => {
      const testCases = [
        // 1kg @ tier 1 (9000 COP/kg) with multiplier 1.8: 15000 + (1 * 9000 * 1.8) = 31,200 COP
        { weight: 1, expectedPrice: 31200 },
        // 5kg @ tier 2 (7500 COP/kg) with multiplier 1.8: 15000 + (5 * 7500 * 1.8) = 82,500 COP
        { weight: 5, expectedPrice: 82500 },
        // 20kg @ tier 3 (6500 COP/kg) with multiplier 1.8: 15000 + (20 * 6500 * 1.8) = 249,000 COP
        { weight: 20, expectedPrice: 249000 },
        // 100kg @ tier 4 (5800 COP/kg) with multiplier 1.8: 15000 + (100 * 5800 * 1.8) = 1,059,000 COP
        { weight: 100, expectedPrice: 1059000 },
      ];

      for (const testCase of testCases) {
        const quote = await adapter.calculateShipping(testCase.weight, 'Bogotá');
        expect(quote.price).toBe(testCase.expectedPrice);
      }
    });

    it('should set estimatedDays based on minDays and maxDays average', async () => {
      const weight = 10;
      const destination = 'Bogotá';

      const quote = await adapter.calculateShipping(weight, destination);

      // estimatedDays should be the average: (4 + 7) / 2 = 5.5, rounded = 6
      expect(quote.estimatedDays).toBe(6);
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
      // 5.5kg @ tier 2 (7500 COP/kg) in Zone 1 (multiplier 1.8)
      const expectedPrice = 15000 + (5.5 * 7500 * 1.8); // 15000 + 74250 = 89,250 COP

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
      // 0.1kg @ tier 1 (9000 COP/kg) in Zone 1 (multiplier 1.8)
      const expectedPrice = 15000 + (0.1 * 9000 * 1.8); // 15000 + 1620 = 16,620 COP

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should accept weight at maximum boundary (1000 kg)', async () => {
      const weight = 1000;
      const destination = 'Bogotá'; // Zone 1, multiplier 1.8
      // 1000kg @ tier 4 (5800 COP/kg) in Zone 1 (multiplier 1.8)
      const expectedPrice = 15000 + (1000 * 5800 * 1.8); // 15000 + 10440000 = 10,455,000 COP

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
