/**
 * Legacy validation hooks
 * DEPRECATED: Use QuoteValidator from domain/validation/QuoteValidator instead
 * Kept for backward compatibility during migration
 */

import { QuoteValidator } from '../utils/validation/QuoteValidator';

/**
 * @deprecated Use QuoteValidator.validateField('weight', weight) instead
 */
export function useWeightValidation(weight: number): string | null {
  const error = QuoteValidator.validateField('weight', weight);
  return error || null;
}

/**
 * @deprecated Use QuoteValidator.validateField('pickupDate', date) instead
 */
export function useDateValidation(date: string): string | null {
  const error = QuoteValidator.validateField('pickupDate', date);
  return error || null;
}

/**
 * @deprecated Use QuoteValidator.validateField() instead
 */
export function useRequiredValidation(value: string, fieldName: string): string | null {
  if (!value || value === null || value === undefined || value.trim() === '') {
    return `El ${fieldName} es requerido`;
  }
  return null;
}

