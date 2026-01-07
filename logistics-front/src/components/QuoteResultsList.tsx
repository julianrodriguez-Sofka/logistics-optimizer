//HUMAN COMMENT Start
//REFACTORED: Uses providerConfig for provider configuration (simplified from ProviderRegistry)
//Add new providers in utils/providerConfig.ts - no classes needed
//HUMAN COMMENT End

import type { IQuote, IProviderMessage } from '../models/Quote';
import { getProviderColor } from '../utils/providerConfig';
import { ProviderLogo } from './ProviderLogo';
import { OfflineProviderMessage } from './OfflineProviderMessage';

interface QuoteResultsListProps {
  quotes: IQuote[];
  messages: IProviderMessage[];
}

export const QuoteResultsList = ({ quotes, messages }: QuoteResultsListProps) => {

  if (quotes.length === 0) {
    return (
      <div className="p-5 text-center">
        <p className="text-text-muted">No se encontraron cotizaciones disponibles</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-text-dark text-xl font-bold">Cotizaciones Recomendadas</h3>
      </div>

      <div className="flex flex-col gap-4">
        {quotes.map((quote, index) => {
          const providerColor = getProviderColor(quote.providerId);

          return (
            <div
              key={`${quote.providerId}-${index}`}
              data-testid="quote-card"
              className={`group relative overflow-hidden rounded-xl border ${
                quote.isCheapest ? 'border-accent-success hover:border-accent-success/70' :
                quote.isFastest ? 'border-accent-info shadow-xl shadow-accent-info/10' :
                'border-border-light hover:border-primary/50'
              } bg-card-light p-6 transition-all hover:shadow-lg cursor-pointer`}
            >
              {/* Left Border Accent */}
              <div className={`absolute top-0 left-0 w-1 h-full ${providerColor}`}></div>

              <div className="flex flex-col sm:flex-row gap-6 items-center">
                {/* Provider Logo - uses providerConfig */}
                <ProviderLogo providerId={quote.providerId} />

                {/* Provider Details */}
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
                  </div>
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
    </div>
  );
};
