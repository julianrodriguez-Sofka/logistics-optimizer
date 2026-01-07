import { BaseShippingAdapter } from './BaseShippingAdapter';
import { Quote } from '../../domain/entities/Quote';
import { ZoneConfig } from '../../domain/entities/ZoneConfig';
import { WeightPricingCalculator } from '../../application/services/WeightPricingCalculator';

export class FedExAdapter extends BaseShippingAdapter {
  private readonly BASE_PRICE = 10000; // Base price in COP
  private readonly MIN_DELIVERY_DAYS = 3;
  private readonly MAX_DELIVERY_DAYS = 4;
  private readonly CARRIER_NAME = 'FedEx';

  async calculateShipping(weight: number, destination: string): Promise<Quote> {
    // Use base class validation (DRY principle)
    this.validateShippingRequest(weight, destination);

    // Step 1: Get zone for destination
    const zone = ZoneConfig.getZoneByDestination(destination);

    // Step 2: Calculate weight-based cost using tiered pricing
    const weightCost = WeightPricingCalculator.calculateCost(
      weight,
      WeightPricingCalculator.getFedExTiers()
    );

    // Step 3: Apply zone multiplier
    const zoneMultiplier = ZoneConfig.getMultiplier(this.CARRIER_NAME, zone);

    // Step 4: Calculate final price
    // Formula: basePrice + (weightCost × zoneMultiplier)
    const price = this.BASE_PRICE + (weightCost * zoneMultiplier);

    // Create and return Quote
    return new Quote({
      providerId: 'fedex-ground',
      providerName: 'FedEx Ground',
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
