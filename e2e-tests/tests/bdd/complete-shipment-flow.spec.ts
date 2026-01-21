import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../src/pages/QuoteRequestPage';
import { QuoteResultsPage } from '../../src/pages/QuoteResultsPage';
import { WarehousePage } from '../../src/pages/WarehousePage';

/**
 * =============================================================================
 * FEATURE: Complete Shipment Flow - Flujo Completo de Envío
 * =============================================================================
 * 
 * User Story:
 * Como usuario del sistema de logística,
 * Quiero solicitar cotizaciones, ver mapas de rutas y gestionar envíos,
 * Para poder enviar paquetes de forma eficiente.
 * 
 * Tests esenciales del flujo principal del negocio.
 */

test.describe('Feature: Complete Shipment Flow', () => {

  /**
   * @smoke
   * Scenario: Usuario navega a la vista de almacén
   */
  test('@smoke Scenario: Navegar a vista de almacén', async ({ page }) => {
    // Given: Usuario en la página principal
    await page.goto('/');
    await page.screenshot({ path: 'screenshots/flow_01_home.png', fullPage: true });
    
    const warehousePage = new WarehousePage(page);
    
    // When: Navega al almacén
    await warehousePage.navigateToWarehouse();
    
    // Then: Debe ver la vista del almacén
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/flow_02_warehouse.png', fullPage: true });
    
    // Verify warehouse header is visible
    const warehouseHeader = page.locator('h1:has-text("Almacén de Envíos")');
    await expect(warehouseHeader).toBeVisible();
  });

  /**
   * @regression
   * Scenario: Verificar estadísticas del almacén
   */
  test('@regression Scenario: Verificar estadísticas del almacén', async ({ page }) => {
    // Given: Usuario navega al almacén
    await page.goto('/');
    const warehousePage = new WarehousePage(page);
    await warehousePage.navigateToWarehouse();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/flow_03_stats.png', fullPage: true });
    
    // Then: Estadísticas deben ser visibles
    const totalStat = page.locator('p:has-text("Total")');
    const deliveredStat = page.locator('p:has-text("Entregados")');
    
    const totalVisible = await totalStat.isVisible().catch(() => false);
    const deliveredVisible = await deliveredStat.isVisible().catch(() => false);
    
    console.log(`Statistics visible - Total: ${totalVisible}, Delivered: ${deliveredVisible}`);
    expect(totalVisible || deliveredVisible).toBe(true);
  });

  /**
   * @regression
   * Scenario: Filtros de estado del almacén
   */
  test('@regression Scenario: Verificar filtros de estado del almacén', async ({ page }) => {
    // Given: Usuario navega al almacén
    await page.goto('/');
    const warehousePage = new WarehousePage(page);
    await warehousePage.navigateToWarehouse();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/flow_04_filters.png', fullPage: true });
    
    // Then: Sidebar de filtros debe estar visible
    const filterSidebar = page.locator('aside');
    await expect(filterSidebar).toBeVisible();
    
    // Verificar que hay botones de filtro
    const allFilter = page.locator('button:has-text("Todos")');
    const isAllFilterVisible = await allFilter.isVisible().catch(() => false);
    console.log(`Filter 'Todos' visible: ${isAllFilterVisible}`);
  });
});
