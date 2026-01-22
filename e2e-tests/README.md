# Tests E2E - Logistics Optimizer

Suite de pruebas end-to-end (E2E) utilizando **Playwright** con patrón **Page Object Model (POM)** y metodología **BDD (Behavior-Driven Development)**.

## 📁 Estructura del Proyecto

```
e2e-tests/
├── src/
│   └── pages/                    # Page Object Model
│       ├── BasePage.ts           # Clase base con utilidades comunes
│       ├── QuoteRequestPage.ts   # Página de solicitud de cotización
│       ├── QuoteResultsPage.ts   # Página de resultados de cotización
│       ├── ShipmentWizardPage.ts # Wizard de creación de envío
│       └── WarehousePage.ts      # Vista de almacén
├── tests/
│   └── bdd/                      # Tests BDD organizados por feature
│       ├── E2E-01-complete-quote-flow.spec.ts     # Flujo cotización + mapa
│       ├── E2E-02-complete-shipment-card.spec.ts  # Creación envío + tarjeta
│       ├── E2E-03-complete-shipment-cash.spec.ts  # Creación envío + efectivo
│       └── E2E-04-warehouse-management.spec.ts    # Gestión de almacén
├── playwright.config.ts          # Configuración de Playwright
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerrequisitos

1. **Node.js** 18+ instalado
2. **Docker** ejecutando con los servicios del proyecto:
   - Frontend en `http://localhost:5173`
   - Backend en `http://localhost:3000`

### Instalación

```bash
cd e2e-tests
npm install
npx playwright install chromium
```

### Ejecutar Tests

```bash
# Ejecutar todos los tests E2E
npm test

# Ejecutar tests con interfaz gráfica
npx playwright test --ui

# Ejecutar tests con navegador visible
npx playwright test --headed

# Ejecutar un archivo específico
npx playwright test E2E-01-complete-quote-flow.spec.ts

# Ejecutar tests por tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@critical"

# Ver reporte HTML
npx playwright show-report
```

## 📋 Tests E2E Principales

### E2E-01: Flujo Completo de Cotización con Mapa

**Feature:** Solicitud y visualización de cotizaciones con mapa interactivo

| Escenario | Descripción | Tags |
|-----------|-------------|------|
| Escenario 1 | Solicitar cotización y ver resultados con badges | `@smoke @critical` |
| Escenario 2 | Visualizar ruta en mapa interactivo | `@smoke @critical` |
| Escenario 3 | Cotización con paquete frágil | `@regression` |
| Escenario 4 | Comparar cotizaciones de diferentes pesos | `@regression` |
| Escenario 5 | Tiempo de respuesta aceptable | `@smoke` |
| Escenario 6 | Información detallada de cada cotización | `@regression` |

**Flujo probado:**
1. Navegar a página de cotización
2. Llenar formulario (origen, destino, peso, fecha)
3. Enviar solicitud
4. Ver cotizaciones de múltiples proveedores
5. Verificar badges (más barata, más rápida)
6. Abrir mapa interactivo
7. Cerrar modal de mapa

---

### E2E-02: Creación de Envío con Pago por Tarjeta

**Feature:** Flujo completo de creación de envío hasta confirmación

| Escenario | Descripción | Tags |
|-----------|-------------|------|
| Escenario completo | Flujo 9 pasos desde cotización hasta tracking | `@smoke @critical` |
| Validación campos | Verificar validaciones del wizard | `@regression` |
| Tarjeta inválida | Validación de número de tarjeta (Luhn) | `@regression` |

**Flujo probado:**
1. Solicitar cotización
2. Seleccionar proveedor (más barato)
3. Completar datos del remitente
4. Completar datos del destinatario
5. Agregar descripción del paquete
6. Continuar al pago
7. Llenar datos de tarjeta (Visa test: 4242424242424242)
8. Confirmar pago
9. Recibir número de tracking (LOG-XXXXXX)

---

### E2E-03: Creación de Envío con Pago en Efectivo

**Feature:** Flujo de creación de envío con pago COD (Cash on Delivery)

| Escenario | Descripción | Tags |
|-----------|-------------|------|
| Escenario completo | Flujo con pago en efectivo | `@smoke @critical` |
| Sin datos tarjeta | Verificar que no se requiere tarjeta | `@regression` |
| Cambio de método | Cambiar entre tarjeta y efectivo | `@regression` |
| Creación rápida | Test para generar datos rápidamente | `@smoke` |

**Flujo probado:**
1. Solicitar cotización con paquete frágil
2. Seleccionar proveedor más rápido
3. Completar datos de envío
4. Seleccionar "Pago en Efectivo"
5. Confirmar pago (sin datos de tarjeta)
6. Recibir tracking

