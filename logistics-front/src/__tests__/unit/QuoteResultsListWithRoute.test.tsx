/**
 * Tests for QuoteResultsList with Route Information
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteResultsList } from '../../components/QuoteResultsList';
import { mockQuoteWithRoute, mockRouteInfo } from '../mocks/routeMocks';

// Mock the RouteMapModal component
vi.mock('../../components/RouteMapModal', () => ({
  RouteMapModal: ({ isOpen, origin, destination }: any) =>
    isOpen ? (
      <div data-testid="route-map-modal">
        <span>Origin: {origin}</span>
        <span>Destination: {destination}</span>
      </div>
    ) : null,
}));

describe('QuoteResultsList with Route Information', () => {
  it('should display route information summary when routeInfo is provided', () => {
    render(
      <QuoteResultsList
        quotes={[mockQuoteWithRoute]}
        messages={[]}
        routeInfo={mockRouteInfo}
      />
    );

    expect(screen.getByText('300 km')).toBeInTheDocument();
    expect(screen.getByText('3h 0min')).toBeInTheDocument();
    expect(screen.getByText('Regional')).toBeInTheDocument();
  });

  it('should display "Ver Ruta en Mapa" button when route info exists', () => {
    render(
      <QuoteResultsList
        quotes={[mockQuoteWithRoute]}
        messages={[]}
        routeInfo={mockRouteInfo}
      />
    );

    const mapButton = screen.getByText('Ver Ruta en Mapa');
    expect(mapButton).toBeInTheDocument();
  });

  it('should display price per km when available', () => {
    render(<QuoteResultsList quotes={[mockQuoteWithRoute]} messages={[]} />);

    expect(screen.getByText(/\$250\.00\/km/)).toBeInTheDocument();
  });

  it('should display distance and category in quote card', () => {
    render(<QuoteResultsList quotes={[mockQuoteWithRoute]} messages={[]} />);

    expect(screen.getByText('300 km')).toBeInTheDocument();
    expect(screen.getByText('Regional')).toBeInTheDocument();
  });

  it('should open route map modal when "Ver Ruta" is clicked', () => {
    render(<QuoteResultsList quotes={[mockQuoteWithRoute]} messages={[]} />);

    const viewRouteButton = screen.getByText('Ver Ruta');
    fireEvent.click(viewRouteButton);

    expect(screen.getByTestId('route-map-modal')).toBeInTheDocument();
    expect(screen.getByText(/Bogotá, Colombia/)).toBeInTheDocument();
    expect(screen.getByText(/Medellín, Colombia/)).toBeInTheDocument();
  });

  it('should not display route information when not available', () => {
    const quoteWithoutRoute = {
      ...mockQuoteWithRoute,
      routeInfo: undefined,
      pricePerKm: undefined,
    };

    render(<QuoteResultsList quotes={[quoteWithoutRoute]} messages={[]} />);

    expect(screen.queryByText(/km$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Ver Ruta')).not.toBeInTheDocument();
  });

  it('should handle multiple quotes with different route info', () => {
    const quote1 = mockQuoteWithRoute;
    const quote2 = {
      ...mockQuoteWithRoute,
      providerId: 'dhl-express',
      providerName: 'DHL Express',
      routeInfo: {
        ...mockRouteInfo,
        distanceKm: 450,
        category: 'Nacional',
      },
    };

    render(<QuoteResultsList quotes={[quote1, quote2]} messages={[]} />);

    expect(screen.getByText('300 km')).toBeInTheDocument();
    expect(screen.getByText('450 km')).toBeInTheDocument();
    expect(screen.getByText('Regional')).toBeInTheDocument();
    expect(screen.getByText('Nacional')).toBeInTheDocument();
  });
});
