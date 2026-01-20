import { DHLAdapter } from '../DHLAdapter';
import { Quote } from '../../../domain/entities/Quote';

describe('DHLAdapter - Dynamic Pricing (TDD RED Phase)', () => {
  let adapter: DHLAdapter;

  beforeEach(() => {
    adapter = new DHLAdapter();
  });

  // Current DHL pricing configuration:
  // BASE_PRICE = 20000 COP
  // MIN_DELIVERY_DAYS = 3
  // MAX_DELIVERY_DAYS = 5
  // Weight tiers (from WeightPricingCalculator.getDHLTiers()):
  //   - 0-5kg: 13000 COP/kg
  //   - 5-20kg: 10500 COP/kg
  //   - 20-50kg: 9000 COP/kg
  //   - 50+kg: 7800 COP/kg
  // Zone multipliers (from ZoneConfig for DHL):
  //   - Zone 1: 1.0
  //   - Zone 2: 1.1
  //   - Zone 3: 1.2
  //   - Zone 4: 1.3
  //   - Zone 5: 1.5

  describe('Zone-Based Pricing', () => {
    test('should calculate price for Bogotá (Zone 1) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      // Weight cost: 4.5kg @ 13000 COP/kg (tier 0-5kg) = 58,500 COP
      // Zone multiplier: Zone 1 = 1.0
      // Total: 20000 + (58500 × 1.0) = 78,500 COP
      expect(quote.price).toBe(78500);
      expect(quote.providerName).toBe('DHL Express');
      expect(quote.currency).toBe('COP');
    });

    test('should calculate price for Medellín (Zone 2) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Medellín');
      
      // Weight cost: 4.5kg @ 13000 COP/kg = 58,500 COP
      // Zone multiplier: Zone 2 = 1.1
      // Total: 20000 + (58500 × 1.1) = 84,350 COP
      expect(quote.price).toBe(84350);
    });

    test('should calculate price for Cali (Zone 3) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Cali');
      
      // Weight cost: 4.5kg @ 13000 COP/kg = 58,500 COP
      // Zone multiplier: Zone 3 = 1.2
      // Total: 20000 + (58500 × 1.2) = 90,200 COP
      expect(quote.price).toBe(90200);
    });

    test('should calculate price for Barranquilla (Zone 4) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Barranquilla');
      
      // Weight cost: 4.5kg @ 13000 COP/kg = 58,500 COP
      // Zone multiplier: Zone 4 = 1.3
      // Total: 20000 + (58500 × 1.3) = 96,050 COP
      expect(quote.price).toBe(96050);
    });

    test('should calculate price for Leticia (Zone 5) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Leticia');
      
      // Weight cost: 4.5kg @ 13000 COP/kg = 58,500 COP
      // Zone multiplier: Zone 5 = 1.5
      // Total: 20000 + (58500 × 1.5) = 107,750 COP
      expect(quote.price).toBe(107750);
    });
  });

  describe('Weight Tier Pricing', () => {
    test('should use tier 1 rate (13000 COP/kg) for 3kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(3, 'Bogotá');
      
      // Weight cost: 3kg @ 13000 COP/kg = 39,000 COP
      // Total: 20000 + (39000 × 1.0) = 59,000 COP
      expect(quote.price).toBe(59000);
    });

    test('should use tier 2 rate (10500 COP/kg) for 10kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(10, 'Bogotá');
      
      // Weight cost: 10kg @ 10500 COP/kg = 105,000 COP
      // Total: 20000 + (105000 × 1.0) = 125,000 COP
      expect(quote.price).toBe(125000);
    });

    test('should use tier 3 rate (9000 COP/kg) for 25kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(25, 'Bogotá');
      
      // Weight cost: 25kg @ 9000 COP/kg = 225,000 COP
      // Total: 20000 + (225000 × 1.0) = 245,000 COP
      expect(quote.price).toBe(245000);
    });

    test('should use tier 4 rate (7800 COP/kg) for 60kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(60, 'Bogotá');
      
      // Weight cost: 60kg @ 7800 COP/kg = 468,000 COP
      // Total: 20000 + (468000 × 1.0) = 488,000 COP
      expect(quote.price).toBe(488000);
    });
  });

  describe('Combined Zone + Weight Pricing', () => {
    test('should calculate correct price for Medellín (Zone 2) - 10kg', async () => {
      const quote = await adapter.calculateShipping(10, 'Medellín');
      
      // Weight cost: 10kg @ 10500 COP/kg (tier 2) = 105,000 COP
      // Zone multiplier: 1.1
      // Total: 20000 + (105000 × 1.1) = 135,500 COP
      expect(quote.price).toBe(135500);
    });

    test('should calculate correct price for Leticia (Zone 5) - 25kg', async () => {
      const quote = await adapter.calculateShipping(25, 'Leticia');
      
      // Weight cost: 25kg @ 9000 COP/kg (tier 3) = 225,000 COP
      // Zone multiplier: 1.5
      // Total: 20000 + (225000 × 1.5) = 357,500 COP
      expect(quote.price).toBe(357500);
    });
  });

  describe('Quote Metadata', () => {
    test('should return correct provider metadata', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      expect(quote.providerId).toBe('dhl-express');
      expect(quote.providerName).toBe('DHL Express');
      expect(quote.currency).toBe('COP');
      expect(quote.transportMode).toBe('Air');
      expect(quote.minDays).toBe(3);
      expect(quote.maxDays).toBe(5);
    });
  });
});
