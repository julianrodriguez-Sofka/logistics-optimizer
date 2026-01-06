import { DHLAdapter } from '../../../../infrastructure/adapters/DHLAdapter';

describe('DHLAdapter', () => {
  let adapter: DHLAdapter;

  beforeEach(() => {
    adapter = new DHLAdapter();
  });

  describe('calculateShipping', () => {
    it('should return a Quote with correct structure', async () => {
      const weight = 10;
      const destination = 'Los Angeles, CA';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote).toBeDefined();
      expect(quote.providerId).toBe('dhl-express');
      expect(quote.providerName).toBe('DHL Express');
      expect(quote.currency).toBe('USD');
      expect(quote.transportMode).toBe('Air');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.minDays).toBe(5);
      expect(quote.maxDays).toBe(5);
    });

    it('should calculate price using formula: basePrice(45) + weight * 4.0', async () => {
      const weight = 10;
      const destination = 'Los Angeles, CA';
      const expectedPrice = 45 + (weight * 4.0); // 45 + 40 = 85

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should calculate correct price for different weights', async () => {
      const testCases = [
        { weight: 1, expectedPrice: 45 + (1 * 4.0) },    // 49
        { weight: 5, expectedPrice: 45 + (5 * 4.0) },    // 65
        { weight: 20, expectedPrice: 45 + (20 * 4.0) },  // 125
        { weight: 100, expectedPrice: 45 + (100 * 4.0) }, // 445
      ];

      for (const testCase of testCases) {
        const quote = await adapter.calculateShipping(testCase.weight, 'Test Location');
        expect(quote.price).toBe(testCase.expectedPrice);
      }
    });

    it('should set estimatedDays to 5 (minDays and maxDays both 5)', async () => {
      const weight = 10;
      const destination = 'New York, NY';

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.estimatedDays).toBe(5);
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
      const expectedPrice = 45 + (weight * 4.0); // 45 + 22 = 67

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
      const expectedPrice = 45 + (weight * 4.0); // 45 + 0.4 = 45.4

      const quote = await adapter.calculateShipping(weight, destination);

      expect(quote.price).toBe(expectedPrice);
    });

    it('should accept weight at maximum boundary (1000 kg)', async () => {
      const weight = 1000;
      const destination = 'Austin, TX';
      const expectedPrice = 45 + (weight * 4.0); // 45 + 4000 = 4045

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
