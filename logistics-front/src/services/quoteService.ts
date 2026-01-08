// HUMAN REVIEW

/**
 * Es la fuente de comunicacion de las cotizaciones entre el Frontend y el Backend.
 * Implementa time outs con AbortController para evitar esperas largas en el Frontend.
 * Ademas maneja los errores HTTP y de red, lanzando excepciones con mensajes claros.
 */

import type { IQuoteRequest } from '../models/QuoteRequest';
import type { IQuoteResponse } from '../models/Quote';
import { API } from '../utils/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API.DEFAULT_BASE_URL;
const API_TIMEOUT = API.DEFAULT_TIMEOUT;

/**
 * Request shipping quotes from the backend API
 * @param data - Quote request data
 * @returns Promise with quotes and messages
 * @throws Error if request fails or times out
 */
export const requestQuotes = async (data: IQuoteRequest): Promise<IQuoteResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    return responseData;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
};
