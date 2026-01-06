import { ValidationError } from '../exceptions/ValidationError';

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
    if (!data.origin || typeof data.origin !== 'string' || data.origin.trim() === '') {
      throw new ValidationError('El origen es requerido', 'origin', data.origin);
    }

    // Validate destination
    if (!data.destination || typeof data.destination !== 'string' || data.destination.trim() === '') {
      throw new ValidationError('El destino es requerido', 'destination', data.destination);
    }

    // Validate weight
    if (
      data.weight === null ||
      data.weight === undefined ||
      typeof data.weight !== 'number' ||
      isNaN(data.weight) ||
      !isFinite(data.weight)
    ) {
      throw new ValidationError('El peso debe ser un número válido', 'weight', data.weight);
    }

    if (data.weight < 0.1) {
      throw new ValidationError('El peso debe ser mayor a 0.1 kg', 'weight', data.weight);
    }

    if (data.weight > 1000) {
      throw new ValidationError('El peso máximo permitido es 1000 kg', 'weight', data.weight);
    }

    // Validate pickup date
    if (!data.pickupDate || !(data.pickupDate instanceof Date) || isNaN(data.pickupDate.getTime())) {
      throw new ValidationError('La fecha de recolección debe ser una fecha válida', 'pickupDate', data.pickupDate);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickupDate = new Date(data.pickupDate);
    pickupDate.setHours(0, 0, 0, 0);

    if (pickupDate < today) {
      throw new ValidationError('La fecha no puede ser anterior a hoy', 'pickupDate', data.pickupDate);
    }

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);

    if (pickupDate > maxDate) {
      throw new ValidationError('La fecha no puede ser mayor a 30 días', 'pickupDate', data.pickupDate);
    }

    // Validate fragile (optional, but must be boolean if provided)
    if (data.fragile !== undefined && data.fragile !== null && typeof data.fragile !== 'boolean') {
      throw new ValidationError('El campo frágil debe ser true o false', 'fragile', data.fragile);
    }

    this.origin = data.origin.trim();
    this.destination = data.destination.trim();
    this.weight = data.weight;
    this.pickupDate = data.pickupDate;
    this.fragile = data.fragile ?? false;
  }
}
