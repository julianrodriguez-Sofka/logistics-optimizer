import { BaseShippingAdapter } from './BaseShippingAdapter';
import { Quote } from '../../domain/entities/Quote';
import { ZoneConfig } from '../../domain/entities/ZoneConfig';
import { WeightPricingCalculator } from '../../application/services/WeightPricingCalculator';

export class DHLAdapter extends BaseShippingAdapter {
  private readonly BASE_PRICE = 8000; // Base price in COP
  private readonly MIN_DELIVERY_DAYS = 5;
  private readonly MAX_DELIVERY_DAYS = 5;
  private readonly CARRIER_NAME = 'DHL';

  async calculateShipping(weight: number, destination: string): Promise<Quote> {
  
    this.validateShippingRequest(weight, destination);

    const zone = ZoneConfig.getZoneByDestination(destination);

    const weightCost = WeightPricingCalculator.calculateCost(
      weight,
      WeightPricingCalculator.getDHLTiers()
    );

    const zoneMultiplier = ZoneConfig.getMultiplier(this.CARRIER_NAME, zone);

    const price = this.BASE_PRICE + (weightCost * zoneMultiplier);

    // Create and return Quote
    return new Quote({
      providerId: 'dhl-express',
      providerName: 'DHL Express',
      price: price,
      currency: 'COP', // Changed from USD to COP
      minDays: this.MIN_DELIVERY_DAYS,
      maxDays: this.MAX_DELIVERY_DAYS,
      transportMode: 'Air',
      isCheapest: false,
      isFastest: false,
    });
  }


}
