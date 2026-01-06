import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuoteResultsList } from '../QuoteResultsList';
import { IQuote, IProviderMessage } from '../../../domain/models/Quote';

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
    expect(screen.getByText(/\$85\.50/)).toBeInTheDocument();
    expect(screen.getByText(/3-4 días/)).toBeInTheDocument();
  });

  it('should display cheapest badge on the cheapest quote', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const cheapestBadge = screen.getByText(/más barata/i);
    expect(cheapestBadge).toBeInTheDocument();
  });

  it('should display fastest badge on the fastest quote', () => {
    render(<QuoteResultsList quotes={mockQuotes} messages={[]} />);
    
    const fastestBadge = screen.getByText(/más rápida/i);
    expect(fastestBadge).toBeInTheDocument();
  });

  it('should handle empty quotes array', () => {
    render(<QuoteResultsList quotes={[]} messages={[]} />);
    
    expect(screen.getByText(/no se encontraron cotizaciones/i)).toBeInTheDocument();
  });

  it('should display all quote information', () => {
    render(<QuoteResultsList quotes={[mockQuotes[0]]} messages={[]} />);
    
    expect(screen.getByText('FedEx')).toBeInTheDocument();
    expect(screen.getByText(/\$85\.50/)).toBeInTheDocument();
    expect(screen.getByText(/3-4 días/)).toBeInTheDocument();
    expect(screen.getByText(/ground/i)).toBeInTheDocument();
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
