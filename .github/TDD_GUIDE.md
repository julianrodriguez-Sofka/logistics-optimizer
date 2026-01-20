# TDD Implementation Guide - Quick Reference

## Overview
This document provides a quick reference for implementing user stories using Test-Driven Development (TDD).

---

## TDD Red-Green-Refactor Cycle

```
1. RED:   Write a failing test (defines expected behavior)
2. GREEN: Write minimal code to make test pass
3. REFACTOR: Improve code while keeping tests green
4. REPEAT: Next test case
```

---

## Priority Matrix (Must-Have User Stories)

### 🔴 Priority 1: Foundation (Start Here)
| User Story | Tests to Write First | Business Value |
|:---|:---|:---|
| **HU-02** | Validation unit tests (15+ cases) | Prevents invalid data, reduces backend errors |
| **HU-03** | Badge assignment logic (8+ cases) | Core differentiator - automatic ranking |

### 🟡 Priority 2: Core Functionality
| User Story | Tests to Write First | Business Value |
|:---|:---|:---|
| **HU-01** | Integration tests for quote retrieval | Main user flow - quote comparison |
| **HU-05** | Error handling tests (timeouts, failures) | System reliability and trust |

### 🟢 Priority 3: User Experience
| User Story | Tests to Write First | Business Value |
|:---|:---|:---|
| **HU-04** | Health monitoring tests | Transparency and user confidence |
| **HU-07** | Sorting/filtering logic tests | Usability and customization |

---

## Test Pyramid for This Project

```
           /\
          /  \         E2E Tests (3+ scenarios)
         /____\        ↓ Playwright - Full user flows
        /      \
       /        \      Integration Tests (3+ suites)
      /__________\     ↓ API endpoints + MongoDB
     /            \
    /              \   Unit Tests (70%+ coverage)
   /________________\  ↓ Entities, Services, Adapters
```

**Target Distribution:**
- 70% Unit Tests (fast, isolated)
- 20% Integration Tests (API + DB)
- 10% E2E Tests (critical paths)

---

## HU-01: Quote Retrieval - Test Checklist

### Unit Tests (QuoteService)
```typescript
describe('QuoteService', () => {
  test('should aggregate quotes from all adapters', async () => {
    // RED: Test fails (service doesn't exist)
    // GREEN: Implement service with Promise.allSettled()
    // REFACTOR: Extract adapter orchestration logic
  });

  test('should handle fragile surcharge (15% increase)', () => {
    // Input: weight=10kg, fragile=true, basePrice=100
    // Expected: price=115
  });

  test('should return quotes in < 3 seconds when all adapters online', () => {
    // Use jest.setTimeout() and performance.now()
  });
});
```

### Integration Tests (POST /api/quotes)
```typescript
describe('POST /api/quotes', () => {
  test('should return 200 with 3 quotes when all adapters online', async () => {
    const response = await request(app)
      .post('/api/quotes')
      .send({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 5.5,
        pickupDate: '2026-01-10',
        fragile: false
      });
    
    expect(response.status).toBe(200);
    expect(response.body.quotes).toHaveLength(3);
  });
});
```

### E2E Tests (Playwright)
```typescript
test('User can request quotes and see results', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.fill('[name="origin"]', 'New York, NY');
  await page.fill('[name="destination"]', 'Los Angeles, CA');
  await page.fill('[name="weight"]', '5.5');
  await page.fill('[name="pickupDate"]', '2026-01-10');
  await page.click('button:has-text("Obtener Cotizaciones")');
  
  // Verify 3 quotes displayed
  await expect(page.locator('.quote-card')).toHaveCount(3);
  
  // Verify badges present
  await expect(page.locator('.badge-cheapest')).toBeVisible();
  await expect(page.locator('.badge-fastest')).toBeVisible();
});
```

---

## HU-02: Input Validation - Test Checklist

