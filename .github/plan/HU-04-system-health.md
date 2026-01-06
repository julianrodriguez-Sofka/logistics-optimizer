---
title: HU-04 - Visualizar Estado del Sistema
version: 1.0
date_created: 2026-01-06
last_updated: 2026-01-06
---

# Implementation Plan: HU-04 - Visualizar Estado del Sistema

**User Story:** Como usuario del sistema, quiero ver el estado de disponibilidad de los proveedores de envío, para saber qué opciones están activas y tomar decisiones informadas.

**Reference:** [USER_STORIES.md](../USER_STORIES.md#hu-04-visualizar-estado-del-sistema)

---

## Architecture and Design

### Components Involved
- **Domain Layer:** `ProviderStatus` entity
- **Application Layer:** `ProviderHealthService` (monitors adapters)
- **Infrastructure Layer:** `ProviderHealthRepository` (MongoDB persistence)
- **API Layer:** `GET /api/adapters/status` endpoint
- **Frontend:** `ProviderStatusWidget` component with auto-refresh

### System Status Logic

| Active Adapters | System Status | Display |
|:---|:---|:---|
| 3/3 | ONLINE | 🟢 "Sistema: EN LÍNEA" |
| 1-2/3 | DEGRADED | 🟡 "Sistema: DEGRADADO" |
| 0/3 | OFFLINE | 🔴 "Sistema: FUERA DE LÍNEA" |

### Health Check Strategy
- Ping each adapter every 30 seconds
- Measure response time
- Store last known status in MongoDB
- Frontend polls `/api/adapters/status` every 30 seconds

---

## Tasks

### Backend Implementation

- [ ] **Task 4.1:** Create `ProviderStatus` entity
  - Properties: `providerName`, `status` (online/offline), `responseTime`, `lastCheck`
  - **Test:** Entity instantiation
  - **Location:** `src/domain/entities/ProviderStatus.ts`

- [ ] **Task 4.2:** Create `ProviderHealthService.checkHealth()`
  - Ping each adapter with lightweight request (e.g., check if adapter instantiates)
  - Measure response time with `performance.now()`
  - Return array of `ProviderStatus`
  - **Test:** Mock adapters - all online → all statuses "online"
  - **Test:** Mock adapters - one timeout → one status "offline"
  - **Test:** Response time measured correctly
  - **Location:** `src/application/services/ProviderHealthService.ts`

- [ ] **Task 4.3:** Create `ProviderHealthRepository`
  - Method: `updateStatus(providerId, status)`
  - Method: `getLastStatus(providerId)`
  - MongoDB collection: `provider_health`
  - **Test:** Use MongoDB Memory Server
  - **Test:** Status saved and retrieved correctly
  - **Location:** `src/infrastructure/database/repositories/ProviderHealthRepository.ts`

- [ ] **Task 4.4:** Create `GET /api/adapters/status` endpoint
  - Call `ProviderHealthService.checkHealth()`
  - Save status to repository
  - Return JSON with adapter statuses
  - **Test:** Integration test - verify response format
  - **Test:** Integration test - verify DB persistence
  - **Location:** `src/infrastructure/controllers/HealthController.ts`

- [ ] **Task 4.5:** Calculate overall system status
  - Logic: 3/3 → ONLINE, 1-2/3 → DEGRADED, 0/3 → OFFLINE
  - Return in `/api/adapters/status` response
  - **Test:** All online → "ONLINE"
  - **Test:** One offline → "DEGRADED"
  - **Test:** All offline → "OFFLINE"
  - **Location:** `src/application/services/ProviderHealthService.ts`

### Frontend Implementation

- [ ] **Task 4.6:** Create `ProviderStatusWidget` component
  - Display system status (ONLINE/DEGRADED/OFFLINE)
  - Display counter "X/3 Proveedores Activos"
  - Display table with each provider (name, status, response time)
  - Auto-refresh every 30 seconds
  - **Test:** Unit test - renders correct status for 3/3 online
  - **Test:** Unit test - renders warning icon when provider offline
  - **Test:** E2E test - auto-refresh after 30 seconds
  - **Location:** `src/presentation/components/ProviderStatusWidget.tsx`

- [ ] **Task 4.7:** Implement auto-refresh logic
  - Use `setInterval` with 30-second interval
  - Fetch `/api/adapters/status` on mount and every interval
  - Clear interval on component unmount
  - **Test:** Unit test - fetch called on mount
  - **Test:** Unit test - fetch called after 30s (use fake timers)
  - **Location:** `src/presentation/hooks/useProviderStatus.ts`

- [ ] **Task 4.8:** Add status indicators
  - 🟢 Green circle for "online"
  - 🔴 Red circle for "offline"
  - ⚠️ Warning icon for degraded system
  - **Test:** Snapshot test - online state
  - **Test:** Snapshot test - offline state
  - **Location:** `src/presentation/components/StatusIndicator.tsx`

---

## Open Questions

### 1. Health Check Frequency
**Question:** Is 30 seconds the optimal interval for health checks?

**Trade-offs:**
- Faster (e.g., 10s): More real-time, but higher server load
- Slower (e.g., 60s): Less load, but delayed status updates

**Recommendation:** Start with 30s, make configurable via environment variable

**Decision:** 30 seconds for MVP, monitor server load post-launch

---

### 2. Alert Notifications
**Question:** Should we notify users when system status changes?

**Options:**
- **Option A:** Silent update (current design)
- **Option B:** Toast notification when status changes (e.g., "DHL is now offline")

**Recommendation:** Option A for MVP (simpler), consider Option B based on user feedback

**Decision:** Deferred to HU-08 (notifications)

---

## Acceptance Criteria (from USER_STORIES.md)

**Scenario 1: All providers available**
```gherkin
Given que accedo al sistema
When el dashboard se carga
Then debo ver un widget de estado del sistema que muestra "Sistema: EN LÍNEA"
And debo ver un contador que indica "3/3 Proveedores Activos"
And debo ver una tabla con cada proveedor:
  | Proveedor | Estado    | Tiempo de Respuesta |
  | FedEx     | En Línea  | 420ms              |
  | DHL       | En Línea  | 580ms              |
  | Local     | En Línea  | 150ms              |
```

**Scenario 2: One provider unavailable**
```gherkin
Given que uno de los proveedores (DHL) no responde
When el dashboard se actualiza
Then debo ver el estado del sistema como "Sistema: DEGRADADO"
And el contador debe mostrar "2/3 Proveedores Activos"
And el proveedor DHL debe aparecer con estado "Fuera de Línea"
And debe mostrarse un ícono de advertencia (⚠️)
```

**Scenario 3: All providers unavailable**
```gherkin
Given que ningún proveedor responde
When intento acceder al sistema
Then debo ver el estado del sistema como "Sistema: FUERA DE LÍNEA"
And el contador debe mostrar "0/3 Proveedores Activos"
And debo ver un mensaje: "El servicio no está disponible en este momento"
And no debo poder realizar cotizaciones
```

**Scenario 4: Auto-refresh**
```gherkin
Given que estoy viendo el dashboard
When pasan 30 segundos
Then el sistema debe actualizar automáticamente el estado de los proveedores
And debo ver la hora de última actualización
```

---

## Success Metrics

- [ ] Health check endpoint response time < 500ms
- [ ] Frontend auto-refresh works 100% of the time
- [ ] Status accuracy: 100% (no false positives/negatives)
- [ ] Widget displays correctly in all 3 states (ONLINE/DEGRADED/OFFLINE)
- [ ] MongoDB persistence: 100% of status updates saved

---

## Dependencies

**Requires:**
- HU-01: Adapters must exist to monitor them

**Blocks:**
- HU-05: Error handling uses health status
- HU-08: Notifications depend on status changes

---

## Related Documentation

- [USER_STORIES.md - HU-04](../USER_STORIES.md#hu-04-visualizar-estado-del-sistema)
- [TDD_GUIDE.md - HU-04 Tests](../TDD_GUIDE.md#hu-04-system-status---test-checklist)
- [PRODUCT.md - Dashboard Widgets](../PRODUCT.md#3-dashboard-widgets)
