/**
 * PaymentProcessingModal - Professional payment processing animation
 * 
 * Design Patterns:
 * - State Machine: Manages processing stages
 * - Observer: Notifies parent on completion
 * 
 * UX Best Practices:
 * - Clear visual feedback during processing
 * - Stage-based progress indication
 * - Success/Error states with animations
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { PaymentMethod } from '../models/Payment';

// ============================================================================
// TYPES
// ============================================================================

type ProcessingStage = 
  | 'validating'
  | 'processing'
  | 'confirming'
  | 'generating-invoice'
  | 'success'
  | 'error';

interface ProcessingStep {
  stage: ProcessingStage;
  label: string;
  duration: number; // milliseconds
  icon: string;
}

interface PaymentProcessingModalProps {
  isOpen: boolean;
  paymentMethod: PaymentMethod;
  amount: number;
  onComplete: () => void;
  onError?: (error: string) => void;
  trackingNumber?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  time: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_STEPS: ProcessingStep[] = [
  { stage: 'validating', label: 'Validando datos de la tarjeta...', duration: 1200, icon: '🔐' },
  { stage: 'processing', label: 'Conectando con el banco...', duration: 1500, icon: '🏦' },
  { stage: 'confirming', label: 'Confirmando transacción...', duration: 1300, icon: '✓' },
  { stage: 'generating-invoice', label: 'Generando factura electrónica...', duration: 1000, icon: '📄' },
  { stage: 'success', label: '¡Pago exitoso!', duration: 0, icon: '✅' },
];

const CASH_STEPS: ProcessingStep[] = [
  { stage: 'validating', label: 'Verificando pedido...', duration: 800, icon: '📋' },
  { stage: 'processing', label: 'Registrando pago en efectivo...', duration: 1000, icon: '💵' },
  { stage: 'generating-invoice', label: 'Generando factura electrónica...', duration: 1200, icon: '📄' },
  { stage: 'success', label: '¡Pedido confirmado!', duration: 0, icon: '✅' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FAC-${year}${month}-${random}`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Animated Processing Spinner
 */
const ProcessingSpinner: React.FC = () => (
  <div className="relative w-24 h-24">
    {/* Outer ring */}
    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
    {/* Spinning ring */}
    <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
    {/* Inner pulse */}
    <div className="absolute inset-4 bg-blue-100 rounded-full animate-pulse flex items-center justify-center">
      <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-75"></div>
    </div>
  </div>
);

/**
 * Success Animation
 */
const SuccessAnimation: React.FC = () => (
  <div className="relative w-24 h-24">
    <div className="absolute inset-0 bg-green-100 rounded-full animate-scale-up"></div>
    <div className="absolute inset-0 flex items-center justify-center">
      <svg 
        className="w-14 h-14 text-green-600 animate-check-mark" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" className="animate-draw-check" />
      </svg>
    </div>
  </div>
);

/**
 * Progress Steps Indicator
 */
