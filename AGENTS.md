# Agent Guidelines - Shipping Optimizer

> **Purpose:** This document provides coding guidelines, commands, and conventions for AI coding agents working in this repository.

---

## 🎯 Project Overview

Multi-provider shipping quote aggregator using Express (TypeScript) backend + React (TypeScript) frontend.

**Tech Stack:**
- Backend: Express.js + TypeScript + MongoDB + Mongoose
- Frontend: React 19 + TypeScript + Vite + TailwindCSS
- Testing: Jest (backend) + Vitest (frontend) + Supertest (integration)
- Design Patterns: Template Method Pattern + Repository Pattern + Clean Architecture

**Key Documentation:**
- `.github/ARCHITECTURE.md` - System design and SOLID principles
- `.github/USER_STORIES.md` - User stories with Gherkin acceptance criteria
- `.github/TDD_GUIDE.md` - Test examples and best practices
- `.github/copilot-instructions.md` - Detailed project instructions

---

## 🛠️ Build, Test & Lint Commands

### Backend (logistics-back/)

```bash
# Install dependencies
npm install

# Development
npm run dev                    # Start dev server with hot reload (tsx watch)

# Build
npm run build                  # Compile TypeScript to dist/

# Testing
npm test                       # Run all Jest tests
npm run test:watch             # Watch mode for TDD workflow
npm run test:coverage          # Generate coverage report (target: 70%+)

# Run single test file
npm test -- src/__tests__/unit/application/services/QuoteService.test.ts

# Run single test by name
npm test -- -t "should aggregate quotes from all adapters"

# Run integration tests only
npm test -- --testPathPattern=integration

# API Testing (Postman/Newman)
npm run test:api               # Run Postman collection with HTML report
npm run test:api:ci            # Run with JSON output for CI/CD
```

### Frontend (logistics-front/)

```bash
# Install dependencies
npm install

# Development
npm run dev                    # Start Vite dev server (port 5173)

# Build
npm run build                  # TypeScript check + Vite production build

# Linting
npm run lint                   # Run ESLint with TypeScript rules

# Testing
npm test                       # Run all Vitest tests
npm run test:coverage          # Generate coverage report

# Run single test file
npm test -- src/presentation/components/__tests__/QuoteRequestForm.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests matching pattern
npm test -- --grep "QuoteValidator"
```

### Docker

```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 📁 Project Structure

```
shipping-optimizer/
├── logistics-back/           # Backend (Express + TypeScript)
│   └── src/
│       ├── domain/           # Entities, interfaces, exceptions
│       │   ├── entities/     # Quote, QuoteRequest, ZoneConfig
│       │   ├── interfaces/   # IShippingProvider, IQuoteRepository
│       │   └── exceptions/   # ValidationError
│       ├── application/      # Business logic
│       │   ├── services/     # QuoteService, BadgeService, ProviderHealthService
│       │   └── utils/        # timeout utilities
│       ├── infrastructure/   # External interfaces
│       │   ├── adapters/     # BaseShippingAdapter, FedExAdapter, DHLAdapter, LocalAdapter
│       │   ├── controllers/  # QuoteController, HealthController
│       │   ├── routes/       # Express routes
│       │   ├── middlewares/  # Validation middleware
│       │   ├── database/     # MongoDB models, repositories, connection
│       │   └── logging/      # Logger utility
│       └── __tests__/
│           ├── unit/         # Isolated unit tests
│           └── integration/  # API endpoint tests
├── logistics-front/          # Frontend (React + TypeScript)
│   └── src/
│       ├── domain/           # Models, validation, constants
│       ├── infrastructure/   # API clients, adapters, services
│       ├── presentation/     # React components, hooks, context
│       │   ├── components/   # UI components
│       │   ├── hooks/        # Custom hooks
│       │   └── context/      # React context
│       └── __tests__/        # Component and unit tests
└── postman/                  # API testing collection
```

---

## 💻 Code Style Guidelines

### TypeScript Configuration

- **Strict Mode:** Enabled (`strict: true` in tsconfig.json)
- **ES Modules:** Use ESM imports/exports
- **Target:** ES2022 for backend, ESNext for frontend

### Imports

```typescript
// ✅ Good - Group imports by type
import { Express } from 'express';                    // External dependencies
import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';  // Domain
import { Quote } from '../../domain/entities/Quote';   // Entities
import { withTimeout } from '../utils/timeout';        // Utilities

