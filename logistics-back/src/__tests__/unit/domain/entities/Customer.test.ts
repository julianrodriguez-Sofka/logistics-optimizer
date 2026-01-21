/**
 * Customer Entity Tests
 * Tests for customer validation and business logic
 */

import { Customer, ICustomer } from '../../../../domain/entities/Customer';

describe('Customer Entity', () => {
  const validCustomerData: ICustomer = {
    name: 'Juan Pérez García',
    email: 'juan.perez@example.com',
    phone: '+573001234567',
    documentType: 'CC',
    documentNumber: '1234567890',
  };

  describe('Constructor and Validation', () => {
    it('should create customer with valid data', () => {
      const customer = new Customer(validCustomerData);
      
      expect(customer).toBeDefined();
      expect(customer.name).toBe('Juan Pérez García');
      expect(customer.email).toBe('juan.perez@example.com');
    });

    it('should fail with empty name', () => {
      const invalidData = { ...validCustomerData, name: '' };
      
      expect(() => new Customer(invalidData)).toThrow('Customer name must be at least 3 characters long');
    });

    it('should fail with name shorter than 3 characters', () => {
      const invalidData = { ...validCustomerData, name: 'AB' };
      
      expect(() => new Customer(invalidData)).toThrow('Customer name must be at least 3 characters long');
    });

    it('should trim whitespace from name', () => {
      const dataWithSpaces = { ...validCustomerData, name: '  Juan Pérez  ' };
      const customer = new Customer(dataWithSpaces);
      
      expect(customer.name).toBe('  Juan Pérez  ');
    });

    it('should fail with invalid email format', () => {
      const invalidData = { ...validCustomerData, email: 'invalid-email' };
      
      expect(() => new Customer(invalidData)).toThrow('Invalid email format');
    });

    it('should fail with email missing @', () => {
      const invalidData = { ...validCustomerData, email: 'userexample.com' };
      
      expect(() => new Customer(invalidData)).toThrow('Invalid email format');
    });

    it('should accept valid phone with +57 prefix', () => {
      const customer = new Customer(validCustomerData);
      
      expect(customer.phone).toBe('+573001234567');
    });

    it('should accept valid phone without +57 prefix', () => {
      const dataWithoutPrefix = { ...validCustomerData, phone: '3001234567' };
      const customer = new Customer(dataWithoutPrefix);
      
      expect(customer.phone).toBe('3001234567');
    });

    it('should accept valid document types', () => {
      const documentTypes: Array<'CC' | 'CE' | 'NIT' | 'PASSPORT'> = ['CC', 'CE', 'NIT', 'PASSPORT'];
      
      documentTypes.forEach(documentType => {
        const data = { ...validCustomerData, documentType };
        const customer = new Customer(data);
        expect(customer.documentType).toBe(documentType);
      });
    });

    it('should fail with document number shorter than 5 characters', () => {
      const invalidData = { ...validCustomerData, documentNumber: '1234' };
      
      expect(() => new Customer(invalidData)).toThrow('Document number must be at least 5 characters');
    });

    it('should accept valid document number', () => {
      const customer = new Customer(validCustomerData);
      
      expect(customer.documentNumber).toBe('1234567890');
    });
  });

  describe('Email Validation', () => {
    const validEmails = [
      'test@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user_name@sub.example.com',
    ];

    validEmails.forEach(email => {
      it(`should accept valid email: ${email}`, () => {
        const data = { ...validCustomerData, email };
        expect(() => new Customer(data)).not.toThrow();
      });
    });

    const invalidEmails = [
      'invalid',
      '@example.com',
      'user@',
      'user @example.com',
      'user@.com',
    ];

    invalidEmails.forEach(email => {
      it(`should reject invalid email: ${email}`, () => {
        const data = { ...validCustomerData, email };
        expect(() => new Customer(data)).toThrow('Invalid email format');
      });
    });
  });

  describe('Phone Validation', () => {
    const validPhones = [
      '+573001234567',
      '3001234567',
      '+573101234567',
      '3209876543',
    ];

    validPhones.forEach(phone => {
      it(`should accept valid phone: ${phone}`, () => {
        const data = { ...validCustomerData, phone };
        expect(() => new Customer(data)).not.toThrow();
      });
    });
  });

  describe('Getters', () => {
    it('should get customer name', () => {
      const customer = new Customer(validCustomerData);
      expect(customer.name).toBe('Juan Pérez García');
    });

    it('should get customer email', () => {
      const customer = new Customer(validCustomerData);
      expect(customer.email).toBe('juan.perez@example.com');
    });

    it('should get customer phone', () => {
      const customer = new Customer(validCustomerData);
      expect(customer.phone).toBe('+573001234567');
    });

    it('should get customer document type', () => {
      const customer = new Customer(validCustomerData);
      expect(customer.documentType).toBe('CC');
    });

    it('should get customer document number', () => {
      const customer = new Customer(validCustomerData);
      expect(customer.documentNumber).toBe('1234567890');
    });

    it('should get customer id if provided', () => {
      const dataWithId = { ...validCustomerData, id: 'customer-456' };
      const customer = new Customer(dataWithId);
      
      expect(customer.id).toBe('customer-456');
    });

    it('should have undefined id if not provided', () => {
      const customer = new Customer(validCustomerData);
      expect(customer.id).toBeUndefined();
    });
  });

  describe('toJSON', () => {
    it('should convert customer to JSON', () => {
      const customer = new Customer(validCustomerData);
      const json = customer.toJSON();
      
      expect(json.name).toBe('Juan Pérez García');
      expect(json.email).toBe('juan.perez@example.com');
      expect(json.phone).toBe('+573001234567');
      expect(json.documentType).toBe('CC');
      expect(json.documentNumber).toBe('1234567890');
    });

    it('should include id in JSON if provided', () => {
      const dataWithId = { ...validCustomerData, id: 'customer-789' };
      const customer = new Customer(dataWithId);
      const json = customer.toJSON();
      
      expect(json.id).toBe('customer-789');
    });

    it('should include created and updated dates', () => {
      const customer = new Customer(validCustomerData);
      const json = customer.toJSON();
      
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });
  });
});
