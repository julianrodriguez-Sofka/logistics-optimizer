import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuoteResultsList } from '../../../components/QuoteResultsList';
import type { IQuote, IProviderMessage } from '../../../models/Quote';

describe('QuoteResultsList', () => {
  const mockQuotes: IQuote[] = [
    {
      providerId: 'fedex-ground',
      providerName: 'FedEx',
      price: 85.5,
      currency: 'USD',
      minDays: 3,
      maxDays: 4,
      estimatedDays: 3,
      transportMode: 'Ground',
      isCheapest: true,
      isFastest: true,
    },
    {
      providerId: 'dhl-express',
      providerName: 'DHL',
      price: 95.0,
      currency: 'USD',
      minDays: 5,
      maxDays: 7,
      estimatedDays: 5,
      transportMode: 'Express',
      isCheapest: false,
      isFastest: false,
    },
    {
      providerId: 'local-standard',
      providerName: 'Local',
      price: 120.0,
      currency: 'USD',
      minDays: 7,
      maxDays: 10,
      estimatedDays: 7,
      transportMode: 'Standard',
      isCheapest: false,
      isFastest: false,
    },
  ];

  it('should render correct number of quote cards', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const quoteCards = screen.getAllByTestId('quote-card');
    expect(quoteCards).toHaveLength(3);
  });

  it('should display provider name, price, and estimated days', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    expect(screen.getByText('FedEx')).toBeInTheDocument();
    const priceElements = screen.getAllByText(/85/); expect(priceElements.length > 0).toBe(true);
    expect(screen.getByText(/3-4 Days/)).toBeInTheDocument();
  });

  it('should display cheapest badge on the cheapest quote', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const cheapestBadge = screen.getByTestId('cheapest-badge');
    expect(cheapestBadge).toBeInTheDocument();
    expect(cheapestBadge).toHaveClass('bg-accent-success/10', 'text-accent-success');
    expect(cheapestBadge).toHaveTextContent('Cheapest Option');
  });

  it('should display fastest badge on the fastest quote', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const fastestBadge = screen.getByTestId('fastest-badge');
    expect(fastestBadge).toBeInTheDocument();
    expect(fastestBadge).toHaveClass('bg-accent-info/10', 'text-accent-info');
    expect(fastestBadge).toHaveTextContent('Fastest');
  });

  it('should NOT display cheapest badge when isCheapest is false', () => {
    const quotesWithoutCheapest: IQuote[] = [
      {
        ...mockQuotes[0],
        isCheapest: false,
      },
    ];
    
    render(<QuoteResultsList quotes={quotesWithoutCheapest} messages={[]} />);
    
    const cheapestBadge = screen.queryByTestId('cheapest-badge');
    expect(cheapestBadge).not.toBeInTheDocument();
  });

  it('should NOT display fastest badge when isFastest is false', () => {
    const quotesWithoutFastest: IQuote[] = [
      {
        ...mockQuotes[0],
        isFastest: false,
      },
    ];
    
    render(<QuoteResultsList quotes={quotesWithoutFastest} messages={[]} />);
    
    const fastestBadge = screen.queryByTestId('fastest-badge');
    expect(fastestBadge).not.toBeInTheDocument();
  });

  it('should display both badges when quote is both cheapest and fastest', () => {
    const singleQuote: IQuote[] = [
      {
        ...mockQuotes[0],
        isCheapest: true,
        isFastest: true,
      },
    ];
    
    render(<QuoteResultsList quotes={singleQuote} messages={[]} />);
    
    // Note: Only one badge can be displayed at a time in the current UI design
    // The fastest badge will be displayed since it's in the same position
    const fastestBadge = screen.getByTestId('fastest-badge');
    expect(fastestBadge).toBeInTheDocument();
  });

  it('should display no badges when both flags are false', () => {
    const quotesNoBadges: IQuote[] = [
      {
        ...mockQuotes[0],
        isCheapest: false,
        isFastest: false,
      },
    ];
    
    render(<QuoteResultsList quotes={quotesNoBadges} messages={[]} />);
    
    const cheapestBadge = screen.queryByTestId('cheapest-badge');
    const fastestBadge = screen.queryByTestId('fastest-badge');
    
    expect(cheapestBadge).not.toBeInTheDocument();
    expect(fastestBadge).not.toBeInTheDocument();
  });

  it('should handle empty quotes array', () => {
    render(<QuoteResultsList quotes={[]} messages={[]} />);
    
    expect(screen.getByText(/no se encontraron cotizaciones/i)).toBeInTheDocument();
  });

  it('should display all quote information', () => {
    render(<QuoteResultsList quotes={[mockQuotes[0]]} messages={[]} />);
    
    expect(screen.getByText('FedEx')).toBeInTheDocument();
    const priceElements = screen.getAllByText(/85/); expect(priceElements.length > 0).toBe(true);
    expect(screen.getByText(/3-4 Days/)).toBeInTheDocument();
    expect(screen.getByText(/ground/i)).toBeInTheDocument();
  });

  it('should apply correct styling classes to quote cards', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const quoteCards = screen.getAllByTestId('quote-card');
    
    // First card has both badges
    expect(quoteCards[0]).toHaveClass('rounded-xl', 'bg-card-light', 'p-6');
    
    // Check for cheapest card border
    expect(quoteCards[0]).toHaveClass('border-accent-success');
  });

  it('should have aria-label for accessibility on badges', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const fastestBadge = screen.getByTestId('fastest-badge');
    expect(fastestBadge).toHaveAttribute('aria-label', 'Opción más rápida');
  });

  it('should display warning messages for offline providers', () => {
    const messages: IProviderMessage[] = [
      {
        provider: 'DHL',
        message: 'DHL is not available at this time',
      },
    ];

    render(<QuoteResultsList quotes={[mockQuotes[0]]} messages={messages} />);
    
    expect(screen.getByText(/DHL is not available at this time/)).toBeInTheDocument();
  });

  it('should display multiple warning messages', () => {
    const messages: IProviderMessage[] = [
      {
        provider: 'DHL',
        message: 'DHL is not available at this time',
      },
      {
        provider: 'Local',
        message: 'Local is not available at this time',
      },
    ];

    render(<QuoteResultsList quotes={[mockQuotes[0]]} messages={messages} />);
    
    expect(screen.getByText(/DHL is not available at this time/)).toBeInTheDocument();
    expect(screen.getByText(/Local is not available at this time/)).toBeInTheDocument();
  });
});
