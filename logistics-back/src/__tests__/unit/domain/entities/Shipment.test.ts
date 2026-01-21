/**
 * Shipment Entity Tests
 */

import { Shipment, IShipmentData, IShipmentAddress, IPackageDetails } from '../../../../domain/entities/Shipment';
import { Customer } from '../../../../domain/entities/Customer';
import { Quote } from '../../../../domain/entities/Quote';
import { ShipmentStatusType } from '../../../../domain/entities/ShipmentStatus';

describe('Shipment Entity', () => {
  const validCustomer = new Customer({
    name: 'Carlos Rodríguez',
    email: 'carlos@example.com',
    phone: '+573001234567',
    documentType: 'CC',
    documentNumber: '1234567890',
  });

  const validAddress: IShipmentAddress = {
    origin: 'Calle 123 #45-67, Bogotá',
    destination: 'Carrera 78 #90-12, Medellín',
    originCoordinates: { lat: 4.7110, lng: -74.0721 },
    destinationCoordinates: { lat: 6.2476, lng: -75.5658 },
  };

  const validPackage: IPackageDetails = {
    weight: 5,
    dimensions: {
      length: 30,
      width: 20,
      height: 15,
    },
    fragile: false,
    description: 'Electronic device',
  };

  const validQuote = new Quote({
    providerId: 'prov-123',
    providerName: 'Express Delivery',
    price: 25000,
    currency: 'COP',
    minDays: 2,
    maxDays: 4,
    transportMode: 'GROUND',
  });

  const validPaymentData = {
    method: 'CARD' as any,
    amount: 25000,
    currency: 'COP',
    status: 'COMPLETED' as any,
    cardInfo: {
      cardNumber: '4366',
      cardHolderName: 'Carlos Rodríguez',
      cardType: 'CREDIT' as any,
      expirationDate: '12/28', // December 2028 - future date
    },
    transactionId: 'PAY-123456',
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const validShipmentData: IShipmentData = {
    customer: validCustomer.toJSON(),
    address: validAddress,
    package: validPackage,
    pickupDate: tomorrow,
    selectedQuote: validQuote,
    payment: validPaymentData,
    currentStatus: 'PENDING' as ShipmentStatusType,
    statusHistory: [],
  };

  describe('Constructor and Validation', () => {
    it('should create shipment with valid data', () => {
      const shipment = new Shipment(validShipmentData);
      
      expect(shipment).toBeDefined();
      expect(shipment.customer.name).toBe(validCustomer.name);
      expect(shipment.trackingNumber).toMatch(/^LOG-\d{8}-\d{4}$/);
    });

    it('should generate tracking number automatically', () => {
      const shipment = new Shipment(validShipmentData);
      
      expect(shipment.trackingNumber).toBeDefined();
      expect(shipment.trackingNumber).toMatch(/^LOG-/);
    });

    it('should use provided tracking number if given', () => {
      const dataWithTracking = {
        ...validShipmentData,
        trackingNumber: 'LOG-20260120-1234',
      };
      const shipment = new Shipment(dataWithTracking);
      
      expect(shipment.trackingNumber).toBe('LOG-20260120-1234');
    });

    it('should fail when customer is missing', () => {
      const invalidData = { ...validShipmentData, customer: null as any };
      
      expect(() => new Shipment(invalidData)).toThrow('Customer information is required');
    });

    it('should fail when origin address is missing', () => {
      const invalidData = {
        ...validShipmentData,
        address: { ...validAddress, origin: '' },
      };
      
      expect(() => new Shipment(invalidData)).toThrow('Origin and destination addresses are required');
    });

    it('should fail when destination address is missing', () => {
      const invalidData = {
        ...validShipmentData,
        address: { ...validAddress, destination: '' },
      };
      
      expect(() => new Shipment(invalidData)).toThrow('Origin and destination addresses are required');
    });

    it('should fail when package weight is zero', () => {
      const invalidData = {
        ...validShipmentData,
        package: { ...validPackage, weight: 0 },
      };
      
      expect(() => new Shipment(invalidData)).toThrow('Valid package weight is required');
    });

    it('should fail when package weight is negative', () => {
      const invalidData = {
        ...validShipmentData,
        package: { ...validPackage, weight: -5 },
      };
      
      expect(() => new Shipment(invalidData)).toThrow('Valid package weight is required');
    });

    it('should fail when quote is missing', () => {
      const invalidData = { ...validShipmentData, selectedQuote: null as any };
      
      expect(() => new Shipment(invalidData)).toThrow('A quote must be selected');
    });

    it('should fail when payment is missing', () => {
      const invalidData = { ...validShipmentData, payment: null as any };
      
      expect(() => new Shipment(invalidData)).toThrow('Payment information is required');
    });

    it('should fail when pickup date is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const invalidData = {
        ...validShipmentData,
        pickupDate: yesterday,
      };
      
      expect(() => new Shipment(invalidData)).toThrow('Pickup date cannot be in the past');
    });

    it('should accept pickup date for today', () => {
      const today = new Date();
      const data = { ...validShipmentData, pickupDate: today };
      
      expect(() => new Shipment(data)).not.toThrow();
    });

    it('should accept pickup date in the future', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const data = { ...validShipmentData, pickupDate: nextWeek };
      
      expect(() => new Shipment(data)).not.toThrow();
    });
  });

  describe('Getters', () => {
    let shipment: Shipment;

    beforeEach(() => {
      shipment = new Shipment(validShipmentData);
    });

    it('should get customer', () => {
      expect(shipment.customer.name).toBe(validCustomer.name);
      expect(shipment.customer.email).toBe(validCustomer.email);
    });

    it('should get address', () => {
      expect(shipment.address).toEqual(validAddress);
    });

    it('should get package details', () => {
      expect(shipment.package).toEqual(validPackage);
    });

    it('should get pickup date', () => {
      expect(shipment.pickupDate).toBeInstanceOf(Date);
    });

    it('should get selected quote', () => {
      expect(shipment.selectedQuote).toEqual(validQuote);
    });

    it('should get current status', () => {
      expect(shipment.currentStatus).toBe('PENDING');
    });

    it('should get tracking number', () => {
      expect(shipment.trackingNumber).toMatch(/^LOG-\d{8}-\d{4}$/);
    });
  });

  describe('Tracking Number Generation', () => {
    it('should generate tracking number with correct format', () => {
      const shipment = new Shipment(validShipmentData);
      const trackingNumber = shipment.trackingNumber;
      
      expect(trackingNumber).toMatch(/^LOG-\d{8}-\d{4}$/);
    });

    it('should include current date in tracking number', () => {
      const shipment = new Shipment(validShipmentData);
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const expectedDatePart = `${year}${month}${day}`;
      
      expect(shipment.trackingNumber).toContain(expectedDatePart);
    });
  });

  describe('Package Validation', () => {
    it('should accept fragile packages', () => {
      const fragilePackage = { ...validPackage, fragile: true };
      const data = { ...validShipmentData, package: fragilePackage };
      
      expect(() => new Shipment(data)).not.toThrow();
    });

    it('should accept packages with description', () => {
      const packageWithDesc = {
        ...validPackage,
        description: 'Laptop computer',
      };
      const data = { ...validShipmentData, package: packageWithDesc };
      
      expect(() => new Shipment(data)).not.toThrow();
    });
  });

  describe('Status Types', () => {
    it('should accept status PENDING', () => {
      const data = { ...validShipmentData, currentStatus: 'PENDING' as ShipmentStatusType };
      expect(() => new Shipment(data)).not.toThrow();
    });

    it('should accept status CONFIRMED', () => {
      const data = { ...validShipmentData, currentStatus: 'CONFIRMED' as ShipmentStatusType };
      expect(() => new Shipment(data)).not.toThrow();
    });

    it('should accept status PICKED_UP', () => {
      const data = { ...validShipmentData, currentStatus: 'PICKED_UP' as ShipmentStatusType };
      expect(() => new Shipment(data)).not.toThrow();
    });

    it('should accept status IN_TRANSIT', () => {
      const data = { ...validShipmentData, currentStatus: 'IN_TRANSIT' as ShipmentStatusType };
      expect(() => new Shipment(data)).not.toThrow();
    });

    it('should accept status OUT_FOR_DELIVERY', () => {
      const data = { ...validShipmentData, currentStatus: 'OUT_FOR_DELIVERY' as ShipmentStatusType };
      expect(() => new Shipment(data)).not.toThrow();
    });

    it('should accept status DELIVERED', () => {
      const data = { ...validShipmentData, currentStatus: 'DELIVERED' as ShipmentStatusType };
      expect(() => new Shipment(data)).not.toThrow();
    });

    it('should accept status CANCELLED', () => {
      const data = { ...validShipmentData, currentStatus: 'CANCELLED' as ShipmentStatusType };
      expect(() => new Shipment(data)).not.toThrow();
    });

    it('should accept status RETURNED', () => {
      const data = { ...validShipmentData, currentStatus: 'RETURNED' as ShipmentStatusType };
      expect(() => new Shipment(data)).not.toThrow();
    });
  });

  describe('toJSON', () => {
    it('should convert shipment to JSON', () => {
      const shipment = new Shipment(validShipmentData);
      const json = shipment.toJSON();
      
      expect(json.trackingNumber).toBeDefined();
      expect(json.customer).toBeDefined();
      expect(json.address).toBeDefined();
      expect(json.package).toBeDefined();
      expect(json.currentStatus).toBe('PENDING');
    });
  });
});
