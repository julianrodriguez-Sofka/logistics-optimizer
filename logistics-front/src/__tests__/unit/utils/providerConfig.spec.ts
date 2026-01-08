import { describe, it, expect } from 'vitest';
import { 
  PROVIDERS, 
  findProvider, 
  getProviderColor, 
  getProviderLogo, 
  getProviderName,
  getAllProviders 
} from '../../../utils/providerConfig';

describe('providerConfig', () => {
  describe('PROVIDERS constant', () => {
    it('should have default providers registered', () => {
      expect(PROVIDERS['dhl']).toBeDefined();
      expect(PROVIDERS['fedex']).toBeDefined();
    });

    it('should have correct DHL configuration', () => {
      const dhl = PROVIDERS['dhl'];
      expect(dhl.id).toBe('dhl');
      expect(dhl.name).toBe('DHL');
      expect(dhl.color).toBe('bg-yellow-400');
      expect(dhl.logoUrl).toBeDefined();
    });

    it('should have correct FedEx configuration', () => {
      const fedex = PROVIDERS['fedex'];
      expect(fedex.id).toBe('fedex');
      expect(fedex.name).toBe('FedEx');
      expect(fedex.color).toBe('bg-blue-800');
      expect(fedex.logoUrl).toBeDefined();
    });
  });

  describe('findProvider', () => {
    it('should find provider by exact ID match', () => {
      const provider = findProvider('dhl');
      expect(provider.id).toBe('dhl');
    });

    it('should find provider by ID containing provider name', () => {
      const provider = findProvider('DHL Express');
      expect(provider.id).toBe('dhl');
    });

    it('should find provider by case-insensitive match', () => {
      const provider = findProvider('FEDEX');
      expect(provider.id).toBe('fedex');
    });

    it('should return default provider for unknown provider', () => {
      const provider = findProvider('unknown-carrier');
      expect(provider.id).toBe('unknown');
    });
  });

  describe('getProviderColor', () => {
    it('should return correct color for DHL', () => {
      expect(getProviderColor('dhl')).toBe('bg-yellow-400');
    });

    it('should return correct color for FedEx', () => {
      expect(getProviderColor('fedex')).toBe('bg-blue-800');
    });

    it('should return default color for unknown provider', () => {
      expect(getProviderColor('unknown')).toBe('bg-gray-400');
    });
  });

  describe('getProviderLogo', () => {
    it('should return logo URL for DHL', () => {
      const logo = getProviderLogo('dhl');
      expect(logo).toBeDefined();
      expect(logo).toContain('http');
    });

    it('should return logo URL for FedEx', () => {
      const logo = getProviderLogo('fedex');
      expect(logo).toBeDefined();
      expect(logo).toContain('http');
    });
  });

  describe('getProviderName', () => {
    it('should return display name for DHL', () => {
      expect(getProviderName('dhl')).toBe('DHL');
    });

    it('should return display name for FedEx', () => {
      expect(getProviderName('fedex')).toBe('FedEx');
    });
  });

  describe('getAllProviders', () => {
    it('should return all registered providers', () => {
      const providers = getAllProviders();
      expect(providers.length).toBeGreaterThanOrEqual(2);
      expect(providers.map(p => p.id)).toContain('dhl');
      expect(providers.map(p => p.id)).toContain('fedex');
    });
  });
});
