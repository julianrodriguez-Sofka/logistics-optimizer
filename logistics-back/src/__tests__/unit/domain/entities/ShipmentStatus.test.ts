/**
 * Unit tests for ShipmentStatus entity
 * Tests status lifecycle and business rules
 */

import { ShipmentStatus, ShipmentStatusType, IShipmentStatus } from '../../../../domain/entities/ShipmentStatus';

describe('ShipmentStatus Entity', () => {
  const validStatusData: IShipmentStatus = {
    status: 'PENDING_PAYMENT',
    timestamp: new Date('2025-01-15T10:00:00Z'),
    notes: 'Awaiting payment confirmation',
    location: 'Bogotá',
    updatedBy: 'system',
  };

  describe('Constructor and Getters', () => {
    it('should create ShipmentStatus with all fields', () => {
      const status = new ShipmentStatus(validStatusData);

      expect(status.status).toBe('PENDING_PAYMENT');
      expect(status.timestamp).toEqual(validStatusData.timestamp);
      expect(status.notes).toBe('Awaiting payment confirmation');
      expect(status.location).toBe('Bogotá');
      expect(status.updatedBy).toBe('system');
    });

    it('should create ShipmentStatus with minimal fields', () => {
      const minimalData: IShipmentStatus = {
        status: 'IN_TRANSIT',
        timestamp: new Date(),
      };

      const status = new ShipmentStatus(minimalData);

      expect(status.status).toBe('IN_TRANSIT');
      expect(status.notes).toBeUndefined();
      expect(status.location).toBeUndefined();
      expect(status.updatedBy).toBeUndefined();
    });
  });

  describe('canTransition - Valid Transitions', () => {
    it('should allow PENDING_PAYMENT to PAYMENT_CONFIRMED', () => {
      expect(ShipmentStatus.canTransition('PENDING_PAYMENT', 'PAYMENT_CONFIRMED')).toBe(true);
    });

    it('should allow PENDING_PAYMENT to CANCELLED', () => {
      expect(ShipmentStatus.canTransition('PENDING_PAYMENT', 'CANCELLED')).toBe(true);
    });

    it('should allow PAYMENT_CONFIRMED to PROCESSING', () => {
      expect(ShipmentStatus.canTransition('PAYMENT_CONFIRMED', 'PROCESSING')).toBe(true);
    });

    it('should allow PROCESSING to READY_FOR_PICKUP', () => {
      expect(ShipmentStatus.canTransition('PROCESSING', 'READY_FOR_PICKUP')).toBe(true);
    });

    it('should allow READY_FOR_PICKUP to IN_TRANSIT', () => {
      expect(ShipmentStatus.canTransition('READY_FOR_PICKUP', 'IN_TRANSIT')).toBe(true);
    });

    it('should allow IN_TRANSIT to OUT_FOR_DELIVERY', () => {
      expect(ShipmentStatus.canTransition('IN_TRANSIT', 'OUT_FOR_DELIVERY')).toBe(true);
    });

    it('should allow OUT_FOR_DELIVERY to DELIVERED', () => {
      expect(ShipmentStatus.canTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
    });

    it('should allow OUT_FOR_DELIVERY to FAILED_DELIVERY', () => {
      expect(ShipmentStatus.canTransition('OUT_FOR_DELIVERY', 'FAILED_DELIVERY')).toBe(true);
    });

    it('should allow FAILED_DELIVERY to IN_TRANSIT', () => {
      expect(ShipmentStatus.canTransition('FAILED_DELIVERY', 'IN_TRANSIT')).toBe(true);
    });

    it('should allow FAILED_DELIVERY to RETURNED', () => {
      expect(ShipmentStatus.canTransition('FAILED_DELIVERY', 'RETURNED')).toBe(true);
    });

    it('should allow IN_TRANSIT to RETURNED', () => {
      expect(ShipmentStatus.canTransition('IN_TRANSIT', 'RETURNED')).toBe(true);
    });
  });

  describe('canTransition - Invalid Transitions', () => {
    it('should reject DELIVERED to any status', () => {
      expect(ShipmentStatus.canTransition('DELIVERED', 'IN_TRANSIT')).toBe(false);
      expect(ShipmentStatus.canTransition('DELIVERED', 'CANCELLED')).toBe(false);
    });

    it('should reject CANCELLED to any status', () => {
      expect(ShipmentStatus.canTransition('CANCELLED', 'PROCESSING')).toBe(false);
      expect(ShipmentStatus.canTransition('CANCELLED', 'IN_TRANSIT')).toBe(false);
    });

    it('should reject RETURNED to any status', () => {
      expect(ShipmentStatus.canTransition('RETURNED', 'IN_TRANSIT')).toBe(false);
      expect(ShipmentStatus.canTransition('RETURNED', 'DELIVERED')).toBe(false);
    });

    it('should reject skipping PROCESSING step', () => {
      expect(ShipmentStatus.canTransition('PAYMENT_CONFIRMED', 'READY_FOR_PICKUP')).toBe(false);
    });

    it('should reject going backwards in normal flow', () => {
      expect(ShipmentStatus.canTransition('IN_TRANSIT', 'PROCESSING')).toBe(false);
      expect(ShipmentStatus.canTransition('OUT_FOR_DELIVERY', 'READY_FOR_PICKUP')).toBe(false);
    });
  });

  describe('getDisplayName', () => {
    it('should return Spanish display name for PENDING_PAYMENT', () => {
      const status = new ShipmentStatus({ status: 'PENDING_PAYMENT', timestamp: new Date() });
      expect(status.getDisplayName()).toBe('Pendiente de Pago');
    });

    it('should return Spanish display name for IN_TRANSIT', () => {
      const status = new ShipmentStatus({ status: 'IN_TRANSIT', timestamp: new Date() });
      expect(status.getDisplayName()).toBe('En Tránsito');
    });

    it('should return Spanish display name for DELIVERED', () => {
      const status = new ShipmentStatus({ status: 'DELIVERED', timestamp: new Date() });
      expect(status.getDisplayName()).toBe('Entregado');
    });

    it('should return Spanish display name for CANCELLED', () => {
      const status = new ShipmentStatus({ status: 'CANCELLED', timestamp: new Date() });
      expect(status.getDisplayName()).toBe('Cancelado');
    });

    it('should return Spanish display name for all statuses', () => {
      const statuses: ShipmentStatusType[] = [
        'PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP',
        'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 
        'CANCELLED', 'RETURNED',
      ];

      statuses.forEach(statusType => {
        const status = new ShipmentStatus({ status: statusType, timestamp: new Date() });
        expect(status.getDisplayName()).toBeTruthy();
        expect(typeof status.getDisplayName()).toBe('string');
      });
    });
  });

  describe('getStatusColor', () => {
    it('should return orange for PENDING_PAYMENT', () => {
      const status = new ShipmentStatus({ status: 'PENDING_PAYMENT', timestamp: new Date() });
      expect(status.getStatusColor()).toBe('#FFA500');
    });

    it('should return lime green for DELIVERED', () => {
      const status = new ShipmentStatus({ status: 'DELIVERED', timestamp: new Date() });
      expect(status.getStatusColor()).toBe('#32CD32');
    });

    it('should return gray for CANCELLED', () => {
      const status = new ShipmentStatus({ status: 'CANCELLED', timestamp: new Date() });
      expect(status.getStatusColor()).toBe('#808080');
    });

    it('should return crimson for RETURNED', () => {
      const status = new ShipmentStatus({ status: 'RETURNED', timestamp: new Date() });
      expect(status.getStatusColor()).toBe('#DC143C');
    });

    it('should return valid hex color for all statuses', () => {
      const statuses: ShipmentStatusType[] = [
        'PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP',
        'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 
        'CANCELLED', 'RETURNED',
      ];

      statuses.forEach(statusType => {
        const status = new ShipmentStatus({ status: statusType, timestamp: new Date() });
        const color = status.getStatusColor();
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('isTerminal', () => {
    it('should return true for DELIVERED', () => {
      const status = new ShipmentStatus({ status: 'DELIVERED', timestamp: new Date() });
      expect(status.isTerminal()).toBe(true);
    });

    it('should return true for CANCELLED', () => {
      const status = new ShipmentStatus({ status: 'CANCELLED', timestamp: new Date() });
      expect(status.isTerminal()).toBe(true);
    });

    it('should return true for RETURNED', () => {
      const status = new ShipmentStatus({ status: 'RETURNED', timestamp: new Date() });
      expect(status.isTerminal()).toBe(true);
    });

    it('should return false for IN_TRANSIT', () => {
      const status = new ShipmentStatus({ status: 'IN_TRANSIT', timestamp: new Date() });
      expect(status.isTerminal()).toBe(false);
    });

    it('should return false for PENDING_PAYMENT', () => {
      const status = new ShipmentStatus({ status: 'PENDING_PAYMENT', timestamp: new Date() });
      expect(status.isTerminal()).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return true for PROCESSING', () => {
      const status = new ShipmentStatus({ status: 'PROCESSING', timestamp: new Date() });
      expect(status.isActive()).toBe(true);
    });

    it('should return true for READY_FOR_PICKUP', () => {
      const status = new ShipmentStatus({ status: 'READY_FOR_PICKUP', timestamp: new Date() });
      expect(status.isActive()).toBe(true);
    });

    it('should return true for IN_TRANSIT', () => {
      const status = new ShipmentStatus({ status: 'IN_TRANSIT', timestamp: new Date() });
      expect(status.isActive()).toBe(true);
    });

    it('should return true for OUT_FOR_DELIVERY', () => {
      const status = new ShipmentStatus({ status: 'OUT_FOR_DELIVERY', timestamp: new Date() });
      expect(status.isActive()).toBe(true);
    });

    it('should return false for PENDING_PAYMENT', () => {
      const status = new ShipmentStatus({ status: 'PENDING_PAYMENT', timestamp: new Date() });
      expect(status.isActive()).toBe(false);
    });

    it('should return false for DELIVERED', () => {
      const status = new ShipmentStatus({ status: 'DELIVERED', timestamp: new Date() });
      expect(status.isActive()).toBe(false);
    });

    it('should return false for CANCELLED', () => {
      const status = new ShipmentStatus({ status: 'CANCELLED', timestamp: new Date() });
      expect(status.isActive()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should convert to plain object with all fields', () => {
      const status = new ShipmentStatus(validStatusData);
      const json = status.toJSON();

      expect(json.status).toBe('PENDING_PAYMENT');
      expect(json.timestamp).toEqual(validStatusData.timestamp);
      expect(json.notes).toBe('Awaiting payment confirmation');
      expect(json.location).toBe('Bogotá');
      expect(json.updatedBy).toBe('system');
    });

    it('should convert to plain object with minimal fields', () => {
      const minimalData: IShipmentStatus = {
        status: 'DELIVERED',
        timestamp: new Date('2025-01-20T15:00:00Z'),
      };
      const status = new ShipmentStatus(minimalData);
      const json = status.toJSON();

      expect(json.status).toBe('DELIVERED');
      expect(json.timestamp).toEqual(minimalData.timestamp);
      expect(json.notes).toBeUndefined();
      expect(json.location).toBeUndefined();
      expect(json.updatedBy).toBeUndefined();
    });
  });
});
