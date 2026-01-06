import { describe, it, expect } from 'vitest';
import { useWeightValidation, useDateValidation, useRequiredValidation } from '../useFormValidation';
import { renderHook } from '@testing-library/react';

describe('useWeightValidation', () => {
  it('should return null error for valid weight (5.5 kg)', () => {
    const { result } = renderHook(() => useWeightValidation(5.5));
    expect(result.current).toBeNull();
  });

  it('should return null error for boundary value (0.1 kg)', () => {
    const { result } = renderHook(() => useWeightValidation(0.1));
    expect(result.current).toBeNull();
  });

  it('should return null error for boundary value (1000 kg)', () => {
    const { result } = renderHook(() => useWeightValidation(1000));
    expect(result.current).toBeNull();
  });

  it('should return error for weight below minimum (0.099 kg)', () => {
    const { result } = renderHook(() => useWeightValidation(0.099));
    expect(result.current).toBe('El peso debe ser mayor a 0.1 kg');
  });

  it('should return error for weight above maximum (1000.001 kg)', () => {
    const { result } = renderHook(() => useWeightValidation(1000.001));
    expect(result.current).toBe('El peso máximo permitido es 1000 kg');
  });

  it('should return error for zero weight', () => {
    const { result } = renderHook(() => useWeightValidation(0));
    expect(result.current).toBe('El peso debe ser mayor a 0.1 kg');
  });

  it('should return error for negative weight', () => {
    const { result } = renderHook(() => useWeightValidation(-5));
    expect(result.current).toBe('El peso debe ser mayor a 0.1 kg');
  });

  it('should return error for null weight', () => {
    const { result } = renderHook(() => useWeightValidation(null as unknown as number));
    expect(result.current).toBe('El peso es requerido');
  });

  it('should return error for undefined weight', () => {
    const { result } = renderHook(() => useWeightValidation(undefined as unknown as number));
    expect(result.current).toBe('El peso es requerido');
  });

  it('should return error for NaN weight', () => {
    const { result } = renderHook(() => useWeightValidation(NaN));
    expect(result.current).toBe('El peso debe ser un número válido');
  });

  it('should return error for string weight', () => {
    const { result } = renderHook(() => useWeightValidation('abc' as unknown as number));
    expect(result.current).toBe('El peso debe ser un número válido');
  });

  it('should return error for Infinity', () => {
    const { result } = renderHook(() => useWeightValidation(Infinity));
    expect(result.current).toBe('El peso debe ser un número válido');
  });
});

describe('useDateValidation', () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const thirtyOneDaysFromNow = new Date(today);
  thirtyOneDaysFromNow.setDate(thirtyOneDaysFromNow.getDate() + 31);

  it('should return null error for today', () => {
    const { result } = renderHook(() => useDateValidation(today.toISOString().split('T')[0]));
    expect(result.current).toBeNull();
  });

  it('should return null error for tomorrow', () => {
    const { result } = renderHook(() => useDateValidation(tomorrow.toISOString().split('T')[0]));
    expect(result.current).toBeNull();
  });

  it('should return null error for 30 days from now', () => {
    const { result } = renderHook(() => useDateValidation(thirtyDaysFromNow.toISOString().split('T')[0]));
    expect(result.current).toBeNull();
  });

  it('should return error for yesterday', () => {
    const { result } = renderHook(() => useDateValidation(yesterday.toISOString().split('T')[0]));
    expect(result.current).toBe('La fecha no puede ser anterior a hoy');
  });

  it('should return error for 31 days from now', () => {
    const { result } = renderHook(() => useDateValidation(thirtyOneDaysFromNow.toISOString().split('T')[0]));
    expect(result.current).toBe('La fecha no puede ser mayor a 30 días');
  });

  it('should return error for invalid date string', () => {
    const { result } = renderHook(() => useDateValidation('invalid-date'));
    expect(result.current).toBe('Fecha inválida');
  });

  it('should return error for null date', () => {
    const { result } = renderHook(() => useDateValidation(null as unknown as string));
    expect(result.current).toBe('La fecha es requerida');
  });

  it('should return error for undefined date', () => {
    const { result } = renderHook(() => useDateValidation(undefined as unknown as string));
    expect(result.current).toBe('La fecha es requerida');
  });

  it('should return error for empty string', () => {
    const { result } = renderHook(() => useDateValidation(''));
    expect(result.current).toBe('La fecha es requerida');
  });
});

describe('useRequiredValidation', () => {
  it('should return null error for non-empty string', () => {
    const { result } = renderHook(() => useRequiredValidation('New York', 'origen'));
    expect(result.current).toBeNull();
  });

  it('should return error for empty string', () => {
    const { result } = renderHook(() => useRequiredValidation('', 'origen'));
    expect(result.current).toBe('El origen es requerido');
  });

  it('should return error for whitespace only', () => {
    const { result } = renderHook(() => useRequiredValidation('   ', 'destino'));
    expect(result.current).toBe('El destino es requerido');
  });

  it('should return error for null', () => {
    const { result } = renderHook(() => useRequiredValidation(null as unknown as string, 'origen'));
    expect(result.current).toBe('El origen es requerido');
  });

  it('should return error for undefined', () => {
    const { result } = renderHook(() => useRequiredValidation(undefined as unknown as string, 'destino'));
    expect(result.current).toBe('El destino es requerido');
  });

  it('should use custom field name in error message', () => {
    const { result } = renderHook(() => useRequiredValidation('', 'dirección'));
    expect(result.current).toBe('El dirección es requerido');
  });
});