---

### E2E-04: Gestión de Envíos en Almacén

**Feature:** Operaciones de almacén y gestión de estados

| Escenario | Descripción | Tags |
|-----------|-------------|------|
| Flujo completo | Crear envío, asignar camión, avanzar estados | `@smoke @critical` |
| Visualización | Verificar UI del almacén | `@smoke` |
| Búsqueda | Buscar por tracking number | `@regression` |
| Filtros | Filtrar por estados | `@regression` |
| Historial | Ver historial de estados | `@regression` |
| No Entregado | Marcar envío como fallido | `@smoke` |
| Estadísticas | Verificar contadores | `@regression` |

**Flujo probado:**
1. Crear envío de prueba
2. Navegar al almacén
3. Localizar envío por tracking
4. Asignar camión disponible
5. Avanzar estados: PAYMENT_CONFIRMED → PROCESSING → READY_FOR_PICKUP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
6. Ver historial de cambios
7. Probar filtros y búsqueda

## 🏷️ Tags de Tests

| Tag | Propósito |
|-----|-----------|
| `@smoke` | Tests básicos de funcionalidad crítica |
| `@critical` | Tests que NUNCA deben fallar en producción |
| `@regression` | Tests completos para verificar después de cambios |

```bash
# Ejecutar solo smoke tests
npx playwright test --grep "@smoke"

# Ejecutar tests críticos
npx playwright test --grep "@critical"

# Ejecutar tests de regresión
npx playwright test --grep "@regression"
```

## 📊 Reportes

Los reportes se generan automáticamente en `playwright-report/`:

```bash
# Generar y abrir reporte HTML
npx playwright show-report

# Generar reporte JSON
npx playwright test --reporter=json
```

**Artefactos generados:**
- Screenshots automáticos en cada paso
- Videos de la ejecución
- Traces para debugging

## 🔧 Configuración

### playwright.config.ts

```typescript
{
  timeout: 60000,           // 60s por test
  fullyParallel: false,     // Secuencial para consistencia
  workers: 1,               // Un worker
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'on',
    video: 'on',
    viewport: { width: 1920, height: 1080 }
  }
}
```

### Variables de Entorno

```bash
# Ejecutar en modo headless (default)
npx playwright test

# Ejecutar con navegador visible
HEADLESS=false npx playwright test
```

## 🧪 Page Object Model

### Estructura de Page Objects

```typescript
// Ejemplo de uso
const quoteRequestPage = new QuoteRequestPage(page);
const quoteResultsPage = new QuoteResultsPage(page);

// Navegar y llenar formulario
await quoteRequestPage.navigate();
await quoteRequestPage.fillQuoteForm({
  origin: 'Bogotá, Colombia',
  destination: 'Medellín, Colombia',
  weight: 15.5,
  pickupDate: '2026-01-25',
  fragile: false
});

// Enviar y esperar resultados
await quoteRequestPage.submitForm();
await quoteResultsPage.waitForResults();

// Obtener cotizaciones
const quotes = await quoteResultsPage.getAllQuotes();
```

### Datos de Prueba Incluidos

```typescript
// Usar datos de prueba predefinidos
const testData = QuoteRequestPage.getTestData();
console.log(testData.standard);   // Envío estándar
console.log(testData.fragile);    // Paquete frágil
console.log(testData.lightweight); // Paquete ligero
console.log(testData.heavy);       // Paquete pesado

// Datos para wizard
const wizardData = ShipmentWizardPage.getTestData();
console.log(wizardData.sender);    // Datos remitente
console.log(wizardData.receiver);  // Datos destinatario
console.log(wizardData.cardData);  // Tarjeta de prueba
```

## 📝 Notas Importantes

1. **Prerequisitos de Docker**: Asegúrate de que el frontend y backend estén corriendo antes de ejecutar tests

2. **Base de datos**: Los tests crean envíos reales en la base de datos. Considera usar una BD de pruebas

3. **Timeouts**: Los timeouts están configurados para conexiones lentas. Ajusta si es necesario

4. **Screenshots**: Se guardan automáticamente en `screenshots/` para documentación

5. **Videos**: Los videos de cada test están en `test-results/` para debugging

## 🐛 Troubleshooting

### Test falla con timeout
```bash
# Aumentar timeout global
npx playwright test --timeout=120000
```

### Navegador no se abre
```bash
# Reinstalar navegadores
npx playwright install chromium
```

### Frontend no responde
```bash
# Verificar que Docker está corriendo
docker-compose ps
docker-compose logs frontend
```

---

**Última actualización:** Enero 2026
**Versión de Playwright:** 1.40+
