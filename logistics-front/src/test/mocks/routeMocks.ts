/**
 * Test utilities for OpenRouteService Integration
 */
import type { IRouteInfo, IQuote } from '../models/Quote';

/**
 * Mock route info for testing
 */
export const mockRouteInfo: IRouteInfo = {
  distanceKm: 300,
  distanceMeters: 300000,
  durationSeconds: 10800,
  durationFormatted: '3h 0min',
  category: 'Regional',
  origin: {
    address: 'Bogotá, Colombia',
    lat: 4.7110,
    lng: -74.0721,
  },
  destination: {
    address: 'Medellín, Colombia',
    lat: 6.2442,
    lng: -75.5812,
  },
};

/**
 * Mock quote with route information
 */
export const mockQuoteWithRoute: IQuote = {
  providerId: 'fedex-ground',
  providerName: 'FedEx Ground',
  price: 75000,
  currency: 'COP',
  minDays: 3,
  maxDays: 4,
  estimatedDays: 3,
  transportMode: 'Truck',
  isCheapest: false,
  isFastest: true,
  routeInfo: mockRouteInfo,
  pricePerKm: 250,
};

/**
 * Create a mock quote with custom route info
 */
export const createMockQuoteWithRoute = (
  overrides?: Partial<IQuote>,
  routeOverrides?: Partial<IRouteInfo>
): IQuote => {
  return {
    ...mockQuoteWithRoute,
    ...overrides,
    routeInfo: routeOverrides
      ? { ...mockRouteInfo, ...routeOverrides }
      : mockQuoteWithRoute.routeInfo,
  };
};