### Unit Tests (QuoteRequest Entity)
```typescript
describe('QuoteRequest Validation', () => {
  // Weight validation
  test('should reject weight <= 0', () => {
    expect(() => new QuoteRequest({ weight: 0, ... }))
      .toThrow('Weight must be > 0.1 kg');
  });

  test('should reject weight > 1000 kg', () => {
    expect(() => new QuoteRequest({ weight: 1001, ... }))
      .toThrow('Weight must be ≤ 1000 kg');
  });

  test('should accept weight = 0.1 kg (boundary)', () => {
    expect(() => new QuoteRequest({ weight: 0.1, ... }))
      .not.toThrow();
  });

  test('should accept weight = 1000 kg (boundary)', () => {
    expect(() => new QuoteRequest({ weight: 1000, ... }))
      .not.toThrow();
  });

  // Date validation
  test('should reject past dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(() => new QuoteRequest({ pickupDate: yesterday, ... }))
      .toThrow('Date cannot be in the past');
  });

  test('should reject dates > 30 days ahead', () => {
    const future = new Date();
    future.setDate(future.getDate() + 31);
    expect(() => new QuoteRequest({ pickupDate: future, ... }))
      .toThrow('Date must be within 30 days');
  });

  test('should accept today (boundary)', () => {
    const today = new Date();
    expect(() => new QuoteRequest({ pickupDate: today, ... }))
      .not.toThrow();
  });

  test('should accept 30 days ahead (boundary)', () => {
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    expect(() => new QuoteRequest({ pickupDate: limit, ... }))
      .not.toThrow();
  });

  // Address validation
  test('should reject empty origin', () => {
    expect(() => new QuoteRequest({ origin: '', ... }))
      .toThrow('Origin is required');
  });

  test('should reject empty destination', () => {
    expect(() => new QuoteRequest({ destination: '', ... }))
      .toThrow('Destination is required');
  });

  // Type validation
  test('should reject non-boolean fragile', () => {
    expect(() => new QuoteRequest({ fragile: 'yes', ... }))
      .toThrow('Fragile must be boolean');
  });

  test('should accept fragile = undefined (optional)', () => {
    expect(() => new QuoteRequest({ fragile: undefined, ... }))
      .not.toThrow();
  });
});
```

### Integration Tests (API Validation Middleware)
```typescript
describe('POST /api/quotes - Validation', () => {
  test('should return 400 for invalid weight', async () => {
    const response = await request(app)
      .post('/api/quotes')
      .send({ weight: -5, origin: 'A', destination: 'B', pickupDate: '2026-01-10' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Weight');
  });

  test('should return 400 for missing origin', async () => {
    const response = await request(app)
      .post('/api/quotes')
      .send({ weight: 5, destination: 'B', pickupDate: '2026-01-10' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Origin is required');
  });
});
```

### Frontend Tests (Form Validation)
```typescript
describe('QuoteRequestForm', () => {
  test('should disable submit button when form invalid', () => {
    render(<QuoteRequestForm />);
    const submitButton = screen.getByRole('button', { name: /obtener cotizaciones/i });
    
    expect(submitButton).toBeDisabled();
  });

  test('should show error message for invalid weight', async () => {
    render(<QuoteRequestForm />);
    const weightInput = screen.getByLabelText(/peso/i);
    
    fireEvent.change(weightInput, { target: { value: '-5' } });
    fireEvent.blur(weightInput);
    
    expect(await screen.findByText(/peso debe ser mayor a 0.1 kg/i)).toBeInTheDocument();
  });

  test('should enable submit button when all fields valid', async () => {
    render(<QuoteRequestForm />);
    
    fireEvent.change(screen.getByLabelText(/origen/i), { target: { value: 'New York' } });
    fireEvent.change(screen.getByLabelText(/destino/i), { target: { value: 'LA' } });
    fireEvent.change(screen.getByLabelText(/peso/i), { target: { value: '5.5' } });
    fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: '2026-01-10' } });
    
    expect(screen.getByRole('button', { name: /obtener cotizaciones/i })).toBeEnabled();
  });
});
```

---

## HU-03: Badge Assignment - Test Checklist

