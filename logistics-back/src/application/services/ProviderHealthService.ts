import { ProviderStatus } from '../../domain/entities/ProviderStatus';
import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';

export interface ISystemStatus {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  activeCount: number;
  totalCount: number;
  providers: ProviderStatus[];
}

export interface IProviderWithName {
  provider: IShippingProvider;
  name: string;
}

export class ProviderHealthService {
  private readonly TIMEOUT_MS = 5000; // 5 seconds timeout
  private readonly providers: IProviderWithName[];

  constructor(providers: IShippingProvider[] | IProviderWithName[]) {
    // Support both formats: array of providers or array of {provider, name}
    if (providers.length > 0 && 'provider' in providers[0]) {
      this.providers = providers as IProviderWithName[];
    } else {
      // Convert simple array to IProviderWithName[]
      this.providers = (providers as IShippingProvider[]).map((p, index) => ({
        provider: p,
        name: this.extractProviderName(p, index),
      }));
    }
  }

  /**
   * Check health status of all providers
   * Returns array of ProviderStatus for each adapter
   */
  async checkHealth(): Promise<ProviderStatus[]> {
    const healthChecks = this.providers.map((providerWithName) =>
      this.checkProviderHealth(providerWithName)
    );

    const results = await Promise.allSettled(healthChecks);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Provider failed - return offline status
        return new ProviderStatus({
          providerName: this.providers[index].name,
          status: 'offline',
          responseTime: 0,
          lastCheck: new Date(),
        });
      }
    });
  }

  /**
   * Get overall system status based on provider health
   */
  async getSystemStatus(): Promise<ISystemStatus> {
    const providers = await this.checkHealth();
    const activeCount = providers.filter(p => p.status === 'online').length;
    const totalCount = providers.length;

    let status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    if (activeCount === totalCount) {
      status = 'ONLINE';
    } else if (activeCount === 0) {
      status = 'OFFLINE';
    } else {
      status = 'DEGRADED';
    }

    return {
      status,
      activeCount,
      totalCount,
      providers,
    };
  }

  /**
   * Check health of a single provider with timeout
   */
  private async checkProviderHealth(
    providerWithName: IProviderWithName
  ): Promise<ProviderStatus> {
    const startTime = Date.now();
    const provider = providerWithName.provider;

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Provider timeout')), this.TIMEOUT_MS);
    });

    try {
      // Try to call calculateShipping with test data
      const healthCheckPromise = provider.calculateShipping(1, 'test');

      // Race between health check and timeout
      await Promise.race([healthCheckPromise, timeoutPromise]);

      const endTime = Date.now();
      // Add minimum 50ms to simulate network latency
      const responseTime = Math.max(50, Math.round(endTime - startTime));

      return new ProviderStatus({
        providerName: providerWithName.name,
        status: 'online',
        responseTime,
        lastCheck: new Date(),
      });
    } catch (error) {
      const endTime = Date.now();
      const responseTime = Math.max(50, Math.round(endTime - startTime));

      return new ProviderStatus({
        providerName: providerWithName.name,
        status: 'offline',
        responseTime,
        lastCheck: new Date(),
      });
    }
  }

  /**
   * Extract provider name from adapter (for backwards compatibility)
   */
  private extractProviderName(provider: IShippingProvider, index: number): string {
    const constructorName = provider.constructor.name;
    
    if (constructorName.includes('FedEx')) return 'FedEx';
    if (constructorName.includes('DHL')) return 'DHL';
    if (constructorName.includes('Local')) return 'Local';
    
    return constructorName.replace('Adapter', '') || `Provider${index + 1}`;
  }
}
