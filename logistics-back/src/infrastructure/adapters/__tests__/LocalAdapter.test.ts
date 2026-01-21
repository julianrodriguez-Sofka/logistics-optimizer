import { LocalAdapter } from '../LocalAdapter';
import { Quote } from '../../../domain/entities/Quote';

describe('LocalAdapter - Dynamic Pricing (TDD RED Phase)', () => {
  let adapter: LocalAdapter;

  beforeEach(() => {
    adapter = new LocalAdapter();
  });

  // Current Local pricing configuration:
  // BASE_PRICE = 15000 COP
  // MIN_DELIVERY_DAYS = 4
  // MAX_DELIVERY_DAYS = 7
  // Weight tiers (from WeightPricingCalculator.getLocalTiers()):
  //   - 0-5kg: 9000 COP/kg
  //   - 5-20kg: 7500 COP/kg
  //   - 20-50kg: 6500 COP/kg
  //   - 50+kg: 5800 COP/kg
  // Zone multipliers (from ZoneConfig for Local):
  //   - Zone 1: 1.8
  //   - Zone 2: 1.4
  //   - Zone 3: 1.12
  //   - Zone 4: 1.5
  //   - Zone 5: 1.6

  describe('Zone-Based Pricing - Dynamic Multipliers', () => {
    test('should calculate price for Bogotá (Zone 1) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      // Weight cost: 4.5kg @ 9000 COP/kg (tier 1) = 40,500 COP
      // Zone multiplier for Local in Zone 1: 1.8
      // Total: 15000 + (40500 × 1.8) = 15000 + 72,900 = 87,900 COP
      expect(quote.price).toBe(87900);
      expect(quote.providerName).toBe('Local Courier');
      expect(quote.currency).toBe('COP');
    });

    test('should calculate different prices for different zones - 4.5kg', async () => {
      // Weight cost: 4.5kg @ 9000 COP/kg = 40,500 COP
      // Zone 1 (Bogotá): multiplier 1.8 -> 15000 + (40500 * 1.8) = 87,900
      // Zone 2 (Medellín): multiplier 1.4 -> 15000 + (40500 * 1.4) = 71,700
      // Zone 3 (Cali): multiplier 1.12 -> 15000 + (40500 * 1.12) = 60,360
      // Zone 4 (Barranquilla): multiplier 1.5 -> 15000 + (40500 * 1.5) = 75,750
      // Zone 5 (Leticia): multiplier 1.6 -> 15000 + (40500 * 1.6) = 79,800
      
      const bogota = await adapter.calculateShipping(4.5, 'Bogotá');
      const medellin = await adapter.calculateShipping(4.5, 'Medellín');
      const cali = await adapter.calculateShipping(4.5, 'Cali');
      const barranquilla = await adapter.calculateShipping(4.5, 'Barranquilla');
      const leticia = await adapter.calculateShipping(4.5, 'Leticia');
      
      expect(bogota.price).toBeCloseTo(87900, 0);
      expect(medellin.price).toBeCloseTo(71700, 0);
      expect(cali.price).toBeCloseTo(60360, 0);
      expect(barranquilla.price).toBeCloseTo(75750, 0);
      expect(leticia.price).toBeCloseTo(79800, 0);
    });
  });

  describe('Weight Tier Pricing', () => {
    test('should use tier 1 rate (9000 COP/kg) for 3kg', async () => {
      const quote = await adapter.calculateShipping(3, 'Bogotá');
      
      // Weight cost: 3kg @ 9000 COP/kg = 27,000 COP
      // Zone multiplier for Local in Zone 1: 1.8
      // Total: 15000 + (27000 × 1.8) = 15000 + 48,600 = 63,600 COP
      expect(quote.price).toBe(63600);
    });

    test('should use tier 2 rate (7500 COP/kg) for 10kg', async () => {
      const quote = await adapter.calculateShipping(10, 'Bogotá');
      
      // Weight cost: 10kg @ 7500 COP/kg = 75,000 COP
      // Zone multiplier for Local in Zone 1: 1.8
      // Total: 15000 + (75000 × 1.8) = 15000 + 135,000 = 150,000 COP
      expect(quote.price).toBe(150000);
    });

    test('should use tier 3 rate (6500 COP/kg) for 25kg', async () => {
      const quote = await adapter.calculateShipping(25, 'Bogotá');
      
      // Weight cost: 25kg @ 6500 COP/kg = 162,500 COP
      // Zone multiplier for Local in Zone 1: 1.8
      // Total: 15000 + (162500 × 1.8) = 15000 + 292,500 = 307,500 COP
      expect(quote.price).toBe(307500);
    });

    test('should use tier 4 rate (5800 COP/kg) for 60kg', async () => {
      const quote = await adapter.calculateShipping(60, 'Bogotá');
      
      // Weight cost: 60kg @ 5800 COP/kg = 348,000 COP
      // Zone multiplier for Local in Zone 1: 1.8
      // Total: 15000 + (348000 × 1.8) = 15000 + 626,400 = 641,400 COP
      expect(quote.price).toBe(641400);
    });
  });

  describe('Cheapest Rates Verification', () => {
    test('should have specific price for 10kg in Bogotá', async () => {
      const quote = await adapter.calculateShipping(10, 'Bogotá');
      
      // Local (Zone 1, 1.8x): 15000 + (10 * 7500 * 1.8) = 150,000 COP
      // FedEx (Zone 1, 1.0x): 25000 + (10 * 12000 * 1.0) = 145,000 COP
      // DHL (Zone 1, 1.0x): 20000 + (10 * 10500 * 1.0) = 125,000 COP
      // Note: Local is NOT the cheapest in Zone 1 due to 1.8x multiplier
      expect(quote.price).toBe(150000);
    });
  });

  describe('Quote Metadata', () => {
    test('should return correct provider metadata', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      expect(quote.providerId).toBe('local-courier');
      expect(quote.providerName).toBe('Local Courier');
      expect(quote.currency).toBe('COP');
      expect(quote.transportMode).toBe('Truck');
      expect(quote.minDays).toBe(4);
      expect(quote.maxDays).toBe(7);
    });
  });
});
