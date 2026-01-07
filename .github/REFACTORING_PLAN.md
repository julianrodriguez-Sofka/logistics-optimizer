# Plan de Refactorización - Logistics Shipping Optimizer

**Fecha de Creación:** 2026-01-06  
**Estado:** 📋 Planeado  
**Objetivo:** Completar la fase de REFACTORIZACIÓN del ciclo TDD (RED → GREEN → **REFACTOR**) sin romper tests existentes

---

## 📊 Análisis del Estado Actual

### ✅ Completado (RED + GREEN)

#### Backend
- ✅ Domain Layer: `Quote`, `QuoteRequest` entities con validaciones
- ✅ Adapters: `FedExAdapter`, `DHLAdapter`, `LocalAdapter` implementados
- ✅ Services: `QuoteService`, `BadgeService` funcionales
- ✅ Controllers: `QuoteController` con manejo de errores
- ✅ Routes: `/api/quotes`, `/health`, `/api/adapters/status`
- ✅ Tests Unitarios: 70%+ cobertura en lógica de negocio

#### Frontend
- ✅ Componentes React: `QuoteRequestForm`, `QuoteResultsList`
- ✅ Validación de formularios
- ✅ Integración con API backend
- ✅ UI/UX con Tailwind CSS

### ❌ Pendiente (REFACTOR)

#### Crítico (Bloqueantes)
1. **Jest Configuration Issues** - Tests con errores de TypeScript
2. **MongoDB Integration** - Falta persistencia de datos
3. **Code Duplication** - Código repetido en adapters y services
4. **Error Handling** - Manejo de errores inconsistente

#### Importante (No Bloqueantes)
5. **Performance Optimization** - Cache de cotizaciones
6. **Logging System** - Sistema de logs estructurado
7. **Health Check Enhancement** - Health check más robusto
8. **Integration Tests** - Tests de integración con MongoDB Memory Server

#### Deseable (Mejoras)
9. **E2E Tests** - Tests end-to-end con Playwright
10. **CI/CD Pipeline** - GitHub Actions workflow
11. **Documentation** - Documentación de código

---

## 🎯 Objetivos de Refactorización

### Principios SOLID a Mantener
- ✓ Single Responsibility Principle (SRP)
- ✓ Open/Closed Principle (OCP)
- ✓ Liskov Substitution Principle (LSP)
- ✓ Interface Segregation Principle (ISP)
- ✓ Dependency Inversion Principle (DIP)

### Métricas de Calidad
- 📏 **Cobertura de Tests:** Mantener 70%+ (actualmente cumplido)
- 🐛 **Bug Count:** 0 errores críticos
- ⚡ **Performance:** < 3 segundos respuesta API
- 📦 **Bundle Size:** Frontend < 500KB gzipped

---

## 📋 Plan de Refactorización (Sprints)

### Sprint 1: Corrección de Configuración (Crítico) 🔴

**Objetivo:** Resolver errores de TypeScript y configuración de Jest

#### Tarea 1.1: Configurar Jest para TypeScript
**Archivos afectados:**
- `logistics-back/jest.config.js` (crear/actualizar)
- `logistics-back/tsconfig.json` (actualizar)
- `logistics-back/package.json` (actualizar scripts)

**Acciones:**
```typescript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Tests a ejecutar después:**
```bash
cd logistics-back
npm test
npm run test:coverage
```

**Criterio de Aceptación:** ✅ Todos los tests pasan sin errores de TypeScript

---

#### Tarea 1.2: Refactorizar Duplicación en Adapters

**Problema Detectado:** Los 3 adapters tienen código duplicado para validación

**Código Actual (Duplicado en FedEx, DHL, Local):**
```typescript
// Validación repetida en cada adapter
if (weight < 0.1) {
  throw new Error('Weight must be greater than 0.1 kg');
}
if (weight > 1000) {
  throw new Error('Weight must be less than or equal to 1000 kg');
}
if (!destination || destination.trim() === '') {
  throw new Error('Destination is required');
}
```

**Solución (Refactor):**
Crear clase abstracta `BaseShippingAdapter`:

```typescript
// src/infrastructure/adapters/BaseShippingAdapter.ts
import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';

