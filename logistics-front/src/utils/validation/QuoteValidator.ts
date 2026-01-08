// HUMAN REVIEW
/**
 * Se ha hecho un cambio en el validator para que en vez de usar un switch case use
 * un map de funciones, esto con el fin de que a futuro se puedan agregar mas validaciones
 * y que no se dependa de un switch case gigante.
  *
*/


import { QuoteValidationRules } from './QuoteValidationRules';

export interface FormErrors {
  origin?: string;
  destination?: string;
  weight?: string;
  pickupDate?: string;
  fragile?: string;
  [key: string]: string | undefined;
}

type FormFieldValue = string | number | boolean | undefined;

/**
 * Centralized validator for quote requests
 * Validates individual fields and complete forms
 * 
 * To add new fields: just add the validator function to FIELD_VALIDATORS map
 */
export class QuoteValidator {
  /**
   * Map of field validators - add new fields here only
   */
  private static readonly FIELD_VALIDATORS: Record<string, (value: FormFieldValue) => string | undefined> = {
    origin: QuoteValidationRules.validateOrigin,
    destination: QuoteValidationRules.validateDestination,
    weight: QuoteValidationRules.validateWeight,
    pickupDate: QuoteValidationRules.validatePickupDate,
    fragile: QuoteValidationRules.validateFragile,
  };

  /**
   * Validate a single field by name and value
   * Generic approach - no need to modify when adding new fields
   */
  static validateField(fieldName: string, value: FormFieldValue): string | undefined {
    const validator = this.FIELD_VALIDATORS[fieldName];
    return validator ? validator(value) : undefined;
  }

  /**
   * Validate all fields in a form
   * Generic implementation - automatically validates all fields in formData
   */
  static validateForm(formData: Record<string, FormFieldValue>): FormErrors {
    const errors: FormErrors = {};

    Object.entries(formData).forEach(([fieldName, value]) => {
      const error = this.validateField(fieldName, value);
      if (error) {
        errors[fieldName] = error;
      }
    });

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
