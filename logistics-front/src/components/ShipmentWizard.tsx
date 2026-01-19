import React, { useState, useEffect } from 'react';
import { QuoteRequestForm } from './QuoteRequestForm';
import QuoteSelectionCard from './QuoteSelectionCard';
import ShipmentDetailsForm from './ShipmentDetailsForm';
import PaymentForm from './PaymentForm';
import { StepIndicator } from './StepIndicator';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import type { ShipmentDetailsData } from './ShipmentDetailsForm';
import type { IQuoteRequest } from '../models/QuoteRequest';
import type { IQuote } from '../models/Quote';
import type { PaymentFormData } from '../models/Payment';
import type { CreateShipmentDTO } from '../models/Shipment';
import { shipmentService } from '../services/shipmentService';
import { requestQuotes } from '../services/quoteService';

type WizardStep = 'address' | 'quotes' | 'customer' | 'payment' | 'confirmation';

interface ShipmentWizardProps {
  selectedQuote?: IQuote | null;
  quoteRequest?: IQuoteRequest | null;
  onBack?: () => void;
}

const ShipmentWizard: React.FC<ShipmentWizardProps> = ({ 
  selectedQuote: initialSelectedQuote,
  quoteRequest: initialQuoteRequest,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('address');
  const [quoteRequest, setQuoteRequest] = useState<IQuoteRequest | null>(initialQuoteRequest || null);
  const [quotes, setQuotes] = useState<IQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<IQuote | null>(initialSelectedQuote || null);
  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetailsData | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShipment, setCreatedShipment] = useState<any>(null);

  // If quote and request are provided, skip to customer step
  useEffect(() => {
    if (initialSelectedQuote && initialQuoteRequest) {
      setCurrentStep('customer');
    }
  }, [initialSelectedQuote, initialQuoteRequest]);

  // Step 1: Address & Package Data
  const handleQuoteRequest = async (request: IQuoteRequest) => {
    try {
      setError(null);
      setIsLoadingQuotes(true);
      setQuoteRequest(request);

      const response = await requestQuotes(request);
      setQuotes(response.quotes);
      setCurrentStep('quotes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener cotizaciones');
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  // Step 2: Quote Selection
  const handleQuoteSelection = (quote: IQuote) => {
    setSelectedQuote(quote);
    setCurrentStep('customer');
  };

  // Step 3: Customer Data
  const handleShipmentDetailsSubmit = (details: ShipmentDetailsData) => {
    setShipmentDetails(details);
    setCurrentStep('payment');
  };

  // Step 4: Payment & Create Shipment
  const handlePaymentSubmit = async (payment: PaymentFormData) => {
    if (!quoteRequest || !selectedQuote || !shipmentDetails) return;

    try {
      setError(null);
      setIsCreatingShipment(true);

      const shipmentData: CreateShipmentDTO = {
        customer: {
          name: shipmentDetails.sender.name,
          email: shipmentDetails.sender.email,
          phone: shipmentDetails.sender.phone,
          address: shipmentDetails.sender.address,
          documentType: shipmentDetails.sender.documentType,
          documentNumber: shipmentDetails.sender.documentNumber,
        },
        origin: {
          city: quoteRequest.origin,
          address: shipmentDetails.sender.address,
          postalCode: '',
        },
        destination: {
          city: quoteRequest.destination,
          address: shipmentDetails.receiver.address,
          postalCode: '',
        },
        package: {
          weight: quoteRequest.weight,
          length: 30,
          width: 20,
          height: 15,
          isFragile: quoteRequest.fragile,
          description: shipmentDetails.packageDescription || 'Paquete estándar',
        },
        selectedQuote: {
          providerId: selectedQuote.providerId,
          providerName: selectedQuote.providerName,
          price: selectedQuote.price,
          currency: selectedQuote.currency,
          minDays: selectedQuote.minDays,
          maxDays: selectedQuote.maxDays,
          transportMode: selectedQuote.transportMode,
        },
        pickupDate: new Date(quoteRequest.pickupDate),
        payment: {
          method: payment.method,
          amount: payment.amount,
          ...(payment.method === 'CARD' && {
            cardNumber: payment.cardNumber,
            cardHolderName: payment.cardHolderName,
            expirationDate: payment.expirationDate,
            cvv: payment.cvv,
          }),
        },
        notes: `Destinatario: ${shipmentDetails.receiver.name}, Tel: ${shipmentDetails.receiver.phone}`,
      };

      const shipment = await shipmentService.createShipment(shipmentData);
      setCreatedShipment(shipment);
      setCurrentStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el envío');
    } finally {
      setIsCreatingShipment(false);
    }
  };

  // Navigation
  const handleBack = () => {
    setError(null);
    if (currentStep === 'quotes') setCurrentStep('address');
    else if (currentStep === 'customer') {
      if (initialSelectedQuote && onBack) {
        onBack(); // Go back to quote selection view
      } else {
        setCurrentStep('quotes');
      }
    }
    else if (currentStep === 'payment') setCurrentStep('customer');
  };

  const handleStartNew = () => {
    setCurrentStep('address');
    setQuoteRequest(null);
    setQuotes([]);
    setSelectedQuote(null);
    setShipmentDetails(null);
    setCreatedShipment(null);
    setError(null);
  };

  const steps = [
    { id: 'address', label: 'Direcciones', icon: '📍' },
    { id: 'quotes', label: 'Cotizaciones', icon: '💰' },
    { id: 'customer', label: 'Cliente', icon: '👤' },
    { id: 'payment', label: 'Pago', icon: '💳' },
    { id: 'confirmation', label: 'Confirmación', icon: '✅' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📦 Crear Nuevo Envío
          </h1>
          <p className="text-gray-600">
            Completa los pasos para crear tu envío y realizar el pago
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <StepIndicator
            steps={steps.map((s, i) => ({
              label: s.label,
              completed: i < currentStepIndex,
              active: i === currentStepIndex,
            }))}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Step 1: Address & Package */}
          {currentStep === 'address' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                📍 Paso 1: Información del Envío
              </h2>
              <QuoteRequestForm
                onSubmit={handleQuoteRequest}
                loading={isLoadingQuotes}
              />
            </div>
          )}

          {/* Step 2: Quote Selection */}
          {currentStep === 'quotes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  💰 Paso 2: Selecciona una Cotización
                </h2>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Volver
                </button>
              </div>

              {quotes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No hay cotizaciones disponibles</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quotes.map((quote) => (
                    <QuoteSelectionCard
                      key={`${quote.providerName}-${quote.price}`}
                      quote={quote}
                      isSelected={selectedQuote === quote}
                      onSelect={() => handleQuoteSelection(quote)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Customer Information */}
          {currentStep === 'customer' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                � Paso 3: Detalles del Envío
              </h2>
              <ShipmentDetailsForm
                onSubmit={handleShipmentDetailsSubmit}
                onBack={handleBack}
                originCity={quoteRequest?.origin}
                destinationCity={quoteRequest?.destination}
              />
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 'payment' && selectedQuote && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                💳 Paso 4: Método de Pago
              </h2>
              <PaymentForm
                amount={selectedQuote.price}
                onSubmit={handlePaymentSubmit}
                onBack={handleBack}
                isLoading={isCreatingShipment}
              />
            </div>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === 'confirmation' && createdShipment && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  ✅ ¡Envío Creado Exitosamente!
                </h2>
                <p className="text-gray-600 mb-6">
                  Tu envío ha sido registrado y el pago fue procesado correctamente
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-600 mb-2">Número de Seguimiento</p>
                <p className="text-4xl font-bold text-blue-600 mb-4">
                  {createdShipment.trackingNumber}
                </p>
                <p className="text-sm text-gray-600">
                  Guarda este número para rastrear tu envío
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
                {/* Sender Info */}
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-blue-600">send</span>
                    <h4 className="text-sm font-bold text-gray-700">Remitente</h4>
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">
                    {createdShipment.customer.name}
                  </p>
                  <p className="text-sm text-gray-600">{createdShipment.customer.email}</p>
                  <p className="text-sm text-gray-600">{createdShipment.customer.phone}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {createdShipment.origin?.city 
                      ? `${createdShipment.origin.city} - ${createdShipment.origin.address}`
                      : createdShipment.address?.origin || 'Origen no especificado'}
                  </p>
                </div>

                {/* Receiver Info */}
                {shipmentDetails && (
                  <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-green-600">person_pin_circle</span>
                      <h4 className="text-sm font-bold text-gray-700">Destinatario</h4>
                    </div>
                    <p className="font-semibold text-gray-800 mb-1">
                      {shipmentDetails.receiver.name}
                    </p>
                    <p className="text-sm text-gray-600">{shipmentDetails.receiver.phone}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {createdShipment.destination?.city 
                        ? `${createdShipment.destination.city} - ${createdShipment.destination.address}`
                        : createdShipment.address?.destination || 'Destino no especificado'}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Proveedor</p>
                  <p className="font-semibold text-gray-800">
                    {createdShipment.selectedQuote.providerName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {createdShipment.selectedQuote.minDays}-{createdShipment.selectedQuote.maxDays} días
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Método de Pago</p>
                  <p className="font-semibold text-gray-800">
                    {createdShipment.payment.method === 'CARD' ? '💳 Tarjeta' : '💵 Efectivo'}
                  </p>
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    {createdShipment.payment.status === 'COMPLETED' ? 'Pagado' : 'Pendiente'}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Pagado</p>
                  <p className="font-semibold text-gray-800">
                    ${createdShipment.payment.amount.toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">COP</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStartNew}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Otro Envío
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Imprimir Comprobante
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {(isLoadingQuotes || isCreatingShipment) && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600">
                {isLoadingQuotes && 'Obteniendo cotizaciones...'}
                {isCreatingShipment && 'Creando envío y procesando pago...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentWizard;
