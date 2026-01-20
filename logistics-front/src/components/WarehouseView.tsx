/**
 * WarehouseView - Main warehouse management component
 * 
 * Design Patterns:
 * - Container/Presentational: Separates data logic from UI
 * - Observer: Subscribes to state changes from ShipmentStateService
 * - Strategy: Different status transition strategies
 * 
 * SOLID Principles:
 * - Single Responsibility: Each sub-component has one job
 * - Open/Closed: Extensible through props and callbacks
 * - Liskov Substitution: Components are interchangeable
 * - Interface Segregation: Props are focused and minimal
 * - Dependency Inversion: Depends on abstractions (service interface)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shipment, ShipmentStatusType } from '../models/Shipment';
import type { Customer } from '../models/Customer';
import type { IQuote } from '../models/Quote';
import { shipmentService } from '../services/shipmentService';
import {
  shipmentStateService,
  ShipmentLocalState,
  Truck,
  STATUS_FLOW,
  TERMINAL_STATES,
  AVAILABLE_TRUCKS,
} from '../services/ShipmentStateService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ShipmentWithLocalState extends Shipment {
  localState: ShipmentLocalState;
  // Additional fields that might come from API with different names
  customerInfo?: Customer;
  quote?: IQuote;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<ShipmentStatusType, StatusConfig> = {
  PENDING_PAYMENT: { label: 'Pendiente de Pago', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: '⏳' },
  PAYMENT_CONFIRMED: { label: 'Pago Confirmado', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '💳' },
  PREPARING: { label: 'Preparando', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '📦' },
  READY_FOR_PICKUP: { label: 'Listo Recoger', color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: '✅' },
  IN_TRANSIT: { label: 'En Camino', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: '🚚' },
  OUT_FOR_DELIVERY: { label: 'En Reparto', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: '🏃' },
  DELIVERED: { label: 'Entregado', color: 'text-green-700', bgColor: 'bg-green-100', icon: '✅' },
  FAILED_DELIVERY: { label: 'No Entregado', color: 'text-red-700', bgColor: 'bg-red-100', icon: '❌' },
  RETURNED: { label: 'Devolución', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: '↩️' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getShipmentId = (shipment: Shipment): string => {
  return shipment.id || shipment.trackingNumber || '';
};

const getOriginAddress = (shipment: Shipment): string => {
  if (shipment.address?.origin) return shipment.address.origin;
  if (shipment.origin) return shipment.origin;
  return 'N/A';
};

const getDestinationAddress = (shipment: Shipment): string => {
  if (shipment.address?.destination) return shipment.address.destination;
  if (shipment.destination) return shipment.destination;
  return 'N/A';
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Status Badge - Displays current status with styling
 */
const StatusBadge: React.FC<{ status: ShipmentStatusType }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_PAYMENT;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
};

/**
 * Progress Bar - Visual representation of shipment progress
 */
