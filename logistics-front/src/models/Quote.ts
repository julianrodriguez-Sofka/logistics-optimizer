/**
 * Quote interface matching backend API contract
 */
export interface IQuote {
  providerId: string;
  providerName: string;
  price: number;
  currency: string;
  minDays: number;
  maxDays: number;
  estimatedDays: number;
  transportMode: string;
  isCheapest: boolean;
  isFastest: boolean;
}

/**
 * Provider message for offline/failed providers
 */
export interface IProviderMessage {
  provider: string;
  message: string;
  error?: string;
}

/**
 * API response from POST /api/quotes
 */
export interface IQuoteResponse {
  quotes: IQuote[];
  messages?: IProviderMessage[];
}
