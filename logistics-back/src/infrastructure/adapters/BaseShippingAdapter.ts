//HUMAN REVIEW
/**
 * Esta clase abstracta implementa el Patron Template Method para compartir logica de validacion y
 * ademas define el contrato que todos los adaptadores deben de seguir (FedEx, DHL, Local), ademas de esto
 * valida el peso y destino antes de calcular el envio.
 */



import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';
import { Quote } from '../../domain/entities/Quote';
import { IRouteCalculator } from '../../domain/interfaces/IRouteCalculator.js';


export abstract class BaseShippingAdapter implements IShippingProvider {
  protected readonly MIN_WEIGHT = 0.1;
  protected readonly MAX_WEIGHT = 1000;

  /**
   * Optional route calculator for distance-based pricing
   * If provided, adapters can use real distance calculations
   */
  constructor(protected readonly routeCalculator?: IRouteCalculator) {}

  protected validateShippingRequest(weight: number, destination: string): void {

    if (weight < this.MIN_WEIGHT) {
      throw new Error(`Weight must be greater than ${this.MIN_WEIGHT} kg`);
    }

    if (weight > this.MAX_WEIGHT) {
      throw new Error(`Weight must be less than or equal to ${this.MAX_WEIGHT} kg`);
    }

    if (!destination || destination.trim() === '') {
      throw new Error('Destination is required');
    }
  }

  /**
   * Get distance factor based on actual route distance
   * If routeCalculator is not available, returns default factor of 1.0
   * 
   * Distance factors:
   * - Local (< 100km): 1.0x
   * - Regional (100-500km): 1.2x
   * - Nacional (500-1000km): 1.5x
   * - Larga Distancia (> 1000km): 2.0x
   */
  protected async getDistanceFactor(origin: string, destination: string): Promise<number> {
    if (!this.routeCalculator) {
      return 1.0; // Default factor if no route calculator
    }

    try {
      // Use 'driving-car' profile to avoid OpenRouteService distance limits
      const routeInfo = await this.routeCalculator.calculateRoute(origin, destination, 'driving-car');
      return routeInfo.getDistanceFactor();
    } catch (error) {
      // If route calculation fails, use default factor
      console.warn(`Failed to calculate distance factor: ${error}`);
      return 1.0;
    }
  }

  abstract calculateShipping(weight: number, destination: string): Promise<Quote>;

}
