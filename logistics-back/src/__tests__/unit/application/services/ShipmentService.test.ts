/**
 * ShipmentService Unit Tests
 * Testing core business logic for shipment management
 */

import { ShipmentService, CreateShipmentRequest } from '../../../../application/services/ShipmentService';
import { Shipment, IShipmentData } from '../../../../domain/entities/Shipment';
import { Customer, ICustomer } from '../../../../domain/entities/Customer';
import { ShipmentStatusType } from '../../../../domain/entities/ShipmentStatus';
import { IShipmentRepository, ICustomerRepository } from '../../../../domain/interfaces/IRepositories';
import { PaymentService, PaymentRequest } from '../../../../application/services/PaymentService';

// Mock repositories
const mockShipmentRepository: jest.Mocked<IShipmentRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByTrackingNumber: jest.fn(),
  findAll: jest.fn(),
  findByStatus: jest.fn(),
  findByCustomer: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  search: jest.fn(),
};

const mockCustomerRepository: jest.Mocked<ICustomerRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  search: jest.fn(),
};

// Mock payment service
jest.mock('../../../../application/services/PaymentService');

// Mock MessageQueueService
jest.mock('../../../../infrastructure/messaging/MessageQueueService', () => ({
  MessageQueueService: {
    getInstance: jest.fn(() => ({
      publishShipmentCreated: jest.fn(),
      publishShipmentUpdated: jest.fn(),
      publishStatusChanged: jest.fn(),
    })),
  },
}));

// Mock WebSocketService
jest.mock('../../../../infrastructure/websocket/WebSocketService', () => ({
  WebSocketService: {
    getInstance: jest.fn(() => ({
      emitShipmentCreated: jest.fn(),
      emitStatusChanged: jest.fn(),
    })),
  },
}));

// Mock Logger
jest.mock('../../../../infrastructure/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    })),
  },
}));

