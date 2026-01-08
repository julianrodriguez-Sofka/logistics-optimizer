/**
 * Centralized validation rules for quote requests
 * Implements Single Responsibility Principle
 */

import { VALIDATION } from '../constants';

export interface IValidationRule {
  validate: (value: string | number | boolean) => string | undefined;
}

export class QuoteValidationRules {
  /**
   * Validate origin field - must not be empty
   */
  static validateOrigin(origin: string): string | undefined {
    if (typeof origin === 'string' && origin.trim() === '') {
      return 'El origen es requerido';
    }
    return undefined;
  }

  /**
   * Validate destination field - must not be empty
   */
  static validateDestination(destination: string): string | undefined {
    if (typeof destination === 'string' && destination.trim() === '') {
      return 'El destino es requerido';
    }
    return undefined;
  }

  /**
   * Validate weight field - must be between MIN and MAX kg
   */
  static validateWeight(weight: string | number): string | undefined {
    let weightNum: number;

    if (typeof weight === 'string') {
      weightNum = parseFloat(weight);
    } else {
      weightNum = weight;
    }

    if (isNaN(weightNum) || weightNum <= 0) {
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
  static validatePickupDate(date: string): string | undefined {
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
  static validateFragile(fragile: boolean): string | undefined {
    if (typeof fragile !== 'boolean') {
      return 'El campo frágil debe ser un booleano';
    }
    return undefined;
  }
}
