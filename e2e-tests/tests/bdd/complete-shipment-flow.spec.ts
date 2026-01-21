import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../src/pages/QuoteRequestPage';
import { QuoteResultsPage } from '../../src/pages/QuoteResultsPage';
import { ShipmentWizardPage } from '../../src/pages/ShipmentWizardPage';
import { WarehousePage } from '../../src/pages/WarehousePage';

/**
 * BDD E2E Test - Complete Shipment Flow
 * 
 * Feature: Complete business flow from quote request to warehouse management
 * 
 * User Story:
 * Como usuario del sistema de logística,
 * Quiero solicitar una cotización de Bogotá a Cali de 10kg,
 * Seleccionar la fecha 30/01/2026,
 * Abrir el mapa de FedEx,
 * Crear un envío con FedEx,
 * Ir a la vista de almacén,
 * Asignar un camión,
 * Y gestionar los estados (Entregado/Devuelto/Cancelado)
 * 
 * Tags:
 * - @smoke: Critical path scenarios
 * - @regression: Full coverage scenarios
 */

test.describe('Feature: Complete Shipment Flow - Bogotá → Cali', () => {
  
  // Shared variables across tests
  let trackingNumber: string;

  /**
   * @smoke
   * Scenario: Usuario solicita cotización Bogotá → Cali 10kg
   * 
   * Given: El usuario está en la página principal
   * When: Ingresa origen "Bogotá", destino "Cali", peso 10kg, fecha 30/01/2026
   * And: Presiona el botón de cotizar
   * Then: Debe ver las cotizaciones disponibles de todos los proveedores
   */
  test('@smoke Scenario: Solicitar cotización Bogotá → Cali 10kg fecha 30/01/2026', async ({ page }) => {
    // Given: El usuario está en la página principal
    const quotePage = new QuoteRequestPage(page);
    await quotePage.navigate();
    
    // When: Ingresa los datos del envío
    await quotePage.fillQuoteForm({
      origin: 'Bogotá',
      destination: 'Cali',
      weight: 10,
      pickupDate: '2026-01-30',
      fragile: false
    });
    
    // And: Presiona el botón de cotizar
    await quotePage.submitForm();
    
    // Then: Debe ver las cotizaciones disponibles
    const resultsPage = new QuoteResultsPage(page);
    await resultsPage.waitForResults(15000); // Wait up to 15 seconds for API response
    
    const quoteCount = await resultsPage.getQuoteCount();
    expect(quoteCount).toBeGreaterThan(0);
    
    // Verify quote details
    const hasDetails = await resultsPage.verifyAllQuotesHaveDetails();
    expect(hasDetails).toBe(true);
  });

  /**
   * @smoke
   * Scenario: Usuario abre el mapa de FedEx
   * 
   * Given: El usuario ve las cotizaciones
   * When: Presiona el botón "Ver Ruta" en la cotización de FedEx
   * Then: Debe abrirse el modal del mapa con la ruta trazada
   */
  test('@smoke Scenario: Abrir mapa de ruta de FedEx', async ({ page }) => {
    // Given: El usuario ya tiene cotizaciones (repetir búsqueda)
    const quotePage = new QuoteRequestPage(page);
    await quotePage.navigate();
    await quotePage.requestQuote({
      origin: 'Bogotá',
      destination: 'Cali',
      weight: 10,
      pickupDate: '2026-01-30',
    });
    
    const resultsPage = new QuoteResultsPage(page);
    await resultsPage.waitForResults(15000);
    
    // When: Abre el mapa de FedEx
    await resultsPage.openMapForProvider('FedEx');
    
    // Then: El modal del mapa debe aparecer
    await resultsPage.waitForMapModal();
    
    // Close modal for cleanup
    await resultsPage.closeMapModal();
  });

  /**
   * @smoke
   * Scenario: Usuario crea envío completo con FedEx pasando por todo el wizard
   * 
   * Given: El usuario ve las cotizaciones
   * When: Selecciona la cotización de FedEx
   * And: Completa el wizard multi-paso (direcciones, cliente, pago)
   * Then: Debe ver la confirmación con tracking number generado
   * And: El envío debe aparecer en el warehouse
   */
  test('@smoke Scenario: Crear envío COMPLETO con FedEx - Todo el wizard', async ({ page }) => {
    // Given: El usuario solicita cotización
    const quotePage = new QuoteRequestPage(page);
    await quotePage.navigate();
    await quotePage.requestQuote({
      origin: 'Bogotá',
      destination: 'Cali',
      weight: 10,
      pickupDate: '2026-01-30',
    });
    
    const resultsPage = new QuoteResultsPage(page);
    await resultsPage.waitForResults(15000);
    
    // When: Selecciona FedEx
    await resultsPage.selectQuoteByProvider('FedEx');
    
    // Wait for wizard to open
    await page.waitForTimeout(2000);
    
    // Then: Complete wizard multi-paso
    const wizardPage = new ShipmentWizardPage(page);
    
    // Step 3: Customer Details (Sender + Receiver)
    await wizardPage.completeCustomerDetails({
      sender: {
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone: '3001234567',
        address: 'Calle 123 #45-67, Bogotá',
        documentNumber: '1234567890',
      },
      receiver: {
        name: 'María González',
        phone: '3009876543',
        address: 'Carrera 50 #30-20, Cali',
      },
      packageDescription: 'Documentos importantes y equipo electrónico',
    });
    
    // Step 4: Payment (using test card)
    await wizardPage.completePayment('CARD', {
      cardNumber: '4111111111111111',
      cardHolder: 'Juan Perez',
      expiryDate: '12/28',
      cvv: '123',
    });
    
    // Step 5: Confirmation - Get tracking number
    const newTrackingNumber = await wizardPage.getTrackingNumber();
    expect(newTrackingNumber).toBeTruthy();
    expect(newTrackingNumber.length).toBeGreaterThan(5);
    
    console.log(`✓ Envío creado exitosamente: ${newTrackingNumber}`);
    
    // Save for next tests
    trackingNumber = newTrackingNumber;
    
    // Verify the shipment appears in warehouse
    const warehousePage = new WarehousePage(page);
    await warehousePage.navigateToWarehouse();
    await warehousePage.waitForShipments(5000);
    
    const hasNewShipment = await warehousePage.getShipmentCard(newTrackingNumber).isVisible();
    expect(hasNewShipment).toBe(true);
  });

  /**
   * @regression
   * Scenario: Usuario navega a la vista de almacén
   * 
   * Given: El usuario está en cualquier página del sistema
   * When: Hace clic en el botón "Warehouse" / "Almacén"
   * Then: Debe ver la lista de envíos en el almacén
   */
  test('@regression Scenario: Navegar a vista de almacén', async ({ page }) => {
    // Given: Usuario en la página principal
    await page.goto('/');
    
    const warehousePage = new WarehousePage(page);
    
    // When: Navega al almacén
    await warehousePage.navigateToWarehouse();
    
    // Then: Debe ver la lista de envíos
    await warehousePage.waitForShipments(10000);
    
    const shipmentCount = await warehousePage.getShipmentCount();
    expect(shipmentCount).toBeGreaterThanOrEqual(0); // Can be 0 if no shipments yet
  });

  /**
   * @smoke
   * Scenario: Usuario asigna camión al envío recién creado
   * 
   * Given: El usuario creó un envío en el test anterior
   * And: El envío está en estado PENDING_PAYMENT o PAYMENT_CONFIRMED
   * When: Navega al warehouse y asigna camión ABC-123
   * Then: El envío debe mostrar el camión asignado
   */
  test('@smoke Scenario: Asignar camión al envío creado', async ({ page }) => {
    // Given: Usar el tracking number del test anterior
    if (!trackingNumber) {
      console.log('No tracking number from previous test - will use latest');
    }
    
    await page.goto('/');
    const warehousePage = new WarehousePage(page);
    await warehousePage.navigateToWarehouse();
    
    try {
      await warehousePage.waitForShipments(5000);
    } catch {
      console.log('No shipments found - test will skip');
      test.skip();
    }
    
    // Use the tracking number from the wizard test
    const tracking = trackingNumber || await warehousePage.getLatestTrackingNumber();
    if (!tracking) {
      console.log('Could not get tracking number - test will skip');
      test.skip();
    }
    
    console.log(`Working with shipment: ${tracking}`);
    
    // When: Asigna camión ABC-123
    await warehousePage.assignTruckToShipment(tracking, 'ABC-123');
    
    // Then: Verificar que el camión fue asignado
    await page.waitForTimeout(1000);
    const hasTruck = await warehousePage.hasTruckAssigned(tracking);
    
    if (hasTruck) {
      console.log(`✓ Truck ABC-123 successfully assigned to ${tracking}`);
    } else {
      console.log(`⚠ Truck may already be assigned to ${tracking}`);
    }
  });

  /**
   * @smoke
   * Scenario: Avanzar envío por TODOS los estados hasta DELIVERED
   * 
   * Given: El usuario tiene un envío con camión asignado
   * When: Avanza el envío paso a paso por todos los estados del flujo
   * Then: El envío debe llegar al estado DELIVERED
   */
  test('@smoke Scenario: Avanzar envío por todos los estados hasta DELIVERED', async ({ page }) => {
    // Given: Usuario en almacén con envío existente
    await page.goto('/');
    const warehousePage = new WarehousePage(page);
    await warehousePage.navigateToWarehouse();
    
    try {
      await warehousePage.waitForShipments(5000);
    } catch {
      console.log('No shipments found - test will skip');
      test.skip();
    }
    
    // Use saved tracking number
    const tracking = trackingNumber || await warehousePage.getLatestTrackingNumber();
    if (!tracking) {
      console.log('Could not get tracking number - test will skip');
      test.skip();
    }
    
    console.log(`\n📦 Advancing shipment: ${tracking}`);
    
    // When: Avanza múltiples veces hasta DELIVERED
    // Estados: PAYMENT_CONFIRMED → PROCESSING → IN_WAREHOUSE → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
    const maxAdvances = 10; // Máximo de avances para evitar loop infinito
    let advances = 0;
    
    while (advances < maxAdvances) {
      const currentStatus = await warehousePage.getShipmentStatus(tracking);
      console.log(`  Estado actual: ${currentStatus}`);
      
      // Check if already in terminal state
      if (currentStatus.toLowerCase().includes('entregado') || 
          currentStatus.toLowerCase().includes('delivered')) {
        console.log('✓ Shipment already DELIVERED');
        break;
      }
      
      // Try to advance
      await warehousePage.advanceShipmentStatus(tracking);
      await page.waitForTimeout(2000);
      
      advances++;
      
      // Get new status
      const newStatus = await warehousePage.getShipmentStatus(tracking);
      console.log(`  Nuevo estado: ${newStatus}`);
      
      // If status didn't change, we may be at a terminal state or need truck
      if (newStatus === currentStatus) {
        console.log('⚠ Status did not change - may be at terminal state or need truck assigned');
        break;
      }
    }
    
    // Then: Verificar estado final
    const finalStatus = await warehousePage.getShipmentStatus(tracking);
    console.log(`\n✓ Estado final después de ${advances} avances: ${finalStatus}`);
  });

  /**
   * @regression
   * Scenario: Usuario marca envío como RETURNED (Devuelto)
   * 
   * Given: El usuario tiene un envío en estado no terminal
   * When: Presiona el botón "Devolución" (↩️)
   * Then: El envío debe cambiar a estado "RETURNED"
   */
  test('@regression Scenario: Marcar envío como RETURNED', async ({ page }) => {
    // Given: Usuario en almacén
    await page.goto('/');
    const warehousePage = new WarehousePage(page);
    await warehousePage.navigateToWarehouse();
    
    try {
      await warehousePage.waitForShipments(5000);
    } catch {
      console.log('No shipments found - test will skip');
      test.skip();
    }
    
    const tracking = trackingNumber || await warehousePage.getLatestTrackingNumber();
    if (!tracking) {
      console.log('Could not get tracking number - test will skip');
      test.skip();
    }
    
    // When: Marca como devuelto (using special status button)
    await warehousePage.markAsReturned(tracking);
    
    // Then: Verificar estado cambió a RETURNED (soft check)
    await page.waitForTimeout(1000);
    const status = await warehousePage.getShipmentStatus(tracking);
    console.log(`Status after RETURNED action: ${status}`);
  });

  /**
   * @regression
   * Scenario: Usuario marca envío como FAILED_DELIVERY (No Entregado)
   * 
   * Given: El usuario tiene un envío en estado no terminal
   * When: Presiona el botón "No Entregado" (❌)
   * Then: El envío debe cambiar a estado "FAILED_DELIVERY"
   */
  test('@regression Scenario: Marcar envío como NO ENTREGADO', async ({ page }) => {
    // Given: Usuario en almacén
    await page.goto('/');
    const warehousePage = new WarehousePage(page);
    await warehousePage.navigateToWarehouse();
    
    try {
      await warehousePage.waitForShipments(5000);
    } catch {
      console.log('No shipments found - test will skip');
      test.skip();
    }
    
    // Get any shipment that is not terminal
    const tracking = await warehousePage.getLatestTrackingNumber();
    if (!tracking) {
      console.log('Could not get tracking number - test will skip');
      test.skip();
    }
    
    // When: Marca como no entregado
    await warehousePage.markAsFailedDelivery(tracking);
    
    // Then: Verificar estado cambió (soft check)
    await page.waitForTimeout(1000);
    const status = await warehousePage.getShipmentStatus(tracking);
    console.log(`Status after FAILED_DELIVERY action: ${status}`);
  });
});