export abstract class BaseShippingAdapter implements IShippingProvider {
  protected readonly MIN_WEIGHT = 0.1;
  protected readonly MAX_WEIGHT = 1000;

  /**
   * Validate weight and destination before calculating shipping
   * @throws Error if validation fails
   */
  protected validateShippingRequest(weight: number, destination: string): void {
    if (weight < this.MIN_WEIGHT) {
      throw new Error(`Weight must be greater than ${this.MIN_WEIGHT} kg`);
    }

    if (weight > this.MAX_WEIGHT) {
      throw new Error(`Weight must be less than or equal to ${this.MAX_WEIGHT} kg`);
    }

    if (!destination || destination.trim() === '') {
      throw new Error('Destination is required');
    }
  }

  abstract calculateShipping(weight: number, destination: string): Promise<Quote>;
  abstract trackShipment(trackingId: string): Promise<any>;
  abstract validateAddress(address: string): Promise<boolean>;
}
```

**Refactorizar FedExAdapter:**
```typescript
// src/infrastructure/adapters/FedExAdapter.ts
import { BaseShippingAdapter } from './BaseShippingAdapter';
import { Quote } from '../../domain/entities/Quote';

export class FedExAdapter extends BaseShippingAdapter {
  private readonly BASE_PRICE = 50;
  private readonly PRICE_PER_KG = 3.5;
  private readonly MIN_DELIVERY_DAYS = 3;
  private readonly MAX_DELIVERY_DAYS = 4;

  async calculateShipping(weight: number, destination: string): Promise<Quote> {
    // Usar validación de clase base
    this.validateShippingRequest(weight, destination);

    // Calcular precio
    const price = this.BASE_PRICE + (weight * this.PRICE_PER_KG);

    return new Quote({
      providerId: 'fedex-ground',
      providerName: 'FedEx Ground',
      price: price,
      currency: 'USD',
      minDays: this.MIN_DELIVERY_DAYS,
      maxDays: this.MAX_DELIVERY_DAYS,
      transportMode: 'Truck',
      isCheapest: false,
      isFastest: false,
    });
  }

