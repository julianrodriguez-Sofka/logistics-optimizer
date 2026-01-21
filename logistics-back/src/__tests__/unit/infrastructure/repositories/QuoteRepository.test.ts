/**
 * QuoteRepository Unit Tests
 * Tests MongoDB quote persistence and caching
 */

import { QuoteRepository } from '../../../../infrastructure/database/repositories/QuoteRepository';
import { Quote } from '../../../../domain/entities/Quote';
import { QuoteRequest } from '../../../../domain/entities/QuoteRequest';
import { QuoteModel } from '../../../../infrastructure/database/models/QuoteModel';

jest.mock('../../../../infrastructure/database/models/QuoteModel');

describe('QuoteRepository', () => {
  let repository: QuoteRepository;
  let mockQuoteModel: jest.Mocked<typeof QuoteModel>;

  const mockQuote = new Quote({
    providerId: 'provider-1',
    providerName: 'DHL',
    price: 50000,
    currency: 'COP',
    minDays: 2,
    maxDays: 4,
    transportMode: 'air',
    isCheapest: false,
    isFastest: true,
  });

  const mockRequest = new QuoteRequest({
    origin: 'Bogotá',
    destination: 'Medellín',
    weight: 10,
    pickupDate: new Date(),
    fragile: false,
  });

  const mockQuoteDoc = {
    providerId: 'provider-1',
    providerName: 'DHL',
    price: 50000,
    currency: 'COP',
    minDays: 2,
    maxDays: 4,
    transportMode: 'air',
    isCheapest: false,
    isFastest: true,
    requestData: {
      origin: 'Bogotá',
      destination: 'Medellín',
      weight: 10,
      pickupDate: new Date(),
      fragile: false,
    },
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new QuoteRepository();
    mockQuoteModel = QuoteModel as jest.Mocked<typeof QuoteModel>;
  });

  describe('save', () => {
    it('should save a single quote to database', async () => {
      mockQuoteModel.create = jest.fn().mockResolvedValue(mockQuoteDoc);

      await repository.save(mockQuote, mockRequest);

      expect(mockQuoteModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: 'provider-1',
          providerName: 'DHL',
          price: 50000,
          currency: 'COP',
          requestData: expect.objectContaining({
            origin: 'Bogotá',
            destination: 'Medellín',
            weight: 10,
          }),
        })
      );
    });

    it('should include request data in saved quote', async () => {
      mockQuoteModel.create = jest.fn().mockResolvedValue(mockQuoteDoc);

      await repository.save(mockQuote, mockRequest);

      const callArg = (mockQuoteModel.create as jest.Mock).mock.calls[0][0];
      expect(callArg.requestData).toMatchObject({
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 10,
        fragile: false,
      });
    });

    it('should handle save errors gracefully', async () => {
      mockQuoteModel.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(repository.save(mockQuote, mockRequest)).rejects.toThrow('Database error');
    });
  });

  describe('saveMany', () => {
    it('should save multiple quotes in batch', async () => {
      const quotes = [
        mockQuote,
        new Quote({
          providerId: 'provider-2',
          providerName: 'FedEx',
          price: 45000,
          currency: 'COP',
          minDays: 3,
          maxDays: 5,
          transportMode: 'ground',
          isCheapest: true,
          isFastest: false,
        }),
      ];

      mockQuoteModel.insertMany = jest.fn().mockResolvedValue([mockQuoteDoc, mockQuoteDoc]);

      await repository.saveMany(quotes, mockRequest);

      expect(mockQuoteModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ providerId: 'provider-1' }),
          expect.objectContaining({ providerId: 'provider-2' }),
        ])
      );
    });

    it('should include request data for all quotes', async () => {
      const quotes = [mockQuote];
      mockQuoteModel.insertMany = jest.fn().mockResolvedValue([mockQuoteDoc]);

      await repository.saveMany(quotes, mockRequest);

      const callArg = (mockQuoteModel.insertMany as jest.Mock).mock.calls[0][0];
      expect(callArg[0].requestData).toMatchObject({
        origin: 'Bogotá',
        destination: 'Medellín',
      });
    });

    it('should handle batch save errors', async () => {
      mockQuoteModel.insertMany = jest.fn().mockRejectedValue(new Error('Batch insert failed'));

      await expect(repository.saveMany([mockQuote], mockRequest)).rejects.toThrow('Batch insert failed');
    });
  });

  describe('findCached', () => {
    it('should return cached quotes within 5 minutes', async () => {
      const recentDate = new Date();
      const cachedDocs = [
        { ...mockQuoteDoc, createdAt: recentDate },
      ];

      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(cachedDocs),
      });

      const result = await repository.findCached(mockRequest);

      expect(result).toHaveLength(1);
      expect(result![0]).toBeInstanceOf(Quote);
      expect(result![0].providerId).toBe('provider-1');
      expect(mockQuoteModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'requestData.origin': 'Bogotá',
          'requestData.destination': 'Medellín',
          'requestData.weight': 10,
          'requestData.fragile': false,
          createdAt: expect.objectContaining({ $gte: expect.any(Date) }),
        })
      );
    });

    it('should return null when no cached quotes found', async () => {
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findCached(mockRequest);

      expect(result).toBeNull();
    });

    it('should filter by all request parameters', async () => {
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const fragileRequest = new QuoteRequest({
        origin: 'Bogotá',
        destination: 'Cali',
        weight: 5,
        pickupDate: new Date(),
        fragile: true,
      });

      await repository.findCached(fragileRequest);

      expect(mockQuoteModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'requestData.origin': 'Bogotá',
          'requestData.destination': 'Cali',
          'requestData.weight': 5,
          'requestData.fragile': true,
        })
      );
    });

    it('should only return quotes within cache TTL (5 minutes)', async () => {
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await repository.findCached(mockRequest);

      const callArg = (mockQuoteModel.find as jest.Mock).mock.calls[0][0];
      const cacheThreshold = callArg.createdAt.$gte;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Allow 1 second tolerance for test execution time
      expect(Math.abs(cacheThreshold.getTime() - fiveMinutesAgo.getTime())).toBeLessThan(1000);
    });

    it('should sort cached quotes by creation date descending', async () => {
      const mockSort = jest.fn().mockResolvedValue([]);
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: mockSort,
      });

      await repository.findCached(mockRequest);

      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should convert MongoDB documents to Quote entities', async () => {
      const cachedDocs = [mockQuoteDoc];
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(cachedDocs),
      });

      const result = await repository.findCached(mockRequest);

      expect(result![0]).toBeInstanceOf(Quote);
      expect(result![0]).toMatchObject({
        providerId: 'provider-1',
        providerName: 'DHL',
        price: 50000,
      });
    });
  });

  describe('findAll', () => {
    it('should return all quotes with default limit', async () => {
      const mockLimit = jest.fn().mockResolvedValue([mockQuoteDoc]);
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: mockSort,
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(mockLimit).toHaveBeenCalledWith(100);
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should respect custom limit parameter', async () => {
      const mockLimit = jest.fn().mockResolvedValue([mockQuoteDoc]);
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ limit: mockLimit }),
      });

      await repository.findAll(50);

      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('should convert documents to Quote entities', async () => {
      const mockLimit = jest.fn().mockResolvedValue([mockQuoteDoc, mockQuoteDoc]);
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ limit: mockLimit }),
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Quote);
      expect(result[1]).toBeInstanceOf(Quote);
    });

    it('should handle empty result set', async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ limit: mockLimit }),
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockQuoteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      });

      await expect(repository.findAll()).rejects.toThrow('Database connection failed');
    });
  });
});
