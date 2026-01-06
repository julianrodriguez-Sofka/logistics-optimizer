import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProviderStatus } from '../useProviderStatus';

describe('useProviderStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should fetch status on mount', async () => {
    const mockResponse = {
      systemStatus: 'online',
      activeProviders: 3,
      totalProviders: 3,
      providers: [],
      lastUpdate: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useProviderStatus());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.status).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/api/adapters/status');
  });

  it('should auto-refresh every 30 seconds', async () => {
    const mockResponse = {
      systemStatus: 'online',
      activeProviders: 3,
      totalProviders: 3,
      providers: [],
      lastUpdate: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    renderHook(() => useProviderStatus());

    // Initial fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Fast-forward another 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  it('should handle fetch errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useProviderStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.status).toBeNull();
  });

  it('should clear interval on unmount', async () => {
    const mockResponse = {
      systemStatus: 'online',
      activeProviders: 3,
      totalProviders: 3,
      providers: [],
      lastUpdate: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const { unmount } = renderHook(() => useProviderStatus());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Advance time after unmount
    vi.advanceTimersByTime(30000);

    // Should not fetch again after unmount
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should set loading to false after successful fetch', async () => {
    const mockResponse = {
      systemStatus: 'online',
      activeProviders: 3,
      totalProviders: 3,
      providers: [],
      lastUpdate: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useProviderStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
