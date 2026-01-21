/**
 * CustomerRepository Unit Tests
 * Tests repository pattern implementation with MongoDB mocks
 */

import { CustomerRepository } from '../../../../infrastructure/database/repositories/CustomerRepository';
import { CustomerModel } from '../../../../infrastructure/database/schemas/CustomerSchema';
import { ICustomer } from '../../../../domain/entities/Customer';

// Mock MongoDB Model
jest.mock('../../../../infrastructure/database/schemas/CustomerSchema');
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

describe('CustomerRepository', () => {
  let repository: CustomerRepository;
  let mockCustomerModel: jest.Mocked<typeof CustomerModel>;

  const mockCustomer: ICustomer = {
    id: 'cust-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '3001234567',
    documentType: 'CC',
    documentNumber: '1234567890',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new CustomerRepository();
    mockCustomerModel = CustomerModel as jest.Mocked<typeof CustomerModel>;
  });

  describe('create', () => {
    it('should create a new customer successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue({
        ...mockCustomer,
        toJSON: () => mockCustomer,
      });
      
      (mockCustomerModel as any).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.create(mockCustomer);

      expect(result).toEqual(mockCustomer);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw error for duplicate email', async () => {
      const duplicateError = {
        code: 11000,
        keyPattern: { email: 1 },
      };

      const mockSave = jest.fn().mockRejectedValue(duplicateError);
      
      (mockCustomerModel as any).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(repository.create(mockCustomer)).rejects.toThrow(
        'Customer with this email already exists'
      );
    });

    it('should throw error for duplicate phone', async () => {
      const duplicateError = {
        code: 11000,
        keyPattern: { phone: 1 },
      };

      const mockSave = jest.fn().mockRejectedValue(duplicateError);
      
      (mockCustomerModel as any).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(repository.create(mockCustomer)).rejects.toThrow(
        'Customer with this phone already exists'
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      const mockSave = jest.fn().mockRejectedValue(dbError);
      
      (mockCustomerModel as any).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(repository.create(mockCustomer)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find customer by id', async () => {
      mockCustomerModel.findById = jest.fn().mockResolvedValue({
        toJSON: () => mockCustomer,
      });

      const result = await repository.findById('cust-123');

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerModel.findById).toHaveBeenCalledWith('cust-123');
    });

    it('should return null when customer not found', async () => {
      mockCustomerModel.findById = jest.fn().mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockCustomerModel.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(repository.findById('cust-123')).rejects.toThrow('DB error');
    });
  });

  describe('findByEmail', () => {
    it('should find customer by email (case insensitive)', async () => {
      mockCustomerModel.findOne = jest.fn().mockResolvedValue({
        toJSON: () => mockCustomer,
      });

      const result = await repository.findByEmail('JOHN@EXAMPLE.COM');

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });

    it('should return null when not found', async () => {
      mockCustomerModel.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockCustomerModel.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(repository.findByEmail('test@example.com')).rejects.toThrow('DB error');
    });
  });

  describe('findByDocument', () => {
    it('should find customer by document number', async () => {
      mockCustomerModel.findOne = jest.fn().mockResolvedValue({
        toJSON: () => mockCustomer,
      });

      const result = await repository.findByDocument('1234567890');

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerModel.findOne).toHaveBeenCalledWith({ documentNumber: '1234567890' });
    });

    it('should return null when not found', async () => {
      mockCustomerModel.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findByDocument('invalid');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockCustomerModel.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(repository.findByDocument('1234567890')).rejects.toThrow('DB error');
    });
  });

  describe('update', () => {
    it('should update customer successfully', async () => {
      const updatedData = { name: 'Jane Doe' };
      mockCustomerModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        toJSON: () => ({ ...mockCustomer, ...updatedData }),
      });

      const result = await repository.update('cust-123', updatedData);

      expect(result).toEqual({ ...mockCustomer, ...updatedData });
      expect(mockCustomerModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'cust-123',
        expect.objectContaining({ $set: updatedData }),
        expect.any(Object)
      );
    });

    it('should return null when customer not found', async () => {
      mockCustomerModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const result = await repository.update('nonexistent', { name: 'New Name' });

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockCustomerModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(repository.update('cust-123', { name: 'New' })).rejects.toThrow('DB error');
    });
  });

  describe('delete', () => {
    it('should delete customer successfully', async () => {
      mockCustomerModel.findByIdAndDelete = jest.fn().mockResolvedValue({
        toJSON: () => mockCustomer,
      });

      const result = await repository.delete('cust-123');

      expect(result).toBe(true);
      expect(mockCustomerModel.findByIdAndDelete).toHaveBeenCalledWith('cust-123');
    });

    it('should return false when customer not found', async () => {
      mockCustomerModel.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const result = await repository.delete('nonexistent');

      expect(result).toBe(false);
    });

    it('should handle errors', async () => {
      mockCustomerModel.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(repository.delete('cust-123')).rejects.toThrow('DB error');
    });
  });

  describe('findAll', () => {
    it('should return paginated customers with default values', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(
              mockCustomers.map(c => ({ toJSON: () => c }))
            ),
          }),
        }),
      });

      const result = await repository.findAll();

      expect(result).toEqual(mockCustomers);
      expect(mockCustomerModel.find).toHaveBeenCalled();
    });

    it('should return paginated customers with custom pagination', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(
              mockCustomers.map(c => ({ toJSON: () => c }))
            ),
          }),
        }),
      });

      const result = await repository.findAll(2, 5);

      expect(result).toEqual(mockCustomers);
    });

    it('should handle errors', async () => {
      mockCustomerModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      });

      await expect(repository.findAll()).rejects.toThrow('DB error');
    });
  });

  describe('search', () => {
    it('should search customers by query', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(
              mockCustomers.map(c => ({ toJSON: () => c }))
            ),
          }),
        }),
      });

      const result = await repository.search('John', 1, 10);

      expect(result).toEqual(mockCustomers);
      expect(mockCustomerModel.find).toHaveBeenCalledWith(expect.objectContaining({
        $or: expect.any(Array),
      }));
    });

    it('should search with default pagination', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(
              mockCustomers.map(c => ({ toJSON: () => c }))
            ),
          }),
        }),
      });

      const result = await repository.search('Doe');

      expect(result).toEqual(mockCustomers);
    });

    it('should handle errors during search', async () => {
      mockCustomerModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Search error')),
          }),
        }),
      });

      await expect(repository.search('John')).rejects.toThrow('Search error');
    });
  });
});
