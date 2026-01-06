import { BadgeService } from '../../../../application/services/BadgeService';
import { Quote } from '../../../../domain/entities/Quote';

describe('BadgeService', () => {
  let badgeService: BadgeService;

  beforeEach(() => {
    badgeService = new BadgeService();
  });

  describe('assignBadges', () => {
    it('should assign isCheapest to the quote with lowest price', () => {
      const quotes = [
        new Quote({
          providerId: 'fedex',
          providerName: 'FedEx',
          price: 100,
          currency: 'USD',
          minDays: 3,
          maxDays: 4,
          transportMode: 'Truck',
        }),
        new Quote({
          providerId: 'dhl',
          providerName: 'DHL',
          price: 85,
          currency: 'USD',
          minDays: 5,
          maxDays: 5,
          transportMode: 'Air',
        }),
        new Quote({
          providerId: 'local',
          providerName: 'Local',
          price: 120,
          currency: 'USD',
          minDays: 7,
          maxDays: 7,
          transportMode: 'Truck',
        }),
      ];

      const result = badgeService.assignBadges(quotes);

      expect(result[0].isCheapest).toBe(false);
      expect(result[1].isCheapest).toBe(true); // DHL has lowest price
      expect(result[2].isCheapest).toBe(false);
    });

    it('should assign isFastest to the quote with lowest estimatedDays', () => {
      const quotes = [
        new Quote({
          providerId: 'fedex',
          providerName: 'FedEx',
          price: 100,
          currency: 'USD',
          minDays: 3,
          maxDays: 4,
          transportMode: 'Truck',
        }),
        new Quote({
          providerId: 'dhl',
          providerName: 'DHL',
          price: 85,
          currency: 'USD',
          minDays: 5,
          maxDays: 5,
          transportMode: 'Air',
        }),
        new Quote({
          providerId: 'local',
          providerName: 'Local',
          price: 120,
          currency: 'USD',
          minDays: 7,
          maxDays: 7,
          transportMode: 'Truck',
        }),
      ];

      const result = badgeService.assignBadges(quotes);

      expect(result[0].isFastest).toBe(true); // FedEx has estimatedDays = 4
      expect(result[1].isFastest).toBe(false);
      expect(result[2].isFastest).toBe(false);
    });

    it('should handle price tie - first provider wins', () => {
      const quotes = [
        new Quote({
          providerId: 'fedex',
          providerName: 'FedEx',
          price: 85,
          currency: 'USD',
          minDays: 3,
          maxDays: 4,
          transportMode: 'Truck',
        }),
        new Quote({
          providerId: 'dhl',
          providerName: 'DHL',
          price: 85, // Same price as FedEx
          currency: 'USD',
          minDays: 5,
          maxDays: 5,
          transportMode: 'Air',
        }),
      ];

      const result = badgeService.assignBadges(quotes);

      expect(result[0].isCheapest).toBe(true); // First one wins
      expect(result[1].isCheapest).toBe(false);
    });

    it('should handle estimatedDays tie - first provider wins', () => {
      const quotes = [
        new Quote({
          providerId: 'fedex',
          providerName: 'FedEx',
          price: 100,
          currency: 'USD',
          minDays: 3,
          maxDays: 4,
          transportMode: 'Truck',
        }),
        new Quote({
          providerId: 'dhl',
          providerName: 'DHL',
          price: 85,
          currency: 'USD',
          minDays: 3,
          maxDays: 5, // estimatedDays = 4, same as FedEx
          transportMode: 'Air',
        }),
      ];

      const result = badgeService.assignBadges(quotes);

      expect(result[0].isFastest).toBe(true); // First one wins
      expect(result[1].isFastest).toBe(false);
    });

    it('should handle single quote - gets both badges', () => {
      const quotes = [
        new Quote({
          providerId: 'fedex',
          providerName: 'FedEx',
          price: 100,
          currency: 'USD',
          minDays: 3,
          maxDays: 4,
          transportMode: 'Truck',
        }),
      ];

      const result = badgeService.assignBadges(quotes);

      expect(result[0].isCheapest).toBe(true);
      expect(result[0].isFastest).toBe(true);
    });

    it('should handle empty array', () => {
      const quotes: Quote[] = [];

      const result = badgeService.assignBadges(quotes);

      expect(result).toEqual([]);
    });

    it('should handle same provider being cheapest AND fastest', () => {
      const quotes = [
        new Quote({
          providerId: 'fedex',
          providerName: 'FedEx',
          price: 50, // Cheapest
          currency: 'USD',
          minDays: 2,
          maxDays: 2, // Fastest
          transportMode: 'Air',
        }),
        new Quote({
          providerId: 'dhl',
          providerName: 'DHL',
          price: 85,
          currency: 'USD',
          minDays: 5,
          maxDays: 5,
          transportMode: 'Air',
        }),
        new Quote({
          providerId: 'local',
          providerName: 'Local',
          price: 120,
          currency: 'USD',
          minDays: 7,
          maxDays: 7,
          transportMode: 'Truck',
        }),
      ];

      const result = badgeService.assignBadges(quotes);

      expect(result[0].isCheapest).toBe(true);
      expect(result[0].isFastest).toBe(true);
      expect(result[1].isCheapest).toBe(false);
      expect(result[1].isFastest).toBe(false);
    });

    it('should handle all providers with same price and days - first wins both', () => {
      const quotes = [
        new Quote({
          providerId: 'fedex',
          providerName: 'FedEx',
          price: 100,
          currency: 'USD',
          minDays: 3,
          maxDays: 4,
          transportMode: 'Air',
        }),
        new Quote({
          providerId: 'dhl',
          providerName: 'DHL',
          price: 100, // Same price
          currency: 'USD',
          minDays: 3,
          maxDays: 4, // Same estimatedDays
          transportMode: 'Air',
        }),
        new Quote({
          providerId: 'local',
          providerName: 'Local',
          price: 100, // Same price
          currency: 'USD',
          minDays: 3,
          maxDays: 4, // Same estimatedDays
          transportMode: 'Truck',
        }),
      ];

      const result = badgeService.assignBadges(quotes);

      // First provider should win both badges
      expect(result[0].isCheapest).toBe(true);
      expect(result[0].isFastest).toBe(true);
      expect(result[1].isCheapest).toBe(false);
      expect(result[1].isFastest).toBe(false);
      expect(result[2].isCheapest).toBe(false);
      expect(result[2].isFastest).toBe(false);
    });

    it('should not mutate the input array (immutability)', () => {
      const quotes = [
        new Quote({
          providerId: 'fedex',
          providerName: 'FedEx',
          price: 100,
          currency: 'USD',
          minDays: 3,
          maxDays: 4,
          transportMode: 'Truck',
        }),
        new Quote({
          providerId: 'dhl',
          providerName: 'DHL',
          price: 85,
          currency: 'USD',
          minDays: 5,
          maxDays: 5,
          transportMode: 'Air',
        }),
      ];

      // Store original states
      const originalCheapestFedex = quotes[0].isCheapest;
      const originalFastestFedex = quotes[0].isFastest;
      const originalCheapestDHL = quotes[1].isCheapest;
      const originalFastestDHL = quotes[1].isFastest;

      const result = badgeService.assignBadges(quotes);

      // Original quotes should not be modified
      expect(quotes[0].isCheapest).toBe(originalCheapestFedex);
      expect(quotes[0].isFastest).toBe(originalFastestFedex);
      expect(quotes[1].isCheapest).toBe(originalCheapestDHL);
      expect(quotes[1].isFastest).toBe(originalFastestDHL);

      // Result should have badges assigned
      expect(result[0].isCheapest).toBe(false);
      expect(result[0].isFastest).toBe(true);
      expect(result[1].isCheapest).toBe(true);
      expect(result[1].isFastest).toBe(false);

      // Result should be different instances
      expect(result[0]).not.toBe(quotes[0]);
      expect(result[1]).not.toBe(quotes[1]);
    });
  });
});
