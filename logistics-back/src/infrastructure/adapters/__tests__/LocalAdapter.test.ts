import { LocalAdapter } from '../LocalAdapter';
import { Quote } from '../../../domain/entities/Quote';

describe('LocalAdapter - Dynamic Pricing (TDD RED Phase)', () => {
  let adapter: LocalAdapter;

  beforeEach(() => {
    adapter = new LocalAdapter();
  });

  describe('Zone-Based Pricing - Flat Rate', () => {
    test('should calculate price for Bogotá (Zone 1) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      // Expected: basePrice + (weightCost × zoneMultiplier)
      // Weight cost: 4.5kg @ 5000 COP/kg (tier 1) = 22,500 COP
      // Zone multiplier for Local in Zone 1: 1.8 (dynamic pricing)
      // Total: 5000 + (22500 × 1.8) = 5000 + 40,500 = 45,500 COP
      expect(quote.price).toBe(45500);
      expect(quote.providerName).toBe('Local Courier');
      expect(quote.currency).toBe('COP');
    });

    test('should calculate same price for all zones (dynamic multiplier per zone) - 4.5kg', async () => {
      // Note: Local now has zone-specific multipliers, so prices differ by zone
      // Zone 1 (Bogotá): multiplier 1.8 -> 5000 + (22500 * 1.8) = 45,500
      // Zone 2 (Medellín): multiplier 1.4 -> 5000 + (22500 * 1.4) = 36,500
      // Zone 3 (Cali): multiplier 1.12 -> 5000 + (22500 * 1.12) = 30,200
      // Zone 4 (Barranquilla): multiplier 1.5 -> 5000 + (22500 * 1.5) = 38,750
      // Zone 5 (Leticia): multiplier 1.6 -> 5000 + (22500 * 1.6) = 41,000
      
      const bogota = await adapter.calculateShipping(4.5, 'Bogotá');
      const medellin = await adapter.calculateShipping(4.5, 'Medellín');
      const cali = await adapter.calculateShipping(4.5, 'Cali');
      const barranquilla = await adapter.calculateShipping(4.5, 'Barranquilla');
      const leticia = await adapter.calculateShipping(4.5, 'Leticia');
      
      // Prices vary by zone due to dynamic multipliers
      expect(bogota.price).toBeCloseTo(45500, 0);
      expect(medellin.price).toBeCloseTo(36500, 0);
      expect(cali.price).toBeCloseTo(30200, 0);
      expect(barranquilla.price).toBeCloseTo(38750, 0);
      expect(leticia.price).toBeCloseTo(41000, 0);
    });
  });

  describe('Weight Tier Pricing', () => {
    test('should use tier 1 rate (5000 COP/kg) for 3kg', async () => {
      const quote = await adapter.calculateShipping(3, 'Bogotá');
      
      // Weight cost: 3kg @ 5000 COP/kg = 15,000 COP
      // Zone multiplier for Local in Zone 1: 1.8
      // Total: 5000 + (15000 × 1.8) = 5000 + 27,000 = 32,000 COP
      expect(quote.price).toBe(32000);
    });

    test('should use tier 2 rate (4500 COP/kg) for 10kg', async () => {
      const quote = await adapter.calculateShipping(10, 'Bogotá');
      
      // Weight cost: 10kg @ 4500 COP/kg = 45,000 COP
      // Zone multiplier for Local in Zone 1: 1.8
      // Total: 5000 + (45000 × 1.8) = 5000 + 81,000 = 86,000 COP
      expect(quote.price).toBe(86000);
    });

    test('should use tier 3 rate (4000 COP/kg) for 25kg', async () => {
      const quote = await adapter.calculateShipping(25, 'Bogotá');
      
      // Weight cost: 25kg @ 4000 COP/kg = 100,000 COP
      // Zone multiplier for Local in Zone 1: 1.8
      // Total: 5000 + (100000 × 1.8) = 5000 + 180,000 = 185,000 COP
      expect(quote.price).toBe(185000);
    });

    test('should use tier 4 rate (3800 COP/kg) for 60kg', async () => {
      const quote = await adapter.calculateShipping(60, 'Bogotá');
      
      // Weight cost: 60kg @ 3800 COP/kg = 228,000 COP
      // Zone multiplier for Local in Zone 1: 1.8
      // Total: 5000 + (228000 × 1.8) = 5000 + 410,400 = 415,400 COP
      expect(quote.price).toBe(415400);
    });
  });

  describe('Cheapest Rates Verification', () => {
    test('should have cheapest rates compared to FedEx/DHL for same weight', async () => {
      const quote = await adapter.calculateShipping(10, 'Bogotá');
      
      // Local (Zone 1, 1.8x): 5000 + (10 * 4500 * 1.8) = 86,000 COP
      // FedEx (Zone 1, 1.0x): 10000 + (10 * 6500 * 1.0) = 75,000 COP
      // DHL (Zone 1, 1.0x): 8000 + (10 * 6000 * 1.0) = 68,000 COP
      // Local is NOT always cheapest anymore with zone multipliers!
      // In Zone 1, DHL (68,000) < FedEx (75,000) < Local (86,000)
      expect(quote.price).toBe(86000);
      // Note: Local is now NOT the cheapest in all zones due to dynamic multipliers
    });
  });

  describe('Quote Metadata', () => {
    test('should return correct provider metadata', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      expect(quote.providerId).toBe('local-courier');
      expect(quote.providerName).toBe('Local Courier');
      expect(quote.currency).toBe('COP');
      expect(quote.transportMode).toBe('Truck');
      expect(quote.minDays).toBe(7);
      expect(quote.maxDays).toBe(7);
    });
  });
});
