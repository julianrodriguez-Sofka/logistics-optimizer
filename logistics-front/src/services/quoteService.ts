import { IQuoteRequest } from '../domain/models/QuoteRequest';
import { IQuoteResponse } from '../domain/models/Quote';

const API_BASE_URL = 'http://localhost:3000';

/**
 * Request shipping quotes from the backend API
 * @param data - Quote request data
 * @returns Promise with quotes and messages
 * @throws Error if request fails
 */
export const requestQuotes = async (data: IQuoteRequest): Promise<IQuoteResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
};
