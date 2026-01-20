/**
 * ShipmentStateService - Manages local state persistence for shipments
 * 
 * Design Patterns:
 * - Repository Pattern: Abstracts data storage/retrieval
 * - Singleton Pattern: Single instance manages all state
 * - Observer Pattern: Components can subscribe to state changes
 * 
 * SOLID Principles:
 * - Single Responsibility: Only manages shipment local state
 * - Open/Closed: Extensible through callbacks, closed for modification
 * - Interface Segregation: Focused API for state management
 * - Dependency Inversion: Can be injected as dependency
 */

import type { ShipmentStatusType } from '../models/Shipment';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ShipmentLocalState {
  id: string;
  status: ShipmentStatusType;
  assignedTruckId?: string;
  assignedTruckPlate?: string;
  assignedDriverName?: string;
  updatedAt: number;
  statusHistory: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  status: ShipmentStatusType;
  timestamp: number;
  note?: string;
}

export interface Truck {
  id: string;
  plate: string;
  driver: string;
  capacity: number;
  status: 'available' | 'in_transit' | 'maintenance';
}

type StateChangeCallback = (shipmentId: string, state: ShipmentLocalState) => void;

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'warehouse_shipment_states';
const TRUCKS_STORAGE_KEY = 'warehouse_trucks_state';

