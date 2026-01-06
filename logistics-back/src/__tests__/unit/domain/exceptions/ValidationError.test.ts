import { ValidationError } from '../../../../domain/exceptions/ValidationError';

describe('ValidationError', () => {
  test('should create ValidationError with message, field, and value', () => {
    const error = new ValidationError(
      'El peso debe ser mayor a 0.1 kg',
      'weight',
      0
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('El peso debe ser mayor a 0.1 kg');
    expect(error.field).toBe('weight');
    expect(error.value).toBe(0);
    expect(error.name).toBe('ValidationError');
  });

  test('should create ValidationError without value', () => {
    const error = new ValidationError(
      'El origen es requerido',
      'origin'
    );

    expect(error.message).toBe('El origen es requerido');
    expect(error.field).toBe('origin');
    expect(error.value).toBeUndefined();
  });

  test('should be serializable to JSON', () => {
    const error = new ValidationError(
      'La fecha no puede ser anterior a hoy',
      'pickupDate',
      '2025-01-01'
    );

    const json = JSON.parse(JSON.stringify(error));
    
    expect(json.name).toBe('ValidationError');
    expect(json.message).toBe('La fecha no puede ser anterior a hoy');
    expect(json.field).toBe('pickupDate');
    expect(json.value).toBe('2025-01-01');
  });

  test('should have stack trace', () => {
    const error = new ValidationError('Test error', 'testField', 'testValue');
    
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('ValidationError');
  });
});
