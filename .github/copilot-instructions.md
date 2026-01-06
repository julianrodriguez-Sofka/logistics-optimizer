# Copilot Instructions - Logistics Shipping Optimizer

## Project Overview
Multi-provider shipping quote aggregator using Express (TypeScript) backend + React (TypeScript) frontend. Core design pattern: **Adapter Pattern** for swappable shipping providers (FedEx, DHL, Local).

**Requirements:** SOLID principles, CI/CD pipeline, and 70%+ test coverage.

---

## 📚 Key Documentation (Reference with #file: when needed)

**IMPORTANT:** When working on this project, reference these files for context:

- **#file:ARCHITECTURE.md** - System design, SOLID principles, TypeScript interfaces, validation rules
- **#file:USER_STORIES.md** - User stories (HU-01 to HU-10) with Gherkin acceptance criteria
- **#file:IMPLEMENTATION_PLAN.md** - 4-week sprint breakdown with 40+ tasks
- **#file:TDD_GUIDE.md** - Test examples (unit, integration, E2E) and best practices
- **#file:PRODUCT.md** - API contracts, input validation, response formats, performance targets

**Workspace Resources:**
- **#file:../../../.github/templates/plan-template.md** - Template for creating HU implementation plans
- **#file:../../../.github/agents/tdd.agent.md** - TDD agent for test-driven development workflow

---

## 🎯 Quick Reference for Common Tasks

### Implementing a New User Story
1. Read user story: Reference #file:USER_STORIES.md (find HU-XX)
2. Check implementation plan: Reference #file:IMPLEMENTATION_PLAN.md (find corresponding task)
3. Write tests first: Use examples from #file:TDD_GUIDE.md
4. Follow architecture: Reference #file:ARCHITECTURE.md (SOLID principles, patterns)

### Creating a New Adapter
1. Interface: Implement `IShippingProvider` from #file:ARCHITECTURE.md
2. Validation: Use rules from #file:ARCHITECTURE.md (Data Contracts section)
3. Tests: Follow adapter test patterns in #file:TDD_GUIDE.md
4. Structure: Match folder structure in #file:ARCHITECTURE.md

### Writing Tests
1. Test checklist: Use #file:TDD_GUIDE.md (find HU-specific section)
2. Edge cases: Check #file:ARCHITECTURE.md (Data Contracts - Validation Rules)
3. Acceptance criteria: Convert Gherkin from #file:USER_STORIES.md to tests

### API Endpoints
1. Input validation: See #file:PRODUCT.md (Section 1)
2. Output format: See #file:PRODUCT.md (Section 2)
3. Error handling: See #file:PRODUCT.md (Section 4)

---

## Architecture Essentials

### Backend Structure (TypeScript Migration Required)
```
logistics-back/src/
├── domain/           # Entities & interfaces (IShippingProvider, Shipment)
├── application/      # ShippingService, QuoteService
├── infrastructure/   # FedExAdapter, DHLAdapter, LocalAdapter, controllers, routes
```

**Current State:** Express app uses vanilla JS (app.js) with minimal routes. **Migration needed:** Convert to TypeScript, implement domain/application/infrastructure layers per ARCHITECTURE.md.

### Frontend Structure
```
logistics-front/src/
├── presentation/     # React components, pages
├── services/         # API client (fetch calls to backend)
├── domain/          # Type definitions (Quote, Shipment interfaces)
```

**Tech Stack:** React 19 + TypeScript 5.9 + Vite (dev server), ESLint configured.

---

## Critical Data Flow

### API Contract (POST /quotes)
**Input Validation (PRODUCT.md §1):**
- `origin`, `destination`: non-empty strings
- `weight`: > 0.1 kg, ≤ 1000 kg
- `pickupDate`: ISO 8601, >= today
- `fragile` (optional): boolean

**Output Format (PRODUCT.md §2):**
```json
{
  "quotes": [
    { "provider": "FedEx", "price": 89.99, "estimatedDays": 3, "isCheapest": false, "isFastest": true, "status": "online" }
  ]
}
```

**Key Badge Logic:**
- `isCheapest` = lowest price (single winner; ties break to first)
- `isFastest` = lowest estimatedDays
- `status` = "online" if adapter response ≤5s, else "offline"

---

## Developer Workflows

