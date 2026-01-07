import { useState } from 'react';
import './index.css';
import { Sidebar } from './presentation/components/Sidebar';
import { PageHeader } from './presentation/components/PageHeader';
import { QuoteRequestForm } from './presentation/components/QuoteRequestForm';
import { QuoteResultsList } from './presentation/components/QuoteResultsList';
import { ErrorAlert } from './presentation/components/ErrorAlert';
import { LoadingSpinner } from './presentation/components/LoadingSpinner';
import { useQuoteService } from './presentation/context/QuoteServiceContext';
import type { IQuoteRequest } from './domain/models/QuoteRequest';
import type { IQuote, IProviderMessage } from './domain/models/Quote';

function App() {
  const [quotes, setQuotes] = useState<IQuote[]>([]);
  const [messages, setMessages] = useState<IProviderMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
  const quoteService = useQuoteService();

  const handleSubmit = async (data: IQuoteRequest) => {
    setLoading(true);
    setError(null);
    setQuotes([]);
    setMessages([]);

    try {
      const response = await quoteService.requestQuotes(data);
      setQuotes(response.quotes);
      setMessages(response.messages || []);
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

        <div className="flex-1 w-full px-6 md:px-12 pb-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Step 1: Form */}
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
