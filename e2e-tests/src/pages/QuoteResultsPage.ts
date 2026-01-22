import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * QuoteResultsPage - Page Object para la lista de cotizaciones
 * Maneja la interacción con los resultados de cotización (HU-01, HU-03)
 * 
 * Selectores basados en:
 * - logistics-front/src/components/QuoteResultsList.tsx
 * - logistics-front/src/components/RouteMapModal.tsx
 */
export class QuoteResultsPage extends BasePage {
  // Quote cards - data-testid="quote-card" from QuoteResultsList.tsx
  readonly quoteCards: Locator;
  readonly cheapestBadge: Locator;
  readonly fastestBadge: Locator;
  
  // Map related elements
  readonly viewRouteInMapButton: Locator;
  readonly routeMapModal: Locator;
  readonly mapCloseButton: Locator;
  
  // Route information section
  readonly routeInfoSection: Locator;
  readonly distanceInfo: Locator;
  readonly durationInfo: Locator;
  
  // Quote action buttons
  readonly selectQuoteButtons: Locator;
  readonly viewRouteButtons: Locator;
  
  // Results header
  readonly resultsHeader: Locator;
  
  // New quote button
  readonly newQuoteButton: Locator;
  
  // Messages section (offline providers)
  readonly messagesSection: Locator;

  constructor(page: Page) {
    super(page);
    
    // Quote cards - using data-testid from QuoteResultsList.tsx
    this.quoteCards = page.locator('[data-testid="quote-card"]');
    
    // Badges - using data-testid from QuoteResultsList.tsx
    this.cheapestBadge = page.locator('[data-testid="cheapest-badge"]');
    this.fastestBadge = page.locator('[data-testid="fastest-badge"]');
    
    // Map button in header - "Ver Ruta en Mapa" button
    this.viewRouteInMapButton = page.locator('button:has-text("Ver Ruta en Mapa")');
    
    // Map modal - RouteMapModal.tsx uses fixed with z-[9999]
    this.routeMapModal = page.locator('.fixed.inset-0.z-\\[9999\\]');
    this.mapCloseButton = page.locator('button[aria-label="Cerrar"]');
    
    // Route info section - gradient bg from QuoteResultsList
    this.routeInfoSection = page.locator('.bg-gradient-to-r.from-primary\\/5');
    this.distanceInfo = page.locator('text=/\\d+\\s*km/i');
    this.durationInfo = page.locator('text=/\\d+h\\s*\\d+min|\\d+\\s*min/i');
    
    // Action buttons
    this.selectQuoteButtons = page.locator('[data-testid="quote-card"] button:has-text("Seleccionar")');
    this.viewRouteButtons = page.locator('[data-testid="quote-card"] button:has-text("Ver Ruta")');
    
    // Results header
    this.resultsHeader = page.locator('text=/Cotizaciones Recomendadas/i');
    
    // New quote button
    this.newQuoteButton = page.locator('button:has-text("Nueva Cotización")');
    
    // Messages section
    this.messagesSection = page.locator('text=/Avisos/i').locator('..');
  }

  /**
   * Wait for quote results to load
   */
  async waitForResults(timeout: number = 15000): Promise<void> {
    await this.quoteCards.first().waitFor({ state: 'visible', timeout });
    await this.takeScreenshot('08_quote_results_loaded');
  }

