// HUMAN

// HUMAN
import { useState } from 'react';
import './index.css';
import { QuoteRequestForm } from './presentation/components/QuoteRequestForm';
import { QuoteResultsList } from './presentation/components/QuoteResultsList';
import { requestQuotes } from './services/quoteService';
import type { IQuoteRequest } from './domain/models/QuoteRequest';
import type { IQuote, IProviderMessage } from './domain/models/Quote';

function App() {
  const [quotes, setQuotes] = useState<IQuote[]>([]);
  const [messages, setMessages] = useState<IProviderMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const handleSubmit = async (data: IQuoteRequest) => {
    setLoading(true);
    setError(null);
    setQuotes([]);
    setMessages([]);

    try {
      const response = await requestQuotes(data);
      setQuotes(response.quotes);
      setMessages(response.messages || []);
      setCurrentStep(2);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuote = () => {
    setCurrentStep(1);
    setQuotes([]);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex h-screen w-full bg-background-light">
      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:flex flex-col w-[280px] h-full border-r border-border-light bg-card-light flex-shrink-0">
        <div className="p-6 flex flex-col h-full justify-between">
          <div className="flex flex-col gap-8">
            {/* Logo */}
            <div className="flex gap-3 items-center">
              <div className="bg-primary/10 flex items-center justify-center size-10 rounded-full shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
                  local_shipping
                </span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-text-dark text-lg font-bold leading-tight">Logistics Pro</h1>
                <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Optimizer v2.4</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-2">
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
                <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                  dashboard
                </span>
                <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Dashboard</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20" href="#">
                <span className="material-symbols-outlined text-primary fill-1" style={{ fontSize: '24px' }}>
                  package_2
                </span>
                <p className="text-primary text-sm font-bold leading-normal">New Shipment</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
                <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                  local_shipping
                </span>
                <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Carriers</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
                <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                  receipt_long
                </span>
                <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Invoices</p>
              </a>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-2">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
              <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                settings
              </span>
              <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Settings</p>
            </a>
            <div className="mt-4 pt-4 border-t border-border-light flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div className="flex flex-col">
                <p className="text-text-dark text-sm font-medium">Alex Morgan</p>
                <p className="text-text-muted text-xs">alex@company.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background-light relative">
        {/* Header */}
        <header className="w-full px-6 py-8 md:px-12 flex flex-col gap-2">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div className="flex min-w-72 flex-col gap-2">
              <h2 className="text-text-dark text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                New Shipment Estimate
              </h2>
              <p className="text-text-muted text-base font-normal leading-normal">
                Enter details to compare rates across all connected providers via Unified API.
              </p>
            </div>
            <button className="bg-accent-info hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-accent-info/20">
              <span className="material-symbols-outlined text-xl">history</span>
              View Past Quotes
            </button>
          </div>
        </header>

        {/* Stats Section */}
        {/* <section className="w-full px-6 md:px-12 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-light bg-card-light shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wide">Unified API Status</p>
                <span className="material-symbols-outlined text-accent-success" style={{ fontSize: '20px' }}>
                  check_circle
                </span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-text-dark tracking-tight text-2xl font-bold leading-none">Online</p>
                <p className="text-accent-success text-sm font-medium mb-0.5">99.9% Uptime</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-light bg-card-light shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wide">Active Adapters</p>
                <span className="material-symbols-outlined text-accent-info" style={{ fontSize: '20px' }}>
                  hub
                </span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-text-dark tracking-tight text-2xl font-bold leading-none">3/3</p>
                <p className="text-text-muted text-sm font-medium mb-0.5">FedEx, DHL, Local</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-light bg-card-light shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wide">Avg. Response Time</p>
                <span className="material-symbols-outlined text-accent-purple" style={{ fontSize: '20px' }}>
                  speed
                </span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-text-dark tracking-tight text-2xl font-bold leading-none">120ms</p>
                <p className="text-text-muted text-sm font-medium mb-0.5">Optimized</p>
              </div>
            </div>
          </div>
        </section> */}

        {/* Main Content Area */}
        <div className="flex-1 w-full px-6 md:px-12 pb-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Step 1: Form */}
            <div className="xl:col-span-5 flex flex-col gap-6" id="step-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`step-indicator ${currentStep === 1 ? 'active' : 'completed'}`}>
                  {currentStep === 1 ? '1' : <span className="material-symbols-outlined text-sm">check</span>}
                </div>
                <h3 className="text-text-dark text-xl font-bold">Enter Shipment Details</h3>
              </div>
              
              <QuoteRequestForm onSubmit={handleSubmit} loading={loading} />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-600">error</span>
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              )}
            </div>

            {/* Step 2: Results */}
            <div 
              className={`xl:col-span-7 flex flex-col gap-6 transition-opacity duration-300 ${
                currentStep === 2 ? 'opacity-100' : 'opacity-50 pointer-events-none'
              }`} 
              id="step-2"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`step-indicator ${currentStep === 2 ? 'active' : 'inactive'}`}>2</div>
                <h3 className={`text-xl font-bold ${currentStep === 2 ? 'text-text-dark' : 'text-text-muted'}`}>
                  Recommended Options
                </h3>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-text-muted">Loading quotes...</p>
                </div>
              )}

              {!loading && currentStep === 2 && (
                <>
                  <QuoteResultsList quotes={quotes} messages={messages} />
                  <button
                    onClick={handleNewQuote}
                    className="bg-border-light hover:bg-primary hover:text-white text-text-dark px-5 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined">refresh</span>
                    New Quote
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
