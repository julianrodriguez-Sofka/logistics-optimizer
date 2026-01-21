/**
 * ShipmentRepository Unit Tests
 * Tests shipment repository with MongoDB mocks
 */

import { ShipmentRepository } from '../../../../infrastructure/database/repositories/ShipmentRepository';
import { ShipmentModel } from '../../../../infrastructure/database/schemas/ShipmentSchema';
import { IShipmentData } from '../../../../domain/entities/Shipment';

// Mock MongoDB Model
jest.mock('../../../../infrastructure/database/schemas/ShipmentSchema');
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

describe('ShipmentRepository', () => {
  let repository: ShipmentRepository;
  let mockShipmentModel: jest.Mocked<typeof ShipmentModel>;

  const mockShipment: Partial<IShipmentData> = {
    id: 'ship-123',
    trackingNumber: 'TRACK-001',
    currentStatus: 'IN_TRANSIT',
    statusHistory: [],
    customer: {
      id: 'cust-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '3001234567',
      documentType: 'CC',
      documentNumber: '1234567890',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ShipmentRepository();
    mockShipmentModel = ShipmentModel as jest.Mocked<typeof ShipmentModel>;
  });

  describe('create', () => {
    it('should create a new shipment successfully', async () => {
      const savedDoc = {
        ...mockShipment,
        id: 'ship-123',
        toJSON: jest.fn().mockReturnValue(mockShipment),
        populate: jest.fn().mockReturnThis(),
      };
      
      const mockSave = jest.fn().mockResolvedValue(savedDoc);
      
      (mockShipmentModel as any).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.create(mockShipment as IShipmentData);

      expect(result).toEqual(mockShipment);
      expect(mockSave).toHaveBeenCalled();
      expect(savedDoc.populate).toHaveBeenCalledWith('customer');
    });

    it('should handle duplicate tracking number error', async () => {
      const duplicateError = {
        code: 11000,
        keyPattern: { trackingNumber: 1 },
      };

      const mockSave = jest.fn().mockRejectedValue(duplicateError);
      
      (mockShipmentModel as any).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(repository.create(mockShipment as IShipmentData)).rejects.toThrow(
        'Tracking number already exists'
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      const mockSave = jest.fn().mockRejectedValue(dbError);
      
      (mockShipmentModel as any).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(repository.create(mockShipment as IShipmentData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find shipment by id with populated customer', async () => {
      mockShipmentModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          toJSON: () => mockShipment,
        }),
      });

      const result = await repository.findById('ship-123');

      expect(result).toEqual(mockShipment);
      expect(mockShipmentModel.findById).toHaveBeenCalledWith('ship-123');
    });

    it('should return null when shipment not found', async () => {
      mockShipmentModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockShipmentModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(repository.findById('ship-123')).rejects.toThrow('DB error');
    });
  });

  describe('findByTrackingNumber', () => {
    it('should find shipment by tracking number', async () => {
      mockShipmentModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          toJSON: () => mockShipment,
        }),
      });

      const result = await repository.findByTrackingNumber('TRACK-001');

      expect(result).toEqual(mockShipment);
      expect(mockShipmentModel.findOne).toHaveBeenCalledWith({ trackingNumber: 'TRACK-001' });
    });

    it('should return null when not found', async () => {
      mockShipmentModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByTrackingNumber('INVALID');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockShipmentModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(repository.findByTrackingNumber('TRACK-001')).rejects.toThrow('DB error');
    });
  });

  describe('findAll', () => {
    it('should return all shipments with pagination', async () => {
      const mockShipments = [mockShipment];
      mockShipmentModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(
                mockShipments.map(s => ({ toJSON: () => s }))
              ),
            }),
          }),
        }),
      });

      const result = await repository.findAll(1, 10);

      expect(result).toEqual(mockShipments);
    });

    it('should use default pagination', async () => {
      mockShipmentModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await repository.findAll();

      expect(mockShipmentModel.find).toHaveBeenCalled();
    });
  });

  describe('findByStatus', () => {
    it('should find shipments by status', async () => {
      const mockShipments = [mockShipment];
      mockShipmentModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(
                mockShipments.map(s => ({ toJSON: () => s }))
              ),
            }),
          }),
        }),
      });

      const result = await repository.findByStatus('IN_TRANSIT', 1, 10);

      expect(result).toEqual(mockShipments);
      expect(mockShipmentModel.find).toHaveBeenCalledWith({ currentStatus: 'IN_TRANSIT' });
    });

    it('should handle errors', async () => {
      mockShipmentModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(new Error('DB error')),
            }),
          }),
        }),
      });

      await expect(repository.findByStatus('IN_TRANSIT')).rejects.toThrow('DB error');
    });
  });

  describe('findByCustomer', () => {
    it('should find shipments by customer id', async () => {
      const mockShipments = [mockShipment];
      mockShipmentModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(
                mockShipments.map(s => ({ toJSON: () => s }))
              ),
            }),
          }),
        }),
      });

      const result = await repository.findByCustomer('cust-123', 1, 10);

      expect(result).toEqual(mockShipments);
      expect(mockShipmentModel.find).toHaveBeenCalledWith({ customer: 'cust-123' });
    });
  });

  describe('updateStatus', () => {
    it('should update shipment status successfully', async () => {
      const updatedShipment = { ...mockShipment, currentStatus: 'DELIVERED', statusHistory: [{
        status: 'IN_TRANSIT',
        timestamp: expect.any(Date),
      }] };
      
      const shipmentDoc = {
        ...mockShipment,
        currentStatus: 'IN_TRANSIT',
        statusHistory: [],
        save: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        toJSON: jest.fn().mockReturnValue(updatedShipment),
      };
      
      mockShipmentModel.findById = jest.fn().mockResolvedValue(shipmentDoc);

      const result = await repository.updateStatus('ship-123', 'DELIVERED', 'Delivered successfully');

      expect(result).toEqual(updatedShipment);
      expect(shipmentDoc.statusHistory).toHaveLength(1);
      expect(shipmentDoc.save).toHaveBeenCalled();
      expect(shipmentDoc.populate).toHaveBeenCalledWith('customer');
    });

    it('should return null when shipment not found', async () => {
      mockShipmentModel.findById = jest.fn().mockResolvedValue(null);

      const result = await repository.updateStatus('nonexistent', 'DELIVERED');

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('should search shipments by query', async () => {
      const mockShipments = [mockShipment];
      mockShipmentModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(
                mockShipments.map(s => ({ toJSON: () => s }))
              ),
            }),
          }),
        }),
      });

      const result = await repository.search('TRACK', 1, 10);

      expect(result).toEqual(mockShipments);
      expect(mockShipmentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $text: expect.any(Object),
        })
      );
    });
  });

  describe('count', () => {
    it('should count all shipments', async () => {
      mockShipmentModel.countDocuments = jest.fn().mockResolvedValue(42);

      const result = await repository.count();

      expect(result).toBe(42);
    });
  });

  describe('getStatistics', () => {
    it('should return shipment statistics', async () => {
      const mockStats = [
        { _id: 'IN_TRANSIT', count: 10 },
        { _id: 'DELIVERED', count: 20 },
      ];

      mockShipmentModel.aggregate = jest.fn().mockResolvedValue(mockStats);

      const result = await repository.getStatistics();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byStatus');
    });
  });
});
