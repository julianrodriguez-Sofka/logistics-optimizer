import { Request, Response } from 'express';
import { ProviderHealthService } from '../../application/services/ProviderHealthService';

export class HealthController {
  constructor(private healthService: ProviderHealthService) {}

  /**
   * GET /api/adapters/status
   * Returns the health status of all shipping adapters
   */
  async getAdaptersStatus(req: Request, res: Response): Promise<void> {
    try {
      const systemStatus = await this.healthService.getSystemStatus();

      // Return 503 if all adapters are offline, otherwise 200
      const statusCode = systemStatus.status === 'OFFLINE' ? 503 : 200;

      res.status(statusCode).json(systemStatus);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to check adapter status',
      });
    }
  }
}
