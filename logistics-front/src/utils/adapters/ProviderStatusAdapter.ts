import type { ISystemStatus, ISystemStatusMetrics, SystemStatusType, ProviderStatusType } from '../../models/ProviderStatus';

/**
 * Adapter to convert API response to ISystemStatus
 * Implements Liskov Substitution Principle by mapping external types
 * to our internal domain model
 */
export class ProviderStatusAdapter {
  /**
   * Convert raw API response to internal ISystemStatus model
   */
  static fromApiResponse(data: unknown): ISystemStatus {
    const apiData = data as Record<string, unknown>;
    const status = (apiData.status as string) || 'offline';
    
    // Convert uppercase status from backend to lowercase for frontend
    const normalizedStatus = status.toLowerCase() as SystemStatusType;
    
    // Map providers from backend format to frontend format
    const providers = ((apiData.providers as unknown[]) || []).map((p: unknown) => {
      const provider = p as Record<string, unknown>;
      return {
        providerName: provider.providerName as string,
        status: (provider.status as string).toLowerCase() as ProviderStatusType,
        responseTime: provider.responseTime as number,
        lastCheck: provider.lastCheck as string,
      };
    });
    
    return {
      status: normalizedStatus,
      providers,
      timestamp: (apiData.timestamp as string) || new Date().toISOString(),
    };
  }

  /**
   * Calculate system metrics from ISystemStatus
   * Converts domain model to metrics for display
   */
  static toMetrics(systemStatus: ISystemStatus): ISystemStatusMetrics {
    const activeProviders = systemStatus.providers.filter(
      p => p.status === 'online'
    ).length;

    return {
      systemStatus: systemStatus.status,
      activeProviders,
      totalProviders: systemStatus.providers.length,
    };
  }

  /**
   * Convert ISystemStatus back to API format (if needed)
   */
  static toApiFormat(systemStatus: ISystemStatus): unknown {
    return {
      status: systemStatus.status,
      providers: systemStatus.providers,
      timestamp: systemStatus.timestamp,
    };
  }
}
