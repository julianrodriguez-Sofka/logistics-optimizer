//HUMAN REVIEW
/**
 * REFACTORED: Now uses centralized QuoteValidator and useQuoteFormState
 * Reduced from 244 to ~130 lines - Implements SRP
 */

import type { FormEvent } from 'react';
import type { IQuoteRequest } from '../models/QuoteRequest';
import { useQuoteFormState } from '../hooks/useQuoteFormState';
import { FormField } from './FormField';import { VALIDATION, BUSINESS_RULES } from '../utils/constants';
interface QuoteRequestFormProps {
  onSubmit: (data: IQuoteRequest) => void;
  loading?: boolean;
}

export const QuoteRequestForm = ({ onSubmit, loading = false }: QuoteRequestFormProps) => {
  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    isFormValid,
    resetForm,
  } = useQuoteFormState();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateAll()) {
      const requestData: IQuoteRequest = {
        origin: formData.origin,
        destination: formData.destination,
        weight: parseFloat(formData.weight),
        pickupDate: formData.pickupDate,
        fragile: formData.fragile,
      };

      onSubmit(requestData);
      resetForm();
    }
  };

  return (
    <div className="bg-card-light border border-border-light rounded-2xl p-6 shadow-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border-light pb-4">
          <span className="material-symbols-outlined text-primary">edit_location_alt</span>
          <h3 className="text-text-dark text-lg font-bold">Route Details</h3>
        </div>

        {/* Origin */}
        <FormField
          name="origin"
          label="Origin Address"
          type="text"
          value={formData.origin}
          placeholder="123 Logistics Way, San Francisco, CA"
          icon="my_location"
          error={errors.origin}
          touched={touched.origin}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        {/* Destination */}
        <FormField
          name="destination"
          label="City"
          type="text"
          value={formData.destination}
          placeholder="Enter city, state, or zip"
          icon="pin_drop"
          error={errors.destination}
          touched={touched.destination}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        {/* Weight and Date Row */}
        <div className="flex flex-row gap-4">
          {/* Weight */}
          <div className="flex-1">
            <FormField
              name="weight"
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              placeholder="0.00"
              icon="scale"
              error={errors.weight}
              touched={touched.weight}
              onChange={handleChange}
              onBlur={handleBlur}
              step={String(VALIDATION.WEIGHT.STEP)}
            />
          </div>

          {/* Pickup Date */}
          <div className="flex-1">
            <FormField
              name="pickupDate"
              label="Pickup Date"
              type="date"
              value={formData.pickupDate}
              error={errors.pickupDate}
              touched={touched.pickupDate}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
        </div>

        {/* Fragile Checkbox */}
        <FormField
          name="fragile"
          label={`Fragile Items (+${BUSINESS_RULES.FRAGILE_SURCHARGE_PERCENTAGE}% surcharge)`}
          type="checkbox"
          value={formData.fragile}
          error={errors.fragile}
          touched={touched.fragile}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className={`w-full ${
              !isFormValid() || loading
                ? 'bg-border-light text-text-muted cursor-not-allowed'
                : 'bg-primary hover:bg-green-700 text-white shadow-lg shadow-primary/20'
            } font-bold h-14 rounded-lg transition-all flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Calculating...
              </>
            ) : (
              <>
                Calculate Rates
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
