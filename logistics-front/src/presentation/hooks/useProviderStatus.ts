import { useState, useEffect } from 'react';
import type { ISystemStatus } from '../../domain/models/ProviderStatus';

interface UseProviderStatusReturn {
  status: ISystemStatus | null;
  loading: boolean;
  error: string | null;
}

export function useProviderStatus(): UseProviderStatusReturn {
  const [status, setStatus] = useState<ISystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/adapters/status');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
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

    // Setup auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchStatus();
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { status, loading, error };
}
