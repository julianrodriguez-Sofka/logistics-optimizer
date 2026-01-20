import React, { useState, useMemo } from 'react';
import type { CustomerFormData } from '../models/Customer';

export interface ShipmentDetailsData {
  sender: CustomerFormData;
  receiver: {
    name: string;
    phone: string;
    address: string;
  };
  packageDescription?: string;
}

interface ShipmentDetailsFormProps {
  onSubmit: (data: ShipmentDetailsData) => void;
  onBack?: () => void;
  isLoading?: boolean;
  originCity?: string;
  destinationCity?: string;
}

interface ValidationErrors {
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderAddress?: string;
  senderDocumentNumber?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
}

const ShipmentDetailsForm: React.FC<ShipmentDetailsFormProps> = ({
  onSubmit,
  onBack,
  isLoading = false,
  originCity,
  destinationCity,
}) => {
  const [formData, setFormData] = useState<ShipmentDetailsData>({
    sender: {
      name: '',
      email: '',
      phone: '',
      address: '',
      documentType: 'CC',
      documentNumber: '',
    },
    receiver: {
      name: '',
      phone: '',
      address: '',
    },
    packageDescription: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<'sender' | 'receiver' | 'package'>('sender');

  // Real-time validation using useMemo instead of useEffect
  const errors = useMemo<ValidationErrors>(() => {
    const newErrors: ValidationErrors = {};

    // Sender validations
    if (touched.senderName && formData.sender.name.length < 3) {
      newErrors.senderName = 'El nombre debe tener al menos 3 caracteres';
    }

    if (touched.senderEmail && formData.sender.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.sender.email)) {
        newErrors.senderEmail = 'Email inválido';
      }
    }

    if (touched.senderPhone && formData.sender.phone) {
      const phoneRegex = /^(\+57\s?)?3\d{9}$/;
      if (!phoneRegex.test(formData.sender.phone.replace(/\s/g, ''))) {
        newErrors.senderPhone = 'Formato: 3XX XXXXXXX';
      }
    }

    if (touched.senderAddress && formData.sender.address.length < 10) {
      newErrors.senderAddress = 'La dirección debe tener al menos 10 caracteres';
    }

    if (touched.senderDocumentNumber && formData.sender.documentNumber.length < 5) {
      newErrors.senderDocumentNumber = 'Mínimo 5 caracteres';
    }

    // Receiver validations
    if (touched.receiverName && formData.receiver.name.length < 3) {
      newErrors.receiverName = 'El nombre debe tener al menos 3 caracteres';
    }

    if (touched.receiverPhone && formData.receiver.phone) {
      const phoneRegex = /^(\+57\s?)?3\d{9}$/;
      if (!phoneRegex.test(formData.receiver.phone.replace(/\s/g, ''))) {
        newErrors.receiverPhone = 'Formato: 3XX XXXXXXX';
      }
    }

    if (touched.receiverAddress && formData.receiver.address.length < 10) {
      newErrors.receiverAddress = 'La dirección debe tener al menos 10 caracteres';
    }

    return newErrors;
  }, [formData, touched]);

  const handleSenderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      sender: { ...prev.sender, [name]: value },
    }));
  };

  const handleReceiverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      receiver: { ...prev.receiver, [name]: value },
    }));
  };

  const handlePackageDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, packageDescription: e.target.value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isSenderComplete = (): boolean => {
    if (!formData.sender.name || !formData.sender.email || !formData.sender.phone ||
        !formData.sender.address || !formData.sender.documentNumber) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+57\s?)?3\d{9}$/;
    return emailRegex.test(formData.sender.email) && 
           phoneRegex.test(formData.sender.phone.replace(/\s/g, '')) &&
           formData.sender.name.length >= 3 &&
           formData.sender.address.length >= 10 &&
           formData.sender.documentNumber.length >= 5;
  };

  const isReceiverComplete = (): boolean => {
    if (!formData.receiver.name || !formData.receiver.phone || !formData.receiver.address) {
      return false;
    }
    const phoneRegex = /^(\+57\s?)?3\d{9}$/;
    return phoneRegex.test(formData.receiver.phone.replace(/\s/g, '')) &&
           formData.receiver.name.length >= 3 &&
           formData.receiver.address.length >= 10;
  };

  const isFormValid = (): boolean => {
    return isSenderComplete() && isReceiverComplete();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation display
    const allTouched: Record<string, boolean> = {
      senderName: true,
      senderEmail: true,
      senderPhone: true,
      senderAddress: true,
      senderDocumentNumber: true,
      receiverName: true,
      receiverPhone: true,
      receiverAddress: true,
    };
    setTouched(allTouched);

    if (!isFormValid()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl">local_shipping</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalles del Envío</h1>
              <p className="text-sm text-gray-500">Complete la información para continuar</p>
            </div>
          </div>
        </div>

        {/* Route Summary */}
        {(originCity || destinationCity) && (
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-700">{originCity || 'Origen'}</span>
                </div>
                <div className="flex-1 h-0.5 w-16 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full"></div>
                <span className="material-symbols-outlined text-purple-500 text-xl">flight</span>
                <div className="flex-1 h-0.5 w-16 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <span className="text-sm font-semibold text-gray-700">{destinationCity || 'Destino'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex gap-2 mt-6">
          {[
            { id: 'sender', label: 'Remitente', icon: 'person', complete: isSenderComplete() },
            { id: 'receiver', label: 'Destinatario', icon: 'person_pin_circle', complete: isReceiverComplete() },
            { id: 'package', label: 'Paquete', icon: 'inventory_2', complete: true },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as 'sender' | 'receiver' | 'package')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                activeSection === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : tab.complete
                  ? 'bg-green-50 text-green-700 border-2 border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
              {tab.complete && activeSection !== tab.id && (
                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Sender Section */}
        <div className={`transition-all duration-300 ${activeSection === 'sender' ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">person</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Información del Remitente</h2>
                  <p className="text-indigo-100 text-sm">Quien envía el paquete</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">badge</span>
                    <input
                      type="text"
                      name="name"
                      value={formData.sender.name}
                      onChange={handleSenderChange}
                      onBlur={() => handleBlur('senderName')}
                      placeholder="Juan Pérez García"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all ${
                        errors.senderName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.senderName && <p className="mt-1 text-xs text-red-500">{errors.senderName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">mail</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.sender.email}
                      onChange={handleSenderChange}
                      onBlur={() => handleBlur('senderEmail')}
                      placeholder="juan@ejemplo.com"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all ${
                        errors.senderEmail ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.senderEmail && <p className="mt-1 text-xs text-red-500">{errors.senderEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">phone</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.sender.phone}
                      onChange={handleSenderChange}
                      onBlur={() => handleBlur('senderPhone')}
                      placeholder="300 123 4567"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all ${
                        errors.senderPhone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.senderPhone && <p className="mt-1 text-xs text-red-500">{errors.senderPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">id_card</span>
                    <select
                      name="documentType"
                      value={formData.sender.documentType}
                      onChange={handleSenderChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all appearance-none bg-white"
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="NIT">NIT</option>
                      <option value="PASSPORT">Pasaporte</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">pin</span>
                    <input
                      type="text"
                      name="documentNumber"
                      value={formData.sender.documentNumber}
                      onChange={handleSenderChange}
                      onBlur={() => handleBlur('senderDocumentNumber')}
                      placeholder="1234567890"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all ${
                        errors.senderDocumentNumber ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.senderDocumentNumber && <p className="mt-1 text-xs text-red-500">{errors.senderDocumentNumber}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección de Recogida <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 material-symbols-outlined text-gray-400">location_on</span>
                    <input
                      type="text"
                      name="address"
                      value={formData.sender.address}
                      onChange={handleSenderChange}
                      onBlur={() => handleBlur('senderAddress')}
                      placeholder="Calle 123 #45-67, Barrio Centro"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all ${
                        errors.senderAddress ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.senderAddress && <p className="mt-1 text-xs text-red-500">{errors.senderAddress}</p>}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSection('receiver')}
                  disabled={!isSenderComplete()}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  Continuar
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Receiver Section */}
        <div className={`transition-all duration-300 ${activeSection === 'receiver' ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">person_pin_circle</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Información del Destinatario</h2>
                  <p className="text-pink-100 text-sm">Quien recibe el paquete</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">badge</span>
                    <input
                      type="text"
                      name="name"
                      value={formData.receiver.name}
                      onChange={handleReceiverChange}
                      onBlur={() => handleBlur('receiverName')}
                      placeholder="María González López"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all ${
                        errors.receiverName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.receiverName && <p className="mt-1 text-xs text-red-500">{errors.receiverName}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">phone</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.receiver.phone}
                      onChange={handleReceiverChange}
                      onBlur={() => handleBlur('receiverPhone')}
                      placeholder="310 987 6543"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all ${
                        errors.receiverPhone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.receiverPhone && <p className="mt-1 text-xs text-red-500">{errors.receiverPhone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección de Entrega <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 material-symbols-outlined text-gray-400">home</span>
                    <input
                      type="text"
                      name="address"
                      value={formData.receiver.address}
                      onChange={handleReceiverChange}
                      onBlur={() => handleBlur('receiverAddress')}
                      placeholder="Carrera 45 #78-90, Apartamento 301"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all ${
                        errors.receiverAddress ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.receiverAddress && <p className="mt-1 text-xs text-red-500">{errors.receiverAddress}</p>}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveSection('sender')}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('package')}
                  disabled={!isReceiverComplete()}
                  className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-pink-200"
                >
                  Continuar
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Package Section */}
        <div className={`transition-all duration-300 ${activeSection === 'package' ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">inventory_2</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Descripción del Paquete</h2>
                  <p className="text-amber-100 text-sm">Información adicional (opcional)</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contenido del Paquete
                </label>
                <div className="relative">
                  <textarea
                    name="packageDescription"
                    value={formData.packageDescription}
                    onChange={handlePackageDescriptionChange}
                    placeholder="Ej: Documentos importantes, ropa, electrónicos, etc."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-all resize-none"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Esta información ayuda al transportista a manejar mejor su paquete
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">summarize</span>
                  Resumen del Envío
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Remitente</p>
                    <p className="font-semibold text-gray-800">{formData.sender.name || '—'}</p>
                    <p className="text-gray-600 text-xs">{originCity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Destinatario</p>
                    <p className="font-semibold text-gray-800">{formData.receiver.name || '—'}</p>
                    <p className="text-gray-600 text-xs">{destinationCity}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveSection('receiver')}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                  disabled={isLoading}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Cancelar
                </button>
              )}
              
              {/* Progress Indicator */}
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <div className={`w-3 h-3 rounded-full ${isSenderComplete() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Remitente</span>
                <div className={`w-3 h-3 rounded-full ${isReceiverComplete() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Destinatario</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Procesando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">payments</span>
                  Continuar al Pago
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ShipmentDetailsForm;
