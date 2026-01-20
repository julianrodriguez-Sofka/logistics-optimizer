import { useState, useCallback, useRef, useEffect } from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { PageHeader } from './components/PageHeader';
import { QuoteRequestForm } from './components/QuoteRequestForm';
import { QuoteResultsList } from './components/QuoteResultsList';
import { ErrorAlert } from './components/ErrorAlert';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import ShipmentWizard from './components/ShipmentWizard';
import { WarehouseView } from './components/WarehouseView';
import { requestQuotes } from './services/quoteService';
import type { IQuoteRequest } from './models/QuoteRequest';
import type { IQuote, IProviderMessage, IRouteInfo } from './models/Quote';

type AppView = 'quotes' | 'create-shipment' | 'warehouse';

// Session storage keys
const STORAGE_KEYS = {
  QUOTES: 'logistics_quotes',
  MESSAGES: 'logistics_messages',
  ROUTE_INFO: 'logistics_route_info',
  CURRENT_STEP: 'logistics_current_step',
  QUOTE_REQUEST: 'logistics_quote_request',
  FORM_DATA: 'logistics_quote_form_data',
};

/**
 * Main Application Component
 * Implements:
 * - State management with proper error handling
 * - Request deduplication to prevent double submissions
 * - Graceful error recovery
 * - Session persistence to survive page reloads
 */
