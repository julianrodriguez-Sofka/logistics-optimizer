/**
 * Provider status models for HU-04 system health
 */

export type ProviderStatusType = 'online' | 'offline';
export type SystemStatusType = 'online' | 'offline' | 'degraded';

/**
 * Individual provider status information
 */
export interface IProviderStatus {
  providerName: string;
  status: ProviderStatusType;
  responseTime?: number;
  lastCheck: string;
}

/**
 * System-wide status information
 * Aligned with backend API response structure
 */
export interface ISystemStatus {
  status: SystemStatusType;
  providers: IProviderStatus[];
  timestamp: string;
}

/**
 * Computed system status metrics
 * Derived from ISystemStatus
 */
export interface ISystemStatusMetrics {
  systemStatus: SystemStatusType;
  activeProviders: number;
  totalProviders: number;
}
