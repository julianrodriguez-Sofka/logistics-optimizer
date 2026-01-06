/**
 * Provider status models for HU-04 system health
 */

export type ProviderStatusType = 'online' | 'offline';
export type SystemStatusType = 'online' | 'offline' | 'degraded';

export interface IProviderStatus {
  providerName: string;
  status: ProviderStatusType;
  responseTime?: number;
  lastCheck: string;
}

export interface ISystemStatus {
  systemStatus: SystemStatusType;
  activeProviders: number;
  totalProviders: number;
  providers: IProviderStatus[];
  lastUpdate: string;
}
