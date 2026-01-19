import { VALIDATION } from '../constants';

export interface IValidationRule {
  validate: (value: string | number | boolean) => string | undefined;
}

/**
 * Input sanitization utilities
 */
class InputSanitizer {
  /**
   * Sanitize string input by trimming and removing dangerous characters
   */
  static sanitize(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value
      .trim()
      .slice(0, 200) // Max length
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  }
}

export class QuoteValidationRules {
  private static readonly MIN_ADDRESS_LENGTH = 3;
  private static readonly MAX_ADDRESS_LENGTH = 200;

  /**
   * Validate origin field - must not be empty and have minimum length
   */
  static validateOrigin(origin: string | number | boolean | undefined): string | undefined {
    const sanitized = InputSanitizer.sanitize(origin);
    
    if (!sanitized) {
      return 'El origen es requerido';
    }
    
    if (sanitized.length < QuoteValidationRules.MIN_ADDRESS_LENGTH) {
      return `El origen debe tener al menos ${QuoteValidationRules.MIN_ADDRESS_LENGTH} caracteres`;
    }
    
    if (sanitized.length > QuoteValidationRules.MAX_ADDRESS_LENGTH) {
      return `El origen no puede exceder ${QuoteValidationRules.MAX_ADDRESS_LENGTH} caracteres`;
    }
    
    return undefined;
  }

  /**
   * Validate destination field - must not be empty and different from origin
   */
  static validateDestination(destination: string | number | boolean | undefined): string | undefined {
    const sanitized = InputSanitizer.sanitize(destination);
    
    if (!sanitized) {
      return 'El destino es requerido';
    }
    
    if (sanitized.length < QuoteValidationRules.MIN_ADDRESS_LENGTH) {
      return `El destino debe tener al menos ${QuoteValidationRules.MIN_ADDRESS_LENGTH} caracteres`;
    }
    
    if (sanitized.length > QuoteValidationRules.MAX_ADDRESS_LENGTH) {
      return `El destino no puede exceder ${QuoteValidationRules.MAX_ADDRESS_LENGTH} caracteres`;
    }
    
    return undefined;
  }

  /**
   * Validate weight field - must be between MIN and MAX kg
   */
  static validateWeight(weight: string | number | boolean | undefined): string | undefined {
    let weightNum: number;

    if (typeof weight === 'string') {
      weightNum = Number.parseFloat(weight);
    } else if (typeof weight === 'number') {
      weightNum = weight;
    } else {
      return `El peso debe ser mayor a ${VALIDATION.WEIGHT.MIN} kg`;
    }

    if (Number.isNaN(weightNum) || weightNum <= 0) {
      return `El peso debe ser mayor a ${VALIDATION.WEIGHT.MIN} kg`;
    }

    if (weightNum < VALIDATION.WEIGHT.MIN) {
      return `El peso debe ser mayor a ${VALIDATION.WEIGHT.MIN} kg`;
    }

    if (weightNum > VALIDATION.WEIGHT.MAX) {
      return `El peso máximo permitido es ${VALIDATION.WEIGHT.MAX} kg`;
    }

    return undefined;
  }

  /**
   * Validate pickup date - must be today or future, max 30 days from now
   * Uses string comparison to avoid timezone issues with ISO dates
   */
  static validatePickupDate(date: string | number | boolean | undefined): string | undefined {
    if (typeof date !== 'string' || !date) {
      return 'La fecha es requerida';
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Compare dates as strings (works for YYYY-MM-DD format)
    if (date < todayStr) {
      return 'La fecha no puede ser anterior a hoy';
    }

    // Calculate max date (30 days from now)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + VALIDATION.DATE.MAX_DAYS_AHEAD);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    // Allow up to and including the max date (30 days)
    if (date > maxDateStr) {
      return `La fecha no puede ser mayor a ${VALIDATION.DATE.MAX_DAYS_AHEAD} días`;
    }

    return undefined;
  }

  /**
   * Validate fragile checkbox - just type check (can't be invalid)
   */
  static validateFragile(fragile: string | number | boolean | undefined): string | undefined {
    if (typeof fragile !== 'boolean') {
      return 'El campo frágil debe ser un booleano';
    }
    return undefined;
  }
}
