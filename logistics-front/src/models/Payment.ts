export type PaymentMethod = 'CARD' | 'CASH';

export type PaymentStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'REFUNDED';

export interface CardInfo {
  lastFourDigits: string;
  cardHolderName: string;
  expirationDate: string;
  cvv?: string;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  cardInfo?: CardInfo;
  processedAt?: Date;
  createdAt?: Date;
}

export interface PaymentFormData {
  method: PaymentMethod;
  amount: number;
  cardNumber?: string;
  cardHolderName?: string;
  expirationDate?: string;
  cvv?: string;
}
