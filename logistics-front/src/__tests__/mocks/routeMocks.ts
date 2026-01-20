/**
 * Mock data for route-related tests
 */
import type { IQuote, IRouteInfo } from '../../models/Quote';

export const mockRouteInfo: IRouteInfo = {
  origin: {
    lat: 4.7110,
    lng: -74.0721,
    address: 'Bogotá, Colombia',
  },
  destination: {
    lat: 6.2442,
    lng: -75.5812,
    address: 'Medellín, Colombia',
  },
  distanceKm: 300,
  distanceMeters: 300000, // 300 km
  durationSeconds: 10800, // 3 hours
  durationFormatted: '3h 0min',
  category: 'Regional',
  transportMode: 'driving-car',
  routeCoordinates: [[4.7110, -74.0721], [6.2442, -75.5812]],
};

export const mockQuoteWithRoute: IQuote = {
  providerId: 'fedex-ground',
  providerName: 'FedEx Ground',
  price: 85500,
  currency: 'COP',
  minDays: 2,
  maxDays: 4,
  estimatedDays: 3,
  transportMode: 'Truck',
  isCheapest: true,
  isFastest: false,
  routeInfo: mockRouteInfo,
  pricePerKm: 285,
};

export const mockQuoteWithoutRoute: IQuote = {
  providerId: 'dhl-express',
  providerName: 'DHL Express',
  price: 95000,
  currency: 'COP',
  minDays: 1,
  maxDays: 3,
  estimatedDays: 2,
  transportMode: 'Air',
  isCheapest: false,
  isFastest: true,
};

export const mockMultipleQuotes: IQuote[] = [
  mockQuoteWithRoute,
  mockQuoteWithoutRoute,
  {
    providerId: 'local-courier',
    providerName: 'Local Courier',
    price: 75000,
    currency: 'COP',
    minDays: 4,
    maxDays: 7,
    estimatedDays: 5,
    transportMode: 'Truck',
    isCheapest: true,
    isFastest: false,
  },
];
