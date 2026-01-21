/**
 * PaymentService Unit Tests
 * Testing payment processing with real service methods
 */

import { PaymentService, PaymentRequest } from '../../../../application/services/PaymentService';

// Mock dependencies
jest.mock('../../../../infrastructure/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    })),
  },
}));

jest.mock('../../../../infrastructure/messaging/MessageQueueService', () => ({
  MessageQueueService: {
    getInstance: jest.fn(() => ({
      publishPaymentProcessing: jest.fn(),
      publishPaymentCompleted: jest.fn(),
    })),
  },
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;

  const validCardRequest: PaymentRequest = {
    method: 'CARD',
    amount: 100.00,
    currency: 'USD',
    cardNumber: '4532015112830366', // Valid Visa test card
    cardHolderName: 'John Doe',
    cardType: 'CREDIT',
    expirationDate: '12/26',
    cvv: '123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    paymentService = new PaymentService();
  });

  describe('processPayment - Card Payments', () => {
    it('should process valid card payment successfully', async () => {
      const payment = await paymentService.processPayment(validCardRequest, 'shipment123');

      expect(payment.status).toBe('COMPLETED');
      expect(payment.method).toBe('CARD');
      expect(payment.amount).toBe(100.00);
      expect(payment.transactionId).toBeDefined();
      expect(payment.processedAt).toBeDefined();
    });

    it('should store only last 4 digits of card', async () => {
      const payment = await paymentService.processPayment(validCardRequest, 'shipment123');

      expect(payment.cardInfo?.cardNumber).toBe('0366');
      expect(payment.cardInfo?.cardNumber.length).toBe(4);
    });

    it('should throw error for missing card number', async () => {
      const request = { ...validCardRequest, cardNumber: undefined };
      await expect(paymentService.processPayment(request, 'shipment123')).rejects.toThrow();
    });

    it('should throw error for invalid card number', async () => {
      const request = { ...validCardRequest, cardNumber: '1234567890123456' };
      await expect(paymentService.processPayment(request, 'shipment123')).rejects.toThrow('Invalid card number');
    });

    it('should throw error for invalid CVV (too short)', async () => {
      const request = { ...validCardRequest, cvv: '12' };
      await expect(paymentService.processPayment(request, 'shipment123')).rejects.toThrow('Invalid CVV format');
    });

    it('should throw error for invalid CVV (non-numeric)', async () => {
      const request = { ...validCardRequest, cvv: 'abc' };
      await expect(paymentService.processPayment(request, 'shipment123')).rejects.toThrow('Invalid CVV format');
    });

    it('should accept 4-digit CVV', async () => {
      const request = { ...validCardRequest, cvv: '1234' };
      const payment = await paymentService.processPayment(request, 'shipment123');
      expect(payment.status).toBe('COMPLETED');
    });
  });

  describe('processPayment - Cash Payments', () => {
    const validCashRequest: PaymentRequest = {
      method: 'CASH',
      amount: 50.00,
      currency: 'COP',
    };

    it('should process cash payment successfully', async () => {
      const payment = await paymentService.processPayment(validCashRequest, 'shipment123');

      expect(payment.status).toBe('PENDING');
      expect(payment.method).toBe('CASH');
      expect(payment.amount).toBe(50.00);
      expect(payment.transactionId).toBeDefined();
    });

    it('should not have card info for cash payment', async () => {
      const payment = await paymentService.processPayment(validCashRequest, 'shipment123');
      expect(payment.cardInfo).toBeUndefined();
    });
  });

  describe('validatePaymentRequest', () => {
    it('should throw error for zero amount', async () => {
      const request: PaymentRequest = {
        method: 'CASH',
        amount: 0,
        currency: 'USD',
      };
      await expect(paymentService.processPayment(request, 'shipment123')).rejects.toThrow();
    });

    it('should throw error for negative amount', async () => {
      const request: PaymentRequest = {
        method: 'CASH',
        amount: -10,
        currency: 'USD',
      };
      await expect(paymentService.processPayment(request, 'shipment123')).rejects.toThrow();
    });

    it('should throw error for invalid currency format', async () => {
      const request: PaymentRequest = {
        method: 'CASH',
        amount: 100,
        currency: 'US',
      };
      await expect(paymentService.processPayment(request, 'shipment123')).rejects.toThrow();
    });
  });

  describe('Different currencies', () => {
    it('should accept USD currency', async () => {
      const request = { ...validCardRequest, currency: 'USD' };
      const payment = await paymentService.processPayment(request, 'shipment123');
      expect(payment.currency).toBe('USD');
    });

    it('should accept COP currency', async () => {
      const request = { ...validCardRequest, currency: 'COP' };
      const payment = await paymentService.processPayment(request, 'shipment123');
      expect(payment.currency).toBe('COP');
    });
  });

  describe('Different amounts', () => {
    const cashRequest: PaymentRequest = {
      method: 'CASH',
      amount: 100,
      currency: 'USD',
    };

    it('should accept small amounts', async () => {
      const request = { ...cashRequest, amount: 0.01 };
      const payment = await paymentService.processPayment(request, 'shipment123');
      expect(payment.amount).toBe(0.01);
    });

    it('should accept large amounts', async () => {
      const request = { ...cashRequest, amount: 999999.99 };
      const payment = await paymentService.processPayment(request, 'shipment123');
      expect(payment.amount).toBe(999999.99);
    });
  });
});