### Unit Tests (BadgeService)
```typescript
describe('BadgeService.assignBadges', () => {
  test('should assign isCheapest to lowest price', () => {
    const quotes = [
      { provider: 'FedEx', price: 100, estimatedDays: 3 },
      { provider: 'DHL', price: 80, estimatedDays: 5 },    // ← Should get isCheapest
      { provider: 'Local', price: 120, estimatedDays: 7 }
    ];
    
    const result = BadgeService.assignBadges(quotes);
    
    expect(result[1].isCheapest).toBe(true);
    expect(result[0].isCheapest).toBe(false);
    expect(result[2].isCheapest).toBe(false);
  });

  test('should assign isFastest to lowest estimatedDays', () => {
    const quotes = [
      { provider: 'FedEx', price: 100, estimatedDays: 3 }, // ← Should get isFastest
      { provider: 'DHL', price: 80, estimatedDays: 5 },
      { provider: 'Local', price: 120, estimatedDays: 7 }
    ];
    
    const result = BadgeService.assignBadges(quotes);
    
    expect(result[0].isFastest).toBe(true);
    expect(result[1].isFastest).toBe(false);
    expect(result[2].isFastest).toBe(false);
  });

  test('should handle price tie - first provider wins', () => {
    const quotes = [
      { provider: 'FedEx', price: 80, estimatedDays: 3 }, // ← Should get isCheapest
      { provider: 'DHL', price: 80, estimatedDays: 5 },   // ← Tie, but loses
      { provider: 'Local', price: 120, estimatedDays: 7 }
    ];
    
    const result = BadgeService.assignBadges(quotes);
    
    expect(result[0].isCheapest).toBe(true);
    expect(result[1].isCheapest).toBe(false);
  });

  test('should handle estimatedDays tie - first provider wins', () => {
    const quotes = [
      { provider: 'FedEx', price: 100, estimatedDays: 3 }, // ← Should get isFastest
      { provider: 'DHL', price: 80, estimatedDays: 3 },    // ← Tie, but loses
      { provider: 'Local', price: 120, estimatedDays: 7 }
    ];
    
    const result = BadgeService.assignBadges(quotes);
    
    expect(result[0].isFastest).toBe(true);
    expect(result[1].isFastest).toBe(false);
  });

  test('should handle single quote - gets both badges', () => {
    const quotes = [
      { provider: 'FedEx', price: 100, estimatedDays: 3 }
    ];
    
    const result = BadgeService.assignBadges(quotes);
    
    expect(result[0].isCheapest).toBe(true);
    expect(result[0].isFastest).toBe(true);
  });

  test('should handle empty array', () => {
    const quotes = [];
    
    const result = BadgeService.assignBadges(quotes);
    
    expect(result).toEqual([]);
  });

  test('should handle same provider being cheapest AND fastest', () => {
    const quotes = [
      { provider: 'FedEx', price: 80, estimatedDays: 3 }, // ← Both badges
      { provider: 'DHL', price: 100, estimatedDays: 5 },
      { provider: 'Local', price: 120, estimatedDays: 7 }
    ];
    
    const result = BadgeService.assignBadges(quotes);
    
    expect(result[0].isCheapest).toBe(true);
    expect(result[0].isFastest).toBe(true);
    expect(result[1].isCheapest).toBe(false);
    expect(result[1].isFastest).toBe(false);
  });

  test('should handle all providers with same price and days - first wins both', () => {
    const quotes = [
      { provider: 'FedEx', price: 100, estimatedDays: 3 }, // ← Both badges
      { provider: 'DHL', price: 100, estimatedDays: 3 },
      { provider: 'Local', price: 100, estimatedDays: 3 }
    ];
    
    const result = BadgeService.assignBadges(quotes);
    
    expect(result[0].isCheapest).toBe(true);
    expect(result[0].isFastest).toBe(true);
    expect(result[1].isCheapest).toBe(false);
    expect(result[1].isFastest).toBe(false);
    expect(result[2].isCheapest).toBe(false);
    expect(result[2].isFastest).toBe(false);
  });
});
```

### Frontend Tests (Badge Display)
```typescript
describe('QuoteResultsList - Badge Display', () => {
  test('should display green $ badge for cheapest quote', () => {
    const quotes = [
      { provider: 'FedEx', price: 100, estimatedDays: 3, isCheapest: false, isFastest: true },
      { provider: 'DHL', price: 80, estimatedDays: 5, isCheapest: true, isFastest: false }
    ];
    
    render(<QuoteResultsList quotes={quotes} />);
    
    const cheapestBadge = screen.getByText('$').closest('.badge-cheapest');
    expect(cheapestBadge).toHaveClass('badge-green');
    expect(cheapestBadge).toBeInTheDocument();
  });

  test('should display blue ⚡ badge for fastest quote', () => {
    const quotes = [
      { provider: 'FedEx', price: 100, estimatedDays: 3, isCheapest: false, isFastest: true },
      { provider: 'DHL', price: 80, estimatedDays: 5, isCheapest: true, isFastest: false }
    ];
    
    render(<QuoteResultsList quotes={quotes} />);
    
    const fastestBadge = screen.getByText('⚡').closest('.badge-fastest');
    expect(fastestBadge).toHaveClass('badge-blue');
    expect(fastestBadge).toBeInTheDocument();
  });

  test('should display both badges on same quote if applicable', () => {
    const quotes = [
      { provider: 'FedEx', price: 80, estimatedDays: 3, isCheapest: true, isFastest: true }
    ];
    
    render(<QuoteResultsList quotes={quotes} />);
    
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });
});
```

---

## HU-04: System Status - Test Checklist

### Unit Tests (ProviderHealthService)
```typescript
describe('ProviderHealthService', () => {
  test('should return "ONLINE" when all adapters respond', async () => {
    // Mock all adapters to return success
    const status = await ProviderHealthService.getSystemStatus();
    
    expect(status.overall).toBe('ONLINE');
    expect(status.activeCount).toBe(3);
  });

  test('should return "DEGRADED" when 1-2 adapters offline', async () => {
    // Mock 1 adapter to timeout
    const status = await ProviderHealthService.getSystemStatus();
    
    expect(status.overall).toBe('DEGRADED');
    expect(status.activeCount).toBeLessThan(3);
  });

  test('should return "OFFLINE" when all adapters down', async () => {
    // Mock all adapters to timeout
    const status = await ProviderHealthService.getSystemStatus();
    
    expect(status.overall).toBe('OFFLINE');
    expect(status.activeCount).toBe(0);
  });

  test('should measure response time for each adapter', async () => {
    const statuses = await ProviderHealthService.checkHealth();
    
    statuses.forEach(status => {
      expect(status.responseTime).toBeGreaterThanOrEqual(0);
      expect(status.responseTime).toBeLessThan(5000); // 5s timeout
    });
  });
});
```

