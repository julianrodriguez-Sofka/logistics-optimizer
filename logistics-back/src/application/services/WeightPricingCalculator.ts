/**
 * Weight-Based Pricing Calculator
 * Implements tiered pricing based on weight brackets
 */

export interface WeightPricingTier {
  minWeight: number;
  maxWeight: number;
  ratePerKg: number; // Rate in COP (Colombian Pesos) per kg
}

export class WeightPricingCalculator {
  /**
   * Get the rate per kg for a given weight based on tiers
   */
  static getRateForWeight(weight: number, tiers: WeightPricingTier[]): number {
    if (weight <= 0) {
      throw new Error('Weight must be greater than 0');
    }

    for (const tier of tiers) {
      if (weight >= tier.minWeight && weight < tier.maxWeight) {
        return tier.ratePerKg;
      }
      // Handle the case where weight exactly equals maxWeight of one tier and minWeight of next
      if (weight === tier.minWeight) {
        return tier.ratePerKg;
      }
    }

    // If no tier found, return the last tier's rate (for weights above all tiers)
    return tiers[tiers.length - 1].ratePerKg;
  }

  /**
   * Calculate total cost for a given weight
   */
  static calculateCost(weight: number, tiers: WeightPricingTier[]): number {
    const rate = this.getRateForWeight(weight, tiers);
    return weight * rate;
  }

  /**
   * FedEx weight tiers for Colombia (COP) - Truck transportation
   */
  static getFedExTiers(): WeightPricingTier[] {
    return [
      { minWeight: 0, maxWeight: 5, ratePerKg: 15000 },      // Small packages
      { minWeight: 5, maxWeight: 20, ratePerKg: 12000 },     // Medium packages
      { minWeight: 20, maxWeight: 50, ratePerKg: 10000 },    // Large packages
      { minWeight: 50, maxWeight: Infinity, ratePerKg: 8500 }, // Heavy freight
    ];
  }

  /**
   * DHL weight tiers for Colombia (COP) - Truck transportation
   */
  static getDHLTiers(): WeightPricingTier[] {
    return [
      { minWeight: 0, maxWeight: 5, ratePerKg: 13000 },
      { minWeight: 5, maxWeight: 20, ratePerKg: 10500 },
      { minWeight: 20, maxWeight: 50, ratePerKg: 9000 },
      { minWeight: 50, maxWeight: Infinity, ratePerKg: 7800 },
    ];
  }

  /**
   * Local carrier weight tiers for Colombia (COP) - Most economical truck transport
   */
  static getLocalTiers(): WeightPricingTier[] {
    return [
      { minWeight: 0, maxWeight: 5, ratePerKg: 9000 },
      { minWeight: 5, maxWeight: 20, ratePerKg: 7500 },
      { minWeight: 20, maxWeight: 50, ratePerKg: 6500 },
      { minWeight: 50, maxWeight: Infinity, ratePerKg: 5800 },
    ];
  }
}
