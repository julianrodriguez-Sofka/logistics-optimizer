import { describe, it, expect } from 'vitest';
import { useWeightValidation, useDateValidation, useRequiredValidation } from '../../../hooks/useFormValidation';
import { renderHook } from '@testing-library/react';

/**
 * These tests verify the deprecated hook wrappers
 * Actual validation logic is tested in QuoteValidator.spec.ts
 */

describe('useWeightValidation (deprecated)', () => {
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
});

describe('useDateValidation (deprecated)', () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  it('should return null error for tomorrow', () => {
    const { result } = renderHook(() => useDateValidation(tomorrow.toISOString().split('T')[0]));
    expect(result.current).toBeNull();
  });

  it('should return null error for 30 days from now', () => {
    const { result } = renderHook(() => useDateValidation(thirtyDaysFromNow.toISOString().split('T')[0]));
    expect(result.current).toBeNull();
  });

  it('should return error for 31 days from now', () => {
    const thirtyTwoDaysFromNow = new Date();
    thirtyTwoDaysFromNow.setDate(thirtyTwoDaysFromNow.getDate() + 32);
    const { result } = renderHook(() => useDateValidation(thirtyTwoDaysFromNow.toISOString().split('T')[0]));
    expect(result.current).toBe('La fecha no puede ser mayor a 30 días');
  });

  it('should return error for empty string', () => {
    const { result } = renderHook(() => useDateValidation(''));
    expect(result.current).toBe('La fecha es requerida');
  });
});

describe('useRequiredValidation (deprecated)', () => {
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

  it('should return error for undefined', () => {
    const { result } = renderHook(() => useRequiredValidation(undefined as unknown as string, 'destino'));
    expect(result.current).toBe('El destino es requerido');
  });

  it('should use custom field name in error message', () => {
    const { result } = renderHook(() => useRequiredValidation('', 'dirección'));
    expect(result.current).toBe('El dirección es requerido');
  });
});
