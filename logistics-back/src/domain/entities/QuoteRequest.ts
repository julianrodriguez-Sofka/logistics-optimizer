export interface IQuoteRequestData {
  origin: string;
  destination: string;
  weight: number;
  pickupDate: Date;
  fragile?: boolean;
}

export class QuoteRequest {
  public readonly origin: string;
  public readonly destination: string;
  public readonly weight: number;
  public readonly pickupDate: Date;
  public readonly fragile: boolean;

  constructor(data: IQuoteRequestData) {
    // Validate origin
    if (!data.origin || data.origin.trim() === '') {
      throw new Error('Origin is required');
    }

    // Validate destination
    if (!data.destination || data.destination.trim() === '') {
      throw new Error('Destination is required');
    }

    // Validate weight
    if (data.weight <= 0.1) {
      throw new Error('Weight must be greater than 0.1 kg');
    }

    if (data.weight > 1000) {
      throw new Error('Weight must be less than or equal to 1000 kg');
    }

    // Validate pickup date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickupDate = new Date(data.pickupDate);
    pickupDate.setHours(0, 0, 0, 0);

    if (pickupDate < today) {
      throw new Error('Pickup date cannot be in the past');
    }

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);

    if (pickupDate > maxDate) {
      throw new Error('Pickup date cannot be more than 30 days in the future');
    }

    this.origin = data.origin.trim();
    this.destination = data.destination.trim();
    this.weight = data.weight;
    this.pickupDate = data.pickupDate;
    this.fragile = data.fragile ?? false;
  }
}
