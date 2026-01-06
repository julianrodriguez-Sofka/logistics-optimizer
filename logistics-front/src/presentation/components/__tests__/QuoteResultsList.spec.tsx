import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteResultsList } from '../QuoteResultsList';
import type { IQuote, IProviderMessage } from '../../../domain/models/Quote';

describe('QuoteResultsList - Badge Display Integration', () => {
  const mockQuotes: IQuote[] = [
    {
      providerId: 'fedex',
      providerName: 'FedEx',
      price: 100,
      currency: 'USD',
      minDays: 2,
      maxDays: 3,
      estimatedDays: 3,
      transportMode: 'Air',
      isCheapest: false,
      isFastest: true,
    },
    {
      providerId: 'dhl',
      providerName: 'DHL',
      price: 85,
      currency: 'USD',
      minDays: 3,
      maxDays: 5,
      estimatedDays: 5,
      transportMode: 'Ground',
      isCheapest: true,
      isFastest: false,
    },
    {
      providerId: 'local',
      providerName: 'Local',
      price: 120,
      currency: 'USD',
      minDays: 5,
      maxDays: 7,
      estimatedDays: 7,
      transportMode: 'Truck',
      isCheapest: false,
      isFastest: false,
    },
  ];

  it('should display badge for cheapest quote', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const cheapestBadges = screen.getAllByTestId('cheapest-badge');
    expect(cheapestBadges).toHaveLength(1);
  });

  it('should display badge for fastest quote', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const fastestBadges = screen.getAllByTestId('fastest-badge');
    expect(fastestBadges).toHaveLength(1);
  });

  it('should not display badge when isCheapest is false', () => {
    const quotesWithoutCheapest: IQuote[] = mockQuotes.map(q => ({ ...q, isCheapest: false }));
    
    render(<QuoteResultsList quotes={quotesWithoutCheapest} messages={[]} />);
    
    const cheapestBadges = screen.queryAllByTestId('cheapest-badge');
    expect(cheapestBadges).toHaveLength(0);
  });

  it('should not display badge when isFastest is false', () => {
    const quotesWithoutFastest: IQuote[] = mockQuotes.map(q => ({ ...q, isFastest: false }));
    
    render(<QuoteResultsList quotes={quotesWithoutFastest} messages={[]} />);
    
    const fastestBadges = screen.queryAllByTestId('fastest-badge');
    expect(fastestBadges).toHaveLength(0);
  });

  it('should display both badges on same quote if applicable', () => {
    const singleQuote: IQuote[] = [
      {
        providerId: 'fedex',
        providerName: 'FedEx',
        price: 100,
        currency: 'USD',
        minDays: 2,
        maxDays: 3,
        estimatedDays: 3,
        transportMode: 'Air',
        isCheapest: true,
        isFastest: true,
      },
    ];
    
    render(<QuoteResultsList quotes={singleQuote} messages={[]} />);
    
    expect(screen.getByTestId('cheapest-badge')).toBeInTheDocument();
    expect(screen.getByTestId('fastest-badge')).toBeInTheDocument();
  });

  it('should render all quotes even without badges', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const quoteCards = screen.getAllByTestId('quote-card');
    expect(quoteCards).toHaveLength(3);
  });

  it('should display offline provider messages below quotes', () => {
    const messages: IProviderMessage[] = [
      { provider: 'UPS', message: 'No está disponible temporalmente' },
    ];
    
    render(<QuoteResultsList quotes={mockQuotes} messages={messages} />);
    
    expect(screen.getByText(/UPS/)).toBeInTheDocument();
    expect(screen.getByText(/No está disponible temporalmente/)).toBeInTheDocument();
  });

  it('should handle empty messages array', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const quoteCards = screen.getAllByTestId('quote-card');
    expect(quoteCards).toHaveLength(3);
  });

  it('should display multiple offline provider messages', () => {
    const messages: IProviderMessage[] = [
      { provider: 'UPS', message: 'Timeout error' },
      { provider: 'USPS', message: 'Service unavailable' },
    ];
    
    render(<QuoteResultsList quotes={mockQuotes} messages={messages} />);
    
    expect(screen.getByText(/UPS/)).toBeInTheDocument();
    expect(screen.getByText(/USPS/)).toBeInTheDocument();
  });
});
