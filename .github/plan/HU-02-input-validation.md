---
title: HU-02 - Validación de Datos de Envío
version: 1.0
date_created: 2026-01-06
last_updated: 2026-01-06
---

# Implementation Plan: HU-02 - Validación de Datos de Envío

**User Story:** Como usuario del sistema, quiero recibir retroalimentación inmediata cuando ingreso datos inválidos, para corregirlos antes de solicitar cotizaciones y evitar errores.

**Reference:** [USER_STORIES.md](../USER_STORIES.md#hu-02-validación-de-datos-de-envío)

---

## Architecture and Design

### Components Involved
- **Domain Layer:** `QuoteRequest` entity with embedded validation rules
- **API Layer:** Validation middleware for Express
- **Frontend:** Real-time form validation in React

### Validation Rules (from ARCHITECTURE.md)

| Field | Rule | Error Message |
|:---|:---|:---|
| **weight** | > 0.1 kg AND ≤ 1000 kg | "El peso debe ser mayor a 0.1 kg y menor o igual a 1000 kg" |
| **pickupDate** | >= today AND <= today + 30 days | "La fecha debe ser entre hoy y 30 días en el futuro" |
| **origin** | non-empty string | "El origen es requerido" |
| **destination** | non-empty string | "El destino es requerido" |
| **fragile** | boolean (optional) | N/A |

### Design Pattern
- **Value Object Pattern:** `QuoteRequest` validates itself in constructor
- **Fail-Fast:** Throw `ValidationError` immediately on invalid input
- **Frontend Validation:** Mirror backend rules for UX (prevent unnecessary API calls)

---

## Tasks

### Backend Implementation

- [ ] **Task 2.1:** Create `ValidationError` custom exception
  - Properties: `message`, `field`, `value`
  - **Test:** Error instantiation and serialization
  - **Location:** `src/domain/exceptions/ValidationError.ts`

- [ ] **Task 2.2:** Create `QuoteRequest` entity with validation
  - Properties: `origin`, `destination`, `weight`, `pickupDate`, `fragile`
  - Validate in constructor (fail-fast)
  - **Test:** Valid input → no error
  - **Test:** Invalid weight (≤0, >1000, null, undefined, string)
  - **Test:** Invalid date (past, >30 days, invalid format)
  - **Test:** Missing origin/destination
  - **Test:** Invalid fragile type (non-boolean)
  - **Location:** `src/domain/entities/QuoteRequest.ts`

- [ ] **Task 2.3:** Create validation middleware for Express
  - Intercept request body before controller
  - Try to instantiate `QuoteRequest`
  - Catch `ValidationError` → return 400 with details
  - **Test:** Valid request → next() called
  - **Test:** Invalid request → 400 response with error details
  - **Location:** `src/infrastructure/middlewares/validateQuoteRequest.ts`

- [ ] **Task 2.4:** Add validation middleware to POST /api/quotes route
  - Apply middleware before controller
  - **Test:** Integration test - invalid weight returns 400
  - **Test:** Integration test - missing origin returns 400
  - **Test:** Integration test - past date returns 400

### Frontend Implementation

- [ ] **Task 2.5:** Create validation hooks for form
  - `useWeightValidation(weight)`: Check 0.1-1000 range
  - `useDateValidation(date)`: Check today to +30 days
  - `useRequiredValidation(value)`: Check non-empty
  - **Test:** Unit test each hook with valid/invalid inputs
  - **Location:** `src/presentation/hooks/useFormValidation.ts`

- [ ] **Task 2.6:** Implement real-time validation in `QuoteRequestForm`
  - Show error message below field on blur
  - Mark invalid fields with red border
  - Disable submit button if any field invalid
  - **Test:** Unit test - invalid input shows error
  - **Test:** Unit test - submit button disabled when invalid
  - **Test:** E2E test - user cannot submit invalid form
  - **Location:** `src/presentation/components/QuoteRequestForm.tsx`

- [ ] **Task 2.7:** Create `ValidationMessage` component
  - Props: `message`, `type` (error/warning/info)
  - Visual styling: red text + icon for errors
  - **Test:** Snapshot test - error state
  - **Test:** Snapshot test - warning state
  - **Location:** `src/presentation/components/ValidationMessage.tsx`

### Edge Case Tests (AI-Assisted)

- [ ] **Task 2.8:** Use GitHub Copilot to generate edge case tests
  - Prompt: "Generate 15 edge case tests for weight validation: negative, zero, 0.099, 0.1, 999.999, 1000, 1000.001, null, undefined, string, object, array, NaN, Infinity"
  - **Test:** Add generated tests to `QuoteRequest.spec.ts`
  - **Expected:** All edge cases handled gracefully

- [ ] **Task 2.9:** Generate date edge case tests with Copilot
  - Prompt: "Generate edge cases for date validation: yesterday, today, tomorrow, 30 days from now, 31 days from now, invalid date string, null, undefined"
  - **Test:** Add to test suite

---

## Open Questions

### 1. Validation Error Aggregation
**Question:** Should we return ALL validation errors at once, or stop at first error?

**Options:**
- **Option A:** Fail-fast (return first error only) - simpler, faster
- **Option B:** Aggregate all errors (return array of errors) - better UX

**Current Implementation:** Option A (fail-fast in constructor)
**Recommendation:** Keep Option A for backend, implement Option B in frontend

**Decision:** Backend uses fail-fast, Frontend validates all fields and shows all errors

---

### 2. Date Format
**Question:** Should we accept multiple date formats (ISO 8601, MM/DD/YYYY, DD/MM/YYYY)?

**Current:** ISO 8601 only (YYYY-MM-DD)
**Alternative:** Parse multiple formats with library (e.g., date-fns)

**Decision:** ISO 8601 only for MVP (simplicity), frontend date picker enforces this

---

## Acceptance Criteria (from USER_STORIES.md)

**Scenario 1: Weight validation**
```gherkin
Given que estoy ingresando datos de envío
When ingreso un peso menor a 0.1 kg
Then debo ver un mensaje de error: "El peso debe ser mayor a 0.1 kg"
And el campo de peso debe marcarse visualmente como inválido
And el botón "Obtener Cotizaciones" debe estar deshabilitado

When ingreso un peso mayor a 1000 kg
Then debo ver un mensaje de error: "El peso máximo permitido es 1000 kg"
And el campo de peso debe marcarse visualmente como inválido
```

**Scenario 2: Date validation**
```gherkin
Given que estoy ingresando la fecha de recolección
When selecciono una fecha anterior a hoy
Then debo ver un mensaje: "La fecha no puede ser anterior a hoy"
And el campo de fecha debe marcarse como inválido

When selecciono una fecha más de 30 días en el futuro
Then debo ver un mensaje: "La fecha no puede ser mayor a 30 días"
And el campo de fecha debe marcarse como inválido
```

**Scenario 3: Required field validation**
```gherkin
Given que estoy completando los campos de dirección
When intento dejar el campo de origen vacío
Then debo ver el mensaje: "El origen es requerido"
When intento dejar el campo de destino vacío
Then debo ver el mensaje: "El destino es requerido"
```

---

## Success Metrics

- [ ] 15+ unit tests for validation rules (all passing)
- [ ] 100% code coverage on `QuoteRequest` entity
- [ ] Frontend prevents 100% of invalid submissions
- [ ] Backend returns detailed 400 errors for invalid input
- [ ] Zero false positives (valid input rejected)
- [ ] Zero false negatives (invalid input accepted)

---

## Dependencies

**Requires:**
- None (foundational - implement first)

**Blocks:**
- HU-01: Quote request needs validation before processing
- All other HUs depend on validated input

---

## Related Documentation

- [USER_STORIES.md - HU-02](../USER_STORIES.md#hu-02-validación-de-datos-de-envío)
- [ARCHITECTURE.md - Data Contracts](../ARCHITECTURE.md#data-contracts-typescript-interfaces)
- [TDD_GUIDE.md - HU-02 Tests](../TDD_GUIDE.md#hu-02-input-validation---test-checklist)
- [PRODUCT.md - Input Validation](../PRODUCT.md#1-data-flow-specification)