describe('ShipmentService', () => {
  let shipmentService: ShipmentService;
  let mockPaymentService: jest.Mocked<PaymentService>;

  const mockCustomer: ICustomer = {
    id: 'customer123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, Country',
  };

  const mockShipmentData: IShipmentData = {
    id: 'shipment123',
    trackingNumber: 'TRK123456789',
    customer: mockCustomer,
    address: {
      origin: 'San Francisco, CA',
      destination: 'Los Angeles, CA',
      originCoordinates: { lat: 37.7749, lng: -122.4194 },
      destinationCoordinates: { lat: 34.0522, lng: -118.2437 },
    },
    package: {
      weight: 5,
      dimensions: { length: 30, width: 20, height: 10 },
      fragile: false,
      description: 'Electronics',
    },
    pickupDate: new Date('2026-02-01'),
    selectedQuote: {
      provider: 'FedEx',
      price: 29.99,
      estimatedDays: 2,
    },
    payment: {
      method: 'CARD',
      status: 'COMPLETED',
      amount: 29.99,
      cardNumber: '************1234',
    },
    currentStatus: 'PAYMENT_CONFIRMED',
    statusHistory: [],
    estimatedDeliveryDate: new Date('2026-02-03'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    shipmentService = new ShipmentService(mockShipmentRepository, mockCustomerRepository);
    mockPaymentService = (shipmentService as any).paymentService as jest.Mocked<PaymentService>;
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
        amount: 29.99,
        cardDetails: {
          cardNumber: '4532015112830366',
          cardHolder: 'John Doe',
          expiryDate: '12/26',
          cvv: '123',
        },
      },
    };

    it('should create a new shipment with new customer', async () => {
      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerRepository.create.mockResolvedValue(mockCustomer);
      mockPaymentService.processPayment = jest.fn().mockResolvedValue({
        status: 'COMPLETED',
        amount: 29.99,
        method: 'CARD',
        toJSON: () => ({ status: 'COMPLETED', amount: 29.99, method: 'CARD' }),
      });
      mockShipmentRepository.create.mockResolvedValue(mockShipmentData);

      const result = await shipmentService.createShipment(createRequest);

      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(mockCustomer.email);
      expect(mockCustomerRepository.create).toHaveBeenCalled();
      expect(mockPaymentService.processPayment).toHaveBeenCalled();
      expect(mockShipmentRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockShipmentData);
    });

    it('should create shipment with existing customer', async () => {
      mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomer);
      mockPaymentService.processPayment = jest.fn().mockResolvedValue({
        status: 'COMPLETED',
        amount: 29.99,
        method: 'CARD',
        toJSON: () => ({ status: 'COMPLETED', amount: 29.99, method: 'CARD' }),
      });
      mockShipmentRepository.create.mockResolvedValue(mockShipmentData);

      const result = await shipmentService.createShipment(createRequest);

      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(mockCustomer.email);
      expect(mockCustomerRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockShipmentData);
    });

    it('should handle pending payment status', async () => {
      mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomer);
      mockPaymentService.processPayment = jest.fn().mockResolvedValue({
        status: 'PENDING',
        amount: 29.99,
        method: 'CASH',
        toJSON: () => ({ status: 'PENDING', amount: 29.99, method: 'CASH' }),
      });
      mockShipmentRepository.create.mockResolvedValue({
        ...mockShipmentData,
        currentStatus: 'PENDING_PAYMENT',
      });

      const result = await shipmentService.createShipment(createRequest);

      expect(result.currentStatus).toBe('PENDING_PAYMENT');
    });

    it('should throw error for failed payment', async () => {
      mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomer);
      mockPaymentService.processPayment = jest.fn().mockResolvedValue({
        status: 'FAILED',
        amount: 29.99,
        method: 'CARD',
        toJSON: () => ({ status: 'FAILED', amount: 29.99, method: 'CARD' }),
      });

      await expect(shipmentService.createShipment(createRequest)).rejects.toThrow(
        'Cannot create shipment with payment status: FAILED'
      );
    });

    it('should handle errors during creation', async () => {
      mockCustomerRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(shipmentService.createShipment(createRequest)).rejects.toThrow('Database error');
    });
  });

  describe('getShipmentById', () => {
    it('should return shipment by ID', async () => {
      mockShipmentRepository.findById.mockResolvedValue(mockShipmentData);

      const result = await shipmentService.getShipmentById('shipment123');

      expect(mockShipmentRepository.findById).toHaveBeenCalledWith('shipment123');
      expect(result).toEqual(mockShipmentData);
    });

    it('should return null if shipment not found', async () => {
      mockShipmentRepository.findById.mockResolvedValue(null);

      const result = await shipmentService.getShipmentById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockShipmentRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(shipmentService.getShipmentById('shipment123')).rejects.toThrow('Database error');
    });
  });

  describe('getShipmentByTrackingNumber', () => {
    it('should return shipment by tracking number', async () => {
      mockShipmentRepository.findByTrackingNumber.mockResolvedValue(mockShipmentData);

      const result = await shipmentService.getShipmentByTrackingNumber('TRK123456789');

      expect(mockShipmentRepository.findByTrackingNumber).toHaveBeenCalledWith('TRK123456789');
      expect(result).toEqual(mockShipmentData);
    });

    it('should return null if tracking number not found', async () => {
      mockShipmentRepository.findByTrackingNumber.mockResolvedValue(null);

      const result = await shipmentService.getShipmentByTrackingNumber('INVALID');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockShipmentRepository.findByTrackingNumber.mockRejectedValue(new Error('Database error'));

      await expect(shipmentService.getShipmentByTrackingNumber('TRK123456789')).rejects.toThrow('Database error');
    });
  });

  describe('getAllShipments', () => {
    it('should return paginated shipments', async () => {
      const shipments = [mockShipmentData];
      mockShipmentRepository.findAll.mockResolvedValue(shipments);
      mockShipmentRepository.count.mockResolvedValue(50);

      const result = await shipmentService.getAllShipments(1, 20);

      expect(result).toEqual({
        shipments,
        total: 50,
        page: 1,
        totalPages: 3,
      });
      expect(mockShipmentRepository.findAll).toHaveBeenCalledWith(1, 20);
      expect(mockShipmentRepository.count).toHaveBeenCalled();
    });

    it('should use default pagination values', async () => {
      mockShipmentRepository.findAll.mockResolvedValue([]);
      mockShipmentRepository.count.mockResolvedValue(0);

      const result = await shipmentService.getAllShipments();

      expect(mockShipmentRepository.findAll).toHaveBeenCalledWith(1, 20);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should handle errors', async () => {
      mockShipmentRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(shipmentService.getAllShipments()).rejects.toThrow('Database error');
    });
  });

  describe('getShipmentsByStatus', () => {
    it('should return shipments by status', async () => {
      const shipments = [mockShipmentData];
      mockShipmentRepository.findByStatus.mockResolvedValue(shipments);

      const result = await shipmentService.getShipmentsByStatus('IN_TRANSIT', 1, 20);

      expect(mockShipmentRepository.findByStatus).toHaveBeenCalledWith('IN_TRANSIT', 1, 20);
      expect(result).toEqual(shipments);
    });

    it('should use default pagination values', async () => {
      mockShipmentRepository.findByStatus.mockResolvedValue([]);

      await shipmentService.getShipmentsByStatus('DELIVERED');

      expect(mockShipmentRepository.findByStatus).toHaveBeenCalledWith('DELIVERED', 1, 20);
    });

    it('should handle errors', async () => {
      mockShipmentRepository.findByStatus.mockRejectedValue(new Error('Database error'));

      await expect(shipmentService.getShipmentsByStatus('IN_TRANSIT')).rejects.toThrow('Database error');
    });
  });

  describe('getShipmentsByCustomer', () => {
    it('should return shipments by customer', async () => {
      const shipments = [mockShipmentData];
      mockShipmentRepository.findByCustomer.mockResolvedValue(shipments);

      const result = await shipmentService.getShipmentsByCustomer('customer123', 1, 20);

      expect(mockShipmentRepository.findByCustomer).toHaveBeenCalledWith('customer123', 1, 20);
      expect(result).toEqual(shipments);
    });

    it('should use default pagination values', async () => {
      mockShipmentRepository.findByCustomer.mockResolvedValue([]);

      await shipmentService.getShipmentsByCustomer('customer123');

      expect(mockShipmentRepository.findByCustomer).toHaveBeenCalledWith('customer123', 1, 20);
    });

    it('should handle errors', async () => {
      mockShipmentRepository.findByCustomer.mockRejectedValue(new Error('Database error'));

      await expect(shipmentService.getShipmentsByCustomer('customer123')).rejects.toThrow('Database error');
    });
  });

  describe('updateShipmentStatus', () => {
    it('should update shipment status', async () => {
      mockShipmentRepository.findById.mockResolvedValue(mockShipmentData);
      mockShipmentRepository.updateStatus.mockResolvedValue({
        ...mockShipmentData,
        currentStatus: 'IN_TRANSIT',
      });

      const result = await shipmentService.updateShipmentStatus('shipment123', 'IN_TRANSIT', 'Package picked up');

      expect(mockShipmentRepository.findById).toHaveBeenCalledWith('shipment123');
      expect(mockShipmentRepository.updateStatus).toHaveBeenCalledWith('shipment123', 'IN_TRANSIT', 'Package picked up');
      expect(result.currentStatus).toBe('IN_TRANSIT');
    });

    it('should throw error if shipment not found', async () => {
      mockShipmentRepository.findById.mockResolvedValue(null);

      await expect(
        shipmentService.updateShipmentStatus('nonexistent', 'IN_TRANSIT')
      ).rejects.toThrow('Shipment not found');
    });

    it('should throw error if update fails', async () => {
      mockShipmentRepository.findById.mockResolvedValue(mockShipmentData);
      mockShipmentRepository.updateStatus.mockResolvedValue(null);

      await expect(
        shipmentService.updateShipmentStatus('shipment123', 'IN_TRANSIT')
      ).rejects.toThrow('Failed to update shipment status');
    });

    it('should handle errors', async () => {
      mockShipmentRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(
        shipmentService.updateShipmentStatus('shipment123', 'IN_TRANSIT')
      ).rejects.toThrow('Database error');
    });
  });

  describe('searchShipments', () => {
    it('should search shipments by query', async () => {
      const shipments = [mockShipmentData];
      mockShipmentRepository.search.mockResolvedValue(shipments);

      const result = await shipmentService.searchShipments('TRK123');

      expect(mockShipmentRepository.search).toHaveBeenCalledWith('TRK123', 1, 20);
      expect(result).toEqual(shipments);
    });

    it('should handle empty results', async () => {
      mockShipmentRepository.search.mockResolvedValue([]);

      const result = await shipmentService.searchShipments('NOTFOUND');

      expect(result).toEqual([]);
    });

    it('should handle errors', async () => {
      mockShipmentRepository.search.mockRejectedValue(new Error('Search error'));

      await expect(shipmentService.searchShipments('query')).rejects.toThrow('Search error');
    });
  });

  describe('getShipmentStatistics', () => {
    it('should return shipment statistics', async () => {
      mockShipmentRepository.count.mockResolvedValue(100);
      mockShipmentRepository.findByStatus.mockResolvedValue([mockShipmentData]);

      const result = await shipmentService.getShipmentStatistics();

      expect(result).toHaveProperty('totalShipments');
      expect(mockShipmentRepository.count).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockShipmentRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(shipmentService.getShipmentStatistics()).rejects.toThrow('Database error');
    });
  });
});
