/**
 * Quote request interface matching backend API contract
 */
export interface IQuoteRequest {
  origin: string;
  destination: string;
  weight: number;
  pickupDate: string; // ISO 8601 date string
  fragile: boolean;
}
