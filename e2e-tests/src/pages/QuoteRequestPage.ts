import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * QuoteRequestPage - Page Object para el formulario de cotización
 * Maneja la interacción con el formulario de solicitud de cotización (HU-01)
 * 
 * Selectores basados en el código real de logistics-front/src/components/QuoteRequestForm.tsx
 */
export class QuoteRequestPage extends BasePage {
  // Form fields - usando los nombres reales del componente
  readonly originInput: Locator;
  readonly destinationInput: Locator;
  readonly weightInput: Locator;
  readonly pickupDateInput: Locator;
  readonly fragileCheckbox: Locator;
  readonly submitButton: Locator;
  readonly validationError: Locator;

  constructor(page: Page) {
    super(page);
    
    // Selectores exactos del componente QuoteRequestForm
    this.originInput = page.locator('input[name="origin"]');
    this.destinationInput = page.locator('input[name="destination"]');
    this.weightInput = page.locator('input[name="weight"]');
    this.pickupDateInput = page.locator('input[name="pickupDate"]');
    this.fragileCheckbox = page.locator('input[name="fragile"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.validationError = page.locator('.text-error, .text-red-600, [role="alert"]');
  }

  /**
   * Navigate to quote request page (homepage)
   */
  async navigate(): Promise<void> {
    await this.goto('/');
    await this.takeScreenshot('01_quote_page_loaded');
  }

  /**
   * Fill the complete quote form
   */
  async fillQuoteForm(data: {
    origin: string;
    destination: string;
    weight: number;
    pickupDate: string;
    fragile?: boolean;
  }): Promise<void> {
    await this.fill(this.originInput, data.origin);
    await this.takeScreenshot('02_origin_filled');

    await this.fill(this.destinationInput, data.destination);
    await this.takeScreenshot('03_destination_filled');

    await this.fill(this.weightInput, data.weight.toString());
    await this.takeScreenshot('04_weight_filled');

    await this.fill(this.pickupDateInput, data.pickupDate);
    await this.takeScreenshot('05_date_filled');

    if (data.fragile) {
      await this.setCheckbox(this.fragileCheckbox, true);
      await this.takeScreenshot('06_fragile_checked');
    }
  }

  /**
   * Submit the quote form
   */
  async submitForm(): Promise<void> {
    await this.click(this.submitButton);
    await this.takeScreenshot('07_form_submitted');
  }

  /**
   * Fill and submit in one action
   */
  async requestQuote(data: {
    origin: string;
    destination: string;
    weight: number;
    pickupDate: string;
    fragile?: boolean;
  }): Promise<void> {
    await this.fillQuoteForm(data);
    await this.submitForm();
  }

  /**
   * Check if form has validation errors
   */
  async hasValidationError(): Promise<boolean> {
    return await this.isVisible(this.validationError);
  }

  /**
   * Get validation error message
   */
  async getValidationErrorMessage(): Promise<string> {
    return await this.getText(this.validationError);
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }
}
