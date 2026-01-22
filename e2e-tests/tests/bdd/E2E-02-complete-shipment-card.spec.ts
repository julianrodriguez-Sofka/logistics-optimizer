import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../src/pages/QuoteRequestPage';
import { QuoteResultsPage } from '../../src/pages/QuoteResultsPage';
import { ShipmentWizardPage } from '../../src/pages/ShipmentWizardPage';

/**
 * ============================================================================
 * FEATURE: Creación de Envío Completo con Pago por Tarjeta
 * ============================================================================
 * 
 * Como usuario del sistema de logística
 * Quiero crear un envío completo desde la cotización hasta el pago con tarjeta
 * Para reservar mi servicio de envío y recibir un número de tracking
 * 
 * Criterios de Aceptación:
 * ✓ Debo poder solicitar cotizaciones y seleccionar un proveedor
 * ✓ Debo completar los datos del remitente (nombre, email, teléfono, dirección, documento)
 * ✓ Debo completar los datos del destinatario (nombre, teléfono, dirección)
 * ✓ Debo poder ingresar una descripción del paquete (opcional)
 * ✓ Debo seleccionar pago con tarjeta e ingresar datos válidos
 * ✓ El sistema debe validar el número de tarjeta (algoritmo Luhn)
 * ✓ Debo ver una animación de procesamiento de pago
 * ✓ Debo recibir un número de tracking único (formato LOG-XXXXXX)
 * ✓ Debo poder imprimir el comprobante
 * 
 * Historias de Usuario: HU-01, HU-06, HU-08
 * ============================================================================
 */
