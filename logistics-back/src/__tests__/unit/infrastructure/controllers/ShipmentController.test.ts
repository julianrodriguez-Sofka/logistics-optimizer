/**
 * Unit tests for ShipmentController
 * Tests all HTTP endpoints for shipment management
 */

import { Request, Response } from 'express';
import { ShipmentController } from '../../../../infrastructure/controllers/ShipmentController';
import { Logger } from '../../../../infrastructure/logging/Logger';

// Mock Logger
jest.mock('../../../../infrastructure/logging/Logger', () => ({
  Logger: {
    getInstance: () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    }),
  },
}));

// Mock ShipmentService
jest.mock('../../../../application/services/ShipmentService');
jest.mock('../../../../infrastructure/database/repositories/ShipmentRepository');
jest.mock('../../../../infrastructure/database/repositories/CustomerRepository');

describe('ShipmentController', () => {
  let controller: ShipmentController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockService: any;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    controller = new ShipmentController();
    mockService = (controller as any).shipmentService;
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    
    jest.clearAllMocks();
  });

  describe('createShipment', () => {
    const validShipmentData = {
      address: {
        origin: 'Calle 123, Bogotá',
        destination: 'Carrera 45, Medellín',
      },
      customer: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
      },
    };

    it('should create shipment successfully', async () => {
      mockRequest.body = validShipmentData;
      const mockShipment = { id: 'shipment-123', ...validShipmentData };
      mockService.createShipment = jest.fn().mockResolvedValue(mockShipment);

      await controller.createShipment(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Shipment created successfully',
        data: mockShipment,
      });
    });

    it('should handle validation errors', async () => {
      mockRequest.body = validShipmentData;
      mockService.createShipment = jest.fn().mockRejectedValue(new Error('Invalid address'));

      await controller.createShipment(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid address',
      });
    });

    it('should handle service errors', async () => {
      mockRequest.body = validShipmentData;
      mockService.createShipment = jest.fn().mockRejectedValue(new Error('Database error'));

      await controller.createShipment(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('getAllShipments', () => {
    it('should get all shipments with default pagination', async () => {
      const mockResult = {
        shipments: [{ id: '1' }, { id: '2' }],
        pagination: { page: 1, limit: 20, total: 2 },
      };
      mockService.getAllShipments = jest.fn().mockResolvedValue(mockResult);

      await controller.getAllShipments(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAllShipments).toHaveBeenCalledWith(1, 20);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should handle custom pagination', async () => {
      mockRequest.query = { page: '2', limit: '10' };
      const mockResult = { shipments: [], pagination: { page: 2, limit: 10, total: 0 } };
      mockService.getAllShipments = jest.fn().mockResolvedValue(mockResult);

      await controller.getAllShipments(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAllShipments).toHaveBeenCalledWith(2, 10);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should handle service errors', async () => {
      mockService.getAllShipments = jest.fn().mockRejectedValue(new Error('DB error'));

      await controller.getAllShipments(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve shipments',
      });
    });
  });

  describe('getShipmentById', () => {
    it('should return shipment when found', async () => {
      mockRequest.params = { id: 'shipment-123' };
      const mockShipment = { id: 'shipment-123', status: 'pending' };
      mockService.getShipmentById = jest.fn().mockResolvedValue(mockShipment);

      await controller.getShipmentById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockShipment,
      });
    });

    it('should return 404 when shipment not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockService.getShipmentById = jest.fn().mockResolvedValue(null);

      await controller.getShipmentById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Shipment not found',
      });
    });

    it('should handle service errors', async () => {
      mockRequest.params = { id: 'shipment-123' };
      mockService.getShipmentById = jest.fn().mockRejectedValue(new Error('DB error'));

      await controller.getShipmentById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve shipment',
      });
    });
  });

  describe('getShipmentByTrackingNumber', () => {
    it('should return shipment when found', async () => {
      mockRequest.params = { trackingNumber: 'TRK123456' };
      const mockShipment = { id: 'shipment-123', trackingNumber: 'TRK123456' };
      mockService.getShipmentByTrackingNumber = jest.fn().mockResolvedValue(mockShipment);

      await controller.getShipmentByTrackingNumber(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockShipment,
      });
    });

    it('should return 404 when not found', async () => {
      mockRequest.params = { trackingNumber: 'INVALID' };
      mockService.getShipmentByTrackingNumber = jest.fn().mockResolvedValue(null);

      await controller.getShipmentByTrackingNumber(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Shipment not found',
      });
    });
  });

  describe('getShipmentsByStatus', () => {
    it('should return shipments by status', async () => {
      mockRequest.params = { status: 'pending' };
      const mockShipments = { shipments: [{ id: '1', status: 'pending' }], total: 1 };
      mockService.getShipmentsByStatus = jest.fn().mockResolvedValue(mockShipments);

      await controller.getShipmentsByStatus(mockRequest as Request, mockResponse as Response);

      expect(mockService.getShipmentsByStatus).toHaveBeenCalledWith('pending', 1, 20);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should handle pagination parameters', async () => {
      mockRequest.params = { status: 'delivered' };
      mockRequest.query = { page: '3', limit: '50' };
      mockService.getShipmentsByStatus = jest.fn().mockResolvedValue({ shipments: [], total: 0 });

      await controller.getShipmentsByStatus(mockRequest as Request, mockResponse as Response);

      expect(mockService.getShipmentsByStatus).toHaveBeenCalledWith('delivered', 3, 50);
    });
  });

  describe('getShipmentsByCustomer', () => {
    it('should return shipments by customer', async () => {
      mockRequest.params = { customerId: 'customer-123' };
      const mockShipments = { shipments: [{ id: '1' }], total: 1 };
      mockService.getShipmentsByCustomer = jest.fn().mockResolvedValue(mockShipments);

      await controller.getShipmentsByCustomer(mockRequest as Request, mockResponse as Response);

      expect(mockService.getShipmentsByCustomer).toHaveBeenCalledWith('customer-123', 1, 20);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      mockRequest.params = { customerId: 'customer-123' };
      mockService.getShipmentsByCustomer = jest.fn().mockRejectedValue(new Error('Not found'));

      await controller.getShipmentsByCustomer(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('updateShipmentStatus', () => {
    it('should update status successfully', async () => {
      mockRequest.params = { id: 'shipment-123' };
      mockRequest.body = { status: 'in_transit', notes: 'Package picked up' };
      const mockUpdated = { id: 'shipment-123', status: 'in_transit' };
      mockService.updateShipmentStatus = jest.fn().mockResolvedValue(mockUpdated);

      await controller.updateShipmentStatus(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateShipmentStatus).toHaveBeenCalledWith(
        'shipment-123',
        'in_transit',
        'Package picked up'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Status updated successfully',
        data: mockUpdated,
      });
    });

    it('should return 400 when status is missing', async () => {
      mockRequest.params = { id: 'shipment-123' };
      mockRequest.body = { notes: 'Test' };

      await controller.updateShipmentStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Status is required',
      });
      expect(mockService.updateShipmentStatus).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockRequest.params = { id: 'shipment-123' };
      mockRequest.body = { status: 'delivered' };
      mockService.updateShipmentStatus = jest.fn().mockRejectedValue(new Error('Invalid status'));

      await controller.updateShipmentStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid status',
      });
    });
  });

  describe('searchShipments', () => {
    it('should search shipments successfully', async () => {
      mockRequest.query = { q: 'Bogotá' };
      const mockResults = { shipments: [{ id: '1' }], total: 1 };
      mockService.searchShipments = jest.fn().mockResolvedValue(mockResults);

      await controller.searchShipments(mockRequest as Request, mockResponse as Response);

      expect(mockService.searchShipments).toHaveBeenCalledWith('Bogotá', 1, 20);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when query is missing', async () => {
      mockRequest.query = {};

      await controller.searchShipments(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Search query is required',
      });
      expect(mockService.searchShipments).not.toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return statistics successfully', async () => {
      const mockStats = { total: 100, pending: 20, delivered: 70, cancelled: 10 };
      mockService.getStatistics = jest.fn().mockResolvedValue(mockStats);

      await controller.getStatistics(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should handle errors', async () => {
      mockService.getStatistics = jest.fn().mockRejectedValue(new Error('DB error'));

      await controller.getStatistics(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve statistics',
      });
    });
  });

  describe('cancelShipment', () => {
    it('should cancel shipment successfully', async () => {
      mockRequest.params = { id: 'shipment-123' };
      mockRequest.body = { reason: 'Customer requested cancellation' };
      const mockCancelled = { id: 'shipment-123', status: 'cancelled' };
      mockService.cancelShipment = jest.fn().mockResolvedValue(mockCancelled);

      await controller.cancelShipment(mockRequest as Request, mockResponse as Response);

      expect(mockService.cancelShipment).toHaveBeenCalledWith(
        'shipment-123',
        'Customer requested cancellation'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Shipment cancelled successfully',
        data: mockCancelled,
      });
    });

    it('should return 400 when reason is missing', async () => {
      mockRequest.params = { id: 'shipment-123' };
      mockRequest.body = {};

      await controller.cancelShipment(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Cancellation reason is required',
      });
      expect(mockService.cancelShipment).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockRequest.params = { id: 'shipment-123' };
      mockRequest.body = { reason: 'Test' };
      mockService.cancelShipment = jest.fn().mockRejectedValue(new Error('Cannot cancel delivered shipment'));

      await controller.cancelShipment(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });
});
