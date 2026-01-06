import { IQuote, IProviderMessage } from '../../domain/models/Quote';

interface QuoteResultsListProps {
  quotes: IQuote[];
  messages: IProviderMessage[];
}

export const QuoteResultsList = ({ quotes, messages }: QuoteResultsListProps) => {
  if (quotes.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No se encontraron cotizaciones disponibles</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Cotizaciones Disponibles</h2>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        {quotes.map((quote, index) => (
          <div 
            key={`${quote.providerId}-${index}`}
            data-testid="quote-card"
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative',
            }}
          >
            {/* Badges */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              {quote.isCheapest && (
                <span 
                  style={{
                    backgroundColor: '#4caf50',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  💰 Más Barata
                </span>
              )}
              {quote.isFastest && (
                <span 
                  style={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  ⚡ Más Rápida
                </span>
              )}
            </div>

            {/* Provider Name */}
            <h3 style={{ margin: '10px 0' }}>{quote.providerName}</h3>

            {/* Price */}
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '10px 0' }}>
              ${quote.price.toFixed(2)} {quote.currency}
            </div>

            {/* Delivery Time */}
            <div style={{ color: '#666', margin: '10px 0' }}>
              <span>🚚 Entrega estimada: {quote.minDays}-{quote.maxDays} días</span>
            </div>

            {/* Transport Mode */}
            <div style={{ color: '#888', fontSize: '14px' }}>
              Modo de transporte: {quote.transportMode}
            </div>
          </div>
        ))}
      </div>

      {/* Offline Provider Messages */}
      {messages && messages.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Avisos</h3>
          {messages.map((msg, index) => (
            <div
              key={`${msg.provider}-${index}`}
              style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                padding: '12px',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span>{msg.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