interface ProgressStepsProps {
  steps: ProcessingStep[];
  currentIndex: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, currentIndex }) => (
  <div className="flex items-center justify-center gap-2 mt-6">
    {steps.map((step, index) => (
      <div
        key={step.stage}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          index < currentIndex
            ? 'bg-green-500'
            : index === currentIndex
            ? 'bg-blue-500 scale-125'
            : 'bg-gray-300'
        }`}
      />
    ))}
  </div>
);

/**
 * Invoice Preview Component
 */
interface InvoicePreviewProps {
  invoice: InvoiceData;
  amount: number;
  paymentMethod: PaymentMethod;
  trackingNumber?: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  amount,
  paymentMethod,
  trackingNumber,
}) => (
  <div className="bg-white border-2 border-green-200 rounded-xl p-6 mt-6 shadow-lg">
    {/* Invoice Header */}
    <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
      <div>
        <h4 className="text-lg font-bold text-gray-800">📄 Factura Electrónica</h4>
        <p className="text-sm text-gray-500">{invoice.invoiceNumber}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500">{invoice.date}</p>
        <p className="text-xs text-gray-400">{invoice.time}</p>
      </div>
    </div>

    {/* Invoice Details */}
    <div className="space-y-3">
      {trackingNumber && (
        <div className="flex justify-between">
          <span className="text-gray-600">Número de Seguimiento:</span>
          <span className="font-mono font-bold text-blue-600">{trackingNumber}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-gray-600">Método de Pago:</span>
        <span className="font-medium">
          {paymentMethod === 'CARD' ? '💳 Tarjeta de Crédito' : '💵 Efectivo (Contra entrega)'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Estado:</span>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          {paymentMethod === 'CARD' ? 'Pagado' : 'Pendiente de cobro'}
        </span>
      </div>
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">Total:</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(amount)}</span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  paymentMethod,
  amount,
  onComplete,
  trackingNumber,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  const steps = paymentMethod === 'CARD' ? CARD_STEPS : CASH_STEPS;
  const currentStep = steps[currentStepIndex];

  // Process steps sequentially
  const processSteps = useCallback(async () => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      
      if (steps[i].stage !== 'success') {
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      }
    }

    // Generate invoice data
    const now = new Date();
    setInvoice({
      invoiceNumber: generateInvoiceNumber(),
      date: now.toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    });

    setIsComplete(true);
  }, [steps]);

  // Start processing when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsComplete(false);
      setInvoice(null);
      processSteps();
    }
  }, [isOpen, processSteps]);

  // Handle completion
  const handleComplete = () => {
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
        {/* Processing State */}
        {!isComplete && (
          <div className="text-center">
            {/* Spinner */}
            <div className="flex justify-center mb-6">
              <ProcessingSpinner />
            </div>

            {/* Current Step */}
            <div className="mb-4">
              <span className="text-4xl mb-2 block">{currentStep?.icon}</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Procesando Pago
              </h3>
              <p className="text-gray-600 animate-pulse">
                {currentStep?.label}
              </p>
            </div>

            {/* Amount */}
            <div className="bg-blue-50 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-blue-600">Monto</p>
              <p className="text-2xl font-bold text-blue-800">
                {formatCurrency(amount)}
              </p>
            </div>

            {/* Progress Steps */}
            <ProgressSteps steps={steps} currentIndex={currentStepIndex} />

            {/* Warning */}
            <p className="text-xs text-gray-500 mt-4">
              Por favor no cierre esta ventana ni actualice la página
            </p>
          </div>
        )}

        {/* Success State */}
        {isComplete && invoice && (
          <div className="text-center">
            {/* Success Animation */}
            <div className="flex justify-center mb-4">
              <SuccessAnimation />
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-green-700 mb-2">
              {paymentMethod === 'CARD' ? '¡Pago Exitoso!' : '¡Pedido Confirmado!'}
            </h3>
            <p className="text-gray-600 mb-4">
              {paymentMethod === 'CARD' 
                ? 'Tu pago ha sido procesado correctamente'
                : 'Tu pedido ha sido registrado. Paga al momento de la recogida.'}
            </p>

            {/* Invoice Preview */}
            <InvoicePreview
              invoice={invoice}
              amount={amount}
              paymentMethod={paymentMethod}
              trackingNumber={trackingNumber}
            />

            {/* Continue Button */}
            <button
              onClick={handleComplete}
              className="mt-6 w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Continuar →
            </button>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes scale-up {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes draw-check {
          0% { stroke-dasharray: 0 100; }
          100% { stroke-dasharray: 100 0; }
        }
        
        .animate-scale-up {
          animation: scale-up 0.5s ease-out forwards;
        }
        
        .animate-draw-check {
          stroke-dasharray: 0 100;
          animation: draw-check 0.6s ease-out 0.3s forwards;
        }
        
        .animate-check-mark {
          opacity: 0;
          animation: scale-up 0.3s ease-out 0.2s forwards;
        }
      `}</style>
    </div>
  );
};

export { PaymentProcessingModal };
