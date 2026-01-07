# 🏗️ Arquitectura - Logistics Shipping Optimizer

## 🎯 Visión General

Sistema de optimización de envíos que compara cotizaciones de múltiples proveedores (FedEx, DHL, Local) en tiempo real. Diseñado con principios SOLID y arquitectura limpia.

**Stack:** Node.js + TypeScript + Express + MongoDB + React + Vite + Docker

---

## 🏛️ Arquitectura de Alto Nivel

```
Frontend (React:5173) → Backend (Express:3000) → [Shipping Providers + MongoDB:27017]
```

**Flujo:**
1. Usuario solicita cotización
2. Backend consulta cache en MongoDB (TTL 5 min)
3. Si no hay cache, consulta providers en paralelo
4. Aplica transformaciones (fragile surcharge, badges)
5. Guarda en cache y retorna al frontend

---

## 🎨 Patrones de Diseño

### 1. Hexagonal Architecture
**¿Por qué?** Separar lógica de negocio de dependencias externas.

```
domain/         → Entidades, interfaces (negocio puro)
application/    → Casos de uso, servicios
infrastructure/ → Adapters, DB, HTTP
```

**Beneficios:** Testabilidad, independencia de frameworks, facilita cambios tecnológicos.

### 2. Adapter Pattern
**¿Por qué?** Unificar APIs diferentes de providers.

```typescript
interface IShippingProvider {
  calculateShipping(weight: number, destination: string): Promise<Quote>;
}

class FedExAdapter implements IShippingProvider { ... }
class DHLAdapter implements IShippingProvider { ... }
```

**Beneficios:** Agregar providers sin modificar código (Open/Closed), testing aislado.  
**Ubicación:** `logistics-back/src/infrastructure/adapters/`

### 3. Template Method
**¿Por qué?** Compartir validaciones comunes entre adapters.

```typescript
abstract class BaseShippingAdapter {
  protected validateShippingRequest(weight, destination): void {
    if (weight < 0.1) throw new Error(...);
    // Validaciones comunes
  }
  abstract calculateShipping(...): Promise<Quote>;
}
```

**Beneficios:** DRY (~45 líneas eliminadas), mantenimiento centralizado.  
**Ubicación:** `BaseShippingAdapter.ts`

### 4. Repository Pattern
**¿Por qué?** Abstraer persistencia para testing y flexibilidad.

```typescript
interface IQuoteRepository {
  findCached(request: QuoteRequest): Promise<Quote[]>;
  save(quote: Quote): Promise<void>;
}
```

**Beneficios:** Testing con mocks, cambiar BD sin tocar servicios.  
**Ubicación:** `domain/interfaces/` + `infrastructure/database/repositories/`

### 5. Dependency Injection
**¿Por qué?** Facilitar testing y reducir acoplamiento.

```typescript
class QuoteService {
  constructor(
    private providers: IShippingProvider[],
    private quoteRepository?: IQuoteRepository
  ) {}
}
```

**Beneficios:** Testing sin dependencias reales, configuración flexible.

### 6. Singleton
**¿Por qué?** Una sola conexión a MongoDB.

```typescript
class MongoDBConnection {
  private static instance: MongoDBConnection;
  private constructor() {}
  static getInstance() { ... }
}
```

**Beneficios:** Evita múltiples conexiones, gestión centralizada.

### 7. Strategy Pattern
**¿Por qué?** Diferentes algoritmos de pricing.

```typescript
class WeightPricingCalculator {
  calculateZone(origin, destination): string { ... }
  applyFragileSurcharge(price, fragile): number { ... }
}
```

### 8. Factory Pattern (Badge Service)
**¿Por qué?** Crear badges dinámicamente.

```typescript
class BadgeService {
  assignBadges(quotes: Quote[]): void {
    const cheapest = this.findCheapest(quotes);
    if (cheapest) cheapest.badge = 'cheapest';
  }
}
```

### 9. Observer Pattern (Logging)
**¿Por qué?** Logging desacoplado.

```typescript
class Logger {
  info(message: string, meta?: any): void { ... }
  error(message: string, error?: any): void { ... }
}
export const logger = new Logger();
```

### 10. Graceful Degradation
**¿Por qué?** Funcionar sin MongoDB.

```typescript
if (this.quoteRepository) {
  try {
    return await this.quoteRepository.findCached(request);
  } catch (error) {
    logger.error('Cache error', error);
    // Continuar sin cache
  }
}
```

---

## 📦 Estructura Backend

```
logistics-back/src/
├── domain/
│   ├── entities/          # Quote, QuoteRequest, ZoneConfig
│   ├── interfaces/        # IShippingProvider, IQuoteRepository
│   └── exceptions/        # ValidationError
├── application/
│   ├── services/          # QuoteService, BadgeService, WeightPricingCalculator
│   └── utils/             # timeout.ts
├── infrastructure/
│   ├── adapters/          # BaseShippingAdapter, FedEx, DHL, Local
│   ├── controllers/       # QuoteController, HealthController
│   ├── routes/            # quotes.routes, health.routes
│   ├── database/          # connection, models, repositories
│   └── logging/           # Logger
└── __tests__/
    ├── unit/              # Tests unitarios
    └── integration/       # Tests integración
```

**Responsabilidades:**
- **Domain:** Lógica de negocio pura (sin HTTP/DB)
- **Application:** Casos de uso, orquestación
- **Infrastructure:** Implementaciones concretas

---

## 🎨 Estructura Frontend

```
logistics-front/src/
├── domain/models/         # DTOs, tipos
├── services/              # quoteService.ts (API calls)
├── presentation/
│   ├── components/        # QuoteForm, QuoteTable, ErrorMessage
│   └── hooks/             # useQuotes (custom hook)
├── App.tsx
└── main.tsx
```

