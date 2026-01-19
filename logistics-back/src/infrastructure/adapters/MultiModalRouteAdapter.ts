import axios from 'axios';
import { IRouteCalculator } from '../../domain/interfaces/IRouteCalculator.js';
import { RouteInfo, RouteCoordinate, RouteSegment } from '../../domain/entities/RouteInfo.js';
import { Location } from '../../domain/entities/Location.js';

/**
 * MultiModalRouteAdapter
 * Calculates combined air + ground routes for long-distance deliveries
 * Air segment: Direct geodesic line (great circle)
 * Ground segment: Road route using OpenRouteService
 */
export class MultiModalRouteAdapter implements IRouteCalculator {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.openrouteservice.org';
  private readonly cache: Map<string, { data: RouteInfo; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

  // Major airports database (simplified)
  private readonly airports = [
    { city: 'Bogotá', lat: 4.701594, lng: -74.146947, name: 'El Dorado' },
    { city: 'Medellín', lat: 6.164516, lng: -75.423119, name: 'José María Córdova' },
    { city: 'Cali', lat: 3.543222, lng: -76.381583, name: 'Alfonso Bonilla Aragón' },
    { city: 'Cartagena', lat: 10.442381, lng: -75.512961, name: 'Rafael Núñez' },
    { city: 'Barranquilla', lat: 10.889628, lng: -74.780653, name: 'Ernesto Cortissoz' },
  ];

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenRouteService API Key is required for MultiModalRouteAdapter');
    }
    this.apiKey = apiKey;
  }

  /**
   * Calculate multi-modal route: air + ground delivery
   * 1. Air segment: origin → nearest airport to destination
   * 2. Ground segment: airport → final destination
   */
  async calculateRoute(
    origin: Location,
    destination: Location,
    transportMode: string = 'air-ground'
  ): Promise<RouteInfo> {
    const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}-${transportMode}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Find nearest airport to destination
      const destinationAirport = this.findNearestAirport(destination);
      
      // 1. Air segment: origin → destination airport (geodesic)
      const airSegment = this.calculateAirSegment(origin, destinationAirport);
      
      // 2. Ground segment: airport → final destination (OpenRouteService)
      const groundSegment = await this.calculateGroundSegment(destinationAirport, destination);
      
      // Combine segments
      const totalDistanceMeters = (airSegment.distanceKm + groundSegment.distanceKm) * 1000;
      const totalDurationSeconds = (airSegment.durationMinutes + groundSegment.durationMinutes) * 60;
      
      // Combine coordinates for full route display
      const allCoordinates = [...airSegment.coordinates, ...groundSegment.coordinates];
      
      const routeInfo = new RouteInfo({
        origin,
        destination,
        distanceMeters: totalDistanceMeters,
        durationSeconds: totalDurationSeconds,
        trafficCondition: 'light',
        routeCoordinates: allCoordinates,
        transportMode: 'air-ground',
        segments: [airSegment, groundSegment]
      });

      this.saveToCache(cacheKey, routeInfo);
      return routeInfo;
    } catch (error: any) {
      console.error('Error calculating multi-modal route:', error.message);
      // Fallback: simple geodesic calculation
      return this.getFallbackRoute(origin, destination);
    }
  }

  /**
   * Calculate air segment using geodesic (great circle) distance
   * Speed: 800 km/h average commercial flight
   */
  private calculateAirSegment(origin: Location, airport: Location): RouteSegment {
    const distanceKm = this.calculateGeodesicDistance(origin.lat, origin.lng, airport.lat, airport.lng);
    const flightSpeedKmh = 800; // Commercial jet average
    const durationMinutes = (distanceKm / flightSpeedKmh) * 60 + 60; // +60 for airport procedures
    
    return {
      mode: 'air',
      transportLabel: 'Avión',
      coordinates: [[origin.lat, origin.lng], [airport.lat, airport.lng]], // Straight line
      distanceKm,
      durationMinutes: Math.round(durationMinutes),
      color: '#2196F3' // Blue for air
    };
  }

  /**
   * Calculate ground segment using OpenRouteService API
   */
  private async calculateGroundSegment(airport: Location, destination: Location): Promise<RouteSegment> {
    const url = `${this.baseUrl}/v2/directions/driving-hgv/geojson`;
    
    const response = await axios.post(
      url,
      {
        coordinates: [[airport.lng, airport.lat], [destination.lng, destination.lat]]
      },
      {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const feature = response.data.features?.[0];
    if (!feature) {
      throw new Error('No route found from airport to destination');
    }

    const distanceMeters = feature.properties.segments[0].distance;
    const durationSeconds = feature.properties.segments[0].duration;
    
    // Convert coordinates from [lng, lat] to [lat, lng]
    const coordinates: RouteCoordinate[] = feature.geometry.coordinates.map(
      (coord: number[]) => [coord[1], coord[0]] as RouteCoordinate
    );

    return {
      mode: 'ground',
      transportLabel: 'Camión',
      coordinates,
      distanceKm: distanceMeters / 1000,
      durationMinutes: Math.round(durationSeconds / 60),
      color: '#FF9800' // Orange for truck
    };
  }

  /**
   * Find nearest airport to a location
   */
  private findNearestAirport(location: Location): Location {
    let nearest = this.airports[0];
    let minDistance = this.calculateGeodesicDistance(
      location.lat, location.lng, nearest.lat, nearest.lng
    );

    for (const airport of this.airports) {
      const distance = this.calculateGeodesicDistance(
        location.lat, location.lng, airport.lat, airport.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = airport;
      }
    }

    // Return Location object (interface)
    return {
      lat: nearest.lat,
      lng: nearest.lng,
      address: `Aeropuerto ${nearest.name}, ${nearest.city}`
    };
  }

  /**
   * Calculate geodesic distance using Haversine formula
   * Returns distance in kilometers
   */
  private calculateGeodesicDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Fallback route when API fails
   */
  private getFallbackRoute(origin: Location, destination: Location): RouteInfo {
    const distanceKm = this.calculateGeodesicDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const estimatedDurationHours = distanceKm / 100; // Assume 100 km/h average
    
    return new RouteInfo({
      origin,
      destination,
      distanceMeters: distanceKm * 1000,
      durationSeconds: estimatedDurationHours * 3600,
      trafficCondition: 'unknown',
      routeCoordinates: [[origin.lat, origin.lng], [destination.lat, destination.lng]],
      transportMode: 'air-ground'
    });
  }

  // Cache management
  private getFromCache(key: string): RouteInfo | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private saveToCache(key: string, data: RouteInfo): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