  async trackShipment(trackingId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async validateAddress(address: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
```

**Commits Git (TDD Evidence):**
```bash
# 1. Crear clase base (refactor)
git add src/infrastructure/adapters/BaseShippingAdapter.ts
git commit -m "refactor: extract common adapter validation to BaseShippingAdapter"

# 2. Refactorizar FedExAdapter
git add src/infrastructure/adapters/FedExAdapter.ts
git commit -m "refactor: use BaseShippingAdapter in FedExAdapter"

# 3. Refactorizar DHLAdapter
git add src/infrastructure/adapters/DHLAdapter.ts
git commit -m "refactor: use BaseShippingAdapter in DHLAdapter"

# 4. Refactorizar LocalAdapter
git add src/infrastructure/adapters/LocalAdapter.ts
git commit -m "refactor: use BaseShippingAdapter in LocalAdapter"

# 5. Ejecutar tests para verificar
npm test
git add . # Si hay ajustes
git commit -m "test: verify all adapter tests pass after refactoring"
```

**Criterio de Aceptación:** 
- ✅ Todos los tests de adapters siguen pasando
- ✅ Reducción de ~15 líneas de código por adapter
- ✅ Mantenimiento de cobertura de tests 70%+

---

### Sprint 2: MongoDB Integration (Crítico) 🔴

**Objetivo:** Implementar persistencia de datos con MongoDB + Repository Pattern

#### Tarea 2.1: Setup MongoDB Connection

**Archivos a crear:**
- `logistics-back/src/infrastructure/database/connection.ts`
- `logistics-back/src/infrastructure/database/models/QuoteModel.ts`
- `logistics-back/src/infrastructure/database/repositories/QuoteRepository.ts`
- `logistics-back/src/domain/interfaces/IQuoteRepository.ts`

**Dependencias a instalar:**
```bash
cd logistics-back
npm install mongoose @types/mongoose
npm install --save-dev mongodb-memory-server
```

**Implementación:**

```typescript
// src/infrastructure/database/connection.ts
import mongoose from 'mongoose';

export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private isConnected = false;

  private constructor() {}

  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  async connect(uri: string): Promise<void> {
    if (this.isConnected) {
      console.log('MongoDB already connected');
      return;
    }

    try {
      await mongoose.connect(uri);
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await mongoose.disconnect();
    this.isConnected = false;
    console.log('MongoDB disconnected');
  }

  getConnection() {
    return mongoose.connection;
  }
}
```

```typescript
// src/infrastructure/database/models/QuoteModel.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuoteDocument extends Document {
  providerId: string;
  providerName: string;
  price: number;
  currency: string;
  minDays: number;
  maxDays: number;
  transportMode: string;
  isCheapest: boolean;
  isFastest: boolean;
  requestData: {
    origin: string;
    destination: string;
    weight: number;
    pickupDate: Date;
    fragile: boolean;
  };
  createdAt: Date;
}

const QuoteSchema = new Schema<IQuoteDocument>(
  {
    providerId: { type: String, required: true, index: true },
    providerName: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    minDays: { type: Number, required: true },
    maxDays: { type: Number, required: true },
    transportMode: { type: String, required: true },
    isCheapest: { type: Boolean, default: false },
    isFastest: { type: Boolean, default: false },
    requestData: {
      origin: { type: String, required: true },
      destination: { type: String, required: true },
      weight: { type: Number, required: true },
      pickupDate: { type: Date, required: true },
      fragile: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// TTL index for cache (5 minutes = 300 seconds)
QuoteSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

// Compound index for cache lookup
QuoteSchema.index({
  'requestData.origin': 1,
  'requestData.destination': 1,
  'requestData.weight': 1,
  'requestData.fragile': 1,
});

export const QuoteModel = mongoose.model<IQuoteDocument>('Quote', QuoteSchema);
```

```typescript
// src/domain/interfaces/IQuoteRepository.ts
import { Quote } from '../entities/Quote';
import { QuoteRequest } from '../entities/QuoteRequest';

export interface IQuoteRepository {
  /**
   * Save a quote to the database
   */
  save(quote: Quote, request: QuoteRequest): Promise<void>;

  /**
   * Save multiple quotes in a batch
   */
  saveMany(quotes: Quote[], request: QuoteRequest): Promise<void>;

  /**
   * Find cached quotes for a request (within 5 minutes)
   */
  findCached(request: QuoteRequest): Promise<Quote[] | null>;

  /**
   * Get all quotes (for analytics)
   */
  findAll(limit?: number): Promise<Quote[]>;
}
```

```typescript
// src/infrastructure/database/repositories/QuoteRepository.ts
import { IQuoteRepository } from '../../../domain/interfaces/IQuoteRepository';
import { Quote } from '../../../domain/entities/Quote';
import { QuoteRequest } from '../../../domain/entities/QuoteRequest';
import { QuoteModel } from '../models/QuoteModel';

export class QuoteRepository implements IQuoteRepository {
  async save(quote: Quote, request: QuoteRequest): Promise<void> {
    await QuoteModel.create({
      providerId: quote.providerId,
      providerName: quote.providerName,
      price: quote.price,
      currency: quote.currency,
      minDays: quote.minDays,
      maxDays: quote.maxDays,
      transportMode: quote.transportMode,
      isCheapest: quote.isCheapest,
      isFastest: quote.isFastest,
      requestData: {
        origin: request.origin,
        destination: request.destination,
        weight: request.weight,
        pickupDate: request.pickupDate,
        fragile: request.fragile,
      },
    });
  }

  async saveMany(quotes: Quote[], request: QuoteRequest): Promise<void> {
    const documents = quotes.map(quote => ({
      providerId: quote.providerId,
      providerName: quote.providerName,
      price: quote.price,
      currency: quote.currency,
      minDays: quote.minDays,
      maxDays: quote.maxDays,
      transportMode: quote.transportMode,
      isCheapest: quote.isCheapest,
      isFastest: quote.isFastest,
      requestData: {
        origin: request.origin,
        destination: request.destination,
        weight: request.weight,
        pickupDate: request.pickupDate,
        fragile: request.fragile,
      },
    }));

    await QuoteModel.insertMany(documents);
  }

  async findCached(request: QuoteRequest): Promise<Quote[] | null> {
    // Find quotes created within last 5 minutes for this request
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const cachedQuotes = await QuoteModel.find({
      'requestData.origin': request.origin,
      'requestData.destination': request.destination,
      'requestData.weight': request.weight,
      'requestData.fragile': request.fragile,
      createdAt: { $gte: fiveMinutesAgo },
    }).sort({ createdAt: -1 });

    if (cachedQuotes.length === 0) {
      return null;
    }

    // Convert to Quote entities
    return cachedQuotes.map(doc => new Quote({
      providerId: doc.providerId,
      providerName: doc.providerName,
      price: doc.price,
      currency: doc.currency,
      minDays: doc.minDays,
      maxDays: doc.maxDays,
      transportMode: doc.transportMode,
      isCheapest: doc.isCheapest,
      isFastest: doc.isFastest,
    }));
  }

  async findAll(limit: number = 100): Promise<Quote[]> {
    const documents = await QuoteModel.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return documents.map(doc => new Quote({
      providerId: doc.providerId,
      providerName: doc.providerName,
      price: doc.price,
      currency: doc.currency,
      minDays: doc.minDays,
      maxDays: doc.maxDays,
      transportMode: doc.transportMode,
      isCheapest: doc.isCheapest,
      isFastest: doc.isFastest,
    }));
  }
}
```

**Actualizar QuoteService para usar Repository:**

```typescript
// src/application/services/QuoteService.ts (refactored)
import { IQuoteRepository } from '../../domain/interfaces/IQuoteRepository';

export class QuoteService {
  // ... existing code ...

  constructor(
    private readonly providers: IShippingProvider[],
    private readonly quoteRepository?: IQuoteRepository // Optional for backwards compatibility
  ) {
    this.badgeService = new BadgeService();
  }

  async getAllQuotesWithMessages(request: QuoteRequest): Promise<IQuoteResponse> {
    // Check cache first (if repository is available)
    if (this.quoteRepository) {
      const cachedQuotes = await this.quoteRepository.findCached(request);
      if (cachedQuotes && cachedQuotes.length > 0) {
        console.log('✅ Returning cached quotes');
        return { quotes: cachedQuotes, messages: [] };
      }
    }

    // ... existing provider call logic ...

    const quotesWithBadges = this.badgeService.assignBadges(quotes);

    // Save quotes to database (if repository is available)
    if (this.quoteRepository && quotesWithBadges.length > 0) {
      try {
        await this.quoteRepository.saveMany(quotesWithBadges, request);
        console.log('✅ Quotes saved to database');
      } catch (error) {
        console.error('Error saving quotes:', error);
        // Don't fail the request if database save fails
      }
    }

    return { quotes: quotesWithBadges, messages };
  }
}
```

**Actualizar app.ts para inicializar MongoDB:**

```typescript
// src/app.ts (add MongoDB initialization)
import { MongoDBConnection } from './infrastructure/database/connection';

// Initialize MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics-optimizer';
MongoDBConnection.getInstance().connect(mongoUri);
```

**Tests de Integración con MongoDB Memory Server:**

```typescript
// src/__tests__/integration/database/QuoteRepository.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { QuoteRepository } from '../../../infrastructure/database/repositories/QuoteRepository';
import { Quote } from '../../../domain/entities/Quote';
import { QuoteRequest } from '../../../domain/entities/QuoteRequest';

describe('QuoteRepository Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let repository: QuoteRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    repository = new QuoteRepository();
  });

  describe('save', () => {
    it('should save a quote to the database', async () => {
      const quote = new Quote({
        providerId: 'fedex-ground',
        providerName: 'FedEx Ground',
        price: 89.99,
        currency: 'USD',
        minDays: 3,
        maxDays: 4,
        transportMode: 'Truck',
      });

      const request = new QuoteRequest({
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        weight: 5.5,
        pickupDate: new Date('2026-01-10'),
        fragile: false,
      });

      await repository.save(quote, request);

      const saved = await repository.findAll();
      expect(saved).toHaveLength(1);
      expect(saved[0].providerName).toBe('FedEx Ground');
    });
  });

  describe('findCached', () => {
    it('should return cached quotes within 5 minutes', async () => {
      // Implementation...
    });

    it('should return null if no cached quotes found', async () => {
      // Implementation...
    });
  });
});
```

**Commits Git:**
```bash
# 1. Instalar dependencias
npm install mongoose @types/mongoose mongodb-memory-server
git add package.json package-lock.json
git commit -m "build: add mongoose and mongodb-memory-server dependencies"

# 2. Crear interfaces y connection
git add src/infrastructure/database/connection.ts
git add src/domain/interfaces/IQuoteRepository.ts
git commit -m "feat: add MongoDB connection and IQuoteRepository interface"

# 3. Crear modelos
git add src/infrastructure/database/models/QuoteModel.ts
git commit -m "feat: add QuoteModel with TTL index for caching"

# 4. Crear repository
git add src/infrastructure/database/repositories/QuoteRepository.ts
git commit -m "feat: implement QuoteRepository with cache support"

# 5. Refactorizar QuoteService
git add src/application/services/QuoteService.ts
git commit -m "refactor: integrate QuoteRepository in QuoteService for caching"

# 6. Tests de integración
git add src/__tests__/integration/database/
npm test
git commit -m "test: add QuoteRepository integration tests with MongoDB Memory Server"
```

**Criterio de Aceptación:**
- ✅ MongoDB conecta correctamente
- ✅ Quotes se persisten en la base de datos
- ✅ Cache funciona (5 minutos TTL)
- ✅ Tests de integración pasan
- ✅ Sistema funciona sin MongoDB (degradación elegante)

---

### Sprint 3: Error Handling & Logging (Importante) 🟡

**Objetivo:** Mejorar manejo de errores y agregar sistema de logging

#### Tarea 3.1: Crear Custom Error Classes

```typescript
// src/domain/errors/AppError.ts
export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ProviderTimeoutError extends AppError {
  constructor(providerName: string) {
    super(`Provider ${providerName} timed out`, 503);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 503);
  }
}
```

#### Tarea 3.2: Implementar Logger

```typescript
// src/infrastructure/logging/Logger.ts
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
    };

    // In production, send to external logging service (e.g., Winston, Datadog)
    console.log(JSON.stringify(logEntry));
  }

  error(message: string, error?: Error): void {
    this.log(LogLevel.ERROR, message, { error: error?.stack });
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }
}
```

**Refactorizar QuoteService para usar Logger:**

```typescript
// src/application/services/QuoteService.ts
import { Logger } from '../../infrastructure/logging/Logger';

