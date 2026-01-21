import React from 'react';
import type { Shipment } from '../models/Shipment';
import { getStatusInfo } from '../models/Shipment';
import { ProviderLogo } from './ProviderLogo';

interface ShipmentCardProps {
  shipment: Shipment;
  onClick?: () => void;
}

const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, onClick }) => {
  const statusInfo = getStatusInfo(shipment.currentStatus);
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 transition-all ${
        isClickable ? 'cursor-pointer hover:shadow-lg hover:border-blue-300' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-800">
              {shipment.trackingNumber}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-600">{shipment.customer.name}</p>
          <p className="text-xs text-gray-500">{shipment.customer.email}</p>
        </div>

        <ProviderLogo
          providerName={shipment.selectedQuote.providerName}
          size="sm"
        />
      </div>

      {/* Route */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Origen</p>
            <p className="text-sm font-semibold text-gray-800">
              {shipment.origin?.city || shipment.address?.origin || 'No especificado'}
            </p>
          </div>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>

          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Destino</p>
            <p className="text-sm font-semibold text-gray-800">
              {shipment.destination?.city || shipment.address?.destination || 'No especificado'}
            </p>
          </div>
        </div>
      </div>

      {/* Package Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Peso</p>
          <p className="text-sm font-semibold text-gray-800">
            {shipment.package.weight} kg
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Precio</p>
          <p className="text-sm font-semibold text-gray-800">
            ${shipment.selectedQuote.price.toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-gray-500 mb-1">Recogida</p>
          <p className="font-medium text-gray-700">
            {new Date(shipment.pickupDate).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        {shipment.estimatedDeliveryDate && (
          <div>
            <p className="text-gray-500 mb-1">Entrega Estimada</p>
            <p className="font-medium text-gray-700">
              {new Date(shipment.estimatedDeliveryDate).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Payment Status */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Pago</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              shipment.payment.status === 'COMPLETED'
                ? 'bg-green-100 text-green-700'
                : shipment.payment.status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {shipment.payment.status === 'COMPLETED' && '✓ Pagado'}
            {shipment.payment.status === 'PENDING' && '⏳ Pendiente'}
            {shipment.payment.status === 'FAILED' && '✗ Fallido'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShipmentCard;