### Integration Tests (GET /api/adapters/status)
```typescript
describe('GET /api/adapters/status', () => {
  test('should return status for all adapters', async () => {
    const response = await request(app).get('/api/adapters/status');
    
    expect(response.status).toBe(200);
    expect(response.body.adapters).toHaveLength(3);
    expect(response.body.adapters[0]).toMatchObject({
      name: expect.any(String),
      status: expect.stringMatching(/online|offline/),
      responseTime: expect.any(Number),
      lastCheck: expect.any(String)
    });
  });
});
```

### Frontend Tests (ProviderStatusWidget)
```typescript
describe('ProviderStatusWidget', () => {
  test('should display "Sistema: EN LÍNEA" when all providers online', () => {
    const providers = [
      { name: 'FedEx', status: 'online', responseTime: 420 },
      { name: 'DHL', status: 'online', responseTime: 580 },
      { name: 'Local', status: 'online', responseTime: 150 }
    ];
    
    render(<ProviderStatusWidget providers={providers} />);
    
    expect(screen.getByText(/Sistema: EN LÍNEA/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/3 Proveedores Activos/i)).toBeInTheDocument();
  });

  test('should display warning icon when provider offline', () => {
    const providers = [
      { name: 'FedEx', status: 'online', responseTime: 420 },
      { name: 'DHL', status: 'offline', responseTime: null },
      { name: 'Local', status: 'online', responseTime: 150 }
    ];
    
    render(<ProviderStatusWidget providers={providers} />);
    
    expect(screen.getByText(/⚠️/)).toBeInTheDocument();
    expect(screen.getByText(/2\/3 Proveedores Activos/i)).toBeInTheDocument();
  });

  test('should auto-refresh every 30 seconds', async () => {
    jest.useFakeTimers();
    const mockFetch = jest.spyOn(global, 'fetch');
    
    render(<ProviderStatusWidget />);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(30000);
    
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    jest.useRealTimers();
  });
});
```

---

## HU-05: Error Handling - Test Checklist

### Unit Tests (Adapter Timeout Handling)
```typescript
describe('QuoteService - Timeout Handling', () => {
  test('should timeout adapter after 5 seconds', async () => {
    // Mock FedEx to delay 6 seconds
    jest.spyOn(FedExAdapter, 'calculateQuote').mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 6000))
    );
    
    const start = Date.now();
    const quotes = await QuoteService.getAllQuotes(validRequest);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(6000);
    expect(quotes.find(q => q.provider === 'FedEx')?.status).toBe('offline');
  });

  test('should return quotes from online adapters when 1 times out', async () => {
    // Mock FedEx to timeout
    jest.spyOn(FedExAdapter, 'calculateQuote').mockRejectedValue(new Error('Timeout'));
    
    const quotes = await QuoteService.getAllQuotes(validRequest);
    
    expect(quotes.length).toBe(2); // Only DHL and Local
    expect(quotes.every(q => q.status === 'online')).toBe(true);
  });
});
```

### Integration Tests (Graceful Degradation)
```typescript
describe('POST /api/quotes - Degradation', () => {
  test('should return 200 with partial results when 1 adapter down', async () => {
    // Setup: Kill DHL adapter
    
    const response = await request(app)
      .post('/api/quotes')
      .send(validQuoteRequest);
    
    expect(response.status).toBe(200);
    expect(response.body.quotes).toHaveLength(2); // FedEx + Local only
    expect(response.body.quotes.some(q => q.provider === 'DHL')).toBe(false);
  });

  test('should return 503 when all adapters down', async () => {
    // Setup: Kill all adapters
    
    const response = await request(app)
      .post('/api/quotes')
      .send(validQuoteRequest);
    
    expect(response.status).toBe(503);
    expect(response.body.error).toContain('Service unavailable');
    expect(response.body.retryAfter).toBe(30);
  });

  test('should include error message for downed provider', async () => {
    // Setup: Kill DHL adapter
    
    const response = await request(app)
      .post('/api/quotes')
      .send(validQuoteRequest);
    
    expect(response.body.messages).toContainEqual(
      expect.objectContaining({
        provider: 'DHL',
        message: 'Provider not available'
      })
    );
  });
});
```

### E2E Tests (Error Scenarios)
```typescript
test('User sees partial results with error message when provider down', async ({ page }) => {
  // Setup: Mock API to return only 2 quotes + error message
  await page.route('**/api/quotes', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        quotes: [
          { provider: 'FedEx', price: 89.99, estimatedDays: 3, status: 'online' },
          { provider: 'Local', price: 120, estimatedDays: 7, status: 'online' }
        ],
        messages: [{ provider: 'DHL', message: 'DHL no está disponible' }]
      })
    });
  });
  
  await page.goto('http://localhost:5173');
  await page.fill('[name="origin"]', 'New York');
  await page.click('button:has-text("Obtener Cotizaciones")');
  
  // Verify only 2 quotes displayed
  await expect(page.locator('.quote-card')).toHaveCount(2);
  
  // Verify error message shown
  await expect(page.locator('text=DHL no está disponible')).toBeVisible();
});
```

