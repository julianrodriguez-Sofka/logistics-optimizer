import { DHLAdapter } from '../DHLAdapter';
import { Quote } from '../../../domain/entities/Quote';

describe('DHLAdapter - Dynamic Pricing (TDD RED Phase)', () => {
  let adapter: DHLAdapter;

  beforeEach(() => {
    adapter = new DHLAdapter();
  });

  describe('Zone-Based Pricing', () => {
    test('should calculate price for Bogotá (Zone 1) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      // Expected: basePrice + (weightCost × zoneMultiplier)
      // Weight cost: 4.5kg @ 7500 COP/kg (tier 1) = 33,750 COP
      // Zone multiplier: Zone 1 = 1.0
      // Total: 8000 + (33750 × 1.0) = 41,750 COP
      expect(quote.price).toBe(41750);
      expect(quote.providerName).toBe('DHL Express');
      expect(quote.currency).toBe('COP');
    });

    test('should calculate price for Medellín (Zone 2) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Medellín');
      
      // Weight cost: 4.5kg @ 7500 COP/kg = 33,750 COP
      // Zone multiplier: Zone 2 = 1.1
      // Total: 8000 + (33750 × 1.1) = 45,125 COP
      expect(quote.price).toBe(45125);
    });

    test('should calculate price for Cali (Zone 3) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Cali');
      
      // Zone multiplier: Zone 3 = 1.2
      // Total: 8000 + (33750 × 1.2) = 48,500 COP
      expect(quote.price).toBe(48500);
    });

    test('should calculate price for Barranquilla (Zone 4) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Barranquilla');
      
      // Zone multiplier: Zone 4 = 1.3
      // Total: 8000 + (33750 × 1.3) = 51,875 COP
      expect(quote.price).toBe(51875);
    });

    test('should calculate price for Leticia (Zone 5) - 4.5kg', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Leticia');
      
      // Zone multiplier: Zone 5 = 1.5
      // Total: 8000 + (33750 × 1.5) = 58,625 COP
      expect(quote.price).toBe(58625);
    });
  });

  describe('Weight Tier Pricing', () => {
    test('should use tier 1 rate (7500 COP/kg) for 3kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(3, 'Bogotá');
      
      // Weight cost: 3kg @ 7500 COP/kg = 22,500 COP
      // Total: 8000 + (22500 × 1.0) = 30,500 COP
      expect(quote.price).toBe(30500);
    });

    test('should use tier 2 rate (6000 COP/kg) for 10kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(10, 'Bogotá');
      
      // Weight cost: 10kg @ 6000 COP/kg = 60,000 COP
      // Total: 8000 + (60000 × 1.0) = 68,000 COP
      expect(quote.price).toBe(68000);
    });

    test('should use tier 3 rate (5000 COP/kg) for 25kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(25, 'Bogotá');
      
      // Weight cost: 25kg @ 5000 COP/kg = 125,000 COP
      // Total: 8000 + (125000 × 1.0) = 133,000 COP
      expect(quote.price).toBe(133000);
    });

    test('should use tier 4 rate (4500 COP/kg) for 60kg to Bogotá', async () => {
      const quote = await adapter.calculateShipping(60, 'Bogotá');
      
      // Weight cost: 60kg @ 4500 COP/kg = 270,000 COP
      // Total: 8000 + (270000 × 1.0) = 278,000 COP
      expect(quote.price).toBe(278000);
    });
  });

  describe('Combined Zone + Weight Pricing', () => {
    test('should calculate correct price for Medellín (Zone 2) - 10kg', async () => {
      const quote = await adapter.calculateShipping(10, 'Medellín');
      
      // Weight cost: 10kg @ 6000 COP/kg (tier 2) = 60,000 COP
      // Zone multiplier: 1.1
      // Total: 8000 + (60000 × 1.1) = 74,000 COP
      expect(quote.price).toBe(74000);
    });

    test('should calculate correct price for Leticia (Zone 5) - 25kg', async () => {
      const quote = await adapter.calculateShipping(25, 'Leticia');
      
      // Weight cost: 25kg @ 5000 COP/kg (tier 3) = 125,000 COP
      // Zone multiplier: 1.5
      // Total: 8000 + (125000 × 1.5) = 195,500 COP
      expect(quote.price).toBe(195500);
    });
  });

  describe('Quote Metadata', () => {
    test('should return correct provider metadata', async () => {
      const quote = await adapter.calculateShipping(4.5, 'Bogotá');
      
      expect(quote.providerId).toBe('dhl-express');
      expect(quote.providerName).toBe('DHL Express');
      expect(quote.currency).toBe('COP');
      expect(quote.transportMode).toBe('Air');
      expect(quote.minDays).toBe(5);
      expect(quote.maxDays).toBe(5);
    });
  });
});
