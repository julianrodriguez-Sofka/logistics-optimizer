import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { QuoteServiceProvider } from './presentation/context/QuoteServiceContext';
import { ServiceFactory } from './infrastructure/ServiceFactory';
import { API } from './domain/constants';

// Initialize ServiceFactory with configuration
const serviceFactory = ServiceFactory.initialize({
  apiBaseURL: import.meta.env.VITE_API_BASE_URL || API.DEFAULT_BASE_URL,
  apiTimeout: API.DEFAULT_TIMEOUT,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuoteServiceProvider quoteService={serviceFactory.getQuoteService()}>
      <App />
    </QuoteServiceProvider>
  </StrictMode>,
);