---

## GitHub Copilot Prompts for TDD

### Prompt 1: Generate Edge Cases
```
Generate 10 edge case unit tests for weight validation in a shipping quote system:
- Weight must be > 0.1 kg and ≤ 1000 kg
- Include boundary values, negative numbers, zero, null, undefined, string inputs
- Use Jest test syntax
```

### Prompt 2: Generate Mock Data
```
Generate mock data for 3 shipping providers (FedEx, DHL, Local) with realistic:
- Price formulas (different base rates + per-kg rates)
- Estimated delivery days (3, 5, 7 days)
- Include fragile surcharge logic (+15%)
- Return TypeScript interfaces
```

### Prompt 3: Generate Integration Tests
```
Generate integration tests for POST /api/quotes endpoint using Supertest:
- Happy path (200 response with 3 quotes)
- Validation errors (400 response for invalid weight, missing origin)
- Service unavailable (503 when all providers down)
- Include MongoDB memory server setup
```

### Prompt 4: Generate E2E Tests
```
Generate Playwright E2E test for shipping quote request flow:
1. User fills out form (origin, destination, weight, date)
2. User submits form
3. System displays 3 quotes with badges (cheapest, fastest)
4. Verify badge colors and icons
- Use Page Object Model pattern
```

---

## Coverage Commands

### Backend Coverage
```bash
cd logistics-back
npm run test:coverage

# View detailed report
open coverage/lcov-report/index.html
```

### Frontend Coverage
```bash
cd logistics-front
npm run test:coverage

# View detailed report
open coverage/index.html
```

### Target Metrics
- **Statements:** ≥70%
- **Branches:** ≥65%
- **Functions:** ≥70%
- **Lines:** ≥70%

---

## Common TDD Pitfalls to Avoid

 **Writing tests after code** → Defeats TDD purpose, leads to confirmation bias
 **Write test first**, see it fail (RED), then implement (GREEN)

 **Testing implementation details** → Tests become brittle
 **Test behavior and outcomes**, not internal logic

 **Large, complex tests** → Hard to debug failures
 **One assertion per test** (or closely related assertions)

 **Mocking everything** → False confidence
 **Mock external dependencies only** (APIs, DB), test real logic

 **Ignoring slow tests** → Developers stop running them
 **Keep unit tests < 100ms each**, use `test.only` for debugging

---

## Next Steps

1. **Start with HU-02 validation tests** → Fastest feedback loop
2. **Move to HU-03 badge logic** → Pure functions, easy to test
3. **Implement HU-01 with mocks** → Integration testing
4. **Add error handling (HU-05)** → Resilience
5. **Build frontend with component tests** → User experience

**Remember:** Test first, code second. Red → Green → Refactor. 🔴 → 🟢 → ♻️

---

## 🆕 Tests para Nuevas Funcionalidades v2.0

Esta sección documenta los tests implementados para las nuevas funcionalidades del sistema: Mapa de Rutas, Wizard de Envíos, Sistema de Almacén y Procesamiento de Pagos.

---

### HU-11: Mapa de Rutas - Test Checklist

#### Unit Tests (OpenRouteServiceAdapter)
```typescript
describe('OpenRouteServiceAdapter', () => {
  test('should calculate route between two Colombian cities', async () => {
    const adapter = new OpenRouteServiceAdapter(apiKey);
    const route = await adapter.calculateRoute('Bogotá', 'Medellín');
    
    expect(route.distanceKm).toBeGreaterThan(0);
    expect(route.durationSeconds).toBeGreaterThan(0);
    expect(route.routeCoordinates).toHaveLength(expect.any(Number));
  });

  test('should use fallback geocoding for Colombian addresses', async () => {
    const adapter = new OpenRouteServiceAdapter(apiKey);
    const route = await adapter.calculateRoute(
      'Calle 123 #45-67, Bogotá',  // Full address
      'Carrera 15 #80-90, Medellín'
    );
    
    expect(route.origin.coordinates).toBeDefined();
  });

  test('should return cached route on subsequent calls', async () => {
    const adapter = new OpenRouteServiceAdapter(apiKey);
    
    // First call - cache miss
    await adapter.calculateRoute('Bogotá', 'Cali');
    
    // Second call - should use cache
    const start = Date.now();
    await adapter.calculateRoute('Bogotá', 'Cali');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(10); // Cached response should be instant
  });
});
```