export class QuoteService {
  private readonly logger = Logger.getInstance();

  // ...

  async getAllQuotesWithMessages(request: QuoteRequest): Promise<IQuoteResponse> {
    this.logger.info('Processing quote request', {
      origin: request.origin,
      destination: request.destination,
      weight: request.weight,
    });

    // Check cache
    if (this.quoteRepository) {
      const cachedQuotes = await this.quoteRepository.findCached(request);
      if (cachedQuotes && cachedQuotes.length > 0) {
        this.logger.info('Cache hit - returning cached quotes', { count: cachedQuotes.length });
        return { quotes: cachedQuotes, messages: [] };
      }
    }

    // ... rest of implementation with logger calls ...
  }
}
```

**Commits Git:**
```bash
git add src/domain/errors/
git commit -m "feat: add custom error classes (ValidationError, ProviderTimeoutError)"

git add src/infrastructure/logging/Logger.ts
git commit -m "feat: implement singleton Logger with structured logging"

git add src/application/services/QuoteService.ts
git commit -m "refactor: integrate Logger in QuoteService"
```

---

### Sprint 4: Performance Optimization (Importante) 🟡

**Objetivo:** Optimizar performance y agregar métricas

#### Tarea 4.1: Cache Implementation (Already done in Sprint 2)

#### Tarea 4.2: Add Performance Metrics

```typescript
// src/infrastructure/monitoring/PerformanceMonitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordDuration(operation: string, durationMs: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(durationMs);
  }

  getAverageDuration(operation: string): number {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) {
      return 0;
    }
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  getMetrics(): Record<string, { avg: number; count: number }> {
    const result: Record<string, { avg: number; count: number }> = {};
    
    for (const [operation, durations] of this.metrics.entries()) {
      result[operation] = {
        avg: this.getAverageDuration(operation),
        count: durations.length,
      };
    }
    
    return result;
  }
}
```

---

### Sprint 5: Integration & E2E Tests (Deseable) 🟢

**Objetivo:** Agregar tests de integración y E2E

#### Tarea 5.1: Integration Tests

```typescript
// src/__tests__/integration/api/quotes.test.ts
import request from 'supertest';
import app from '../../../app';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

