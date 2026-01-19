/**
 * TDD - RED PHASE: Tests First
 * Unit tests for DistanceBasedPricingService
 */
import { DistanceBasedPricingService } from '../../../application/services/DistanceBasedPricingService.js';
import { IRouteCalculator } from '../../../domain/interfaces/IRouteCalculator.js';
import { RouteInfo } from '../../../domain/entities/RouteInfo.js';
import { Location } from '../../../domain/entities/Location.js';
import { Quote } from '../../../domain/entities/Quote.js';

describe('DistanceBasedPricingService', () => {
  let service: DistanceBasedPricingService;
  let mockRouteCalculator: jest.Mocked<IRouteCalculator>;

  const mockOrigin: Location = {
    address: 'New York, NY',
    lat: 40.7128,
    lng: -74.006,
  };

  const mockDestination: Location = {
    address: 'Boston, MA',
    lat: 42.3601,
    lng: -71.0589,
  };

  beforeEach(() => {
    mockRouteCalculator = {
      calculateRoute: jest.fn(),
      getDistanceInKm: jest.fn(),
      estimateTrafficDelay: jest.fn(),
      validateAddress: jest.fn(),
    };

    service = new DistanceBasedPricingService(mockRouteCalculator, 0.5);
  });

  describe('calculateDistanceBasedPrice', () => {
    it('should calculate price based on distance and weight', async () => {
      mockRouteCalculator.getDistanceInKm.mockResolvedValue(100);

      const price = await service.calculateDistanceBasedPrice(
        'New York, NY',
        'Boston, MA',
        10
      );

      // Expected: (100km * $0.5/km) + (10kg * $2/kg) = $50 + $20 = $70
      expect(price).toBe(70);
      expect(mockRouteCalculator.getDistanceInKm).toHaveBeenCalledWith(
        'New York, NY',
        'Boston, MA'
      );
    });

    it('should handle long distances correctly', async () => {
      mockRouteCalculator.getDistanceInKm.mockResolvedValue(1000);

      const price = await service.calculateDistanceBasedPrice(
        'New York, NY',
        'Los Angeles, CA',
        5
      );

      // Expected: (1000km * $0.5/km) + (5kg * $2/kg) = $500 + $10 = $510
      expect(price).toBe(510);
    });

    it('should use custom base rate per km if provided', async () => {
      const customService = new DistanceBasedPricingService(mockRouteCalculator, 1.0);
      mockRouteCalculator.getDistanceInKm.mockResolvedValue(100);

      const price = await customService.calculateDistanceBasedPrice(
        'New York, NY',
        'Boston, MA',
        10
      );

      // Expected: (100km * $1.0/km) + (10kg * $2/kg) = $100 + $20 = $120
      expect(price).toBe(120);
    });

    it('should handle zero distance', async () => {
      mockRouteCalculator.getDistanceInKm.mockResolvedValue(0);

      const price = await service.calculateDistanceBasedPrice(
        'New York, NY',
        'New York, NY',
        5
      );

      // Expected: (0km * $0.5/km) + (5kg * $2/kg) = $0 + $10 = $10
      expect(price).toBe(10);
    });

    it('should throw error when route calculator fails', async () => {
      mockRouteCalculator.getDistanceInKm.mockRejectedValue(new Error('API Error'));

      await expect(
        service.calculateDistanceBasedPrice('Invalid', 'Invalid', 10)
      ).rejects.toThrow('Unable to calculate distance-based price');
    });
  });

  describe('enrichQuoteWithRouteInfo', () => {
    it('should enrich quote with route information', async () => {
      const mockQuote = new Quote({
        providerName: 'FedEx',
        price: 100,
        currency: 'USD',
        minDays: 2,
        maxDays: 3,
      });

      const mockRouteInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 300000, // 300 km
        durationSeconds: 10800, // 3 hours
      });

      mockRouteCalculator.calculateRoute.mockResolvedValue(mockRouteInfo);

      const enrichedQuote = await service.enrichQuoteWithRouteInfo(
        mockQuote,
        'New York, NY',
        'Boston, MA'
      );

      expect(enrichedQuote.quote).toEqual(mockQuote);
      expect(enrichedQuote.routeInfo).toEqual(mockRouteInfo);
      expect(enrichedQuote.pricePerKm).toBeCloseTo(0.333, 2);
    });

    it('should calculate correct price per km', async () => {
      const mockQuote = new Quote({
        providerName: 'DHL',
        price: 500,
        currency: 'USD',
        minDays: 3,
        maxDays: 5,
      });

      const mockRouteInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 1000000, // 1,000 km
        durationSeconds: 36000,
      });

      mockRouteCalculator.calculateRoute.mockResolvedValue(mockRouteInfo);

      const enrichedQuote = await service.enrichQuoteWithRouteInfo(
        mockQuote,
        'New York, NY',
        'Chicago, IL'
      );

      expect(enrichedQuote.pricePerKm).toBe(0.5);
    });
  });

  describe('applyDistanceAdjustment', () => {
    it('should apply distance factor to base price for local distance', async () => {
      const mockRouteInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 50000, // 50 km (Local - factor 1.0)
        durationSeconds: 3600,
      });

      mockRouteCalculator.calculateRoute.mockResolvedValue(mockRouteInfo);

      const adjustedPrice = await service.applyDistanceAdjustment(
        100,
        'New York, NY',
        'Newark, NJ'
      );

      // Expected: 100 * 1.0 = 100
      expect(adjustedPrice.price).toBe(100);
      expect(adjustedPrice.factor).toBe(1.0);
      expect(adjustedPrice.category).toBe('Local');
    });

    it('should apply distance factor to base price for regional distance', async () => {
      const mockRouteInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 300000, // 300 km (Regional - factor 1.2)
        durationSeconds: 10800,
      });

      mockRouteCalculator.calculateRoute.mockResolvedValue(mockRouteInfo);

      const adjustedPrice = await service.applyDistanceAdjustment(
        100,
        'New York, NY',
        'Boston, MA'
      );

      // Expected: 100 * 1.2 = 120
      expect(adjustedPrice.price).toBe(120);
      expect(adjustedPrice.factor).toBe(1.2);
      expect(adjustedPrice.category).toBe('Regional');
    });

    it('should apply distance factor to base price for long distance', async () => {
      const mockRouteInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 4500000, // 4,500 km (Long Distance - factor 2.0)
        durationSeconds: 144000,
      });

      mockRouteCalculator.calculateRoute.mockResolvedValue(mockRouteInfo);

      const adjustedPrice = await service.applyDistanceAdjustment(
        250,
        'New York, NY',
        'Los Angeles, CA'
      );

      // Expected: 250 * 2.0 = 500
      expect(adjustedPrice.price).toBe(500);
      expect(adjustedPrice.factor).toBe(2.0);
      expect(adjustedPrice.category).toBe('Larga Distancia');
    });
  });

  describe('getDistanceCategory', () => {
    it('should return correct distance category', async () => {
      mockRouteCalculator.getDistanceInKm.mockResolvedValue(150);

      const category = await service.getDistanceCategory(
        'New York, NY',
        'Philadelphia, PA'
      );

      expect(category).toBe('Regional');
    });
  });
});