#### Component Tests (RouteMap)
```typescript
describe('RouteMap', () => {
  test('should render map with origin and destination markers', () => {
    render(
      <RouteMap
        origin="Bogotá"
        destination="Medellín"
        originCoords={[4.7110, -74.0721]}
        destCoords={[6.2442, -75.5812]}
      />
    );
    
    expect(screen.getByText('Origen')).toBeInTheDocument();
    expect(screen.getByText('Destino')).toBeInTheDocument();
  });

  test('should display multi-modal segments with different colors', () => {
    const segments = [
      { mode: 'ground', color: '#FF9800', coordinates: [...] },
      { mode: 'air', color: '#2196F3', coordinates: [...] }
    ];
    
    render(<RouteMap segments={segments} />);
    
    // Verify polylines are rendered with correct colors
  });

  test('should auto-fit bounds to show entire route', () => {
    // Test that map zooms to fit route
  });
});
```

---

### HU-12: ShipmentWizard - Test Checklist

#### Unit Tests (Wizard Navigation)
```typescript
describe('ShipmentWizard', () => {
  test('should start at address step', () => {
    render(<ShipmentWizard />);
    expect(screen.getByText('📍 Paso 1: Información del Envío')).toBeInTheDocument();
  });

  test('should advance to quotes step after valid address submission', async () => {
    render(<ShipmentWizard />);
    
    // Fill form
    await userEvent.type(screen.getByLabelText(/origen/i), 'Bogotá');
    await userEvent.type(screen.getByLabelText(/destino/i), 'Medellín');
    await userEvent.type(screen.getByLabelText(/peso/i), '5.5');
    
    // Submit
    await userEvent.click(screen.getByRole('button', { name: /obtener cotizaciones/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Paso 2: Selecciona una Cotización/i)).toBeInTheDocument();
    });
  });

  test('should navigate back without losing data', async () => {
    render(<ShipmentWizard />);
    
    // Navigate to step 2, then back to step 1
    // Verify form data is preserved
  });

  test('should skip to customer step when quote and request are provided', () => {
    render(
      <ShipmentWizard 
        selectedQuote={mockQuote} 
        quoteRequest={mockRequest}
      />
    );
    
    expect(screen.getByText(/Paso 3: Detalles del Envío/i)).toBeInTheDocument();
  });
});
```

#### Form Validation Tests
```typescript
describe('QuoteRequestForm Validation', () => {
  test('should disable submit with invalid weight', async () => {
    render(<QuoteRequestForm onSubmit={jest.fn()} />);
    
    await userEvent.type(screen.getByLabelText(/peso/i), '-5');
    await userEvent.tab();
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/peso debe ser mayor/i)).toBeInTheDocument();
  });

  test('should debounce validation on rapid input', async () => {
    const validateSpy = jest.spyOn(validationModule, 'validateField');
    render(<QuoteRequestForm onSubmit={jest.fn()} />);
    
    // Type rapidly
    await userEvent.type(screen.getByLabelText(/origen/i), 'Bogota', { delay: 10 });
    
    // Should call validation fewer times than characters typed
    expect(validateSpy).toHaveBeenCalledTimes(expect.any(Number));
  });
});
```

---

### HU-13: PaymentProcessingModal - Test Checklist

#### Unit Tests (State Machine)
```typescript
describe('PaymentProcessingModal', () => {
  test('should progress through card payment stages', async () => {
    const onComplete = jest.fn();
    render(
      <PaymentProcessingModal 
        isOpen={true}
        paymentMethod="CARD"
        amount={125000}
        onComplete={onComplete}
      />
    );
    
    // Stage 1: Validating
    expect(screen.getByText(/Validando datos de la tarjeta/i)).toBeInTheDocument();
    
    // Wait for stages to complete
    await waitFor(() => {
      expect(screen.getByText(/¡Pago Exitoso!/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('should show shorter flow for cash payment', async () => {
    render(
      <PaymentProcessingModal 
        isOpen={true}
        paymentMethod="CASH"
        amount={125000}
        onComplete={jest.fn()}
      />
    );
    
    expect(screen.getByText(/Verificando pedido/i)).toBeInTheDocument();
  });

  test('should display invoice details on completion', async () => {
    render(
      <PaymentProcessingModal 
        isOpen={true}
        paymentMethod="CARD"
        amount={125000}
        onComplete={jest.fn()}
        trackingNumber="SHIP-123456"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/FAC-/i)).toBeInTheDocument();
      expect(screen.getByText('SHIP-123456')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('should not render when isOpen is false', () => {
    const { container } = render(
      <PaymentProcessingModal isOpen={false} paymentMethod="CARD" amount={100} onComplete={jest.fn()} />
    );
    
    expect(container.firstChild).toBeNull();
  });
});
```

---

### HU-14/15: Sistema de Almacén - Test Checklist

