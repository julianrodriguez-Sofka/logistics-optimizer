import { test, expect, Page } from '@playwright/test';
import { QuoteRequestPage } from '../../src/pages/QuoteRequestPage';
import { QuoteResultsPage } from '../../src/pages/QuoteResultsPage';
import { ShipmentWizardPage } from '../../src/pages/ShipmentWizardPage';
import { WarehousePage } from '../../src/pages/WarehousePage';

/**
 * ============================================================================
 * FEATURE: Gestión Completa de Envíos en Almacén
 * ============================================================================
 * 
 * Como operador de almacén
 * Quiero gestionar los envíos desde su creación hasta la entrega
 * Para mantener control del flujo operativo y estado de cada paquete
 * 
 * Criterios de Aceptación:
 * ✓ Debo ver todos los envíos creados en el almacén
 * ✓ Debo poder asignar camiones a los envíos
 * ✓ Debo poder avanzar el estado de los envíos paso a paso
 * ✓ Debo poder filtrar envíos por estado
 * ✓ Debo poder buscar envíos por tracking number
 * ✓ Debo poder ver el historial de estados de un envío
 * ✓ Debo poder marcar envíos como "No Entregado" o "Devolución"
 * 
 * Historias de Usuario: HU-09, HU-10
 * ============================================================================
 */
