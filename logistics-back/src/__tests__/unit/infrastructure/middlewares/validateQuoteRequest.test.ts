import { Request, Response, NextFunction } from 'express';
import { validateQuoteRequest } from '../../../../infrastructure/middlewares/validateQuoteRequest';
import { ValidationError } from '../../../../domain/exceptions/ValidationError';

describe('validateQuoteRequest middleware - HU-02 Task 2.3', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  // Helper function to get future date string
  const getFutureDate = (daysFromNow: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  };

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      body: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    nextFunction = jest.fn();
  });

  describe('Valid request', () => {
    it('should call next() when request is valid', () => {
      mockRequest.body = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 5.5,
        pickupDate: getFutureDate(5), // 5 days from now
        fragile: false,
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should call next() when fragile is true', () => {
      mockRequest.body = {
        origin: 'Cali',
        destination: 'Barranquilla',
        weight: 10,
        pickupDate: getFutureDate(3), // 3 days from now
        fragile: true,
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('Invalid weight', () => {
    it('should return 400 when weight is below minimum (0.1 kg)', () => {
      mockRequest.body = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 0.05,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'El peso debe ser mayor a 0.1 kg',
        field: 'weight',
        value: 0.05,
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 when weight is above maximum (1000 kg)', () => {
      mockRequest.body = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 1001,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'El peso máximo permitido es 1000 kg',
        field: 'weight',
        value: 1001,
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 when weight is null', () => {
      mockRequest.body = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: null,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Invalid date', () => {
    it('should return 400 when pickupDate is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      mockRequest.body = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 5,
        pickupDate: pastDate,
        fragile: false,
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'La fecha no puede ser anterior a hoy',
          field: 'pickupDate',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 when pickupDate is more than 30 days in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 35); // More clearly over the limit
      const tooFarDate = futureDate.toISOString().split('T')[0];

      mockRequest.body = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 5,
        pickupDate: tooFarDate,
        fragile: false,
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'La fecha no puede ser mayor a 30 días',
          field: 'pickupDate',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Missing required fields', () => {
    it('should return 400 when origin is missing', () => {
      mockRequest.body = {
        origin: '',
        destination: 'Medellín',
        weight: 5,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'El origen es requerido',
        field: 'origin',
        value: '',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 when destination is missing', () => {
      mockRequest.body = {
        origin: 'Bogotá',
        destination: '',
        weight: 5,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'El destino es requerido',
        field: 'destination',
        value: '',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Invalid fragile type', () => {
    it('should return 400 when fragile is not boolean', () => {
      mockRequest.body = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 5,
        pickupDate: getFutureDate(5), // Use future date to avoid date validation error
        fragile: 'yes', // Invalid - should be boolean
      };

      validateQuoteRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'El campo frágil debe ser true o false',
        field: 'fragile',
        value: 'yes',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
