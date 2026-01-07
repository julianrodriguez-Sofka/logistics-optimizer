import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineProviderMessage } from '../OfflineProviderMessage';

describe('OfflineProviderMessage', () => {
  it('should render provider name in message', () => {
    render(<OfflineProviderMessage providerName="FedEx" message="No disponible" />);
    
    expect(screen.getByText(/FedEx/)).toBeInTheDocument();
  });

  it('should render custom message', () => {
    render(<OfflineProviderMessage providerName="DHL" message="Servicio temporalmente fuera de línea" />);
    
    expect(screen.getByText(/Servicio temporalmente fuera de línea/)).toBeInTheDocument();
  });

  it('should display warning icon', () => {
    render(<OfflineProviderMessage providerName="Local" message="No disponible" />);
    
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should have yellow/warning background', () => {
    const { container } = render(<OfflineProviderMessage providerName="FedEx" message="Error" />);
    
    const messageBox = container.firstChild as HTMLElement;
    expect(messageBox).toHaveClass('bg-yellow-50');
    expect(messageBox).toHaveClass('border-yellow-300');
  });

  it('should have proper warning styling for text', () => {
    const { container } = render(<OfflineProviderMessage providerName="DHL" message="Offline" />);
    
    const messageBox = container.firstChild as HTMLElement;
    expect(messageBox).toHaveClass('text-yellow-800');
  });

  it('should have proper ARIA role', () => {
    render(<OfflineProviderMessage providerName="FedEx" message="Offline" />);
    
    const messageBox = screen.getByRole('alert');
    expect(messageBox).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(<OfflineProviderMessage providerName="FedEx" message="No disponible temporalmente" />);
    expect(container).toMatchSnapshot();
  });
});
