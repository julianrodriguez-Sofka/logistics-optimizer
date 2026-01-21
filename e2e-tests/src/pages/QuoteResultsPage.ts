import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * QuoteResultsPage - Page Object para la lista de cotizaciones
 * Maneja la interacción con los resultados de cotización (HU-01, HU-03)
 * 
 * Selectores basados en logistics-front/src/components/QuoteResultsList.tsx
 */
export class QuoteResultsPage extends BasePage {
  // Quote cards
  readonly quoteCards: Locator;
  readonly cheapestBadge: Locator;
  readonly fastestBadge: Locator;
  readonly routeMapButton: Locator;
  readonly routeMapModal: Locator;
  readonly selectQuoteButton: Locator;
  readonly createShipmentButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Selectores del componente QuoteResultsList
    this.quoteCards = page.locator('[data-testid="quote-card"]');
    this.cheapestBadge = page.locator('[data-testid="cheapest-badge"]');
    this.fastestBadge = page.locator('[data-testid="fastest-badge"]');
    this.routeMapButton = page.locator('button:has-text("View Route"), button:has-text("Ver Ruta")');
    this.routeMapModal = page.locator('[data-testid="route-map-modal"]');
    this.selectQuoteButton = page.locator('button:has-text("Select"), button:has-text("Seleccionar")');
    this.createShipmentButton = page.locator('button:has-text("Create Shipment"), button:has-text("Crear Envío")');
  }

  /**
   * Wait for quote results to load
   */
  async waitForResults(timeout: number = 10000): Promise<void> {
    await this.quoteCards.first().waitFor({ state: 'visible', timeout });
    await this.takeScreenshot('08_quote_results_loaded');
  }

  /**
   * Get number of quote cards displayed
   */
  async getQuoteCount(): Promise<number> {
    return await this.quoteCards.count();
  }

  /**
   * Check if cheapest option is highlighted
   */
  async isCheapestHighlighted(): Promise<boolean> {
    return await this.isVisible(this.cheapestBadge);
  }

  /**
   * Check if fastest option is highlighted
   */
  async isFastestHighlighted(): Promise<boolean> {
    return await this.isVisible(this.fastestBadge);
  }

  /**
   * Select a specific quote by provider name
   */
  async selectQuoteByProvider(providerName: string): Promise<void> {
    const providerCard = this.page.locator(`[data-testid="quote-card"]:has-text("${providerName}")`);
    await providerCard.waitFor({ state: 'visible', timeout: 10000 });
    await this.takeScreenshot(`09_selecting_${providerName.toLowerCase()}_quote`);
    
    const selectButton = providerCard.locator('button:has-text("Select"), button:has-text("Seleccionar")').first();
    await selectButton.click();
    await this.takeScreenshot(`10_${providerName.toLowerCase()}_quote_selected`);
  }

  /**
   * Open map for a specific provider
   */
  async openMapForProvider(providerName: string): Promise<void> {
    const providerCard = this.page.locator(`[data-testid="quote-card"]:has-text("${providerName}")`);
    await providerCard.waitFor({ state: 'visible', timeout: 10000 });
    
    const mapButton = providerCard.locator('button:has-text("View Route"), button:has-text("Ver Ruta")').first();
    await mapButton.click();
    await this.takeScreenshot(`11_${providerName.toLowerCase()}_map_opened`);
  }

  /**
   * Wait for map modal to appear
   */
  async waitForMapModal(): Promise<void> {
    // Wait for the modal container instead of specific data-testid
    await this.page.locator('.fixed.inset-0.z-\\[9999\\]').waitFor({ state: 'visible', timeout: 10000 });
    await this.takeScreenshot('12_map_modal_visible');
  }

  /**
   * Close map modal
   */
  async closeMapModal(): Promise<void> {
    const closeButton = this.page.locator('button[aria-label="Cerrar"]').first();
    await closeButton.click();
    await this.takeScreenshot('13_map_modal_closed');
  }

  /**
   * Get quote details (price, provider, delivery days)
   */
  async getQuoteDetails(index: number = 0): Promise<{
    provider: string;
    price: string;
    deliveryDays: string;
  }> {
    const card = this.quoteCards.nth(index);
    const provider = await card.locator('h4.text-text-dark').first().textContent() || '';
    const price = await card.locator('p.text-3xl.font-black').first().textContent() || '';
    const deliveryDays = await card.locator('span:has-text("Days")').first().textContent() || '';
    
    return { provider, price, deliveryDays };
  }

  /**
   * Verify all quotes have required details
   */
  async verifyAllQuotesHaveDetails(): Promise<boolean> {
    const count = await this.getQuoteCount();
    
    for (let i = 0; i < count; i++) {
      const details = await this.getQuoteDetails(i);
      if (!details.provider || !details.price || !details.deliveryDays) {
        return false;
      }
    }
    
    return true;
  }
}
