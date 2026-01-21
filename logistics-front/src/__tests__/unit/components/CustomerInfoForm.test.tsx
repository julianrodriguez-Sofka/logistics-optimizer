/**
 * CustomerInfoForm Component Tests
 * Tests for customer information validation and submission
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerInfoForm from '../../../components/CustomerInfoForm';
import type { CustomerFormData } from '../../../models/Customer';

describe('CustomerInfoForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnBack = vi.fn();

  const validCustomerData: CustomerFormData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+57 3001234567',
    address: 'Calle 123 #45-67, Bogotá',
    documentType: 'CC',
    documentNumber: '1234567890',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de documento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número de documento/i)).toBeInTheDocument();
  });

  it('should populate form with initial data', () => {
    render(
      <CustomerInfoForm
        onSubmit={mockOnSubmit}
        initialData={validCustomerData}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+57 3001234567')).toBeInTheDocument();
  });

  it('should validate name with minimum length', async () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nameInput, { target: { value: 'Jo' } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByText(/nombre debe tener al menos 3 caracteres/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('should accept valid email format', async () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.queryByText(/email inválido/i)).not.toBeInTheDocument();
    });
  });

  it('should validate Colombian phone format', async () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByLabelText(/teléfono/i);
    fireEvent.change(phoneInput, { target: { value: '123456' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText(/teléfono inválido/i)).toBeInTheDocument();
    });
  });

  it('should accept valid Colombian phone number', async () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByLabelText(/teléfono/i);
    fireEvent.change(phoneInput, { target: { value: '+57 3001234567' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.queryByText(/teléfono inválido/i)).not.toBeInTheDocument();
    });
  });

  it('should validate address minimum length', async () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    const addressInput = screen.getByLabelText(/dirección/i);
    fireEvent.change(addressInput, { target: { value: 'Short' } });
    fireEvent.blur(addressInput);

    await waitFor(() => {
      expect(screen.getByText(/dirección debe tener al menos 10 caracteres/i)).toBeInTheDocument();
    });
  });

  it('should validate document number minimum length', async () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    const docInput = screen.getByLabelText(/número de documento/i);
    fireEvent.change(docInput, { target: { value: '123' } });
    fireEvent.blur(docInput);

    await waitFor(() => {
      expect(screen.getByText(/número de documento debe tener al menos 5 caracteres/i)).toBeInTheDocument();
    });
  });

  it('should call onSubmit with valid data', async () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    // Fill all fields
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: validCustomerData.name } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: validCustomerData.email } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: validCustomerData.phone } });
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: validCustomerData.address } });
    fireEvent.change(screen.getByLabelText(/número de documento/i), { target: { value: validCustomerData.documentNumber } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /continuar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validCustomerData.name,
          email: validCustomerData.email,
          phone: validCustomerData.phone,
        })
      );
    });
  });

  it('should not submit with validation errors', async () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    // Fill with invalid data
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Jo' } });
    fireEvent.blur(screen.getByLabelText(/nombre/i));

    const submitButton = screen.getByRole('button', { name: /continuar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should call onBack when back button is clicked', () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} onBack={mockOnBack} />);

    const backButton = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should disable submit button when loading', () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /continuar/i });
    expect(submitButton).toBeDisabled();
  });

  it('should support all document types', () => {
    render(<CustomerInfoForm onSubmit={mockOnSubmit} />);

    const docTypeSelect = screen.getByLabelText(/tipo de documento/i);
    
    expect(docTypeSelect).toHaveLength.greaterThan(0);
    expect(screen.getByRole('option', { name: /CC/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /CE/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /NIT/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /PASSPORT/i })).toBeInTheDocument();
  });
});
