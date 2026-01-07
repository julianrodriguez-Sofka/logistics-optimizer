/**
 * @file QuoteServiceContext.spec.tsx
 * @description Tests for QuoteServiceContext
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteServiceProvider, useQuoteService } from '../QuoteServiceContext';
import type { IQuoteService } from '../../infrastructure/services/QuoteServiceImpl';

// Mock QuoteService
const mockQuoteService: IQuoteService = {
  requestQuotes: vi.fn(),
};

// Test component that uses the hook
const TestComponent = () => {
  const quoteService = useQuoteService();
  return <div>Service: {quoteService ? 'Available' : 'Not Available'}</div>;
};

describe('QuoteServiceContext', () => {
  describe('Provider', () => {
    it('should provide QuoteService to children', () => {
      render(
        <QuoteServiceProvider quoteService={mockQuoteService}>
          <TestComponent />
        </QuoteServiceProvider>
      );

      expect(screen.getByText('Service: Available')).toBeInTheDocument();
    });
  });

  describe('useQuoteService hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useQuoteService must be used within QuoteServiceProvider'
      );

      consoleError.mockRestore();
    });

    it('should return QuoteService when used inside provider', () => {
      const TestComponentWithService = () => {
        const quoteService = useQuoteService();
        return (
          <div>
            Has requestQuotes: {quoteService.requestQuotes ? 'Yes' : 'No'}
          </div>
        );
      };

      render(
        <QuoteServiceProvider quoteService={mockQuoteService}>
          <TestComponentWithService />
        </QuoteServiceProvider>
      );

      expect(screen.getByText('Has requestQuotes: Yes')).toBeInTheDocument();
    });
  });
});
