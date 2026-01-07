import { Quote } from '../entities/Quote';

export interface IShippingProvider {
  /**
   * Calculate shipping cost and delivery time
   * @param weight - Weight in kilograms
   * @param destination - Destination address
   * @returns Promise resolving to Quote object
   */
  calculateShipping(weight: number, destination: string): Promise<Quote>;
  
}
