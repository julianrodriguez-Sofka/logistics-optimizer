/**
 * MultiModalRouteAdapter Unit Tests
 * Tests multi-modal route calculation with air + ground segments
 */

import axios from 'axios';
import { MultiModalRouteAdapter } from '../../../../infrastructure/adapters/MultiModalRouteAdapter';
import { RouteInfo } from '../../../../domain/entities/RouteInfo';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MultiModalRouteAdapter', () => {
  let adapter: MultiModalRouteAdapter;
  const mockApiKey = 'test-api-key-12345';

  const mockGeocodeResponseBogota = {
    data: {
      features: [
        {
          geometry: {
            coordinates: [-74.0721, 4.7110] // Bogotá coords [lng, lat]
          }
        }
      ]
    }
  };

  const mockGeocodeResponseCali = {
    data: {
      features: [
        {
          geometry: {
            coordinates: [-76.3816, 3.5432] // Cali coords [lng, lat]
          }
        }
      ]
    }
  };

  const mockGroundRouteResponse = {
    data: {
      features: [
        {
          properties: {
            segments: [
              {
                distance: 15000, // 15 km in meters
                duration: 1800   // 30 minutes in seconds
              }
            ]
          },
          geometry: {
            coordinates: [
              [-74.146947, 4.701594], // Airport [lng, lat]
              [-74.140000, 4.710000],
              [-74.072100, 4.711000]  // Destination
            ]
          }
        }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new MultiModalRouteAdapter(mockApiKey);
  });

  describe('Constructor', () => {
    it('should create adapter with valid API key', () => {
      expect(() => new MultiModalRouteAdapter(mockApiKey)).not.toThrow();
    });

    it('should throw error if API key is empty', () => {
      expect(() => new MultiModalRouteAdapter('')).toThrow(
        'OpenRouteService API Key is required for MultiModalRouteAdapter'
      );
    });

    it('should throw error if API key is null', () => {
      expect(() => new MultiModalRouteAdapter(null as any)).toThrow(
        'OpenRouteService API Key is required for MultiModalRouteAdapter'
      );
    });
  });

  describe('calculateRoute', () => {
    beforeEach(() => {
      // Mock geocode calls (called twice: origin and destination)
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)  // First call: origin
        .mockResolvedValueOnce(mockGeocodeResponseCali);   // Second call: destination
      
      // Mock ground segment API call
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);
    });

    it('should calculate multi-modal route successfully', async () => {
      const result = await adapter.calculateRoute('Bogotá Centro', 'Cali Norte');

      expect(result).toBeInstanceOf(RouteInfo);
      expect(result.origin.address).toBe('Bogotá Centro');
      expect(result.destination.address).toBe('Cali Norte');
      expect(result.transportMode).toBe('air-ground');
      expect(result.segments).toHaveLength(2);
      expect(result.segments![0].mode).toBe('air');
      expect(result.segments![1].mode).toBe('ground');
    });

    it('should calculate correct total distance (air + ground)', async () => {
      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      // Air segment: ~320km (Bogotá to Cali airport)
      // Ground segment: 15km (from mock)
      // Total should be > 300km
      expect(result.distanceKm).toBeGreaterThan(300);
      expect(result.distanceKm).toBeLessThan(400);
    });

    it('should calculate correct total duration (air + ground)', async () => {
      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      // Duration should include flight time + ground transport
      expect(result.durationSeconds).toBeGreaterThan(0);
      expect(result.durationSeconds).toBeGreaterThan(3600); // > 1 hour
    });

    it('should include air segment with correct properties', async () => {
      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      const airSegment = result.segments![0];
      expect(airSegment.mode).toBe('air');
      expect(airSegment.transportLabel).toBe('Avión');
      expect(airSegment.color).toBe('#2196F3');
      expect(airSegment.distanceKm).toBeGreaterThan(0);
      expect(airSegment.durationMinutes).toBeGreaterThan(0);
      expect(airSegment.coordinates).toHaveLength(2); // Start and end point
    });

    it('should include ground segment with correct properties', async () => {
      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      const groundSegment = result.segments![1];
      expect(groundSegment.mode).toBe('ground');
      expect(groundSegment.transportLabel).toBe('Camión');
      expect(groundSegment.color).toBe('#FF9800');
      expect(groundSegment.distanceKm).toBe(15); // From mock: 15000m = 15km
      expect(groundSegment.durationMinutes).toBe(30); // From mock: 1800s = 30min
    });

    it('should combine coordinates from both segments', async () => {
      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      // Should have air segment (2 coords) + ground segment (3 coords from mock) = 5 total
      expect(result.routeCoordinates).toHaveLength(5);
    });

    it('should cache route calculations', async () => {
      // First call
      await adapter.calculateRoute('Bogotá', 'Medellín');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // 2 geocode calls
      expect(mockedAxios.post).toHaveBeenCalledTimes(1); // 1 route call

      jest.clearAllMocks();

      // Second call with same parameters - should use cache
      await adapter.calculateRoute('Bogotá', 'Medellín');
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle cache key case-insensitivity', async () => {
      await adapter.calculateRoute('Bogotá', 'Medellín');
      jest.clearAllMocks();

      // Same route with different case - should use cache
      await adapter.calculateRoute('BOGOTÁ', 'MEDELLÍN');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return fallback route when ground segment fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API timeout'));

      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      // Should still return a route (fallback)
      expect(result).toBeInstanceOf(RouteInfo);
      expect(result.distanceKm).toBeGreaterThan(0);
      expect(result.trafficCondition).toBe('unknown');
    });

    it('should call geocode API with correct parameters', async () => {
      await adapter.calculateRoute('Calle 100, Bogotá', 'Carrera 5, Cali');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openrouteservice.org/geocode/search',
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: mockApiKey,
            text: 'Calle 100, Bogotá'
          })
        })
      );
    });

    it('should call ground route API with correct format', async () => {
      await adapter.calculateRoute('Bogotá', 'Cali');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openrouteservice.org/v2/directions/driving-hgv/geojson',
        expect.objectContaining({
          coordinates: expect.any(Array)
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': mockApiKey,
            'Content-Type': 'application/json'
          }),
          timeout: 10000
        })
      );
    });
  });

  describe('findNearestAirport', () => {
    it('should find nearest airport to Cali (Cali airport)', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            features: [{ geometry: { coordinates: [-74.0721, 4.7110] }}] // Bogotá
          }
        })
        .mockResolvedValueOnce({
          data: {
            features: [{ geometry: { coordinates: [-76.3816, 3.5432] }}] // Cali
          }
        });
      
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);

      const result = await adapter.calculateRoute('Bogotá', 'Cali Centro');

      // Air segment should end at Cali airport
      const airSegment = result.segments![0];
      expect(airSegment.coordinates[1][0]).toBeCloseTo(3.543222, 1); // Cali airport lat
      expect(airSegment.coordinates[1][1]).toBeCloseTo(-76.381583, 1); // Cali airport lng
    });

    it('should find nearest airport to Medellín (Medellín airport)', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            features: [{ geometry: { coordinates: [-74.0721, 4.7110] }}] // Bogotá
          }
        })
        .mockResolvedValueOnce({
          data: {
            features: [{ geometry: { coordinates: [-75.4231, 6.1645] }}] // Medellín
          }
        });
      
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);

      const result = await adapter.calculateRoute('Bogotá', 'Medellín Centro');

      const airSegment = result.segments![0];
      expect(airSegment.coordinates[1][0]).toBeCloseTo(6.164516, 1); // Medellín airport lat
    });
  });

  describe('geocode', () => {
    it('should geocode address successfully', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);

      await adapter.calculateRoute('Bogotá Centro', 'Cali');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openrouteservice.org/geocode/search',
        expect.objectContaining({
          params: { api_key: mockApiKey, text: 'Bogotá Centro' }
        })
      );
    });

    it('should throw error when geocoding fails (no results)', async () => {
      mockedAxios.get.mockResolvedValue({ data: { features: [] }});

      await expect(
        adapter.calculateRoute('Invalid Address XYZ', 'Bogotá')
      ).rejects.toThrow();
    });

    it('should throw error when geocoding fails (API error)', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      // Fallback requires geocoding, so it will fail
      await expect(
        adapter.calculateRoute('Bogotá', 'Cali')
      ).rejects.toThrow();
    });

    it('should use timeout for geocode requests', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);

      await adapter.calculateRoute('Bogotá', 'Cali');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 10000
        })
      );
    });
  });

  describe('getDistanceInKm', () => {
    beforeEach(() => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);
    });

    it('should return only distance in kilometers', async () => {
      const distance = await adapter.getDistanceInKm('Bogotá', 'Cali');

      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });

    it('should use cached route for distance calculation', async () => {
      // First call
      await adapter.getDistanceInKm('Bogotá', 'Medellín');
      jest.clearAllMocks();

      // Second call - should use cache
      const distance = await adapter.getDistanceInKm('Bogotá', 'Medellín');
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('validateAddress', () => {
    it('should return true for valid address', async () => {
      mockedAxios.get.mockResolvedValue(mockGeocodeResponseBogota);

      const isValid = await adapter.validateAddress('Bogotá Centro');

      expect(isValid).toBe(true);
    });

    it('should return false for invalid address (no results)', async () => {
      mockedAxios.get.mockResolvedValue({ data: { features: [] }});

      const isValid = await adapter.validateAddress('Invalid Address XYZ');

      expect(isValid).toBe(false);
    });

    it('should return false when API fails', async () => {
      mockedAxios.get.mockReset();
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const isValid = await adapter.validateAddress('Test Address');

      expect(isValid).toBe(false);
    });
  });

  describe('estimateTrafficDelay', () => {
    it('should return 0 (not applicable for air routes)', async () => {
      const delay = await adapter.estimateTrafficDelay(
        'Bogotá',
        'Cali',
        new Date()
      );

      expect(delay).toBe(0);
    });

    it('should not throw error when called', async () => {
      await expect(
        adapter.estimateTrafficDelay('Origin', 'Destination', new Date())
      ).resolves.not.toThrow();
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);
    });

    it('should cache routes for 1 hour', async () => {
      await adapter.calculateRoute('Bogotá', 'Cali');
      jest.clearAllMocks();

      // Call again immediately - should use cache
      await adapter.calculateRoute('Bogotá', 'Cali');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should expire cache after TTL', async () => {
      // Mock Date.now() to control time
      const originalNow = Date.now;
      let currentTime = 1000000000;
      Date.now = jest.fn(() => currentTime);

      await adapter.calculateRoute('Bogotá', 'Cali');
      jest.clearAllMocks();

      // Advance time past TTL (1 hour + 1 ms)
      currentTime += 1000 * 60 * 60 + 1;

      // Mock again for the expired cache scenario
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);

      // Should make new API calls
      await adapter.calculateRoute('Bogotá', 'Cali');
      expect(mockedAxios.get).toHaveBeenCalled();

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should maintain separate cache entries for different routes', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)  // Route 1 origin
        .mockResolvedValueOnce(mockGeocodeResponseCali)    // Route 1 destination
        .mockResolvedValueOnce(mockGeocodeResponseBogota)  // Route 2 origin (Medellín, but using Bogotá mock)
        .mockResolvedValueOnce(mockGeocodeResponseCali);   // Route 2 destination (Cartagena, but using Cali mock)
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);

      await adapter.calculateRoute('Bogotá', 'Cali');
      await adapter.calculateRoute('Medellín', 'Cartagena');

      // Both should be cached independently
      expect(mockedAxios.get).toHaveBeenCalledTimes(4); // 2 routes × 2 geocodes
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // 2 ground segments
    });
  });

  describe('Fallback Route', () => {
    it('should calculate fallback using geodesic distance when API fails', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      expect(result).toBeInstanceOf(RouteInfo);
      expect(result.trafficCondition).toBe('unknown');
      expect(result.routeCoordinates).toHaveLength(2); // Only start and end
      expect(result.distanceKm).toBeGreaterThan(0);
    });

    it('should calculate reasonable distance estimate in fallback', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            features: [{ geometry: { coordinates: [-74.0721, 4.7110] }}] // Bogotá - first geocode
          }
        })
        .mockResolvedValueOnce({
          data: {
            features: [{ geometry: { coordinates: [-76.3816, 3.5432] }}] // Cali - second geocode
          }
        });
      mockedAxios.post.mockRejectedValue(new Error('API Error')); // Trigger fallback

      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      // Geodesic distance Bogotá-Cali is ~287km
      expect(result.distanceKm).toBeGreaterThan(250);
      expect(result.distanceKm).toBeLessThan(350);
    });

    it('should estimate duration at 100 km/h in fallback', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            features: [{ geometry: { coordinates: [-74.0721, 4.7110] }}] // Bogotá - first geocode
          }
        })
        .mockResolvedValueOnce({
          data: {
            features: [{ geometry: { coordinates: [-76.3816, 3.5432] }}] // Cali - second geocode
          }
        });
      mockedAxios.post.mockRejectedValue(new Error('API Error')); // Trigger fallback

      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      // ~287km at 100 km/h = ~2.87 hours = 10332 seconds
      expect(result.durationSeconds).toBeGreaterThan(9000); // > 2.5 hours
      expect(result.durationSeconds).toBeLessThan(12000); // < 3.3 hours
    });
  });

  describe('Geodesic Distance Calculation', () => {
    beforeEach(() => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);
    });

    it('should calculate geodesic distance for air segment', async () => {
      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      const airSegment = result.segments![0];
      // Bogotá to Cali airport geodesic ~287 km
      expect(airSegment.distanceKm).toBeGreaterThan(200);
      expect(airSegment.distanceKm).toBeLessThan(350);
    });

    it('should calculate flight duration at 800 km/h + 60 min procedures', async () => {
      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      const airSegment = result.segments![0];
      // ~320km / 800 km/h = 0.4h = 24 min + 60 min = 84 min
      expect(airSegment.durationMinutes).toBeGreaterThan(60);
      expect(airSegment.durationMinutes).toBeLessThan(120);
    });
  });

  describe('Ground Segment API Call', () => {
    beforeEach(() => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValue(mockGroundRouteResponse);
    });

    it('should use driving-hgv profile for ground segment', async () => {
      await adapter.calculateRoute('Bogotá', 'Cali');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('driving-hgv'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should convert coordinates from [lng,lat] to [lat,lng]', async () => {
      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      const groundSegment = result.segments![1];
      // Verify coordinates are in [lat, lng] format (lat should be between -90 and 90)
      groundSegment.coordinates.forEach(coord => {
        expect(coord[0]).toBeGreaterThanOrEqual(-90);
        expect(coord[0]).toBeLessThanOrEqual(90);
      });
    });

    it('should handle empty route response gracefully', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockGeocodeResponseBogota)
        .mockResolvedValueOnce(mockGeocodeResponseCali);
      mockedAxios.post.mockResolvedValue({ data: { features: [] }});

      const result = await adapter.calculateRoute('Bogotá', 'Cali');

      // Should fallback
      expect(result.trafficCondition).toBe('unknown');
    });
  });
});
