import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * WarehousePage - Page Object para la vista de almacén
 * Maneja la interacción con envíos, asignación de camiones y cambios de estado
 * 
 * Selectores basados en:
 * - logistics-front/src/components/WarehouseView.tsx
 * - logistics-front/src/components/Sidebar.tsx
 */
export class WarehousePage extends BasePage {
  // Navigation
  readonly warehouseNavButton: Locator;
  
  // Header elements
  readonly warehouseTitle: Locator;
  readonly statsTotal: Locator;
  readonly statsDelivered: Locator;
  readonly statsInTransit: Locator;
  
  // Search and filters
  readonly searchInput: Locator;
  readonly filterSidebar: Locator;
  readonly filterAllButton: Locator;
  
  // Shipment cards
  readonly shipmentCards: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;
  
  // Card action buttons (generic locators, will be scoped to specific cards)
  readonly advanceStatusButton: Locator;
  readonly assignTruckButton: Locator;
  readonly viewHistoryButton: Locator;
  readonly failedDeliveryButton: Locator;
  readonly returnedButton: Locator;
  
  // Truck selector dropdown
  readonly truckSelectorDropdown: Locator;
  readonly removeTruckButton: Locator;
  
  // History modal
  readonly historyModal: Locator;
  readonly historyModalCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Navigation - Sidebar.tsx button
    this.warehouseNavButton = page.locator('button:has-text("Almacén")');
    
    // Header elements
    this.warehouseTitle = page.locator('h1:has-text("Almacén de Envíos")');
    this.statsTotal = page.locator('.text-primary.text-2xl, text=/Total/i').first();
    this.statsDelivered = page.locator('.text-emerald-600.text-2xl, text=/Entregados/i').first();
    this.statsInTransit = page.locator('.text-violet-600.text-2xl, text=/En Camino/i').first();
    
    // Search and filters
    this.searchInput = page.locator('input[placeholder*="Buscar"]');
    this.filterSidebar = page.locator('aside, .filter-sidebar');
    this.filterAllButton = page.locator('aside button:has-text("Todos")');
    
    // Shipment cards - WarehouseView.tsx ShipmentCard uses these classes
    this.shipmentCards = page.locator('.bg-white.rounded-xl.shadow-lg');
    this.emptyState = page.locator('text=/No hay envíos/i');
    this.loadingState = page.locator('text=/Cargando almacén/i');
    
    // Generic action buttons (will be scoped per card)
    this.advanceStatusButton = page.locator('button:has-text("Avanzar")');
    this.assignTruckButton = page.locator('button:has-text("Asignar Camión")');
    this.viewHistoryButton = page.locator('button:has-text("Ver historial")');
    this.failedDeliveryButton = page.locator('button:has-text("No Entregado")');
    this.returnedButton = page.locator('button:has-text("Devolución")');
    
    // Truck selector
    this.truckSelectorDropdown = page.locator('.absolute.bg-white.border.rounded-lg.shadow-xl');
    this.removeTruckButton = page.locator('button:has-text("Quitar")');
    
