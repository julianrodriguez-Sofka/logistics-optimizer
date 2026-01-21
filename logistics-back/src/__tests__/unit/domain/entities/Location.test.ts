/**
 * Location Entity Unit Tests
 * Testing location factory methods and validation
 */

import { Location, LocationFactory } from '../../../../domain/entities/Location';

describe('LocationFactory', () => {
  describe('createFromAddress', () => {
    it('should create location from simple address', () => {
      const location = LocationFactory.createFromAddress('123 Main St, City, Country');

      expect(location.address).toBe('123 Main St, City, Country');
      expect(location.lat).toBeUndefined();
      expect(location.lng).toBeUndefined();
    });

    it('should create location from short address', () => {
      const location = LocationFactory.createFromAddress('Home');

      expect(location.address).toBe('Home');
    });

    it('should create location from long address', () => {
      const longAddress = 'Calle 123 #45-67, Apartamento 890, Torre Norte, Edificio Central, Bogotá, Colombia';
      const location = LocationFactory.createFromAddress(longAddress);

      expect(location.address).toBe(longAddress);
    });

    it('should handle addresses with special characters', () => {
      const location = LocationFactory.createFromAddress('Calle 7 #10-20, Bogotá D.C.');

      expect(location.address).toBe('Calle 7 #10-20, Bogotá D.C.');
    });

    it('should handle addresses with numbers only', () => {
      const location = LocationFactory.createFromAddress('12345');

      expect(location.address).toBe('12345');
    });

    it('should handle empty address', () => {
      const location = LocationFactory.createFromAddress('');

      expect(location.address).toBe('');
    });
  });

  describe('createWithCoordinates', () => {
    it('should create location with coordinates', () => {
      const location = LocationFactory.createWithCoordinates(
        'San Francisco, CA',
        37.7749,
        -122.4194
      );

      expect(location.address).toBe('San Francisco, CA');
      expect(location.lat).toBe(37.7749);
      expect(location.lng).toBe(-122.4194);
    });

    it('should create location with positive coordinates', () => {
      const location = LocationFactory.createWithCoordinates(
        'Tokyo, Japan',
        35.6762,
        139.6503
      );

      expect(location.lat).toBe(35.6762);
      expect(location.lng).toBe(139.6503);
    });

    it('should create location with negative coordinates', () => {
      const location = LocationFactory.createWithCoordinates(
        'Sydney, Australia',
        -33.8688,
        151.2093
      );

      expect(location.lat).toBe(-33.8688);
      expect(location.lng).toBe(151.2093);
    });

    it('should create location with zero coordinates', () => {
      const location = LocationFactory.createWithCoordinates(
        'Null Island',
        0,
        0
      );

      expect(location.lat).toBe(0);
      expect(location.lng).toBe(0);
    });

    it('should create location with additional info', () => {
      const location = LocationFactory.createWithCoordinates(
        'New York, NY',
        40.7128,
        -74.0060,
        {
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001'
        }
      );

      expect(location.city).toBe('New York');
      expect(location.state).toBe('NY');
      expect(location.country).toBe('USA');
      expect(location.postalCode).toBe('10001');
    });

    it('should create location with partial additional info', () => {
      const location = LocationFactory.createWithCoordinates(
        'Los Angeles, CA',
        34.0522,
        -118.2437,
        {
          city: 'Los Angeles',
          state: 'CA'
        }
      );

      expect(location.city).toBe('Los Angeles');
      expect(location.state).toBe('CA');
      expect(location.country).toBeUndefined();
      expect(location.postalCode).toBeUndefined();
    });

    it('should create location with only city', () => {
      const location = LocationFactory.createWithCoordinates(
        'Miami, FL',
        25.7617,
        -80.1918,
        { city: 'Miami' }
      );

      expect(location.city).toBe('Miami');
      expect(location.state).toBeUndefined();
    });

    it('should create location with only country', () => {
      const location = LocationFactory.createWithCoordinates(
        'London',
        51.5074,
        -0.1278,
        { country: 'UK' }
      );

      expect(location.country).toBe('UK');
      expect(location.city).toBeUndefined();
    });

    it('should create location with only postal code', () => {
      const location = LocationFactory.createWithCoordinates(
        'Address',
        40.0,
        -75.0,
        { postalCode: '19019' }
      );

      expect(location.postalCode).toBe('19019');
    });

    it('should handle decimal coordinates with precision', () => {
      const location = LocationFactory.createWithCoordinates(
        'Precise Location',
        37.774929,
        -122.419418
      );

      expect(location.lat).toBe(37.774929);
      expect(location.lng).toBe(-122.419418);
    });

    it('should handle extreme latitude values', () => {
      const northPole = LocationFactory.createWithCoordinates('North Pole', 90, 0);
      const southPole = LocationFactory.createWithCoordinates('South Pole', -90, 0);

      expect(northPole.lat).toBe(90);
      expect(southPole.lat).toBe(-90);
    });

    it('should handle extreme longitude values', () => {
      const eastExtreme = LocationFactory.createWithCoordinates('East', 0, 180);
      const westExtreme = LocationFactory.createWithCoordinates('West', 0, -180);

      expect(eastExtreme.lng).toBe(180);
      expect(westExtreme.lng).toBe(-180);
    });
  });

  describe('Location Interface', () => {
    it('should create location with all required fields', () => {
      const location: Location = {
        address: '123 Main St',
        lat: 40.7128,
        lng: -74.0060,
      };

      expect(location.address).toBeDefined();
      expect(location.lat).toBeDefined();
      expect(location.lng).toBeDefined();
    });

    it('should create location with all optional fields', () => {
      const location: Location = {
        address: '456 Oak Ave',
        lat: 34.0522,
        lng: -118.2437,
        city: 'Los Angeles',
        state: 'California',
        country: 'USA',
        postalCode: '90001',
      };

      expect(location.city).toBe('Los Angeles');
      expect(location.state).toBe('California');
      expect(location.country).toBe('USA');
      expect(location.postalCode).toBe('90001');
    });

    it('should handle location with undefined optional fields', () => {
      const location: Location = {
        address: 'Basic Address',
        lat: 0,
        lng: 0,
        city: undefined,
        state: undefined,
        country: undefined,
        postalCode: undefined,
      };

      expect(location.city).toBeUndefined();
      expect(location.state).toBeUndefined();
      expect(location.country).toBeUndefined();
      expect(location.postalCode).toBeUndefined();
    });
  });

  describe('Real World Examples', () => {
    it('should create Bogotá location', () => {
      const location = LocationFactory.createWithCoordinates(
        'Bogotá, Colombia',
        4.7110,
        -74.0721,
        {
          city: 'Bogotá',
          country: 'Colombia',
        }
      );

      expect(location.city).toBe('Bogotá');
      expect(location.country).toBe('Colombia');
    });

    it('should create Cali location', () => {
      const location = LocationFactory.createWithCoordinates(
        'Cali, Colombia',
        3.4516,
        -76.5320,
        {
          city: 'Cali',
          state: 'Valle del Cauca',
          country: 'Colombia',
        }
      );

      expect(location.city).toBe('Cali');
      expect(location.state).toBe('Valle del Cauca');
    });

    it('should create Medellín location', () => {
      const location = LocationFactory.createWithCoordinates(
        'Medellín, Colombia',
        6.2442,
        -75.5812,
        {
          city: 'Medellín',
          state: 'Antioquia',
          country: 'Colombia',
        }
      );

      expect(location.city).toBe('Medellín');
      expect(location.state).toBe('Antioquia');
    });

    it('should create international location (Paris)', () => {
      const location = LocationFactory.createWithCoordinates(
        'Paris, France',
        48.8566,
        2.3522,
        {
          city: 'Paris',
          country: 'France',
          postalCode: '75001',
        }
      );

      expect(location.city).toBe('Paris');
      expect(location.country).toBe('France');
      expect(location.postalCode).toBe('75001');
    });
  });
});
