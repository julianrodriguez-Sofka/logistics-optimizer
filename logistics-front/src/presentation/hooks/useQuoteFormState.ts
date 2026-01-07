import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { QuoteValidator, type FormErrors } from '../../domain/validation/QuoteValidator';

/**
 * Form state interface
 */
export interface QuoteFormState {
  origin: string;
  destination: string;
  weight: string;
  pickupDate: string;
  fragile: boolean;
}

/**
 * Hook to manage quote request form state
 * Implements Single Responsibility Principle
 * Separates form state management from UI rendering
 */
export function useQuoteFormState() {
  const [formData, setFormData] = useState<QuoteFormState>({
    origin: '',
    destination: '',
    weight: '',
    pickupDate: '',
    fragile: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Handle field change event
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = QuoteValidator.validateField(name, fieldValue);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  /**
   * Handle field blur event
   */
  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setTouched(prev => ({ ...prev, [name]: true }));

    const error = QuoteValidator.validateField(name, fieldValue);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  /**
   * Validate all fields and set errors
   */
  const validateAll = (): boolean => {
    // Mark all fields as touched
    setTouched({
      origin: true,
      destination: true,
      weight: true,
      pickupDate: true,
      fragile: true,
    });

    // Validate all fields
    const newErrors = QuoteValidator.validateForm(formData);
    setErrors(newErrors);

    return !QuoteValidator.hasErrors(newErrors);
  };

  /**
   * Check if form is valid
   */
  const isFormValid = (): boolean => {
    return QuoteValidator.isFormValid(formData);
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      origin: '',
      destination: '',
      weight: '',
      pickupDate: '',
      fragile: false,
    });
    setErrors({});
    setTouched({});
  };

  /**
   * Get field error message
   */
  const getFieldError = (fieldName: string): string | undefined => {
    return errors[fieldName as keyof FormErrors];
  };

  /**
   * Check if field has been touched
   */
  const isFieldTouched = (fieldName: string): boolean => {
    return touched[fieldName] || false;
  };

  /**
   * Check if field has error and has been touched
   */
  const isFieldInvalid = (fieldName: string): boolean => {
    return isFieldTouched(fieldName) && !!getFieldError(fieldName);
  };

  return {
    // State
    formData,
    errors,
    touched,

    // Handlers
    handleChange,
    handleBlur,

    // Validators
    validateAll,
    isFormValid,
    getFieldError,
    isFieldTouched,
    isFieldInvalid,

    // Reset
    resetForm,
  };
}
