# E2E Tests - Logistics Optimizer

End-to-end tests using Playwright with BDD approach for the Logistics Optimizer application.

## Test Coverage

### Feature: Complete Shipment Flow (`complete-shipment-flow.spec.ts`)
Tests esenciales del flujo principal del negocio.

| Test | Tag | Description |
|------|-----|-------------|
| Navegar a vista de almacén | @smoke | Usuario navega correctamente a la vista de almacén |
| Verificar estadísticas del almacén | @regression | Estadísticas de Total y Entregados visibles |
| Verificar filtros de estado del almacén | @regression | Sidebar de filtros con botón "Todos" visible |

### Feature: Warehouse Management (`warehouse-management.spec.ts`)
Tests de gestión del almacén.

| Test | Tag | Description |
|------|-----|-------------|
| Navigate to warehouse view | @smoke | Header "Almacén de Envíos" visible |
| Warehouse displays statistics | @regression | Estadísticas de envíos visibles |
| View shipment list or empty state | @smoke | Lista de envíos o estado vacío |
| Status filters are visible | @regression | Filtros por estado visibles |
| Search input is available | @regression | Campo de búsqueda disponible |
| Search with no results | @regression | Búsqueda sin resultados muestra estado vacío |
| Warehouse layout structure | @regression | Estructura del layout correcto |

## Prerequisites

- Node.js >= 18
- Backend running on port 3000
- Frontend running on port 5173

## Installation

```bash
npm install
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm test

# Run with UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/bdd/warehouse-management.spec.ts

# Run only smoke tests
npx playwright test --grep "@smoke"

# Run only regression tests
npx playwright test --grep "@regression"

# Show HTML report
npx playwright show-report
```

## Evidence Collection

Tests automatically capture:
- **Screenshots**: Saved in `screenshots/` directory
- **Videos**: Saved in `test-results/` for failed tests
- **Traces**: Available in `test-results/` for debugging

## Project Structure

```
e2e-tests/
├── src/
│   └── pages/              # Page Object Model classes
│       ├── BasePage.ts     # Base page with common methods
│       ├── QuoteRequestPage.ts
│       ├── QuoteResultsPage.ts
│       ├── ShipmentWizardPage.ts
│       └── WarehousePage.ts
├── tests/
│   └── bdd/                # BDD test specifications
│       ├── complete-shipment-flow.spec.ts
│       └── warehouse-management.spec.ts
├── playwright.config.ts    # Playwright configuration
└── package.json
```

## Configuration

Key settings in `playwright.config.ts`:
- Timeout: 120 seconds per test
- Workers: 1 (sequential execution)
- Screenshot: On (always capture)
- Video: On (always record)
- Trace: On (for debugging)
- Browser: Chromium

## Tags

- `@smoke`: Critical path tests - essential functionality
- `@regression`: Full coverage tests - comprehensive validation

## Debugging

```bash
# Show trace for failed test
npx playwright show-trace test-results/<test-folder>/trace.zip

# Run tests with debug mode
npx playwright test --debug

# Run with headed browser
npx playwright test --headed
```
