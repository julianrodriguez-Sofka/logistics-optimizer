import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * WarehousePage - Page Object para la vista de almacén
 * Maneja la interacción con envíos, asignación de camiones y cambios de estado
 * 
 * Selectores basados en logistics-front/src/components/WarehouseView.tsx
 */
export class WarehousePage extends BasePage {
  // Main elements
  readonly warehouseButton: Locator;
  readonly searchInput: Locator;
  readonly shipmentCards: Locator;
  
  // Status filters (sidebar)
  readonly statusFilter: Locator;
  readonly allStatusFilter: Locator;
  
  // Shipment actions
  readonly advanceStatusButton: Locator;
  readonly assignTruckButton: Locator;
  readonly viewHistoryButton: Locator;
  
  // Special status buttons
  readonly failedDeliveryButton: Locator;
  readonly returnedButton: Locator;
  
  // Truck assignment
  readonly truckSelector: Locator;
  readonly removeTruckButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Navigation - Sidebar.tsx has "Almacén" as the label for warehouse navigation
    this.warehouseButton = page.locator('button:has-text("Almacén")');
    
    // Search & filters
    this.searchInput = page.locator('input[placeholder*="Buscar" i], input[type="search"]');
    this.statusFilter = page.locator('.status-filter, aside');
    this.allStatusFilter = page.locator('button:has-text("Todos"), button:has-text("ALL")');
    
    // Shipment cards - WarehouseView.tsx ShipmentCard component
    // class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden..."
    this.shipmentCards = page.locator('.bg-white.rounded-xl.shadow-lg');
    
    // Actions inside cards
    this.advanceStatusButton = page.locator('button:has-text("Avanzar")');
    this.assignTruckButton = page.locator('button:has-text("Asignar Camión")');
    this.viewHistoryButton = page.locator('button:has-text("Ver historial")');
    
    // Special status buttons
    this.failedDeliveryButton = page.locator('button:has-text("No Entregado")');
    this.returnedButton = page.locator('button:has-text("Devolución")');
    