### Backend Development
```bash
cd logistics-back
npm install               # Install dependencies
npm run dev               # ts-node-dev with hot reload (port 3000)
npm run build             # Compile TypeScript to dist/
npm test                  # Run Jest unit tests
npm run test:coverage     # Generate coverage report (target: 70%+)
```

**MongoDB Setup:**
```bash
# Local development (requires MongoDB installed)
mongod --dbpath ./data/db

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Connection string in .env
MONGODB_URI=mongodb://localhost:27017/logistics-optimizer
```

### Frontend Development
```bash
cd logistics-front
npm install               # Install dependencies
npm run dev               # Vite dev server (HMR enabled, port 5173)
npm run build             # TypeScript + Vite production build
npm run lint              # ESLint with React/TypeScript rules
npm test                  # Run Vitest unit tests
```

### Testing Strategy
```bash
# Unit Tests (Jest/Vitest)
npm test -- --coverage    # Backend: QuoteService, adapters logic, repositories
                          # Frontend: API client, component logic

# Integration Tests with MongoDB Memory Server
npm run test:integration  # Test POST /quotes, GET /adapters/status, DB operations

# MongoDB Memory Server for tests (no real DB needed)
# Automatically starts/stops in-memory MongoDB instance
```

### CI/CD Pipeline
`.github/workflows/ci.yml` runs on push to `develop`/`main`:
1. Install dependencies (`npm ci`)
2. Build TypeScript (`npm run build`)
3. Run unit tests (`npm test`)
4. (Optional) Upload coverage to SonarCloud

### Gitflow Workflow
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features (e.g., `feature/fedex-adapter`)
- Merge flow: `feature/*` → `develop` → `main` (via PR)

---

## Adapter Pattern Implementation

**SOLID Compliance:** Zero violations. Each adapter = Single Responsibility. `IShippingProvider` = Dependency Inversion.

**When creating a new shipping provider adapter:**

1. **Define Interface** (`src/domain/interfaces/IShippingProvider.ts`):
   ```typescript
   interface IShippingProvider {
     calculateShipping(weight: number, destination: string): Promise<Quote>;
     trackShipment(trackingId: string): Promise<Tracking>;
     validateAddress(address: string): Promise<boolean>;
   }
   ```

2. **Create Adapter** (`src/infrastructure/adapters/FedExAdapter.ts`):
   - Implement `IShippingProvider` interface
   - Handle timeouts (5s max per PRODUCT.md §6)
   - Normalize raw API response to `Quote` entity (PRODUCT.md §2)
   - **Test Coverage:** Write unit tests for mock API responses

3. **Inject via Service** (`src/application/services/ShippingService.ts`):
   ```typescript
   class ShippingService {
     constructor(private providers: IShippingProvider[]) {}
     async getAllQuotes(request: QuoteRequest): Promise<Quote[]> {
       // Parallel execution with Promise.allSettled()
     }
   }
   ```

4. **Controller Wiring** (`src/infrastructure/controllers/QuoteController.ts`):
   - Instantiate adapters (FedEx, DHL, Local)
   - Pass to `ShippingService` via constructor
   - Return standardized JSON (PRODUCT.md §2)

