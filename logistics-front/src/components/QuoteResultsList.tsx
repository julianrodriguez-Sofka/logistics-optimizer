import { useState } from 'react';
import type { IQuote, IProviderMessage, IRouteInfo } from '../models/Quote';
import { getProviderColor } from '../utils/providerConfig';
import { ProviderLogo } from './ProviderLogo';
import { OfflineProviderMessage } from './OfflineProviderMessage';
import { RouteMapModal } from './RouteMapModal';

interface QuoteResultsListProps {
  quotes: IQuote[];
  messages: IProviderMessage[];
  routeInfo?: IRouteInfo;
}

export const QuoteResultsList = ({ quotes, messages, routeInfo }: QuoteResultsListProps) => {
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');

  // Extract origin and destination from first quote or use defaults
  const getDefaultAddresses = () => {
    if (routeInfo) {
      return {
        origin: routeInfo.origin.address,
        destination: routeInfo.destination.address
      };
    }
    if (quotes[0]?.routeInfo) {
      return {
        origin: quotes[0].routeInfo.origin.address,
        destination: quotes[0].routeInfo.destination.address
      };
    }
    // Fallback to demo addresses
    return {
      origin: 'Bogotá, Colombia',
      destination: 'Medellín, Colombia'
    };
  };

  const handleShowRoute = (customOrigin?: string, customDestination?: string) => {
    const defaults = getDefaultAddresses();
    setSelectedOrigin(customOrigin || defaults.origin);
    setSelectedDestination(customDestination || defaults.destination);
    setShowMapModal(true);
  };

  if (quotes.length === 0) {
    return (
      <div className="p-5 text-center">
        <p className="text-text-muted">No se encontraron cotizaciones disponibles</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Map Button - Always visible */}
      <div className="flex items-center justify-between pb-2 flex-wrap gap-3">
        <h3 className="text-text-dark text-xl font-bold">Cotizaciones Recomendadas</h3>
        <button
          onClick={() => handleShowRoute()}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all hover:shadow-lg shadow-primary/20"
          title="Ver ruta en mapa interactivo"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>map</span>
          Ver Ruta en Mapa
        </button>
      </div>

      {/* Route Information Summary */}
      {routeInfo && (
        <div className="bg-gradient-to-r from-primary/5 to-accent-info/5 border border-primary/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary">route</span>
            <h4 className="text-text-dark font-bold text-sm">Información de Ruta</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <span className="material-symbols-outlined text-primary mb-1" style={{ fontSize: '20px' }}>straighten</span>
              <p className="text-xs text-text-muted mb-1">Distancia</p>
              <p className="text-lg font-bold text-text-dark">{routeInfo.distanceKm.toFixed(0)} km</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <span className="material-symbols-outlined text-accent-info mb-1" style={{ fontSize: '20px' }}>schedule</span>
              <p className="text-xs text-text-muted mb-1">Duración</p>
              <p className="text-lg font-bold text-text-dark">{routeInfo.durationFormatted}</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <span className="material-symbols-outlined text-accent-success mb-1" style={{ fontSize: '20px' }}>category</span>
              <p className="text-xs text-text-muted mb-1">Categoría</p>
              <p className="text-lg font-bold text-text-dark">{routeInfo.category}</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <span className="material-symbols-outlined text-accent-warning mb-1" style={{ fontSize: '20px' }}>location_on</span>
              <p className="text-xs text-text-muted mb-1">Ruta</p>
              <p className="text-sm font-medium text-text-dark">
                {routeInfo.origin.address.split(',')[0]} → {routeInfo.destination.address.split(',')[0]}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {quotes.map((quote, index) => {
          const providerColor = getProviderColor(quote.providerId);
          let cardVariantClasses = 'border-border-light hover:border-primary/50';
          if (quote.isCheapest) {
            cardVariantClasses = 'border-accent-success hover:border-accent-success/70';
          } else if (quote.isFastest) {
            cardVariantClasses = 'border-accent-info shadow-xl shadow-accent-info/10';
          }

          return (
            <div
      key={`${quote.providerId}-${index}`}
      data-testid="quote-card"
      className={`group relative overflow-hidden rounded-xl border ${cardVariantClasses} bg-card-light p-6 transition-all hover:shadow-lg cursor-pointer`}
    >
             
              <div className={`absolute top-0 left-0 w-1 h-full ${providerColor}`}></div>

              <div className="flex flex-col sm:flex-row gap-6 items-center">
              
                <ProviderLogo providerId={quote.providerId} />

      
                <div className="flex-1 flex flex-col gap-1 w-full text-center sm:text-left">
                  <h4 className="text-text-dark text-lg font-bold">{quote.providerName}</h4>
                  <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-text-muted">
                    <span className={`flex items-center gap-1 ${quote.isFastest ? 'text-accent-info font-medium' : ''}`}>
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {quote.minDays}-{quote.maxDays} Days
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        {quote.transportMode.toLowerCase() === 'air' ? 'flight' : 'local_shipping'}
                      </span>
                      {quote.transportMode}
                    </span>
                    {quote.pricePerKm && (
                      <span className="flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-xs">payments</span>
                        ${quote.pricePerKm.toFixed(2)}/km
                      </span>
                    )}
                  </div>
                  {quote.routeInfo && (
                    <div className="mt-2 flex gap-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">route</span>
                        {quote.routeInfo.distanceKm.toFixed(0)} km
                      </span>
                      <span>•</span>
                      <span className="font-medium">{quote.routeInfo.category}</span>
                    </div>
                  )}
                </div>

                {/* Price & Badges */}
                <div className="flex flex-col items-center sm:items-end gap-2">
                  {/* Badges - Positioned to the left of price */}
                  <div className="flex gap-2 justify-center sm:justify-end">
                    {quote.isCheapest && (
                      <div 
                        className="bg-accent-success/10 text-accent-success text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-accent-success/20"
                        data-testid="cheapest-badge"
                        aria-label="Opción más barata"
                      >
                        Cheapest Option
                      </div>
                    )}
                    {quote.isFastest && (
                      <div 
                        className="bg-accent-info/10 text-accent-info text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1 shadow-lg shadow-accent-info/20 border border-accent-info/20"
                        data-testid="fastest-badge"
                        aria-label="Opción más rápida"
                      >
                        <span className="material-symbols-outlined text-sm fill-1">bolt</span> Fastest
                      </div>
                    )}
                  </div>
                  
                  <p className="text-text-dark text-3xl font-black tracking-tight">
                    ${quote.price.toLocaleString('es-CO')}
                  </p>
                  
                  {/* View Route Button - Always show for demo */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (quote.routeInfo) {
                        handleShowRoute(quote.routeInfo.origin.address, quote.routeInfo.destination.address);
                      } else {
                        handleShowRoute();
                      }
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors mt-1 hover:underline"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>map</span>
                    Ver Ruta
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Offline Provider Messages */}
      {messages && messages.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-text-dark text-lg font-bold">Avisos</h3>
          {messages.map((msg, index) => (
            <OfflineProviderMessage
              key={`${msg.provider}-${index}`}
              providerName={msg.provider}
              message={msg.message}
            />
          ))}
        </div>
      )}

      {/* Route Map Modal */}
      <RouteMapModal
        isOpen={showMapModal}
        origin={selectedOrigin}
        destination={selectedDestination}
        onClose={() => setShowMapModal(false)}
      />
    </div>
  );
};
