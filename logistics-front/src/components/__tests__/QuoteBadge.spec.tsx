import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteBadge } from '../QuoteBadge';

describe('QuoteBadge', () => {
  describe('Cheapest badge', () => {
    it('should render cheapest badge when visible is true', () => {
      render(<QuoteBadge type="cheapest" visible={true} />);
      
      expect(screen.getByText('$')).toBeInTheDocument();
      expect(screen.getByText('Más Barata')).toBeInTheDocument();
    });

    it('should have green background for cheapest badge', () => {
      const { container } = render(<QuoteBadge type="cheapest" visible={true} />);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-green-500');
    });

    it('should not render when visible is false', () => {
      const { container } = render(<QuoteBadge type="cheapest" visible={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Fastest badge', () => {
    it('should render fastest badge when visible is true', () => {
      render(<QuoteBadge type="fastest" visible={true} />);
      
      expect(screen.getByText('⚡')).toBeInTheDocument();
      expect(screen.getByText('Más Rápida')).toBeInTheDocument();
    });

    it('should have blue background for fastest badge', () => {
      const { container } = render(<QuoteBadge type="fastest" visible={true} />);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-blue-500');
    });

    it('should not render when visible is false', () => {
      const { container } = render(<QuoteBadge type="fastest" visible={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for cheapest badge', () => {
      render(<QuoteBadge type="cheapest" visible={true} />);
      
      const badge = screen.getByLabelText('Opción más barata');
      expect(badge).toBeInTheDocument();
    });

    it('should have proper aria-label for fastest badge', () => {
      render(<QuoteBadge type="fastest" visible={true} />);
      
      const badge = screen.getByLabelText('Opción más rápida');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Visual styling', () => {
    it('should have white text color', () => {
      const { container } = render(<QuoteBadge type="cheapest" visible={true} />);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-white');
    });

    it('should have rounded corners', () => {
      const { container } = render(<QuoteBadge type="cheapest" visible={true} />);
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('rounded-full');
    });

    it('should display icon and text together', () => {
      render(<QuoteBadge type="cheapest" visible={true} />);
      
      expect(screen.getByText('$')).toBeInTheDocument();
      expect(screen.getByText('Más Barata')).toBeInTheDocument();
    });
  });

  describe('Snapshots', () => {
    it('should match snapshot for cheapest badge', () => {
      const { container } = render(<QuoteBadge type="cheapest" visible={true} />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot for fastest badge', () => {
      const { container } = render(<QuoteBadge type="fastest" visible={true} />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot for hidden badge', () => {
      const { container } = render(<QuoteBadge type="cheapest" visible={false} />);
      expect(container).toMatchSnapshot();
    });
  });
});
