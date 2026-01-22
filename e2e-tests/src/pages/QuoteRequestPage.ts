import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * QuoteRequestPage - Page Object para el formulario de cotización
 * Maneja la interacción con el formulario de solicitud de cotización (HU-01)
 * 
 * Selectores basados en el código real de:
 * - logistics-front/src/components/QuoteRequestForm.tsx
 * - logistics-front/src/components/FormField.tsx
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
  
  // Additional UI elements
  readonly loadingSpinner: Locator;
  readonly formContainer: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    
    // Selectores exactos basados en FormField.tsx (usa name attribute)
    this.originInput = page.locator('input[name="origin"]');
    this.destinationInput = page.locator('input[name="destination"]');
    this.weightInput = page.locator('input[name="weight"]');
    this.pickupDateInput = page.locator('input[name="pickupDate"]');
    this.fragileCheckbox = page.locator('input[name="fragile"]');
    
    // Submit button - QuoteRequestForm.tsx button[type="submit"]
    this.submitButton = page.locator('button[type="submit"]');
    
    // Validation error messages
    this.validationError = page.locator('.text-red-500, .text-error, [role="alert"]');
    
    // Loading state - from QuoteRequestForm
    this.loadingSpinner = page.locator('.animate-spin, text=/Calculating/i');
    
    // Container
    this.formContainer = page.locator('.bg-card-light');
    
    // Page header
    this.pageHeader = page.locator('text=/New Shipment Estimate/i, text=/Route Details/i');
  }

  /**
   * Navigate to quote request page (homepage)
   */
  async navigate(): Promise<void> {
    await this.goto('/');
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('01_quote_page_loaded');
  }

  /**
   * Verify page is fully loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.originInput).toBeVisible({ timeout: 10000 });
    await expect(this.destinationInput).toBeVisible();
    await expect(this.weightInput).toBeVisible();
    await expect(this.pickupDateInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Fill the complete quote form with realistic data
   */
  async fillQuoteForm(data: {
    origin: string;
    destination: string;
    weight: number;
    pickupDate: string;
    fragile?: boolean;
  }): Promise<void> {
    // Clear and fill origin
    await this.originInput.click();
    await this.originInput.clear();
    await this.originInput.fill(data.origin);
    await this.page.waitForTimeout(300);
    await this.takeScreenshot('02_origin_filled');

    // Clear and fill destination
    await this.destinationInput.click();
    await this.destinationInput.clear();
    await this.destinationInput.fill(data.destination);
    await this.page.waitForTimeout(300);
    await this.takeScreenshot('03_destination_filled');

    // Clear and fill weight
    await this.weightInput.click();
    await this.weightInput.clear();
    await this.weightInput.fill(data.weight.toString());
    await this.page.waitForTimeout(300);
    await this.takeScreenshot('04_weight_filled');

    // Fill date
    await this.pickupDateInput.fill(data.pickupDate);
    await this.page.waitForTimeout(300);
    await this.takeScreenshot('05_date_filled');

    // Handle fragile checkbox
    if (data.fragile) {
      const isChecked = await this.fragileCheckbox.isChecked();
      if (!isChecked) {
        await this.fragileCheckbox.click();
        await this.takeScreenshot('06_fragile_checked');
      }
    }
  }

  /**
   * Submit the quote form
   */
  async submitForm(): Promise<void> {
    await expect(this.submitButton).toBeEnabled({ timeout: 5000 });
    await this.submitButton.click();
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
   * Wait for loading to complete
   */
  async waitForLoadingComplete(timeout: number = 15000): Promise<void> {
    // Wait for loading spinner to appear and then disappear
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 3000 });
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout });
    } catch {
      // Loading might be too fast to catch
    }
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
    const errors = await this.validationError.all();
    if (errors.length === 0) return '';
    return await this.getText(errors[0]);
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /**
   * Generate a valid future date for pickup
   */
  static getValidPickupDate(daysFromNow: number = 1): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get common test data for quote requests
   */
  static getTestData() {
    const pickupDate = QuoteRequestPage.getValidPickupDate(3);
    return {
      standard: {
        origin: 'Bogotá, Cundinamarca, Colombia',
        destination: 'Medellín, Antioquia, Colombia',
        weight: 15.5,
        pickupDate,
        fragile: false
      },
      fragile: {
        origin: 'Cali, Valle del Cauca, Colombia',
        destination: 'Barranquilla, Atlántico, Colombia',
        weight: 8.0,
        pickupDate,
        fragile: true
      },
      lightweight: {
        origin: 'Bogotá, Cundinamarca, Colombia',
        destination: 'Cartagena, Bolívar, Colombia',
        weight: 2.5,
        pickupDate,
        fragile: false
      },
      heavy: {
        origin: 'Medellín, Antioquia, Colombia',
        destination: 'Bucaramanga, Santander, Colombia',
        weight: 45.0,
        pickupDate,
        fragile: false
      }
    };
  }
}
