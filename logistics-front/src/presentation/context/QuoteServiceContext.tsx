/**
 * @file QuoteServiceContext.tsx
 * @description React Context for service dependency injection
 * Provides services throughout the component tree
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { IQuoteService } from '../../infrastructure/services/QuoteServiceImpl';

/**
 * Context value interface
 */
interface QuoteServiceContextValue {
  quoteService: IQuoteService;
}

/**
 * Context for QuoteService
 */
const QuoteServiceContext = createContext<QuoteServiceContextValue | null>(null);

/**
 * Provider props
 */
interface QuoteServiceProviderProps {
  children: ReactNode;
  quoteService: IQuoteService;
}

/**
 * QuoteServiceProvider - Provides services to component tree
 */
export const QuoteServiceProvider = ({ children, quoteService }: QuoteServiceProviderProps) => {
  return (
    <QuoteServiceContext.Provider value={{ quoteService }}>
      {children}
    </QuoteServiceContext.Provider>
  );
};

/**
 * Hook to access QuoteService from context
 * @throws Error if used outside provider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useQuoteService = (): IQuoteService => {
  const context = useContext(QuoteServiceContext);
  
  if (!context) {
    throw new Error('useQuoteService must be used within QuoteServiceProvider');
  }
  
  return context.quoteService;
};
