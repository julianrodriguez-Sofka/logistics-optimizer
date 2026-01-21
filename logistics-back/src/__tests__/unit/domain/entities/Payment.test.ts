/**
 * Payment Entity Tests
 */

import { Payment, IPaymentData, PaymentMethod, PaymentStatus, CardType } from '../../../../domain/entities/Payment';

describe('Payment Entity', () => {
  const validCardPaymentData: IPaymentData = {
    method: 'CARD' as PaymentMethod,
    amount: 25000,
    currency: 'COP',
    status: 'COMPLETED' as PaymentStatus,
    cardInfo: {
      cardNumber: '4366',
      cardHolderName: 'Juan Pérez',
      cardType: 'CREDIT' as CardType,
      expirationDate: '12/28', // December 2028 - future date
    },
    transactionId: 'PAY-123456',
    processedAt: new Date('2026-01-20T10:00:00'),
  };

  const validCashPaymentData: IPaymentData = {
    method: 'CASH' as PaymentMethod,
    amount: 15000,
    currency: 'COP',
    status: 'PENDING' as PaymentStatus,
    transactionId: 'PAY-789012',
  };

  describe('Constructor and Validation', () => {
    it('should create payment with valid card data', () => {
      const payment = new Payment(validCardPaymentData);
      
      expect(payment).toBeDefined();
      expect(payment.method).toBe('CARD');
      expect(payment.amount).toBe(25000);
      expect(payment.status).toBe('COMPLETED');
    });

    it('should create payment with valid cash data', () => {
      const payment = new Payment(validCashPaymentData);
      
      expect(payment).toBeDefined();
      expect(payment.method).toBe('CASH');
      expect(payment.amount).toBe(15000);
    });

    it('should fail with amount zero', () => {
      const invalidData = { ...validCashPaymentData, amount: 0 };
      
      expect(() => new Payment(invalidData)).toThrow('Payment amount must be greater than 0');
    });

    it('should fail with negative amount', () => {
      const invalidData = { ...validCashPaymentData, amount: -100 };
      
      expect(() => new Payment(invalidData)).toThrow('Payment amount must be greater than 0');
    });

    it('should fail with invalid currency code length', () => {
      const invalidData = { ...validCashPaymentData, currency: 'CO' };
      
      expect(() => new Payment(invalidData)).toThrow('Currency must be a valid 3-letter code');
    });

    it('should fail when CARD payment missing card info', () => {
      const invalidData: IPaymentData = {
        method: 'CARD',
        amount: 25000,
        currency: 'COP',
        status: 'PENDING',
      };
      
      expect(() => new Payment(invalidData)).toThrow('Card information is required for card payments');
    });
  });

  describe('Card Information Validation', () => {
    it('should validate card holder name length', () => {
      const invalidData = {
        ...validCardPaymentData,
        cardInfo: { ...validCardPaymentData.cardInfo!, cardHolderName: 'AB' },
      };
      
      expect(() => new Payment(invalidData)).toThrow('Cardholder name must be at least 3 characters');
    });

    it('should validate expiration date format', () => {
      const invalidData = {
        ...validCardPaymentData,
        cardInfo: { ...validCardPaymentData.cardInfo!, expirationDate: '13/25' },
      };
      
      expect(() => new Payment(invalidData)).toThrow('Expiration date must be in MM/YY format');
    });

    it('should accept valid expiration dates', () => {
      const validDates = ['01/26', '12/30', '06/28'];
      
      validDates.forEach(date => {
        const data = {
          ...validCardPaymentData,
          cardInfo: { ...validCardPaymentData.cardInfo!, expirationDate: date },
        };
        expect(() => new Payment(data)).not.toThrow();
      });
    });
  });

  describe('Getters', () => {
    it('should get payment method', () => {
      const payment = new Payment(validCardPaymentData);
      expect(payment.method).toBe('CARD');
    });

    it('should get payment amount', () => {
      const payment = new Payment(validCardPaymentData);
      expect(payment.amount).toBe(25000);
    });

    it('should get payment currency', () => {
      const payment = new Payment(validCardPaymentData);
      expect(payment.currency).toBe('COP');
    });

    it('should get payment status', () => {
      const payment = new Payment(validCardPaymentData);
      expect(payment.status).toBe('COMPLETED');
    });

    it('should get card info for card payments', () => {
      const payment = new Payment(validCardPaymentData);
      expect(payment.cardInfo).toBeDefined();
      expect(payment.cardInfo?.cardHolderName).toBe('Juan Pérez');
    });

    it('should return undefined card info for cash payments', () => {
      const payment = new Payment(validCashPaymentData);
      expect(payment.cardInfo).toBeUndefined();
    });
  });

  describe('toJSON', () => {
    it('should convert card payment to JSON', () => {
      const payment = new Payment(validCardPaymentData);
      const json = payment.toJSON();
      
      expect(json.method).toBe('CARD');
      expect(json.amount).toBe(25000);
      expect(json.currency).toBe('COP');
      expect(json.status).toBe('COMPLETED');
      expect(json.cardInfo).toBeDefined();
    });

    it('should convert cash payment to JSON', () => {
      const payment = new Payment(validCashPaymentData);
      const json = payment.toJSON();
      
      expect(json.method).toBe('CASH');
      expect(json.amount).toBe(15000);
      expect(json.cardInfo).toBeUndefined();
    });
  });

  describe('Payment Status Types', () => {
    const statuses: PaymentStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'];
    
    statuses.forEach(status => {
      it(`should accept status: ${status}`, () => {
        const data = { ...validCashPaymentData, status };
        expect(() => new Payment(data)).not.toThrow();
      });
    });
  });

  describe('Payment Methods', () => {
    it('should accept CARD payment method', () => {
      const payment = new Payment(validCardPaymentData);
      expect(payment.method).toBe('CARD');
    });

    it('should accept CASH payment method', () => {
      const payment = new Payment(validCashPaymentData);
      expect(payment.method).toBe('CASH');
    });
  });

  describe('Currency Codes', () => {
    const validCurrencies = ['COP', 'USD', 'EUR', 'GBP'];
    
    validCurrencies.forEach(currency => {
      it(`should accept currency: ${currency}`, () => {
        const data = { ...validCashPaymentData, currency };
        expect(() => new Payment(data)).not.toThrow();
      });
    });
  });
});