describe('POST /api/quotes Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Happy Path', () => {
    it('should return 200 with quotes from all providers', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 5.5,
          pickupDate: '2026-01-10',
          fragile: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.quotes).toHaveLength(3);
      expect(response.body.quotes[0]).toHaveProperty('providerName');
      expect(response.body.quotes[0]).toHaveProperty('price');
      expect(response.body.quotes[0]).toHaveProperty('isCheapest');
      expect(response.body.quotes[0]).toHaveProperty('isFastest');
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid weight', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: -5,
          pickupDate: '2026-01-10',
          fragile: false,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Weight');
    });
  });
});
```

#### Tarea 5.2: E2E Tests with Playwright

```typescript
// e2e/quote-request.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Quote Request Flow', () => {
  test('User can request quotes and see results', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Fill out form
    await page.fill('[name="origin"]', 'New York, NY');
    await page.fill('[name="destination"]', 'Los Angeles, CA');
    await page.fill('[name="weight"]', '5.5');
    await page.fill('[name="pickupDate"]', '2026-01-10');
    
    // Submit
    await page.click('button:has-text("Obtener Cotizaciones")');

    // Wait for results
    await expect(page.locator('.quote-card')).toHaveCount(3);

    // Verify badges
    await expect(page.locator('.badge-cheapest')).toBeVisible();
    await expect(page.locator('.badge-fastest')).toBeVisible();
  });
});
```

---

### Sprint 6: CI/CD Pipeline (Deseable) 🟢

**Objetivo:** Configurar GitHub Actions para CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        working-directory: ./logistics-back
        run: npm ci
        
      - name: Run linter
        working-directory: ./logistics-back
        run: npm run lint
        
      - name: Run unit tests
        working-directory: ./logistics-back
        run: npm test
        
      - name: Run integration tests
        working-directory: ./logistics-back
        run: npm run test:integration
        
      - name: Generate coverage report
        working-directory: ./logistics-back
        run: npm run test:coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./logistics-back/coverage

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        working-directory: ./logistics-front
        run: npm ci
        
      - name: Run linter
        working-directory: ./logistics-front
        run: npm run lint
        
      - name: Run tests
        working-directory: ./logistics-front
        run: npm test
        
      - name: Build
        working-directory: ./logistics-front
        run: npm run build
```

