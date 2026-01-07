import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QuoteRequestForm } from '../QuoteRequestForm';

describe('QuoteRequestForm', () => {
  it('should disable submit button when form is invalid', () => {
    render(<QuoteRequestForm onSubmit={() => {}} />);
    
    const submitButton = screen.getByRole('button', { name: /calculate rates/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show error for weight less than 0.1 kg', async () => {
    const user = userEvent.setup();
    render(<QuoteRequestForm onSubmit={() => {}} />);
    
    const weightInput = screen.getByLabelText(/weight/i);
    await user.type(weightInput, '0');
    await user.tab(); // Blur to trigger validation
    
    expect(await screen.findByText(/peso debe ser mayor a 0\.1 kg/i)).toBeInTheDocument();
  });

  it('should show error for weight greater than 1000 kg', async () => {
    const user = userEvent.setup();
    render(<QuoteRequestForm onSubmit={() => {}} />);
    
    const weightInput = screen.getByLabelText(/weight/i);
    await user.clear(weightInput);
    await user.type(weightInput, '1001');
    await user.tab();
    
    expect(await screen.findByText(/peso máximo permitido es 1000 kg/i)).toBeInTheDocument();
  });

  it('should show error for empty origin', async () => {
    const user = userEvent.setup();
    render(<QuoteRequestForm onSubmit={() => {}} />);
    
    const originInput = screen.getByLabelText(/origin address/i);
    await user.click(originInput);
    await user.tab(); // Blur without entering data
    
    expect(await screen.findByText(/origen es requerido/i)).toBeInTheDocument();
  });

  it('should show error for empty destination', async () => {
    const user = userEvent.setup();
    render(<QuoteRequestForm onSubmit={() => {}} />);
    
    const destinationInput = screen.getByLabelText(/city/i);
    await user.click(destinationInput);
    await user.tab();
    
    expect(await screen.findByText(/destino es requerido/i)).toBeInTheDocument();
  });

  it('should show error for past date', async () => {
    const user = userEvent.setup();
    render(<QuoteRequestForm onSubmit={() => {}} />);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    
    const dateInput = screen.getByLabelText(/pickup date/i);
    await user.type(dateInput, dateString);
    await user.tab();
    
    expect(await screen.findByText(/La fecha no puede ser anterior a hoy/i)).toBeInTheDocument();
  });

  it('should show error for date more than 30 days ahead', async () => {
    const user = userEvent.setup();
    render(<QuoteRequestForm onSubmit={() => {}} />);
    
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 31);
    const dateString = farFuture.toISOString().split('T')[0];
    
    const dateInput = screen.getByLabelText(/pickup date/i);
    await user.type(dateInput, dateString);
    await user.tab();
    
    expect(await screen.findByText(/fecha no puede ser mayor a 30 días/i)).toBeInTheDocument();
  });

  it('should enable submit button when all fields are valid', async () => {
    const user = userEvent.setup();
    render(<QuoteRequestForm onSubmit={() => {}} />);
    
    // Fill all fields with valid data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await user.type(screen.getByLabelText(/origin address/i), 'New York, NY');
    await user.type(screen.getByLabelText(/city/i), 'Los Angeles, CA');
    await user.type(screen.getByLabelText(/weight/i), '5.5');
    await user.type(screen.getByLabelText(/pickup date/i), dateString);
    
    const submitButton = screen.getByRole('button', { name: /calculate rates/i });
    expect(submitButton).toBeEnabled();
  });

  it('should call onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<QuoteRequestForm onSubmit={mockSubmit} />);
    
    // Fill form with valid data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await user.type(screen.getByLabelText(/origin address/i), 'New York, NY');
    await user.type(screen.getByLabelText(/city/i), 'Los Angeles, CA');
    await user.type(screen.getByLabelText(/weight/i), '10');
    await user.type(screen.getByLabelText(/pickup date/i), dateString);
    
    const submitButton = screen.getByRole('button', { name: /calculate rates/i });
    await user.click(submitButton);
    
    expect(mockSubmit).toHaveBeenCalledWith({
      origin: 'New York, NY',
      destination: 'Los Angeles, CA',
      weight: 10,
      pickupDate: expect.any(String),
      fragile: false,
    });
  });
});
