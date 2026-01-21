/**
 * ShipmentService Unit Tests
 * 
 * Tests for the shipment API service that handles
 * creating and retrieving shipments.
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles shipment API calls
 * - Interface Segregation: Focused API
 * - Dependency Inversion: Uses axios (injectable)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { shipmentService } from '../../../services/shipmentService';
import type { CreateShipmentDTO } from '../../../models/Shipment';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('ShipmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createShipment', () => {
    const validShipmentData: CreateShipmentDTO = {
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+573001234567',
        address: 'Calle 123',
        documentType: 'CC',
        documentNumber: '123456789',
      },
      origin: {
        city: 'Bogotá',
        address: 'Calle 1 #2-3',
        postalCode: '110111',
      },
      destination: {
        city: 'Medellín',
        address: 'Carrera 4 #5-6',
        postalCode: '050001',
      },
      package: {
        weight: 10,
        length: 30,
        width: 20,
        height: 15,
        isFragile: true,
        description: 'Electronics',
      },
      selectedQuote: {
        providerId: 'fedex',
        providerName: 'FedEx',
        price: 50000,
        currency: 'COP',
        minDays: 2,
        maxDays: 3,
      },
      pickupDate: new Date('2026-01-25'),
      payment: {
        method: 'CARD',
        amount: 50000,
        cardNumber: '4111111111111111',
        cardHolderName: 'JOHN DOE',
        expirationDate: '12/28',
        cvv: '123',
      },
    };

    it('should create a shipment successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            trackingNumber: 'LOG-2026-001',
            customer: validShipmentData.customer,
            payment: { ...validShipmentData.payment, status: 'COMPLETED' },
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await shipmentService.createShipment(validShipmentData);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('trackingNumber', 'LOG-2026-001');
    });

    it('should transform isFragile to fragile for backend', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { data: {} } });

      await shipmentService.createShipment(validShipmentData);

      const callArgs = mockedAxios.post.mock.calls[0][1];
      expect(callArgs.package).toHaveProperty('fragile', true);
    });

    it('should include currency in payment request', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { data: {} } });

      await shipmentService.createShipment(validShipmentData);

      const callArgs = mockedAxios.post.mock.calls[0][1];
      expect(callArgs.paymentRequest).toHaveProperty('currency', 'COP');
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Network Error';
      mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

      await expect(shipmentService.createShipment(validShipmentData))
        .rejects.toThrow(errorMessage);
    });

    it('should handle validation errors from backend', async () => {
      const validationError = {
        response: {
          data: {
            message: 'Validation failed',
            errors: ['Invalid phone number'],
          },
        },
      };
      mockedAxios.post.mockRejectedValueOnce(validationError);

      await expect(shipmentService.createShipment(validShipmentData))
        .rejects.toThrow();
    });

    it('should handle cash payment without card details', async () => {
      const cashPaymentData: CreateShipmentDTO = {
        ...validShipmentData,
        payment: {
          method: 'CASH',
          amount: 50000,
        },
      };

      mockedAxios.post.mockResolvedValueOnce({ data: { data: {} } });

      await shipmentService.createShipment(cashPaymentData);

      const callArgs = mockedAxios.post.mock.calls[0][1];
      expect(callArgs.paymentRequest.method).toBe('CASH');
      expect(callArgs.paymentRequest.cardNumber).toBeUndefined();
    });
  });

  describe('getShipments', () => {
    it('should fetch shipments successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: '1', trackingNumber: 'LOG-001' },
            { id: '2', trackingNumber: 'LOG-002' },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await shipmentService.getShipments({});

      expect(result.shipments).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should pass query parameters correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [], pagination: { total: 0 } },
      });

      await shipmentService.getShipments({
        limit: 50,
        page: 2,
        status: 'DELIVERED',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 50,
            page: 2,
            status: 'DELIVERED',
          }),
        })
      );
    });

    it('should handle empty response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [], pagination: { total: 0 } },
      });

      const result = await shipmentService.getShipments({});

      expect(result.shipments).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle API errors on fetch', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Server error'));

      await expect(shipmentService.getShipments({}))
        .rejects.toThrow('Server error');
    });

    it('should use default limit when not specified', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [], pagination: { total: 0 } },
      });

      await shipmentService.getShipments({});

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            limit: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('trackShipment', () => {
    it('should fetch shipment by tracking number', async () => {
      const mockShipment = {
        id: '1',
        trackingNumber: 'LOG-TEST-001',
        currentStatus: 'DELIVERED',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockShipment },
      });

      const result = await shipmentService.trackShipment('LOG-TEST-001');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('track/LOG-TEST-001')
      );
      expect(result.trackingNumber).toBe('LOG-TEST-001');
    });

    it('should handle not found error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Shipment not found' } },
        isAxiosError: true,
      });

      await expect(
        shipmentService.trackShipment('INVALID')
      ).rejects.toThrow();
    });
  });

  describe('updateShipmentStatus', () => {
    it('should update shipment status', async () => {
      mockedAxios.put.mockResolvedValueOnce({
        data: {
          data: {
            id: '1',
            currentStatus: 'DELIVERED',
          },
        },
      });

      const result = await shipmentService.updateShipmentStatus(
        '1',
        'DELIVERED',
        'Delivered successfully'
      );

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('1/status'),
        expect.objectContaining({
          status: 'DELIVERED',
          reason: 'Delivered successfully',
        })
      );
      expect(result.currentStatus).toBe('DELIVERED');
    });

    it('should handle invalid status transition', async () => {
      mockedAxios.put.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'Invalid status transition' },
        },
        isAxiosError: true,
      });

      await expect(
        shipmentService.updateShipmentStatus('1', 'PREPARING')
      ).rejects.toThrow();
    });
  });

  describe('getShipmentById', () => {
    it('should fetch shipment by ID', async () => {
      const mockShipment = {
        id: 'ship-123',
        trackingNumber: 'LOG-001',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockShipment },
      });

      const result = await shipmentService.getShipmentById('ship-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('shipments/ship-123')
      );
      expect(result.id).toBe('ship-123');
    });
  });

  describe('cancelShipment', () => {
    it('should cancel a shipment', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            id: '1',
            currentStatus: 'CANCELLED',
          },
        },
      });

      const result = await shipmentService.cancelShipment('1', 'Customer request');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('1/cancel'),
        { reason: 'Customer request' }
      );
      expect(result.currentStatus).toBe('CANCELLED');
    });
  });

  describe('getStatistics', () => {
    it('should fetch shipment statistics', async () => {
      const mockStats = {
        total: 100,
        byStatus: { DELIVERED: 50, IN_TRANSIT: 30 },
        delayed: 5,
        delivered: 50,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockStats },
      });

      const result = await shipmentService.getStatistics();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('statistics')
      );
      expect(result.total).toBe(100);
    });
  });
});
