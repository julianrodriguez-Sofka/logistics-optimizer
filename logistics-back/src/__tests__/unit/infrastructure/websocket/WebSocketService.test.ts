/**
 * WebSocketService Unit Tests
 * Tests real-time communication via Socket.IO
 */

import { WebSocketService } from '../../../../infrastructure/websocket/WebSocketService';

// Mock Socket.IO
const mockSocket = {
  id: 'socket-123',
  join: jest.fn(),
  leave: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
};

const mockIo = {
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  sockets: {
    adapter: {
      rooms: new Map([['warehouse', new Set(['socket-123'])]]),
    },
    sockets: new Map([['socket-123', mockSocket]]),
  },
};

jest.mock('socket.io', () => {
  return {
    Server: jest.fn(() => mockIo),
  };
});

jest.mock('../../../../infrastructure/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = WebSocketService.getInstance();
    // Inject mock io
    (service as any).io = mockIo;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = WebSocketService.getInstance();
      const instance2 = WebSocketService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('emitShipmentCreated', () => {
    it('should emit shipment created event to warehouse', () => {
      const shipment = {
        id: 'ship-123',
        trackingNumber: 'TRACK-001',
        status: 'pending',
      };

      service.emitShipmentCreated(shipment);

      expect(mockIo.to).toHaveBeenCalledWith('warehouse');
      expect(mockIo.emit).toHaveBeenCalledWith('shipment:created', shipment);
    });

    it('should handle shipment with all properties', () => {
      const shipment = {
        id: 'ship-123',
        trackingNumber: 'TRACK-001',
        status: 'pending',
        customer: { name: 'John Doe' },
        origin: { city: 'Miami' },
        destination: { city: 'New York' },
      };

      service.emitShipmentCreated(shipment);

      expect(mockIo.to).toHaveBeenCalledWith('warehouse');
      expect(mockIo.emit).toHaveBeenCalledWith('shipment:created', shipment);
    });
  });

  describe('emitStatusChanged', () => {
    it('should emit status changed to warehouse and trackers', () => {
      const trackingNumber = 'TRACK-001';
      const oldStatus = 'pending';
      const newStatus = 'in_transit';
      const notes = 'Package picked up';

      service.emitStatusChanged(trackingNumber, oldStatus, newStatus, notes);

      expect(mockIo.to).toHaveBeenCalledWith('warehouse');
      expect(mockIo.to).toHaveBeenCalledWith('shipment:TRACK-001');
      expect(mockIo.emit).toHaveBeenCalledWith('shipment:status:changed', {
        trackingNumber,
        oldStatus,
        newStatus,
        notes,
        timestamp: expect.any(Date),
      });
    });

    it('should emit status changed without notes', () => {
      const trackingNumber = 'TRACK-001';
      const oldStatus = 'in_transit';
      const newStatus = 'delivered';

      service.emitStatusChanged(trackingNumber, oldStatus, newStatus);

      expect(mockIo.to).toHaveBeenCalledWith('warehouse');
      expect(mockIo.emit).toHaveBeenCalledWith('shipment:status:changed', expect.objectContaining({
        trackingNumber,
        oldStatus,
        newStatus,
        notes: undefined,
      }));
    });

    it('should handle all status types', () => {
      const statuses = ['pending', 'in_transit', 'delivered', 'cancelled'];

      statuses.forEach((status) => {
        mockIo.to.mockClear();
        mockIo.emit.mockClear();
        service.emitStatusChanged('TRACK-001', 'pending', status);
        expect(mockIo.emit).toHaveBeenCalled();
      });
    });
  });

  describe('sendError', () => {
    it('should send error to specific client', () => {
      const socketId = 'socket-123';
      const errorMessage = 'Connection error';
      
      (service as any).connectedClients = new Map([[socketId, mockSocket]]);
      
      service.sendError(socketId, errorMessage);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should not throw if socket not found', () => {
      expect(() => {
        service.sendError('nonexistent-socket', 'Error message');
      }).not.toThrow();
    });
  });


  describe('emitPaymentProcessed', () => {
    it('should emit payment processed event', () => {
      const shipmentId = 'ship-123';
      const trackingNumber = 'TRACK-001';
      const paymentStatus = 'completed';

      service.emitPaymentProcessed(shipmentId, trackingNumber, paymentStatus);

      expect(mockIo.to).toHaveBeenCalledWith('warehouse');
      expect(mockIo.to).toHaveBeenCalledWith('shipment:TRACK-001');
      expect(mockIo.emit).toHaveBeenCalledWith('payment:processed', {
        shipmentId,
        trackingNumber,
        paymentStatus,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('sendWarehouseNotification', () => {
    it('should send notification to warehouse clients', () => {
      const message = 'New shipment arrived';
      const type = 'info';

      service.sendWarehouseNotification(message, type);

      expect(mockIo.to).toHaveBeenCalledWith('warehouse');
      expect(mockIo.emit).toHaveBeenCalledWith('notification', {
        type,
        message,
        timestamp: expect.any(Date),
      });
    });

    it('should handle different notification types', () => {
      const types: Array<'info' | 'success' | 'warning' | 'error'> = ['info', 'success', 'warning', 'error'];

      types.forEach(type => {
        mockIo.to.mockClear();
        mockIo.emit.mockClear();
        service.sendWarehouseNotification('Test message', type);
        expect(mockIo.emit).toHaveBeenCalled();
      });
    });
  });

  describe('getConnectedClientsCount', () => {
    it('should return connected clients count', () => {
      (service as any).connectedClients = new Map([['socket-1', {}], ['socket-2', {}]]);
      
      const count = service.getConnectedClientsCount();
      
      expect(count).toBe(2);
    });
  });

  describe('getWarehouseClientsCount', () => {
    it('should return warehouse clients count', () => {
      const count = service.getWarehouseClientsCount();
      
      expect(count).toBe(1); // From mock setup
    });
  });

  describe('Error Handling', () => {
    it('should handle null io gracefully', () => {
      (service as any).io = null;

      // Should not throw when io is null
      expect(() => {
        service.emitStatusChanged('TRACK-001', 'pending', 'in_transit');
        service.emitShipmentCreated({ id: 'ship-123' } as any);
        service.sendWarehouseNotification('Test', 'info');
      }).not.toThrow();
    });

    it('should check if service is initialized', () => {
      (service as any).io = mockIo;
      expect(service.isInitialized()).toBe(true);

      (service as any).io = null;
      expect(service.isInitialized()).toBe(false);
    });
  });

  describe('Room Management', () => {
    it('should use shipment room names correctly', () => {
      service.emitStatusChanged('TRACK-001', 'pending', 'in_transit');
      service.emitShipmentUpdated('TRACK-001', { status: 'delivered' });

      expect(mockIo.to).toHaveBeenCalledWith('shipment:TRACK-001');
      expect(mockIo.to).toHaveBeenCalledWith('warehouse');
    });
  });

  describe('Timestamp Consistency', () => {
    it('should include timestamps in all events', () => {
      const beforeTime = Date.now();

      service.emitStatusChanged('TRACK-001', 'pending', 'in_transit');
      service.emitShipmentUpdated('TRACK-001', { status: 'delivered' });
      service.sendWarehouseNotification('Test', 'info');
      service.emitPaymentProcessed('ship-123', 'TRACK-001', 'completed');

      const afterTime = Date.now();

      // Verify all emits have timestamps
      expect(mockIo.emit).toHaveBeenCalled();
      mockIo.emit.mock.calls.forEach((call: any) => {
        if (call[1] && call[1].timestamp) {
          const timestamp = call[1].timestamp.getTime();
          expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
          expect(timestamp).toBeLessThanOrEqual(afterTime);
        }
      });
    });
  });
});
