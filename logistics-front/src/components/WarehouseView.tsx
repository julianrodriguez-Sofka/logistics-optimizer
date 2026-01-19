import React, { useState, useEffect, useCallback } from 'react';
import { useWarehouseWebSocket } from '../hooks/useWebSocket';
import { shipmentService } from '../services/shipmentService';
import { Shipment, ShipmentStatusType } from '../models/Shipment';
import ShipmentCard from './ShipmentCard';
import ShipmentFilters from './ShipmentFilters';
import ShipmentSearch from './ShipmentSearch';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

const WarehouseView: React.FC = () => {
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatusType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalShipments, setTotalShipments] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // WebSocket connection for real-time updates
  const {
    connected,
    shipments: realtimeShipments,
    setShipments: setRealtimeShipments,
    notifications,
    removeNotification,
  } = useWarehouseWebSocket();

  // Load shipments from API
  const loadShipments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters = {
        page,
        limit: 20,
        ...(selectedStatus !== 'ALL' && { status: selectedStatus }),
        ...(searchQuery && { search: searchQuery }),
      };

      const { shipments, total } = await shipmentService.getShipments(filters);
      setAllShipments(shipments);
      setTotalShipments(total);

      // Update real-time shipments if WebSocket is connected
      if (connected) {
        setRealtimeShipments(shipments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar envíos');
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedStatus, searchQuery, connected, setRealtimeShipments]);

  // Load status counts
  const loadStatusCounts = useCallback(async () => {
    try {
      const stats = await shipmentService.getStatistics();
      const counts: Record<string, number> = {
        ALL: stats.total,
        ...stats.byStatus,
      };
      setStatusCounts(counts);
    } catch (err) {
      console.error('Error loading status counts:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadShipments();
    loadStatusCounts();
  }, [loadShipments, loadStatusCounts]);

  // Update filtered shipments when WebSocket receives updates
  useEffect(() => {
    if (connected && realtimeShipments.length > 0) {
      setAllShipments(realtimeShipments);
    }
  }, [realtimeShipments, connected]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allShipments];

    // Filter by status
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter((s) => s.currentStatus === selectedStatus);
    }

    // Filter by search query
    if (searchQuery && searchQuery.length >= 3) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.trackingNumber?.toLowerCase().includes(query) ||
          s.customer.name.toLowerCase().includes(query) ||
          s.customer.email.toLowerCase().includes(query) ||
          s.origin.city.toLowerCase().includes(query) ||
          s.destination.city.toLowerCase().includes(query)
      );
    }

    setFilteredShipments(filtered);
  }, [allShipments, selectedStatus, searchQuery]);

  const handleStatusChange = (status: ShipmentStatusType | 'ALL') => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleShipmentClick = (shipment: Shipment) => {
    // TODO: Open shipment detail modal or navigate to detail page
    console.log('Shipment clicked:', shipment);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                📦 Almacén de Envíos
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {connected ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Conectado en tiempo real
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Sin conexión en tiempo real
                  </span>
                )}
              </p>
            </div>

            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {totalShipments}
              </p>
              <p className="text-sm text-gray-600">Total de Envíos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg shadow-sm ${
                notification.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : notification.type === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : notification.type === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  notification.type === 'success'
                    ? 'text-green-800'
                    : notification.type === 'error'
                    ? 'text-red-800'
                    : notification.type === 'warning'
                    ? 'text-yellow-800'
                    : 'text-blue-800'
                }`}
              >
                {notification.message}
              </p>
              <button
                onClick={() => removeNotification(index)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <ShipmentFilters
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusChange}
              counts={statusCounts}
            />
          </div>

          {/* Main Content - Shipments */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <ShipmentSearch onSearch={handleSearch} />
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6">
                <ErrorAlert
                  message={error}
                  onClose={() => setError(null)}
                />
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredShipments.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay envíos
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? 'No se encontraron resultados para tu búsqueda'
                    : selectedStatus !== 'ALL'
                    ? `No hay envíos con estado "${selectedStatus}"`
                    : 'Aún no hay envíos registrados'}
                </p>
              </div>
            )}

            {/* Shipments Grid */}
            {!isLoading && filteredShipments.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredShipments.map((shipment) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      onClick={() => handleShipmentClick(shipment)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalShipments > 20 && (
                  <div className="mt-8 flex justify-center items-center gap-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>

                    <span className="text-sm text-gray-600">
                      Página {page} de {Math.ceil(totalShipments / 20)}
                    </span>

                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil(totalShipments / 20)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseView;
