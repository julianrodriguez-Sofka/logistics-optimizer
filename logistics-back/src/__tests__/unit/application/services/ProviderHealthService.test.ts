import { ProviderHealthService } from '../../../../application/services/ProviderHealthService';
import { IShippingProvider } from '../../../../domain/interfaces/IShippingProvider';
import { Quote } from '../../../../domain/entities/Quote';

describe('ProviderHealthService', () => {
  describe('checkHealth', () => {
    it('should return "online" status for all adapters when they respond', async () => {
      // Mock adapters that respond successfully
      const mockFedEx: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'fedex',
            providerName: 'FedEx',
            price: 100,
            currency: 'USD',
            minDays: 3,
            maxDays: 4,
            transportMode: 'Air',
          })
        ),
      };

      const mockDHL: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'dhl',
            providerName: 'DHL',
            price: 85,
            currency: 'USD',
            minDays: 5,
            maxDays: 5,
            transportMode: 'Air',
          })
        ),
      };

      const mockLocal: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'local',
            providerName: 'Local',
            price: 120,
            currency: 'USD',
            minDays: 7,
            maxDays: 7,
            transportMode: 'Truck',
          })
        ),
      };

      const adapters = [
        { provider: mockFedEx, name: 'FedEx' },
        { provider: mockDHL, name: 'DHL' },
        { provider: mockLocal, name: 'Local' },
      ];
      const healthService = new ProviderHealthService(adapters);

      const statuses = await healthService.checkHealth();

      expect(statuses).toHaveLength(3);
      expect(statuses[0].providerName).toBe('FedEx');
      expect(statuses[0].status).toBe('online');
      expect(statuses[0].responseTime).toBeGreaterThanOrEqual(0);
      expect(statuses[1].providerName).toBe('DHL');
      expect(statuses[1].status).toBe('online');
      expect(statuses[2].providerName).toBe('Local');
      expect(statuses[2].status).toBe('online');
    });

    it('should return "offline" status when adapter times out', async () => {
      const mockFedEx: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'fedex',
            providerName: 'FedEx',
            price: 100,
            currency: 'USD',
            minDays: 3,
            maxDays: 4,
            transportMode: 'Air',
          })
        ),
      };

      // Mock adapter that times out (takes longer than timeout)
      const mockDHL: IShippingProvider = {
        calculateShipping: jest.fn().mockImplementation(() => 
          new Promise((resolve) => setTimeout(resolve, 6000))
        ),
      };

      const adapters = [
        { provider: mockFedEx, name: 'FedEx' },
        { provider: mockDHL, name: 'DHL' },
      ];
      const healthService = new ProviderHealthService(adapters);

      const statuses = await healthService.checkHealth();

      expect(statuses).toHaveLength(2);
      expect(statuses[0].status).toBe('online');
      expect(statuses[1].providerName).toBe('DHL');
      expect(statuses[1].status).toBe('offline');
    }, 10000); // Increase timeout for this test

    it('should return "offline" status when adapter throws error', async () => {
      const mockFedEx: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      const adapters = [{ provider: mockFedEx, name: 'FedEx' }];
      const healthService = new ProviderHealthService(adapters);

      const statuses = await healthService.checkHealth();

      expect(statuses).toHaveLength(1);
      expect(statuses[0].providerName).toBe('FedEx');
      expect(statuses[0].status).toBe('offline');
    });

    it('should measure response time for each adapter', async () => {
      const mockFedEx: IShippingProvider = {
        calculateShipping: jest.fn().mockImplementation(() =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                new Quote({
                  providerId: 'fedex',
                  providerName: 'FedEx',
                  price: 100,
                  currency: 'USD',
                  minDays: 3,
                  maxDays: 4,
                  transportMode: 'Air',
                })
              );
            }, 100); // 100ms delay
          })
        ),
      };

      const adapters = [{ provider: mockFedEx, name: 'FedEx' }];
      const healthService = new ProviderHealthService(adapters);

      const statuses = await healthService.checkHealth();

      expect(statuses[0].responseTime).toBeGreaterThanOrEqual(95);
      expect(statuses[0].responseTime).toBeLessThan(200);
    });
  });

  describe('getSystemStatus', () => {
    it('should return "ONLINE" when all 3 adapters are online', async () => {
      const mockAdapter: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'test',
            providerName: 'Test',
            price: 100,
            currency: 'USD',
            minDays: 3,
            maxDays: 4,
            transportMode: 'Air',
          })
        ),
      };

      const adapters = [
        { provider: mockAdapter, name: 'FedEx' },
        { provider: mockAdapter, name: 'DHL' },
        { provider: mockAdapter, name: 'Local' },
      ];
      const healthService = new ProviderHealthService(adapters);

      const systemStatus = await healthService.getSystemStatus();

      expect(systemStatus.status).toBe('ONLINE');
      expect(systemStatus.activeCount).toBe(3);
      expect(systemStatus.totalCount).toBe(3);
    });

    it('should return "DEGRADED" when 1-2 adapters are online', async () => {
      const mockOnline: IShippingProvider = {
        calculateShipping: jest.fn().mockResolvedValue(
          new Quote({
            providerId: 'test',
            providerName: 'Test',
            price: 100,
            currency: 'USD',
            minDays: 3,
            maxDays: 4,
            transportMode: 'Air',
          })
        ),
      };

      const mockOffline: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Timeout')),
      };

      const adapters = [
        { provider: mockOnline, name: 'FedEx' },
        { provider: mockOffline, name: 'DHL' },
        { provider: mockOnline, name: 'Local' },
      ];
      const healthService = new ProviderHealthService(adapters);

      const systemStatus = await healthService.getSystemStatus();

      expect(systemStatus.status).toBe('DEGRADED');
      expect(systemStatus.activeCount).toBe(2);
      expect(systemStatus.totalCount).toBe(3);
    });

    it('should return "OFFLINE" when all adapters are offline', async () => {
      const mockOffline: IShippingProvider = {
        calculateShipping: jest.fn().mockRejectedValue(new Error('Timeout')),
      };

      const adapters = [
        { provider: mockOffline, name: 'FedEx' },
        { provider: mockOffline, name: 'DHL' },
        { provider: mockOffline, name: 'Local' },
      ];
      const healthService = new ProviderHealthService(adapters);

      const systemStatus = await healthService.getSystemStatus();

      expect(systemStatus.status).toBe('OFFLINE');
      expect(systemStatus.activeCount).toBe(0);
      expect(systemStatus.totalCount).toBe(3);
    });
  });
});
