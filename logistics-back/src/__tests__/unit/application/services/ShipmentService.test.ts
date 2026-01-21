/**
 * ShipmentService Unit Tests
 * Complete test coverage for shipment management business logic
 */

import { ShipmentService, CreateShipmentRequest } from '../../../../application/services/ShipmentService';
import { IShipmentRepository, ICustomerRepository } from '../../../../domain/interfaces/IRepositories';
import { IShipmentData } from '../../../../domain/entities/Shipment';
import { ICustomer } from '../../../../domain/entities/Customer';
import { Quote } from '../../../../domain/entities/Quote';
import { PaymentService } from '../../../../application/services/PaymentService';
import { MessageQueueService } from '../../../../infrastructure/messaging/MessageQueueService';
import { WebSocketService } from '../../../../infrastructure/websocket/WebSocketService';

// Mock dependencies
jest.mock('../../../../application/services/PaymentService');
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

// Create mock instances before importing
const mockMessageQueueInstance = {
  publishShipmentCreated: jest.fn().mockResolvedValue(undefined),
  publishStatusChanged: jest.fn().mockResolvedValue(undefined),
  publishNotification: jest.fn().mockResolvedValue(undefined),
  publishPaymentProcessing: jest.fn().mockResolvedValue(undefined),
};

const mockWebSocketInstance = {
  emitShipmentCreated: jest.fn(),
  emitStatusChanged: jest.fn(),
};

jest.mock('../../../../infrastructure/messaging/MessageQueueService', () => ({
  MessageQueueService: {
    getInstance: jest.fn(() => mockMessageQueueInstance),
  },
}));

jest.mock('../../../../infrastructure/websocket/WebSocketService', () => ({
  WebSocketService: {
    getInstance: jest.fn(() => mockWebSocketInstance),
  },
}));

