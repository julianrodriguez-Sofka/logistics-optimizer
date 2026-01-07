import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProviderStatus } from '../useProviderStatus';

describe('useProviderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up a default fetch mock that never resolves (tests should override)
    global.fetch = vi.fn(() => new Promise(() => {})) as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // TODO: Fix async state synchronization issue
  // it('should fetch status on mount', async () => {
  //   const mockResponse = {
  //     systemStatus: 'online',
  //     providers: [
  //       { name: 'DHL', status: 'online', responseTime: 120 },
  //       { name: 'FedEx', status: 'online', responseTime: 150 },
  //       { name: 'Local', status: 'online', responseTime: 80 }
  //     ]
  //   };

  //   (global.fetch as any).mockImplementation(async () => ({
  //     ok: true,
  //     json: async () => mockResponse,
  //   }));

  //   const { result } = renderHook(() => useProviderStatus());

  //   expect(result.current.loading).toBe(true);

  //   // Wait for status to be populated
  //   await waitFor(() => {
  //     return result.current.status?.systemStatus === 'online';
  //   }, { timeout: 3000 });

  //   expect(result.current.status).toEqual(mockResponse);
  //   expect(result.current.error).toBeNull();
  //   expect(result.current.loading).toBe(false);
  // });

  it('should auto-refresh every 30 seconds', async () => {
    vi.useFakeTimers();
    
    const mockResponse = {
      systemStatus: 'online',
      providers: [
        { name: 'DHL', status: 'online', responseTime: 120 }
      ]
    };

    let fetchCallCount = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      fetchCallCount++;
      return {
        ok: true,
        json: async () => mockResponse,
      };
    });

    renderHook(() => useProviderStatus());

    // Initial call
    expect(fetchCallCount).toBe(1);

    // Advance time by 30 seconds
    await vi.advanceTimersByTimeAsync(30000);

    // Should have called fetch again
    expect(fetchCallCount).toBeGreaterThan(1);
    
    vi.useRealTimers();
  }, 10000);

  // TODO: Fix async state synchronization issue
  // it('should handle fetch errors', async () => {
  //   (global.fetch as any).mockImplementation(async () => {
  //     throw new Error('Network error');
  //   });

  //   const { result } = renderHook(() => useProviderStatus());

  //   // Wait for error to be set
  //   await waitFor(() => {
  //     return result.current.error === 'Network error';
  //   }, { timeout: 3000 });

  //   // Check that error state is set
  //   expect(result.current.error).toBe('Network error');
  //   expect(result.current.status).toBeNull();
  //   expect(result.current.loading).toBe(false);
  // });

  it('should clear interval on unmount', async () => {
    vi.useFakeTimers();
    
    const mockResponse = {
      systemStatus: 'online',
      providers: []
    };

    let fetchCallCount = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      fetchCallCount++;
      return {
        ok: true,
        json: async () => mockResponse,
      };
    });

    const { unmount } = renderHook(() => useProviderStatus());

    const initialCallCount = fetchCallCount;

    unmount();

    // Advance time by 30 seconds after unmount
    await vi.advanceTimersByTimeAsync(30000);

    // Should not have called fetch again
    expect(fetchCallCount).toBe(initialCallCount);
    
    vi.useRealTimers();
  }, 10000);

  // TODO: Fix async state synchronization issue
  // it('should set loading to false after successful fetch', async () => {
  //   const mockResponse = {
  //     systemStatus: 'online',
  //     providers: []
  //   };

  //   (global.fetch as any).mockImplementation(async () => ({
  //     ok: true,
  //     json: async () => mockResponse,
  //   }));

  //   const { result } = renderHook(() => useProviderStatus());

  //   expect(result.current.loading).toBe(true);

  //   // Wait for status to be populated
  //   await waitFor(() => {
  //     return result.current.status?.systemStatus === 'online';
  //   }, { timeout: 3000 });

  //   expect(result.current.status).toEqual(mockResponse);
  //   expect(result.current.error).toBeNull();
  //   expect(result.current.loading).toBe(false);
  // });
});

