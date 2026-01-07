import { DHLAdapter } from '../../../../infrastructure/adapters/DHLAdapter';

describe('DHLAdapter', () => {
  let adapter: DHLAdapter;

  beforeEach(() => {
    adapter = new DHLAdapter();
  });

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
      expect(quote.minDays).toBe(5);
      expect(quote.maxDays).toBe(8);
    });

    it('should calculate price using dynamic formula: basePrice(8000) + (weightCost × zoneMultiplier)', async () => {
      const weight = 10;
      const destination = 'Bogotá'; // Zone 1, multiplier = 1.0
      // Weight: 10kg @ tier 2 (6000 COP/kg) = 60,000 COP
      // Price: 8000 + (60000 × 1.0) = 68,000 COP
      const expectedPrice = 68000;

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should calculate correct price for different weights', async () => {
      // All in Zone 1 (multiplier 1.0)
      const testCases = [
        { weight: 1, expectedPrice: 8000 + (1 * 7500) },     // tier 1: 15,500
        { weight: 5, expectedPrice: 8000 + (5 * 6000) },     // tier 2: 38,000
        { weight: 20, expectedPrice: 8000 + (20 * 5000) },   // tier 3: 108,000
        { weight: 100, expectedPrice: 8000 + (100 * 4500) }, // tier 4: 458,000
      ];

      for (const testCase of testCases) {
        const quote = await adapter.calculateShipping(testCase.weight, 'Bogotá');
        expect(quote.price).toBe(testCase.expectedPrice);
      }
    });

    it('should calculate estimatedDays as average of minDays (5) and maxDays (8)', async () => {
      const weight = 10;
      const destination = 'Bogotá';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.estimatedDays).toBe(Math.round((5 + 8) / 2));
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
      // 5.5kg @ tier 2 (6000 COP/kg) = 33,000 COP
      // Price: 8000 + (33000 × 1.0) = 41,000 COP
      const expectedPrice = 41000;

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
      // 0.1kg @ tier 1 (7500 COP/kg) in Zone 1 (multiplier 1.0)
      const expectedPrice = 8000 + (weight * 7500 * 1.0); // 8000 + 750 = 8750

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should accept weight at maximum boundary (1000 kg)', async () => {
      const weight = 1000;
      const destination = 'Bogotá';
      // 1000kg @ tier 4 (4500 COP/kg) in Zone 1 (multiplier 1.0)
      const expectedPrice = 8000 + (weight * 4500 * 1.0); // 8000 + 4500000 = 4508000

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
