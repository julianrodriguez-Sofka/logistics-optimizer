import React, { useState, useMemo } from 'react';
import type { PaymentFormData, PaymentMethod } from '../models/Payment';
import { FormField } from './FormField';

interface PaymentFormProps {
  amount: number;
  onSubmit: (data: PaymentFormData) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

interface CardFormState {
  cardNumber: string;
  cardHolderName: string;
  expirationDate: string;
  cvv: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: {
    cardNumber?: string;
    cardHolderName?: string;
    expirationDate?: string;
    cvv?: string;
  };
}

// ============================================================================
// VALIDATION HELPERS - Extracted to reduce complexity
// ============================================================================

// Luhn Algorithm for card validation
const validateCardNumberLuhn = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Format card number with spaces (every 4 digits)
const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : digits;
};

// Format expiration date as MM/YY
const formatExpirationDate = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) {
    return digits.slice(0, 2) + '/' + digits.slice(2);
  }
  return digits;
};

// Detect card brand based on first digits
const getCardBrand = (cardNumber: string): string => {
  const digits = cardNumber.replace(/\s/g, '');
  if (/^4/.test(digits)) return '💳 Visa';
  if (/^5[1-5]/.test(digits)) return '💳 Mastercard';
  if (/^3[47]/.test(digits)) return '💳 American Express';
  if (/^6(?:011|5)/.test(digits)) return '💳 Discover';
  return '';
};

const validateCardNumberField = (cardNumber: string): string | undefined => {
  const cleanCardNumber = cardNumber.replace(/\s/g, '');
  
  if (!cleanCardNumber) return 'Número de tarjeta requerido';
  if (cleanCardNumber.length < 13) return 'Mínimo 13 dígitos';
  if (cleanCardNumber.length > 19) return 'Máximo 19 dígitos';
  if (!/^\d+$/.test(cleanCardNumber)) return 'Solo números permitidos';
  if (!validateCardNumberLuhn(cleanCardNumber)) return 'Número de tarjeta inválido';
  
  return undefined;
};

const validateCardHolderField = (cardHolderName: string): string | undefined => {
  const trimmedName = cardHolderName.trim();
  
  if (!trimmedName) return 'Nombre del titular requerido';
  if (trimmedName.length < 3) return 'Mínimo 3 caracteres';
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(trimmedName)) return 'Solo letras permitidas';
  
  return undefined;
};