    // History modal
    this.historyModal = page.locator('.fixed.inset-0.bg-black\\/50');
    this.historyModalCloseButton = page.locator('.fixed.inset-0.bg-black\\/50 button:has-text("✕"), .fixed.inset-0.bg-black\\/50 button:has-text("Cerrar")');
  }

  /**
   * Navigate to warehouse view from any page
   */
  async navigateToWarehouse(): Promise<void> {
    await expect(this.warehouseNavButton).toBeVisible({ timeout: 10000 });
    await this.warehouseNavButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('warehouse_01_navigated');
  }

  /**
   * Wait for warehouse to be fully loaded
   */
  async waitForWarehouseLoaded(timeout: number = 15000): Promise<void> {
    // Wait for loading to finish
    try {
      await this.loadingState.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // Loading might be too fast
    }
    
    // Wait for either shipments or empty state to appear
    try {
      await this.page.locator('.bg-white.rounded-xl.shadow-lg').first().waitFor({ state: 'visible', timeout: timeout / 2 });
    } catch {
      // If no shipment cards, check for empty state
      await this.page.locator('text=/No hay envíos/i').waitFor({ state: 'visible', timeout: timeout / 2 });
    }
    await this.takeScreenshot('warehouse_02_loaded');
  }

  /**
   * Wait for shipment cards to load
   * Returns true if shipments were found, false if warehouse is empty
   */
  async waitForShipments(timeout: number = 15000): Promise<boolean> {
    try {
      await this.waitForWarehouseLoaded(timeout);
      
      const hasEmptyState = await this.emptyState.isVisible().catch(() => false);
      if (hasEmptyState) {
        await this.takeScreenshot('warehouse_03_empty');
        return false;
      }
      
      await this.shipmentCards.first().waitFor({ state: 'visible', timeout: 5000 });
      await this.takeScreenshot('warehouse_03_shipments_visible');
      return true;
    } catch {
      await this.takeScreenshot('warehouse_03_timeout');
      return false;
    }
  }

  /**
   * Get count of visible shipment cards
   */
  async getShipmentCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    return await this.shipmentCards.count();
  }

  /**
   * Get shipment card by tracking number
   */
  getShipmentCard(trackingNumber: string): Locator {
    return this.page.locator(`.bg-white.rounded-xl.shadow-lg:has-text("${trackingNumber}")`).first();
  }

  /**
   * Get tracking number from a card at specific index
   */
  async getTrackingNumberAtIndex(index: number): Promise<string> {
    const card = this.shipmentCards.nth(index);
    const trackingElement = card.locator('p.font-bold.text-gray-800').first();
    const text = await trackingElement.textContent();
    return text?.trim() || '';
  }

  /**
   * Get the latest (first) tracking number
   */
  async getLatestTrackingNumber(): Promise<string> {
    await this.shipmentCards.first().waitFor({ state: 'visible', timeout: 10000 });
    return await this.getTrackingNumberAtIndex(0);
  }

  /**
   * Get current status of a shipment
   */
  async getShipmentStatus(trackingNumber: string): Promise<string> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    // StatusBadge uses "px-3 py-1 rounded-full text-xs font-semibold"
    const statusBadge = card.locator('span.rounded-full.text-xs.font-semibold').first();
    const text = await statusBadge.textContent();
    return text?.trim() || '';
  }

  /**
   * Assign truck to a shipment
   */
  async assignTruckToShipment(trackingNumber: string, truckPlate: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    await this.takeScreenshot(`warehouse_04_before_assign_${trackingNumber}`);
    
    // Check if "Asignar Camión" button is visible
    const assignButton = card.locator('button:has-text("Asignar Camión")');
    const isVisible = await assignButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log(`Truck assignment not available for ${trackingNumber} (may already have truck)`);
      return;
    }
    
    await assignButton.click();
    await this.page.waitForTimeout(500);
    
    // Select truck from dropdown
    const truckOption = this.page.locator(`button:has-text("${truckPlate}")`).first();
    await truckOption.waitFor({ state: 'visible', timeout: 5000 });
    await truckOption.click();
    await this.page.waitForTimeout(1000);
    
    await this.takeScreenshot(`warehouse_05_truck_assigned_${trackingNumber}`);
  }

  /**
   * Check if shipment has truck assigned
   */
  async hasTruckAssigned(trackingNumber: string): Promise<boolean> {
    const card = this.getShipmentCard(trackingNumber);
    const truckInfo = card.locator('text=/Camión Asignado/i');
    return await truckInfo.isVisible().catch(() => false);
  }

  /**
   * Advance shipment status to next state
   */
  async advanceShipmentStatus(trackingNumber: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const advanceButton = card.locator('button:has-text("Avanzar")').first();
    const isEnabled = await advanceButton.isEnabled().catch(() => false);
    
    if (!isEnabled) {
      console.log(`Advance button not enabled for ${trackingNumber} - may need truck or is terminal state`);
      return;
    }
    
    await advanceButton.click();
    await this.page.waitForTimeout(2000); // Wait for API call
    
    await this.takeScreenshot(`warehouse_06_status_advanced_${trackingNumber}`);
  }

  /**
   * Mark shipment as failed delivery
   */
  async markAsFailedDelivery(trackingNumber: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const failedButton = card.locator('button:has-text("No Entregado")').first();
    const isVisible = await failedButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log(`Failed delivery button not available for ${trackingNumber}`);
      return;
    }
    
    await failedButton.click();
    await this.page.waitForTimeout(2000);
    
    await this.takeScreenshot(`warehouse_07_failed_delivery_${trackingNumber}`);
  }

  /**
   * Mark shipment as returned
   */
  async markAsReturned(trackingNumber: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const returnedButton = card.locator('button:has-text("Devolución")').first();
    const isVisible = await returnedButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log(`Returned button not available for ${trackingNumber}`);
      return;
    }
    
    await returnedButton.click();
    await this.page.waitForTimeout(2000);
    
    await this.takeScreenshot(`warehouse_08_returned_${trackingNumber}`);
  }

  /**
   * View shipment history
   */
  async viewShipmentHistory(trackingNumber: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const historyButton = card.locator('button:has-text("Ver historial")').first();
    await historyButton.click();
    await this.page.waitForTimeout(1000);
    
    await this.takeScreenshot(`warehouse_09_history_${trackingNumber}`);
  }

  /**
   * Close history modal
   */
  async closeHistoryModal(): Promise<void> {
    await this.historyModalCloseButton.first().click();
    await this.page.waitForTimeout(500);
    await this.takeScreenshot('warehouse_10_history_closed');
  }

  /**
   * Search for shipments
   */
  async searchShipments(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
    await this.takeScreenshot(`warehouse_11_search_${query}`);
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter shipments by status
   */
  async filterByStatus(status: string): Promise<void> {
    const statusButton = this.page.locator(`aside button:has-text("${status}")`).first();
    const isVisible = await statusButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log(`Filter button for "${status}" not found`);
      return;
    }
    
    await statusButton.click();
    await this.page.waitForTimeout(500);
    await this.takeScreenshot(`warehouse_12_filter_${status}`);
  }

  /**
   * Get count of shipments with specific status from filter sidebar
   */
  async getStatusCount(status: string): Promise<number> {
    const statusButton = this.page.locator(`aside button:has-text("${status}")`).first();
    const countBadge = statusButton.locator('span.rounded-full').first();
    const countText = await countBadge.textContent().catch(() => '0');
    return parseInt(countText || '0', 10);
  }

  /**
   * Get overall statistics
   */
  async getStatistics(): Promise<{
    total: number;
    delivered: number;
    inTransit: number;
  }> {
    const totalText = await this.page.locator('.text-primary.text-2xl').first().textContent().catch(() => '0');
    const deliveredText = await this.page.locator('.text-emerald-600.text-2xl').first().textContent().catch(() => '0');
    const inTransitText = await this.page.locator('.text-violet-600.text-2xl').first().textContent().catch(() => '0');
    
    return {
      total: parseInt(totalText || '0', 10),
      delivered: parseInt(deliveredText || '0', 10),
      inTransit: parseInt(inTransitText || '0', 10),
    };
  }

  /**
   * Advance a shipment through all states until delivered
   * Useful for setup in tests
   */
  async advanceToDelivered(trackingNumber: string): Promise<void> {
    // Status flow: PAYMENT_CONFIRMED → PROCESSING → READY_FOR_PICKUP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
    const maxIterations = 6;
    
    for (let i = 0; i < maxIterations; i++) {
      const status = await this.getShipmentStatus(trackingNumber);
      console.log(`Current status: ${status}`);
      
      if (status.includes('Entregado') || status.includes('DELIVERED')) {
        break;
      }
      
      // Assign truck if needed (after PROCESSING)
      if (status.includes('Procesando') || status.includes('PROCESSING')) {
        const hasTruck = await this.hasTruckAssigned(trackingNumber);
        if (!hasTruck) {
          await this.assignTruckToShipment(trackingNumber, 'ABC-123');
        }
      }
      
      await this.advanceShipmentStatus(trackingNumber);
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Get available trucks from the dropdown
   */
  async getAvailableTrucks(): Promise<string[]> {
    // First click assign on any card to open dropdown
    const firstAssignButton = this.assignTruckButton.first();
    const isVisible = await firstAssignButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      return [];
    }
    
    await firstAssignButton.click();
    await this.page.waitForTimeout(500);
    
    const truckButtons = this.page.locator('.absolute.bg-white button');
    const count = await truckButtons.count();
    
    const trucks: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await truckButtons.nth(i).locator('p.font-bold').textContent();
      if (text) trucks.push(text.trim());
    }
    
    // Close dropdown by clicking elsewhere
    await this.page.click('body');
    
    return trucks;
  }
}
