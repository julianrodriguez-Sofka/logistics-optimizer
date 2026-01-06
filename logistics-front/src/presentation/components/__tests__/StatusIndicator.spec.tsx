import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from '../StatusIndicator';

describe('StatusIndicator', () => {
  describe('Online status', () => {
    it('should render green circle for online status', () => {
      const { container } = render(<StatusIndicator status="online" />);
      
      const indicator = container.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should display "En Línea" text for online', () => {
      render(<StatusIndicator status="online" />);
      expect(screen.getByText('En Línea')).toBeInTheDocument();
    });

    it('should show green checkmark icon', () => {
      render(<StatusIndicator status="online" />);
      expect(screen.getByText('🟢')).toBeInTheDocument();
    });
  });

  describe('Offline status', () => {
    it('should render red circle for offline status', () => {
      const { container } = render(<StatusIndicator status="offline" />);
      
      const indicator = container.querySelector('.bg-red-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should display "Fuera de Línea" text for offline', () => {
      render(<StatusIndicator status="offline" />);
      expect(screen.getByText('Fuera de Línea')).toBeInTheDocument();
    });

    it('should show red circle icon', () => {
      render(<StatusIndicator status="offline" />);
      expect(screen.getByText('🔴')).toBeInTheDocument();
    });
  });

  describe('Degraded status', () => {
    it('should render yellow circle for degraded status', () => {
      const { container } = render(<StatusIndicator status="degraded" />);
      
      const indicator = container.querySelector('.bg-yellow-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should display "Degradado" text for degraded', () => {
      render(<StatusIndicator status="degraded" />);
      expect(screen.getByText('Degradado')).toBeInTheDocument();
    });

    it('should show warning icon', () => {
      render(<StatusIndicator status="degraded" />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('Snapshots', () => {
    it('should match snapshot for online state', () => {
      const { container } = render(<StatusIndicator status="online" />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot for offline state', () => {
      const { container } = render(<StatusIndicator status="offline" />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot for degraded state', () => {
      const { container } = render(<StatusIndicator status="degraded" />);
      expect(container).toMatchSnapshot();
    });
  });
});
