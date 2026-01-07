import { QuoteValidationRules } from './QuoteValidationRules';

/**
 * Form errors interface
 */
export interface FormErrors {
  origin?: string;
  destination?: string;
  weight?: string;
  pickupDate?: string;
  fragile?: string;
}

/**
 * Centralized validator for quote requests
 * Implements Single Responsibility Principle
 * Validates individual fields and complete forms
 */
export class QuoteValidator {
  /**
   * Validate a single field by name and value
   */
  static validateField(fieldName: string, value: string | number | boolean): string | undefined {
    switch (fieldName) {
      case 'origin':
        return QuoteValidationRules.validateOrigin(value as string);
      case 'destination':
        return QuoteValidationRules.validateDestination(value as string);
      case 'weight':
        return QuoteValidationRules.validateWeight(value as number);
      case 'pickupDate':
        return QuoteValidationRules.validatePickupDate(value as string);
      case 'fragile':
        return QuoteValidationRules.validateFragile(value as boolean);
      default:
        return undefined;
    }
  }

  /**
   * Validate all fields in a form
   */
  static validateForm(formData: {
    origin: string;
    destination: string;
    weight: string | number;
    pickupDate: string;
    fragile: boolean;
  }): FormErrors {
    const errors: FormErrors = {};

    const originError = this.validateField('origin', formData.origin);
    if (originError) errors.origin = originError;

    const destinationError = this.validateField('destination', formData.destination);
    if (destinationError) errors.destination = destinationError;

    const weightError = this.validateField('weight', formData.weight);
    if (weightError) errors.weight = weightError;

    const dateError = this.validateField('pickupDate', formData.pickupDate);
    if (dateError) errors.pickupDate = dateError;

    const fragileError = this.validateField('fragile', formData.fragile);
    if (fragileError) errors.fragile = fragileError;

    return errors;
  }

  /**
   * Check if form has any errors
   */
  static hasErrors(errors: FormErrors): boolean {
    return Object.values(errors).some(error => error !== undefined);
  }

  /**
   * Check if form is valid (no errors and all required fields are filled)
   */
  static isFormValid(formData: {
    origin: string;
    destination: string;
    weight: string | number;
    pickupDate: string;
    fragile: boolean;
  }): boolean {
    // Check for required fields
    if (
      formData.origin.trim() === '' ||
      formData.destination.trim() === '' ||
      formData.weight === '' ||
      formData.pickupDate === ''
    ) {
      return false;
    }

    // Validate all fields
    const errors = this.validateForm(formData);
    return !this.hasErrors(errors);
  }
}
