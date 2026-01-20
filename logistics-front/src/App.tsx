import { useState, useCallback, useRef, useEffect } from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
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
        <div className="flex h-screen w-full bg-slate-50">
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
        <div className="flex h-screen w-full bg-slate-50">
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
      <div className="flex h-screen w-full bg-slate-50">
        <Sidebar onNavigate={handleNavigate} currentView={currentView} />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Modern Header */}
          <header className="bg-white border-b border-slate-200/80 px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Nueva Cotización
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Compara tarifas de múltiples proveedores en segundos
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-emerald-700">Sistema Activo</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                    <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '18px' }}>schedule</span>
                    <span className="text-sm font-medium text-slate-600">
                      {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-8 py-8">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Left Panel - Form */}
                <div className="xl:col-span-5 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>edit_note</span>
                        </div>
                        <div>
                          <h2 className="font-bold text-slate-800">Datos del Envío</h2>
                          <p className="text-xs text-slate-500">Complete los campos para cotizar</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <QuoteRequestForm 
                        onSubmit={handleSubmit} 
                        loading={loading}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <ErrorAlert 
                      message={error} 
                      onClose={handleDismissError}
                    />
                  )}
                </div>
                
                {/* Right Panel - Results */}
                <div className={`xl:col-span-7 space-y-6 transition-all duration-500 ${
                  currentStep === 2 ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-4 pointer-events-none'
                }`}>
                  
                  {loading && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12">
                      <LoadingSpinner message="Buscando las mejores tarifas..." />
                    </div>
                  )}
                  
                  {!loading && currentStep === 2 && (
                    <>
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>local_shipping</span>
                              </div>
                              <div>
                                <h2 className="font-bold text-slate-800">Cotizaciones Disponibles</h2>
                                <p className="text-xs text-slate-500">{quotes.length} opciones encontradas</p>
                              </div>
                            </div>
                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                              ✓ Actualizado
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <QuoteResultsList 
                            quotes={quotes} 
                            messages={messages} 
                            routeInfo={routeInfo} 
                            onSelectQuote={handleSelectQuote}
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={handleNewQuote}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-primary text-slate-600 hover:text-primary rounded-xl font-semibold transition-all"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
                        Nueva Cotización
                      </button>
                    </>
                  )}
                  
                  {!loading && currentStep === 1 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '40px' }}>package_2</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 mb-2">
                        Completa el Formulario
                      </h3>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        Ingresa los datos de tu envío para obtener las mejores cotizaciones de nuestros proveedores
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
