/**
 * Payment Value Object
 * Immutable representation of a payment
 * Following DDD Value Object pattern
 */

export type PaymentMethod = 'CARD' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type CardType = 'CREDIT' | 'DEBIT';

export interface ICardPayment {
  cardNumber: string; // Last 4 digits only for security
  cardHolderName: string;
  cardType: CardType;
  expirationDate: string; // MM/YY format
}

export interface IPaymentData {
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  cardInfo?: ICardPayment;
  transactionId?: string;
  processedAt?: Date;
  errorMessage?: string;
}

export class Payment {
  private _method: PaymentMethod;
  private _amount: number;
  private _currency: string;
  private _status: PaymentStatus;
  private _cardInfo?: ICardPayment;
  private _transactionId?: string;
  private _processedAt?: Date;
  private _errorMessage?: string;

  constructor(data: IPaymentData) {
    this.validatePayment(data);
    
    this._method = data.method;
    this._amount = data.amount;
    this._currency = data.currency;
    this._status = data.status;
    this._cardInfo = data.cardInfo;
    this._transactionId = data.transactionId;
    this._processedAt = data.processedAt;
    this._errorMessage = data.errorMessage;
  }

  // Getters
  get method(): PaymentMethod { return this._method; }
  get amount(): number { return this._amount; }
  get currency(): string { return this._currency; }
  get status(): PaymentStatus { return this._status; }
  get cardInfo(): ICardPayment | undefined { return this._cardInfo; }
  get transactionId(): string | undefined { return this._transactionId; }
  get processedAt(): Date | undefined { return this._processedAt; }
  get errorMessage(): string | undefined { return this._errorMessage; }

  /**
   * Validate payment data
   */
  private validatePayment(data: IPaymentData): void {
    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (!data.currency || data.currency.length !== 3) {
      throw new Error('Currency must be a valid 3-letter code (e.g., COP, USD)');
    }

    if (data.method === 'CARD' && !data.cardInfo) {
      throw new Error('Card information is required for card payments');
    }

    if (data.cardInfo) {
      this.validateCardInfo(data.cardInfo);
    }
  }

  /**
   * Validate card information
   */
  private validateCardInfo(cardInfo: ICardPayment): void {
    // Validate card number (last 4 digits)
    if (!/^\d{4}$/.test(cardInfo.cardNumber)) {
      throw new Error('Card number must be last 4 digits only');
    }

    // Validate cardholder name
    if (!cardInfo.cardHolderName || cardInfo.cardHolderName.trim().length < 3) {
      throw new Error('Cardholder name must be at least 3 characters');
    }

    // Validate expiration date (MM/YY)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardInfo.expirationDate)) {
      throw new Error('Expiration date must be in MM/YY format');
    }

    // Check if card is not expired
    const [month, year] = cardInfo.expirationDate.split('/');
    const expDate = new Date(2000 + parseInt(year), parseInt(month));
    if (expDate < new Date()) {
      throw new Error('Card has expired');
    }
  }

  /**
   * Luhn Algorithm for card validation
   * Used to validate full card numbers during payment processing
   */
  static validateCardNumberLuhn(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Mark payment as completed
   */
  complete(transactionId: string): Payment {
    return new Payment({
      ...this.toJSON(),
      status: 'COMPLETED',
      transactionId,
      processedAt: new Date(),
    });
  }

  /**
   * Mark payment as failed
   */
  fail(errorMessage: string): Payment {
    return new Payment({
      ...this.toJSON(),
      status: 'FAILED',
      errorMessage,
      processedAt: new Date(),
    });
  }

  /**
   * Convert to plain object
   */
  toJSON(): IPaymentData {
    return {
      method: this._method,
      amount: this._amount,
      currency: this._currency,
      status: this._status,
      cardInfo: this._cardInfo,
      transactionId: this._transactionId,
      processedAt: this._processedAt,
      errorMessage: this._errorMessage,
    };
  }

  /**
   * Check if payment is completed
   */
  isCompleted(): boolean {
    return this._status === 'COMPLETED';
  }

  /**
   * Check if payment failed
   */
  isFailed(): boolean {
    return this._status === 'FAILED';
  }

  /**
   * Get masked card number for display
   */
  getMaskedCardNumber(): string | null {
    if (!this._cardInfo) return null;
    return `**** **** **** ${this._cardInfo.cardNumber}`;
  }
}
