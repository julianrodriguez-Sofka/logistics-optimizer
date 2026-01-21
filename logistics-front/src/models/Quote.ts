/**
 * Route Segment for multi-modal routes
 */
export interface IRouteSegment {
  mode: 'air' | 'ground';
  transportLabel: string; // "Avión" or "Camión"
  coordinates: Array<[number, number]>;
  distanceKm: number;
  durationMinutes: number;
  color: string;
}

/**
 * Route Information interface
 */
export interface IRouteInfo {
  distanceKm: number;
  distanceMeters: number;
  durationSeconds: number;
  durationFormatted: string;
  category: string;
  transportMode?: string; // Transport mode (driving-car, driving-hgv, etc.)
  routeCoordinates?: Array<[number, number]>; // Full route path coordinates [lat, lng]
  segments?: IRouteSegment[]; // For multi-modal routes (air + ground)
  origin: {
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
}

/**
 * Quote interface matching backend API contract
 */
export interface IQuote {
  providerId: string;
  providerName: string;
  price: number;
  currency: string;
  minDays: number;
  maxDays: number;
  estimatedDays: number;
  transportMode: string;
  isCheapest: boolean;
  isFastest: boolean;
  routeInfo?: IRouteInfo; // Optional route information
  pricePerKm?: number; // Optional price per kilometer
}

/**
 * Provider message for offline/failed providers
 */
export interface IProviderMessage {
  provider: string;
  message: string;
  error?: string;
}

/**
 * API response from POST /api/quotes
 */
export interface IQuoteResponse {
  quotes: IQuote[];
  messages?: IProviderMessage[];
  routeInfo?: IRouteInfo; // Optional shared route information
}
