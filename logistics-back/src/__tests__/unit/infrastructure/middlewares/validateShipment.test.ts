/**
 * ValidateShipment Middleware Tests
 * Tests for shipment validation logic
 */

import { Request, Response, NextFunction } from 'express';
import { validateShipmentCreation } from '../../../../infrastructure/middlewares/validateShipment';

describe('ValidateShipment Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse);
    
    mockRequest = {
      body: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    nextFunction = jest.fn();
  });

  const validShipmentRequest = {
    customer: {
      name: 'Juan Pérez García',
      email: 'juan.perez@example.com',
      phone: '+573001234567',
      documentType: 'CC',
      documentNumber: '1234567890',
    },
    address: {
      origin: 'Calle 123 #45-67, Bogotá',
      destination: 'Carrera 78 #90-12, Medellín',
    },
    package: {
      weight: 5,
      dimensions: {
        length: 30,
        width: 20,
        height: 15,
      },
    },
    pickupDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    selectedQuote: {
      providerId: 'fedex',
      price: 25000,
      estimatedDeliveryDays: 3,
    },
    paymentRequest: {
      method: 'CASH',
      amount: 25000,
    },
  };

  describe('Customer Validation', () => {
    it('should pass with valid customer data', () => {
      mockRequest.body = validShipmentRequest;
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should fail when customer is missing', () => {
      mockRequest.body = { ...validShipmentRequest, customer: undefined };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Customer information is required',
        field: 'customer',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail when customer name is too short', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, name: 'AB' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Customer name must be at least 3 characters',
        field: 'customer.name',
      });
    });

    it('should fail when customer name is empty', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, name: '' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail with invalid email format', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, email: 'invalid-email' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Valid email is required',
        field: 'customer.email',
      });
    });

    it('should fail when email is missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, email: '' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should accept valid phone with +57 prefix', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, phone: '+573001234567' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should accept valid phone without prefix', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, phone: '3001234567' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail with invalid phone format', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, phone: '123' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Valid Colombian phone number is required',
        field: 'customer.phone',
      });
    });

    it('should accept valid document type CC', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, documentType: 'CC' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should accept valid document type CE', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, documentType: 'CE' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should accept valid document type NIT', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, documentType: 'NIT' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should accept valid document type PASSPORT', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, documentType: 'PASSPORT' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail with invalid document type', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, documentType: 'INVALID' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Valid document type is required (CC, CE, NIT, PASSPORT)',
        field: 'customer.documentType',
      });
    });

    it('should fail when document number is too short', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        customer: { ...validShipmentRequest.customer, documentNumber: '1234' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Document number must be at least 5 characters',
        field: 'customer.documentNumber',
      });
    });
  });

  describe('Address Validation', () => {
    it('should pass with valid addresses', () => {
      mockRequest.body = validShipmentRequest;
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail when address is missing', () => {
      mockRequest.body = { ...validShipmentRequest, address: undefined };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Origin and destination addresses are required',
        field: 'address',
      });
    });

    it('should fail when origin is missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        address: { ...validShipmentRequest.address, origin: '' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail when destination is missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        address: { ...validShipmentRequest.address, destination: '' },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('Package Validation', () => {
    it('should pass with valid package data', () => {
      mockRequest.body = validShipmentRequest;
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail when package is missing', () => {
      mockRequest.body = { ...validShipmentRequest, package: undefined };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Package information is required',
        field: 'package',
      });
    });

    it('should fail when weight is zero', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        package: { ...validShipmentRequest.package, weight: 0 },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Package weight must be greater than 0',
        field: 'package.weight',
      });
    });

    it('should fail when weight is negative', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        package: { ...validShipmentRequest.package, weight: -5 },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail when dimensions are missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        package: { weight: 5, dimensions: undefined },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Package dimensions (length, width, height) are required',
        field: 'package.dimensions',
      });
    });

    it('should fail when length is missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        package: {
          weight: 5,
          dimensions: { width: 20, height: 15 },
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail when width is missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        package: {
          weight: 5,
          dimensions: { length: 30, height: 15 },
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail when height is missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        package: {
          weight: 5,
          dimensions: { length: 30, width: 20 },
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('Pickup Date Validation', () => {
    it('should pass with future date', () => {
      mockRequest.body = validShipmentRequest;
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail when pickup date is missing', () => {
      mockRequest.body = { ...validShipmentRequest, pickupDate: undefined };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Pickup date is required',
        field: 'pickupDate',
      });
    });

    it('should fail when pickup date is in the past', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      mockRequest.body = { ...validShipmentRequest, pickupDate: yesterday };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Pickup date cannot be in the past',
        field: 'pickupDate',
      });
    });
  });

  describe('Payment Method Validation', () => {
    it('should pass with CASH payment method', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: { method: 'CASH', amount: 25000 },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should pass with CARD payment method and card details', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardNumber: '4532015112830366',
          cardHolderName: 'Juan Pérez',
          expirationDate: '12/28',
          cvv: '123',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail when payment method is missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: { amount: 25000 },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Valid payment method is required (CARD or CASH)',
        field: 'paymentRequest.method',
      });
    });

    it('should fail with invalid payment method', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: { method: 'BITCOIN', amount: 25000 },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail when payment amount is zero', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: { method: 'CASH', amount: 0 },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Payment amount must be greater than 0',
        field: 'paymentRequest.amount',
      });
    });

    it('should fail when payment amount is negative', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: { method: 'CASH', amount: -100 },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('Card Payment Validation', () => {
    it('should fail when CARD payment missing card number', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardHolderName: 'Juan Pérez',
          expirationDate: '12/28',
          cvv: '123',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Valid card number is required',
        field: 'paymentRequest.cardNumber',
      });
    });

    it('should fail when card number is too short', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardNumber: '123456789',
          cardHolderName: 'Juan Pérez',
          expirationDate: '12/28',
          cvv: '123',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail when card holder name is missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardNumber: '4532015112830366',
          expirationDate: '12/28',
          cvv: '123',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Card holder name is required',
        field: 'paymentRequest.cardHolderName',
      });
    });

    it('should fail when card holder name is too short', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardNumber: '4532015112830366',
          cardHolderName: 'AB',
          expirationDate: '12/28',
          cvv: '123',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail with invalid expiration date format', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardNumber: '4532015112830366',
          cardHolderName: 'Juan Pérez',
          expirationDate: '13/28',
          cvv: '123',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Valid expiration date is required (MM/YY)',
        field: 'paymentRequest.expirationDate',
      });
    });

    it('should fail when CVV is missing', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardNumber: '4532015112830366',
          cardHolderName: 'Juan Pérez',
          expirationDate: '12/28',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Valid CVV is required (3 or 4 digits)',
        field: 'paymentRequest.cvv',
      });
    });

    it('should fail when CVV is invalid format', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardNumber: '4532015112830366',
          cardHolderName: 'Juan Pérez',
          expirationDate: '12/28',
          cvv: '12',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should accept CVV with 3 digits', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardNumber: '4532015112830366',
          cardHolderName: 'Juan Pérez',
          expirationDate: '12/28',
          cvv: '123',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should accept CVV with 4 digits', () => {
      mockRequest.body = {
        ...validShipmentRequest,
        paymentRequest: {
          method: 'CARD',
          amount: 25000,
          cardNumber: '4532015112830366',
          cardHolderName: 'Juan Pérez',
          expirationDate: '12/28',
          cvv: '1234',
        },
      };
      
      validateShipmentCreation(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
