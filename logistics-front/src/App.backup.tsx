import { useState } from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { PageHeader } from './components/PageHeader';
import { QuoteRequestForm } from './components/QuoteRequestForm';
import { QuoteResultsList } from './components/QuoteResultsList';
import { ErrorAlert } from './components/ErrorAlert';
import { LoadingSpinner } from './components/LoadingSpinner';
import { requestQuotes } from './services/quoteService';
import type { IQuoteRequest } from './models/QuoteRequest';
import type { IQuote, IProviderMessage, IRouteInfo } from './models/Quote';

function App() {
  const [quotes, setQuotes] = useState<IQuote[]>([]);
  const [messages, setMessages] = useState<IProviderMessage[]>([]);
  const [routeInfo, setRouteInfo] = useState<IRouteInfo | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Debug log to ensure App is rendering
  console.log('App component rendering');

  const handleSubmit = async (data: IQuoteRequest) => {
    setLoading(true);
    setError(null);
    setQuotes([]);
    setMessages([]);
    setRouteInfo(undefined);

    try {
      const response = await requestQuotes(data);
      setQuotes(response.quotes);
      setMessages(response.messages || []);
      setRouteInfo(response.routeInfo);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuote = () => {
    setCurrentStep(1);
    setQuotes([]);
    setMessages([]);
    setRouteInfo(undefined);
    setError(null);
  };


  return (
    <div className="flex h-screen w-full bg-background-light">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background-light relative">
        <PageHeader
          title="New Shipment Estimate"
          description="Enter details to compare rates across all connected providers via Unified API."
        />

        {/* OpenStreetMap + OpenRouteService Integration Banner */}
        <div className="mx-6 md:mx-12 mb-6">
          <div className="bg-gradient-to-r from-primary/10 to-accent-success/10 border-2 border-primary/30 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-primary text-white rounded-full p-3 flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">map</span>
            </div>
            <div className="flex-1">
              <h3 className="text-text-dark font-bold text-base mb-1 flex items-center gap-2">
                🗺️ Integración: OpenStreetMap + OpenRouteService
                <span className="bg-accent-success text-white text-xs px-2 py-0.5 rounded-full font-bold">GRATIS</span>
              </h3>
              <p className="text-text-muted text-sm">
                Visualiza rutas reales, calcula distancias precisas y tiempos de entrega. ¡Sin tarjeta de crédito! 100% gratis con OpenStreetMap.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full px-6 md:px-12 pb-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-5 flex flex-col gap-6">
              <QuoteRequestForm onSubmit={handleSubmit} loading={loading} />
              {error && <ErrorAlert message={error} />}
            </div>
            <div
              className={`xl:col-span-7 flex flex-col gap-6 transition-opacity duration-300 ${
                currentStep === 2 ? 'opacity-100' : 'opacity-50 pointer-events-none'
              }`}
            >

              {loading && <LoadingSpinner message="Loading quotes..." />}
              {!loading && currentStep === 2 && (
                <>
                  <QuoteResultsList quotes={quotes} messages={messages} routeInfo={routeInfo} />
                  <button
                    onClick={handleNewQuote}
                    className="bg-border-light hover:bg-primary hover:text-white text-text-dark px-5 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined">refresh</span>
                    { "New Quote"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
