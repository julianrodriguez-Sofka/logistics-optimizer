import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestQuotes } from '../../../services/quoteService';
import type { IQuoteRequest } from '../../../models/QuoteRequest';

// Mock fetch globally
global.fetch = vi.fn();

describe('quoteService', () => {
  beforeEach(() => {
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

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: '2026-01-10',
        fragile: false,
      };

      const result = await requestQuotes(request);

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/quotes', 
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle 400 validation error response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Weight must be > 0.1 kg' }),
      });

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 0,
        pickupDate: '2026-01-10',
        fragile: false,
      };

      await expect(requestQuotes(request)).rejects.toThrow('Weight must be > 0.1 kg');
    });

    it('should handle 503 service unavailable response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: 'Service unavailable',
          retryAfter: 30,
        }),
      });

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: '2026-01-10',
        fragile: false,
      };

      await expect(requestQuotes(request)).rejects.toThrow('Service unavailable');
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: '2026-01-10',
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

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const request: IQuoteRequest = {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 10,
        pickupDate: '2026-01-10',
        fragile: false,
      };

      const result = await requestQuotes(request);

      expect(result.quotes).toHaveLength(1);
      expect(result.messages).toHaveLength(1);
      expect(result.messages![0].provider).toBe('DHL');
    });
  });
});