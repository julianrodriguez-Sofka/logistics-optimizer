---
title: HU-01 - Solicitar Cotización de Envío
version: 1.0
date_created: 2026-01-06
last_updated: 2026-01-06
---

# Implementation Plan: HU-01 - Solicitar Cotización de Envío

**User Story:** Como usuario del sistema, quiero ingresar los detalles de mi envío (origen, destino, peso, fecha de recolección) para recibir cotizaciones de todos los proveedores disponibles.

**Reference:** [USER_STORIES.md](../USER_STORIES.md#hu-01-solicitar-cotización-de-envío)

---

## Architecture and Design

### Components Involved
- **Domain Layer:** `QuoteRequest`, `Quote` entities
- **Application Layer:** `QuoteService` (orchestrates quote retrieval)
- **Infrastructure Layer:** `FedExAdapter`, `DHLAdapter`, `LocalAdapter`
- **API Layer:** `POST /api/quotes` endpoint

### Data Flow
```
1. User submits form (origin, destination, weight, pickupDate, fragile)
2. Controller validates via QuoteRequest entity
3. QuoteService.getAllQuotes() calls all adapters in parallel
4. Each adapter calculates quote (with 5s timeout)
5. BadgeService assigns cheapest/fastest tags
6. Controller returns JSON with quotes array
```

### Design Patterns
- **Adapter Pattern:** Normalize different provider APIs to `IShippingProvider`
- **Promise.allSettled():** Parallel execution with graceful handling of failures
- **Strategy Pattern:** Each adapter encapsulates its pricing logic

---

## Tasks

### Backend Implementation

- [ ] **Task 1.1:** Create `Quote` entity
  - Properties: `provider`, `price`, `estimatedDays`, `isCheapest`, `isFastest`, `status`
  - **Test:** Entity instantiation and property assignment
  - **Location:** `src/domain/entities/Quote.ts`

- [ ] **Task 1.2:** Create `FedExAdapter` (mock)
  - Rate formula: `basePrice(50) + weight * 3.5`
  - EstimatedDays: 3 days
  - **Test:** Verify output matches `Quote` entity structure
  - **Test:** Verify fragile surcharge (+15%)
  - **Location:** `src/infrastructure/adapters/FedExAdapter.ts`

- [ ] **Task 1.3:** Create `DHLAdapter` (mock)
  - Rate formula: `basePrice(45) + weight * 4.0`
  - EstimatedDays: 5 days
  - **Test:** Verify output matches `Quote` entity structure
  - **Test:** Verify fragile surcharge (+15%)
  - **Location:** `src/infrastructure/adapters/DHLAdapter.ts`

- [ ] **Task 1.4:** Create `LocalAdapter` (mock)
  - Rate formula: `basePrice(60) + weight * 2.5`
  - EstimatedDays: 7 days
  - **Test:** Verify output matches `Quote` entity structure
  - **Test:** Verify fragile surcharge (+15%)
  - **Location:** `src/infrastructure/adapters/LocalAdapter.ts`

- [ ] **Task 1.5:** Implement `QuoteService.getAllQuotes()`
  - Use `Promise.allSettled()` for parallel calls
  - Handle fulfilled and rejected promises
  - Apply fragile surcharge if `fragile: true`
  - **Test:** All adapters online → return 3 quotes
  - **Test:** One adapter offline → return 2 quotes
  - **Test:** Fragile flag → prices increased by 15%
  - **Location:** `src/application/services/QuoteService.ts`

- [ ] **Task 1.6:** Create `POST /api/quotes` endpoint
  - Validate input via `QuoteRequest` entity
  - Call `QuoteService.getAllQuotes()`
  - Call `BadgeService.assignBadges()`
  - Return standardized JSON response
  - **Test:** Integration test - happy path (200 response)
  - **Test:** Integration test - validation error (400 response)
  - **Test:** Integration test - all providers down (503 response)
  - **Location:** `src/infrastructure/controllers/QuoteController.ts`

### Frontend Implementation

- [ ] **Task 1.7:** Create `QuoteRequestForm` component
  - Fields: origin, destination, weight, pickupDate, fragile checkbox
  - Real-time validation with error messages
  - Disable submit button if invalid
  - **Test:** Unit test - form validation logic
  - **Test:** E2E test - form submission flow
  - **Location:** `src/presentation/components/QuoteRequestForm.tsx`

- [ ] **Task 1.8:** Implement API client service
  - Method: `requestQuotes(data: QuoteRequest): Promise<QuoteResponse>`
  - Error handling for network failures
  - **Test:** Mock fetch calls and verify request format
  - **Location:** `src/services/quoteService.ts`

- [ ] **Task 1.9:** Create `QuoteResultsList` component
  - Display array of quotes in card format
  - Show provider, price, estimated days
  - Display badges (handled by HU-03 tasks)
  - **Test:** Unit test - renders correct number of quotes
  - **Test:** Snapshot test - component structure
  - **Location:** `src/presentation/components/QuoteResultsList.tsx`

### Integration & E2E Testing

- [ ] **Task 1.10:** E2E test - Complete quote request flow
  - User fills form with valid data
  - Submits form
  - Verifies 3 quotes displayed
  - Verifies response time < 3 seconds
  - **Location:** `tests/e2e/quote-request.spec.ts`

---

## Open Questions

### 1. Response Time Optimization
**Question:** If all adapters are responding slowly, should we implement progressive rendering (show quotes as they arrive)?

**Options:**
- **Option A:** Wait for all quotes (current design, < 3s total)
- **Option B:** Progressive rendering (show quotes as each adapter responds)

**Recommendation:** Option A for MVP (simpler), consider Option B if user feedback requests it.

**Decision:** Deferred to post-MVP user testing

---

### 2. Fragile Surcharge Application
**Question:** Should fragile surcharge be applied before or after provider calculation?

**Current:** Applied by QuoteService after adapter returns base price
**Alternative:** Pass fragile flag to adapter, let adapter calculate

**Decision:** Keep current approach (separation of concerns - adapters don't need business logic)

---

## Acceptance Criteria (from USER_STORIES.md)

**Scenario 1: Successful request with all providers available**
```gherkin
Given que estoy en la página de cotización
And todos los proveedores (FedEx, DHL, Local) están disponibles
When ingreso origen, destino, peso (5.5 kg), fecha (2026-01-10), frágil (No)
And presiono "Obtener Cotizaciones"
Then debo ver una lista con 3 cotizaciones
And cada cotización debe mostrar: proveedor, precio, días estimados
And el sistema debe resaltar la opción más barata
And el sistema debe resaltar la opción más rápida
And el tiempo de respuesta debe ser < 3 segundos
```

**Scenario 2: Request with fragile package**
```gherkin
Given que estoy en la página de cotización
When ingreso un envío marcado como "Frágil"
And completo todos los campos requeridos
And presiono "Obtener Cotizaciones"
Then las cotizaciones deben reflejar el cargo adicional (+15%)
And debo ver un indicador visual que identifica que es un envío frágil
```

---

## Success Metrics

- [ ] API response time < 3 seconds (all adapters online)
- [ ] Frontend renders results immediately after API response
- [ ] 100% of acceptance criteria tests passing
- [ ] Integration test coverage for endpoint: 100%
- [ ] Unit test coverage for adapters: 100%

---

## Dependencies

**Requires:**
- HU-02: Validation logic must be implemented first
- HU-03: Badge assignment logic (can be implemented in parallel)

**Blocks:**
- HU-05: Error handling builds on this foundation
- HU-07: Sorting/filtering requires quotes to display first

---

## Related Documentation

- [USER_STORIES.md - HU-01](../USER_STORIES.md#hu-01-solicitar-cotización-de-envío)
- [ARCHITECTURE.md - Adapter Pattern](../ARCHITECTURE.md#adapter-pattern-implementation)
- [TDD_GUIDE.md - HU-01 Tests](../TDD_GUIDE.md#hu-01-quote-retrieval---test-checklist)
- [PRODUCT.md - API Contract](../PRODUCT.md#2-output-logic-response)