// Status flow definition - represents the valid state transitions
export const STATUS_FLOW: ShipmentStatusType[] = [
  'PAYMENT_CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

// Terminal states that cannot transition further (in the normal flow)
export const TERMINAL_STATES: ShipmentStatusType[] = [
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNED',
];

// Special states that can be set at any time
export const SPECIAL_STATES: ShipmentStatusType[] = [
  'FAILED_DELIVERY',
  'RETURNED',
];

// Available trucks for assignment
export const AVAILABLE_TRUCKS: Truck[] = [
  { id: 'truck-1', plate: 'ABC-123', driver: 'Carlos Mendoza', capacity: 500, status: 'available' },
  { id: 'truck-2', plate: 'DEF-456', driver: 'María García', capacity: 1000, status: 'available' },
  { id: 'truck-3', plate: 'GHI-789', driver: 'Juan Pérez', capacity: 1500, status: 'available' },
  { id: 'truck-4', plate: 'JKL-012', driver: 'Ana López', capacity: 2000, status: 'available' },
  { id: 'truck-5', plate: 'MNO-345', driver: 'Pedro Sánchez', capacity: 750, status: 'available' },
];

// ============================================================================
// SHIPMENT STATE SERVICE (Singleton)
// ============================================================================

class ShipmentStateService {
  private static instance: ShipmentStateService;
  private states: Map<string, ShipmentLocalState> = new Map();
  private listeners: Set<StateChangeCallback> = new Set();
  private initialized = false;

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ShipmentStateService {
    if (!ShipmentStateService.instance) {
      ShipmentStateService.instance = new ShipmentStateService();
    }
    return ShipmentStateService.instance;
  }

  /**
   * Load states from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, ShipmentLocalState>;
        Object.entries(parsed).forEach(([id, state]) => {
          this.states.set(id, state);
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error('[ShipmentStateService] Error loading from storage:', error);
      this.states = new Map();
      this.initialized = true;
    }
  }

  /**
   * Save states to localStorage
   */
  private saveToStorage(): void {
    try {
      const obj: Record<string, ShipmentLocalState> = {};
      this.states.forEach((state, id) => {
        obj[id] = state;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('[ShipmentStateService] Error saving to storage:', error);
    }
  }

  /**
   * Notify all listeners of a state change
   */
  private notifyListeners(shipmentId: string, state: ShipmentLocalState): void {
    this.listeners.forEach((callback) => {
      try {
        callback(shipmentId, state);
      } catch (error) {
        console.error('[ShipmentStateService] Listener error:', error);
      }
    });
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(callback: StateChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get state for a shipment, creating default if not exists
   * @param shipmentId - Unique identifier for the shipment
   * @param defaultStatus - Initial status from API (optional)
   * @param paymentMethod - Payment method to determine initial state (optional)
   */
  public getState(
    shipmentId: string, 
    defaultStatus?: ShipmentStatusType,
    paymentMethod?: 'CARD' | 'CASH'
  ): ShipmentLocalState {
    if (!this.states.has(shipmentId)) {
      // Determine initial status based on payment method
      // CASH payments go directly to PAYMENT_CONFIRMED since payment is at delivery
      // CARD payments that show as PENDING_PAYMENT should remain so until confirmed
      let initialStatus = defaultStatus || 'PAYMENT_CONFIRMED';
      let initialNote = 'Estado inicial';
      
      // If payment is CASH and status is PENDING_PAYMENT, upgrade to PAYMENT_CONFIRMED
      if (paymentMethod === 'CASH' && initialStatus === 'PENDING_PAYMENT') {
        initialStatus = 'PAYMENT_CONFIRMED';
        initialNote = 'Pago en efectivo - Confirmado al crear pedido';
      } else if (paymentMethod === 'CARD' && initialStatus === 'PENDING_PAYMENT') {
        // Card payment that's pending might need verification
        initialNote = 'Esperando confirmación de pago con tarjeta';
      }

      const newState: ShipmentLocalState = {
        id: shipmentId,
        status: initialStatus,
        updatedAt: Date.now(),
        statusHistory: [
          {
            status: initialStatus,
            timestamp: Date.now(),
            note: initialNote,
          },
        ],
      };
      this.states.set(shipmentId, newState);
      this.saveToStorage();
    }
    return this.states.get(shipmentId)!;
  }

  /**
   * Get all stored states
   */
  public getAllStates(): Map<string, ShipmentLocalState> {
    return new Map(this.states);
  }

  /**
   * Check if a status transition is valid
   */
  public isValidTransition(currentStatus: ShipmentStatusType, newStatus: ShipmentStatusType): boolean {
    // Special states can always be set (failed, returned)
    if (SPECIAL_STATES.includes(newStatus)) {
      return !TERMINAL_STATES.includes(currentStatus);
    }

    // Terminal states cannot transition
    if (TERMINAL_STATES.includes(currentStatus)) {
      return false;
    }

    // Check if transition follows the flow
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const newIndex = STATUS_FLOW.indexOf(newStatus);

    // Allow forward transitions only (or same status)
    return newIndex > currentIndex;
  }

  /**
   * Get next valid status in the flow
   */
  public getNextStatus(currentStatus: ShipmentStatusType): ShipmentStatusType | null {
    if (TERMINAL_STATES.includes(currentStatus)) {
      return null;
    }

    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }

    return null;
  }

  /**
   * Update shipment status
   */
  public updateStatus(
    shipmentId: string,
    newStatus: ShipmentStatusType,
    note?: string
  ): ShipmentLocalState | null {
    const state = this.getState(shipmentId);

    if (!this.isValidTransition(state.status, newStatus)) {
      console.warn(
        `[ShipmentStateService] Invalid transition: ${state.status} -> ${newStatus}`
      );
      return null;
    }

    const updatedState: ShipmentLocalState = {
      ...state,
      status: newStatus,
      updatedAt: Date.now(),
      statusHistory: [
        ...state.statusHistory,
        {
          status: newStatus,
          timestamp: Date.now(),
          note: note || `Cambio a ${newStatus}`,
        },
      ],
    };

    this.states.set(shipmentId, updatedState);
    this.saveToStorage();
    this.notifyListeners(shipmentId, updatedState);

    return updatedState;
  }

  /**
   * Assign truck to shipment
   */
  public assignTruck(shipmentId: string, truck: Truck): ShipmentLocalState {
    const state = this.getState(shipmentId);

    const updatedState: ShipmentLocalState = {
      ...state,
      assignedTruckId: truck.id,
      assignedTruckPlate: truck.plate,
      assignedDriverName: truck.driver,
      updatedAt: Date.now(),
      statusHistory: [
        ...state.statusHistory,
        {
          status: state.status,
          timestamp: Date.now(),
          note: `Camión asignado: ${truck.plate} (${truck.driver})`,
        },
      ],
    };

    this.states.set(shipmentId, updatedState);
    this.saveToStorage();
    this.notifyListeners(shipmentId, updatedState);

    return updatedState;
  }

  /**
   * Remove truck assignment
   */
  public removeTruck(shipmentId: string): ShipmentLocalState {
    const state = this.getState(shipmentId);

    const updatedState: ShipmentLocalState = {
      ...state,
      assignedTruckId: undefined,
      assignedTruckPlate: undefined,
      assignedDriverName: undefined,
      updatedAt: Date.now(),
      statusHistory: [
        ...state.statusHistory,
        {
          status: state.status,
          timestamp: Date.now(),
          note: 'Camión desasignado',
        },
      ],
    };

    this.states.set(shipmentId, updatedState);
    this.saveToStorage();
    this.notifyListeners(shipmentId, updatedState);

    return updatedState;
  }

  /**
   * Clear all local state (for testing/reset)
   */
  public clearAll(): void {
    this.states.clear();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRUCKS_STORAGE_KEY);
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const shipmentStateService = ShipmentStateService.getInstance();

// Export class for testing
export { ShipmentStateService };
