/**
 * TDD - RED PHASE: Tests First
 * Unit tests for RouteInfo entity
 */
import { RouteInfo } from '../../../domain/entities/RouteInfo.js';
import { Location } from '../../../domain/entities/Location.js';

describe('RouteInfo Entity', () => {
  const mockOrigin: Location = {
    address: 'New York, NY',
    lat: 40.7128,
    lng: -74.006,
    city: 'New York',
    state: 'NY',
    country: 'USA',
  };

  const mockDestination: Location = {
    address: 'Los Angeles, CA',
    lat: 34.0522,
    lng: -118.2437,
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
  };

  describe('Constructor and Basic Properties', () => {
    it('should create a RouteInfo instance with all properties', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 4500000, // 4,500 km
        durationSeconds: 144000, // 40 hours
        trafficCondition: 'moderate',
      });

      expect(routeInfo.origin).toEqual(mockOrigin);
      expect(routeInfo.destination).toEqual(mockDestination);
      expect(routeInfo.distanceMeters).toBe(4500000);
      expect(routeInfo.distanceKm).toBe(4500);
      expect(routeInfo.durationSeconds).toBe(144000);
      expect(routeInfo.trafficCondition).toBe('moderate');
      expect(routeInfo.calculatedAt).toBeInstanceOf(Date);
    });

    it('should default traffic condition to unknown if not provided', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 100000,
        durationSeconds: 3600,
      });

      expect(routeInfo.trafficCondition).toBe('unknown');
    });

    it('should correctly convert meters to kilometers', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 50000, // 50 km
        durationSeconds: 3600,
      });

      expect(routeInfo.distanceKm).toBe(50);
    });
  });

  describe('formatDuration', () => {
    it('should format duration less than 1 hour in minutes', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 10000,
        durationSeconds: 1800, // 30 minutes
      });

      expect(routeInfo.durationFormatted).toBe('30 min');
    });

    it('should format duration in hours and minutes', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 100000,
        durationSeconds: 7260, // 2h 1min
      });

      expect(routeInfo.durationFormatted).toBe('2h 1min');
    });

    it('should format duration with only hours (no remaining minutes)', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 200000,
        durationSeconds: 7200, // 2h 0min
      });

      expect(routeInfo.durationFormatted).toBe('2h 0min');
    });
  });

  describe('getDistanceFactor', () => {
    it('should return 1.0 for local distances (< 100km)', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 50000, // 50 km
        durationSeconds: 3600,
      });

      expect(routeInfo.getDistanceFactor()).toBe(1.0);
    });

    it('should return 1.2 for regional distances (100-500km)', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 300000, // 300 km
        durationSeconds: 10800,
      });

      expect(routeInfo.getDistanceFactor()).toBe(1.2);
    });

    it('should return 1.5 for national distances (500-1000km)', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 750000, // 750 km
        durationSeconds: 27000,
      });

      expect(routeInfo.getDistanceFactor()).toBe(1.5);
    });

    it('should return 2.0 for long distances (> 1000km)', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 4500000, // 4,500 km
        durationSeconds: 144000,
      });

      expect(routeInfo.getDistanceFactor()).toBe(2.0);
    });

    it('should return 1.0 for exactly 99.9 km (edge case)', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 99900,
        durationSeconds: 3600,
      });

      expect(routeInfo.getDistanceFactor()).toBe(1.0);
    });

    it('should return 1.2 for exactly 100 km (boundary)', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 100000,
        durationSeconds: 3600,
      });

      expect(routeInfo.getDistanceFactor()).toBe(1.2);
    });
  });

  describe('getDistanceCategory', () => {
    it('should return "Local" for distances < 100km', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 50000,
        durationSeconds: 3600,
      });

      expect(routeInfo.getDistanceCategory()).toBe('Local');
    });

    it('should return "Regional" for distances 100-500km', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 300000,
        durationSeconds: 10800,
      });

      expect(routeInfo.getDistanceCategory()).toBe('Regional');
    });

    it('should return "Nacional" for distances 500-1000km', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 750000,
        durationSeconds: 27000,
      });

      expect(routeInfo.getDistanceCategory()).toBe('Nacional');
    });

    it('should return "Larga Distancia" for distances > 1000km', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 4500000,
        durationSeconds: 144000,
      });

      expect(routeInfo.getDistanceCategory()).toBe('Larga Distancia');
    });
  });

  describe('getCacheKey', () => {
    it('should generate a unique cache key based on origin and destination', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 100000,
        durationSeconds: 3600,
      });

      expect(routeInfo.getCacheKey()).toBe('route:New York, NY:Los Angeles, CA');
    });

    it('should generate different keys for different routes', () => {
      const route1 = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 100000,
        durationSeconds: 3600,
      });

      const route2 = new RouteInfo({
        origin: mockDestination,
        destination: mockOrigin,
        distanceMeters: 100000,
        durationSeconds: 3600,
      });

      expect(route1.getCacheKey()).not.toBe(route2.getCacheKey());
    });
  });

  describe('isCacheable', () => {
    it('should return true for all routes by default', () => {
      const routeInfo = new RouteInfo({
        origin: mockOrigin,
        destination: mockDestination,
        distanceMeters: 100000,
        durationSeconds: 3600,
      });

      expect(routeInfo.isCacheable()).toBe(true);
    });
  });
});
