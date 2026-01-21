import { Location } from './Location.js';

/**
 * Traffic Condition Enum
 */
export type TrafficCondition = 'light' | 'moderate' | 'heavy' | 'unknown';

/**
 * Transport Mode Enum
 */
export type TransportMode = 'driving-car' | 'driving-hgv' | 'foot-walking' | 'cycling-regular' | 'air-ground';

/**
 * Route Segment - Represents one leg of a multi-modal journey
 */
export interface RouteSegment {
  mode: 'air' | 'ground';
  transportLabel: string; // "Avión" or "Camión"
  coordinates: RouteCoordinate[];
  distanceKm: number;
  durationMinutes: number;
  color: string; // Color for map display
}

/**
 * Route Coordinates - [lat, lng]
 */
export type RouteCoordinate = [number, number];

/**
 * RouteInfo Entity
 * Represents the calculated route between two locations with distance and duration
 */
export class RouteInfo {
  public readonly origin: Location;
  public readonly destination: Location;
  public readonly distanceMeters: number;
  public readonly distanceKm: number;
  public readonly durationSeconds: number;
  public readonly durationFormatted: string;
  public readonly trafficCondition: TrafficCondition;
  public readonly calculatedAt: Date;
  public readonly routeCoordinates: RouteCoordinate[]; // Full route geometry
  public readonly transportMode: TransportMode;
  public readonly segments?: RouteSegment[]; // For multi-modal routes

  constructor(data: {
    origin: Location;
    destination: Location;
    distanceMeters: number;
    durationSeconds: number;
    trafficCondition?: TrafficCondition;
    routeCoordinates?: RouteCoordinate[];
    transportMode?: TransportMode;
    segments?: RouteSegment[];
  }) {
    this.origin = data.origin;
    this.destination = data.destination;
    this.distanceMeters = data.distanceMeters;
    this.distanceKm = this.distanceMeters / 1000;
    this.durationSeconds = data.durationSeconds;
    this.durationFormatted = this.formatDuration(data.durationSeconds);
    this.trafficCondition = data.trafficCondition || 'unknown';
    this.calculatedAt = new Date();
    this.routeCoordinates = data.routeCoordinates || [[data.origin.lat, data.origin.lng], [data.destination.lat, data.destination.lng]];
    this.transportMode = data.transportMode || 'driving-car';
    this.segments = data.segments;
  }

  /**
   * Format duration in seconds to human-readable string
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
      return `${minutes} min`;
    }
    return `${hours}h ${minutes}min`;
  }

  /**
   * Get distance factor for pricing calculation
   * Based on distance ranges:
   * - < 100km: 1.0 (local)
   * - 100-500km: 1.2 (regional)
   * - 500-1000km: 1.5 (national)
   * - > 1000km: 2.0 (long distance)
   */
  getDistanceFactor(): number {
    if (this.distanceKm < 100) return 1.0;
    if (this.distanceKm < 500) return 1.2;
    if (this.distanceKm < 1000) return 1.5;
    return 2.0;
  }

  /**
   * Get distance category as string
   */
  getDistanceCategory(): string {
    if (this.distanceKm < 100) return 'Local';
    if (this.distanceKm < 500) return 'Regional';
    if (this.distanceKm < 1000) return 'Nacional';
    return 'Larga Distancia';
  }

  /**
   * Check if route is cacheable (for cost optimization)
   * Routes are cacheable if they're commonly requested
   */
  isCacheable(): boolean {
    return true; // All routes are cacheable by default
  }

  /**
   * Get cache key for this route
   */
  getCacheKey(): string {
    return `route:${this.origin.address}:${this.destination.address}`;
  }
}