    // Truck management
    this.truckSelector = page.locator('.absolute.mt-2.bg-white.shadow-lg.rounded-lg');
    this.removeTruckButton = page.locator('button:has-text("Quitar")');
  }

  /**
   * Navigate to warehouse view from any page
   */
  async navigateToWarehouse(): Promise<void> {
    await this.click(this.warehouseButton);
    await this.page.waitForLoadState('domcontentloaded');
    await this.takeScreenshot('14_warehouse_view_loaded');
  }

  /**
   * Wait for shipment cards to load
   * Returns true if shipments were found, false if warehouse is empty
   */
  async waitForShipments(timeout: number = 10000): Promise<boolean> {
    try {
      // First wait for the page to load
      await this.page.waitForLoadState('networkidle', { timeout: timeout });
      
      // Check if there are shipments or if we see "No hay envíos"
      const noShipmentsMessage = this.page.locator('text="No hay envíos"');
      const hasNoShipments = await noShipmentsMessage.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasNoShipments) {
        await this.takeScreenshot('15_warehouse_empty');
        return false;
      }
      
      // Wait for shipment cards
      await this.shipmentCards.first().waitFor({ state: 'visible', timeout });
      await this.takeScreenshot('15_shipments_loaded');
      return true;
    } catch {
      // Could be empty warehouse or slow loading
      await this.takeScreenshot('15_shipments_timeout');
      return false;
    }
  }

  /**
   * Get count of visible shipment cards
   */
  async getShipmentCount(): Promise<number> {
    return await this.shipmentCards.count();
  }

  /**
   * Find shipment card by tracking number
   */
  getShipmentCard(trackingNumber: string): Locator {
    // ShipmentCard contains tracking number in p.font-bold.text-gray-800.text-sm
    return this.page.locator(`div.bg-white.rounded-xl.shadow-lg:has-text("${trackingNumber}")`).first();
  }

  /**
   * Assign truck to specific shipment
   */
  async assignTruckToShipment(trackingNumber: string, truckPlate: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    await this.takeScreenshot(`16_before_assign_truck_${trackingNumber}`);
    
    // Check if assign button exists (only appears if no truck assigned)
    const assignButton = card.locator('button:has-text("Asignar Camión")').first();
    const isVisible = await assignButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log(`Truck already assigned or button not available for ${trackingNumber}`);
      return;
    }
    
    await assignButton.click();
    await this.page.waitForTimeout(500);
    
    // Select truck from dropdown
    const truckOption = this.page.locator(`button:has-text("${truckPlate}")`).first();
    await truckOption.click();
    await this.page.waitForTimeout(1000);
    
    await this.takeScreenshot(`17_truck_assigned_${trackingNumber}`);
  }

  /**
   * Advance shipment status (next in flow)
   */
  async advanceShipmentStatus(trackingNumber: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const advanceButton = card.locator('button:has-text("Avanzar")').first();
    const isVisible = await advanceButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log(`Advance button not available for ${trackingNumber} - may need truck assigned first`);
      return;
    }
    
    await advanceButton.click();
    await this.page.waitForTimeout(2000); // Wait for API call
    
    await this.takeScreenshot(`18_status_advanced_${trackingNumber}`);
  }

  /**
   * Mark shipment as DELIVERED (special status)
   */
  async markAsDelivered(trackingNumber: string): Promise<void> {
    // Need to advance through all states until OUT_FOR_DELIVERY, then advance to DELIVERED
    await this.advanceShipmentStatus(trackingNumber);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Mark shipment as FAILED_DELIVERY (special button)
   */
  async markAsFailedDelivery(trackingNumber: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const failedButton = card.locator('button:has-text("No Entregado")').first();
    const isVisible = await failedButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log(`Failed delivery button not available for ${trackingNumber} - shipment may be in terminal state`);
      return;
    }
    
    await failedButton.click();
    await this.page.waitForTimeout(2000);
    
    await this.takeScreenshot(`19_marked_as_failed_${trackingNumber}`);
  }

  /**
   * Mark shipment as RETURNED (special button)
   */
  async markAsReturned(trackingNumber: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    
    const returnedButton = card.locator('button:has-text("Devolución")').first();
    const isVisible = await returnedButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log(`Returned button not available for ${trackingNumber} - shipment may be in terminal state`);
      return;
    }
    
    await returnedButton.click();
    await this.page.waitForTimeout(2000);
    
    await this.takeScreenshot(`20_marked_as_returned_${trackingNumber}`);
  }

  /**
   * Verify shipment has truck assigned
   */
  async hasTruckAssigned(trackingNumber: string): Promise<boolean> {
    const card = this.getShipmentCard(trackingNumber);
    const truckInfo = card.locator('p:has-text("🚚 Camión Asignado")');
    return await this.isVisible(truckInfo);
  }

  /**
   * Get current status of a shipment
   */
  async getShipmentStatus(trackingNumber: string): Promise<string> {
    const card = this.getShipmentCard(trackingNumber);
    // StatusBadge in WarehouseView.tsx uses "px-3 py-1 rounded-full text-xs font-semibold"
    const statusBadge = card.locator('span.rounded-full.text-xs.font-semibold').first();
    return await this.getText(statusBadge);
  }

  /**
   * Search for shipments
   */
  async searchShipments(query: string): Promise<void> {
    await this.fill(this.searchInput, query);
    await this.page.waitForTimeout(500); // Debounce
    await this.takeScreenshot(`21_search_${query}`);
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: string): Promise<void> {
    const statusButton = this.page.locator(`aside button:has-text("${status}")`).first();
    await statusButton.click();
    await this.page.waitForTimeout(500);
    await this.takeScreenshot(`22_filter_${status}`);
  }

  /**
   * View shipment history
   */
  async viewHistory(trackingNumber: string): Promise<void> {
    const card = this.getShipmentCard(trackingNumber);
    const historyButton = card.locator('button:has-text("Ver historial")').first();
    await historyButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot(`23_history_modal_${trackingNumber}`);
  }

  /**
   * Close history modal
   */
  async closeHistoryModal(): Promise<void> {
    const closeButton = this.page.locator('button:has-text("✕")').first();
    await closeButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get latest tracking number from the list (newest shipment)
   */
  async getLatestTrackingNumber(): Promise<string> {
    const firstCard = this.shipmentCards.first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });
    
    // Tracking number is in p.font-bold.text-gray-800.text-sm in the card header
    const trackingText = await firstCard.locator('p.font-bold.text-gray-800.text-sm').first().textContent();
    return trackingText?.trim() || '';
  }
}
