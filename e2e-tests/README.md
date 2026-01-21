# 🧪 E2E Tests - Logistics Optimizer

Pruebas End-to-End (E2E) con **Playwright** usando metodología **BDD** (Behavior-Driven Development) y patrón **Page Object Model (POM)**.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Ejecución de Tests](#ejecución-de-tests)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Escenarios de Prueba](#escenarios-de-prueba)
- [Reportes y Evidencias](#reportes-y-evidencias)
- [Buenas Prácticas](#buenas-prácticas)

---

## 📖 Descripción

Este módulo contiene las pruebas E2E del sistema Logistics Optimizer que validan el flujo completo del negocio:

1. **Solicitud de Cotización**: Bogotá → Cali, 10kg, fecha 30/01/2026
2. **Visualización de Mapa**: Abrir ruta de FedEx en mapa interactivo
3. **Creación de Envío**: Wizard multi-paso con FedEx
4. **Gestión de Almacén**: 
   - Asignación de camiones
   - Cambios de estado (DELIVERED, RETURNED, FAILED_DELIVERY)

### Tecnologías

- ✅ **Playwright 1.41.1** - Framework de testing E2E
- ✅ **TypeScript 5.3.3** - Tipado estático
- ✅ **Page Object Model** - Patrón de diseño para mantenibilidad
- ✅ **BDD Naming** - Escenarios Given-When-Then

---

## ⚙️ Requisitos Previos

### 1. Docker Compose en ejecución

Los tests requieren que los servicios estén corriendo:

```bash
# Desde el directorio raíz del proyecto (logistics-optimizer/)
docker-compose up -d
```

Verifica que estén corriendo:
- ✅ **Frontend**: http://localhost:5173
- ✅ **Backend**: http://localhost:3000
- ✅ **MongoDB**: localhost:27017
- ✅ **RabbitMQ**: localhost:15672

### 2. Node.js 18+

Verifica tu versión:

```powershell
node --version  # Debe ser v18.0.0 o superior
```

---

## 📦 Instalación

Desde el directorio `e2e-tests/`:

```powershell
# Instalar dependencias
npm install

# Instalar navegadores de Playwright (solo primera vez)
npx playwright install chromium
```

---

## 🚀 Ejecución de Tests

### Todos los tests

```powershell
npm test
```

### Tests en modo headed (ver el navegador)

```powershell
npm run test:headed
```

### Tests BDD específicos

```powershell
npm run test:bdd
npm run test:bdd:headed
```

### Filtrar por tags

```powershell
# Solo tests críticos (@smoke)
npm run test:smoke

# Tests de regresión (@regression)
npm run test:regression
```

### Modo UI (interfaz interactiva)

```powershell
npm run test:ui
```

### Modo debug

```powershell
npm run test:debug
```

### Ver reporte HTML

```powershell
npm run test:report
```

---

## 📁 Estructura del Proyecto

```
e2e-tests/
├── src/
│   └── pages/                    # Page Objects (POM)
│       ├── BasePage.ts           # Clase base con métodos comunes
│       ├── QuoteRequestPage.ts   # Página de solicitud de cotización
│       ├── QuoteResultsPage.ts   # Página de resultados
│       └── WarehousePage.ts      # Vista de almacén
│
├── tests/
│   └── bdd/                      # Tests BDD organizados por feature
│       └── complete-shipment-flow.spec.ts  # Flujo completo del negocio
│
├── package.json                  # Dependencias y scripts
├── playwright.config.ts          # Configuración de Playwright
├── tsconfig.json                 # Configuración de TypeScript
└── README.md                     # Este archivo
```

### Page Objects Creados

| Page Object | Descripción | Selectores Basados En |
|------------|-------------|----------------------|
| `BasePage` | Clase base con métodos comunes (screenshots, waits, clicks) | N/A |
| `QuoteRequestPage` | Formulario de cotización con campos `origin`, `destination`, `weight`, `pickupDate` | [QuoteRequestForm.tsx](../logistics-front/src/components/QuoteRequestForm.tsx) |
| `QuoteResultsPage` | Lista de cotizaciones con badges (cheapest, fastest) y botón de mapa | [QuoteResultsList.tsx](../logistics-front/src/components/QuoteResultsList.tsx) |
| `WarehousePage` | Vista de almacén con asignación de camiones y gestión de estados | [WarehouseView.tsx](../logistics-front/src/components/WarehouseView.tsx) |

---

## 🧩 Escenarios de Prueba

### complete-shipment-flow.spec.ts

| # | Tag | Escenario | Descripción |
|---|-----|-----------|-------------|
| 1 | `@smoke` | Solicitar cotización Bogotá → Cali 10kg | Ingresa datos y obtiene cotizaciones de proveedores |
| 2 | `@smoke` | Abrir mapa de ruta de FedEx | Visualiza ruta en modal interactivo |
| 3 | `@smoke` | Crear envío con FedEx | Completa wizard multi-paso y obtiene tracking number |
| 4 | `@regression` | Navegar a vista de almacén | Accede a la gestión de envíos |
| 5 | `@smoke` | Asignar camión a envío | Selecciona camión ABC-123 para un envío |
| 6 | `@smoke` | Marcar envío como DELIVERED | Avanza estado hasta entrega exitosa |
| 7 | `@regression` | Marcar envío como RETURNED | Usa botón especial "Devolución" |
| 8 | `@regression` | Marcar envío como NO ENTREGADO | Usa botón especial "No Entregado" |

### Formato BDD

Todos los tests siguen el formato **Given-When-Then**:

```typescript
test('@smoke Scenario: Solicitar cotización', async ({ page }) => {
  // Given: El usuario está en la página principal
  const quotePage = new QuoteRequestPage(page);
  await quotePage.navigate();
  
  // When: Ingresa los datos del envío
  await quotePage.fillQuoteForm({
    origin: 'Bogotá',
    destination: 'Cali',
    weight: 10,
    pickupDate: '2026-01-30',
  });
  
  // Then: Debe ver las cotizaciones
  const resultsPage = new QuoteResultsPage(page);
  await resultsPage.waitForResults();
  expect(await resultsPage.getQuoteCount()).toBeGreaterThan(0);
});
```

---

## 📊 Reportes y Evidencias

### Videos

Todos los tests generan **videos automáticamente**:

```
test-results/
└── complete-shipment-flow-spec-ts-...
    └── video.webm
```

### Screenshots

Capturas automáticas durante la ejecución:

```
screenshots/
├── 01_quote_page_loaded.png
├── 02_origin_filled.png
├── 03_destination_filled.png
├── ...
└── 20_marked_as_returned.png
```

### Traces

Trazas completas para debugging (ver en Playwright UI):

```
test-results/
└── complete-shipment-flow-spec-ts-...
    └── trace.zip
```

Ver trace:

```powershell
npx playwright show-trace test-results/.../trace.zip
```

### Reporte HTML

Después de ejecutar los tests:

```powershell
npm run test:report
```

Abre automáticamente en: `http://localhost:9323`

---

## ✅ Buenas Prácticas

### 1. **No modificar código del proyecto principal**

Este módulo E2E es **completamente independiente**:
- ❌ No toca código de `logistics-front/`
- ❌ No toca código de `logistics-back/`
- ✅ Solo consume endpoints y UI del sistema en ejecución

### 2. **Selectores estables**

Prioridad de selectores:
1. ✅ `data-testid` (más estable)
2. ✅ `name` attributes (formularios)
3. ✅ Texto visible (buttons con :has-text())
4. ⚠️ Clases CSS (menos estable)

### 3. **Esperas inteligentes**

```typescript
// ✅ Usar waitFor con timeout explícito
await quotePage.waitForResults(15000);

// ❌ Evitar timeouts fijos
await page.waitForTimeout(5000); // Solo para casos específicos
```

### 4. **Screenshots descriptivos**

```typescript
await this.takeScreenshot('14_warehouse_view_loaded');
await this.takeScreenshot('15_shipments_loaded');
```

### 5. **Manejo de estados asincrónicos**

Todos los métodos de Page Objects son `async` y esperan elementos:

```typescript
async assignTruckToShipment(trackingNumber: string, truckPlate: string) {
  await card.waitFor({ state: 'visible', timeout: 10000 });
  await assignButton.click();
  await this.page.waitForTimeout(1000); // API call
}
```

---

## 🐛 Troubleshooting

### Tests fallan con "Timeout waiting for element"

1. Verifica que Docker Compose esté corriendo:
   ```powershell
   docker-compose ps
   ```

2. Verifica que el frontend responda:
   ```powershell
   curl http://localhost:5173
   ```

3. Ejecuta en modo headed para ver qué pasa:
   ```powershell
   npm run test:headed
   ```

### Tests pasan en local pero fallan en CI

- Aumenta los timeouts en `playwright.config.ts`
- Usa `retries: 2` en configuración
- Verifica que los servicios Docker estén listos antes de ejecutar tests

### No se generan videos

Verifica configuración en `playwright.config.ts`:

```typescript
use: {
  video: 'on',  // ✅ Debe estar en 'on'
  screenshot: 'on',
  trace: 'on',
}
```

---

## 📚 Recursos

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)

---

## 👨‍💻 Mantenimiento

Para agregar nuevos tests:

1. **Crear Page Object** si interactúas con una nueva página:
   ```typescript
   // src/pages/NewFeaturePage.ts
   export class NewFeaturePage extends BasePage {
     // Locators y métodos
   }
   ```

2. **Crear spec file** en `tests/bdd/`:
   ```typescript
   // tests/bdd/new-feature.spec.ts
   test.describe('Feature: Nueva Funcionalidad', () => {
     test('@smoke Scenario: ...', async ({ page }) => {
       // Given-When-Then
     });
   });
   ```

3. **Usar selectores estables** (preferir `data-testid`)

4. **Documentar en README** los nuevos escenarios

---

## 📄 Licencia

Este módulo es parte del proyecto Logistics Optimizer.
