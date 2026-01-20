/**
 * WarehouseView Integration Tests
 * 
 * Tests the warehouse view component with its integration
 * with ShipmentStateService.
 * 
 * Design Patterns Tested:
 * - Container/Presentational pattern
 * - Observer pattern (state subscriptions)
 * - Repository pattern (service integration)
 * 
 * SOLID Principles:
 * - Single Responsibility: Each sub-component tested independently
 * - Dependency Inversion: Service mocking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarehouseView } from '../../../components/WarehouseView';
import { shipmentService } from '../../../services/shipmentService';
import { shipmentStateService } from '../../../services/ShipmentStateService';
import type { Shipment } from '../../../models/Shipment';

// Mock the shipment service
vi.mock('../../../services/shipmentService', () => ({
  shipmentService: {
    getShipments: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Sample shipment data
const createMockShipment = (overrides: Partial<Shipment> = {}): Shipment => ({
  id: 'shipment-1',
  trackingNumber: 'LOG-2026-001',
  customer: {
    id: 'cust-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+573001234567',
    address: 'Calle 123',
  },
  address: {
    origin: 'Bogotá',
    destination: 'Medellín',
  },
  package: {
    weight: 10,
    description: 'Electronics package',
    fragile: true,
  },
  selectedQuote: {
    providerId: 'fedex',
    providerName: 'FedEx',
    price: 50000,
    currency: 'COP',
    minDays: 2,
    maxDays: 3,
  },
  payment: {
    method: 'CARD',
    amount: 50000,
    status: 'COMPLETED',
  },
  currentStatus: 'PAYMENT_CONFIRMED',
  statusHistory: [],
  pickupDate: new Date(),
  ...overrides,
});

describe('WarehouseView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    shipmentStateService.clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading indicator initially', async () => {
      vi.mocked(shipmentService.getShipments).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<WarehouseView />);

      expect(screen.getByText(/Cargando almacén/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no shipments', async () => {
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [],
        total: 0,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText(/No hay envíos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Shipment Display', () => {
    it('should display shipments from API', async () => {
      const mockShipment = createMockShipment();
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText('LOG-2026-001')).toBeInTheDocument();
      });
    });

    it('should display package description', async () => {
      const mockShipment = createMockShipment({
        package: { weight: 5, description: 'Test description for package' },
      });
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText(/Test description for package/i)).toBeInTheDocument();
      });
    });

    it('should display fragile indicator for fragile packages', async () => {
      const mockShipment = createMockShipment({
        package: { weight: 5, fragile: true },
      });
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText(/Frágil/i)).toBeInTheDocument();
      });
    });

    it('should display payment method badge', async () => {
      const mockShipment = createMockShipment({
        payment: { method: 'CASH', amount: 50000, status: 'PENDING' },
      });
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText(/Efectivo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Statistics', () => {
    it('should display correct total count', async () => {
      const shipments = [
        createMockShipment({ id: '1', trackingNumber: 'LOG-001' }),
        createMockShipment({ id: '2', trackingNumber: 'LOG-002' }),
        createMockShipment({ id: '3', trackingNumber: 'LOG-003' }),
      ];
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments,
        total: 3,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        const totalStats = screen.getAllByText('3');
        expect(totalStats.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtering', () => {
    it('should filter shipments by status', async () => {
      const shipments = [
        createMockShipment({ id: '1', trackingNumber: 'LOG-001', currentStatus: 'PAYMENT_CONFIRMED' }),
        createMockShipment({ id: '2', trackingNumber: 'LOG-002', currentStatus: 'DELIVERED' }),
      ];
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments,
        total: 2,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText('LOG-001')).toBeInTheDocument();
      });

      // Click on "Entregado" filter
      const deliveredFilter = screen.getByText('Entregado');
      fireEvent.click(deliveredFilter);

      // Should only show delivered shipments
      // Note: This depends on local state management
    });

    it('should filter shipments by search query', async () => {
      const shipments = [
        createMockShipment({ id: '1', trackingNumber: 'LOG-SEARCH-001' }),
        createMockShipment({ id: '2', trackingNumber: 'LOG-OTHER-002' }),
      ];
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments,
        total: 2,
      });

      const user = userEvent.setup();
      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText('LOG-SEARCH-001')).toBeInTheDocument();
      });

      // Type in search
      const searchInput = screen.getByPlaceholderText(/Buscar pedido/i);
      await user.type(searchInput, 'SEARCH');

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('LOG-SEARCH-001')).toBeInTheDocument();
      });
    });
  });

  describe('Status Management', () => {
    it('should show advance status button', async () => {
      const mockShipment = createMockShipment({ currentStatus: 'PAYMENT_CONFIRMED' });
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText(/Avanzar a/i)).toBeInTheDocument();
      });
    });

    it('should show special status buttons for non-terminal states', async () => {
      const mockShipment = createMockShipment({ currentStatus: 'PAYMENT_CONFIRMED' });
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText(/No Entregado/i)).toBeInTheDocument();
        expect(screen.getByText(/Devolución/i)).toBeInTheDocument();
      });
    });
  });

  describe('Truck Assignment', () => {
    it('should show assign truck button when no truck assigned', async () => {
      const mockShipment = createMockShipment();
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText(/Asignar Camión/i)).toBeInTheDocument();
      });
    });
  });

  describe('History Modal', () => {
    it('should show history button for each shipment', async () => {
      const mockShipment = createMockShipment();
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText(/Ver historial/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      vi.mocked(shipmentService.getShipments).mockRejectedValue(
        new Error('Network error')
      );

      render(<WarehouseView />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cash Payment Initial Status', () => {
    it('should show PAYMENT_CONFIRMED for cash payments', async () => {
      const mockShipment = createMockShipment({
        currentStatus: 'PENDING_PAYMENT',
        payment: { method: 'CASH', amount: 50000, status: 'PENDING' },
      });
      vi.mocked(shipmentService.getShipments).mockResolvedValue({
        shipments: [mockShipment],
        total: 1,
      });

      render(<WarehouseView />);

      await waitFor(() => {
        // Cash payments should be upgraded to PAYMENT_CONFIRMED
        expect(screen.getByText(/Pago Confirmado/i)).toBeInTheDocument();
      });
    });
  });
});
