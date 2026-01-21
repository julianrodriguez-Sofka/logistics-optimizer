/**
 * PaymentForm Component Tests
 * Tests for payment card validation and submission
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentForm from '../../../components/PaymentForm';

describe('PaymentForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnBack = vi.fn();

  const mockQuote = {
    provider: 'FedEx',
    price: 50000,
    estimatedDeliveryDays: 2,
    distance: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment method options', () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    expect(screen.getByText(/método de pago/i)).toBeInTheDocument();
    expect(screen.getByText(/tarjeta de crédito/i)).toBeInTheDocument();
    expect(screen.getByText(/efectivo/i)).toBeInTheDocument();
  });

  it('should show card fields when CARD payment is selected', () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    expect(screen.getByLabelText(/número de tarjeta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre del titular/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de vencimiento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CVV/i)).toBeInTheDocument();
  });

  it('should not show card fields when CASH payment is selected', () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cashOption = screen.getByLabelText(/efectivo/i);
    fireEvent.click(cashOption);

    expect(screen.queryByLabelText(/número de tarjeta/i)).not.toBeInTheDocument();
  });

  it('should validate card number format', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    const cardInput = screen.getByLabelText(/número de tarjeta/i);
    fireEvent.change(cardInput, { target: { value: '1234' } });
    fireEvent.blur(cardInput);

    await waitFor(() => {
      expect(screen.getByText(/número de tarjeta inválido/i)).toBeInTheDocument();
    });
  });

  it('should accept valid card number (16 digits)', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    const cardInput = screen.getByLabelText(/número de tarjeta/i);
    fireEvent.change(cardInput, { target: { value: '4111111111111111' } });
    fireEvent.blur(cardInput);

    await waitFor(() => {
      expect(screen.queryByText(/número de tarjeta inválido/i)).not.toBeInTheDocument();
    });
  });

  it('should validate cardholder name minimum length', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    const nameInput = screen.getByLabelText(/nombre del titular/i);
    fireEvent.change(nameInput, { target: { value: 'Jo' } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByText(/nombre debe tener al menos 3 caracteres/i)).toBeInTheDocument();
    });
  });

  it('should validate expiration date format MM/YY', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    const expInput = screen.getByLabelText(/fecha de vencimiento/i);
    fireEvent.change(expInput, { target: { value: '13/25' } });
    fireEvent.blur(expInput);

    await waitFor(() => {
      expect(screen.getByText(/fecha de vencimiento inválida/i)).toBeInTheDocument();
    });
  });

  it('should accept valid expiration date', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    const expInput = screen.getByLabelText(/fecha de vencimiento/i);
    fireEvent.change(expInput, { target: { value: '12/28' } });
    fireEvent.blur(expInput);

    await waitFor(() => {
      expect(screen.queryByText(/fecha de vencimiento inválida/i)).not.toBeInTheDocument();
    });
  });

  it('should validate CVV format (3-4 digits)', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    const cvvInput = screen.getByLabelText(/CVV/i);
    fireEvent.change(cvvInput, { target: { value: '12' } });
    fireEvent.blur(cvvInput);

    await waitFor(() => {
      expect(screen.getByText(/CVV inválido/i)).toBeInTheDocument();
    });
  });

  it('should accept valid CVV', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    const cvvInput = screen.getByLabelText(/CVV/i);
    fireEvent.change(cvvInput, { target: { value: '123' } });
    fireEvent.blur(cvvInput);

    await waitFor(() => {
      expect(screen.queryByText(/CVV inválido/i)).not.toBeInTheDocument();
    });
  });

  it('should submit with valid CARD payment data', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    fireEvent.change(screen.getByLabelText(/número de tarjeta/i), { target: { value: '4111111111111111' } });
    fireEvent.change(screen.getByLabelText(/nombre del titular/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/fecha de vencimiento/i), { target: { value: '12/28' } });
    fireEvent.change(screen.getByLabelText(/CVV/i), { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /procesar pago/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'CARD',
          cardNumber: '4111111111111111',
          cardHolderName: 'John Doe',
        })
      );
    });
  });

  it('should submit with CASH payment method', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cashOption = screen.getByLabelText(/efectivo/i);
    fireEvent.click(cashOption);

    const submitButton = screen.getByRole('button', { name: /confirmar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'CASH',
          amount: mockQuote.price,
        })
      );
    });
  });

  it('should not submit with validation errors', async () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    fireEvent.change(screen.getByLabelText(/número de tarjeta/i), { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /procesar pago/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should call onBack when back button is clicked', () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} onBack={mockOnBack} />);

    const backButton = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should display quote total amount', () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    expect(screen.getByText(/total a pagar/i)).toBeInTheDocument();
    expect(screen.getByText(/50\.?000/)).toBeInTheDocument(); // Colombian peso format
  });

  it('should have CVV field with password type', () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    const cvvInput = screen.getByLabelText(/CVV/i);
    expect(cvvInput).toHaveAttribute('type', 'password');
  });

  it('should have CVV field with autocomplete new-password', () => {
    render(<PaymentForm quote={mockQuote} onSubmit={mockOnSubmit} />);

    const cardOption = screen.getByLabelText(/tarjeta de crédito/i);
    fireEvent.click(cardOption);

    const cvvInput = screen.getByLabelText(/CVV/i);
    expect(cvvInput).toHaveAttribute('autocomplete', 'new-password');
  });
});
