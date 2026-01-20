import React, { useState, useMemo } from 'react';
import type { CustomerFormData } from '../models/Customer';
import { FormField } from './FormField';

interface CustomerInfoFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  documentNumber?: string;
}

const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
  initialData,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    documentType: initialData?.documentType || 'CC',
    documentNumber: initialData?.documentNumber || '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Real-time validation using useMemo instead of useEffect
  const errors = useMemo<ValidationErrors>(() => {
    const newErrors: ValidationErrors = {};

    if (touched.name && formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (touched.email && formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
    }

    if (touched.phone && formData.phone) {
      // Colombian phone format: +57 3XX XXXXXXX or 3XXXXXXXXX
      const phoneRegex = /^(\+57\s?)?3\d{9}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Teléfono inválido (formato: +57 3XX XXXXXXX)';
      }
    }

    if (touched.address && formData.address.length < 10) {
      newErrors.address = 'La dirección debe tener al menos 10 caracteres';
    }

    if (touched.documentNumber && formData.documentNumber.length < 5) {
      newErrors.documentNumber = 'El número de documento debe tener al menos 5 caracteres';
    }

    return newErrors;
  }, [formData, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate all fields
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📋 Información del Cliente
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <FormField
              label="Nombre Completo"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              error={errors.name}
              required
              placeholder="Juan Pérez"
            />
          </div>

          {/* Email */}
          <FormField
            label="Correo Electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            required
            placeholder="juan@example.com"
          />

          {/* Phone */}
          <FormField
            label="Teléfono"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            onBlur={() => handleBlur('phone')}
            error={errors.phone}
            required
            placeholder="+57 300 1234567"
          />

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento <span className="text-red-500">*</span>
            </label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="NIT">NIT</option>
              <option value="PASSPORT">Pasaporte</option>
            </select>
          </div>

          {/* Document Number */}
          <FormField
            label="Número de Documento"
            name="documentNumber"
            type="text"
            value={formData.documentNumber}
            onChange={handleChange}
            onBlur={() => handleBlur('documentNumber')}
            error={errors.documentNumber}
            required
            placeholder="1234567890"
          />

          {/* Address */}
          <div className="md:col-span-2">
            <FormField
              label="Dirección Completa"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              onBlur={() => handleBlur('address')}
              error={errors.address}
              required
              placeholder="Calle 123 #45-67, Bogotá"
            />
          </div>
        </div>
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
          disabled={isLoading || Object.keys(errors).length > 0}
          className="ml-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Procesando...' : 'Continuar →'}
        </button>
      </div>
    </form>
  );
};

export default CustomerInfoForm;