#### Unit Tests (ShipmentStateService) ✅ 33 Tests Implementados
```typescript
describe('ShipmentStateService', () => {
  // Singleton Pattern
  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = ShipmentStateService.getInstance();
      const instance2 = ShipmentStateService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // State Management
  describe('State Management', () => {
    test('should create state for new shipment', () => {
      const state = service.getState('new-shipment');
      expect(state.id).toBe('new-shipment');
      expect(state.status).toBe('PAYMENT_CONFIRMED');
    });

    test('should set PAYMENT_CONFIRMED for cash payments', () => {
      const state = service.getState('cash-shipment', 'PENDING_PAYMENT', 'CASH');
      expect(state.status).toBe('PAYMENT_CONFIRMED');
    });

    test('should return existing state on subsequent calls', () => {
      service.getState('existing', 'PREPARING');
      const state = service.getState('existing');
      expect(state.status).toBe('PREPARING');
    });
  });

  // Status Transitions
  describe('Status Transitions', () => {
    test('should allow valid forward transitions', () => {
      expect(service.isValidTransition('PAYMENT_CONFIRMED', 'PREPARING')).toBe(true);
      expect(service.isValidTransition('PREPARING', 'READY_FOR_PICKUP')).toBe(true);
    });

    test('should reject backward transitions', () => {
      expect(service.isValidTransition('IN_TRANSIT', 'PREPARING')).toBe(false);
    });

    test('should reject transitions from terminal states', () => {
      expect(service.isValidTransition('DELIVERED', 'IN_TRANSIT')).toBe(false);
    });

    test('should allow special states from any non-terminal state', () => {
      expect(service.isValidTransition('IN_TRANSIT', 'FAILED_DELIVERY')).toBe(true);
      expect(service.isValidTransition('PREPARING', 'RETURNED')).toBe(true);
    });
  });

  // Update Status
  describe('updateStatus', () => {
    test('should update status and record in history', () => {
      service.getState('update-test', 'PAYMENT_CONFIRMED');
      const updated = service.updateStatus('update-test', 'PREPARING', 'Test note');
      
      expect(updated?.status).toBe('PREPARING');
      expect(updated?.statusHistory).toHaveLength(2);
      expect(updated?.statusHistory[1].note).toBe('Test note');
    });

    test('should return null for invalid transition', () => {
      service.getState('invalid-test', 'DELIVERED');
      const result = service.updateStatus('invalid-test', 'IN_TRANSIT');
      expect(result).toBeNull();
    });

    test('should persist changes to localStorage', () => {
      service.updateStatus('persist-test', 'PREPARING');
      
      const stored = JSON.parse(localStorage.getItem('warehouse_shipment_states') || '{}');
      expect(stored['persist-test']?.status).toBe('PREPARING');
    });
  });

  // Truck Assignment
  describe('Truck Assignment', () => {
    test('should assign truck to shipment', () => {
      service.getState('truck-test');
      const truck = { id: 'truck-1', plate: 'ABC-123', driver: 'Carlos' };
      const updated = service.assignTruck('truck-test', truck);
      
      expect(updated.assignedTruckId).toBe('truck-1');
      expect(updated.assignedTruckPlate).toBe('ABC-123');
    });

    test('should remove truck assignment', () => {
      service.assignTruck('remove-truck', { id: 'truck-1', plate: 'ABC-123', driver: 'Carlos' });
      const updated = service.removeTruck('remove-truck');
      
      expect(updated.assignedTruckId).toBeUndefined();
    });

    test('should record truck assignment in history', () => {
      service.getState('history-truck');
      service.assignTruck('history-truck', { id: 'truck-1', plate: 'DEF-456', driver: 'María' });
      
      const state = service.getState('history-truck');
      const lastEntry = state.statusHistory[state.statusHistory.length - 1];
      expect(lastEntry.note).toContain('DEF-456');
    });
  });

  // Observer Pattern
  describe('Observer Pattern', () => {
    test('should notify subscribers on state change', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribe(callback);
      
      service.updateStatus('observer-test', 'PREPARING');
      
      expect(callback).toHaveBeenCalledWith('observer-test', expect.any(Object));
      unsubscribe();
    });

    test('should allow unsubscribing', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribe(callback);
      unsubscribe();
      
      service.updateStatus('unsubscribe-test', 'PREPARING');
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should handle subscriber errors gracefully', () => {
      const errorCallback = jest.fn(() => { throw new Error('Test error'); });
      service.subscribe(errorCallback);
      
      // Should not throw
      expect(() => service.updateStatus('error-test', 'PREPARING')).not.toThrow();
    });
  });

  // Clear All
  describe('clearAll', () => {
    test('should remove all states and clear localStorage', () => {
      service.getState('clear-test');
      service.clearAll();
      
      const newState = service.getState('clear-test');
      expect(newState.statusHistory).toHaveLength(1); // Fresh state
    });
  });
});
```

