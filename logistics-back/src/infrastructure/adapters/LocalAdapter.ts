import { BaseShippingAdapter } from './BaseShippingAdapter';
import { Quote } from '../../domain/entities/Quote';
import { ZoneConfig } from '../../domain/entities/ZoneConfig';
import { WeightPricingCalculator } from '../../application/services/WeightPricingCalculator';

export class LocalAdapter extends BaseShippingAdapter {
  private readonly BASE_PRICE = 5000; // Base price in COP
  private readonly MIN_DELIVERY_DAYS = 7;
  private readonly MAX_DELIVERY_DAYS = 7;
  private readonly CARRIER_NAME = 'Local';

  async calculateShipping(weight: number, destination: string): Promise<Quote> {
    // Use base class validation (DRY principle)
    this.validateShippingRequest(weight, destination);

    // Step 1: Get zone for destination
    const zone = ZoneConfig.getZoneByDestination(destination);

    // Step 2: Calculate weight-based cost using tiered pricing
    const weightCost = WeightPricingCalculator.calculateCost(
      weight,
      WeightPricingCalculator.getLocalTiers()
    );

    // Step 3: Apply zone multiplier
    const zoneMultiplier = ZoneConfig.getMultiplier(this.CARRIER_NAME, zone);

    // Step 4: Calculate final price
    // Formula: basePrice + (weightCost × zoneMultiplier)
    // Note: Local has flat multiplier (1.0) for all zones
    const price = this.BASE_PRICE + (weightCost * zoneMultiplier);

    // Create and return Quote
    return new Quote({
      providerId: 'local-courier',
      providerName: 'Local Courier',
      price: price,
      currency: 'COP', // Changed from USD to COP
      minDays: this.MIN_DELIVERY_DAYS,
      maxDays: this.MAX_DELIVERY_DAYS,
      transportMode: 'Truck',
      isCheapest: false,
      isFastest: false,
    });
  }

}
