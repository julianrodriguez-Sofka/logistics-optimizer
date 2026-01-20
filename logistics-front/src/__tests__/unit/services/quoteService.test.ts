import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestQuotes } from '../../../services/quoteService';
import type { IQuoteRequest } from '../../../models/QuoteRequest';

// Helper function to get future date string
const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Mock the apiService module
vi.mock('../../../services/apiService', () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getCircuitState: vi.fn().mockReturnValue('CLOSED'),
  },
}));

import { apiService } from '../../../services/apiService';

describe('quoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('requestQuotes', () => {
    it('should make POST request to /api/quotes with correct payload', async () => {
      const mockResponse = {
        quotes: [
          {
            providerId: 'fedex-ground',
            providerName: 'FedEx',
            price: 85.5,
            currency: 'USD',
            minDays: 3,
            maxDays: 4,
            estimatedDays: 3,
            transportMode: 'Ground',
            isCheapest: true,
            isFastest: true,
          },
        ],
        messages: [],
      };

      vi.mocked(apiService.post).mockResolvedValueOnce(mockResponse);

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: getFutureDate(5), // 5 days from now
        fragile: false,
      };

      const result = await requestQuotes(request);

      expect(apiService.post).toHaveBeenCalledWith(
        '/api/quotes',
        expect.objectContaining({
          origin: request.origin,
          destination: request.destination,
          weight: request.weight,
          fragile: request.fragile,
        }),
        expect.objectContaining({
          timeout: 30000,
          retries: 2,
          retryDelay: 1000,
        })
      );

      expect(result.quotes).toHaveLength(1);
      expect(result.quotes[0].providerName).toBe('FedEx');
    });

    it('should handle 400 validation error response', async () => {
      vi.mocked(apiService.post).mockRejectedValueOnce(new Error('Weight must be > 0.1 kg'));

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 0.05, // Invalid weight below minimum
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      // The validator should catch this before API call
      // Weight gets sanitized to 0.1 minimum, but the API validation catches it
      await expect(requestQuotes(request)).rejects.toThrow();
    });

    it('should handle 503 service unavailable response', async () => {
      vi.mocked(apiService.post).mockRejectedValueOnce(new Error('Service unavailable'));

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      await expect(requestQuotes(request)).rejects.toThrow('Service unavailable');
    });

    it('should handle network errors', async () => {
      vi.mocked(apiService.post).mockRejectedValueOnce(new Error('Network error'));

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      await expect(requestQuotes(request)).rejects.toThrow('Network error');
    });

    it('should return quotes with messages when providers offline', async () => {
      const mockResponse = {
        quotes: [
          {
            providerId: 'fedex-ground',
            providerName: 'FedEx',
            price: 85.5,
            currency: 'USD',
            minDays: 3,
            maxDays: 4,
            estimatedDays: 3,
            transportMode: 'Ground',
            isCheapest: true,
            isFastest: true,
          },
        ],
        messages: [
          {
            provider: 'DHL',
            message: 'DHL is not available at this time',
          },
        ],
      };

      vi.mocked(apiService.post).mockResolvedValueOnce(mockResponse);

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      const result = await requestQuotes(request);

      expect(result.quotes).toHaveLength(1);
      expect(result.messages).toHaveLength(1);
      expect(result.messages![0].provider).toBe('DHL');
    });

    it('should sanitize input data before sending', async () => {
      const mockResponse = {
        quotes: [{
          providerId: 'fedex-ground',
          providerName: 'FedEx',
          price: 100,
          currency: 'USD',
          minDays: 2,
          maxDays: 4,
          estimatedDays: 3,
          transportMode: 'Ground',
          isCheapest: true,
          isFastest: false,
        }],
        messages: [],
      };

      vi.mocked(apiService.post).mockResolvedValueOnce(mockResponse);

      const request: IQuoteRequest = {
        origin: '  New York, NY  ', // With extra spaces
        destination: 'Los Angeles, CA', // Clean input
        weight: 10,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      await requestQuotes(request);

      expect(apiService.post).toHaveBeenCalledWith(
        '/api/quotes',
        expect.objectContaining({
          origin: 'New York, NY', // Trimmed
          destination: 'Los Angeles, CA',
        }),
        expect.any(Object)
      );
    });

    it('should throw error for invalid origin', async () => {
      const request: IQuoteRequest = {
        origin: 'AB', // Too short (min 3 chars)
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      await expect(requestQuotes(request)).rejects.toThrow('Origen inválido');
    });

    it('should throw error when origin equals destination', async () => {
      const request: IQuoteRequest = {
        origin: 'New York',
        destination: 'New York', // Same as origin
        weight: 10,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      await expect(requestQuotes(request)).rejects.toThrow('Origen y destino no pueden ser iguales');
    });

    it('should handle invalid response structure', async () => {
      vi.mocked(apiService.post).mockResolvedValueOnce({
        // Missing quotes array
        messages: [],
      });

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      await expect(requestQuotes(request)).rejects.toThrow('Respuesta inválida del servidor');
    });

    it('should filter out invalid quotes from response', async () => {
      const mockResponse = {
        quotes: [
          {
            providerId: 'valid',
            providerName: 'Valid Provider',
            price: 100,
            currency: 'USD',
            minDays: 2,
            maxDays: 4,
            estimatedDays: 3,
            transportMode: 'Ground',
          },
          {
            // Invalid - missing providerName
            providerId: 'invalid',
            price: 50,
          },
          {
            // Invalid - missing price
            providerId: 'invalid2',
            providerName: 'Invalid',
          },
        ],
        messages: [],
      };

      vi.mocked(apiService.post).mockResolvedValueOnce(mockResponse);

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      const result = await requestQuotes(request);

      // Only valid quote should be returned
      expect(result.quotes).toHaveLength(1);
      expect(result.quotes[0].providerName).toBe('Valid Provider');
    });
  });
});
