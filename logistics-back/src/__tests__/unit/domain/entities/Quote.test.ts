import { Quote } from '../../../../domain/entities/Quote';

describe('Quote Entity', () => {
  describe('Entity Instantiation', () => {
    it('should create a Quote instance with all required properties', () => {
      const quoteData = {
        providerId: 'fedex-ground',
        providerName: 'FedEx Ground',
        price: 32.80,
        currency: 'USD',
        minDays: 3,
        maxDays: 4,
        transportMode: 'Truck',
        isCheapest: false,
        isFastest: true,
      };

      const quote = new Quote(quoteData);

      expect(quote.providerId).toBe('fedex-ground');
      expect(quote.providerName).toBe('FedEx Ground');
      expect(quote.price).toBe(32.80);
      expect(quote.currency).toBe('USD');
      expect(quote.minDays).toBe(3);
      expect(quote.maxDays).toBe(4);
      expect(quote.transportMode).toBe('Truck');
      expect(quote.isCheapest).toBe(false);
      expect(quote.isFastest).toBe(true);
    });

    it('should set default values for optional properties', () => {
      const quoteData = {
        providerId: 'dhl-express',
        providerName: 'DHL Express',
        price: 45.50,
        currency: 'USD',
        minDays: 5,
        maxDays: 5,
        transportMode: 'Air',
      };

      const quote = new Quote(quoteData);

      expect(quote.isCheapest).toBe(false);
      expect(quote.isFastest).toBe(false);
    });
  });

  describe('Property Validation', () => {
    it('should throw error when providerId is empty', () => {
      const quoteData = {
        providerId: '',
        providerName: 'FedEx Ground',
        price: 32.80,
        currency: 'USD',
        minDays: 3,
        maxDays: 4,
        transportMode: 'Truck',
      };

      expect(() => new Quote(quoteData)).toThrow('providerId is required');
    });

    it('should throw error when providerName is empty', () => {
      const quoteData = {
        providerId: 'fedex-ground',
        providerName: '',
        price: 32.80,
        currency: 'USD',
        minDays: 3,
        maxDays: 4,
        transportMode: 'Truck',
      };

      expect(() => new Quote(quoteData)).toThrow('providerName is required');
    });

    it('should throw error when price is negative', () => {
      const quoteData = {
        providerId: 'fedex-ground',
        providerName: 'FedEx Ground',
        price: -10,
        currency: 'USD',
        minDays: 3,
        maxDays: 4,
        transportMode: 'Truck',
      };

      expect(() => new Quote(quoteData)).toThrow('price must be positive');
    });

    it('should throw error when price is zero', () => {
      const quoteData = {
        providerId: 'fedex-ground',
        providerName: 'FedEx Ground',
        price: 0,
        currency: 'USD',
        minDays: 3,
        maxDays: 4,
        transportMode: 'Truck',
      };

      expect(() => new Quote(quoteData)).toThrow('price must be positive');
    });

    it('should throw error when minDays is negative', () => {
      const quoteData = {
        providerId: 'fedex-ground',
        providerName: 'FedEx Ground',
        price: 32.80,
        currency: 'USD',
        minDays: -1,
        maxDays: 4,
        transportMode: 'Truck',
      };

      expect(() => new Quote(quoteData)).toThrow('minDays must be positive');
    });

    it('should throw error when maxDays is less than minDays', () => {
      const quoteData = {
        providerId: 'fedex-ground',
        providerName: 'FedEx Ground',
        price: 32.80,
        currency: 'USD',
        minDays: 5,
        maxDays: 3,
        transportMode: 'Truck',
      };

      expect(() => new Quote(quoteData)).toThrow('maxDays must be greater than or equal to minDays');
    });

    it('should accept when maxDays equals minDays', () => {
      const quoteData = {
        providerId: 'dhl-express',
        providerName: 'DHL Express',
        price: 45.50,
        currency: 'USD',
        minDays: 5,
        maxDays: 5,
        transportMode: 'Air',
      };

      expect(() => new Quote(quoteData)).not.toThrow();
    });
  });

  describe('Estimated Days Calculation', () => {
    it('should return estimatedDays as average of minDays and maxDays when different', () => {
      const quoteData = {
        providerId: 'fedex-ground',
        providerName: 'FedEx Ground',
        price: 32.80,
        currency: 'USD',
        minDays: 3,
        maxDays: 5,
        transportMode: 'Truck',
      };

      const quote = new Quote(quoteData);

      expect(quote.estimatedDays).toBe(4);
    });

    it('should return estimatedDays as minDays when minDays equals maxDays', () => {
      const quoteData = {
        providerId: 'dhl-express',
        providerName: 'DHL Express',
        price: 45.50,
        currency: 'USD',
        minDays: 5,
        maxDays: 5,
        transportMode: 'Air',
      };

      const quote = new Quote(quoteData);

      expect(quote.estimatedDays).toBe(5);
    });
  });

  describe('Badge Assignment', () => {
    it('should allow setting isCheapest to true', () => {
      const quoteData = {
        providerId: 'local-courier',
        providerName: 'Local Courier',
        price: 25.00,
        currency: 'USD',
        minDays: 7,
        maxDays: 7,
        transportMode: 'Truck',
      };

      const quote = new Quote(quoteData);
      quote.isCheapest = true;

      expect(quote.isCheapest).toBe(true);
    });

    it('should allow setting isFastest to true', () => {
      const quoteData = {
        providerId: 'fedex-priority',
        providerName: 'FedEx Priority',
        price: 55.00,
        currency: 'USD',
        minDays: 2,
        maxDays: 2,
        transportMode: 'Air',
      };

      const quote = new Quote(quoteData);
      quote.isFastest = true;

      expect(quote.isFastest).toBe(true);
    });

    it('should allow a quote to be both cheapest and fastest', () => {
      const quoteData = {
        providerId: 'best-option',
        providerName: 'Best Option',
        price: 20.00,
        currency: 'USD',
        minDays: 1,
        maxDays: 1,
        transportMode: 'Express',
      };

      const quote = new Quote(quoteData);
      quote.isCheapest = true;
      quote.isFastest = true;

      expect(quote.isCheapest).toBe(true);
      expect(quote.isFastest).toBe(true);
    });
  });
});
