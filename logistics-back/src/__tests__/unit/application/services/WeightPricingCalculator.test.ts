import { WeightPricingTier, WeightPricingCalculator } from '../../../../application/services/WeightPricingCalculator';

describe('WeightPricingCalculator - RED Phase (Tests First)', () => {
  describe('Boundary Tests', () => {
    test('should return tier 1 rate for 4.99 kg', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: 20, ratePerKg: 8 },
        { minWeight: 20, maxWeight: 50, ratePerKg: 6 },
        { minWeight: 50, maxWeight: Infinity, ratePerKg: 5 },
      ];
      
      const rate = WeightPricingCalculator.getRateForWeight(4.99, tiers);
      expect(rate).toBe(10);
    });

    test('should return tier 2 rate for exactly 5.00 kg', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: 20, ratePerKg: 8 },
        { minWeight: 20, maxWeight: 50, ratePerKg: 6 },
        { minWeight: 50, maxWeight: Infinity, ratePerKg: 5 },
      ];
      
      const rate = WeightPricingCalculator.getRateForWeight(5.00, tiers);
      expect(rate).toBe(8);
    });

    test('should return tier 2 rate for 5.01 kg', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: 20, ratePerKg: 8 },
        { minWeight: 20, maxWeight: 50, ratePerKg: 6 },
        { minWeight: 50, maxWeight: Infinity, ratePerKg: 5 },
      ];
      
      const rate = WeightPricingCalculator.getRateForWeight(5.01, tiers);
      expect(rate).toBe(8);
    });

    test('should return tier 3 rate for exactly 20.00 kg', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: 20, ratePerKg: 8 },
        { minWeight: 20, maxWeight: 50, ratePerKg: 6 },
        { minWeight: 50, maxWeight: Infinity, ratePerKg: 5 },
      ];
      
      const rate = WeightPricingCalculator.getRateForWeight(20.00, tiers);
      expect(rate).toBe(6);
    });

    test('should return tier 4 rate for exactly 50.00 kg', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: 20, ratePerKg: 8 },
        { minWeight: 20, maxWeight: 50, ratePerKg: 6 },
        { minWeight: 50, maxWeight: Infinity, ratePerKg: 5 },
      ];
      
      const rate = WeightPricingCalculator.getRateForWeight(50.00, tiers);
      expect(rate).toBe(5);
    });

    test('should return tier 4 rate for 100 kg (heavy weight)', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: 20, ratePerKg: 8 },
        { minWeight: 20, maxWeight: 50, ratePerKg: 6 },
        { minWeight: 50, maxWeight: Infinity, ratePerKg: 5 },
      ];
      
      const rate = WeightPricingCalculator.getRateForWeight(100, tiers);
      expect(rate).toBe(5);
    });
  });

  describe('Calculate Total Cost', () => {
    test('should calculate correct cost for 3 kg at tier 1', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: 20, ratePerKg: 8 },
      ];
      
      const cost = WeightPricingCalculator.calculateCost(3, tiers);
      expect(cost).toBe(30); // 3 kg * 10 COP/kg
    });

    test('should calculate correct cost for 10 kg at tier 2', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: 20, ratePerKg: 8 },
      ];
      
      const cost = WeightPricingCalculator.calculateCost(10, tiers);
      expect(cost).toBe(80); // 10 kg * 8 COP/kg
    });

    test('should calculate correct cost for 25 kg at tier 3', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: 20, ratePerKg: 8 },
        { minWeight: 20, maxWeight: 50, ratePerKg: 6 },
      ];
      
      const cost = WeightPricingCalculator.calculateCost(25, tiers);
      expect(cost).toBe(150); // 25 kg * 6 COP/kg
    });
  });

  // Current actual pricing from WeightPricingCalculator:
  // FedEx: 15000, 12000, 10000, 8500 COP/kg
  // DHL: 13000, 10500, 9000, 7800 COP/kg
  // Local: 9000, 7500, 6500, 5800 COP/kg

  describe('FedEx Weight Tiers (Colombia)', () => {
    test('should have 4 weight tiers for FedEx', () => {
      const tiers = WeightPricingCalculator.getFedExTiers();
      expect(tiers).toHaveLength(4);
    });

    test('FedEx tier 1: 0-5kg should have rate 15000 COP/kg', () => {
      const tiers = WeightPricingCalculator.getFedExTiers();
      const tier1 = tiers.find(t => t.minWeight === 0 && t.maxWeight === 5);
      expect(tier1?.ratePerKg).toBe(15000);
    });

    test('FedEx tier 2: 5-20kg should have rate 12000 COP/kg', () => {
      const tiers = WeightPricingCalculator.getFedExTiers();
      const tier2 = tiers.find(t => t.minWeight === 5 && t.maxWeight === 20);
      expect(tier2?.ratePerKg).toBe(12000);
    });

    test('FedEx tier 3: 20-50kg should have rate 10000 COP/kg', () => {
      const tiers = WeightPricingCalculator.getFedExTiers();
      const tier3 = tiers.find(t => t.minWeight === 20 && t.maxWeight === 50);
      expect(tier3?.ratePerKg).toBe(10000);
    });

    test('FedEx tier 4: 50kg+ should have rate 8500 COP/kg', () => {
      const tiers = WeightPricingCalculator.getFedExTiers();
      const tier4 = tiers.find(t => t.minWeight === 50);
      expect(tier4?.ratePerKg).toBe(8500);
    });
  });

  describe('DHL Weight Tiers (Colombia)', () => {
    test('should have 4 weight tiers for DHL', () => {
      const tiers = WeightPricingCalculator.getDHLTiers();
      expect(tiers).toHaveLength(4);
    });

    test('DHL tier 1: 0-5kg should have rate 13000 COP/kg', () => {
      const tiers = WeightPricingCalculator.getDHLTiers();
      const tier1 = tiers.find(t => t.minWeight === 0 && t.maxWeight === 5);
      expect(tier1?.ratePerKg).toBe(13000);
    });

    test('DHL tier 2: 5-20kg should have rate 10500 COP/kg', () => {
      const tiers = WeightPricingCalculator.getDHLTiers();
      const tier2 = tiers.find(t => t.minWeight === 5 && t.maxWeight === 20);
      expect(tier2?.ratePerKg).toBe(10500);
    });
  });

  describe('Local Weight Tiers (Colombia)', () => {
    test('should have 4 weight tiers for Local', () => {
      const tiers = WeightPricingCalculator.getLocalTiers();
      expect(tiers).toHaveLength(4);
    });

    test('Local tier 1: 0-5kg should have rate 9000 COP/kg', () => {
      const tiers = WeightPricingCalculator.getLocalTiers();
      const tier1 = tiers.find(t => t.minWeight === 0 && t.maxWeight === 5);
      expect(tier1?.ratePerKg).toBe(9000);
    });

    test('Local should have cheapest rates overall', () => {
      const fedexTiers = WeightPricingCalculator.getFedExTiers();
      const dhlTiers = WeightPricingCalculator.getDHLTiers();
      const localTiers = WeightPricingCalculator.getLocalTiers();
      
      // Compare tier 1 rates (0-5kg)
      expect(localTiers[0].ratePerKg).toBeLessThan(fedexTiers[0].ratePerKg);
      expect(localTiers[0].ratePerKg).toBeLessThan(dhlTiers[0].ratePerKg);
    });
  });

  describe('Edge Cases', () => {
    test('should handle minimum weight (0.1 kg)', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
      ];
      
      const rate = WeightPricingCalculator.getRateForWeight(0.1, tiers);
      expect(rate).toBe(10);
    });

    test('should handle maximum weight (1000 kg)', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
        { minWeight: 5, maxWeight: Infinity, ratePerKg: 5 },
      ];
      
      const rate = WeightPricingCalculator.getRateForWeight(1000, tiers);
      expect(rate).toBe(5);
    });

    test('should throw error for negative weight', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
      ];
      
      expect(() => WeightPricingCalculator.getRateForWeight(-1, tiers)).toThrow();
    });

    test('should throw error for zero weight', () => {
      const tiers: WeightPricingTier[] = [
        { minWeight: 0, maxWeight: 5, ratePerKg: 10 },
      ];
      
      expect(() => WeightPricingCalculator.getRateForWeight(0, tiers)).toThrow();
    });
  });
});
