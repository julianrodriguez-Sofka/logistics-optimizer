import { describe, it, expect } from 'vitest';
import { QuoteValidator } from '../../../domain/validation/QuoteValidator';
import { QuoteValidationRules } from '../../../domain/validation/QuoteValidationRules';

describe('QuoteValidator', () => {
  describe('validateField', () => {
    it('should validate origin field', () => {
      expect(QuoteValidator.validateField('origin', '')).toBe('El origen es requerido');
      expect(QuoteValidator.validateField('origin', 'New York')).toBeUndefined();
    });

    it('should validate destination field', () => {
      expect(QuoteValidator.validateField('destination', '')).toBe('El destino es requerido');
      expect(QuoteValidator.validateField('destination', 'Los Angeles')).toBeUndefined();
    });

    it('should validate weight field', () => {
      expect(QuoteValidator.validateField('weight', 0)).toBe('El peso debe ser mayor a 0.1 kg');
      expect(QuoteValidator.validateField('weight', '0.05')).toBe('El peso debe ser mayor a 0.1 kg');
      expect(QuoteValidator.validateField('weight', 1001)).toBe('El peso máximo permitido es 1000 kg');
      expect(QuoteValidator.validateField('weight', 50)).toBeUndefined();
    });

    it('should validate pickup date field', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(QuoteValidator.validateField('pickupDate', '')).toBe('La fecha es requerida');
      expect(QuoteValidator.validateField('pickupDate', today)).toBeUndefined();
    });

    it('should validate fragile field', () => {
      expect(QuoteValidator.validateField('fragile', true)).toBeUndefined();
      expect(QuoteValidator.validateField('fragile', false)).toBeUndefined();
    });
  });

  describe('validateForm', () => {
    it('should validate complete form', () => {
      const validForm = {
        origin: 'New York',
        destination: 'Los Angeles',
        weight: 50,
        pickupDate: new Date().toISOString().split('T')[0],
        fragile: false,
      };

      const errors = QuoteValidator.validateForm(validForm);
      expect(QuoteValidator.hasErrors(errors)).toBe(false);
    });

    it('should return errors for invalid form', () => {
      const invalidForm = {
        origin: '',
        destination: '',
        weight: '',
        pickupDate: '',
        fragile: false,
      };

      const errors = QuoteValidator.validateForm(invalidForm);
      expect(errors.origin).toBeDefined();
      expect(errors.destination).toBeDefined();
    });
  });

  describe('hasErrors', () => {
    it('should return true if errors exist', () => {
      const errors = { origin: 'El origen es requerido' };
      expect(QuoteValidator.hasErrors(errors)).toBe(true);
    });

    it('should return false if no errors', () => {
      const errors = {};
      expect(QuoteValidator.hasErrors(errors)).toBe(false);
    });
  });

  describe('isFormValid', () => {
    it('should return true for valid form', () => {
      const validForm = {
        origin: 'New York',
        destination: 'Los Angeles',
        weight: '50',
        pickupDate: new Date().toISOString().split('T')[0],
        fragile: false,
      };

      expect(QuoteValidator.isFormValid(validForm)).toBe(true);
    });

    it('should return false for form with empty fields', () => {
      const invalidForm = {
        origin: '',
        destination: 'Los Angeles',
        weight: '50',
        pickupDate: new Date().toISOString().split('T')[0],
        fragile: false,
      };

      expect(QuoteValidator.isFormValid(invalidForm)).toBe(false);
    });

    it('should return false for form with invalid weight', () => {
      const invalidForm = {
        origin: 'New York',
        destination: 'Los Angeles',
        weight: '0.05',
        pickupDate: new Date().toISOString().split('T')[0],
        fragile: false,
      };

      expect(QuoteValidator.isFormValid(invalidForm)).toBe(false);
    });
  });
});

describe('QuoteValidationRules', () => {
  describe('validateOrigin', () => {
    it('should reject empty origin', () => {
      expect(QuoteValidationRules.validateOrigin('')).toBe('El origen es requerido');
    });

    it('should accept non-empty origin', () => {
      expect(QuoteValidationRules.validateOrigin('New York')).toBeUndefined();
    });
  });

  describe('validateWeight', () => {
    it('should reject weight < 0.1', () => {
      expect(QuoteValidationRules.validateWeight(0.05)).toBe('El peso debe ser mayor a 0.1 kg');
    });

    it('should reject weight > 1000', () => {
      expect(QuoteValidationRules.validateWeight(1001)).toBe('El peso máximo permitido es 1000 kg');
    });

    it('should accept valid weight', () => {
      expect(QuoteValidationRules.validateWeight(50)).toBeUndefined();
    });
  });

  describe('validatePickupDate', () => {
    it('should reject past date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      expect(QuoteValidationRules.validatePickupDate(dateStr)).toBe(
        'La fecha no puede ser anterior a hoy'
      );
    });

    it('should accept today date', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(QuoteValidationRules.validatePickupDate(today)).toBeUndefined();
    });

    it('should reject date > 30 days', () => {
      const future = new Date();
      future.setDate(future.getDate() + 31);
      const dateStr = future.toISOString().split('T')[0];

      expect(QuoteValidationRules.validatePickupDate(dateStr)).toBe(
        'La fecha no puede ser mayor a 30 días'
      );
    });
  });
});
