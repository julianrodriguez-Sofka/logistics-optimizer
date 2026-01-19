/**
 * Location Entity
 * Represents a geographical location with address and coordinates
 */
export interface Location {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

/**
 * Factory method to create a Location from address string
 */
export class LocationFactory {
  static createFromAddress(address: string): Partial<Location> {
    return {
      address,
    };
  }

  static createWithCoordinates(
    address: string,
    lat: number,
    lng: number,
    additionalInfo?: Partial<Location>
  ): Location {
    return {
      address,
      lat,
      lng,
      ...additionalInfo,
    };
  }
}
