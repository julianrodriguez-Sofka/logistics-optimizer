import { ProviderStatus } from '../../../../domain/entities/ProviderStatus';

describe('ProviderStatus', () => {
  describe('Entity Creation', () => {
    it('should create a valid ProviderStatus entity', () => {
      const status = new ProviderStatus({
        providerName: 'FedEx',
        status: 'online',
        responseTime: 420,
        lastCheck: new Date(),
      });

      expect(status.providerName).toBe('FedEx');
      expect(status.status).toBe('online');
      expect(status.responseTime).toBe(420);
      expect(status.lastCheck).toBeInstanceOf(Date);
    });

    it('should throw error for empty providerName', () => {
      expect(() => new ProviderStatus({
        providerName: '',
        status: 'online',
        responseTime: 100,
        lastCheck: new Date(),
      })).toThrow('providerName is required');
    });

    it('should throw error for invalid status', () => {
      expect(() => new ProviderStatus({
        providerName: 'FedEx',
        status: 'invalid' as any,
        responseTime: 100,
        lastCheck: new Date(),
      })).toThrow('status must be either "online" or "offline"');
    });

    it('should throw error for negative responseTime', () => {
      expect(() => new ProviderStatus({
        providerName: 'FedEx',
        status: 'online',
        responseTime: -100,
        lastCheck: new Date(),
      })).toThrow('responseTime must be positive');
    });

    it('should accept offline status', () => {
      const status = new ProviderStatus({
        providerName: 'DHL',
        status: 'offline',
        responseTime: 0,
        lastCheck: new Date(),
      });

      expect(status.status).toBe('offline');
    });
  });
});
