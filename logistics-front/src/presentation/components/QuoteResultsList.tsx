//HUMAN COMMENT Start


//HUMAN COMMENT End


import type { IQuote, IProviderMessage } from '../../domain/models/Quote';
import { OfflineProviderMessage } from './OfflineProviderMessage';

interface QuoteResultsListProps {
  quotes: IQuote[];
  messages: IProviderMessage[];
}

const getProviderLogo = (providerId: string) => {
  const lowerProviderId = providerId.toLowerCase();
  
  if (lowerProviderId.includes('dhl')) {
    return (
      <div className="size-16 rounded-lg bg-white p-2 flex items-center justify-center flex-shrink-0 border border-border-light ">
        <img 
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB82sGJRkCPxGE42o_z3KQKXYjsmp4b9yQVQ&s" 
          alt="DHL Logo" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }
  
  if (lowerProviderId.includes('fedex')) {
    return (
      <div className="size-16 rounded-lg bg-white p-2 flex items-center justify-center flex-shrink-0 border border-border-light">
        <img 
          src="https://logos-world.net/wp-content/uploads/2020/04/FedEx-Logo.png" 
          alt="FedEx Logo" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }
  
  if (lowerProviderId.includes('local')) {
    return (
      <div className="size-16 rounded-lg bg-background-light p-2 flex items-center justify-center flex-shrink-0 border border-border-light">
        <div className="w-full h-full bg-text-dark rounded-md flex items-center justify-center">
          <span className="text-white font-black italic tracking-tighter">GO</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>
        local_shipping
      </span>
    </div>
  );
};

const getProviderColor = (providerId: string) => {
  const lowerProviderId = providerId.toLowerCase();
  
  if (lowerProviderId.includes('dhl')) return 'bg-accent-info';
  if (lowerProviderId.includes('local')) return 'bg-accent-success';
  return 'bg-accent-purple';
};

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
        {quotes.map((quote, index) => (
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
            <div className={`absolute top-0 left-0 w-1 h-full ${getProviderColor(quote.providerId)}`}></div>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* Provider Logo */}
              {getProviderLogo(quote.providerId)}

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
                {/* <button 
                  className={`${
                    quote.isFastest 
                      ? 'bg-accent-info hover:bg-blue-700 text-white shadow-lg shadow-accent-info/25' 
                      : 'bg-primary/10 hover:bg-primary hover:text-white text-primary border border-primary/20'
                  } text-sm font-bold px-6 py-2 rounded-lg transition-colors w-full sm:w-auto`}
                >
                  {quote.isFastest ? 'Book Now' : 'Select Provider'}
                </button> */}
              </div>
            </div>
          </div>
        ))}
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
