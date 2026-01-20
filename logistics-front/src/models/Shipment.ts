import type { Customer } from './Customer';
import type { Payment } from './Payment';
import type { IQuote as Quote } from './Quote';

export type ShipmentStatusType =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'CANCELLED'
  | 'RETURNED';

export interface Address {
  city: string;
  address: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface Package {
  weight: number;
  // Support both flat and nested dimensions format
  length?: number;
  width?: number;
  height?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isFragile?: boolean;
  fragile?: boolean; // Backend uses 'fragile' instead of 'isFragile'
  description?: string;
}

export interface StatusHistoryEntry {
  status: ShipmentStatusType;
  timestamp: Date;
  reason?: string;
  updatedBy?: string;
}

export interface Shipment {
  id?: string;
  trackingNumber?: string;
  customer: Customer;
  // Support both formats (frontend and backend)
  origin?: Address;
  destination?: Address;
  address?: {
    origin: string;
    destination: string;
    originCoordinates?: { lat: number; lng: number };
    destinationCoordinates?: { lat: number; lng: number };
  };
  package: Package;
  selectedQuote: Quote;
  payment: Payment;
  currentStatus: ShipmentStatusType;
  statusHistory: StatusHistoryEntry[];
  pickupDate: Date;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateShipmentDTO {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    documentType: string;
    documentNumber: string;
  };
  origin: Address;
  destination: Address;
  package: Package;
  selectedQuote: Quote;
  pickupDate: Date;
  payment: {
    method: 'CARD' | 'CASH';
    amount: number;
    cardNumber?: string;
    cardHolderName?: string;
    expirationDate?: string;
    cvv?: string;
  };
  notes?: string;
}

export interface ShipmentStatistics {
  total: number;
  byStatus: Record<ShipmentStatusType, number>;
  delayed: number;
  delivered: number;
}

export interface ShipmentFilters {
  status?: ShipmentStatusType;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Helper function to get status display info
export const getStatusInfo = (status: ShipmentStatusType) => {
  const statusMap: Record<ShipmentStatusType, { label: string; color: string; bgColor: string }> = {
    PENDING_PAYMENT: { 
      label: 'Pendiente de Pago', 
      color: 'text-yellow-700', 
      bgColor: 'bg-yellow-100' 
    },
    PAYMENT_CONFIRMED: { 
      label: 'Pago Confirmado', 
      color: 'text-green-700', 
      bgColor: 'bg-green-100' 
    },
    PROCESSING: { 
      label: 'En Procesamiento', 
      color: 'text-blue-700', 
      bgColor: 'bg-blue-100' 
    },
    READY_FOR_PICKUP: { 
      label: 'Listo para Recoger', 
      color: 'text-indigo-700', 
      bgColor: 'bg-indigo-100' 
    },
    IN_TRANSIT: { 
      label: 'En Tránsito', 
      color: 'text-purple-700', 
      bgColor: 'bg-purple-100' 
    },
    OUT_FOR_DELIVERY: { 
      label: 'En Reparto', 
      color: 'text-orange-700', 
      bgColor: 'bg-orange-100' 
    },
    DELIVERED: { 
      label: 'Entregado', 
      color: 'text-green-800', 
      bgColor: 'bg-green-200' 
    },
    FAILED_DELIVERY: { 
      label: 'Intento Fallido', 
      color: 'text-red-700', 
      bgColor: 'bg-red-100' 
    },
    CANCELLED: { 
      label: 'Cancelado', 
      color: 'text-gray-700', 
      bgColor: 'bg-gray-100' 
    },
    RETURNED: { 
      label: 'Devuelto', 
      color: 'text-amber-700', 
      bgColor: 'bg-amber-100' 
    },
  };

  return statusMap[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
};
