/**
 * ShipmentStateService Unit Tests
 * 
 * Tests for the Singleton service that manages shipment local state
 * with localStorage persistence.
 * 
 * Design Patterns Tested:
 * - Singleton Pattern: Ensures single instance
 * - Repository Pattern: State persistence abstraction
 * - Observer Pattern: State change notifications
 * 
 * SOLID Principles Verified:
 * - Single Responsibility: Only manages shipment state
 * - Open/Closed: Extensible through callbacks
 * - Interface Segregation: Focused API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ShipmentStateService,
  shipmentStateService,
  STATUS_FLOW,
  TERMINAL_STATES,
  SPECIAL_STATES,
  AVAILABLE_TRUCKS,
} from '../../../services/ShipmentStateService';
import type { ShipmentStatusType } from '../../../models/Shipment';

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

describe('ShipmentStateService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Clear the singleton's internal state by calling clearAll
    shipmentStateService.clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when calling getInstance multiple times', () => {
      const instance1 = ShipmentStateService.getInstance();
      const instance2 = ShipmentStateService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should export a singleton instance', () => {
      expect(shipmentStateService).toBeDefined();
      expect(shipmentStateService).toBeInstanceOf(ShipmentStateService);
    });

    it('should be initialized', () => {
      expect(shipmentStateService.isInitialized()).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should create default state for new shipment', () => {
      const state = shipmentStateService.getState('test-shipment-1');
      
      expect(state).toBeDefined();
      expect(state.id).toBe('test-shipment-1');
      expect(state.status).toBe('PAYMENT_CONFIRMED');
      expect(state.statusHistory).toHaveLength(1);
      expect(state.statusHistory[0].note).toBe('Estado inicial');
    });

    it('should use provided default status', () => {
      const state = shipmentStateService.getState('test-shipment-2', 'PREPARING');
      
      expect(state.status).toBe('PREPARING');
    });

    it('should return existing state on subsequent calls', () => {
      const state1 = shipmentStateService.getState('test-shipment-3', 'PREPARING');
      const state2 = shipmentStateService.getState('test-shipment-3', 'DELIVERED');
      
      // Should return the first state, not create new one with DELIVERED
      expect(state1).toEqual(state2);
      expect(state2.status).toBe('PREPARING');
    });

    it('should handle CASH payment method - upgrade PENDING to CONFIRMED', () => {
      const state = shipmentStateService.getState(
        'cash-payment-1',
        'PENDING_PAYMENT',
        'CASH'
      );
      
      expect(state.status).toBe('PAYMENT_CONFIRMED');
      expect(state.statusHistory[0].note).toContain('Pago en efectivo');
    });

    it('should handle CARD payment method - keep PENDING status', () => {
      const state = shipmentStateService.getState(
        'card-payment-1',
        'PENDING_PAYMENT',
        'CARD'
      );
      
      expect(state.status).toBe('PENDING_PAYMENT');
      expect(state.statusHistory[0].note).toContain('tarjeta');
    });

    it('should get all stored states', () => {
      shipmentStateService.getState('shipment-a');
      shipmentStateService.getState('shipment-b');
      shipmentStateService.getState('shipment-c');
      
      const allStates = shipmentStateService.getAllStates();
      
      expect(allStates.size).toBe(3);
      expect(allStates.has('shipment-a')).toBe(true);
      expect(allStates.has('shipment-b')).toBe(true);
      expect(allStates.has('shipment-c')).toBe(true);
    });
  });

  describe('Status Transitions', () => {
    it('should validate forward transitions as valid', () => {
      expect(shipmentStateService.isValidTransition('PAYMENT_CONFIRMED', 'PREPARING')).toBe(true);
      expect(shipmentStateService.isValidTransition('PREPARING', 'READY_FOR_PICKUP')).toBe(true);
      expect(shipmentStateService.isValidTransition('IN_TRANSIT', 'DELIVERED')).toBe(true);
    });

    it('should validate backward transitions as invalid', () => {
      expect(shipmentStateService.isValidTransition('PREPARING', 'PAYMENT_CONFIRMED')).toBe(false);
      expect(shipmentStateService.isValidTransition('DELIVERED', 'IN_TRANSIT')).toBe(false);
    });

    it('should allow special states from any non-terminal state', () => {
      expect(shipmentStateService.isValidTransition('PAYMENT_CONFIRMED', 'FAILED_DELIVERY')).toBe(true);
      expect(shipmentStateService.isValidTransition('IN_TRANSIT', 'RETURNED')).toBe(true);
    });

    it('should not allow transitions from terminal states', () => {
      expect(shipmentStateService.isValidTransition('DELIVERED', 'PREPARING')).toBe(false);
      expect(shipmentStateService.isValidTransition('FAILED_DELIVERY', 'IN_TRANSIT')).toBe(false);
      expect(shipmentStateService.isValidTransition('RETURNED', 'PAYMENT_CONFIRMED')).toBe(false);
    });

    it('should get next status correctly', () => {
      expect(shipmentStateService.getNextStatus('PAYMENT_CONFIRMED')).toBe('PREPARING');
      expect(shipmentStateService.getNextStatus('PREPARING')).toBe('READY_FOR_PICKUP');
      expect(shipmentStateService.getNextStatus('OUT_FOR_DELIVERY')).toBe('DELIVERED');
    });

    it('should return null for terminal states', () => {
      expect(shipmentStateService.getNextStatus('DELIVERED')).toBeNull();
      expect(shipmentStateService.getNextStatus('FAILED_DELIVERY')).toBeNull();
      expect(shipmentStateService.getNextStatus('RETURNED')).toBeNull();
    });
  });

  describe('Update Status', () => {
    it('should update status successfully', () => {
      shipmentStateService.getState('update-test-1', 'PAYMENT_CONFIRMED');
      
      const updatedState = shipmentStateService.updateStatus('update-test-1', 'PREPARING');
      
      expect(updatedState).not.toBeNull();
      expect(updatedState?.status).toBe('PREPARING');
      expect(updatedState?.statusHistory).toHaveLength(2);
    });

    it('should add custom note to history', () => {
      shipmentStateService.getState('update-test-2', 'PAYMENT_CONFIRMED');
      
      const updatedState = shipmentStateService.updateStatus(
        'update-test-2',
        'PREPARING',
        'Preparación iniciada por operador'
      );
      
      expect(updatedState?.statusHistory[1].note).toBe('Preparación iniciada por operador');
    });

    it('should return null for invalid transitions', () => {
      shipmentStateService.getState('invalid-test', 'DELIVERED');
      
      const result = shipmentStateService.updateStatus('invalid-test', 'PREPARING');
      
      expect(result).toBeNull();
    });

    it('should persist state to localStorage after update', () => {
      shipmentStateService.getState('persist-test', 'PAYMENT_CONFIRMED');
      shipmentStateService.updateStatus('persist-test', 'PREPARING');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Truck Assignment', () => {
    const testTruck = AVAILABLE_TRUCKS[0];

    it('should assign truck to shipment', () => {
      shipmentStateService.getState('truck-test-1');
      
      const state = shipmentStateService.assignTruck('truck-test-1', testTruck);
      
      expect(state.assignedTruckId).toBe(testTruck.id);
      expect(state.assignedTruckPlate).toBe(testTruck.plate);
      expect(state.assignedDriverName).toBe(testTruck.driver);
    });

    it('should add truck assignment to history', () => {
      shipmentStateService.getState('truck-test-2');
      
      const state = shipmentStateService.assignTruck('truck-test-2', testTruck);
      const lastEntry = state.statusHistory[state.statusHistory.length - 1];
      
      expect(lastEntry.note).toContain('Camión asignado');
      expect(lastEntry.note).toContain(testTruck.plate);
    });

    it('should remove truck assignment', () => {
      shipmentStateService.getState('truck-test-3');
      shipmentStateService.assignTruck('truck-test-3', testTruck);
      
      const state = shipmentStateService.removeTruck('truck-test-3');
      
      expect(state.assignedTruckId).toBeUndefined();
      expect(state.assignedTruckPlate).toBeUndefined();
      expect(state.assignedDriverName).toBeUndefined();
    });

    it('should add removal to history', () => {
      shipmentStateService.getState('truck-test-4');
      shipmentStateService.assignTruck('truck-test-4', testTruck);
      
      const state = shipmentStateService.removeTruck('truck-test-4');
      const lastEntry = state.statusHistory[state.statusHistory.length - 1];
      
      expect(lastEntry.note).toBe('Camión desasignado');
    });
  });

  describe('Observer Pattern - Subscriptions', () => {
    it('should notify subscribers on status update', () => {
      const callback = vi.fn();
      shipmentStateService.getState('observer-test-1');
      
      shipmentStateService.subscribe(callback);
      shipmentStateService.updateStatus('observer-test-1', 'PREPARING');
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        'observer-test-1',
        expect.objectContaining({ status: 'PREPARING' })
      );
    });

    it('should notify subscribers on truck assignment', () => {
      const callback = vi.fn();
      shipmentStateService.getState('observer-test-2');
      
      shipmentStateService.subscribe(callback);
      shipmentStateService.assignTruck('observer-test-2', AVAILABLE_TRUCKS[0]);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      shipmentStateService.getState('observer-test-3');
      
      const unsubscribe = shipmentStateService.subscribe(callback);
      unsubscribe();
      
      shipmentStateService.updateStatus('observer-test-3', 'PREPARING');
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle errors in callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();
      
      shipmentStateService.getState('observer-test-4');
      shipmentStateService.subscribe(errorCallback);
      shipmentStateService.subscribe(normalCallback);
      
      // Should not throw, and should call other callbacks
      expect(() => {
        shipmentStateService.updateStatus('observer-test-4', 'PREPARING');
      }).not.toThrow();
      
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('Clear All', () => {
    it('should clear all states', () => {
      shipmentStateService.getState('clear-test-1');
      shipmentStateService.getState('clear-test-2');
      
      shipmentStateService.clearAll();
      
      const states = shipmentStateService.getAllStates();
      expect(states.size).toBe(0);
    });

    it('should clear localStorage', () => {
      shipmentStateService.getState('clear-test-3');
      
      shipmentStateService.clearAll();
      
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('Constants Verification', () => {
    it('should have correct STATUS_FLOW order', () => {
      expect(STATUS_FLOW).toEqual([
        'PAYMENT_CONFIRMED',
        'PREPARING',
        'READY_FOR_PICKUP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ]);
    });

    it('should have correct TERMINAL_STATES', () => {
      expect(TERMINAL_STATES).toContain('DELIVERED');
      expect(TERMINAL_STATES).toContain('FAILED_DELIVERY');
      expect(TERMINAL_STATES).toContain('RETURNED');
    });

    it('should have correct SPECIAL_STATES', () => {
      expect(SPECIAL_STATES).toContain('FAILED_DELIVERY');
      expect(SPECIAL_STATES).toContain('RETURNED');
    });

    it('should have available trucks defined', () => {
      expect(AVAILABLE_TRUCKS.length).toBeGreaterThan(0);
      AVAILABLE_TRUCKS.forEach(truck => {
        expect(truck).toHaveProperty('id');
        expect(truck).toHaveProperty('plate');
        expect(truck).toHaveProperty('driver');
        expect(truck).toHaveProperty('capacity');
        expect(truck).toHaveProperty('status');
      });
    });
  });
});