// ❌ Avoid - Mixed import order, no grouping
import { withTimeout } from '../utils/timeout';
import { Express } from 'express';
import { Quote } from '../../domain/entities/Quote';

// ✅ Use named exports (preferred)
export class QuoteService { }
export interface IQuoteResponse { }

// ❌ Avoid default exports (harder to refactor)
export default class QuoteService { }
```

### Naming Conventions

```typescript
// Classes: PascalCase
export class QuoteService { }
export class FedExAdapter extends BaseShippingAdapter { }

// Interfaces: IPascalCase (I-prefix for interfaces)
export interface IShippingProvider { }
export interface IQuoteRepository { }

// Constants: UPPER_SNAKE_CASE
const TIMEOUT_MS = 5000;
const FRAGILE_SURCHARGE = 1.15;

// Variables/Functions: camelCase
const providerPromises = [];
function calculateShipping() { }

// Private methods: camelCase with private keyword
private async callProviderWithTimeout() { }

// Type aliases: PascalCase (no I-prefix)
export type QuoteResponse = { quotes: Quote[]; messages: IProviderMessage[] };

// Enums: PascalCase for name, UPPER_CASE for values
enum ProviderStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  DEGRADED = 'DEGRADED'
}
```

### Formatting

```typescript
// ✅ Use 2 spaces for indentation
export class QuoteService {
  constructor(
    private readonly providers: IShippingProvider[],
    private readonly quoteRepository?: IQuoteRepository
  ) { }
}

// ✅ Add blank lines between logical sections
async getAllQuotes(request: QuoteRequest): Promise<Quote[]> {
  // Validate input
  if (!request) {
    throw new ValidationError('Request is required');
  }

  // Fetch quotes
  const quotes = await this.fetchQuotes(request);
  
  // Assign badges
  return this.badgeService.assignBadges(quotes);
}

// ✅ Use trailing commas in arrays/objects
const providers = [
  'FedEx',
  'DHL',
  'Local',  // ← trailing comma
];

// ✅ Use single quotes for strings (except when avoiding escapes)
const message = 'Provider not available';
const html = "<div class='container'>";  // OK - avoids escaping
```

### Type Safety

```typescript
// ✅ Always define return types for functions
async getAllQuotes(request: QuoteRequest): Promise<Quote[]> {
  // ...
}

// ✅ Use strict null checks
function getProviderName(index: number): string | undefined {
  return this.providers[index]?.name;
}

// ✅ Avoid 'any' - use specific types or 'unknown'
// ❌ Bad
function processData(data: any) { }

// ✅ Good
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}

// ✅ Use type narrowing and guards
function isQuote(value: unknown): value is Quote {
  return typeof value === 'object' && value !== null && 'providerId' in value;
}
```

### Error Handling

```typescript
// ✅ Use custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ Use try-catch for async operations
async getAllQuotes(request: QuoteRequest): Promise<Quote[]> {
  try {
    const quotes = await this.fetchQuotes(request);
    return this.badgeService.assignBadges(quotes);
  } catch (error) {
    this.logger.error('Error fetching quotes', error);
    throw error; // Re-throw after logging
  }
}

// ✅ Use Promise.allSettled for graceful degradation
const results = await Promise.allSettled(providerPromises);
for (const result of results) {
  if (result.status === 'fulfilled') {
    quotes.push(result.value);
  } else {
    logger.error('Provider failed', result.reason);
  }
}

// ✅ Validate inputs early
protected validateShippingRequest(weight: number, destination: string): void {
  if (weight < this.MIN_WEIGHT) {
    throw new ValidationError(`Weight must be > ${this.MIN_WEIGHT} kg`);
  }
  if (!destination?.trim()) {
    throw new ValidationError('Destination is required');
  }
}
```

### React Component Style

```typescript
// ✅ Use functional components with TypeScript
interface QuoteRequestFormProps {
  onSubmit: (data: IQuoteRequest) => void;
  loading?: boolean;
}

