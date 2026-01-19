/**
 * Payment Service
 * Handles payment processing and validation
 * Following SOLID principles and Strategy pattern for payment methods
 */

import { Payment, IPaymentData, PaymentMethod } from '../../domain/entities/Payment';
import { Logger } from '../../infrastructure/logging/Logger';
import { MessageQueueService } from '../../infrastructure/messaging/MessageQueueService';

export interface PaymentRequest {
  method: PaymentMethod;
  amount: number;
  currency: string;
  // For card payments
  cardNumber?: string; // Full number for validation, only last 4 stored
  cardHolderName?: string;
  cardType?: 'CREDIT' | 'DEBIT';
  expirationDate?: string; // MM/YY
  cvv?: string; // Not stored, only for validation
}

export class PaymentService {
  private logger = Logger.getInstance();
  private messageQueue = MessageQueueService.getInstance();

  /**
   * Process payment
   */
  async processPayment(request: PaymentRequest, shipmentId: string): Promise<Payment> {
    try {
      this.logger.info('Processing payment', { 
        method: request.method, 
        amount: request.amount,
        shipmentId 
      });

      // Validate payment request
      this.validatePaymentRequest(request);

      // Create payment object with pending status
      const paymentData: IPaymentData = {
        method: request.method,
        amount: request.amount,
        currency: request.currency,
        status: 'PROCESSING',
      };

      // Process based on payment method
      let payment: Payment;
      if (request.method === 'CARD') {
        payment = await this.processCardPayment(request, paymentData);
      } else {
        payment = await this.processCashPayment(paymentData);
      }

      // Publish payment processing event
      await this.messageQueue.publishPaymentProcessing({
        id: this.generateTransactionId(),
        shipmentId,
        paymentMethod: request.method,
        amount: request.amount,
        currency: request.currency,
        timestamp: new Date(),
      });

      this.logger.info('Payment processed successfully', {
        shipmentId,
        transactionId: payment.transactionId,
        status: payment.status,
      });

      return payment;
    } catch (error: any) {
      this.logger.error('Payment processing failed', { 
        shipmentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process card payment
   */
  private async processCardPayment(
    request: PaymentRequest,
    paymentData: IPaymentData
  ): Promise<Payment> {
    if (!request.cardNumber || !request.cardHolderName || !request.expirationDate || !request.cvv) {
      throw new Error('Missing required card information');
    }

    // Validate card number using Luhn algorithm
    if (!Payment.validateCardNumberLuhn(request.cardNumber)) {
      throw new Error('Invalid card number');
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(request.cvv)) {
      throw new Error('Invalid CVV format');
    }

    // Simulate card processing (in production, integrate with payment gateway)
    const transactionId = this.generateTransactionId();
    
    // Store only last 4 digits for security
    const last4Digits = request.cardNumber.slice(-4);

    const completedPaymentData: IPaymentData = {
      ...paymentData,
      status: 'COMPLETED',
      transactionId,
      cardInfo: {
        cardNumber: last4Digits,
        cardHolderName: request.cardHolderName,
        cardType: request.cardType || 'CREDIT',
        expirationDate: request.expirationDate,
      },
      processedAt: new Date(),
    };

    return new Payment(completedPaymentData);
  }

  /**
   * Process cash payment
   */
  private async processCashPayment(paymentData: IPaymentData): Promise<Payment> {
    // Cash payment is marked as pending until physical payment is confirmed
    const transactionId = this.generateTransactionId();

    const completedPaymentData: IPaymentData = {
      ...paymentData,
      status: 'PENDING', // Will be completed when cash is received
      transactionId,
      processedAt: new Date(),
    };

    return new Payment(completedPaymentData);
  }

  /**
   * Confirm cash payment (called when cash is received)
   */
  async confirmCashPayment(transactionId: string): Promise<Payment> {
    try {
      this.logger.info('Confirming cash payment', { transactionId });

      // In a real application, retrieve payment from database and update status
      // For now, we'll create a completed payment
      const completedPaymentData: IPaymentData = {
        method: 'CASH',
        amount: 0, // Would be retrieved from database
        currency: 'COP',
        status: 'COMPLETED',
        transactionId,
        processedAt: new Date(),
      };

      return new Payment(completedPaymentData);
    } catch (error: any) {
      this.logger.error('Error confirming cash payment', { 
        transactionId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PaymentRequest): void {
    if (request.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (!request.currency || request.currency.length !== 3) {
      throw new Error('Invalid currency code');
    }

    if (request.method === 'CARD') {
      if (!request.cardNumber) {
        throw new Error('Card number is required for card payments');
      }
      if (!request.cardHolderName) {
        throw new Error('Card holder name is required');
      }
      if (!request.expirationDate) {
        throw new Error('Expiration date is required');
      }
      if (!request.cvv) {
        throw new Error('CVV is required');
      }
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(transactionId: string, amount: number, reason: string): Promise<boolean> {
    try {
      this.logger.info('Processing refund', { transactionId, amount, reason });

      // In production, integrate with payment gateway for actual refund
      // For now, simulate successful refund

      this.logger.info('Refund processed successfully', { transactionId });
      return true;
    } catch (error: any) {
      this.logger.error('Refund processing failed', { 
        transactionId, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `TXN-${year}${month}${day}-${time}-${random}`;
  }

  /**
   * Validate card number format (basic check)
   */
  private isValidCardFormat(cardNumber: string): boolean {
    // Remove spaces and hyphens
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    // Check if it's 13-19 digits
    return /^\d{13,19}$/.test(cleaned);
  }

  /**
   * Get card brand from number
   */
  getCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'American Express';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    
    return 'Unknown';
  }
}
