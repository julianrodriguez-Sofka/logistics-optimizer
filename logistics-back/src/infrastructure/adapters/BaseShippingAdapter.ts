import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';
import { Quote } from '../../domain/entities/Quote';


export abstract class BaseShippingAdapter implements IShippingProvider {
  protected readonly MIN_WEIGHT = 0.1;
  protected readonly MAX_WEIGHT = 1000;

  protected validateShippingRequest(weight: number, destination: string): void {

    if (weight < this.MIN_WEIGHT) {
      throw new Error(`Weight must be greater than ${this.MIN_WEIGHT} kg`);
    }

    if (weight > this.MAX_WEIGHT) {
      throw new Error(`Weight must be less than or equal to ${this.MAX_WEIGHT} kg`);
    }

    if (!destination || destination.trim() === '') {
      throw new Error('Destination is required');
    }
  }

  abstract calculateShipping(weight: number, destination: string): Promise<Quote>;

}
