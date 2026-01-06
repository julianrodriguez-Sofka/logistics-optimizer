export interface IQuoteData {
  providerId: string;
  providerName: string;
  price: number;
  currency: string;
  minDays: number;
  maxDays: number;
  transportMode: string;
  isCheapest?: boolean;
  isFastest?: boolean;
}

export class Quote {
  public readonly providerId: string;
  public readonly providerName: string;
  public readonly price: number;
  public readonly currency: string;
  public readonly minDays: number;
  public readonly maxDays: number;
  public readonly transportMode: string;
  public isCheapest: boolean;
  public isFastest: boolean;

  constructor(data: IQuoteData) {
    // Validate providerId
    if (!data.providerId || data.providerId.trim() === '') {
      throw new Error('providerId is required');
    }

    // Validate providerName
    if (!data.providerName || data.providerName.trim() === '') {
      throw new Error('providerName is required');
    }

    // Validate price
    if (data.price <= 0) {
      throw new Error('price must be positive');
    }

    // Validate minDays
    if (data.minDays < 0) {
      throw new Error('minDays must be positive');
    }

    // Validate maxDays
    if (data.maxDays < data.minDays) {
      throw new Error('maxDays must be greater than or equal to minDays');
    }

    this.providerId = data.providerId;
    this.providerName = data.providerName;
    this.price = data.price;
    this.currency = data.currency;
    this.minDays = data.minDays;
    this.maxDays = data.maxDays;
    this.transportMode = data.transportMode;
    this.isCheapest = data.isCheapest ?? false;
    this.isFastest = data.isFastest ?? false;
  }

  /**
   * Calculate estimated delivery days as the average of min and max days
   */
  get estimatedDays(): number {
    return Math.round((this.minDays + this.maxDays) / 2);
  }
}
