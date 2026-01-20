/**
 * PaymentProcessingModal Unit Tests
 * 
 * Tests for the payment processing animation modal component.
 * 
 * Design Patterns Tested:
 * - State Machine: Processing stages management
 * - Observer Pattern: Completion notification
 * 
 * UX Testing:
 * - Animation states
 * - User feedback
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentProcessingModal } from '../../../components/PaymentProcessingModal';

// Mock timers for animation testing
vi.useFakeTimers();

describe('PaymentProcessingModal', () => {
  const defaultProps = {
    isOpen: true,
    paymentMethod: 'CARD' as const,
    amount: 150000,
    onComplete: vi.fn(),
    trackingNumber: 'LOG-2026-12345',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <PaymentProcessingModal
          {...defaultProps}
          isOpen={false}
        />
      );

      expect(screen.queryByText('Procesando Pago')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<PaymentProcessingModal {...defaultProps} />);

      expect(screen.getByText('Procesando Pago')).toBeInTheDocument();
    });

    it('should display the payment amount', () => {
      render(<PaymentProcessingModal {...defaultProps} />);

      // Amount should be formatted as Colombian currency
      expect(screen.getByText(/\$150\.000/)).toBeInTheDocument();
    });

    it('should show backdrop overlay', () => {
      const { container } = render(<PaymentProcessingModal {...defaultProps} />);

      const backdrop = container.querySelector('.bg-black\\/60');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Card Payment Flow', () => {
    it('should show card-specific processing steps', async () => {
      render(<PaymentProcessingModal {...defaultProps} paymentMethod="CARD" />);

      // Initial step should show card validation
      expect(screen.getByText(/Validando datos de la tarjeta/i)).toBeInTheDocument();
    });

    it('should progress through all card payment steps', async () => {
      render(<PaymentProcessingModal {...defaultProps} paymentMethod="CARD" />);

      // Step 1: Validating
      expect(screen.getByText(/Validando datos de la tarjeta/i)).toBeInTheDocument();

      // Advance through steps
      await act(async () => {
        vi.advanceTimersByTime(1200); // validating duration
      });

      await waitFor(() => {
        expect(screen.getByText(/Conectando con el banco/i)).toBeInTheDocument();
      });

      await act(async () => {
        vi.advanceTimersByTime(1500); // processing duration
      });

      await waitFor(() => {
        expect(screen.getByText(/Confirmando transacción/i)).toBeInTheDocument();
      });
    });

    it('should show success message after processing completes', async () => {
      render(<PaymentProcessingModal {...defaultProps} paymentMethod="CARD" />);

      // Fast-forward through all steps
      await act(async () => {
        vi.advanceTimersByTime(5000); // Total duration of all steps
      });

      await waitFor(() => {
        expect(screen.getByText(/¡Pago Exitoso!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cash Payment Flow', () => {
    it('should show cash-specific processing steps', async () => {
      render(<PaymentProcessingModal {...defaultProps} paymentMethod="CASH" />);

      // Initial step should show order verification
      expect(screen.getByText(/Verificando pedido/i)).toBeInTheDocument();
    });

    it('should show "Pedido Confirmado" for cash payments', async () => {
      render(<PaymentProcessingModal {...defaultProps} paymentMethod="CASH" />);

      // Fast-forward through all steps
      await act(async () => {
        vi.advanceTimersByTime(4000); // Cash flow is shorter
      });

      await waitFor(() => {
        expect(screen.getByText(/¡Pedido Confirmado!/i)).toBeInTheDocument();
      });
    });

    it('should indicate payment is pending for cash', async () => {
      render(<PaymentProcessingModal {...defaultProps} paymentMethod="CASH" />);

      await act(async () => {
        vi.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Pendiente de cobro/i)).toBeInTheDocument();
      });
    });
  });

  describe('Invoice Generation', () => {
    it('should generate invoice after processing', async () => {
      render(<PaymentProcessingModal {...defaultProps} />);

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Factura Electrónica/i)).toBeInTheDocument();
      });
    });

    it('should display tracking number in invoice', async () => {
      render(<PaymentProcessingModal {...defaultProps} trackingNumber="LOG-TEST-001" />);

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByText('LOG-TEST-001')).toBeInTheDocument();
      });
    });

    it('should show correct payment method in invoice', async () => {
      render(<PaymentProcessingModal {...defaultProps} paymentMethod="CARD" />);

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Tarjeta de Crédito/i)).toBeInTheDocument();
      });
    });
  });

  describe('Completion Callback', () => {
    it('should call onComplete when continue button is clicked', async () => {
      const onComplete = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<PaymentProcessingModal {...defaultProps} onComplete={onComplete} />);

      // Fast-forward to completion
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Wait for continue button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Continuar/i })).toBeInTheDocument();
      });

      // Click continue
      await user.click(screen.getByRole('button', { name: /Continuar/i }));

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress Indicators', () => {
    it('should show progress dots for steps', () => {
      render(<PaymentProcessingModal {...defaultProps} paymentMethod="CARD" />);

      // Card flow has 5 steps, so 5 dots
      const dots = document.querySelectorAll('.rounded-full.w-3.h-3');
      expect(dots.length).toBe(5);
    });

    it('should highlight current step', async () => {
      render(<PaymentProcessingModal {...defaultProps} />);

      // First dot should be highlighted (blue and scaled)
      const firstDot = document.querySelector('.bg-blue-500.scale-125');
      expect(firstDot).toBeInTheDocument();
    });
  });

  describe('User Guidance', () => {
    it('should show warning not to close window during processing', () => {
      render(<PaymentProcessingModal {...defaultProps} />);

      expect(screen.getByText(/no cierre esta ventana/i)).toBeInTheDocument();
    });

    it('should show processing icon', () => {
      render(<PaymentProcessingModal {...defaultProps} />);

      // Check for spinner animation
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Amount Formatting', () => {
    it('should format large amounts correctly', () => {
      render(<PaymentProcessingModal {...defaultProps} amount={1500000} />);

      expect(screen.getByText(/\$1\.500\.000/)).toBeInTheDocument();
    });

    it('should format small amounts correctly', () => {
      render(<PaymentProcessingModal {...defaultProps} amount={5000} />);

      expect(screen.getByText(/\$5\.000/)).toBeInTheDocument();
    });
  });

  describe('State Reset', () => {
    it('should reset state when modal reopens', async () => {
      const { rerender } = render(
        <PaymentProcessingModal {...defaultProps} isOpen={true} />
      );

      // Progress to completion
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByText(/¡Pago Exitoso!/i)).toBeInTheDocument();
      });

      // Close and reopen
      rerender(<PaymentProcessingModal {...defaultProps} isOpen={false} />);
      rerender(<PaymentProcessingModal {...defaultProps} isOpen={true} />);

      // Should show processing state again
      await waitFor(() => {
        expect(screen.getByText(/Procesando Pago/)).toBeInTheDocument();
      });
    });
  });
});