**Reference:** [ARCHITECTURE.md - Adapter Pattern](ARCHITECTURE.md#adapter-pattern-implementation), [USER_STORIES.md](USER_STORIES.md) for acceptance criteria

---

## Project-Specific Conventions

### Testing Requirements
- **Unit Tests:** `__tests__/` folder structure (Jest for backend, Vitest for frontend)
- **Coverage Target:** 70%+ for business logic (`QuoteService`, adapters, badge assignment)
- **Edge Cases:** See [ARCHITECTURE.md - Data Contracts](ARCHITECTURE.md#data-contracts-typescript-interfaces) for validation rules (invalid weight, past date, provider timeout, empty address)
- **Integration Tests:** Minimum 3 API tests:
  1. POST `/api/quotes` → Happy path (3 providers online)
  2. POST `/api/quotes` → Single adapter timeout (graceful degradation)
  3. GET `/api/adapters/status` → Dashboard widget data

### Business Logic
- **Badge Assignment:** Single winner for `isCheapest` and `isFastest` (ties break to/DB down)
- **Graceful Degradation:** Return quotes if ≥1 adapter responds; log errors for offline providers
- **Cache Strategy:** Check MongoDB for duplicate requests (5-min TTL using MongoDB TTL indexes)
- **Quote History:** Persist all successful quotes in MongoDB for analytics

### MongoDB Conventions
- **Models:** Mongoose schemas in `infrastructure/database/models/` (e.g., `QuoteModel.ts`)
- **Repositories:** Implement `IQuoteRepository` interface in `infrastructure/database/repositories/`
- **TTL Index:** Set `expireAfterSeconds: 300` on `createdAt` field for cache collection
- **Connection:** Single connection pool in `infrastructure/database/connection.ts`
- **Testing:** Use `mongodb-memory-server` for unit/integration tests (no external DB required)
- **Date Validation:** ISO 8601, must be >= today and <= 30 days ahead
- **Error Responses:** Follow PRODUCT.md §4 (400 for validation, 503 for all adapters down)
- **Graceful Degradation:** Return quotes if ≥1 adapter responds; log errors for offline providers

### Code Style
- **Database:** MongoDB for quote history and caching (5-minute TTL, PRODUCT.md §5)
- **Repository Pattern:** Implement `IQuoteRepository` in `domain/interfaces/`, concrete implementation in `infrastructure/database/repositories/`
- **TypeScript Strict Mode:** Enable `strict: true` in `tsconfig.json`
- **ESLint:** No violations in CI pipeline
- **File Organization:** One class per file, named exports (e.g., `export class FedExAdapter`)

---

## Common Tasks

| Task | Command/Reference |
|:---|:---|
| Implement new adapter | Create `infrastructure/adapters/NewAdapter.ts` implementing `IShippingProvider`, add to `ShippingService` constructor |
| Add MongoDB model | Create schema in `infrastructure/database/models/`, implement repository in `infrastructure/database/repositories/` |
| Add API endpoint | Create controller in `infrastructure/controllers/`, route in `infrastructure/routes/`, wire in `main.ts` |
| Update badge logic | Edit `application/services/QuoteService.ts` (cheapest/fastest calculation) |
| Generate edge case tests | Use Copilot with prompt: "Generate Jest tests for validation rules in ARCHITECTURE.md" |
| Create React form | Use Copilot: "Create React component for quote form with validation from PRODUCT.md §1" |
| Setup GitHub Actions | Create `.github/workflows/ci.yml` with build + test steps |
| Create feature branch | `git checkout -b feature/fedex-adapter` → PR to `develop` |
| Write API integration test | Use Supertest: `request(app).post('/api/quotes').send({...}).expect(200)` |
| Check test coverage | `npm run test:coverage` → Verify 70%+ in terminal output |

---

## Integration Points & Dependencies

### Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.x",
    "cors": "^2.8.x",
    "dotenv": "^16.x",
    "mongoose": "^8.x",
    "mongodb": "^6.x"
  },
  "devDependencies": {
    "typescript": "^5.3.x",
    "ts-node-dev": "^2.0.x",
    "jest": "^29.x",
    "@types/jest": "^29.x",
    "@types/mongoose": "^5.x",
    "supertest": "^6.x",
    "mongodb-memory-server": "^9.x"
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^19.x",
    "axios": "^1.6.x"
  },
  "devDependencies": {
    "vitest": "^1.x",
    "@testing-library/react": "^14.x"
  }
}
```

### External Provider APIs (Simulated)
- **FedEx/DHL:** Mock JSON responses in adapters; timeout simulation with `setTimeout` + `Promise.race()`
- **LocalAdapter:** Static rate map (weight-based pricing)
- **Future:** Optional integration with real sandbox APIs if available

---

## Key Decision Points (Resolved)

| Question | Decision | Rationale |
|:---|:---|:---|
| Adapter lifecycle? | **Instantiated per-request** | Simplifies testing; no shared state between requests |
| Database strategy? | **MongoDB with Mongoose ODM** | Persistent storage for quote history, cache TTL with MongoDB TTL indexes |
| Frontend routing? | **Unified dashboard (single page)** | Simplifies UI testing; all providers in one view |
| Test framework? | **Jest (backend), Vitest (frontend)** | Best TypeScript support, coverage reports |
| CI/CD trigger? | **Push to `develop` or `main`** | Aligns with Gitflow workflow |