describe('ShipmentService', () => {
  let shipmentService: ShipmentService;
  let mockShipmentRepository: jest.Mocked<IShipmentRepository>;
  let mockCustomerRepository: jest.Mocked<ICustomerRepository>;
  let mockPaymentService: jest.Mocked<PaymentService>;

  const mockCustomer: ICustomer = {
    id: 'cust-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '3001234567',
    documentType: 'CC',
    documentNumber: '1234567890',
  };

  const mockShipmentData: IShipmentData = {
    id: 'ship-123',
    trackingNumber: 'TRACK-001',
    customer: mockCustomer,
    address: {
      origin: 'Bogotá',
      destination: 'Medellín',
      originCoordinates: { lat: 4.6097, lng: -74.0817 },
      destinationCoordinates: { lat: 6.2442, lng: -75.5812 },
    },
    package: {
      weight: 5.5,
      dimensions: { length: 30, width: 20, height: 15 },
      fragile: true,
      description: 'Electronics',
    },
    pickupDate: new Date('2026-02-01'),
    selectedQuote: new Quote({
      providerId: 'fedex',
      providerName: 'FedEx',
      price: 50000,
      currency: 'COP',
      minDays: 2,
      maxDays: 3,
      transportMode: 'AIR',
    }),
    payment: {
      method: 'CARD',
      amount: 50000,
      currency: 'COP',
      status: 'COMPLETED',
    },
    currentStatus: 'PAYMENT_CONFIRMED',
    statusHistory: [],
    estimatedDeliveryDate: new Date('2026-02-03'),
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockShipmentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTrackingNumber: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      findByCustomer: jest.fn(),
      updateStatus: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
      getStatistics: jest.fn(),
    } as any;

    mockCustomerRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    } as any;

    // Create service instance
    shipmentService = new ShipmentService(mockShipmentRepository, mockCustomerRepository);

    // Get mock instances
    mockPaymentService = (shipmentService as any).paymentService;
  });

  describe('createShipment', () => {
    const createRequest: CreateShipmentRequest = {
      customer: mockCustomer,
      address: mockShipmentData.address,
      package: mockShipmentData.package,
      pickupDate: mockShipmentData.pickupDate,
      selectedQuote: mockShipmentData.selectedQuote,
      paymentRequest: {
        method: 'CARD',
        amount: 50000,
        currency: 'COP',
        cardNumber: '4111111111111111',
        cardHolderName: 'John Doe',
        expirationDate: '12/28',
        cvv: '123',
      },
    };

    it('should create shipment with existing customer', async () => {
      // Arrange
      mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomer);
      mockPaymentService.processPayment = jest.fn().mockResolvedValue({
        method: 'CARD',
        amount: 50000,
        currency: 'COP',
        status: 'COMPLETED',
        toJSON: () => ({ method: 'CARD', amount: 50000, currency: 'COP', status: 'COMPLETED' }),
      });
      mockShipmentRepository.create.mockResolvedValue(mockShipmentData);

      // Act
      const result = await shipmentService.createShipment(createRequest);

      // Assert
      expect(result).toEqual(mockShipmentData);
      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(mockCustomer.email);
      expect(mockCustomerRepository.create).not.toHaveBeenCalled();
      expect(mockPaymentService.processPayment).toHaveBeenCalled();
      expect(mockShipmentRepository.create).toHaveBeenCalled();
      expect(mockMessageQueueInstance.publishShipmentCreated).toHaveBeenCalled();
      expect(mockWebSocketInstance.emitShipmentCreated).toHaveBeenCalledWith(mockShipmentData);
    });

    it('should create shipment with new customer', async () => {
      // Arrange
      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerRepository.create.mockResolvedValue(mockCustomer);
      mockPaymentService.processPayment = jest.fn().mockResolvedValue({
        method: 'CARD',
        amount: 50000,
        currency: 'COP',
        status: 'COMPLETED',
        toJSON: () => ({ method: 'CARD', amount: 50000, currency: 'COP', status: 'COMPLETED' }),
      });
      mockShipmentRepository.create.mockResolvedValue(mockShipmentData);

      // Act
      const result = await shipmentService.createShipment(createRequest);

      // Assert
      expect(result).toEqual(mockShipmentData);
      expect(mockCustomerRepository.create).toHaveBeenCalled();
      expect(mockShipmentRepository.create).toHaveBeenCalled();
    });

    it('should create shipment with PENDING_PAYMENT status when payment is pending', async () => {
      // Arrange
      mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomer);
      mockPaymentService.processPayment = jest.fn().mockResolvedValue({
        method: 'CASH',
        amount: 50000,
        currency: 'COP',
        status: 'PENDING',
        toJSON: () => ({ method: 'CASH', amount: 50000, currency: 'COP', status: 'PENDING' }),
      });
      
      const pendingShipment = { ...mockShipmentData, currentStatus: 'PENDING_PAYMENT' as const };
      mockShipmentRepository.create.mockResolvedValue(pendingShipment);

      // Act
      const result = await shipmentService.createShipment(createRequest);

      // Assert
      expect(result.currentStatus).toBe('PENDING_PAYMENT');
    });

    it('should throw error when payment fails', async () => {
      // Arrange
      mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomer);
      mockPaymentService.processPayment = jest.fn().mockResolvedValue({
        status: 'FAILED',
        toJSON: () => ({ status: 'FAILED' }),
      });

      // Act & Assert
      await expect(shipmentService.createShipment(createRequest)).rejects.toThrow(
        'Cannot create shipment with payment status: FAILED'
      );
    });

    it('should handle errors during shipment creation', async () => {
      // Arrange
      mockCustomerRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(shipmentService.createShipment(createRequest)).rejects.toThrow('Database error');
    });
  });

  describe('getShipmentById', () => {
    it('should return shipment when found', async () => {
      // Arrange
      mockShipmentRepository.findById.mockResolvedValue(mockShipmentData);

      // Act
      const result = await shipmentService.getShipmentById('ship-123');

      // Assert
      expect(result).toEqual(mockShipmentData);
      expect(mockShipmentRepository.findById).toHaveBeenCalledWith('ship-123');
    });

    it('should return null when shipment not found', async () => {
      // Arrange
      mockShipmentRepository.findById.mockResolvedValue(null);

      // Act
      const result = await shipmentService.getShipmentById('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      // Arrange
      mockShipmentRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(shipmentService.getShipmentById('ship-123')).rejects.toThrow('Database error');
    });
  });

  describe('getShipmentByTrackingNumber', () => {
    it('should return shipment when found', async () => {
      // Arrange
      mockShipmentRepository.findByTrackingNumber.mockResolvedValue(mockShipmentData);

      // Act
      const result = await shipmentService.getShipmentByTrackingNumber('TRACK-001');

      // Assert
      expect(result).toEqual(mockShipmentData);
      expect(mockShipmentRepository.findByTrackingNumber).toHaveBeenCalledWith('TRACK-001');
    });

    it('should return null when not found', async () => {
      // Arrange
      mockShipmentRepository.findByTrackingNumber.mockResolvedValue(null);

      // Act
      const result = await shipmentService.getShipmentByTrackingNumber('INVALID');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      // Arrange
      mockShipmentRepository.findByTrackingNumber.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(shipmentService.getShipmentByTrackingNumber('TRACK-001')).rejects.toThrow();
    });
  });

  describe('getAllShipments', () => {
    it('should return paginated shipments', async () => {
      // Arrange
      const mockShipments = [mockShipmentData];
      mockShipmentRepository.findAll.mockResolvedValue(mockShipments);
      mockShipmentRepository.count.mockResolvedValue(100);

      // Act
      const result = await shipmentService.getAllShipments(1, 20);

      // Assert
      expect(result).toEqual({
        shipments: mockShipments,
        total: 100,
        page: 1,
        totalPages: 5,
      });
      expect(mockShipmentRepository.findAll).toHaveBeenCalledWith(1, 20);
      expect(mockShipmentRepository.count).toHaveBeenCalled();
    });

    it('should use default pagination', async () => {
      // Arrange
      mockShipmentRepository.findAll.mockResolvedValue([]);
      mockShipmentRepository.count.mockResolvedValue(0);

      // Act
      await shipmentService.getAllShipments();

      // Assert
      expect(mockShipmentRepository.findAll).toHaveBeenCalledWith(1, 20);
    });

    it('should handle errors', async () => {
      // Arrange
      mockShipmentRepository.findAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(shipmentService.getAllShipments()).rejects.toThrow('Database error');
    });
  });

  describe('getShipmentsByStatus', () => {
    it('should return shipments by status', async () => {
      // Arrange
      const mockShipments = [mockShipmentData];
      mockShipmentRepository.findByStatus.mockResolvedValue(mockShipments);

      // Act
      const result = await shipmentService.getShipmentsByStatus('IN_TRANSIT', 1, 10);

      // Assert
      expect(result).toEqual(mockShipments);
      expect(mockShipmentRepository.findByStatus).toHaveBeenCalledWith('IN_TRANSIT', 1, 10);
    });

    it('should use default pagination', async () => {
      // Arrange
      mockShipmentRepository.findByStatus.mockResolvedValue([]);

      // Act
      await shipmentService.getShipmentsByStatus('DELIVERED');

      // Assert
      expect(mockShipmentRepository.findByStatus).toHaveBeenCalledWith('DELIVERED', 1, 20);
    });

    it('should handle errors', async () => {
      // Arrange
      mockShipmentRepository.findByStatus.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(shipmentService.getShipmentsByStatus('IN_TRANSIT')).rejects.toThrow();
    });
  });

  describe('getShipmentsByCustomer', () => {
    it('should return shipments by customer', async () => {
      // Arrange
      const mockShipments = [mockShipmentData];
      mockShipmentRepository.findByCustomer.mockResolvedValue(mockShipments);

      // Act
      const result = await shipmentService.getShipmentsByCustomer('cust-123', 1, 10);

      // Assert
      expect(result).toEqual(mockShipments);
      expect(mockShipmentRepository.findByCustomer).toHaveBeenCalledWith('cust-123', 1, 10);
    });

    it('should use default pagination', async () => {
      // Arrange
      mockShipmentRepository.findByCustomer.mockResolvedValue([]);

      // Act
      await shipmentService.getShipmentsByCustomer('cust-123');

      // Assert
      expect(mockShipmentRepository.findByCustomer).toHaveBeenCalledWith('cust-123', 1, 20);
    });

    it('should handle errors', async () => {
      // Arrange
      mockShipmentRepository.findByCustomer.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(shipmentService.getShipmentsByCustomer('cust-123')).rejects.toThrow();
    });
  });

  describe('updateShipmentStatus', () => {
    const updatedShipment = { ...mockShipmentData, currentStatus: 'IN_TRANSIT' as const };

    it('should update shipment status successfully', async () => {
      // Arrange
      mockShipmentRepository.findById.mockResolvedValue(mockShipmentData);
      mockShipmentRepository.updateStatus.mockResolvedValue(updatedShipment);

      // Act
      const result = await shipmentService.updateShipmentStatus('ship-123', 'IN_TRANSIT', 'Package picked up');

      // Assert
      expect(result).toEqual(updatedShipment);
      expect(mockShipmentRepository.updateStatus).toHaveBeenCalledWith('ship-123', 'IN_TRANSIT', 'Package picked up');
      expect(mockMessageQueueInstance.publishStatusChanged).toHaveBeenCalled();
      expect(mockWebSocketInstance.emitStatusChanged).toHaveBeenCalledWith(
        'TRACK-001',
        'PAYMENT_CONFIRMED',
        'IN_TRANSIT',
        'Package picked up'
      );
    });

    it('should throw error when shipment not found', async () => {
      // Arrange
      mockShipmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        shipmentService.updateShipmentStatus('nonexistent', 'IN_TRANSIT')
      ).rejects.toThrow('Shipment not found');
    });

    it('should throw error when update fails', async () => {
      // Arrange
      mockShipmentRepository.findById.mockResolvedValue(mockShipmentData);
      mockShipmentRepository.updateStatus.mockResolvedValue(null);

      // Act & Assert
      await expect(
        shipmentService.updateShipmentStatus('ship-123', 'IN_TRANSIT')
      ).rejects.toThrow('Failed to update shipment status');
    });

    it('should handle errors', async () => {
      // Arrange
      mockShipmentRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        shipmentService.updateShipmentStatus('ship-123', 'IN_TRANSIT')
      ).rejects.toThrow('Database error');
    });
  });

  describe('searchShipments', () => {
    it('should search shipments successfully', async () => {
      // Arrange
      const mockShipments = [mockShipmentData];
      mockShipmentRepository.search.mockResolvedValue(mockShipments);

      // Act
      const result = await shipmentService.searchShipments('TRACK-001', 1, 10);

      // Assert
      expect(result).toEqual(mockShipments);
      expect(mockShipmentRepository.search).toHaveBeenCalledWith('TRACK-001', 1, 10);
    });

    it('should use default pagination', async () => {
      // Arrange
      mockShipmentRepository.search.mockResolvedValue([]);

      // Act
      await shipmentService.searchShipments('query');

      // Assert
      expect(mockShipmentRepository.search).toHaveBeenCalledWith('query', 1, 20);
    });

    it('should handle errors', async () => {
      // Arrange
      mockShipmentRepository.search.mockRejectedValue(new Error('Search error'));

      // Act & Assert
      await expect(shipmentService.searchShipments('query')).rejects.toThrow('Search error');
    });
  });

  describe('getStatistics', () => {
    it('should return shipment statistics', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        byStatus: {
          PENDING_PAYMENT: 10,
          PAYMENT_CONFIRMED: 20,
          IN_TRANSIT: 30,
          DELIVERED: 40,
        },
      };
      mockShipmentRepository.getStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await shipmentService.getStatistics();

      // Assert
      expect(result).toEqual(mockStats);
      expect(mockShipmentRepository.getStatistics).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Arrange
      mockShipmentRepository.getStatistics.mockRejectedValue(new Error('Stats error'));

      // Act & Assert
      await expect(shipmentService.getStatistics()).rejects.toThrow('Stats error');
    });
  });

  describe('cancelShipment', () => {
    const cancellableShipment = { ...mockShipmentData, currentStatus: 'PENDING_PAYMENT' as const };
    const cancelledShipment = { ...mockShipmentData, currentStatus: 'CANCELLED' as const };

    it('should cancel shipment successfully', async () => {
      // Arrange
      mockShipmentRepository.findById.mockResolvedValue(cancellableShipment);
      mockShipmentRepository.updateStatus.mockResolvedValue(cancelledShipment);

      // Act
      const result = await shipmentService.cancelShipment('ship-123', 'Customer request');

      // Assert
      expect(result).toEqual(cancelledShipment);
      expect(mockShipmentRepository.findById).toHaveBeenCalledWith('ship-123');
      expect(mockShipmentRepository.updateStatus).toHaveBeenCalledWith('ship-123', 'CANCELLED', 'Customer request');
    });

    it('should throw error when shipment not found', async () => {
      // Arrange
      mockShipmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        shipmentService.cancelShipment('nonexistent', 'Reason')
      ).rejects.toThrow('Shipment not found');
    });

    it('should throw error when shipment cannot be cancelled', async () => {
      // Arrange
      const deliveredShipment = { ...mockShipmentData, currentStatus: 'DELIVERED' as const };
      mockShipmentRepository.findById.mockResolvedValue(deliveredShipment);

      // Act & Assert
      await expect(
        shipmentService.cancelShipment('ship-123', 'Too late')
      ).rejects.toThrow('Shipment cannot be cancelled in its current state');
    });

    it('should handle errors', async () => {
      // Arrange
      mockShipmentRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        shipmentService.cancelShipment('ship-123', 'Reason')
      ).rejects.toThrow('Database error');
    });
  });
});
