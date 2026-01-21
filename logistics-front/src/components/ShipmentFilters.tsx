import type { ShipmentStatusType } from '../models/Shipment';
import { getStatusInfo } from '../models/Shipment';

interface ShipmentFiltersProps {
  selectedStatus: ShipmentStatusType | 'ALL';
  onStatusChange: (status: ShipmentStatusType | 'ALL') => void;
  counts?: Record<ShipmentStatusType | 'ALL', number>;
}

const ShipmentFilters: React.FC<ShipmentFiltersProps> = ({
  selectedStatus,
  onStatusChange,
  counts = {} as Record<ShipmentStatusType | 'ALL', number>,
}) => {
  const statuses: Array<{ value: ShipmentStatusType | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PENDING_PAYMENT', label: 'Pendiente Pago' },
    { value: 'PAYMENT_CONFIRMED', label: 'Pago Confirmado' },
    { value: 'PROCESSING', label: 'Procesamiento' },
    { value: 'READY_FOR_PICKUP', label: 'Listo Recoger' },
    { value: 'IN_TRANSIT', label: 'En Tránsito' },
    { value: 'OUT_FOR_DELIVERY', label: 'En Reparto' },
    { value: 'DELIVERED', label: 'Entregado' },
    { value: 'FAILED_DELIVERY', label: 'Intento Fallido' },
    { value: 'CANCELLED', label: 'Cancelado' },
    { value: 'RETURNED', label: 'Devuelto' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        🔍 Filtrar por Estado
      </h3>

      <div className="space-y-2">
        {statuses.map((status) => {
          const isSelected = selectedStatus === status.value;
          const count = counts[status.value] || 0;
          const statusInfo =
            status.value !== 'ALL' ? getStatusInfo(status.value) : null;

          return (
            <button
              key={status.value}
              onClick={() => onStatusChange(status.value)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                isSelected
                  ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {statusInfo && (
                  <span
                    className={`w-3 h-3 rounded-full ${statusInfo.bgColor}`}
                  ></span>
                )}
                <span
                  className={`text-sm font-medium ${
                    isSelected ? 'text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {status.label}
                </span>
              </div>

              {count > 0 && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ShipmentFilters;