const validateExpirationField = (expirationDate: string): string | undefined => {
  if (!expirationDate) return 'Fecha requerida';
  
  const expMatch = expirationDate.match(/^(\d{2})\/(\d{2})$/);
  if (!expMatch) return 'Formato: MM/YY';
  
  const month = parseInt(expMatch[1], 10);
  const year = parseInt(expMatch[2], 10) + 2000;
  
  if (month < 1 || month > 12) return 'Mes inválido (01-12)';
  
  const now = new Date();
  const expDate = new Date(year, month - 1, 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  if (expDate < currentMonth) return 'Tarjeta expirada';
  
  return undefined;
};

const validateCvvField = (cvv: string): string | undefined => {
  if (!cvv) return 'CVV requerido';
  if (!/^\d{3,4}$/.test(cvv)) return '3-4 dígitos';
  return undefined;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [cardForm, setCardForm] = useState<CardFormState>({
    cardNumber: '',
    cardHolderName: '',
    expirationDate: '',
    cvv: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Validate card form - returns validation result
  const validateCardForm = useMemo((): ValidationResult => {
    const errors: ValidationResult['errors'] = {};
    
    errors.cardNumber = validateCardNumberField(cardForm.cardNumber);
    errors.cardHolderName = validateCardHolderField(cardForm.cardHolderName);
    errors.expirationDate = validateExpirationField(cardForm.expirationDate);
    errors.cvv = validateCvvField(cardForm.cvv);

    // Remove undefined values
    Object.keys(errors).forEach(key => {
      if (errors[key as keyof typeof errors] === undefined) {
        delete errors[key as keyof typeof errors];
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, [cardForm]);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    if (paymentMethod === 'CASH') return true;
    return validateCardForm.isValid;
  }, [paymentMethod, validateCardForm.isValid]);

  // Get error to display for a field (only if touched or submit attempted)
  const getFieldError = (field: keyof ValidationResult['errors']): string | undefined => {
    if (!touched[field] && !submitAttempted) return undefined;
    return validateCardForm.errors[field];
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setTouched({});
    setSubmitAttempted(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setCardForm((prev) => {
      switch (name) {
        case 'cardNumber':
          return { ...prev, cardNumber: formatCardNumber(value) };
        case 'expirationDate':
          return { ...prev, expirationDate: formatExpirationDate(value) };
        case 'cvv':
          return { ...prev, cvv: value.replace(/\D/g, '').slice(0, 4) };
        case 'cardHolderName':
          return { ...prev, cardHolderName: value.toUpperCase() };
        default:
          return prev;
      }
    });
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (paymentMethod === 'CARD') {
      // Mark all fields as touched to show errors
      setTouched({
        cardNumber: true,
        cardHolderName: true,
        expirationDate: true,
        cvv: true,
      });

      if (!validateCardForm.isValid) {
        return;
      }
    }

    // Build payment data
    const paymentData: PaymentFormData = {
      method: paymentMethod,
      amount,
      ...(paymentMethod === 'CARD' && {
        cardNumber: cardForm.cardNumber.replace(/\s/g, ''), // Remove spaces before sending
        cardHolderName: cardForm.cardHolderName,
        expirationDate: cardForm.expirationDate,
        cvv: cardForm.cvv,
      }),
    };

    onSubmit(paymentData);
  };

  const cardBrand = cardForm.cardNumber ? getCardBrand(cardForm.cardNumber) : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">💳 Método de Pago</h2>

        {/* Payment Method Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => handleMethodChange('CARD')}
            className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all ${
              paymentMethod === 'CARD'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            💳 Tarjeta
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange('CASH')}
            className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all ${
              paymentMethod === 'CASH'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            💵 Efectivo
          </button>
        </div>

        {/* Amount Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Total a Pagar</p>
          <p className="text-3xl font-bold text-gray-800">
            ${amount.toLocaleString('es-CO')}
          </p>
        </div>

        {/* Card Payment Form */}
        {paymentMethod === 'CARD' && (
          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <FormField
                label="Número de Tarjeta"
                name="cardNumber"
                type="text"
                value={cardForm.cardNumber}
                onChange={handleChange}
                onBlur={() => handleBlur('cardNumber')}
                error={getFieldError('cardNumber')}
                required
                placeholder="1234 5678 9012 3456"
                autoComplete="cc-number"
              />
              {cardBrand && !getFieldError('cardNumber') && (
                <p className="mt-1 text-sm text-blue-600 font-medium">
                  {cardBrand}
                </p>
              )}
            </div>

            {/* Card Holder Name */}
            <FormField
              label="Nombre del Titular"
              name="cardHolderName"
              type="text"
              value={cardForm.cardHolderName}
              onChange={handleChange}
              onBlur={() => handleBlur('cardHolderName')}
              error={getFieldError('cardHolderName')}
              required
              placeholder="NOMBRE APELLIDO"
              autoComplete="cc-name"
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Expiration Date */}
              <FormField
                label="Fecha de Expiración"
                name="expirationDate"
                type="text"
                value={cardForm.expirationDate}
                onChange={handleChange}
                onBlur={() => handleBlur('expirationDate')}
                error={getFieldError('expirationDate')}
                required
                placeholder="MM/YY"
                autoComplete="cc-exp"
              />

              {/* CVV */}
              <FormField
                label="CVV"
                name="cvv"
                type="password"
                value={cardForm.cvv}
                onChange={handleChange}
                onBlur={() => handleBlur('cvv')}
                error={getFieldError('cvv')}
                required
                placeholder="•••"
                autoComplete="cc-csc"
              />
            </div>

            {/* Validation Status Indicator */}
            <div className={`rounded-lg p-4 mt-4 ${canSubmit ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <p className={`text-sm ${canSubmit ? 'text-green-800' : 'text-yellow-800'}`}>
                {canSubmit ? (
                  <>🔒 <strong>Listo para procesar:</strong> Todos los datos son válidos.</>
                ) : (
                  <>⚠️ <strong>Complete todos los campos:</strong> Verifique los datos de la tarjeta.</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Cash Payment Info */}
        {paymentMethod === 'CASH' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              💵 Pago en Efectivo
            </h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li>✓ Pago al momento de la recogida</li>
              <li>✓ El conductor llevará terminal portátil</li>
              <li>✓ Se emitirá factura electrónica</li>
              <li>✓ Monto exacto: ${amount.toLocaleString('es-CO')}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            ← Volver
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading || !canSubmit}
          className={`ml-auto px-8 py-3 font-semibold rounded-lg transition-colors ${
            canSubmit && !isLoading
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Procesando...
            </span>
          ) : (
            'Confirmar Pago →'
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
