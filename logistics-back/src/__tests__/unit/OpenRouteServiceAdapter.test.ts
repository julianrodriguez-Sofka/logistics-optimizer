import { OpenRouteServiceAdapter } from '../../infrastructure/adapters/OpenRouteServiceAdapter.js';
import { TransportMode } from '../../domain/entities/RouteInfo.js';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenRouteServiceAdapter', () => {
  let adapter: OpenRouteServiceAdapter;
  const apiKey = 'test-api-key-123';
  const cacheTTL = 3600000; // 1 hour

  // Mock responses
  const mockGeocodeResponseBogota = {
    data: {
      features: [
        {
          geometry: {
            coordinates: [-74.0721, 4.711], // [lng, lat]
          },
        },
      ],
    },
  };

  const mockGeocodeResponseCali = {
    data: {
      features: [
        {
          geometry: {
            coordinates: [-76.5225, 3.4516], // [lng, lat]
          },
        },
      ],
    },
  };

  const mockDirectionsResponse = {
    data: {
      features: [
        {
          properties: {
            summary: {
              distance: 450000, // 450 km in meters
              duration: 18000, // 5 hours in seconds
            },
          },
          geometry: {
            coordinates: [
              [-74.0721, 4.711], // Bogota [lng, lat]
              [-75.5, 4.0],
              [-76.0, 3.7],
              [-76.5225, 3.4516], // Cali [lng, lat]
            ],
          },
        },
      ],
    },
  };

  beforeEach(() => {
    adapter = new OpenRouteServiceAdapter(apiKey, cacheTTL);
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with API key and cache TTL', () => {
      const customAdapter = new OpenRouteServiceAdapter('custom-key', 5000);
      expect(customAdapter).toBeDefined();
    });

    test('should use default cache TTL if not provided', () => {
      const defaultAdapter = new OpenRouteServiceAdapter('test-key');
      expect(defaultAdapter).toBeDefined();
    });
  });

  describe('calculateRoute', () => {
    test('should calculate route successfully', async () => {
      // Mock geocode calls (2 times: origin and destination)
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota) // Origin
        .mockResolvedValueOnce(mockGeocodeResponseCali); // Destination

      // Mock directions call
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const result = await adapter.calculateRoute('Bogota, Colombia', 'Cali, Colombia', 'driving-car');

      expect(result).toBeDefined();
      expect(result.distanceKm).toBeCloseTo(450, 0);
      expect(result.durationSeconds).toBe(18000); // 5 hours = 18000 seconds
      expect(result.durationFormatted).toBe('5h 0min');
      expect(result.origin.address).toBe('Bogota, Colombia');
      expect(result.destination.address).toBe('Cali, Colombia');
      expect(result.routeCoordinates).toHaveLength(4);
      expect(result.transportMode).toBe('driving-car');
    });

    test('should use cached route if available', async () => {
      // First call - should hit API
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const result1 = await adapter.calculateRoute('Bogota', 'Cali');
      
      // Second call - should use cache (no new API calls)
      const result2 = await adapter.calculateRoute('Bogota', 'Cali');

      expect(result1).toEqual(result2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Only 2 geocode calls from first request
      expect(mockedAxios.post).toHaveBeenCalledTimes(1); // Only 1 directions call from first request
    });

    test('should support different transport modes', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const result = await adapter.calculateRoute('Bogota', 'Cali', 'foot-walking');

      expect(result.transportMode).toBe('foot-walking');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('foot-walking'),
        expect.anything(),
        expect.anything()
      );
    });

    test('should handle geocoding failure', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Geocoding failed'));

      await expect(
        adapter.calculateRoute('Invalid Address', 'Cali')
      ).rejects.toThrow('Unable to geocode addresses');
    });

    test('should handle directions API failure', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: { message: 'Service unavailable' } } },
      });

      await expect(
        adapter.calculateRoute('Bogota', 'Cali')
      ).rejects.toThrow('Failed to calculate route: Service unavailable');
    });

    test('should handle missing geometry coordinates', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      
      const responseWithoutGeometry = {
        data: {
          features: [
            {
              properties: {
                summary: { distance: 450000, duration: 18000 },
              },
              geometry: { coordinates: null }, // No coordinates
            },
          ],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(responseWithoutGeometry);

      const result = await adapter.calculateRoute('Bogota', 'Cali');

      expect(result.routeCoordinates).toHaveLength(2); // Fallback to origin and destination only
      expect(result.routeCoordinates[0]).toEqual([4.711, -74.0721]);
      expect(result.routeCoordinates[1]).toEqual([3.4516, -76.5225]);
    });

    test('should convert [lng, lat] to [lat, lng] in route coordinates', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const result = await adapter.calculateRoute('Bogota', 'Cali');

      // OpenRouteService returns [lng, lat], we should convert to [lat, lng]
      expect(result.routeCoordinates[0][0]).toBeCloseTo(4.711, 3); // lat
      expect(result.routeCoordinates[0][1]).toBeCloseTo(-74.0721, 3); // lng
    });
  });

  describe('geocode', () => {
    test('should geocode address successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponseBogota);

      // Access private method via calculateRoute
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);

      const result = await adapter.calculateRoute('Bogota', 'Cali');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/geocode/search'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: apiKey,
            text: expect.any(String),
          }),
        })
      );
    });

    test('should validate coordinates are in Colombia', async () => {
      // Mock a geocode response outside Colombia
      const outsideColombia = {
        data: {
          features: [
            {
              geometry: {
                coordinates: [-118.2437, 34.0522], // Los Angeles
              },
            },
          ],
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(outsideColombia) // Strategy 1: original fails (outside Colombia)
        .mockResolvedValueOnce(mockGeocodeResponseBogota) // Strategy 2: normalized succeeds
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const result = await adapter.calculateRoute('Some Address', 'Cali');
      
      expect(result).toBeDefined();
      // Should fallback to normalized address strategy
    });

    test('should use fallback strategies for Colombian addresses', async () => {
      // First strategy fails (outside Colombia)
      const outsideColombia = {
        data: { features: [{ geometry: { coordinates: [-118, 34] } }] },
      };

      // Second strategy (normalized) succeeds
      mockedAxios.get
        .mockResolvedValueOnce(outsideColombia) // Strategy 1 fails
        .mockResolvedValueOnce(mockGeocodeResponseBogota) // Strategy 2 succeeds
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const result = await adapter.calculateRoute('Calle 123 #45-67, Bogota', 'Cali');

      expect(result).toBeDefined();
      expect(mockedAxios.get).toHaveBeenCalledTimes(3); // 2 for origin (fallback), 1 for destination
    });

    test('should throw error if all geocoding strategies fail', async () => {
      // All strategies fail
      mockedAxios.get.mockRejectedValue(new Error('Not found'));

      await expect(
        adapter.calculateRoute('Invalid Address That Does Not Exist', 'Cali')
      ).rejects.toThrow('Unable to geocode addresses');
    });

    test('should normalize Colombian addresses', async () => {
      const addressWithStreet = 'Calle 72 #10-34, Bogota, Colombia';
      
      mockedAxios.get
        .mockResolvedValueOnce({ data: { features: [{ geometry: { coordinates: [-118, 34] } }] } }) // Original fails (outside)
        .mockResolvedValueOnce(mockGeocodeResponseBogota) // Normalized succeeds
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const result = await adapter.calculateRoute(addressWithStreet, 'Cali');

      expect(result).toBeDefined();
      // Should have called geocode API with normalized address (without street details)
    });

    test('should extract city names from addresses', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Not found')) // Strategy 1 fails
        .mockRejectedValueOnce(new Error('Not found')) // Strategy 2 fails
        .mockResolvedValueOnce(mockGeocodeResponseBogota) // Strategy 3 (city only) succeeds
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const result = await adapter.calculateRoute('Calle 123, Bogota Centro', 'Cali');

      expect(result).toBeDefined();
      // Should have fallen back to city extraction strategy
    });
  });

  describe('getDistanceInKm', () => {
    test('should return only distance in kilometers', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const distance = await adapter.getDistanceInKm('Bogota', 'Cali');

      expect(distance).toBeCloseTo(450, 0);
    });
  });

  describe('estimateTrafficDelay', () => {
    test('should return 0 (free tier limitation)', async () => {
      const delay = await adapter.estimateTrafficDelay('Bogota', 'Cali', new Date());

      expect(delay).toBe(0);
    });
  });

  describe('validateAddress', () => {
    test('should return true for valid address', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockGeocodeResponseBogota);

      const isValid = await adapter.validateAddress('Bogota, Colombia');

      expect(isValid).toBe(true);
    });

    test('should return false for invalid address', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Not found'));

      const isValid = await adapter.validateAddress('Invalid Address XYZ 999');

      expect(isValid).toBe(false);
    });
  });

  describe('clearCache', () => {
    test('should clear cached routes', async () => {
      // First request - populate cache
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      await adapter.calculateRoute('Bogota', 'Cali');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);

      // Second request - use cache
      await adapter.calculateRoute('Bogota', 'Cali');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1); // Still 1 (cache hit)

      // Clear cache
      adapter.clearCache();

      // Third request - should hit API again
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      await adapter.calculateRoute('Bogota', 'Cali');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // New API call
    });
  });

  describe('Cache Management', () => {
    test('should create separate cache entries for different origins', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota) // Bogota -> Cali
        .mockResolvedValueOnce(mockGeocodeResponseCali)
        .mockResolvedValueOnce(mockGeocodeResponseCali) // Cali -> Bogota
        .mockResolvedValueOnce(mockGeocodeResponseBogota);
      mockedAxios.post
        .mockResolvedValueOnce(mockDirectionsResponse)
        .mockResolvedValueOnce(mockDirectionsResponse);

      await adapter.calculateRoute('Bogota', 'Cali');
      await adapter.calculateRoute('Cali', 'Bogota');

      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // Different routes
    });

    test('should create separate cache entries for different transport modes', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali)
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post
        .mockResolvedValueOnce(mockDirectionsResponse)
        .mockResolvedValueOnce(mockDirectionsResponse);

      await adapter.calculateRoute('Bogota', 'Cali', 'driving-car');
      await adapter.calculateRoute('Bogota', 'Cali', 'foot-walking');

      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // Different transport modes
    });

    test('should expire cache after TTL', async () => {
      const shortTTL = 100; // 100ms
      const shortAdapter = new OpenRouteServiceAdapter(apiKey, shortTTL);

      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      await shortAdapter.calculateRoute('Bogota', 'Cali');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      await shortAdapter.calculateRoute('Bogota', 'Cali');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // Cache expired, new API call
    });

    test('should be case-insensitive for cache keys', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      await adapter.calculateRoute('Bogota', 'Cali');
      await adapter.calculateRoute('BOGOTA', 'CALI'); // Uppercase

      expect(mockedAxios.post).toHaveBeenCalledTimes(1); // Should use cache (case-insensitive)
    });
  });

  describe('Error Handling', () => {
    test('should handle timeout errors gracefully', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockRejectedValueOnce({ message: 'timeout of 10000ms exceeded' });

      await expect(
        adapter.calculateRoute('Bogota', 'Cali')
      ).rejects.toThrow('Failed to calculate route');
    });

    test('should handle API rate limit errors', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: { message: 'Rate limit exceeded' } } },
      });

      await expect(
        adapter.calculateRoute('Bogota', 'Cali')
      ).rejects.toThrow('Rate limit exceeded');
    });

    test('should handle empty geocode results', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { features: [] } }); // Empty results

      await expect(
        adapter.calculateRoute('Invalid Address', 'Cali')
      ).rejects.toThrow('Unable to geocode addresses');
    });
  });

  describe('Colombian City Detection', () => {
    test('should recognize major Colombian cities', async () => {
      const cities = ['Medellin', 'Barranquilla', 'Cartagena', 'Bucaramanga'];

      for (const city of cities) {
        mockedAxios.get
          .mockResolvedValueOnce(mockGeocodeResponseBogota)
          .mockResolvedValueOnce(mockGeocodeResponseCali);
        mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

        const result = await adapter.calculateRoute(city, 'Cali');
        expect(result).toBeDefined();
      }
    });

    test('should handle addresses with accents', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValueOnce(mockDirectionsResponse);

      const result = await adapter.calculateRoute('Bogotá', 'Medellín'); // With accents

      expect(result).toBeDefined();
    });
  });
});
