# Copilot Instructions - Logistics Shipping Optimizer

## Project Overview
Multi-provider shipping quote aggregator using Express (TypeScript) backend + React (TypeScript) frontend. Core design patterns: **Template Method Pattern** for shipping providers (with `BaseShippingAdapter` providing shared validation) + **Repository Pattern** for data persistence.

**Requirements:** SOLID principles, TDD workflow, CI/CD pipeline, and 80%+ test coverage.

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

### Backend Structure (Clean Architecture)
```
logistics-back/src/
├── domain/              # Entities & interfaces
│   ├── entities/        # Quote, QuoteRequest, ZoneConfig
│   ├── interfaces/      # IShippingProvider, IQuoteRepository
│   └── exceptions/      # ValidationError
├── application/         # Business logic
│   ├── services/        # QuoteService, BadgeService, WeightPricingCalculator
│   └── utils/           # timeout utilities
├── infrastructure/      # External interfaces
│   ├── adapters/        # BaseShippingAdapter (Template Method), FedExAdapter, DHLAdapter, LocalAdapter
│   ├── controllers/     # QuoteController, HealthController
│   ├── routes/          # quotes.routes, health.routes
│   ├── middlewares/     # validateQuoteRequest
│   └── database/        # MongoDB connection, models, repositories
```

**Implementation Status:** ✅ Fully migrated to TypeScript with Clean Architecture + Template Method Pattern

### Frontend Structure (Simplified - YAGNI Principle Applied)
```
logistics-front/src/
├── components/      # React UI components (QuoteRequestForm, QuoteResultsList, etc.)
├── hooks/           # Custom React hooks (useFormValidation, useProviderStatus)
├── models/          # TypeScript interfaces (IQuote, IQuoteRequest)
├── services/        # API layer (quoteService.ts with direct fetch calls)
├── utils/           # Utilities (providerConfig, validation, adapters, constants)
├── App.tsx          # Main application component
└── main.tsx         # React entry point
```

**Tech Stack:** React 19 + TypeScript 5.9 + Vite (dev server), Vitest for testing, Tailwind CSS, ESLint configured.

