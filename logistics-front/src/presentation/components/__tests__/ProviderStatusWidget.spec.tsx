import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProviderStatusWidget } from '../ProviderStatusWidget';

// Mock the useProviderStatus hook
vi.mock('../../hooks/useProviderStatus', () => ({
  useProviderStatus: vi.fn(),
}));

import { useProviderStatus } from '../../hooks/useProviderStatus';

describe('ProviderStatusWidget', () => {
  it('should display "Sistema: EN LÍNEA" when all providers online', () => {
    (useProviderStatus as any).mockReturnValue({
      status: {
        systemStatus: 'online',
        activeProviders: 3,
        totalProviders: 3,
        providers: [
          { providerName: 'FedEx', status: 'online', responseTime: 420, lastCheck: '2026-01-06T10:00:00Z' },
          { providerName: 'DHL', status: 'online', responseTime: 580, lastCheck: '2026-01-06T10:00:00Z' },
          { providerName: 'Local', status: 'online', responseTime: 150, lastCheck: '2026-01-06T10:00:00Z' },
        ],
        lastUpdate: '2026-01-06T10:00:00Z',
      },
      loading: false,
      error: null,
    });

    render(<ProviderStatusWidget />);

    expect(screen.getByText(/Sistema:/)).toBeInTheDocument();
    expect(screen.getByText(/EN LÍNEA/)).toBeInTheDocument();
  });

  it('should display "3/3 Proveedores Activos" when all online', () => {
    (useProviderStatus as any).mockReturnValue({
      status: {
        systemStatus: 'online',
        activeProviders: 3,
        totalProviders: 3,
        providers: [],
        lastUpdate: '2026-01-06T10:00:00Z',
      },
      loading: false,
      error: null,
    });

    render(<ProviderStatusWidget />);

    expect(screen.getByText('3/3 Proveedores Activos')).toBeInTheDocument();
  });

  it('should display "Sistema: DEGRADADO" when one provider offline', () => {
    (useProviderStatus as any).mockReturnValue({
      status: {
        systemStatus: 'degraded',
        activeProviders: 2,
        totalProviders: 3,
        providers: [
          { providerName: 'FedEx', status: 'online', responseTime: 420, lastCheck: '2026-01-06T10:00:00Z' },
          { providerName: 'DHL', status: 'offline', lastCheck: '2026-01-06T10:00:00Z' },
          { providerName: 'Local', status: 'online', responseTime: 150, lastCheck: '2026-01-06T10:00:00Z' },
        ],
        lastUpdate: '2026-01-06T10:00:00Z',
      },
      loading: false,
      error: null,
    });

    render(<ProviderStatusWidget />);

    expect(screen.getByText(/DEGRADADO/)).toBeInTheDocument();
    expect(screen.getByText('2/3 Proveedores Activos')).toBeInTheDocument();
  });

  it('should display provider table with status and response time', () => {
    (useProviderStatus as any).mockReturnValue({
      status: {
        systemStatus: 'online',
        activeProviders: 3,
        totalProviders: 3,
        providers: [
          { providerName: 'FedEx', status: 'online', responseTime: 420, lastCheck: '2026-01-06T10:00:00Z' },
          { providerName: 'DHL', status: 'online', responseTime: 580, lastCheck: '2026-01-06T10:00:00Z' },
          { providerName: 'Local', status: 'online', responseTime: 150, lastCheck: '2026-01-06T10:00:00Z' },
        ],
        lastUpdate: '2026-01-06T10:00:00Z',
      },
      loading: false,
      error: null,
    });

    render(<ProviderStatusWidget />);

    expect(screen.getByText('FedEx')).toBeInTheDocument();
    expect(screen.getByText('DHL')).toBeInTheDocument();
    expect(screen.getByText('Local')).toBeInTheDocument();
    expect(screen.getByText('420ms')).toBeInTheDocument();
    expect(screen.getByText('580ms')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useProviderStatus as any).mockReturnValue({
      status: null,
      loading: true,
      error: null,
    });

    render(<ProviderStatusWidget />);

    expect(screen.getByText(/Cargando/)).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useProviderStatus as any).mockReturnValue({
      status: null,
      loading: false,
      error: 'Network error',
    });

    render(<ProviderStatusWidget />);

    expect(screen.getByText(/Error al cargar el estado/)).toBeInTheDocument();
  });

  it('should display warning icon when system is degraded', () => {
    (useProviderStatus as any).mockReturnValue({
      status: {
        systemStatus: 'degraded',
        activeProviders: 2,
        totalProviders: 3,
        providers: [],
        lastUpdate: '2026-01-06T10:00:00Z',
      },
      loading: false,
      error: null,
    });

    render(<ProviderStatusWidget />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});