---

## 📊 Métricas de Éxito

### Pre-Refactorización (Estado Actual)
- ✅ Tests Unitarios: 70%+ cobertura
- ❌ Tests Integración: 0%
- ❌ Tests E2E: 0%
- ❌ Persistencia: No implementada
- ⚠️ Duplicación de código: ~45 líneas repetidas en adapters
- ⚠️ Manejo de errores: Inconsistente
- ❌ Logging: console.log básico
- ❌ CI/CD: No configurado

### Post-Refactorización (Objetivo)
- ✅ Tests Unitarios: 75%+ cobertura
- ✅ Tests Integración: 15+ tests
- ✅ Tests E2E: 5+ escenarios críticos
- ✅ Persistencia: MongoDB con cache TTL
- ✅ Duplicación de código: Eliminada (BaseShippingAdapter)
- ✅ Manejo de errores: Custom error classes + Logger
- ✅ Logging: Structured logging con Logger
- ✅ CI/CD: GitHub Actions configurado

---

## 🚀 Ejecución del Plan

### Orden de Implementación (Recomendado)

1. **Sprint 1** (Día 1-2): Configuración Jest + Refactor Adapters
2. **Sprint 2** (Día 3-5): MongoDB Integration
3. **Sprint 3** (Día 6-7): Error Handling & Logging
4. **Sprint 4** (Día 8): Performance Optimization
5. **Sprint 5** (Día 9-10): Integration & E2E Tests
6. **Sprint 6** (Día 11): CI/CD Pipeline

