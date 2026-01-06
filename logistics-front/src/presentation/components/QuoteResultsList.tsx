import type { IQuote, IProviderMessage } from '../../domain/models/Quote';

interface QuoteResultsListProps {
  quotes: IQuote[];
  messages: IProviderMessage[];
}

const getProviderLogo = (providerId: string) => {
  switch (providerId.toLowerCase()) {
    case 'dhl':
      return (
        <div className="size-16 rounded-lg bg-[#FFCC00] p-1 flex items-center justify-center flex-shrink-0">
          <span className="text-[#D40511] font-black text-xl italic tracking-tighter" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            DHL
          </span>
        </div>
      );
    case 'fedex':
      return (
        <div className="size-16 rounded-lg bg-card-light flex items-center justify-center flex-shrink-0 overflow-hidden border border-border-light">
          <div className="flex h-full w-full">
            <div className="w-1/2 h-full bg-[#4D148C] flex items-center justify-center text-white font-bold text-xs">Fed</div>
            <div className="w-1/2 h-full bg-[#FF6600] flex items-center justify-center text-white font-bold text-xs">Ex</div>
          </div>
        </div>
      );
    case 'local':
      return (
        <div className="size-16 rounded-lg bg-background-light p-2 flex items-center justify-center flex-shrink-0 border border-border-light">
          <div className="w-full h-full bg-text-dark rounded-md flex items-center justify-center">
            <span className="text-white font-black italic tracking-tighter">GO</span>
          </div>
        </div>
      );
    default:
      return (
        <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>
            local_shipping
          </span>
        </div>
      );
  }
};

const getProviderColor = (providerId: string) => {
  switch (providerId.toLowerCase()) {
    case 'dhl':
      return 'bg-accent-info';
    case 'local':
      return 'bg-accent-success';
    default:
      return 'bg-accent-purple';
  }
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
            
            {/* Badges */}
            {quote.isCheapest && (
              <div 
                className="absolute top-4 right-4 bg-accent-success/10 text-accent-success text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-accent-success/20"
                data-testid="cheapest-badge"
                aria-label="Opción más barata"
              >
                Cheapest Option
              </div>
            )}
            {quote.isFastest && (
              <div 
                className="absolute top-4 right-4 bg-accent-info/10 text-accent-info text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1 shadow-lg shadow-accent-info/20 border border-accent-info/20"
                data-testid="fastest-badge"
                aria-label="Opción más rápida"
              >
                <span className="material-symbols-outlined text-sm fill-1">bolt</span> Fastest
              </div>
            )}

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

              {/* Price & Action */}
              <div className="flex flex-col items-center sm:items-end gap-1">
                <p className="text-text-dark text-3xl font-black tracking-tight">
                  ${quote.price.toFixed(2)}
                </p>
                <button 
                  className={`${
                    quote.isFastest 
                      ? 'bg-accent-info hover:bg-blue-700 text-white shadow-lg shadow-accent-info/25' 
                      : 'bg-primary/10 hover:bg-primary hover:text-white text-primary border border-primary/20'
                  } text-sm font-bold px-6 py-2 rounded-lg transition-colors w-full sm:w-auto`}
                >
                  {quote.isFastest ? 'Book Now' : 'Select Provider'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Offline Provider Messages */}
      {messages && messages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-text-dark text-lg font-bold mb-3">Avisos</h3>
          {messages.map((msg, index) => (
            <div
              key={`${msg.provider}-${index}`}
              className="bg-accent-warning/10 border border-accent-warning/30 rounded-lg p-4 mt-3 flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-accent-warning text-xl">warning</span>
              <span className="text-text-dark text-sm">{msg.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