function App() {
  // Initialize state from sessionStorage if available
  const [currentView, setCurrentView] = useState<AppView>('quotes');
  const [quotes, setQuotes] = useState<IQuote[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.QUOTES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [messages, setMessages] = useState<IProviderMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [routeInfo, setRouteInfo] = useState<IRouteInfo | undefined>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.ROUTE_INFO);
      return saved ? JSON.parse(saved) : undefined;
    } catch {
      return undefined;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
      return saved ? (JSON.parse(saved) as 1 | 2) : 1;
    } catch {
      return 1;
    }
  });
  const [selectedQuote, setSelectedQuote] = useState<IQuote | null>(null);
  const [quoteRequest, setQuoteRequest] = useState<IQuoteRequest | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.QUOTE_REQUEST);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Track ongoing requests to prevent duplicates
  const requestInProgress = useRef(false);
  const lastRequestKey = useRef<string>('');

  // Persist state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
    } catch (error) {
      console.error('Failed to save quotes to sessionStorage', error);
    }
  }, [quotes]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages to sessionStorage', error);
    }
  }, [messages]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.ROUTE_INFO, JSON.stringify(routeInfo));
    } catch (error) {
      console.error('Failed to save routeInfo to sessionStorage', error);
    }
  }, [routeInfo]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_STEP, JSON.stringify(currentStep));
    } catch (error) {
      console.error('Failed to save currentStep to sessionStorage', error);
    }
  }, [currentStep]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.QUOTE_REQUEST, JSON.stringify(quoteRequest));
    } catch (error) {
      console.error('Failed to save quoteRequest to sessionStorage', error);
    }
  }, [quoteRequest]);

  /**
   * Handle quote form submission
   * Includes deduplication and proper error handling
   */
  const handleSubmit = useCallback(async (data: IQuoteRequest) => {
    // Create request key for deduplication
    const requestKey = JSON.stringify(data);
    
    // Prevent duplicate submissions
    if (requestInProgress.current) {
      console.log('Request already in progress, ignoring duplicate');
      return;
    }

    // Skip if same request was just made
    if (requestKey === lastRequestKey.current && quotes.length > 0) {
      console.log('Same request already completed, using cached results');
      setCurrentStep(2);
      return;
    }

    requestInProgress.current = true;
    lastRequestKey.current = requestKey;

    setLoading(true);
    setError(null);
    
    try {
      setQuoteRequest(data);
      const response = await requestQuotes(data);
      
      // Only update state if we still have the same request
      if (JSON.stringify(data) === lastRequestKey.current) {
        setQuotes(response.quotes);
        setMessages(response.messages || []);
        setRouteInfo(response.routeInfo);
        setCurrentStep(2);
      }
    } catch (err) {
      console.error('Quote request error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Ha ocurrido un error. Por favor, intente de nuevo.';
      setError(errorMessage);
      // Don't reset quotes on error if we have previous results
      if (quotes.length === 0) {
        setQuotes([]);
        setMessages([]);
        setRouteInfo(undefined);
      }
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, [quotes.length]);

  /**
   * Reset to new quote state
   */
  const handleNewQuote = useCallback(() => {
    setCurrentStep(1);
    setQuotes([]);
    setMessages([]);
    setRouteInfo(undefined);
    setError(null);
    setSelectedQuote(null);
    setQuoteRequest(null);
    lastRequestKey.current = '';
    
    // Clear sessionStorage
    try {
      sessionStorage.removeItem(STORAGE_KEYS.QUOTES);
      sessionStorage.removeItem(STORAGE_KEYS.MESSAGES);
      sessionStorage.removeItem(STORAGE_KEYS.ROUTE_INFO);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
      sessionStorage.removeItem(STORAGE_KEYS.QUOTE_REQUEST);
      sessionStorage.removeItem(STORAGE_KEYS.FORM_DATA);
    } catch (error) {
      console.error('Failed to clear sessionStorage', error);
    }
  }, []);

  /**
   * Handle quote selection for shipment creation
   */
  const handleSelectQuote = useCallback((quote: IQuote) => {
    setSelectedQuote(quote);
    setCurrentView('create-shipment');
  }, []);

  /**
   * Handle navigation back from shipment wizard
   */
  const handleBackFromWizard = useCallback(() => {
    setCurrentView('quotes');
    setSelectedQuote(null);
  }, []);

  /**
   * Handle view navigation
   */
  const handleNavigate = useCallback((view: AppView) => {
    setCurrentView(view);
    // Reset selection when navigating away
    if (view !== 'create-shipment') {
      setSelectedQuote(null);
    }
  }, []);

  /**
   * Dismiss error message
   */
  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  // Render Shipment Wizard view
  if (currentView === 'create-shipment') {
    return (
      <ErrorBoundary>
        <div className="flex h-screen w-full bg-background-light">
          <Sidebar onNavigate={handleNavigate} currentView={currentView} />
          <div className="flex-1 overflow-y-auto">
            <ShipmentWizard 
              selectedQuote={selectedQuote} 
              quoteRequest={quoteRequest}
              onBack={handleBackFromWizard}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Render Warehouse view
  if (currentView === 'warehouse') {
    return (
      <ErrorBoundary>
        <div className="flex h-screen w-full bg-background-light">
          <Sidebar onNavigate={handleNavigate} currentView={currentView} />
          <div className="flex-1 overflow-y-auto">
            <WarehouseView />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Render Main Quotes view
  return (
    <ErrorBoundary>
      <div className="flex h-screen w-full bg-background-light">
        <Sidebar onNavigate={handleNavigate} currentView={currentView} />
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
                <QuoteRequestForm 
                  onSubmit={handleSubmit} 
                  loading={loading}
                  disabled={loading}
                />
                {error && (
                  <ErrorAlert 
                    message={error} 
                    onClose={handleDismissError}
                  />
                )}
              </div>
              <div
                className={`xl:col-span-7 flex flex-col gap-6 transition-opacity duration-300 ${
                  currentStep === 2 ? 'opacity-100' : 'opacity-50 pointer-events-none'
                }`}
              >
                {loading && <LoadingSpinner message="Cargando cotizaciones..." />}
                {!loading && currentStep === 2 && (
                  <>
                    <QuoteResultsList 
                      quotes={quotes} 
                      messages={messages} 
                      routeInfo={routeInfo} 
                      onSelectQuote={handleSelectQuote}
                    />
                    <button
                      onClick={handleNewQuote}
                      className="bg-border-light hover:bg-primary hover:text-white text-text-dark px-5 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined">refresh</span>
                      Nueva Cotización
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
