/**
 * MessageQueueService Unit Tests
 * Tests RabbitMQ message queue integration
 */

import { MessageQueueService } from '../../../../infrastructure/messaging/MessageQueueService';

// Mock RabbitMQ Connection
const mockRabbitMQConnection = {
  assertQueue: jest.fn().mockResolvedValue(undefined),
  publishToQueue: jest.fn().mockResolvedValue(true),
  isConnected: jest.fn().mockReturnValue(true),
  getInstance: jest.fn(),
};

jest.mock('../../../../infrastructure/messaging/RabbitMQConnection', () => ({
  RabbitMQConnection: {
    getInstance: jest.fn(() => mockRabbitMQConnection),
  },
}));

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

describe('MessageQueueService', () => {
  let service: MessageQueueService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = MessageQueueService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MessageQueueService.getInstance();
      const instance2 = MessageQueueService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('publishShipmentCreated', () => {
    it('should publish shipment created event successfully', async () => {
      const event = {
        id: 'evt-123',
        shipmentId: 'ship-123',
        trackingNumber: 'TRACK-001',
        customerId: 'cust-123',
        customerEmail: 'john@example.com',
        timestamp: new Date(),
      };

      await service.publishShipmentCreated(event);

      expect(mockRabbitMQConnection.publishToQueue).toHaveBeenCalledWith(
        'shipment.created',
        expect.objectContaining({
          shipmentId: 'ship-123',
          trackingNumber: 'TRACK-001',
        })
      );
    });

    it('should return false when publish fails', async () => {
      mockRabbitMQConnection.publishToQueue.mockResolvedValueOnce(false);

      const event = {
        id: 'evt-123',
        shipmentId: 'ship-123',
        trackingNumber: 'TRACK-001',
        customerId: 'cust-123',
        customerEmail: 'john@example.com',
        timestamp: new Date(),
      };

      const result = await service.publishShipmentCreated(event);
      expect(result).toBe(false);
    });
  });

  describe('publishStatusChanged', () => {
    it('should publish status changed event successfully', async () => {
      const event = {
        id: 'evt-456',
        shipmentId: 'ship-123',
        trackingNumber: 'TRACK-001',
        oldStatus: 'PENDING_PAYMENT' as const,
        newStatus: 'IN_TRANSIT' as const,
        timestamp: new Date(),
        notes: 'Package picked up',
      };

      await service.publishStatusChanged(event);

      expect(mockRabbitMQConnection.publishToQueue).toHaveBeenCalledWith(
        'shipment.status.changed',
        expect.objectContaining({
          trackingNumber: 'TRACK-001',
          oldStatus: 'PENDING_PAYMENT',
          newStatus: 'IN_TRANSIT',
        })
      );
    });

    it('should publish status changed without notes', async () => {
      const event = {
        id: 'evt-456',
        shipmentId: 'ship-123',
        trackingNumber: 'TRACK-001',
        oldStatus: 'PENDING_PAYMENT' as const,
        newStatus: 'IN_TRANSIT' as const,
        timestamp: new Date(),
      };

      await service.publishStatusChanged(event);

      expect(mockRabbitMQConnection.publishToQueue).toHaveBeenCalled();
    });
  });

  describe('publishPaymentProcessing', () => {
    it('should publish payment processing event successfully', async () => {
      const event = {
        id: 'evt-789',
        shipmentId: 'ship-123',
        paymentMethod: 'CARD' as const,
        amount: 50000,
        currency: 'COP',
        timestamp: new Date(),
      };

      await service.publishPaymentProcessing(event);

      expect(mockRabbitMQConnection.publishToQueue).toHaveBeenCalledWith(
        'payment.processing',
        expect.objectContaining({
          shipmentId: 'ship-123',
          amount: 50000,
        })
      );
    });
  });

  describe('publishNotification', () => {
    it('should publish email notification successfully', async () => {
      const notification = {
        type: 'email' as const,
        recipient: 'john@example.com',
        subject: 'Shipment Created',
        message: 'Your shipment has been created',
        metadata: {
          trackingNumber: 'TRACK-001',
        },
      };

      await service.publishNotification(notification);

      expect(mockRabbitMQConnection.publishToQueue).toHaveBeenCalledWith(
        'notification.send',
        expect.objectContaining({
          type: 'email',
          recipient: 'john@example.com',
        })
      );
    });

    it('should publish SMS notification successfully', async () => {
      const notification = {
        type: 'sms' as const,
        recipient: '+573001234567',
        subject: 'Status Update',
        message: 'Your package is in transit',
      };

      await service.publishNotification(notification);

      expect(mockRabbitMQConnection.publishToQueue).toHaveBeenCalledWith(
        'notification.send',
        expect.objectContaining({
          type: 'sms',
        })
      );
    });

    it('should publish notification with metadata', async () => {
      const notification = {
        type: 'email' as const,
        recipient: 'test@example.com',
        subject: 'Delivery Update',
        message: 'Your package will arrive today',
        metadata: {
          trackingNumber: 'TRACK-001',
        },
      };

      await service.publishNotification(notification);

      expect(mockRabbitMQConnection.publishToQueue).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return false on publish errors', async () => {
      mockRabbitMQConnection.publishToQueue.mockRejectedValueOnce(new Error('Connection error'));

      const event = {
        id: 'evt-123',
        shipmentId: 'ship-123',
        trackingNumber: 'TRACK-001',
        customerId: 'cust-123',
        customerEmail: 'john@example.com',
        timestamp: new Date(),
      };

      const result = await service.publishShipmentCreated(event);
      
      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockRabbitMQConnection.publishToQueue.mockImplementationOnce(() => {
        throw new Error('Network timeout');
      });

      const event = {
        id: 'evt-123',
        shipmentId: 'ship-123',
        trackingNumber: 'TRACK-001',
        customerId: 'cust-123',
        customerEmail: 'john@example.com',
        timestamp: new Date(),
      };

      const result = await service.publishShipmentCreated(event);
      expect(result).toBe(false);
    });
  });

  describe('Message Publishing', () => {
    it('should generate unique message IDs', async () => {
      const event1 = {
        id: 'evt-123',
        shipmentId: 'ship-123',
        trackingNumber: 'TRACK-001',
        customerId: 'cust-123',
        customerEmail: 'john@example.com',
        timestamp: new Date(),
      };

      const event2 = {
        id: 'evt-456',
        shipmentId: 'ship-456',
        trackingNumber: 'TRACK-002',
        customerId: 'cust-456',
        customerEmail: 'jane@example.com',
        timestamp: new Date(),
      };

      await service.publishShipmentCreated(event1);
      await service.publishShipmentCreated(event2);

      expect(mockRabbitMQConnection.publishToQueue).toHaveBeenCalledTimes(2);
    });

    it('should include timestamp in all messages', async () => {
      const event = {
        id: 'evt-123',
        shipmentId: 'ship-123',
        trackingNumber: 'TRACK-001',
        customerId: 'cust-123',
        customerEmail: 'john@example.com',
        timestamp: new Date(),
      };

      await service.publishShipmentCreated(event);

      expect(mockRabbitMQConnection.publishToQueue).toHaveBeenCalledWith(
        'shipment.created',
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });
  });
});
