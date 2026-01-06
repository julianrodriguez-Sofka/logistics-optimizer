---
title: HU-05 - Manejar Proveedores No Disponibles
version: 1.0
date_created: 2026-01-06
last_updated: 2026-01-06
---

# Implementation Plan: HU-05 - Manejar Proveedores No Disponibles

**User Story:** Como usuario del sistema, quiero recibir cotizaciones de los proveedores disponibles incluso si algunos están fuera de línea, para poder continuar con mi trabajo sin interrupciones.

**Reference:** [USER_STORIES.md](../USER_STORIES.md#hu-05-manejar-proveedores-no-disponibles)

---

## Architecture and Design

### Components Involved
- **Application Layer:** `QuoteService` (Promise.allSettled for graceful degradation)
- **API Layer:** Error handling middleware
- **Frontend:** Error message display, partial results rendering

### Graceful Degradation Strategy

**Promise.allSettled() Pattern:**
```typescript
// Instead of Promise.all() which fails if one adapter fails:
const results = await Promise.allSettled([
  fedexAdapter.calculateQuote(request),
  dhlAdapter.calculateQuote(request),
  localAdapter.calculateQuote(request)
]);

// Process fulfilled and rejected separately
const quotes = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

const errors = results
  .filter(r => r.status === 'rejected')
  .map(r => ({ provider: r.reason.provider, error: r.reason }));
```

### Timeout Handling
- Each adapter call wrapped in `Promise.race()` vs timeout promise
- Timeout threshold: 5 seconds per adapter
- Total request time: Max 5 seconds (adapters run in parallel)

### Response Scenarios

| Active Adapters | HTTP Status | Response |
|:---|:---|:---|
| 3/3 | 200 | Full quotes array |
| 1-2/3 | 200 | Partial quotes + messages array with offline providers |
| 0/3 | 503 | Error message + retryAfter: 30 |

---

## Tasks

### Backend Implementation

- [ ] **Task 5.1:** Implement timeout wrapper function
  - `withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>`
  - Uses `Promise.race()` against timeout promise
  - Throw `TimeoutError` if exceeded
  - **Test:** Normal promise resolves before timeout → success
  - **Test:** Slow promise → TimeoutError thrown
  - **Location:** `src/application/utils/timeout.ts`

- [ ] **Task 5.2:** Add timeout to adapter calls in QuoteService
  - Wrap each adapter call: `withTimeout(adapter.calculateQuote(...), 5000)`
  - **Test:** Adapter responds in 3s → quote returned
  - **Test:** Adapter responds in 6s → timeout, no quote
  - **Location:** `src/application/services/QuoteService.ts`

- [ ] **Task 5.3:** Implement Promise.allSettled in QuoteService
  - Replace `Promise.all()` with `Promise.allSettled()`
  - Separate fulfilled vs rejected promises
  - Return quotes from fulfilled + error messages from rejected
  - **Test:** All adapters succeed → 3 quotes
  - **Test:** 1 adapter fails → 2 quotes + 1 error message
  - **Test:** All adapters fail → 0 quotes + 3 error messages
  - **Location:** `src/application/services/QuoteService.ts`

- [ ] **Task 5.4:** Add offline provider tracking
  - For each rejected promise, create message object: `{ provider, message: "Provider not available" }`
  - Include in API response under `messages` array
  - **Test:** Verify messages array in response when adapter fails
  - **Location:** `src/infrastructure/controllers/QuoteController.ts`

- [ ] **Task 5.5:** Implement 503 response when all adapters offline
  - Check if quotes array is empty
  - Return 503 with: `{ error: "Service unavailable", retryAfter: 30 }`
  - **Test:** Integration test - all adapters down → 503 response
  - **Test:** Verify retryAfter header set
  - **Location:** `src/infrastructure/controllers/QuoteController.ts`

### Frontend Implementation

- [ ] **Task 5.6:** Display partial results with error messages
  - Show quotes from available providers
  - Below results, show list of offline providers: "DHL no está disponible temporalmente"
  - **Test:** Unit test - renders 2 quotes + 1 error message
  - **Location:** `src/presentation/components/QuoteResultsList.tsx`

- [ ] **Task 5.7:** Create `OfflineProviderMessage` component
  - Props: `providerName`, `message`
  - Visual: Yellow warning box with ⚠️ icon
  - **Test:** Snapshot test
  - **Location:** `src/presentation/components/OfflineProviderMessage.tsx`

- [ ] **Task 5.8:** Handle 503 error (all providers down)
  - Display error message: "El servicio no está disponible. Por favor, intente nuevamente en unos minutos."
  - Show "Reintentar" button that waits 30s and retries
  - Disable quote form while system is offline
  - **Test:** E2E test - 503 response → error message shown
  - **Test:** E2E test - retry button appears
  - **Location:** `src/presentation/components/QuoteRequestForm.tsx`

- [ ] **Task 5.9:** Add loading states with timeout feedback
  - Show loading spinner during API call
  - If taking > 3s, show message: "Obteniendo cotizaciones... esto puede tardar hasta 5 segundos"
  - **Test:** Unit test - message appears after 3s delay
  - **Location:** `src/presentation/components/QuoteRequestForm.tsx`

### Integration & Error Handling Tests

- [ ] **Task 5.10:** Integration test - one adapter timeout
  - Mock FedEx to delay 6 seconds
  - Verify response contains 2 quotes (DHL + Local)
  - Verify messages array contains FedEx error
  - **Location:** `tests/integration/quote-error-handling.spec.ts`

- [ ] **Task 5.11:** Integration test - all adapters timeout
  - Mock all adapters to delay 6 seconds
  - Verify 503 response
  - Verify retryAfter: 30
  - **Location:** `tests/integration/quote-error-handling.spec.ts`

- [ ] **Task 5.12:** E2E test - partial results user flow
  - Setup: Kill DHL adapter
  - User submits quote request
  - Verify 2 quotes displayed
  - Verify error message: "DHL no está disponible"
  - **Location:** `tests/e2e/error-handling.spec.ts`

---

## Open Questions

### 1. Retry Strategy
**Question:** Should the system automatically retry failed adapters?

**Options:**
- **Option A:** No auto-retry (current design) - user must manually retry
- **Option B:** Auto-retry once after 5 seconds
- **Option C:** Exponential backoff (retry after 5s, 10s, 20s)

**Recommendation:** Option A for MVP (simpler), consider Option B based on analytics

**Decision:** No auto-retry for MVP, defer to post-launch optimization

---

### 2. Error Logging
**Question:** Should adapter failures be logged to external service (e.g., Sentry)?

**Current:** Console.error only
**Alternative:** Integrate error tracking service

**Recommendation:** Add structured logging, integrate Sentry in Sprint 4

**Decision:** Console logging for MVP, add Sentry post-MVP

---

## Acceptance Criteria (from USER_STORIES.md)

**Scenario 1: One provider unavailable (graceful degradation)**
```gherkin
Given que FedEx no está disponible (timeout o error)
And DHL y Local están funcionando
When solicito una cotización
Then debo recibir cotizaciones solo de DHL y Local
And debo ver un mensaje informativo: "FedEx no está disponible en este momento"
And el proveedor FedEx debe aparecer en la lista con estado "Fuera de Línea"
And no debe mostrarse precio ni tiempo de entrega para FedEx
```

**Scenario 2: Two providers available**
```gherkin
Given que solo 2 de 3 proveedores están disponibles
When solicito cotizaciones
Then debo ver exactamente 2 cotizaciones válidas
And las insignias "Más Barata" y "Más Rápida" deben asignarse solo entre las opciones disponibles
```

**Scenario 3: No providers available**
```gherkin
Given que ningún proveedor está disponible
When intento solicitar una cotización
Then debo ver un mensaje de error: "El servicio no está disponible. Por favor, intente nuevamente en unos minutos."
And el sistema debe sugerir un tiempo de reintento (30 segundos)
And no debo ver la lista de cotizaciones
```

---

## Success Metrics

- [ ] 100% uptime for partial service (as long as 1+ adapter online)
- [ ] Timeout handling: 100% of slow adapters caught within 5s
- [ ] Error messages: 100% of offline providers reported to user
- [ ] User can complete task with partial results: 100% success rate
- [ ] Zero data corruption when adapters fail

---

## Dependencies

**Requires:**
- HU-01: Quote service must exist to add error handling
- HU-04: System status helps users understand why providers are offline

**Blocks:**
- None (this is a quality/resilience feature)

---

## Related Documentation

- [USER_STORIES.md - HU-05](../USER_STORIES.md#hu-05-manejar-proveedores-no-disponibles)
- [TDD_GUIDE.md - HU-05 Tests](../TDD_GUIDE.md#hu-05-error-handling---test-checklist)
- [PRODUCT.md - Error Handling](../PRODUCT.md#4-error-handling)