const ProgressBar: React.FC<{ status: ShipmentStatusType }> = ({ status }) => {
  const currentIndex = STATUS_FLOW.indexOf(status);
  const progress = currentIndex >= 0 
    ? ((currentIndex + 1) / STATUS_FLOW.length) * 100 
    : TERMINAL_STATES.includes(status) ? 100 : 0;

  const getProgressColor = () => {
    if (status === 'DELIVERED') return 'bg-green-500';
    if (status === 'FAILED_DELIVERY') return 'bg-red-500';
    if (status === 'RETURNED') return 'bg-gray-500';
    return 'bg-blue-500';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progreso del envío</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Status Flow Control - Manual status advancement buttons
 */
interface StatusFlowControlProps {
  shipment: ShipmentWithLocalState;
  onAdvanceStatus: (shipmentId: string) => void;
  onSetSpecialStatus: (shipmentId: string, status: ShipmentStatusType) => void;
}

const StatusFlowControl: React.FC<StatusFlowControlProps> = ({
  shipment,
  onAdvanceStatus,
  onSetSpecialStatus,
}) => {
  const currentStatus = shipment.localState.status;
  const nextStatus = shipmentStateService.getNextStatus(currentStatus);
  const isTerminal = TERMINAL_STATES.includes(currentStatus);
  const hasTruck = !!shipment.localState.assignedTruckId;

  // Require truck for certain transitions
  const requiresTruck = ['PREPARING', 'READY_FOR_PICKUP'].includes(currentStatus);
  const canAdvance = nextStatus && !isTerminal && (!requiresTruck || hasTruck);

  return (
    <div className="space-y-2">
      {/* Next Status Button */}
      {!isTerminal && (
        <div className="flex gap-2">
          <button
            onClick={() => onAdvanceStatus(getShipmentId(shipment))}
            disabled={!canAdvance}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              canAdvance
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {nextStatus ? (
              <>
                ▶ Avanzar a: {STATUS_CONFIG[nextStatus]?.label}
              </>
            ) : (
              'Estado final'
            )}
          </button>
        </div>
      )}

      {/* Truck requirement notice */}
      {requiresTruck && !hasTruck && !isTerminal && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          ⚠️ Asigna un camión para poder avanzar el estado
        </p>
      )}

      {/* Special Status Buttons */}
      {!isTerminal && (
        <div className="flex gap-2">
          <button
            onClick={() => onSetSpecialStatus(getShipmentId(shipment), 'FAILED_DELIVERY')}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            ❌ No Entregado
          </button>
          <button
            onClick={() => onSetSpecialStatus(getShipmentId(shipment), 'RETURNED')}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ↩️ Devolución
          </button>
        </div>
      )}

      {/* Terminal state message */}
      {isTerminal && (
        <div className={`text-center py-2 rounded-lg ${
          currentStatus === 'DELIVERED' ? 'bg-green-50 text-green-700' :
          currentStatus === 'FAILED_DELIVERY' ? 'bg-red-50 text-red-700' :
          'bg-gray-50 text-gray-700'
        }`}>
          <span className="text-sm font-medium">
            {currentStatus === 'DELIVERED' && '✅ Pedido entregado exitosamente'}
            {currentStatus === 'FAILED_DELIVERY' && '❌ Entrega fallida'}
            {currentStatus === 'RETURNED' && '↩️ Pedido devuelto'}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Truck Assignment Component
 */
interface TruckAssignmentProps {
  shipment: ShipmentWithLocalState;
  onAssignTruck: (shipmentId: string, truck: Truck) => void;
  onRemoveTruck: (shipmentId: string) => void;
}

const TruckAssignment: React.FC<TruckAssignmentProps> = ({
  shipment,
  onAssignTruck,
  onRemoveTruck,
}) => {
  const [showSelector, setShowSelector] = useState(false);
  const localState = shipment.localState;
  const isTerminal = TERMINAL_STATES.includes(localState.status);

  if (localState.assignedTruckId) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-green-600 font-medium">🚚 Camión Asignado</p>
            <p className="font-bold text-green-800">{localState.assignedTruckPlate}</p>
            <p className="text-sm text-green-700">{localState.assignedDriverName}</p>
          </div>
          {!isTerminal && (
            <button
              onClick={() => onRemoveTruck(getShipmentId(shipment))}
              className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              Quitar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isTerminal) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
        <p className="text-sm text-gray-500">Sin camión asignado</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowSelector(!showSelector)}
        className="w-full px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors"
      >
        🚚 Asignar Camión
      </button>

      {showSelector && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
          {AVAILABLE_TRUCKS.filter(t => t.status === 'available').map((truck) => (
            <button
              key={truck.id}
              onClick={() => {
                onAssignTruck(getShipmentId(shipment), truck);
                setShowSelector(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{truck.plate}</p>
                  <p className="text-sm text-gray-600">{truck.driver}</p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {truck.capacity} kg
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Shipment Card - Individual shipment display
 */
interface ShipmentCardProps {
  shipment: ShipmentWithLocalState;
  onAdvanceStatus: (shipmentId: string) => void;
  onSetSpecialStatus: (shipmentId: string, status: ShipmentStatusType) => void;
  onAssignTruck: (shipmentId: string, truck: Truck) => void;
  onRemoveTruck: (shipmentId: string) => void;
  onViewHistory: (shipment: ShipmentWithLocalState) => void;
}

const ShipmentCard: React.FC<ShipmentCardProps> = ({
  shipment,
  onAdvanceStatus,
  onSetSpecialStatus,
  onAssignTruck,
  onRemoveTruck,
  onViewHistory,
}) => {
  const localState = shipment.localState;
  const isFragile = shipment.package?.fragile || shipment.package?.isFragile;
  const packageDescription = shipment.package?.description;
  const paymentMethod = shipment.payment?.method;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">{shipment.trackingNumber}</p>
              <p className="text-xs text-gray-500">{shipment.customer?.name || shipment.customerInfo?.name || 'Cliente'}</p>
            </div>
          </div>
          <StatusBadge status={localState.status} />
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <ProgressBar status={localState.status} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Package Description - NEW */}
        {packageDescription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <p className="text-xs text-blue-600 mb-1 font-medium">📝 Descripción del paquete</p>
            <p className="text-sm text-blue-800">{packageDescription}</p>
          </div>
        )}

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">📍 Origen</p>
            <p className="text-gray-800 font-medium truncate" title={getOriginAddress(shipment)}>
              {getOriginAddress(shipment)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">🎯 Destino</p>
            <p className="text-gray-800 font-medium truncate" title={getDestinationAddress(shipment)}>
              {getDestinationAddress(shipment)}
            </p>
          </div>
        </div>

        {/* Package Info */}
        <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              <strong>{shipment.package?.weight || 0}</strong> kg
            </span>
            {(shipment.selectedQuote?.price || shipment.quote?.price) && (
              <span className="text-green-600 font-semibold">
                {formatCurrency(shipment.selectedQuote?.price || shipment.quote?.price || 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isFragile && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                ⚠️ Frágil
              </span>
            )}
            {paymentMethod && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                paymentMethod === 'CASH' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {paymentMethod === 'CASH' ? '💵 Efectivo' : '💳 Tarjeta'}
              </span>
            )}
          </div>
        </div>

        {/* Truck Assignment */}
        <TruckAssignment
          shipment={shipment}
          onAssignTruck={onAssignTruck}
          onRemoveTruck={onRemoveTruck}
        />

        {/* Status Flow Control */}
        <StatusFlowControl
          shipment={shipment}
          onAdvanceStatus={onAdvanceStatus}
          onSetSpecialStatus={onSetSpecialStatus}
        />

        {/* View History Button */}
        <button
          onClick={() => onViewHistory(shipment)}
          className="w-full px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          📋 Ver historial de estados
        </button>
      </div>
    </div>
  );
};

/**
 * History Modal - Shows status change history
 */
interface HistoryModalProps {
  shipment: ShipmentWithLocalState | null;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ shipment, onClose }) => {
  if (!shipment) return null;

  const history = [...shipment.localState.statusHistory].reverse();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">📋 Historial de Estados</h2>
              <p className="text-blue-100 text-sm">{shipment.trackingNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {history.map((entry, index) => {
              const config = STATUS_CONFIG[entry.status];
              const date = new Date(entry.timestamp);
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${config?.bgColor || 'bg-gray-50'}`}
                  style={{ borderLeftColor: config?.color?.replace('text-', '') || '#gray' }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-semibold ${config?.color || 'text-gray-700'}`}>
                        {config?.icon} {config?.label}
                      </p>
                      {entry.note && (
                        <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{date.toLocaleDateString('es-CO')}</p>
                      <p>{date.toLocaleTimeString('es-CO')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Filter Sidebar Component
 */
interface FilterSidebarProps {
  selectedStatus: ShipmentStatusType | 'ALL';
  onStatusChange: (status: ShipmentStatusType | 'ALL') => void;
  statusCounts: Record<string, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selectedStatus,
  onStatusChange,
  statusCounts,
  searchQuery,
  onSearchChange,
}) => {
  const allStatuses: (ShipmentStatusType | 'ALL')[] = [
    'ALL',
    'PAYMENT_CONFIRMED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED_DELIVERY',
    'RETURNED',
  ];

  return (
    <div className="w-72 flex-shrink-0 space-y-6">
      {/* Status Filter */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🔍</span> Filtrar por Estado
        </h3>
        <div className="space-y-1">
          {allStatuses.map((status) => {
            const config = status === 'ALL' 
              ? { label: 'Todos', icon: '📋', bgColor: 'bg-blue-100', color: 'text-blue-700' }
              : STATUS_CONFIG[status];
            const count = status === 'ALL' 
              ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
              : statusCounts[status] || 0;

            return (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                  selectedStatus === status
                    ? `${config?.bgColor} ${config?.color}`
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{config?.icon}</span>
                  <span className="text-sm font-medium">{config?.label}</span>
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedStatus === status ? 'bg-white/50' : 'bg-gray-100'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🔎</span> Buscar
        </h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tracking, nombre, email..."
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Control Manual</h4>
        <p className="text-sm text-blue-700">
          Los estados se cambian <strong>manualmente</strong>. Usa el botón "Avanzar" en cada 
          pedido para actualizar su estado. Los cambios se guardan automáticamente.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN WAREHOUSE VIEW COMPONENT
// ============================================================================

const WarehouseView: React.FC = () => {
  // State
  const [shipments, setShipments] = useState<ShipmentWithLocalState[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatusType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyModalShipment, setHistoryModalShipment] = useState<ShipmentWithLocalState | null>(null);

  // Load shipments and merge with local state
  const loadShipments = useCallback(async () => {
    try {
      setError(null);

      const response = await shipmentService.getShipments({ limit: 100 });
      const shipmentsArray = Array.isArray(response?.shipments) ? response.shipments : [];

      // Merge API data with local state
      const merged: ShipmentWithLocalState[] = shipmentsArray.map((s) => {
        const id = getShipmentId(s);
        // Pass payment method to determine initial state
        // CASH payments should start as PAYMENT_CONFIRMED
        const paymentMethod = s.payment?.method as 'CARD' | 'CASH' | undefined;
        const localState = shipmentStateService.getState(id, s.currentStatus, paymentMethod);
        return {
          ...s,
          localState,
        };
      });

      setShipments(merged);
    } catch (err) {
      console.error('Error loading shipments:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los envíos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and refresh interval
  useEffect(() => {
    loadShipments();

    // Refresh every 30 seconds for new shipments
    const interval = setInterval(loadShipments, 30000);

    return () => clearInterval(interval);
  }, [loadShipments]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = shipmentStateService.subscribe((shipmentId, newState) => {
      setShipments((prev) =>
        prev.map((s) =>
          getShipmentId(s) === shipmentId
            ? { ...s, localState: newState }
            : s
        )
      );
    });

    return unsubscribe;
  }, []);

  // Handlers
  const handleAdvanceStatus = useCallback((shipmentId: string) => {
    const state = shipmentStateService.getState(shipmentId);
    const nextStatus = shipmentStateService.getNextStatus(state.status);
    
    if (nextStatus) {
      shipmentStateService.updateStatus(shipmentId, nextStatus);
    }
  }, []);

  const handleSetSpecialStatus = useCallback((shipmentId: string, status: ShipmentStatusType) => {
    shipmentStateService.updateStatus(shipmentId, status);
  }, []);

  const handleAssignTruck = useCallback((shipmentId: string, truck: Truck) => {
    shipmentStateService.assignTruck(shipmentId, truck);
  }, []);

  const handleRemoveTruck = useCallback((shipmentId: string) => {
    shipmentStateService.removeTruck(shipmentId);
  }, []);

  // Filter and search
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      // Status filter
      if (selectedStatus !== 'ALL' && s.localState.status !== selectedStatus) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          s.trackingNumber,
          s.customerInfo?.name,
          s.customerInfo?.email,
          getOriginAddress(s),
          getDestinationAddress(s),
        ].filter(Boolean);

        return searchFields.some((field) =>
          field?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [shipments, selectedStatus, searchQuery]);

  // Status counts for sidebar
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach((s) => {
      const status = s.localState.status;
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [shipments]);

  // Statistics
  const stats = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.localState.status === 'DELIVERED').length;
    const inTransit = shipments.filter(s => 
      ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.localState.status)
    ).length;
    return { total, delivered, inTransit };
  }, [shipments]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Cargando almacén...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-3xl">🏭</span>
                Almacén de Envíos
              </h1>
              <p className="text-gray-500 mt-1">
                Gestiona y rastrea todos los pedidos - Control manual de estados
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 px-4 py-2 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                <p className="text-xs text-blue-600">Total Pedidos</p>
              </div>
              <div className="bg-green-100 px-4 py-2 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
                <p className="text-xs text-green-600">Entregados</p>
              </div>
              <div className="bg-indigo-100 px-4 py-2 rounded-xl text-center">
                <p className="text-2xl font-bold text-indigo-700">{stats.inTransit}</p>
                <p className="text-xs text-indigo-600">En Camino</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar */}
          <FilterSidebar
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            statusCounts={statusCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Shipments Grid */}
          <div className="flex-1">
            {filteredShipments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay envíos
                </h3>
                <p className="text-gray-500">
                  {searchQuery || selectedStatus !== 'ALL'
                    ? 'No se encontraron envíos con los filtros aplicados'
                    : 'Aún no hay envíos en el sistema'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredShipments.map((shipment) => (
                  <ShipmentCard
                    key={getShipmentId(shipment)}
                    shipment={shipment}
                    onAdvanceStatus={handleAdvanceStatus}
                    onSetSpecialStatus={handleSetSpecialStatus}
                    onAssignTruck={handleAssignTruck}
                    onRemoveTruck={handleRemoveTruck}
                    onViewHistory={setHistoryModalShipment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* History Modal */}
      <HistoryModal
        shipment={historyModalShipment}
        onClose={() => setHistoryModalShipment(null)}
      />
    </div>
  );
};

export { WarehouseView };