### Comandos de Verificación

Después de cada sprint:

```bash
# Backend
cd logistics-back
npm test                    # Todos los tests pasan
npm run test:coverage       # 70%+ cobertura
npm run lint                # Sin errores
npm run build               # Build exitoso

# Frontend
cd logistics-front
npm test                    # Todos los tests pasan
npm run lint                # Sin errores
npm run build               # Build exitoso

# E2E (Sprint 5)
npx playwright test         # Todos los tests E2E pasan
```

---

## 📚 Validación de User Stories

### HU-01: Solicitar Cotización de Envío
- ✅ **Estado:** Implementado y funcionando
- ✅ **Tests:** Unit + Integration tests
- 🔄 **Refactor pendiente:** Agregar cache (Sprint 2)

### HU-02: Validación de Datos de Envío
- ✅ **Estado:** Implementado en QuoteRequest entity
- ✅ **Tests:** 15+ tests de validación
- ✅ **Refactor:** Completo (no requiere cambios)

### HU-03: Identificar la Mejor Opción de Envío
- ✅ **Estado:** BadgeService implementado
- ✅ **Tests:** 8+ tests de asignación de badges
- ✅ **Refactor:** Completo (lógica correcta)

### HU-04: Visualizar Estado del Sistema
- ⚠️ **Estado:** Parcialmente implementado
- 🔄 **Refactor pendiente:** Agregar health check robusto (Sprint 3)

### HU-05: Manejar Proveedores No Disponibles
- ✅ **Estado:** Implementado con Promise.allSettled
- ✅ **Tests:** Tests de timeout y error handling
- 🔄 **Refactor pendiente:** Mejorar logging (Sprint 3)

### HU-06 a HU-10: Could Have Features
- ❌ **Estado:** No implementadas (fuera del alcance de MVP)
- 📝 **Nota:** Implementar en fases futuras

---

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: Tests Fallan Después de Refactorización
**Mitigación:** 
- Ejecutar tests después de cada commit
- Usar pequeños commits incrementales
- Mantener tests en verde (GREEN) durante refactoring

### Riesgo 2: MongoDB Connection Failures
**Mitigación:**
- Implementar degradación elegante (sistema funciona sin DB)
- Usar MongoDB Memory Server en tests
- Agregar retry logic en connection

### Riesgo 3: Performance Degradation
**Mitigación:**
- Monitorear response times antes/después
- Agregar performance tests
- Usar cache agresivamente

---

## 🎯 Definición de "Done"

Un sprint de refactorización está completo cuando:

- ✅ Todos los tests existentes siguen pasando (GREEN)
- ✅ Cobertura de tests ≥ 70%
- ✅ Sin errores de ESLint/TypeScript
- ✅ Build exitoso (frontend + backend)
- ✅ Documentación actualizada
- ✅ Git commits siguiendo convenciones
- ✅ Code review aprobado (si aplicable)
- ✅ Performance metrics no degradadas

---

## 📖 Referencias

- **ARCHITECTURE.md** - Principios SOLID y patrones
- **USER_STORIES.md** - Criterios de aceptación
- **TDD_GUIDE.md** - Ciclo RED-GREEN-REFACTOR
- **PRODUCT.md** - Especificaciones de producto

---

**Nota Final:** Este plan prioriza **no romper funcionalidad existente** mientras mejora la calidad del código. Cada cambio debe mantener los tests en verde y seguir los principios TDD.
