import { Request, Response } from 'express';
import { HealthController } from '../../../../infrastructure/controllers/HealthController';
import { ProviderHealthService } from '../../../../application/services/ProviderHealthService';
import { ProviderStatus } from '../../../../domain/entities/ProviderStatus';

// Mock the ProviderHealthService
jest.mock('../../../../application/services/ProviderHealthService');

describe('HealthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockHealthService: jest.Mocked<ProviderHealthService>;
  let healthController: HealthController;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request and response
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Create mock health service
    mockHealthService = new ProviderHealthService([]) as jest.Mocked<ProviderHealthService>;
    
    // Create controller with mocked service
    healthController = new HealthController(mockHealthService);
  });

  describe('getAdaptersStatus', () => {
    it('should return 200 with system status when all adapters are online', async () => {
      const mockProviderStatuses = [
        new ProviderStatus({
          providerName: 'FedEx',
          status: 'online',
          responseTime: 100,
          lastCheck: new Date('2024-01-01T12:00:00Z'),
        }),
        new ProviderStatus({
          providerName: 'DHL',
          status: 'online',
          responseTime: 120,
          lastCheck: new Date('2024-01-01T12:00:00Z'),
        }),
        new ProviderStatus({
          providerName: 'Local',
          status: 'online',
          responseTime: 80,
          lastCheck: new Date('2024-01-01T12:00:00Z'),
        }),
      ];

      mockHealthService.getSystemStatus = jest.fn().mockResolvedValue({
        status: 'ONLINE',
        activeCount: 3,
        totalCount: 3,
        providers: mockProviderStatuses,
      });

      await healthController.getAdaptersStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'ONLINE',
        activeCount: 3,
        totalCount: 3,
        providers: mockProviderStatuses,
      });
    });

    it('should return 200 with DEGRADED status when some adapters are offline', async () => {
      const mockProviderStatuses = [
        new ProviderStatus({
          providerName: 'FedEx',
          status: 'online',
          responseTime: 100,
          lastCheck: new Date('2024-01-01T12:00:00Z'),
        }),
        new ProviderStatus({
          providerName: 'DHL',
          status: 'offline',
          responseTime: 5000,
          lastCheck: new Date('2024-01-01T12:00:00Z'),
        }),
      ];

      mockHealthService.getSystemStatus = jest.fn().mockResolvedValue({
        status: 'DEGRADED',
        activeCount: 1,
        totalCount: 2,
        providers: mockProviderStatuses,
      });

      await healthController.getAdaptersStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'DEGRADED',
        activeCount: 1,
        totalCount: 2,
        providers: mockProviderStatuses,
      });
    });

    it('should return 503 when all adapters are offline', async () => {
      const mockProviderStatuses = [
        new ProviderStatus({
          providerName: 'FedEx',
          status: 'offline',
          responseTime: 5000,
          lastCheck: new Date('2024-01-01T12:00:00Z'),
        }),
        new ProviderStatus({
          providerName: 'DHL',
          status: 'offline',
          responseTime: 5000,
          lastCheck: new Date('2024-01-01T12:00:00Z'),
        }),
      ];

      mockHealthService.getSystemStatus = jest.fn().mockResolvedValue({
        status: 'OFFLINE',
        activeCount: 0,
        totalCount: 2,
        providers: mockProviderStatuses,
      });

      await healthController.getAdaptersStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'OFFLINE',
        activeCount: 0,
        totalCount: 2,
        providers: mockProviderStatuses,
      });
    });

    it('should return 500 when health service throws error', async () => {
      mockHealthService.getSystemStatus = jest.fn().mockRejectedValue(
        new Error('Health check failed')
      );

      await healthController.getAdaptersStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to check adapter status',
      });
    });
  });
});