export const QuoteRequestForm = ({ onSubmit, loading = false }: QuoteRequestFormProps) => {
  // Custom hooks for state management
  const { formData, errors, handleChange } = useQuoteFormState();
  
  // Event handlers
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateAll()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* JSX */}
    </form>
  );
};

// ✅ Extract reusable logic to custom hooks
export const useQuoteFormState = () => {
  const [formData, setFormData] = useState<FormData>(initialState);
  // ... hook logic
  return { formData, errors, handleChange };
};
```

---

## 🧪 Testing Guidelines

### Test Structure

```typescript
describe('QuoteService', () => {
  // Setup
  let quoteService: QuoteService;
  let mockProviders: IShippingProvider[];

  beforeEach(() => {
    mockProviders = [/* mock data */];
    quoteService = new QuoteService(mockProviders);
  });

  // Test cases
  test('should aggregate quotes from all adapters', async () => {
    // Arrange
    const request = new QuoteRequest({ /* ... */ });
    
    // Act
    const quotes = await quoteService.getAllQuotes(request);
    
    // Assert
    expect(quotes).toHaveLength(3);
    expect(quotes[0]).toHaveProperty('providerId');
  });
});
```

### Test Coverage

- **Target:** 70%+ for statements, functions, lines; 65%+ for branches
- **Priority:** Business logic > Entities > Controllers > Routes
- **Focus:** Test behavior, not implementation details

---

## 🏗️ Architecture Patterns

### Template Method Pattern

```typescript
// Base class defines algorithm structure
export abstract class BaseShippingAdapter implements IShippingProvider {
  protected validateShippingRequest(weight: number, destination: string): void {
    // Shared validation logic (DRY principle)
  }
  
  abstract calculateShipping(weight: number, destination: string): Promise<Quote>;
}

// Concrete implementations
export class FedExAdapter extends BaseShippingAdapter {
  async calculateShipping(weight: number, destination: string): Promise<Quote> {
    this.validateShippingRequest(weight, destination); // Inherited validation
    // FedEx-specific pricing logic
    return new Quote({ /* ... */ });
  }
}
```

### Dependency Injection

```typescript
// ✅ Inject dependencies via constructor
export class QuoteService {
  constructor(
    private readonly providers: IShippingProvider[],
    private readonly quoteRepository?: IQuoteRepository
  ) { }
}

// ❌ Avoid direct instantiation inside classes
export class QuoteService {
  private providers = [new FedExAdapter(), new DHLAdapter()]; // Hard to test
}
```

---

## 🚨 Critical Rules

1. **Always write tests first** (TDD workflow: Red → Green → Refactor)
2. **Never commit without running tests** (`npm test` in both directories)
3. **Follow SOLID principles** (referenced in ARCHITECTURE.md)
4. **Use Promise.allSettled** for parallel provider calls (graceful degradation)
5. **Validate inputs** in adapters using `BaseShippingAdapter.validateShippingRequest()`
6. **Log errors** but don't fail requests when non-critical operations fail
7. **Apply 5-second timeout** to all provider calls (`withTimeout` utility)
8. **Assign badges** using `BadgeService.assignBadges()` before returning quotes
9. **One class per file** - Named exports preferred
10. **Keep components under 200 lines** - Extract logic to hooks/services

---

## 📝 Git Workflow

- **Branches:** `main` (production), `develop` (integration), `feature/*` (new features)
- **Commits:** Follow conventional commits (e.g., `feat:`, `fix:`, `test:`, `refactor:`)
- **PR Flow:** `feature/*` → `develop` → `main`
- **CI/CD:** GitHub Actions runs on push to `develop`/`main` (build + test)

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-07  
**Related Files:** `.github/ARCHITECTURE.md`, `.github/TDD_GUIDE.md`, `.github/copilot-instructions.md`