test.describe('Feature: Creación de Envío con Pago por Tarjeta', () => {
  let quoteRequestPage: QuoteRequestPage;
  let quoteResultsPage: QuoteResultsPage;
  let wizardPage: ShipmentWizardPage;

  test.beforeEach(async ({ page }) => {
    quoteRequestPage = new QuoteRequestPage(page);
    quoteResultsPage = new QuoteResultsPage(page);
    wizardPage = new ShipmentWizardPage(page);
  });

  test('@smoke @critical Escenario: Flujo completo de creación de envío con tarjeta', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('    📦 FLUJO COMPLETO: CREACIÓN DE ENVÍO CON PAGO TARJETA');
    console.log('═══════════════════════════════════════════════════════════════\n');

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 1: Solicitar Cotización
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 1: Solicitar Cotización                                │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    await quoteRequestPage.navigate();
    await quoteRequestPage.verifyPageLoaded();
    
    const quoteData = {
      origin: 'Bogotá, Cundinamarca, Colombia',
      destination: 'Medellín, Antioquia, Colombia',
      weight: 12.5,
      pickupDate: QuoteRequestPage.getValidPickupDate(3),
      fragile: false
    };
    
    console.log(`   Origen: ${quoteData.origin}`);
    console.log(`   Destino: ${quoteData.destination}`);
    console.log(`   Peso: ${quoteData.weight} kg`);
    console.log(`   Fecha recogida: ${quoteData.pickupDate}`);
    
    await quoteRequestPage.requestQuote(quoteData);
    await quoteResultsPage.waitForResults(20000);
    
    const quoteCount = await quoteResultsPage.getQuoteCount();
    expect(quoteCount).toBeGreaterThan(0);
    console.log(`   ✓ ${quoteCount} cotizaciones recibidas\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 2: Seleccionar Cotización
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 2: Seleccionar Cotización                              │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    // Get all quotes to find the cheapest one
    const quotes = await quoteResultsPage.getAllQuotes();
    const selectedQuote = quotes.find(q => q.isCheapest) || quotes[0];
    
    console.log(`   Proveedor seleccionado: ${selectedQuote.provider}`);
    console.log(`   Precio: $${selectedQuote.price.toLocaleString('es-CO')} COP`);
    console.log(`   Tiempo entrega: ${selectedQuote.deliveryDays}`);
    
    if (selectedQuote.isCheapest) console.log(`   💰 Opción más barata`);
    if (selectedQuote.isFastest) console.log(`   ⚡ Opción más rápida`);
    
    await quoteResultsPage.selectQuoteByProvider(selectedQuote.provider);
    
    // Verify we're in the wizard
    await wizardPage.verifyWizardLoaded();
    console.log(`   ✓ Navegado al wizard de creación de envío\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 3: Completar Datos del Remitente
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 3: Completar Datos del Remitente                       │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const senderData = {
      name: 'Carlos Andrés Rodríguez García',
      email: 'carlos.rodriguez@empresa.com',
      phone: '3001234567',
      address: 'Calle 72 #10-34, Barrio Chapinero Alto, Bogotá',
      documentNumber: '1098765432'
    };
    
    console.log(`   Nombre: ${senderData.name}`);
    console.log(`   Email: ${senderData.email}`);
    console.log(`   Teléfono: ${senderData.phone}`);
    console.log(`   Dirección: ${senderData.address}`);
    console.log(`   Documento: ${senderData.documentNumber}`);
    
    await wizardPage.fillSenderDetails(senderData);
    console.log(`   ✓ Datos del remitente completados\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 4: Completar Datos del Destinatario
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 4: Completar Datos del Destinatario                    │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    await wizardPage.navigateToReceiverSection();
    
    const receiverData = {
      name: 'María Fernanda González López',
      phone: '3109876543',
      address: 'Carrera 43A #1-50, El Poblado, Medellín'
    };
    
    console.log(`   Nombre: ${receiverData.name}`);
    console.log(`   Teléfono: ${receiverData.phone}`);
    console.log(`   Dirección: ${receiverData.address}`);
    
    await wizardPage.fillReceiverDetails(receiverData);
    console.log(`   ✓ Datos del destinatario completados\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 5: Descripción del Paquete
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 5: Descripción del Paquete                             │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    await wizardPage.navigateToPackageSection();
    
    const packageDescription = 'Documentos empresariales importantes - Material confidencial de contrato';
    await wizardPage.fillPackageDescription(packageDescription);
    
    console.log(`   Descripción: ${packageDescription}`);
    console.log(`   ✓ Descripción del paquete completada\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 6: Continuar al Pago
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 6: Continuar al Pago                                   │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    await expect(wizardPage.continueToPaymentButton).toBeEnabled({ timeout: 5000 });
    await wizardPage.continueToPaymentButton.click();
    await page.waitForTimeout(2000);
    
    console.log(`   ✓ Navegado a la sección de pago\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 7: Completar Pago con Tarjeta
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 7: Completar Pago con Tarjeta                          │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const cardData = {
      cardNumber: '4242424242424242',
      cardHolder: 'CARLOS RODRIGUEZ',
      expiryDate: '12/28',
      cvv: '123'
    };
    
    console.log(`   Método: 💳 Tarjeta de Crédito`);
    console.log(`   Número: **** **** **** ${cardData.cardNumber.slice(-4)}`);
    console.log(`   Titular: ${cardData.cardHolder}`);
    console.log(`   Expiración: ${cardData.expiryDate}`);
    console.log(`   Monto: $${selectedQuote.price.toLocaleString('es-CO')} COP`);
    console.log(`   ⏳ Procesando pago...`);
    
    // Use the method with the fix for clicking "Continuar" button
    await wizardPage.completeCardPayment(cardData);
    
    console.log(`   ✓ Pago procesado correctamente\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 9: Verificar Confirmación y Tracking
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 8: Verificar Confirmación y Tracking                   │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const isConfirmed = await wizardPage.verifyConfirmationDisplayed();
    expect(isConfirmed).toBe(true);
    
    const trackingNumber = await wizardPage.getTrackingNumber();
    expect(trackingNumber).toBeTruthy();
    expect(trackingNumber).toMatch(/LOG-\d+/);
    
    console.log(`   ✓ Envío creado exitosamente`);
    console.log(`   📦 NÚMERO DE TRACKING: ${trackingNumber}\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 10: Verificar Botón de Comprobante
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 9: Verificar Opciones Post-Creación                    │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const hasInvoiceButton = await wizardPage.downloadInvoiceButton.isVisible();
    const hasNewShipmentButton = await wizardPage.createNewShipmentButton.isVisible();
    
    expect(hasInvoiceButton).toBe(true);
    expect(hasNewShipmentButton).toBe(true);
    
    console.log(`   ✓ Botón "Imprimir Comprobante" disponible`);
    console.log(`   ✓ Botón "Crear Otro Envío" disponible\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * RESUMEN FINAL
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    ✅ FLUJO COMPLETADO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   📍 Ruta: ${quoteData.origin} → ${quoteData.destination}`);
    console.log(`   📦 Peso: ${quoteData.weight} kg`);
    console.log(`   🚚 Proveedor: ${selectedQuote.provider}`);
    console.log(`   💰 Total pagado: $${selectedQuote.price.toLocaleString('es-CO')} COP`);
    console.log(`   💳 Método: Tarjeta de Crédito`);
    console.log(`   👤 Remitente: ${senderData.name}`);
    console.log(`   👥 Destinatario: ${receiverData.name}`);
    console.log(`   🔖 Tracking: ${trackingNumber}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
  });

});

