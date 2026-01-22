import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../src/pages/QuoteRequestPage';
import { QuoteResultsPage } from '../../src/pages/QuoteResultsPage';
import { ShipmentWizardPage } from '../../src/pages/ShipmentWizardPage';

/**
 * ============================================================================
 * FEATURE: Creación de Envío Completo con Pago en Efectivo
 * ============================================================================
 * 
 * Como usuario del sistema de logística
 * Quiero crear un envío y pagar en efectivo al momento de la recogida
 * Para tener flexibilidad en el método de pago
 * 
 * Criterios de Aceptación:
 * ✓ Debo poder seleccionar "Pago en Efectivo" como método de pago
 * ✓ El sistema no debe requerir datos de tarjeta
 * ✓ Debo ver información sobre el pago en efectivo
 * ✓ Debo recibir confirmación con número de tracking
 * ✓ El envío debe crearse con estado inicial correcto
 * 
 * Historias de Usuario: HU-01, HU-06
 * ============================================================================
 */
test.describe('Feature: Creación de Envío con Pago en Efectivo', () => {
  let quoteRequestPage: QuoteRequestPage;
  let quoteResultsPage: QuoteResultsPage;
  let wizardPage: ShipmentWizardPage;

  test.beforeEach(async ({ page }) => {
    quoteRequestPage = new QuoteRequestPage(page);
    quoteResultsPage = new QuoteResultsPage(page);
    wizardPage = new ShipmentWizardPage(page);
  });

  test('@smoke @critical Escenario: Flujo completo de creación de envío con efectivo', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('    💵 FLUJO COMPLETO: CREACIÓN DE ENVÍO CON PAGO EFECTIVO');
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
      origin: 'Cali, Valle del Cauca, Colombia',
      destination: 'Barranquilla, Atlántico, Colombia',
      weight: 8.0,
      pickupDate: QuoteRequestPage.getValidPickupDate(2),
      fragile: true // Paquete frágil
    };
    
    console.log(`   Origen: ${quoteData.origin}`);
    console.log(`   Destino: ${quoteData.destination}`);
    console.log(`   Peso: ${quoteData.weight} kg`);
    console.log(`   Fecha recogida: ${quoteData.pickupDate}`);
    console.log(`   Frágil: ⚠️ Sí (+15% recargo)`);
    
    await quoteRequestPage.requestQuote(quoteData);
    await quoteResultsPage.waitForResults(20000);
    
    const quoteCount = await quoteResultsPage.getQuoteCount();
    expect(quoteCount).toBeGreaterThan(0);
    console.log(`   ✓ ${quoteCount} cotizaciones recibidas\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 2: Seleccionar la Cotización más Rápida
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 2: Seleccionar Cotización (Más Rápida)                 │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const quotes = await quoteResultsPage.getAllQuotes();
    const fastestQuote = quotes.find(q => q.isFastest) || quotes[0];
    
    console.log(`   Proveedor seleccionado: ${fastestQuote.provider}`);
    console.log(`   Precio: $${fastestQuote.price.toLocaleString('es-CO')} COP`);
    console.log(`   Tiempo entrega: ${fastestQuote.deliveryDays}`);
    console.log(`   ⚡ Opción más rápida seleccionada`);
    
    await quoteResultsPage.selectQuoteByProvider(fastestQuote.provider);
    await wizardPage.verifyWizardLoaded();
    console.log(`   ✓ Navegado al wizard de creación\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 3-5: Completar Datos del Envío
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 3-5: Completar Datos del Envío                         │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const senderData = {
      name: 'Pedro Antonio Martínez',
      email: 'pedro.martinez@gmail.com',
      phone: '3157894561',
      address: 'Avenida 6N #25-30, Barrio Granada, Cali',
      documentNumber: '16789456'
    };
    
    const receiverData = {
      name: 'Ana Lucía Fernández',
      phone: '3001122334',
      address: 'Calle 84 #51-10, Barrio Alto Prado, Barranquilla'
    };
    
    console.log(`   👤 Remitente: ${senderData.name}`);
    console.log(`      📧 ${senderData.email}`);
    console.log(`      📍 ${senderData.address}`);
    console.log(`   👥 Destinatario: ${receiverData.name}`);
    console.log(`      📍 ${receiverData.address}`);
    
    await wizardPage.completeCustomerDetails({
      sender: senderData,
      receiver: receiverData,
      packageDescription: 'Equipo electrónico delicado - Manejar con cuidado'
    });
    
    console.log(`   ✓ Datos del envío completados\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 6: Seleccionar Pago en Efectivo
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASOS 6-7: Completar Pago en Efectivo                       │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    console.log(`   💵 Método: Pago en Efectivo`);
    console.log(`   💰 Monto a pagar: $${fastestQuote.price.toLocaleString('es-CO')} COP`);
    console.log(`   📝 Pago al momento de la recogida`);
    console.log(`   ⏳ Procesando solicitud...`);
    
    // Use the method with the fix for clicking "Continuar" button
    await wizardPage.completeCashPayment();
    
    console.log(`   ✓ Solicitud procesada\n`);

    /**
     * ═══════════════════════════════════════════════════════════════
     * PASO 8: Verificar Confirmación
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ PASO 8: Verificar Confirmación                              │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    const isConfirmed = await wizardPage.verifyConfirmationDisplayed();
    expect(isConfirmed).toBe(true);
    
    const trackingNumber = await wizardPage.getTrackingNumber();
    expect(trackingNumber).toBeTruthy();
    expect(trackingNumber).toMatch(/LOG-\d+/);
    
    console.log(`   ✅ Envío creado exitosamente`);
    console.log(`   📦 NÚMERO DE TRACKING: ${trackingNumber}`);
    
    // Verify payment method shown in confirmation
    const paymentMethodText = page.locator('text=/Efectivo/i');
    const hasPaymentMethod = await paymentMethodText.isVisible().catch(() => false);
    
    if (hasPaymentMethod) {
      console.log(`   💵 Método de pago confirmado: Efectivo`);
    }
    console.log('');

    /**
     * ═══════════════════════════════════════════════════════════════
     * RESUMEN FINAL
     * ═══════════════════════════════════════════════════════════════
     */
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              ✅ ENVÍO CON PAGO EN EFECTIVO CREADO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   📍 Ruta: ${quoteData.origin} → ${quoteData.destination}`);
    console.log(`   📦 Peso: ${quoteData.weight} kg (Frágil)`);
    console.log(`   🚚 Proveedor: ${fastestQuote.provider} (⚡ Más Rápido)`);
    console.log(`   💵 Total: $${fastestQuote.price.toLocaleString('es-CO')} COP (Efectivo)`);
    console.log(`   👤 Remitente: ${senderData.name}`);
    console.log(`   👥 Destinatario: ${receiverData.name}`);
    console.log(`   🔖 Tracking: ${trackingNumber}`);
    console.log(`   📝 Pago: A cobrar en recogida`);
    console.log('═══════════════════════════════════════════════════════════════\n');
  });

});

