// ProviderStatusWidget component for HU-04 system health display

import { useProviderStatus } from '../hooks/useProviderStatus';
import { StatusIndicator } from './StatusIndicator';

export function ProviderStatusWidget() {
  const { status, loading, error } = useProviderStatus();

  if (loading) {
    return (
      <div className="p-6 bg-card-light rounded-lg border border-border-light">
        <p className="text-text-muted">Cargando estado del sistema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-card-light rounded-lg border border-border-light">
        <p className="text-red-600">Error al cargar el estado: {error}</p>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="p-6 bg-card-light rounded-lg border border-border-light space-y-4">
      {/* System Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-text-dark">Sistema:</h3>
          <StatusIndicator status={status.systemStatus} />
        </div>
        <div className="text-sm text-text-muted">
          {status.activeProviders}/{status.totalProviders} Proveedores Activos
        </div>
      </div>

      {/* Providers Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left py-2 px-3 font-semibold text-text-dark">Proveedor</th>
              <th className="text-left py-2 px-3 font-semibold text-text-dark">Estado</th>
              <th className="text-right py-2 px-3 font-semibold text-text-dark">Tiempo de Respuesta</th>
            </tr>
          </thead>
          <tbody>
            {status.providers.map((provider) => (
              <tr key={provider.providerName} className="border-b border-border-light last:border-0">
                <td className="py-3 px-3 font-medium text-text-dark">{provider.providerName}</td>
                <td className="py-3 px-3">
                  <StatusIndicator status={provider.status === 'online' ? 'online' : 'offline'} />
                </td>
                <td className="py-3 px-3 text-right text-text-muted">
                  {provider.responseTime ? `${provider.responseTime}ms` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Last Update */}
      <div className="text-xs text-text-muted text-right">
        Última actualización: {new Date(status.lastUpdate).toLocaleTimeString('es-ES')}
      </div>
    </div>
  );
}
