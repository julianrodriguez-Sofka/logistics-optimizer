import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from 'react';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  name: string;
  label: string;
  type: string;
  value: string | number | boolean;
  placeholder?: string;
  icon?: string;
  error?: string;
  touched?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void | (() => void);
  step?: string;
  required?: boolean;
  autoComplete?: string;
}

/**
 * Reusable form field component
 * Implements Single Responsibility Principle
 * Handles rendering of a single form input with validation
 */
export const FormField = ({
  name,
  label,
  type,
  value,
  placeholder,
  icon,
  error,
  touched,
  onChange,
  onBlur,
  step,
  required,
  autoComplete,
  ...rest
}: FormFieldProps) => {
  const isCheckbox = type === 'checkbox';
  // Show error if there's an error and either touched is true or touched is undefined (always show)
  const showError = !!error && (touched === true || touched === undefined);

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      // Handle both function signatures
      if (typeof onBlur === 'function') {
        const result = onBlur(e);
        // If onBlur doesn't use the event, it might be a simple callback
        if (result === undefined) return;
      }
    }
  };

  return (
    <label className="flex flex-col gap-2">
      <span className="text-text-muted text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <div className="relative group">
        {icon && !isCheckbox && (
          <span className="material-symbols-outlined absolute left-4 top-4 text-text-muted">
            {icon}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={isCheckbox ? undefined : typeof value === 'boolean' ? '' : value}
          checked={isCheckbox ? (value as boolean) : undefined}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          step={step}
          required={required}
          autoComplete={autoComplete}
          {...rest}
          className={`
            ${
              isCheckbox
                ? 'w-5 h-5 text-primary bg-background-light border-border-light rounded focus:ring-primary focus:ring-2 cursor-pointer'
                : `w-full bg-background-light border rounded-lg h-14 ${
                    icon ? 'pl-12' : 'px-4'
                  } pr-4 text-text-dark placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all ${
                    showError ? 'border-red-500 focus:ring-red-500' : 'border-border-light'
                  }`
            }
          `}
        />
      </div>
      {showError && (
        <span className="text-red-600 text-xs flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </span>
      )}
    </label>
  );
};
