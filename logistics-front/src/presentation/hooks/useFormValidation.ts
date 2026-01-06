// Validation hooks for form inputs

export function useWeightValidation(weight: number): string | null {
  // Check for null/undefined
  if (weight === null || weight === undefined) {
    return 'El peso es requerido';
  }

  // Check for NaN, Infinity, or non-number types
  if (typeof weight !== 'number' || isNaN(weight) || !isFinite(weight)) {
    return 'El peso debe ser un número válido';
  }

  // Check minimum weight (> 0.1 kg)
  if (weight < 0.1) {
    return 'El peso debe ser mayor a 0.1 kg';
  }

  // Check maximum weight (<= 1000 kg)
  if (weight > 1000) {
    return 'El peso máximo permitido es 1000 kg';
  }

  return null;
}

export function useDateValidation(date: string): string | null {
  // Check for null/undefined/empty
  if (!date || date === null || date === undefined) {
    return 'La fecha es requerida';
  }

  // Parse date
  const inputDate = new Date(date);
  
  // Check for invalid date
  if (isNaN(inputDate.getTime())) {
    return 'Fecha inválida';
  }

  // Get today at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get input date at midnight
  const inputDateMidnight = new Date(inputDate);
  inputDateMidnight.setHours(0, 0, 0, 0);

  // Check if date is in the past
  if (inputDateMidnight < today) {
    return 'La fecha no puede ser anterior a hoy';
  }

  // Check if date is more than 30 days in the future
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  if (inputDateMidnight > maxDate) {
    return 'La fecha no puede ser mayor a 30 días';
  }

  return null;
}

export function useRequiredValidation(value: string, fieldName: string): string | null {
  // Check for null/undefined/empty/whitespace
  if (!value || value === null || value === undefined || value.trim() === '') {
    return `El ${fieldName} es requerido`;
  }

  return null;
}

