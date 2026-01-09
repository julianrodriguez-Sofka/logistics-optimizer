import { useState, useEffect } from 'react';
import type { ISystemStatus } from '../models/ProviderStatus';
import { ProviderStatusAdapter } from '../utils/adapters/ProviderStatusAdapter';
import { API } from '../utils/constants';

interface UseProviderStatusReturn {
  status: ISystemStatus | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage provider status
 * Uses adapter to convert API response to domain model
 */
export function useProviderStatus(): UseProviderStatusReturn {
  const [status, setStatus] = useState<ISystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API.DEFAULT_BASE_URL}/api/adapters/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Use adapter to convert API response to domain model
      const adaptedStatus = ProviderStatusAdapter.fromApiResponse(data);
      setStatus(adaptedStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount
    fetchStatus();

    // Setup auto-refresh
    const intervalId = setInterval(() => {
      fetchStatus();
    }, API.REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { status, loading, error };
}
