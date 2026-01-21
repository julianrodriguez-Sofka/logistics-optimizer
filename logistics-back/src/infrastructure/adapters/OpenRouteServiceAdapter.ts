import { IRouteCalculator } from '../../domain/interfaces/IRouteCalculator.js';
import { RouteInfo, TransportMode, RouteCoordinate } from '../../domain/entities/RouteInfo.js';
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
  async calculateRoute(origin: string, destination: string, transportMode: TransportMode = 'driving-car'): Promise<RouteInfo> {
    const cacheKey = `${origin}-${destination}-${transportMode}`.toLowerCase();
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('🗺️  Route from cache:', cacheKey);
      return cached.data;
    }

    try {
      // Geocode origin and destination with fallback
      let originCoords, destCoords;
      try {
        originCoords = await this.geocode(origin);
        destCoords = await this.geocode(destination);
      } catch (geocodeError) {
        console.error('❌ Geocoding failed completely:', geocodeError);
        throw new Error('Unable to geocode addresses');
      }

      // Get route directions with specified transport mode
      const response = await axios.post(
        `${this.baseUrl}/v2/directions/${transportMode}/geojson`, // Request GeoJSON format for geometry
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
          timeout: 10000, // 10 second timeout
        }
      );

      const route = response.data.features[0]; // GeoJSON format uses features array
      const summary = route.properties.summary;
      const geometry = route.geometry;

      // Extract route coordinates from geometry
      // OpenRouteService returns coordinates in [lng, lat] format
      let routeCoordinates: RouteCoordinate[] = [];
      
      if (geometry && geometry.coordinates && Array.isArray(geometry.coordinates)) {
        routeCoordinates = geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as RouteCoordinate // Convert [lng, lat] to [lat, lng]
        );
      } else {
        // Fallback: use just origin and destination if geometry is not available
        console.log('⚠️  No geometry coordinates available, using origin and destination only');
        routeCoordinates = [
          [originCoords.lat, originCoords.lng],
          [destCoords.lat, destCoords.lng],
        ];
      }

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
        routeCoordinates: routeCoordinates, // Full route geometry
        transportMode: transportMode,
      });

      // Cache the result
      this.cache.set(cacheKey, { data: routeInfo, timestamp: Date.now() });

      console.log('🗺️  Route calculated:', {
        origin,
        destination,
        transportMode,
        distance: routeInfo.distanceKm,
        duration: routeInfo.durationFormatted,
        routePoints: routeCoordinates.length,
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
   * Implements fallback strategy for Colombian addresses
   * Strategy Pattern: Try multiple search strategies before failing
   */
  private async geocode(address: string): Promise<{ lat: number; lng: number }> {
    console.log(`🔍 Starting geocode for: "${address}"`);
    
    // Strategy 1: Try original address
    try {
      const result = await this.tryGeocode(address);
      // Validate coordinates are in Colombia (lat: -4 to 13, lng: -79 to -67)
      if (this.isInColombia(result)) {
        console.log(`✅ Strategy 1 (original) succeeded`);
        return result;
      } else {
        console.log(`⚠️  Strategy 1 returned coordinates outside Colombia: lat:${result.lat}, lng:${result.lng}`);
      }
    } catch (error) {
      console.log(`⚠️  Strategy 1 failed, trying normalized...`);
    }

    // Strategy 2: Normalize Colombian address (remove street details, keep only city/region)
    try {
      const normalizedAddress = this.normalizeColombianAddress(address);
      console.log(`🔍 Strategy 2 - Normalized: "${normalizedAddress}"`);
      const result = await this.tryGeocode(normalizedAddress);
      if (this.isInColombia(result)) {
        console.log(`✅ Strategy 2 (normalized) succeeded`);
        return result;
      } else {
        console.log(`⚠️  Strategy 2 returned coordinates outside Colombia`);
      }
    } catch (error) {
      console.log(`⚠️  Strategy 2 failed, trying city extraction...`);
    }

    // Strategy 3: Extract only major city name
    try {
      const cityOnly = this.extractCityName(address);
      console.log(`🔍 Strategy 3 - City only: "${cityOnly}"`);
      const result = await this.tryGeocode(cityOnly);
      if (this.isInColombia(result)) {
        console.log(`✅ Strategy 3 (city) succeeded`);
        return result;
      } else {
        console.log(`⚠️  Strategy 3 returned coordinates outside Colombia`);
      }
    } catch (error) {
      console.error('❌ All 3 geocoding strategies failed for:', address);
    }
    
    throw new Error(`Failed to geocode address after all strategies: ${address}`);
  }

  /**
   * Validate that coordinates are within Colombia's geographic bounds
   * Colombia bounds: lat: -4.2 to 13.4, lng: -79.0 to -66.9
   */
  private isInColombia(coords: { lat: number; lng: number }): boolean {
    return coords.lat >= -4.5 && coords.lat <= 13.5 &&
           coords.lng >= -79.5 && coords.lng <= -66.5;
  }

  /**
   * Attempt geocoding with OpenRouteService API
   * Single Responsibility: Only handles the API call
   */
  private async tryGeocode(address: string): Promise<{ lat: number; lng: number }> {
    console.log(`🌐 Calling geocoding API for: "${address}"`);
    
    const response = await axios.get(`${this.baseUrl}/geocode/search`, {
      params: {
        api_key: this.apiKey,
        text: address,
      },
      timeout: 10000,
    });

    if (!response.data.features || response.data.features.length === 0) {
      console.log(`⚠️  No results found for: "${address}"`);
      throw new Error(`No results found for address: ${address}`);
    }

    const coords = response.data.features[0].geometry.coordinates;
    const result = {
      lng: coords[0],
      lat: coords[1],
    };
    console.log(`📍 Geocoded "${address}" → lat:${result.lat}, lng:${result.lng}`);
    return result;
  }

  /**
   * Normalize Colombian addresses by removing street details
   * Keeps only city and region information
   */
  private normalizeColombianAddress(address: string): string {
    // First, extract city name if present
    const cities = ['bogota', 'bogotá', 'medellin', 'medellín', 'cali', 'barranquilla', 
                    'cartagena', 'cucuta', 'cúcuta', 'bucaramanga', 'pereira', 'santa marta',
                    'ibague', 'ibagué', 'pasto', 'manizales', 'neiva', 'villavicencio'];
    
    const lowerAddress = address.toLowerCase();
    for (const city of cities) {
      if (lowerAddress.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1) + ', Colombia';
      }
    }

    // If no known city, remove street patterns
    // NOSONAR: ReDoS fixed - using bounded quantifiers and atomic patterns
    // Security: Limited repetitions prevent catastrophic backtracking
    let normalized = address
      .replace(/Calle\s{0,3}\d{1,4}[a-z]?(?:\s{0,2}#\s{0,2}\d{1,4}(?:-\d{1,4})?)?/gi, '') // Max 3 spaces, 4 digits
      .replace(/Carrera\s{0,3}\d{1,4}[a-z]?(?:\s{0,2}#\s{0,2}\d{1,4}(?:-\d{1,4})?)?/gi, '')
      .replace(/Avenida\s{0,3}\d{1,4}[a-z]?(?:\s{0,2}#\s{0,2}\d{1,4}(?:-\d{1,4})?)?/gi, '')
      .replace(/Transversal\s{0,3}\d{1,4}[a-z]?(?:\s{0,2}#\s{0,2}\d{1,4}(?:-\d{1,4})?)?/gi, '')
      .replace(/Diagonal\s{0,3}\d{1,4}[a-z]?(?:\s{0,2}#\s{0,2}\d{1,4}(?:-\d{1,4})?)?/gi, '')
      .replace(/#\d{1,4}-\d{1,4}/g, '') // Bounded: max 4 digits
      .replace(/Valle del Cauca/gi, '') // Remove department name
      .replace(/Antioquia/gi, '')
      .replace(/Cundinamarca/gi, '')
      .trim();
    
    // Clean up multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Add Colombia if not present
    if (!normalized.toLowerCase().includes('colombia')) {
      normalized += ', Colombia';
    }
    
    return normalized;
  }

  /**
   * Extract city name from address
   * Returns the first significant word (likely city name)
   */
  private extractCityName(address: string): string {
    // Common Colombian cities
    const cities = ['bogota', 'bogotá', 'medellin', 'medellín', 'cali', 'barranquilla', 
                    'cartagena', 'cucuta', 'cúcuta', 'bucaramanga', 'pereira', 'santa marta',
                    'ibague', 'ibagué', 'pasto', 'manizales', 'neiva', 'villavicencio'];
    
    const lowerAddress = address.toLowerCase();
    for (const city of cities) {
      if (lowerAddress.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1) + ', Colombia';
      }
    }
    
    // Fallback: take first word that's not a street type
    const words = address.split(/[,\s]+/);
    for (const word of words) {
      if (word.length > 3 && !['calle', 'carrera', 'avenida', 'valle', 'del'].includes(word.toLowerCase())) {
        return word + ', Colombia';
      }
    }
    
    return 'Bogota, Colombia'; // Ultimate fallback
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
