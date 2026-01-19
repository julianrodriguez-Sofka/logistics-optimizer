import { RouteInfo } from '../entities/RouteInfo.js';

/**
 * IRouteCalculator Interface
 * Port for calculating routes and distances between locations
 * This abstraction allows us to swap implementations (Google Maps, OpenStreetMap, etc.)
 * following the Dependency Inversion Principle (DIP)
 */
export interface IRouteCalculator {
  /**
   * Calculate complete route information between two locations
   * @param origin - Starting address
   * @param destination - Ending address
   * @returns RouteInfo with distance, duration, and coordinates
   * @throws Error if route cannot be calculated
   */
  calculateRoute(origin: string, destination: string): Promise<RouteInfo>;

  /**
   * Get only the distance in kilometers between two locations
   * Optimized method when only distance is needed
   * @param origin - Starting address
   * @param destination - Ending address
   * @returns Distance in kilometers
   * @throws Error if distance cannot be calculated
   */
  getDistanceInKm(origin: string, destination: string): Promise<number>;

  /**
   * Estimate traffic delay for a given route at a specific time
   * @param origin - Starting address
   * @param destination - Ending address
   * @param departureTime - When the shipment will depart
   * @returns Additional delay in seconds due to traffic
   */
  estimateTrafficDelay(
    origin: string,
    destination: string,
    departureTime: Date
  ): Promise<number>;

  /**
   * Validate if an address can be geocoded
   * @param address - Address to validate
   * @returns true if address is valid and can be geocoded
   */
  validateAddress(address: string): Promise<boolean>;
}
