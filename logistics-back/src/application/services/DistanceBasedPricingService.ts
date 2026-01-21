import { IRouteCalculator } from '../../domain/interfaces/IRouteCalculator.js';
import { Quote } from '../../domain/entities/Quote.js';
import { RouteInfo } from '../../domain/entities/RouteInfo.js';

/**
 * QuoteWithRoute - Extended Quote with Route Information
 */
export interface QuoteWithRoute {
  quote: Quote;
  routeInfo: RouteInfo;
  pricePerKm: number;
}

/**
 * DistanceAdjustment - Result of distance-based price adjustment
 */
export interface DistanceAdjustment {
  price: number;
  factor: number;
  category: string;
  distanceKm: number;
}

/**
 * DistanceBasedPricingService
 * Service for calculating shipping prices based on actual route distances
 * 
 * Follows SRP: Single responsibility of distance-based price calculations
 * Follows DIP: Depends on IRouteCalculator abstraction, not concrete implementation
 */
export class DistanceBasedPricingService {
  private readonly WEIGHT_COST_PER_KG = 2; // $2 per kg

  constructor(
    private readonly routeCalculator: IRouteCalculator,
    private readonly baseRatePerKm: number = 0.5 // Default $0.5 per km
  ) {}

  /**
   * Calculate shipping price based on distance and weight
   * Formula: (distance * ratePerKm) + (weight * weightCost)
   * 
   * @param origin - Starting address
   * @param destination - Ending address
   * @param weight - Package weight in kg
   * @returns Total calculated price
   * @throws Error if route cannot be calculated
   */
  async calculateDistanceBasedPrice(
    origin: string,
    destination: string,
    weight: number
  ): Promise<number> {
    try {
      const distanceKm = await this.routeCalculator.getDistanceInKm(origin, destination);

      const distanceCost = distanceKm * this.baseRatePerKm;
      const weightCost = weight * this.WEIGHT_COST_PER_KG;

      return distanceCost + weightCost;
    } catch (error) {
      throw new Error(
        `Unable to calculate distance-based price: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Enrich a quote with route information
   * Adds distance, duration, and price per km to the quote
   * 
   * @param quote - Original quote
   * @param origin - Starting address
   * @param destination - Ending address
   * @returns Quote with route information
   */
  async enrichQuoteWithRouteInfo(
    quote: Quote,
    origin: string,
    destination: string
  ): Promise<QuoteWithRoute> {
    const routeInfo = await this.routeCalculator.calculateRoute(origin, destination);

    const pricePerKm = quote.price / routeInfo.distanceKm;

    return {
      quote,
      routeInfo,
      pricePerKm,
    };
  }

  /**
   * Apply distance-based adjustment to a base price
   * Uses distance factors:
   * - Local (< 100km): 1.0x
   * - Regional (100-500km): 1.2x
   * - Nacional (500-1000km): 1.5x
   * - Larga Distancia (> 1000km): 2.0x
   * 
   * @param basePrice - Original price before distance adjustment
   * @param origin - Starting address
   * @param destination - Ending address
   * @returns Adjusted price with factor and category
   */
  async applyDistanceAdjustment(
    basePrice: number,
    origin: string,
    destination: string
  ): Promise<DistanceAdjustment> {
    const routeInfo = await this.routeCalculator.calculateRoute(origin, destination);

    const factor = routeInfo.getDistanceFactor();
    const adjustedPrice = basePrice * factor;

    return {
      price: adjustedPrice,
      factor,
      category: routeInfo.getDistanceCategory(),
      distanceKm: routeInfo.distanceKm,
    };
  }

  /**
   * Get distance category for a route
   * 
   * @param origin - Starting address
   * @param destination - Ending address
   * @returns Distance category (Local, Regional, Nacional, Larga Distancia)
   */
  async getDistanceCategory(origin: string, destination: string): Promise<string> {
    const distanceKm = await this.routeCalculator.getDistanceInKm(origin, destination);

    if (distanceKm < 100) return 'Local';
    if (distanceKm < 500) return 'Regional';
    if (distanceKm < 1000) return 'Nacional';
    return 'Larga Distancia';
  }
}