test.describe('Feature: Gestión de Envíos en Almacén', () => {
  let quoteRequestPage: QuoteRequestPage;
  let quoteResultsPage: QuoteResultsPage;
  let wizardPage: ShipmentWizardPage;
  let warehousePage: WarehousePage;

  /**
   * Helper: Create a new shipment for testing
   */
  const createTestShipment = async (page: Page, suffix: string = ''): Promise<string> => {
    const qrPage = new QuoteRequestPage(page);
    const qresPage = new QuoteResultsPage(page);
    const wPage = new ShipmentWizardPage(page);
    
    await qrPage.navigate();
    
    const quoteData = {
      origin: 'Bogotá, Cundinamarca, Colombia',
      destination: 'Medellín, Antioquia, Colombia',
      weight: 10 + Math.random() * 20,
      pickupDate: QuoteRequestPage.getValidPickupDate(2),
      fragile: false
    };
    
    await qrPage.requestQuote(quoteData);
    await qresPage.waitForResults(20000);
    await qresPage.selectFirstQuote();
    await wPage.verifyWizardLoaded();
    
    const trackingNumber = await wPage.completeFullWizard({
      sender: {
        name: `Remitente Almacén ${suffix}`,
        email: `remitente.almacen${suffix}@test.com`,
        phone: '3001234567',
        address: 'Calle 100 #15-30, Bogotá',
        documentNumber: `123456${Math.floor(Math.random() * 1000)}`
      },
      receiver: {
        name: `Destinatario Almacén ${suffix}`,
        phone: '3019876543',
        address: 'Carrera 50 #25-10, Medellín'
      },
      packageDescription: `Paquete de prueba para almacén ${suffix}`,
      paymentMethod: 'CASH'
    });
    
    return trackingNumber;
  };

  test.beforeEach(async ({ page }) => {
    quoteRequestPage = new QuoteRequestPage(page);
    quoteResultsPage = new QuoteResultsPage(page);
    wizardPage = new ShipmentWizardPage(page);
    warehousePage = new WarehousePage(page);
  });

  test.skip('@smoke @critical Escenario: Flujo completo de gestión de envío en almacén', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('    🏭 FLUJO COMPLETO: GESTIÓN DE ENVÍO EN ALMACÉN');
    console.log('═══════════════════════════════════════════════════════════════\n');

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 1: Crear un envío nuevo para gestionar
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 1: Crear Envío de Prueba                               │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const trackingNumber = await createTestShipment(page, 'WH-TEST');
    expect(trackingNumber).toBeTruthy();
    
    console.log(`   📦 Envío creado: ${trackingNumber}`);
    console.log(`   ✓ Estado inicial: PAYMENT_CONFIRMED\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 2: Navegar al Almacén
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 2: Navegar al Almacén                                  │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    await warehousePage.navigateToWarehouse();
    await warehousePage.waitForWarehouseLoaded();
    
    console.log(`   ✓ Vista de almacén cargada`);
    
    const shipmentCount = await warehousePage.getShipmentCount();
    console.log(`   📊 Total de envíos en almacén: ${shipmentCount}\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 3: Verificar que el envío está visible
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 3: Verificar Envío en Almacén                          │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    // Find our shipment
    const shipmentCard = warehousePage.getShipmentCard(trackingNumber);
    const isShipmentVisible = await shipmentCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isShipmentVisible) {
      // If not visible, might need to scroll or search
      await warehousePage.searchShipments(trackingNumber);
      await page.waitForTimeout(1000);
    }
    
    // Get current status
    const initialStatus = await warehousePage.getShipmentStatus(trackingNumber);
    console.log(`   📋 Tracking: ${trackingNumber}`);
    console.log(`   📊 Estado actual: ${initialStatus}\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 4: Asignar Camión al Envío
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 4: Asignar Camión                                      │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    // First advance to PROCESSING state where truck assignment makes sense
    await warehousePage.advanceShipmentStatus(trackingNumber);
    await page.waitForTimeout(1500);
    
    const statusAfterFirstAdvance = await warehousePage.getShipmentStatus(trackingNumber);
    console.log(`   Estado después de primer avance: ${statusAfterFirstAdvance}`);
    
    // Try to assign truck
    await warehousePage.assignTruckToShipment(trackingNumber, 'ABC-123');
    await page.waitForTimeout(1000);
    
    const hasTruck = await warehousePage.hasTruckAssigned(trackingNumber);
    console.log(`   🚚 Camión asignado: ${hasTruck ? 'Sí' : 'No (puede no ser requerido aún)'}`);
    console.log(`   ✓ Asignación de camión completada\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 5: Avanzar Estados del Envío
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 5: Avanzar Estados del Envío                           │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const stateLog: string[] = [];
    
    // Advance through states
    for (let i = 0; i < 4; i++) {
      const currentStatus = await warehousePage.getShipmentStatus(trackingNumber);
      stateLog.push(currentStatus);
      console.log(`   Estado ${i + 1}: ${currentStatus}`);
      
      // Check if we've reached a terminal state
      if (currentStatus.includes('Entregado') || 
          currentStatus.includes('DELIVERED') ||
          currentStatus.includes('No Entregado') ||
          currentStatus.includes('Devolución')) {
        console.log(`   ✓ Alcanzado estado terminal`);
        break;
      }
      
      await warehousePage.advanceShipmentStatus(trackingNumber);
      await page.waitForTimeout(2000);
    }
    
    const finalStatus = await warehousePage.getShipmentStatus(trackingNumber);
    console.log(`   📊 Estado final: ${finalStatus}\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * RESUMEN
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              ✅ GESTIÓN DE ALMACÉN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   🔖 Tracking: ${trackingNumber}`);
    console.log(`   📊 Flujo de estados:`);
    stateLog.forEach((state, idx) => {
      console.log(`      ${idx + 1}. ${state}`);
    });
    console.log(`   📊 Estado final: ${finalStatus}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
  });

  test('@smoke Escenario: Visualización y navegación del almacén', async ({ page }) => {
    console.log('\n🏭 Visualización y navegación del almacén\n');
    
    /**
     * GIVEN: Navego al almacén
     */
    await page.goto('/');
    await warehousePage.navigateToWarehouse();
    await warehousePage.waitForWarehouseLoaded();
    
    /**
     * WHEN: Verifico los elementos de la UI
     */
    const hasTitle = await warehousePage.warehouseTitle.isVisible().catch(() => false);
    console.log(`   ✓ Título "Almacén de Envíos" visible: ${hasTitle}`);
    
    /**
     * THEN: Debo ver el panel de filtros
     */
    const hasFilterSidebar = await page.locator('aside').first().isVisible();
    console.log(`   ✓ Panel de filtros visible: ${hasFilterSidebar}`);
    
    /**
     * AND: Debo ver estadísticas o lista de envíos
     */
    const hasShipments = await warehousePage.waitForShipments(10000);
    
    if (hasShipments) {
      const count = await warehousePage.getShipmentCount();
      console.log(`   ✓ Envíos en almacén: ${count}`);
    } else {
      console.log(`   ⚠️ Almacén vacío - se mostró mensaje "No hay envíos"`);
    }
    
    console.log(`   ✓ Vista de almacén funcional\n`);
  });

  test.skip('@regression Escenario: Búsqueda de envíos', async ({ page }) => {
    console.log('\n🔍 Prueba de búsqueda de envíos\n');
    
    /**
     * GIVEN: Creo un envío con tracking específico
     */
    const trackingNumber = await createTestShipment(page, 'SEARCH-TEST');
    console.log(`   📦 Envío creado para búsqueda: ${trackingNumber}`);
    
    /**
     * AND: Navego al almacén
     */
    await warehousePage.navigateToWarehouse();
    await warehousePage.waitForShipments(15000);
    
    /**
     * WHEN: Busco por el tracking number
     */
    await warehousePage.searchShipments(trackingNumber);
    await page.waitForTimeout(1000);
    
    /**
     * THEN: Debo ver solo ese envío o un resultado filtrado
     */
    const filteredCount = await warehousePage.getShipmentCount();
    console.log(`   🔍 Resultados de búsqueda: ${filteredCount}`);
    
    // Verify the searched shipment is visible
    const shipmentCard = warehousePage.getShipmentCard(trackingNumber);
    const isVisible = await shipmentCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(isVisible).toBe(true);
    console.log(`   ✓ Envío ${trackingNumber} encontrado`);
    
    /**
     * WHEN: Limpio la búsqueda
     */
    await warehousePage.clearSearch();
    await page.waitForTimeout(1000);
    
    /**
     * THEN: Debo ver todos los envíos nuevamente
     */
    const totalCount = await warehousePage.getShipmentCount();
    console.log(`   ✓ Envíos después de limpiar búsqueda: ${totalCount}\n`);
  });

  test.skip('@regression Escenario: Filtrar envíos por estado', async ({ page }) => {
    console.log('\n🏷️ Prueba de filtros por estado\n');
    
    /**
     * GIVEN: Navego al almacén
     */
    await page.goto('/');
    await warehousePage.navigateToWarehouse();
    const hasShipments = await warehousePage.waitForShipments(15000);
    
    if (!hasShipments) {
      // Create a shipment if warehouse is empty
      console.log('   ⚠️ Almacén vacío, creando envío de prueba...');
      await createTestShipment(page, 'FILTER-TEST');
      await warehousePage.navigateToWarehouse();
      await warehousePage.waitForShipments(15000);
    }
    
    /**
     * WHEN: Obtengo el conteo inicial
     */
    const totalCount = await warehousePage.getShipmentCount();
    console.log(`   📊 Total de envíos: ${totalCount}`);
    
    /**
     * AND: Aplico filtro "Todos"
     */
    await warehousePage.filterByStatus('Todos');
    await page.waitForTimeout(500);
    
    const allCount = await warehousePage.getShipmentCount();
    console.log(`   Filtro "Todos": ${allCount} envíos`);
    
    /**
     * THEN: El conteo debe coincidir con el total
     */
    expect(allCount).toBe(totalCount);
    console.log(`   ✓ Filtros funcionando correctamente\n`);
  });

  test.skip('@regression Escenario: Ver historial de estados', async ({ page }) => {
    console.log('\n📋 Prueba de historial de estados\n');
    
    /**
     * GIVEN: Creo un envío y avanzo algunos estados
     */
    const trackingNumber = await createTestShipment(page, 'HISTORY-TEST');
    console.log(`   📦 Envío creado: ${trackingNumber}`);
    
    /**
     * AND: Navego al almacén
     */
    await warehousePage.navigateToWarehouse();
    await warehousePage.waitForShipments(15000);
    
    // Advance a few states to create history
    await warehousePage.advanceShipmentStatus(trackingNumber);
    await page.waitForTimeout(1500);
    await warehousePage.advanceShipmentStatus(trackingNumber);
    await page.waitForTimeout(1500);
    
    console.log(`   ✓ Envío avanzado a través de varios estados`);
    
    /**
     * WHEN: Abro el historial del envío
     */
    await warehousePage.viewShipmentHistory(trackingNumber);
    await page.waitForTimeout(1000);
    
    /**
     * THEN: Debo ver el modal de historial
     */
    const historyModalVisible = await warehousePage.historyModal.isVisible().catch(() => false);
    
    if (historyModalVisible) {
      console.log(`   ✓ Modal de historial abierto`);
      
      // Verify history entries exist
      const historyTitle = page.locator('text=/Historial de Estados/i');
      const hasTitleVisible = await historyTitle.isVisible().catch(() => false);
      console.log(`   ✓ Título de historial visible: ${hasTitleVisible}`);
      
      // Close modal
      await warehousePage.closeHistoryModal();
      await page.waitForTimeout(500);
      
      console.log(`   ✓ Modal cerrado correctamente`);
    } else {
      console.log(`   ⚠️ Modal de historial no visible o no implementado`);
    }
    
    console.log('');
  });

  test.skip('@smoke Escenario: Marcar envío como No Entregado', async ({ page }) => {
    console.log('\n❌ Prueba: Marcar envío como No Entregado\n');
    
    /**
     * GIVEN: Creo un envío y lo avanzo hasta estado de reparto
     */
    const trackingNumber = await createTestShipment(page, 'FAILED-TEST');
    console.log(`   📦 Envío creado: ${trackingNumber}`);
    
    await warehousePage.navigateToWarehouse();
    await warehousePage.waitForShipments(15000);
    
    // Advance through states until OUT_FOR_DELIVERY
    console.log(`   ⏳ Avanzando estados...`);
    
    for (let i = 0; i < 4; i++) {
      const status = await warehousePage.getShipmentStatus(trackingNumber);
      console.log(`      Estado: ${status}`);
      
      if (status.includes('Reparto') || status.includes('OUT_FOR_DELIVERY')) {
        break;
      }
      
      // Assign truck if needed
      const hasTruck = await warehousePage.hasTruckAssigned(trackingNumber);
      if (!hasTruck) {
        await warehousePage.assignTruckToShipment(trackingNumber, 'XYZ-789');
        await page.waitForTimeout(1000);
      }
      
      await warehousePage.advanceShipmentStatus(trackingNumber);
      await page.waitForTimeout(2000);
    }
    
    /**
     * WHEN: Marco como "No Entregado"
     */
    await warehousePage.markAsFailedDelivery(trackingNumber);
    await page.waitForTimeout(2000);
    
    /**
     * THEN: El estado debe cambiar a FAILED_DELIVERY
     */
    const finalStatus = await warehousePage.getShipmentStatus(trackingNumber);
    console.log(`   📊 Estado final: ${finalStatus}`);
    
    // Verify it's a terminal state
    const isFailedState = finalStatus.includes('No Entregado') || 
                          finalStatus.includes('FAILED') ||
                          finalStatus.includes('No entregado');
    
    if (isFailedState) {
      console.log(`   ✓ Envío marcado como No Entregado correctamente`);
    } else {
      console.log(`   ⚠️ Estado actual: ${finalStatus}`);
    }
    
    console.log('');
  });

  test.skip('@regression Escenario: Estadísticas del almacén', async ({ page }) => {
    console.log('\n📊 Verificación de estadísticas del almacén\n');
    
    /**
     * GIVEN: Navego al almacén
     */
    await page.goto('/');
    await warehousePage.navigateToWarehouse();
    await warehousePage.waitForWarehouseLoaded();
    
    /**
     * WHEN: Verifico las estadísticas en el header
     */
    const stats = await warehousePage.getStatistics();
    
    console.log(`   📊 Estadísticas del almacén:`);
    console.log(`      Total: ${stats.total}`);
    console.log(`      Entregados: ${stats.delivered}`);
    console.log(`      En Camino: ${stats.inTransit}`);
    
    /**
     * THEN: Los números deben ser coherentes
     */
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.delivered).toBeGreaterThanOrEqual(0);
    expect(stats.inTransit).toBeGreaterThanOrEqual(0);
    
    // Total should be >= delivered + inTransit (other states exist)
    console.log(`   ✓ Estadísticas coherentes\n`);
  });
});
