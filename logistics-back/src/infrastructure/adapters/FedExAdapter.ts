import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';
import { Quote } from '../../domain/entities/Quote';

export class FedExAdapter implements IShippingProvider {
  private readonly BASE_PRICE = 50;
  private readonly PRICE_PER_KG = 3.5;
  private readonly MIN_DELIVERY_DAYS = 3;
  private readonly MAX_DELIVERY_DAYS = 4;

  async calculateShipping(weight: number, destination: string): Promise<Quote> {
    // Validate weight
    if (weight < 0.1) {
      throw new Error('Weight must be greater than 0.1 kg');
    }

    if (weight > 1000) {
      throw new Error('Weight must be less than or equal to 1000 kg');
    }

    // Validate destination
    if (!destination || destination.trim() === '') {
      throw new Error('Destination is required');
    }

    // Calculate price using formula: basePrice + weight * pricePerKg
    const price = this.BASE_PRICE + (weight * this.PRICE_PER_KG);

    // Create and return Quote
    return new Quote({
      providerId: 'fedex-ground',
      providerName: 'FedEx Ground',
      price: price,
      currency: 'USD',
      minDays: this.MIN_DELIVERY_DAYS,
      maxDays: this.MAX_DELIVERY_DAYS,
      transportMode: 'Truck',
      isCheapest: false,
      isFastest: false,
    });
  }

  async trackShipment(trackingId: string): Promise<any> {
    // TODO: Implement tracking functionality
    throw new Error('Method not implemented.');
  }

  async validateAddress(address: string): Promise<boolean> {
    // TODO: Implement address validation
    throw new Error('Method not implemented.');
  }
}