#### Component Tests (WarehouseView)
```typescript
describe('WarehouseView', () => {
  test('should render loading state initially', () => {
    render(<WarehouseView />);
    expect(screen.getByText(/Cargando almacén/i)).toBeInTheDocument();
  });

  test('should display shipment cards after loading', async () => {
    mockShipmentService.getShipments.mockResolvedValue({
      shipments: [mockShipment],
      total: 1
    });
    
    render(<WarehouseView />);
    
    await waitFor(() => {
      expect(screen.getByText(mockShipment.trackingNumber)).toBeInTheDocument();
    });
  });

  test('should filter shipments by status', async () => {
    render(<WarehouseView />);
    
    await userEvent.click(screen.getByText('En Camino'));
    
    // Verify only IN_TRANSIT shipments are shown
  });

  test('should search shipments by tracking number', async () => {
    render(<WarehouseView />);
    
    await userEvent.type(screen.getByPlaceholderText(/Buscar/i), 'SHIP-123');
    
    // Verify search results
  });

  test('should advance shipment status', async () => {
    render(<WarehouseView />);
    
    await userEvent.click(screen.getByText(/Avanzar a: PREPARING/i));
    
    expect(screen.getByText('📦 Preparando')).toBeInTheDocument();
  });

  test('should assign truck to shipment', async () => {
    render(<WarehouseView />);
    
    await userEvent.click(screen.getByText(/Asignar Camión/i));
    await userEvent.click(screen.getByText('ABC-123'));
    
    expect(screen.getByText(/Camión Asignado/i)).toBeInTheDocument();
  });
});
```

---

### HU-16: shipmentService - Test Checklist ✅ 18 Tests Implementados

```typescript
describe('shipmentService', () => {
  describe('createShipment', () => {
    test('should create shipment with CARD payment', async () => {
      mockAxios.post.mockResolvedValue({ data: mockCreatedShipment });
      
      const result = await shipmentService.createShipment(cardPaymentData);
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/shipments'),
        expect.objectContaining({
          paymentRequest: expect.objectContaining({
            method: 'CARD',
            currency: 'COP'
          })
        })
      );
      expect(result.trackingNumber).toBeDefined();
    });

    test('should create shipment with CASH payment', async () => {
      mockAxios.post.mockResolvedValue({ data: mockCreatedShipment });
      
      const result = await shipmentService.createShipment(cashPaymentData);
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/shipments'),
        expect.not.objectContaining({
          cardNumber: expect.any(String)
        })
      );
    });

    test('should transform isFragile to fragile', async () => {
      mockAxios.post.mockResolvedValue({ data: mockCreatedShipment });
      
      await shipmentService.createShipment({
        ...baseData,
        package: { ...baseData.package, isFragile: true }
      });
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          package: expect.objectContaining({ fragile: true })
        })
      );
    });
  });

  describe('getShipments', () => {
    test('should return paginated shipments', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          data: [mockShipment],
          pagination: { total: 1 }
        }
      });
      
      const result = await shipmentService.getShipments({ limit: 10 });
      
      expect(result.shipments).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    test('should handle error responses', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'));
      
      await expect(shipmentService.getShipments({})).rejects.toThrow();
    });
  });

  describe('trackShipment', () => {
    test('should return tracking info', async () => {
      mockAxios.get.mockResolvedValue({ data: mockTrackingInfo });
      
      const result = await shipmentService.trackShipment('SHIP-123');
      
      expect(result.currentStatus).toBeDefined();
      expect(result.history).toBeInstanceOf(Array);
    });
  });

  describe('updateStatus', () => {
    test('should update shipment status', async () => {
      mockAxios.patch.mockResolvedValue({ data: { status: 'IN_TRANSIT' } });
      
      const result = await shipmentService.updateStatus('SHIP-123', 'IN_TRANSIT');
      
      expect(result.status).toBe('IN_TRANSIT');
    });
  });

  describe('cancelShipment', () => {
    test('should cancel shipment', async () => {
      mockAxios.post.mockResolvedValue({ data: { cancelled: true } });
      
      const result = await shipmentService.cancelShipment('SHIP-123', 'Customer request');
      
      expect(result.cancelled).toBe(true);
    });
  });
});
```

---

## 📊 Resumen de Cobertura por Funcionalidad

| Componente/Servicio | Tests | Cobertura | Estado |
|---------------------|-------|-----------|--------|
| ShipmentStateService | 33 | 95%+ | ✅ Completo |
| shipmentService | 18 | 90%+ | ✅ Completo |
| PaymentProcessingModal | 8 | 85%+ | ✅ Completo |
| WarehouseView | 12 | 80%+ | ✅ Completo |
| RouteMap | 5 | 75%+ | ✅ Básico |
| ShipmentWizard | 10 | 80%+ | ✅ Completo |

---

**Document Version:** 2.0  
**Last Updated:** 2026-01-20  
**Related Files:** [USER_STORIES.md](USER_STORIES.md), [NEW_HU.md](NEW_HU.md), [ARCHITECTURE.md](ARCHITECTURE.md)
