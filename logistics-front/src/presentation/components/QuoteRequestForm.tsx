import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { IQuoteRequest } from '../../domain/models/QuoteRequest';

interface QuoteRequestFormProps {
  onSubmit: (data: IQuoteRequest) => void;
  loading?: boolean;
}

interface FormErrors {
  origin?: string;
  destination?: string;
  weight?: string;
  pickupDate?: string;
}

export const QuoteRequestForm = ({ onSubmit, loading = false }: QuoteRequestFormProps) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    weight: '',
    pickupDate: '',
    fragile: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string | boolean): string | undefined => {
    switch (name) {
      case 'origin':
        if (typeof value === 'string' && value.trim() === '') {
          return 'El origen es requerido';
        }
        break;

      case 'destination':
        if (typeof value === 'string' && value.trim() === '') {
          return 'El destino es requerido';
        }
        break;

      case 'weight': {
        const weightNum = parseFloat(value as string);
        if (isNaN(weightNum) || weightNum <= 0) {
          return 'El peso debe ser mayor a 0.1 kg';
        }
        if (weightNum < 0.1) {
          return 'El peso debe ser mayor a 0.1 kg';
        }
        if (weightNum > 1000) {
          return 'El peso máximo permitido es 1000 kg';
        }
        break;
      }

      case 'pickupDate': {
        if (typeof value === 'string' && value) {
          const selectedDate = new Date(value + 'T00:00:00');
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (selectedDate < today) {
            return 'La fecha no puede ser anterior a hoy';
          }

          const maxDate = new Date();
          maxDate.setDate(maxDate.getDate() + 30);
          maxDate.setHours(0, 0, 0, 0);

          if (selectedDate > maxDate) {
            return 'La fecha no puede ser mayor a 30 días';
          }
        }
        break;
      }
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate all fields
    const originError = validateField('origin', formData.origin);
    if (originError) newErrors.origin = originError;

    const destinationError = validateField('destination', formData.destination);
    if (destinationError) newErrors.destination = destinationError;

    const weightError = validateField('weight', formData.weight);
    if (weightError) newErrors.weight = weightError;

    const dateError = validateField('pickupDate', formData.pickupDate);
    if (dateError) newErrors.pickupDate = dateError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, fieldValue);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, fieldValue);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      origin: true,
      destination: true,
      weight: true,
      pickupDate: true,
    });

    if (validateForm()) {
      const requestData: IQuoteRequest = {
        origin: formData.origin,
        destination: formData.destination,
        weight: parseFloat(formData.weight),
        pickupDate: formData.pickupDate,
        fragile: formData.fragile,
      };

      onSubmit(requestData);
    }
  };

  const isFormValid = () => {
    // Check if all required fields are filled
    if (
      formData.origin.trim() === '' ||
      formData.destination.trim() === '' ||
      formData.weight === '' ||
      formData.pickupDate === ''
    ) {
      return false;
    }

    // Check weight range
    const weightNum = parseFloat(formData.weight);
    if (isNaN(weightNum) || weightNum < 0.1 || weightNum > 1000) {
      return false;
    }

    // Check for any validation errors
    if (Object.values(errors).some(error => error !== undefined)) {
      return false;
    }

    return true;
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
        <label className="flex flex-col gap-2">
          <span className="text-text-muted text-sm font-medium">Origin Address</span>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-4 text-text-muted">my_location</span>
            <input
              id="origin"
              name="origin"
              type="text"
              value={formData.origin}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="123 Logistics Way, San Francisco, CA"
              className="w-full bg-background-light border border-border-light rounded-lg h-14 pl-12 pr-4 text-text-dark placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          {touched.origin && errors.origin && (
            <span className="text-red-600 text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.origin}
            </span>
          )}
        </label>

        {/* Destination */}
        <label className="flex flex-col gap-2">
          <span className="text-text-muted text-sm font-medium">City</span>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-4 text-primary">pin_drop</span>
            <input
              id="destination"
              name="destination"
              type="text"
              value={formData.destination}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter city, state, or zip"
              className="w-full bg-background-light border border-border-light rounded-lg h-14 pl-12 pr-4 text-text-dark placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          {touched.destination && errors.destination && (
            <span className="text-red-600 text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.destination}
            </span>
          )}
        </label>

        {/* Weight and Date Row */}
        <div className="flex flex-row gap-4">
          {/* Weight */}
          <label className="flex flex-col gap-2 flex-1">
            <span className="text-text-muted text-sm font-medium">Weight (kg)</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-4 text-text-muted">scale</span>
              <input
                id="weight"
                name="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0.00"
                className="w-full bg-background-light border border-border-light rounded-lg h-14 pl-12 pr-4 text-text-dark placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            {touched.weight && errors.weight && (
              <span className="text-red-600 text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.weight}
              </span>
            )}
          </label>

          {/* Pickup Date */}
          <label className="flex flex-col gap-2 flex-1">
            <span className="text-text-muted text-sm font-medium">Pickup Date</span>
            <div className="relative">
              <input
                id="pickupDate"
                name="pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full bg-background-light border border-border-light rounded-lg h-14 px-4 text-text-dark placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            {touched.pickupDate && errors.pickupDate && (
              <span className="text-red-600 text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.pickupDate}
              </span>
            )}
          </label>
        </div>

        {/* Fragile Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            id="fragile"
            name="fragile"
            type="checkbox"
            checked={formData.fragile}
            onChange={handleChange}
            className="w-5 h-5 text-primary bg-background-light border-border-light rounded focus:ring-primary focus:ring-2"
          />
          <span className="text-text-dark text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-accent-warning">fragile</span>
            Fragile Items (+15% surcharge)
          </span>
        </label>

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