**Architecture Note:** Flat folder structure chosen over hexagonal/layered architecture for academic project scope. No ServiceFactory, no Context API for single function - direct imports following YAGNI (You Aren't Gonna Need It) principle.

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

**Key Files:**
- `src/services/quoteService.ts` - Direct fetch to backend API with timeout handling
- `src/utils/providerConfig.ts` - Provider metadata (colors, logos) replacing old Registry pattern
- `src/components/QuoteRequestForm.tsx` - Main form with validation
- `src/hooks/useFormValidation.ts` - Form validation logic

### Testing Strategy
```bash
# Unit Tests (Jest/Vitest)
npm test -- --coverage    # Backend: QuoteService, adapters logic, repositories
                          # Frontend: quoteService, hooks, components, validation logic

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

## Template Method Pattern Implementation

**SOLID Compliance:** Zero violations. Each adapter = Single Responsibility. Template Method = Open/Closed Principle.

**When creating a new shipping provider adapter:**

1. **Extend Base Class** (`src/infrastructure/adapters/BaseShippingAdapter.ts`):
   ```typescript
   export abstract class BaseShippingAdapter implements IShippingProvider {
     protected readonly MIN_WEIGHT = 0.1;
     protected readonly MAX_WEIGHT = 1000;
     
     // Template method: shared validation logic
     protected validateShippingRequest(weight: number, destination: string): void {
       if (weight < this.MIN_WEIGHT || weight > this.MAX_WEIGHT) {
         throw new Error('Weight out of range');
       }
       if (!destination?.trim()) {
         throw new Error('Destination is required');
       }
     }
     
     // Abstract method: must be implemented by subclasses
     abstract calculateShipping(weight: number, destination: string): Promise<Quote>;
   }
   ```

2. **Create Concrete Adapter** (`src/infrastructure/adapters/FedExAdapter.ts`):
   ```typescript
   export class FedExAdapter extends BaseShippingAdapter {
     async calculateShipping(weight: number, destination: string): Promise<Quote> {
       // Step 1: Use base class validation (DRY principle)
       this.validateShippingRequest(weight, destination);
       
       // Step 2: Provider-specific pricing logic
       const zone = ZoneConfig.getZoneByDestination(destination);
       const weightCost = WeightPricingCalculator.calculateCost(weight, tiers);
       const price = BASE_PRICE + (weightCost * zoneMultiplier);
       
       // Step 3: Return normalized Quote entity
       return new Quote({ providerId, price, currency: 'COP', ... });
     }
   }
   ```

3. **Inject via Service** (`src/application/services/QuoteService.ts`):
   ```typescript
   class QuoteService {
     constructor(private providers: IShippingProvider[]) {}
     async getQuotes(request: QuoteRequest): Promise<Quote[]> {
       // Parallel execution with Promise.allSettled() + 5s timeout
       const quotes = await this.fetchQuotesWithTimeout(providers);
       return BadgeService.assignBadges(quotes); // isCheapest, isFastest
     }
   }
   ```

4. **Controller Wiring** (`src/infrastructure/controllers/QuoteController.ts`):
   - Instantiate adapters: `new FedExAdapter()`, `new DHLAdapter()`, `new LocalAdapter()`
   - Pass to `QuoteService` via constructor
   - Validate request with middleware (`validateQuoteRequest`)
   - Return standardized JSON (PRODUCT.md §2)

**Key Benefits:**
- ✅ **DRY Principle:** Validation logic written once in `BaseShippingAdapter`
- ✅ **Extensibility:** New providers extend base class, inherit validation automatically
- ✅ **Testability:** Mock base class methods for unit tests

**Reference:** [ARCHITECTURE.md - Template Method Pattern](ARCHITECTURE.md#template-method-pattern-implementation)

---

## Project-Specific Conventions

### Testing Requirements
- **Unit Tests:** `__tests__/unit/` folder structure (Jest for backend, Vitest for frontend)
- **Integration Tests:** `__tests__/integration/` for API endpoint testing
- **Coverage Target:** 80%+ for business logic (`QuoteService`, `BadgeService`, adapters, `WeightPricingCalculator`)
- **Edge Cases:** See [ARCHITECTURE.md - Data Contracts](ARCHITECTURE.md#data-contracts-typescript-interfaces) for validation rules (invalid weight, past date, provider timeout, empty address)
- **API Integration Tests:** 
  1. ✅ POST `/api/quotes` → Happy path (3 providers online)
  2. ✅ POST `/api/quotes` → Validation errors (400 responses)
  3. ✅ GET `/api/adapters/status` → Provider health check
  4. ✅ POST `/api/quotes` → Error handling (graceful degradation)
- **Postman Collection:** 80+ automated tests for manual/CI testing (see `/postman` directory)

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
| Implement new adapter | Extend `BaseShippingAdapter` in `infrastructure/adapters/NewAdapter.ts`, implement `calculateShipping()`, add to `QuoteService` |
| Add validation rule | Update `validateShippingRequest()` in `BaseShippingAdapter.ts` (shared across all providers) |
| Add pricing tier | Edit `WeightPricingCalculator.ts` → Add new tier configuration (e.g., `getNewProviderTiers()`) |
| Add API endpoint | Create controller in `infrastructure/controllers/`, route in `infrastructure/routes/`, wire in `app.ts` |
| Update badge logic | Edit `application/services/BadgeService.ts` (`assignBadges()` method) |
| Add middleware | Create in `infrastructure/middlewares/`, apply in route definition |
| Test with Postman | Import `/postman/postman_collection_fixed.json` + environment, run collection (80+ tests) |
| Run Newman CLI | `npm run test:api` (HTML report) or `npm run test:api:ci` (JSON for CI/CD) |
| Generate edge case tests | Use Copilot: "Generate Jest tests for BaseShippingAdapter validation edge cases" |
| Write integration test | Use Supertest: `request(app).post('/api/quotes').send({...}).expect(200)` in `__tests__/integration/` |
| Check test coverage | `npm run test:coverage` → Verify 80%+ in terminal output |

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
| Adapter lifecycle? | **Singleton instances** | Instantiated once in `QuoteService` constructor; no state between requests |
| Validation strategy? | **Template Method in BaseShippingAdapter** | DRY principle; all adapters inherit common validation logic |
| Database strategy? | **MongoDB with Mongoose ODM** | Persistent storage for quote history (currently optional - graceful degradation) |
| Frontend routing? | **Unified dashboard (single page)** | Simplifies UI testing; all providers in one view |
| Test framework? | **Jest (backend), Vitest (frontend)** | Best TypeScript support, coverage reports |
| API testing? | **Postman + Newman** | 80+ automated tests; CI/CD integration via `npm run test:api:ci` |
| CI/CD trigger? | **Push to `develop` or `main`** | Aligns with Gitflow workflow |
