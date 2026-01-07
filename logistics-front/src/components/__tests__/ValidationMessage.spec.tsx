import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationMessage } from '../ValidationMessage';

describe('ValidationMessage', () => {
  it('should render error message with red styling', () => {
    render(<ValidationMessage message="El peso es requerido" type="error" />);
    
    const messageElement = screen.getByText('El peso es requerido');
    expect(messageElement).toBeInTheDocument();
    // Check parent div for the error class
    const parentDiv = messageElement.closest('div');
    expect(parentDiv?.className).toContain('text-error');
  });

  it('should render warning message with yellow styling', () => {
    render(<ValidationMessage message="Advertencia: peso alto" type="warning" />);
    
    const messageElement = screen.getByText('Advertencia: peso alto');
    expect(messageElement).toBeInTheDocument();
    // Check parent div for the warning class
    const parentDiv = messageElement.closest('div');
    expect(parentDiv?.className).toContain('text-warning');
  });

  it('should render info message with blue styling', () => {
    render(<ValidationMessage message="Información adicional" type="info" />);
    
    const messageElement = screen.getByText('Información adicional');
    expect(messageElement).toBeInTheDocument();
    // Check parent div for the info class
    const parentDiv = messageElement.closest('div');
    expect(parentDiv?.className).toContain('text-info');
  });

  it('should not render when message is empty', () => {
    const { container } = render(<ValidationMessage message="" type="error" />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when message is null', () => {
    const { container } = render(<ValidationMessage message={null} type="error" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render error icon for error type', () => {
    render(<ValidationMessage message="Error" type="error" />);
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('should render warning icon for warning type', () => {
    render(<ValidationMessage message="Warning" type="warning" />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should render info icon for info type', () => {
    render(<ValidationMessage message="Info" type="info" />);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes for accessibility', () => {
    render(<ValidationMessage message="Error message" type="error" />);
    
    const messageElement = screen.getByRole('alert');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveAttribute('aria-live', 'polite');
  });

  it('should match snapshot for error state', () => {
    const { container } = render(<ValidationMessage message="Error" type="error" />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for warning state', () => {
    const { container } = render(<ValidationMessage message="Warning" type="warning" />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for info state', () => {
    const { container } = render(<ValidationMessage message="Info" type="info" />);
    expect(container).toMatchSnapshot();
  });
});
