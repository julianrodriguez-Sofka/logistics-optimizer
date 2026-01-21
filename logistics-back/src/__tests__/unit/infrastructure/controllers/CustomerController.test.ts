/**
 * CustomerController Tests
 * Basic tests for customer HTTP endpoints
 */

import { Request, Response } from 'express';
import { CustomerController } from '../../../../infrastructure/controllers/CustomerController';

// Mock dependencies
jest.mock('../../../../infrastructure/database/repositories/CustomerRepository');
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

describe('CustomerController', () => {
  let controller: CustomerController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockRepository: any;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    } as any;

    controller = new CustomerController();
    mockRepository = (controller as any).customerRepository;
    
    jest.clearAllMocks();
  });

  describe('createCustomer - Success Cases', () => {
    it('should handle customer creation request', async () => {
      const validData = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+573001234567',
        documentType: 'CC',
        documentNumber: '1234567890',
      };

      mockRequest.body = validData;
      mockRepository.create = jest.fn().mockResolvedValue({ id: 'customer-123', ...validData });
      
      await controller.createCustomer(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('createCustomer - Error Cases', () => {
    it('should handle invalid customer data', async () => {
      mockRequest.body = { name: 'AB' }; // Too short
      
      await controller.createCustomer(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should handle repository errors', async () => {
      const validData = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+573001234567',
        documentType: 'CC',
        documentNumber: '1234567890',
      };

      mockRequest.body = validData;
      mockRepository.create = jest.fn().mockRejectedValue(new Error('DB Error'));
      
      await controller.createCustomer(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('getAllCustomers', () => {
    it('should get customers with default pagination', async () => {
      mockRequest.query = {};
      mockRepository.findAll = jest.fn().mockResolvedValue([]);
      mockRepository.count = jest.fn().mockResolvedValue(0);
      
      await controller.getAllCustomers(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findAll).toHaveBeenCalledWith(1, 20);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should handle custom pagination', async () => {
      mockRequest.query = { page: '2', limit: '50' };
      mockRepository.findAll = jest.fn().mockResolvedValue([]);
      mockRepository.count = jest.fn().mockResolvedValue(100);
      
      await controller.getAllCustomers(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findAll).toHaveBeenCalledWith(2, 50);
    });

    it('should handle database errors', async () => {
      mockRequest.query = {};
      mockRepository.findAll = jest.fn().mockRejectedValue(new Error('DB Error'));
      
      await controller.getAllCustomers(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getCustomerById', () => {
    it('should get customer by valid id', async () => {
      mockRequest.params = { id: 'customer-123' };
      mockRepository.findById = jest.fn().mockResolvedValue({ id: 'customer-123', name: 'Juan' });
      
      await controller.getCustomerById(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent customer', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockRepository.findById = jest.fn().mockResolvedValue(null);
      
      await controller.getCustomerById(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('updateCustomer', () => {
    it('should update existing customer', async () => {
      mockRequest.params = { id: 'customer-123' };
      mockRequest.body = { name: 'Updated Name' };
      mockRepository.findById = jest.fn().mockResolvedValue({ id: 'customer-123' });
      mockRepository.update = jest.fn().mockResolvedValue({ id: 'customer-123', name: 'Updated Name' });
      
      await controller.updateCustomer(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent customer', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockRequest.body = { name: 'Updated Name' };
      mockRepository.findById = jest.fn().mockResolvedValue(null);
      
      await controller.updateCustomer(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete existing customer', async () => {
      mockRequest.params = { id: 'customer-123' };
      mockRepository.findById = jest.fn().mockResolvedValue({ id: 'customer-123' });
      mockRepository.delete = jest.fn().mockResolvedValue(true);
      
      await controller.deleteCustomer(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent customer', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockRepository.findById = jest.fn().mockResolvedValue(null);
      
      await controller.deleteCustomer(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
    
    it('should handle database errors during deletion', async () => {
      mockRequest.params = { id: 'customer-123' };
      mockRepository.findById = jest.fn().mockResolvedValue({ id: 'customer-123' });
      mockRepository.delete = jest.fn().mockRejectedValue(new Error('DB Error'));
      
      await controller.deleteCustomer(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getCustomerByEmail', () => {
    it('should get customer by valid email', async () => {
      mockRequest.params = { email: 'juan@example.com' };
      const mockCustomer = { id: 'customer-123', email: 'juan@example.com', name: 'Juan Pérez' };
      mockRepository.findByEmail = jest.fn().mockResolvedValue(mockCustomer);
      
      await controller.getCustomerByEmail(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('juan@example.com');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCustomer,
      });
    });

    it('should return 404 when customer not found by email', async () => {
      mockRequest.params = { email: 'nonexistent@example.com' };
      mockRepository.findByEmail = jest.fn().mockResolvedValue(null);
      
      await controller.getCustomerByEmail(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Customer not found',
      });
    });

    it('should handle database errors when finding by email', async () => {
      mockRequest.params = { email: 'test@example.com' };
      mockRepository.findByEmail = jest.fn().mockRejectedValue(new Error('DB Connection Error'));
      
      await controller.getCustomerByEmail(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve customer',
      });
    });
  });

  describe('searchCustomers', () => {
    it('should search customers with query', async () => {
      mockRequest.query = { q: 'Juan', page: '1', limit: '20' };
      const mockResults = {
        customers: [{ id: '1', name: 'Juan Pérez' }, { id: '2', name: 'Juana García' }],
        total: 2,
      };
      mockRepository.search = jest.fn().mockResolvedValue(mockResults);
      
      await controller.searchCustomers(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.search).toHaveBeenCalledWith('Juan', 1, 20);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResults,
      });
    });

    it('should return 400 when query is missing', async () => {
      mockRequest.query = {};
      
      await controller.searchCustomers(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Search query is required',
      });
      expect(mockRepository.search).not.toHaveBeenCalled();
    });

    it('should use default pagination when not provided', async () => {
      mockRequest.query = { q: 'test' };
      mockRepository.search = jest.fn().mockResolvedValue({ customers: [], total: 0 });
      
      await controller.searchCustomers(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.search).toHaveBeenCalledWith('test', 1, 20);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should handle custom pagination', async () => {
      mockRequest.query = { q: 'search', page: '3', limit: '50' };
      mockRepository.search = jest.fn().mockResolvedValue({ customers: [], total: 0 });
      
      await controller.searchCustomers(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.search).toHaveBeenCalledWith('search', 3, 50);
    });

    it('should handle database errors during search', async () => {
      mockRequest.query = { q: 'test' };
      mockRepository.search = jest.fn().mockRejectedValue(new Error('Search failed'));
      
      await controller.searchCustomers(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
        })
      );
    });
  });
});

