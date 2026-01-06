import { Quote } from '../entities/Quote';

export interface IShippingProvider {
  /**
   * Calculate shipping cost and delivery time
   * @param weight - Weight in kilograms
   * @param destination - Destination address
   * @returns Promise resolving to Quote object
   */
  calculateShipping(weight: number, destination: string): Promise<Quote>;

  /**
   * Track a shipment by tracking ID
   * @param trackingId - Tracking identifier
   * @returns Promise resolving to tracking information
   */
  trackShipment(trackingId: string): Promise<any>;

  /**
   * Validate if an address is serviceable
   * @param address - Address to validate
   * @returns Promise resolving to true if valid, false otherwise
   */
  validateAddress(address: string): Promise<boolean>;
}