**Patrón:** Presentational/Container + Custom Hooks  
**Beneficios:** Separación lógica/presentación, reusabilidad, testing fácil

---

## 🏃 Instrucciones de Ejecución

### Opción 1: Docker (Recomendado)

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Servicios:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3000
# - MongoDB: mongodb://localhost:27017

# Health checks
curl http://localhost:3000/api/health
curl http://localhost:5173/health
```

### Opción 2: Desarrollo Local

**Backend:**
```bash
cd logistics-back
npm install

# .env
MONGODB_URI=mongodb://localhost:27017/logistics-optimizer
PORT=3000
LOG_LEVEL=debug

npm run dev         # Hot reload
# o
npm run build && npm start
```

**Frontend:**
```bash
cd logistics-front
npm install

# .env.local
VITE_API_URL=http://localhost:3000/api

npm run dev         # Dev mode
# o
npm run build && npm run preview
```

### Variables de Entorno

**Backend:**
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://admin:adminpassword@localhost:27017/logistics-optimizer?authSource=admin
LOG_LEVEL=debug
```

**Frontend:**
```bash
VITE_API_URL=http://localhost:3000/api
```

---

## 🧪 Testing

### Backend (Jest)

```bash
cd logistics-back

npm test                    # All tests
npm run test:coverage       # Coverage report
npm run test:watch          # Watch mode
npm test -- quotes.test.ts  # Specific test
```

**Coverage Thresholds:** 70% (branches, functions, lines, statements)

**Tipos:**
- **Unit:** `__tests__/unit/` - Servicios, adapters individuales
- **Integration:** `__tests__/integration/` - Endpoints completos con MongoDB Memory Server

**Ejemplo:**
```typescript
describe('QuoteService', () => {
  let service: QuoteService;
  let mockProvider: jest.Mocked<IShippingProvider>;

  beforeEach(() => {
    mockProvider = { calculateShipping: jest.fn() };
    service = new QuoteService([mockProvider]);
  });

  it('should return cached quotes when available', async () => {
    // Arrange
    const request = new QuoteRequest('Bogotá', 'Medellín', 10, false);
    mockRepository.findCached.mockResolvedValue([...]);

    // Act
    const result = await service.getAllQuotesWithMessages(request);

    // Assert
    expect(result.quotes).toEqual([...]);
    expect(mockProvider.calculateShipping).not.toHaveBeenCalled();
  });
});
```

### Frontend (Vitest)

```bash
cd logistics-front

npm test              # All tests
npm test -- --ui      # Interactive UI
npm test -- --coverage
```

**Ejemplo:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('QuoteForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<QuoteForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Origin'), 'Bogotá');
    await userEvent.click(screen.getByText('Get Quotes'));

    expect(onSubmit).toHaveBeenCalledWith({ origin: 'Bogotá', ... });
  });
});
```

### MongoDB Memory Server (Setup)

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

---

## 🚀 Pipeline CI/CD

### Docker Multi-Stage Build

```dockerfile
FROM node:20-alpine AS deps
RUN npm ci

FROM node:20-alpine AS dev
COPY --from=deps /app/node_modules ./node_modules
CMD ["npm", "run", "dev"]

FROM node:20-alpine AS builder
RUN npm run build

FROM node:20-alpine AS production
COPY --from=builder /app/dist ./dist
CMD ["npm", "start"]
```

**Beneficios:** Imágenes pequeñas (~100MB vs ~500MB), seguridad, caché eficiente

### Pipeline Futuro

```
Commit → Pre-commit (ESLint) → Push → CI (Tests + Build + Coverage) → Deploy
```

---

## 🐳 Docker Commands

```bash
docker-compose logs -f backend          # Ver logs
docker-compose restart backend          # Reiniciar
docker-compose build --no-cache backend # Rebuild
docker-compose exec backend npm test    # Run comando
docker-compose exec backend sh          # Shell
docker-compose ps                       # Estado
docker-compose down -v                  # Limpiar todo
```

---

## 📊 Monitoring

### Health Checks

```bash
curl http://localhost:3000/api/health
# { status: 'ok', uptime: 12345, database: 'connected' }

curl http://localhost:3000/api/adapters/status
# { providers: [{ name: 'FedEx', status: 'healthy' }] }
```

### Logs

```typescript
logger.info('Processing quote request', { origin, destination, weight });
logger.error('Provider timeout', { provider: 'FedEx', duration: 5000 });
```

```bash
docker-compose logs -f
docker-compose logs -f backend | grep ERROR
```

---

## 🔧 Troubleshooting

**Puerto 3000 ocupado:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**MongoDB no conecta:**
```bash
docker ps | grep mongodb
docker-compose logs mongodb
docker-compose restart mongodb
```

**Tests timeout:**
```javascript
// jest.config.js
testTimeout: 10000
```

**Frontend no carga API:**
```bash
echo $VITE_API_URL
# Verificar CORS en app.ts
```

---

## 📈 Roadmap

**Sprint 5:** Performance (rate limiting, Redis, compression)  
**Sprint 6:** Observability (Prometheus, Grafana, Jaeger)  
**Sprint 7:** CI/CD (GitHub Actions, K8s deployment)  
**Sprint 8:** Security (Helmet, API keys, OWASP audit)

---

## 📚 Referencias

- [Refactoring.Guru - Design Patterns](https://refactoring.guru/design-patterns)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Jest Documentation](https://jestjs.io/)
- [Docker Best Practices](https://docs.docker.com/compose/best-practices/)

---

**Versión:** 1.0.0 | **Actualizado:** Enero 2026
