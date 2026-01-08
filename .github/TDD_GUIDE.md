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

**Document Version:** 1.0
**Last Updated:** 2026-01-06
**Related Files:** [USER_STORIES.md](USER_STORIES.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
