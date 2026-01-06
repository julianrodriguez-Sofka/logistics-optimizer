---
title: HU-03 - Identificar la Mejor Opción de Envío
version: 1.0
date_created: 2026-01-06
last_updated: 2026-01-06
---

# Implementation Plan: HU-03 - Identificar la Mejor Opción

**User Story:** Como usuario del sistema, quiero identificar rápidamente cuál es la opción más económica y cuál es la más rápida, para tomar una decisión basada en mis prioridades.

**Reference:** [USER_STORIES.md](../USER_STORIES.md#hu-03-identificar-la-mejor-opción-de-envío)

---

## Architecture and Design

### Components Involved
- **Application Layer:** `BadgeService` (pure function - no side effects)
- **Domain Layer:** `Quote` entity (properties `isCheapest`, `isFastest`)
- **Frontend:** Badge display components

### Badge Logic Rules

**isCheapest:**
- Quote with lowest `price` gets `isCheapest: true`
- All others get `isCheapest: false`
- **Tie-breaker:** First in array wins

**isFastest:**
- Quote with lowest `estimatedDays` gets `isFastest: true`
- All others get `isFastest: false`
- **Tie-breaker:** First in array wins

**Edge Cases:**
- Single quote: Gets both badges
- Empty array: Return empty array
- Same provider is cheapest AND fastest: Gets both badges
- All providers have same price/days: First gets badges

### Design Pattern
- **Strategy Pattern:** Badge assignment is encapsulated in service
- **Immutability:** Return new array with modified quotes (don't mutate input)

---

## Tasks

### Backend Implementation

- [ ] **Task 3.1:** Create `BadgeService.assignBadges()` method
  - Input: `Quote[]`
  - Output: `Quote[]` with badges assigned
  - Logic: Find min price → set `isCheapest`, find min days → set `isFastest`
  - **Test:** No tie - correct badges assigned
  - **Test:** Price tie - first provider wins `isCheapest`
  - **Test:** Days tie - first provider wins `isFastest`
  - **Test:** Both tie - first provider wins both badges
  - **Test:** Single quote - gets both badges
  - **Test:** Empty array - returns empty array
  - **Test:** Same provider cheapest AND fastest - gets both
  - **Test:** All same - first gets both badges
  - **Location:** `src/application/services/BadgeService.ts`

- [ ] **Task 3.2:** Integrate BadgeService in QuoteController
  - Call after `QuoteService.getAllQuotes()`
  - Before returning response
  - **Test:** Integration test - verify badges in response
  - **Location:** `src/infrastructure/controllers/QuoteController.ts`

### Frontend Implementation

- [ ] **Task 3.3:** Create `QuoteBadge` component
  - Props: `type` ('cheapest' | 'fastest'), `visible` (boolean)
  - Visual: Green "$" for cheapest, Blue "⚡" for fastest
  - Conditional rendering based on `visible`
  - **Test:** Snapshot test - cheapest badge
  - **Test:** Snapshot test - fastest badge
  - **Test:** Snapshot test - both badges
  - **Location:** `src/presentation/components/QuoteBadge.tsx`

- [ ] **Task 3.4:** Integrate badges in `QuoteResultsList`
  - Display `QuoteBadge` for each quote based on flags
  - Position badges prominently (e.g., top-right of quote card)
  - **Test:** Unit test - badge displays when `isCheapest: true`
  - **Test:** Unit test - badge hidden when `isCheapest: false`
  - **Location:** `src/presentation/components/QuoteResultsList.tsx`

- [ ] **Task 3.5:** Add badge styling
  - Cheapest: Green background (#10B981), white "$" icon
  - Fastest: Blue background (#3B82F6), white "⚡" icon
  - Hover effect: Tooltip explaining badge
  - **Test:** Visual regression test (optional)
  - **Location:** `src/presentation/components/QuoteBadge.css`

### Edge Case Tests (AI-Assisted)

- [ ] **Task 3.6:** Use GitHub Copilot for tie-breaker tests
  - Prompt: "Generate test cases where multiple providers have same price AND same estimatedDays. Verify first provider wins both badges."
  - **Test:** Add to `BadgeService.spec.ts`

- [ ] **Task 3.7:** Generate tests for filtering scenarios
  - Prompt: "Generate tests for badge reassignment after filtering quotes (e.g., user filters to show only 2 providers - badges should recalculate)"
  - **Test:** Add to integration test suite (for HU-07)

---

## Open Questions

### 1. Badge Persistence After Sorting/Filtering
**Question:** When user sorts/filters quotes, should badges be recalculated?

**Scenario:** User has 3 quotes (FedEx is cheapest), then filters to show only DHL and Local. Should DHL now get the "cheapest" badge?

**Options:**
- **Option A:** Recalculate badges based on visible quotes
- **Option B:** Keep original badges (shows cheapest overall, even if filtered out)

**Recommendation:** Option A (recalculate) - better UX, shows "best of what's visible"

**Decision Required By:** Before implementing HU-07 (sorting/filtering)

---

### 2. Visual Accessibility
**Question:** Should badges have text labels in addition to icons for accessibility?

**Current:** Icon only ("$", "⚡")
**Alternative:** Icon + text ("Más Barata", "Más Rápida")

**Recommendation:** Add `aria-label` for screen readers, keep icon-only visually (cleaner UI)

**Decision:** Implement aria-label, defer text labels to post-MVP

---

## Acceptance Criteria (from USER_STORIES.md)

**Scenario 1: Cheapest badge**
```gherkin
Given que he recibido cotizaciones de múltiples proveedores
When el sistema procesa los resultados
Then debe haber exactamente UNA cotización marcada como "Más Barata"
And esta debe tener una insignia visual distintiva (badge verde con "$")
And debe ser la que tiene el precio más bajo
```

**Scenario 2: Fastest badge**
```gherkin
Given que he recibido cotizaciones de múltiples proveedores
When el sistema procesa los resultados
Then debe haber exactamente UNA cotización marcada como "Más Rápida"
And esta debe tener una insignia visual distintiva (badge azul con "⚡")
And debe ser la que tiene el menor tiempo de entrega en días
```

**Scenario 3: Price tie**
```gherkin
Given que dos proveedores ofrecen el mismo precio (el más bajo)
When el sistema determina la opción más barata
Then el primer proveedor en la lista debe recibir la insignia "Más Barata"
```

**Scenario 4: Days tie**
```gherkin
Given que dos proveedores ofrecen el mismo tiempo de entrega (el más corto)
When el sistema determina la opción más rápida
Then el primer proveedor en la lista debe recibir la insignia "Más Rápida"
```

---

## Success Metrics

- [ ] 8+ unit tests for `BadgeService` (all edge cases covered)
- [ ] 100% code coverage on badge logic
- [ ] Badges display correctly in 100% of test scenarios
- [ ] Tie-breaker logic verified with 5+ test cases
- [ ] Visual badges render consistently across browsers

---

## Dependencies

**Requires:**
- HU-01: Quotes must be retrieved before badges can be assigned

**Blocks:**
- HU-07: Sorting/filtering may require badge recalculation

---

## Related Documentation

- [USER_STORIES.md - HU-03](../USER_STORIES.md#hu-03-identificar-la-mejor-opción-de-envío)
- [TDD_GUIDE.md - HU-03 Tests](../TDD_GUIDE.md#hu-03-badge-assignment---test-checklist)
- [PRODUCT.md - Badge Logic](../PRODUCT.md#badge-logic)
