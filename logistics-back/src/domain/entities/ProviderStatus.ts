export interface IProviderStatusData {
  providerName: string;
  status: 'online' | 'offline';
  responseTime: number;
  lastCheck: Date;
}

export class ProviderStatus {
  public readonly providerName: string;
  public readonly status: 'online' | 'offline';
  public readonly responseTime: number;
  public readonly lastCheck: Date;

  constructor(data: IProviderStatusData) {
    // Validate providerName
    if (!data.providerName || data.providerName.trim() === '') {
      throw new Error('providerName is required');
    }

    // Validate status
    if (data.status !== 'online' && data.status !== 'offline') {
      throw new Error('status must be either "online" or "offline"');
    }

    // Validate responseTime
    if (data.responseTime < 0) {
      throw new Error('responseTime must be positive');
    }

    this.providerName = data.providerName;
    this.status = data.status;
    this.responseTime = data.responseTime;
    this.lastCheck = data.lastCheck;
  }
}