  /**
   * Get number of quote cards displayed
   */
  async getQuoteCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    return await this.quoteCards.count();
  }

  /**
   * Check if cheapest option is highlighted
   */
  async hasCheapestBadge(): Promise<boolean> {
    return await this.cheapestBadge.isVisible().catch(() => false);
  }

  /**
   * Check if fastest option is highlighted
   */
  async hasFastestBadge(): Promise<boolean> {
    return await this.fastestBadge.isVisible().catch(() => false);
  }

  /**
   * Verify badges are correctly assigned
   */
  async verifyBadgesDisplayed(): Promise<{hasCheapest: boolean, hasFastest: boolean}> {
    const hasCheapest = await this.hasCheapestBadge();
    const hasFastest = await this.hasFastestBadge();
    return { hasCheapest, hasFastest };
  }

  /**
   * Get all quotes with complete information
   */
  async getAllQuotes(): Promise<Array<{
    provider: string;
    price: number;
    deliveryDays: string;
    transportMode: string;
    isCheapest: boolean;
    isFastest: boolean;
  }>> {
    const quotes: Array<{
      provider: string;
      price: number;
      deliveryDays: string;
      transportMode: string;
      isCheapest: boolean;
      isFastest: boolean;
    }> = [];

    await this.quoteCards.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await this.quoteCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = this.quoteCards.nth(i);
      
      // Provider name - h4 element
      const providerElement = card.locator('h4').first();
      const provider = (await providerElement.textContent())?.trim() || '';
      
      // Price - text-3xl font-black
      const priceElement = card.locator('p.text-3xl').first();
      const priceText = (await priceElement.textContent())?.trim() || '0';
      const priceMatch = priceText.match(/[\d,.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/[,.]/g, '')) : 0;
      
      // Delivery days - "X-Y Days" format
      const daysText = await card.locator('text=/\\d+-\\d+\\s*Days/i').first().textContent().catch(() => '0-0 Days');
      const deliveryDays = daysText?.trim() || '0-0 Days';
      
      // Transport mode - Air or Ground
      const transportMode = await card.locator('text=/Air|Ground/i').first().textContent().catch(() => 'Ground');
      
      // Badges
      const isCheapest = await card.locator('[data-testid="cheapest-badge"]').isVisible().catch(() => false);
      const isFastest = await card.locator('[data-testid="fastest-badge"]').isVisible().catch(() => false);
      
      if (provider) {
        quotes.push({
          provider,
          price,
          deliveryDays,
          transportMode: transportMode?.trim() || 'Ground',
          isCheapest,
          isFastest
        });
      }
    }
    
    return quotes;
  }

  /**
   * Open the route map modal from header button
   */
  async openRouteMap(): Promise<void> {
    await expect(this.viewRouteInMapButton).toBeVisible({ timeout: 5000 });
    await this.viewRouteInMapButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('09_route_map_opened');
  }

  /**
   * Verify map modal is displayed
   */
  async verifyMapModalVisible(): Promise<boolean> {
    try {
      await this.routeMapModal.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close the map modal
   */
  async closeMapModal(): Promise<void> {
    await this.mapCloseButton.click();
    await this.page.waitForTimeout(500);
    await this.takeScreenshot('10_map_modal_closed');
  }

  /**
   * Select a quote by provider name for shipment creation
   */
  async selectQuoteByProvider(providerName: string): Promise<void> {
    const card = this.page.locator(`[data-testid="quote-card"]:has-text("${providerName}")`);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const selectButton = card.locator('button:has-text("Seleccionar")').first();
    await expect(selectButton).toBeVisible();
    await selectButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot(`11_selected_${providerName.toLowerCase()}_quote`);
  }

  /**
   * Select the cheapest quote
   */
  async selectCheapestQuote(): Promise<string> {
    const card = this.page.locator('[data-testid="quote-card"]:has([data-testid="cheapest-badge"])');
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const providerName = await card.locator('h4').first().textContent();
    const selectButton = card.locator('button:has-text("Seleccionar")').first();
    await selectButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('11_selected_cheapest_quote');
    
    return providerName?.trim() || '';
  }

  /**
   * Select the fastest quote
   */
  async selectFastestQuote(): Promise<string> {
    const card = this.page.locator('[data-testid="quote-card"]:has([data-testid="fastest-badge"])');
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const providerName = await card.locator('h4').first().textContent();
    const selectButton = card.locator('button:has-text("Seleccionar")').first();
    await selectButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('11_selected_fastest_quote');
    
    return providerName?.trim() || '';
  }

  /**
   * Select first available quote
   */
  async selectFirstQuote(): Promise<string> {
    const card = this.quoteCards.first();
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const providerName = await card.locator('h4').first().textContent();
    const selectButton = card.locator('button:has-text("Seleccionar")').first();
    await selectButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('11_selected_first_quote');
    
    return providerName?.trim() || '';
  }

  /**
   * Click new quote button
   */
  async clickNewQuote(): Promise<void> {
    await expect(this.newQuoteButton).toBeVisible();
    await this.newQuoteButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify route information is displayed
   */
  async verifyRouteInfoDisplayed(): Promise<{
    hasDistanceInfo: boolean;
    hasSection: boolean;
  }> {
    const hasSection = await this.routeInfoSection.isVisible().catch(() => false);
    const hasDistanceInfo = await this.distanceInfo.first().isVisible().catch(() => false);
    
    return { hasDistanceInfo, hasSection };
  }

  /**
   * Get route statistics from the info section
   */
  async getRouteStats(): Promise<{
    distance: string;
    duration: string;
    category: string;
  }> {
    const distance = await this.page.locator('text=/\\d+\\s*km/').first().textContent().catch(() => 'N/A');
    const duration = await this.page.locator('text=/\\d+h|\\d+\\s*min/i').first().textContent().catch(() => 'N/A');
    const category = await this.page.locator('text=/NATIONAL|LOCAL|REGIONAL/i').first().textContent().catch(() => 'N/A');
    
    return {
      distance: distance?.trim() || 'N/A',
      duration: duration?.trim() || 'N/A',
      category: category?.trim() || 'N/A'
    };
  }

  /**
   * Check if there are offline provider messages
   */
  async hasOfflineProviderMessages(): Promise<boolean> {
    return await this.messagesSection.isVisible().catch(() => false);
  }
}
