import { IRouteCalculator } from '../../domain/interfaces/IRouteCalculator.js';
import { RouteInfo } from '../../domain/entities/RouteInfo.js';
import { Location, LocationFactory } from '../../domain/entities/Location.js';
import axios from 'axios';

/**
 * OpenRouteService Adapter for route calculation
 * Free alternative to Google Maps - No credit card required
 * Limit: 2000 requests/day
 */
export class OpenRouteServiceAdapter implements IRouteCalculator {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openrouteservice.org';
  private readonly cache = new Map<string, { data: RouteInfo; timestamp: number }>();
  private readonly cacheTTL: number;

  constructor(apiKey: string, cacheTTL: number = 3600000) {
    this.apiKey = apiKey;
    this.cacheTTL = cacheTTL;
  }

  /**
   * Calculate route between two locations
   */
  async calculateRoute(origin: string, destination: string): Promise<RouteInfo> {
    const cacheKey = `${origin}-${destination}`.toLowerCase();
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('🗺️  Route from cache:', cacheKey);
      return cached.data;
    }

    try {
      // Geocode origin and destination
      const originCoords = await this.geocode(origin);
      const destCoords = await this.geocode(destination);

      // Get route directions
      const response = await axios.post(
        `${this.baseUrl}/v2/directions/driving-car`,
        {
          coordinates: [
            [originCoords.lng, originCoords.lat],
            [destCoords.lng, destCoords.lat],
          ],
        },
        {
          headers: {
            Authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const route = response.data.routes[0];
      const summary = route.summary;

      // Create Location objects
      const originLocation = LocationFactory.createWithCoordinates(
        origin,
        originCoords.lat,
        originCoords.lng
      );
      const destLocation = LocationFactory.createWithCoordinates(
        destination,
        destCoords.lat,
        destCoords.lng
      );

      // Create RouteInfo
      const routeInfo = new RouteInfo({
        origin: originLocation,
        destination: destLocation,
        distanceMeters: summary.distance, // ORS returns meters
        durationSeconds: summary.duration, // ORS returns seconds
        trafficCondition: 'unknown',
      });

      // Cache the result
      this.cache.set(cacheKey, { data: routeInfo, timestamp: Date.now() });

      console.log('🗺️  Route calculated:', {
        origin,
        destination,
        distance: routeInfo.distanceKm,
        duration: routeInfo.durationFormatted,
      });

      return routeInfo;
    } catch (error: any) {
      console.error('❌ OpenRouteService error:', error.response?.data || error.message);
      throw new Error(
        `Failed to calculate route: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Geocode an address to coordinates
   */
  private async geocode(address: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/search`, {
        params: {
          api_key: this.apiKey,
          text: address,
        },
      });

      if (!response.data.features || response.data.features.length === 0) {
        throw new Error(`No results found for address: ${address}`);
      }

      const coords = response.data.features[0].geometry.coordinates;
      return {
        lng: coords[0],
        lat: coords[1],
      };
    } catch (error: any) {
      console.error('❌ Geocoding error:', error.response?.data || error.message);
      throw new Error(`Failed to geocode address: ${address}`);
    }
  }

  /**
   * Get only the distance in kilometers between two locations
   */
  async getDistanceInKm(origin: string, destination: string): Promise<number> {
    const routeInfo = await this.calculateRoute(origin, destination);
    return routeInfo.distanceKm;
  }

  /**
   * Estimate traffic delay (OpenRouteService free tier doesn't support real-time traffic)
   * Returns 0 as a placeholder
   */
  async estimateTrafficDelay(
    origin: string,
    destination: string,
    departureTime: Date
  ): Promise<number> {
    // OpenRouteService free tier doesn't provide traffic data
    // This would require a premium subscription or different service
    console.log('⚠️  Traffic delay estimation not available in free tier');
    return 0;
  }

  /**
   * Validate if an address can be geocoded
   */
  async validateAddress(address: string): Promise<boolean> {
    try {
      await this.geocode(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
