import { FedExAdapter } from '../FedExAdapter';
import { Quote } from '../../../domain/entities/Quote';

describe('FedExAdapter - Dynamic Pricing (TDD RED Phase)', () => {
  let adapter: FedExAdapter;

  beforeEach(() => {
    adapter = new FedExAdapter();
  });

  describe('Zone-Based Pricing', () => {
    test('should calculate price for Bogotá (Zone 1) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      // Expected: basePrice + (weightCost × zoneMultiplier)
      // Weight cost: 4.5kg @ 8000 COP/kg (tier 1: 0-5kg) = 36,000 COP
      // Zone multiplier: Zone 1 = 1.0
      // Total: 10000 + (36000 × 1.0) = 46,000 COP
      expect(quote.price).toBe(46000);
      expect(quote.providerName).toBe('FedEx Ground');
      expect(quote.currency).toBe('COP');
    });

    test('should calculate price for Medellín (Zone 2) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Medellín');
      
      // Weight cost: 4.5kg @ 8000 COP/kg = 36,000 COP
      // Zone multiplier: Zone 2 = 1.15
      // Total: 10000 + (36000 × 1.15) = 51,400 COP
      expect(quote.price).toBe(51400);
    });

    test('should calculate price for Cali (Zone 3) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Cali');
      
      // Zone multiplier: Zone 3 = 1.25
      // Total: 10000 + (36000 × 1.25) = 55,000 COP
      expect(quote.price).toBe(55000);
    });

    test('should calculate price for Barranquilla (Zone 4) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Barranquilla');
      
      // Zone multiplier: Zone 4 = 1.35
      // Total: 10000 + (36000 × 1.35) = 58,600 COP
      expect(quote.price).toBe(58600);
    });

    test('should calculate price for Leticia (Zone 5) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Leticia');
      
      // Zone multiplier: Zone 5 = 1.6
      // Total: 10000 + (36000 × 1.6) = 67,600 COP
      expect(quote.price).toBe(67600);
    });
  });

  describe('Weight Tier Pricing', () => {
    test('should use tier 1 rate (8000 COP/kg) for 3kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(3, 'Bogotá');
      
      // Weight cost: 3kg @ 8000 COP/kg = 24,000 COP
      // Total: 10000 + (24000 × 1.0) = 34,000 COP
      expect(quote.price).toBe(34000);
    });

    test('should use tier 2 rate (6500 COP/kg) for 10kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(10, 'Bogotá');
      
      // Weight cost: 10kg @ 6500 COP/kg = 65,000 COP
      // Total: 10000 + (65000 × 1.0) = 75,000 COP
      expect(quote.price).toBe(75000);
    });

    test('should use tier 3 rate (5500 COP/kg) for 25kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(25, 'Bogotá');
      
      // Weight cost: 25kg @ 5500 COP/kg = 137,500 COP
      // Total: 10000 + (137500 × 1.0) = 147,500 COP
      expect(quote.price).toBe(147500);
    });

    test('should use tier 4 rate (4800 COP/kg) for 60kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(60, 'Bogotá');
      
      // Weight cost: 60kg @ 4800 COP/kg = 288,000 COP
      // Total: 10000 + (288000 × 1.0) = 298,000 COP
      expect(quote.price).toBe(298000);
    });

    test('should use tier 2 rate for exactly 5kg (boundary)', async () => {
      const quote = await adapter.calculateShipping(5, 'Bogotá');
      
      // Weight cost: 5kg @ 6500 COP/kg (tier 2 starts at 5kg) = 32,500 COP
      // Total: 10000 + (32500 × 1.0) = 42,500 COP
      expect(quote.price).toBe(42500);
    });
  });

  describe('Combined Zone + Weight Pricing', () => {
    test('should calculate correct price for Medellín (Zone 2) - 10kg', async () => {
      const quote = await adapter.calculateShipping(10, 'Medellín');
      
      // Weight cost: 10kg @ 6500 COP/kg (tier 2) = 65,000 COP
      // Zone multiplier: 1.15
      // Total: 10000 + (65000 × 1.15) = 84,750 COP
      expect(quote.price).toBe(84750);
    });

    test('should calculate correct price for Leticia (Zone 5) - 25kg', async () => {
      const quote = await adapter.calculateShipping(25, 'Leticia');
      
      // Weight cost: 25kg @ 5500 COP/kg (tier 3) = 137,500 COP
      // Zone multiplier: 1.6
      // Total: 10000 + (137500 × 1.6) = 230,000 COP
      expect(quote.price).toBe(230000);
    });

    test('should calculate correct price for Cartagena (Zone 4) - 60kg', async () => {
      const quote = await adapter.calculateShipping(60, 'Cartagena');
      
      // Weight cost: 60kg @ 4800 COP/kg (tier 4) = 288,000 COP
      // Zone multiplier: 1.35
      // Total: 10000 + (288000 × 1.35) = 398,800 COP
      expect(quote.price).toBe(398800);
    });
  });

  describe('Quote Metadata', () => {
    test('should return correct provider metadata', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      expect(quote.providerId).toBe('fedex-ground');
      expect(quote.providerName).toBe('FedEx Ground');
      expect(quote.currency).toBe('COP');
      expect(quote.transportMode).toBe('Truck');
      expect(quote.minDays).toBe(3);
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
      expect(quote.price).toBe(46000);
    });

    test('should handle case-insensitive city names', async () => {
      const quote1 = await adapter.calculateShipping(4.5, 'MEDELLÍN');
      const quote2 = await adapter.calculateShipping(4.5, 'medellín');
      const quote3 = await adapter.calculateShipping(4.5, 'Medellín');
      
      expect(quote1.price).toBe(quote2.price);
      expect(quote2.price).toBe(quote3.price);
      expect(quote1.price).toBe(51400);
    });

    test('should handle city names without accents', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Medellin'); // Sin tilde
      
      // Should still recognize as Medellín (Zone 2)
      expect(quote.price).toBe(51400);
    });

    test('should validate weight and destination', async () => {
      await expect(adapter.calculateShipping(0, 'Bogotá')).rejects.toThrow();
      await expect(adapter.calculateShipping(-5, 'Bogotá')).rejects.toThrow();
      await expect(adapter.calculateShipping(5, '')).rejects.toThrow();
    });
  });
});
