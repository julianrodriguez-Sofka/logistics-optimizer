/**
 * Quote Service
 * Handles quote requests with robust error handling
 * 
 * Implements:
 * - Facade Pattern: Simplifies complex API interactions
 * - Input Validation: Sanitizes and validates all inputs
 * - Error Handling: Consistent error normalization
 * 
 * Follows SOLID:
 * - Single Responsibility: Only handles quote-related operations
 * - Open/Closed: Extensible via apiService configuration
 */

import type { IQuoteRequest } from '../models/QuoteRequest';
import type { IQuoteResponse } from '../models/Quote';
import { apiService } from './apiService';

/**
 * Input Sanitizer
 * Sanitizes and validates input data before sending to API
 */
class InputSanitizer {
  /**
   * Sanitize string input
   * - Trims whitespace
   * - Removes dangerous characters
   * - Limits length
   */
  static sanitizeString(value: unknown, maxLength: number = 200): string {
    if (typeof value !== 'string') {
      return '';
    }
    
    return value
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  }

  /**
   * Sanitize number input
   * - Ensures it's a valid number
   * - Clamps to min/max range
   */
  static sanitizeNumber(value: unknown, min: number, max: number, defaultValue: number): number {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    
    if (isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }
    
    return Math.min(Math.max(num, min), max);
  }

  /**
   * Sanitize boolean input
   */
  static sanitizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return !!value;
  }

  /**
   * Sanitize date input
   * - Validates date format
   * - Ensures date is in the future
   */
  static sanitizeDate(value: unknown): string {
    let date: Date;
    
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else {
      // Default to tomorrow
      date = new Date();
      date.setDate(date.getDate() + 1);
    }

    // Validate date
    if (isNaN(date.getTime())) {
      date = new Date();
      date.setDate(date.getDate() + 1);
    }

    // Ensure date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      date = new Date();
      date.setDate(date.getDate() + 1);
    }

    return date.toISOString().split('T')[0];
  }
}

/**
 * Quote Request Validator
 * Validates and transforms quote requests
 */
class QuoteRequestValidator {
  /**
   * Validate and sanitize quote request
   */
  static validate(data: Partial<IQuoteRequest>): IQuoteRequest {
    const errors: string[] = [];

    // Sanitize inputs
    const origin = InputSanitizer.sanitizeString(data.origin, 100);
    const destination = InputSanitizer.sanitizeString(data.destination, 100);
    const weight = InputSanitizer.sanitizeNumber(data.weight, 0.1, 1000, 1);
    const pickupDate = InputSanitizer.sanitizeDate(data.pickupDate);
    const fragile = InputSanitizer.sanitizeBoolean(data.fragile);

    // Validate required fields
    if (!origin || origin.length < 3) {
      errors.push('Origen inválido (mínimo 3 caracteres)');
    }

    if (!destination || destination.length < 3) {
      errors.push('Destino inválido (mínimo 3 caracteres)');
    }

    if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
      errors.push('Origen y destino no pueden ser iguales');
    }

    if (weight <= 0) {
      errors.push('Peso debe ser mayor a 0');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }

    return {
      origin,
      destination,
      weight,
      pickupDate,
      fragile,
    };
  }
}

/**
 * Request quotes from the backend API
 * @param data - Quote request data (will be sanitized)
 * @returns Promise with quotes and messages
 * @throws Error if request fails
 */
export async function requestQuotes(data: IQuoteRequest): Promise<IQuoteResponse> {
  try {
    // Validate and sanitize input
    const sanitizedData = QuoteRequestValidator.validate(data);

    // Make API request with retry logic and circuit breaker
    const response = await apiService.post<IQuoteResponse>('/api/quotes', sanitizedData, {
      timeout: 30000, // 30 seconds for quote requests
      retries: 2,
      retryDelay: 1000,
    });

    // Validate response structure
    if (!response || !Array.isArray(response.quotes)) {
      throw new Error('Respuesta inválida del servidor');
    }

    // Ensure all quotes have required fields
    const validQuotes = response.quotes.filter(quote => 
      quote && 
      typeof quote.price === 'number' && 
      typeof quote.providerName === 'string'
    );

    return {
      quotes: validQuotes,
      messages: response.messages || [],
      routeInfo: response.routeInfo,
    };
  } catch (error) {
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error al obtener cotizaciones. Intente de nuevo.');
  }
}

/**
 * Quote Service object for alternative import style
 */
export const quoteService = {
  requestQuotes,
};

export default quoteService;

