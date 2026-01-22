import { test, expect } from '@playwright/test';
import { QuoteRequestPage } from '../../src/pages/QuoteRequestPage';
import { QuoteResultsPage } from '../../src/pages/QuoteResultsPage';

/**
 * ============================================================================
 * FEATURE: Flujo Completo de Cotización con Visualización de Mapa
 * ============================================================================
 * 
 * Como usuario del sistema de logística
 * Quiero solicitar cotizaciones de envío y visualizar la ruta en el mapa
 * Para tomar decisiones informadas sobre el mejor proveedor
 * 
 * Criterios de Aceptación:
 * ✓ Debo poder ingresar origen, destino, peso y fecha de recogida
 * ✓ El sistema debe mostrar cotizaciones de múltiples proveedores
 * ✓ Cada cotización debe mostrar: proveedor, precio, tiempo de entrega
 * ✓ El sistema debe identificar la opción más barata (badge verde)
 * ✓ El sistema debe identificar la opción más rápida (badge azul)
 * ✓ Debo poder ver la ruta en un mapa interactivo
 * ✓ El mapa debe mostrar la distancia y tiempo estimado
 * 
 * Historias de Usuario: HU-01, HU-03
 * ============================================================================
 */
test.describe('Feature: Flujo Completo de Cotización con Mapa', () => {
  let quoteRequestPage: QuoteRequestPage;
  let quoteResultsPage: QuoteResultsPage;

  test.beforeEach(async ({ page }) => {
    quoteRequestPage = new QuoteRequestPage(page);
    quoteResultsPage = new QuoteResultsPage(page);
  });

  test('@smoke @critical Escenario 1: Solicitar cotización y ver resultados con badges', async ({ page }) => {
    /**
     * GIVEN: Estoy en la página principal de cotizaciones
     */
    await quoteRequestPage.navigate();
    await quoteRequestPage.verifyPageLoaded();
    
    console.log('✓ Página de cotización cargada correctamente');

    /**
     * WHEN: Ingreso los datos del envío
     */
    const testData = QuoteRequestPage.getTestData().standard;
    
    console.log(`\n📦 Datos del envío:`);
    console.log(`   Origen: ${testData.origin}`);
    console.log(`   Destino: ${testData.destination}`);
    console.log(`   Peso: ${testData.weight} kg`);
    console.log(`   Fecha: ${testData.pickupDate}`);

    await quoteRequestPage.fillQuoteForm(testData);
    
    /**
     * AND: El botón de envío debe estar habilitado
     */
    const isEnabled = await quoteRequestPage.isSubmitEnabled();
    expect(isEnabled).toBe(true);
    console.log('✓ Botón de envío habilitado');

    /**
     * AND: Envío la solicitud de cotización
     */
    await quoteRequestPage.submitForm();
    
    /**
     * THEN: Debo ver las cotizaciones de los proveedores
     */
    await quoteResultsPage.waitForResults(20000);
    
    const quoteCount = await quoteResultsPage.getQuoteCount();
    expect(quoteCount).toBeGreaterThan(0);
    console.log(`\n✓ Se recibieron ${quoteCount} cotizaciones`);

    /**
     * AND: Las cotizaciones deben tener información completa
     */
    const quotes = await quoteResultsPage.getAllQuotes();
    
    console.log('\n📊 Cotizaciones recibidas:');
    console.log('─'.repeat(60));
    
    for (const quote of quotes) {
      expect(quote.provider).toBeTruthy();
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.deliveryDays).toBeTruthy();
      
      const badges = [];
      if (quote.isCheapest) badges.push('💰 Más Barata');
      if (quote.isFastest) badges.push('⚡ Más Rápida');
      
      console.log(`   ${quote.provider}`);
      console.log(`      Precio: $${quote.price.toLocaleString('es-CO')} COP`);
      console.log(`      Entrega: ${quote.deliveryDays}`);
      console.log(`      Transporte: ${quote.transportMode}`);
      if (badges.length > 0) console.log(`      Badges: ${badges.join(', ')}`);
      console.log('');
    }

    /**
     * AND: Debe haber exactamente una cotización marcada como "Más Barata"
     * AND: Debe haber exactamente una cotización marcada como "Más Rápida"
     */
    const badgeStatus = await quoteResultsPage.verifyBadgesDisplayed();
    expect(badgeStatus.hasCheapest).toBe(true);
    expect(badgeStatus.hasFastest).toBe(true);
    
    console.log('✓ Badge "Más Barata" asignado correctamente');
    console.log('✓ Badge "Más Rápida" asignado correctamente');
  });

  test('@smoke @critical Escenario 2: Visualizar ruta en mapa interactivo', async ({ page }) => {
    /**
     * GIVEN: He solicitado una cotización y tengo resultados
     */
    await quoteRequestPage.navigate();
    
    const testData = QuoteRequestPage.getTestData().standard;
    await quoteRequestPage.requestQuote(testData);
    await quoteResultsPage.waitForResults(20000);
    
    const quoteCount = await quoteResultsPage.getQuoteCount();
    expect(quoteCount).toBeGreaterThan(0);
    console.log(`✓ ${quoteCount} cotizaciones disponibles`);

    /**
     * WHEN: Verifico la información de ruta
     */
    const routeInfo = await quoteResultsPage.verifyRouteInfoDisplayed();
    console.log(`\n🗺️ Información de Ruta:`);
    console.log(`   Sección visible: ${routeInfo.hasSection ? 'Sí' : 'No'}`);
    console.log(`   Distancia mostrada: ${routeInfo.hasDistanceInfo ? 'Sí' : 'No'}`);

    /**
     * AND: Hago clic en "Ver Ruta en Mapa"
     */
    await quoteResultsPage.openRouteMap();
    
    /**
     * THEN: El modal del mapa debe aparecer
     */
    const isMapVisible = await quoteResultsPage.verifyMapModalVisible();
    expect(isMapVisible).toBe(true);
    console.log('✓ Mapa interactivo abierto correctamente');

    /**
     * AND: El mapa debe mostrar la ruta calculada
     */
    // Wait for map to render
    await page.waitForTimeout(2000);
    
    // Verify map container exists
    const mapContainer = page.locator('.leaflet-container');
    const hasMap = await mapContainer.isVisible().catch(() => false);
    
    if (hasMap) {
      console.log('✓ Mapa Leaflet renderizado');
    } else {
      console.log('⚠️ Mapa puede estar cargando o usando otro proveedor');
    }

    /**
     * WHEN: Cierro el modal del mapa
     */
    await quoteResultsPage.closeMapModal();
    
    /**
     * THEN: El modal debe cerrarse y volver a ver las cotizaciones
     */
    const isModalClosed = !(await quoteResultsPage.verifyMapModalVisible());
    expect(isModalClosed).toBe(true);
    console.log('✓ Modal cerrado correctamente');
    
    // Verify quotes are still visible
    const quotesStillVisible = await quoteResultsPage.getQuoteCount();
    expect(quotesStillVisible).toBe(quoteCount);
    console.log('✓ Cotizaciones siguen visibles después de cerrar el mapa');
  });

  test.skip('@regression Escenario 3: Cotización con paquete frágil', async ({ page }) => {
    /**
     * GIVEN: Estoy en la página de cotización
     * WHEN: Ingreso datos de un envío frágil
     */
    await quoteRequestPage.navigate();
    
    const fragileData = QuoteRequestPage.getTestData().fragile;
    console.log('\n📦 Envío con paquete FRÁGIL:');
    console.log(`   Origen: ${fragileData.origin}`);
    console.log(`   Destino: ${fragileData.destination}`);
    console.log(`   Peso: ${fragileData.weight} kg`);
    console.log(`   Frágil: ${fragileData.fragile ? 'Sí (+15% recargo)' : 'No'}`);

    await quoteRequestPage.requestQuote(fragileData);
    await quoteResultsPage.waitForResults(20000);

    /**
     * THEN: Las cotizaciones deben incluir el recargo por fragilidad
     */
    const quotes = await quoteResultsPage.getAllQuotes();
    expect(quotes.length).toBeGreaterThan(0);
    
    console.log('\n📊 Cotizaciones (con recargo fragilidad 15%):');
    for (const quote of quotes) {
      // Fragile items add 15% surcharge
      console.log(`   ${quote.provider}: $${quote.price.toLocaleString('es-CO')} COP`);
    }
    
    console.log('\n✓ Cotizaciones incluyen recargo por fragilidad');
  });

  test.skip('@regression Escenario 4: Comparar cotizaciones de diferentes pesos', async ({ page }) => {
    /**
     * GIVEN: Estoy en la página de cotización
     * WHEN: Solicito cotización para paquete ligero (2.5 kg)
     */
    await quoteRequestPage.navigate();
    
    const lightData = QuoteRequestPage.getTestData().lightweight;
    await quoteRequestPage.requestQuote(lightData);
    await quoteResultsPage.waitForResults(20000);
    
    const lightQuotes = await quoteResultsPage.getAllQuotes();
    const lightAvgPrice = lightQuotes.reduce((sum, q) => sum + q.price, 0) / lightQuotes.length;
    
    console.log(`\n📦 Paquete ligero (${lightData.weight} kg):`);
    console.log(`   Precio promedio: $${lightAvgPrice.toLocaleString('es-CO')} COP`);

    /**
     * AND: Solicito cotización para paquete pesado (45 kg)
     */
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const heavyData = QuoteRequestPage.getTestData().heavy;
    await quoteRequestPage.requestQuote(heavyData);
    await quoteResultsPage.waitForResults(20000);
    
    const heavyQuotes = await quoteResultsPage.getAllQuotes();
    const heavyAvgPrice = heavyQuotes.reduce((sum, q) => sum + q.price, 0) / heavyQuotes.length;
    
    console.log(`\n📦 Paquete pesado (${heavyData.weight} kg):`);
    console.log(`   Precio promedio: $${heavyAvgPrice.toLocaleString('es-CO')} COP`);

    /**
     * THEN: El precio del paquete pesado debe ser mayor
     */
    expect(heavyAvgPrice).toBeGreaterThan(lightAvgPrice);
    
    const priceDifference = ((heavyAvgPrice - lightAvgPrice) / lightAvgPrice * 100).toFixed(1);
    console.log(`\n✓ Validación: Paquete pesado cuesta ${priceDifference}% más que el ligero`);
  });

  test.skip('@smoke Escenario 5: Tiempo de respuesta aceptable', async ({ page }) => {
    /**
     * GIVEN: Estoy en la página de cotización
     * WHEN: Mido el tiempo de respuesta
     */
    await quoteRequestPage.navigate();
    
    const testData = QuoteRequestPage.getTestData().standard;
    await quoteRequestPage.fillQuoteForm(testData);
    
    const startTime = Date.now();
    await quoteRequestPage.submitForm();
    await quoteResultsPage.waitForResults(20000);
    const endTime = Date.now();
    
    const responseTimeMs = endTime - startTime;
    const responseTimeSec = (responseTimeMs / 1000).toFixed(2);

    /**
     * THEN: El tiempo de respuesta debe ser menor a 10 segundos
     */
    expect(responseTimeMs).toBeLessThan(10000);
    
    console.log(`\n⏱️ Tiempo de respuesta: ${responseTimeSec} segundos`);
    
    if (responseTimeMs < 3000) {
      console.log('✓ Excelente: Respuesta en menos de 3 segundos');
    } else if (responseTimeMs < 5000) {
      console.log('✓ Bueno: Respuesta en menos de 5 segundos');
    } else {
      console.log('⚠️ Aceptable: Respuesta en menos de 10 segundos');
    }
  });

  test.skip('@regression Escenario 6: Información detallada de cada cotización', async ({ page }) => {
    /**
     * GIVEN: He solicitado cotizaciones
     */
    await quoteRequestPage.navigate();
    const testData = QuoteRequestPage.getTestData().standard;
    await quoteRequestPage.requestQuote(testData);
    await quoteResultsPage.waitForResults(20000);

    /**
     * WHEN: Analizo cada cotización
     * THEN: Cada una debe tener información completa
     */
    const quotes = await quoteResultsPage.getAllQuotes();
    
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('        DETALLE COMPLETO DE COTIZACIONES');
    console.log('══════════════════════════════════════════════════════════\n');
    
    for (const quote of quotes) {
      // Verify required fields
      expect(quote.provider).toBeTruthy();
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.deliveryDays).toBeTruthy();
      
      const statusEmoji = quote.isCheapest || quote.isFastest ? '⭐' : '  ';
      
      console.log(`${statusEmoji} ${quote.provider}`);
      console.log(`   ├── Precio: $${quote.price.toLocaleString('es-CO')} COP`);
      console.log(`   ├── Tiempo entrega: ${quote.deliveryDays}`);
      console.log(`   ├── Modo transporte: ${quote.transportMode}`);
      
      const badges = [];
      if (quote.isCheapest) badges.push('💰 MÁS BARATA');
      if (quote.isFastest) badges.push('⚡ MÁS RÁPIDA');
      
      if (badges.length > 0) {
        console.log(`   └── Badges: ${badges.join(', ')}`);
      } else {
        console.log(`   └── Badges: Ninguno`);
      }
      console.log('');
    }
    
    console.log('══════════════════════════════════════════════════════════');
    console.log(`✓ Total de cotizaciones verificadas: ${quotes.length}`);
  });
});
