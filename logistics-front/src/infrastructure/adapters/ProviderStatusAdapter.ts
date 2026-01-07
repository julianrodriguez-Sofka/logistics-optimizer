import type { ISystemStatus, ISystemStatusMetrics, SystemStatusType, IProviderStatus } from '../../domain/models/ProviderStatus';

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
    return {
      status: status as SystemStatusType,
      providers: (apiData.providers as IProviderStatus[]) || [],
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
