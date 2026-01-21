import { FedExAdapter } from '../FedExAdapter';
import { Quote } from '../../../domain/entities/Quote';

describe('FedExAdapter - Dynamic Pricing (TDD RED Phase)', () => {
  let adapter: FedExAdapter;

  beforeEach(() => {
    adapter = new FedExAdapter();
  });

  // Current FedEx pricing configuration:
  // BASE_PRICE = 25000 COP
  // MIN_DELIVERY_DAYS = 2
  // MAX_DELIVERY_DAYS = 4
  // Weight tiers (from WeightPricingCalculator.getFedExTiers()):
  //   - 0-5kg: 15000 COP/kg
  //   - 5-20kg: 12000 COP/kg
  //   - 20-50kg: 10000 COP/kg
  //   - 50+kg: 8500 COP/kg
  // Zone multipliers (from ZoneConfig for FedEx):
  //   - Zone 1: 1.0
  //   - Zone 2: 1.15
  //   - Zone 3: 1.25
  //   - Zone 4: 1.35
  //   - Zone 5: 1.6

  describe('Zone-Based Pricing', () => {
    test('should calculate price for Bogotá (Zone 1) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      // Weight cost: 4.5kg @ 15000 COP/kg (tier 1: 0-5kg) = 67,500 COP
      // Zone multiplier: Zone 1 = 1.0
      // Total: 25000 + (67500 × 1.0) = 92,500 COP
      expect(quote.price).toBe(92500);
      expect(quote.providerName).toBe('FedEx Ground');
      expect(quote.currency).toBe('COP');
    });

    test('should calculate price for Medellín (Zone 2) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Medellín');
      
      // Weight cost: 4.5kg @ 15000 COP/kg = 67,500 COP
      // Zone multiplier: Zone 2 = 1.15
      // Total: 25000 + (67500 × 1.15) = 102,625 COP
      expect(quote.price).toBe(102625);
    });

    test('should calculate price for Cali (Zone 3) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Cali');
      
      // Weight cost: 4.5kg @ 15000 COP/kg = 67,500 COP
      // Zone multiplier: Zone 3 = 1.25
      // Total: 25000 + (67500 × 1.25) = 109,375 COP
      expect(quote.price).toBe(109375);
    });

    test('should calculate price for Barranquilla (Zone 4) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Barranquilla');
      
      // Weight cost: 4.5kg @ 15000 COP/kg = 67,500 COP
      // Zone multiplier: Zone 4 = 1.35
      // Total: 25000 + (67500 × 1.35) = 116,125 COP
      expect(quote.price).toBe(116125);
    });

    test('should calculate price for Leticia (Zone 5) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Leticia');
      
      // Weight cost: 4.5kg @ 15000 COP/kg = 67,500 COP
      // Zone multiplier: Zone 5 = 1.6
      // Total: 25000 + (67500 × 1.6) = 133,000 COP
      expect(quote.price).toBe(133000);
    });
  });

  describe('Weight Tier Pricing', () => {
    test('should use tier 1 rate (15000 COP/kg) for 3kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(3, 'Bogotá');
      
      // Weight cost: 3kg @ 15000 COP/kg = 45,000 COP
      // Total: 25000 + (45000 × 1.0) = 70,000 COP
      expect(quote.price).toBe(70000);
    });

    test('should use tier 2 rate (12000 COP/kg) for 10kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(10, 'Bogotá');
      
      // Weight cost: 10kg @ 12000 COP/kg = 120,000 COP
      // Total: 25000 + (120000 × 1.0) = 145,000 COP
      expect(quote.price).toBe(145000);
    });

    test('should use tier 3 rate (10000 COP/kg) for 25kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(25, 'Bogotá');
      
      // Weight cost: 25kg @ 10000 COP/kg = 250,000 COP
      // Total: 25000 + (250000 × 1.0) = 275,000 COP
      expect(quote.price).toBe(275000);
    });

    test('should use tier 4 rate (8500 COP/kg) for 60kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(60, 'Bogotá');
      
      // Weight cost: 60kg @ 8500 COP/kg = 510,000 COP
      // Total: 25000 + (510000 × 1.0) = 535,000 COP
      expect(quote.price).toBe(535000);
    });

    test('should use tier 2 rate for exactly 5kg (boundary)', async () => {
      const quote = await adapter.calculateShipping(5, 'Bogotá');
      
      // Weight cost: 5kg @ 12000 COP/kg (tier 2 starts at 5kg) = 60,000 COP
      // Total: 25000 + (60000 × 1.0) = 85,000 COP
      expect(quote.price).toBe(85000);
    });
  });

  describe('Combined Zone + Weight Pricing', () => {
    test('should calculate correct price for Medellín (Zone 2) - 10kg', async () => {
      const quote = await adapter.calculateShipping(10, 'Medellín');
      
      // Weight cost: 10kg @ 12000 COP/kg (tier 2) = 120,000 COP
      // Zone multiplier: 1.15
      // Total: 25000 + (120000 × 1.15) = 163,000 COP
      expect(quote.price).toBe(163000);
    });

    test('should calculate correct price for Leticia (Zone 5) - 25kg', async () => {
      const quote = await adapter.calculateShipping(25, 'Leticia');
      
      // Weight cost: 25kg @ 10000 COP/kg (tier 3) = 250,000 COP
      // Zone multiplier: 1.6
      // Total: 25000 + (250000 × 1.6) = 425,000 COP
      expect(quote.price).toBe(425000);
    });

    test('should calculate correct price for Cartagena (Zone 4) - 60kg', async () => {
      const quote = await adapter.calculateShipping(60, 'Cartagena');
      
      // Weight cost: 60kg @ 8500 COP/kg (tier 4) = 510,000 COP
      // Zone multiplier: 1.35
      // Total: 25000 + (510000 × 1.35) = 713,500 COP
      expect(quote.price).toBe(713500);
    });
  });

  describe('Quote Metadata', () => {
    test('should return correct provider metadata', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      expect(quote.providerId).toBe('fedex-ground');
      expect(quote.providerName).toBe('FedEx Ground');
      expect(quote.currency).toBe('COP');
      expect(quote.transportMode).toBe('Truck');
      expect(quote.minDays).toBe(2);
      expect(quote.maxDays).toBe(4);
    });

    test('should initialize badges as false', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      expect(quote.isCheapest).toBe(false);
      expect(quote.isFastest).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle unknown city (defaults to Zone 1)', async () => {
      const quote = await adapter.calculateShipping(4.5, 'CiudadDesconocida');
      
      // Should use Zone 1 multiplier (1.0)
      // Total: 25000 + (67500 × 1.0) = 92,500 COP
      expect(quote.price).toBe(92500);
    });

    test('should handle case-insensitive city names', async () => {
      const quote1 = await adapter.calculateShipping(4.5, 'MEDELLÍN');
      const quote2 = await adapter.calculateShipping(4.5, 'medellín');
      const quote3 = await adapter.calculateShipping(4.5, 'Medellín');
      
      expect(quote1.price).toBe(quote2.price);
      expect(quote2.price).toBe(quote3.price);
      expect(quote1.price).toBe(102625);
    });

    test('should handle city names without accents', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Medellin'); // Sin tilde
      
      // Should still recognize as Medellín (Zone 2)
      expect(quote.price).toBe(102625);
    });

    test('should validate weight and destination', async () => {
      await expect(adapter.calculateShipping(0, 'Bogotá')).rejects.toThrow();
      await expect(adapter.calculateShipping(-5, 'Bogotá')).rejects.toThrow();
      await expect(adapter.calculateShipping(5, '')).rejects.toThrow();
    });
  });
});
