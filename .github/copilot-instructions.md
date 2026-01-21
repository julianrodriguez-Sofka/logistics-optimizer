# Engineering Rules: Logistics Shipping Optimizer

## 🎯 Golden Rules
**Si el código no tiene tests, no existe. Si usa `any`, está roto. Si tiene complejidad >10, divídelo.**

## 🛠 Tech Stack
- **Backend:** Node.js + TypeScript 5.9 + Express + MongoDB + RabbitMQ + Socket.IO
- **Frontend:** React 18 + TypeScript + Vite + Tailwind + Vitest
- **Architecture:** Hexagonal (Backend), Component-Based (Frontend)
- **Patterns:** Template Method, Strategy, Repository, Factory, Observer

---

## 🎯 SonarCloud Quality Gates (NO NEGOCIABLE)

### Complejidad Cognitiva ≤ 10
- Si una función es compleja, **extrae métodos privados**
- Un nivel de indentación = más simple de leer y testear

### No Magic Strings
```typescript
// ❌ Malo
if (status === "pending") { }

// ✅ Bueno - Usa constantes
if (status === SHIPMENT_STATUS.PENDING) { }
```

### TypeScript Estricto
- ❌ **NUNCA** uses `any`
- ✅ Usa `unknown` + type guards si es necesario
- ✅ Tipos de retorno explícitos: `: Promise<Quote[]>`
- ✅ Valida inputs: middlewares (backend) o validadores (frontend)

### Mantenibilidad
- ❌ `catch (error) {}` → ✅ Log con contexto + manejo apropiado
- ❌ `console.log()` → ✅ Logger centralizado
- ❌ Código comentado → ✅ Elimínalo (Git es tu historial)
- ❌ `TODO` → ✅ Issue o impleméntalo ahora

---

## 🏗 Backend Architecture Rules

### Estructura de Capas (Arquitectura Hexagonal)

```
src/
├── domain/              # Core de negocio - CERO dependencias externas
│   ├── entities/        # Shipment, Quote, Customer (clases puras)
│   ├── exceptions/      # ValidationError, BusinessRuleError
│   └── interfaces/      # IQuoteRepository, IShippingAdapter
├── application/         # Casos de uso y servicios de aplicación
│   ├── services/        # ShipmentService, QuoteService, PaymentService
│   └── utils/           # Helpers compartidos
└── infrastructure/      # TODO lo que puede cambiar
    ├── adapters/        # DHLAdapter, FedExAdapter, LocalAdapter
    ├── controllers/     # Express route handlers
    ├── database/        # Mongoose models
    ├── messaging/       # RabbitMQ publishers/consumers
    └── websocket/       # Socket.IO events
```

### Reglas por Capa

#### Domain Layer
- **Entities:** Clases TypeScript puras. NO imports de Express, Mongoose, etc.
- **Excepciones:** Hereda de clase base Error. Incluye código de error.
- **Interfaces:** Contratos que infrastructure implementa. Dependency Inversion!

**Ejemplo de Entity correcta:**
```typescript
export class Shipment {
  constructor(
    public readonly id: string,
    public readonly trackingNumber: string,
    private _status: ShipmentStatus,
    public readonly origin: Location,
    public readonly destination: Location
  ) {
    this.validate();
  }

  get status(): ShipmentStatus {
    return this._status;
  }

  markAsDelivered(): void {
    if (this._status === ShipmentStatus.CANCELLED) {
      throw new BusinessRuleError('Cannot deliver cancelled shipment');
    }
    this._status = ShipmentStatus.DELIVERED;
  }

  private validate(): void {
    if (!this.trackingNumber) {
      throw n: Arquitectura Hexagonal

### Estructura de Capas
```
domain/         → Entidades puras, excepciones, interfaces
application/    → Services, casos de uso
infrastructure/ → Adapters, controllers, DB, messaging
```

### Reglas Críticas

#### Domain Layer
- Clases **puras TypeScript** (NO imports de Express/Mongoose)
- Validaciones en constructor
- Excepciones tipadas: `ValidationError`, `BusinessRuleError`

#### Application Layer  
- Services orquestan, NO implementan detalles
- Dependency Injection: interfaces en constructor
- **NUNCA** acceso directo a Mongoose
- Error handling con logging y contexto

#### Infrastructure Layer
- **Adapters:** Extienden `BaseShippingAdapter`
- **Controllers:** Delgados (routing + validación + llamar service)
- **Database:** Mongoose aquí, Repositories mapean a entities

### SOLID Checklist
- [ ] **SRP:** Cada clase una responsabilidad
- [ ] **OCP:** Extensible sin modificar código existente
- [ ] **LSP:** Adapters intercambiables
- [ ] **ISP:** Interfaces específicas (no gigantes)
- [ ] **DIP:** Depende de abstracciones, no implementaciones
    </div>
  );
}
```

**Container (Smart Components):**
- Manejan estado y side effects
- Hacen fetch (via services, NO fetch directo)
- Pasan datos a presentational components

```typescript
export function QuoteResults() {
  const { quotes, isLoading, error } = useQuotes();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div>
      {quotes.map(quote => (
        <QuoteCard
          key={quote.id}
          quote={quote}
          isSelected={quote.id === selectedId}
          onSelect={setSelectedId}
        />
      ))}
    </div>
  );
}
```

### Custom Hooks Best Practices

**Cuándo crear un hook:**
- Lógica reutilizable entre componentes
- Estado complejo (mejor que useState crudo)
- Side effects que se repiten
- Integración con APIs externas

**Ejemplo: useFormValidation**
```typescript
interface ValidationRules {
  [field: string]: (value: any) => string | null;
}

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((field: string, value: any): boolean => {
    const error = rules[field]?.(value);
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
    return !error;
  }, [rules]);

  const validateAll = useCallback((values: Record<string, any>): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const error = rules[field](values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules]);

  const clearErrors = useCallback(() => setErrors({}), []);

  return {
    errors,
    validate,: Component Architecture

### Estructura
```
components/  → UI (forms/, display/, layout/)
hooks/       → Lógica reutilizable
services/    → API layer (NO fetch directo en components)
models/      → TypeScript types (match backend)
utils/       → Helpers, constants
```

### Reglas de Componentes

#### Límite: 200 Líneas
Divide si:
- Más de 5 `useState`
- Múltiples `useEffect` sin relación
- Lógica compleja dentro del componente

#### Presentational vs Container
- **Presentational:** Solo props, sin estado (excepto UI), sin fetch
- **Container:** Estado, side effects, fetch via services

#### Custom Hooks
Crea hooks para:
- Lógica reutilizable (`useFormValidation`)
- Estado complejo (`useQuoteFormState`)
- Integración APIs (`useWebSocket`)

### Services Layer (Obligatorio)
```typescript
// ❌ NO hacer fetch directo en componentes
useEffect(() => { fetch('/api/quotes')... }, []);

// ✅ Usar service layer
useEffect(() => { 
  quoteService.getQuotes(request).then(setQuotes); 
}, []);
```

### Performance
- `useMemo` para cálculos costosos
- `useCallback` para funciones en deps
- `React.memo` para componentes que re-renderizan mucho
- `lazy()` para componentes pesados

### Responsive: Mobile First
```tsx
// ✅ Mobile first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class BusinessRuleError extends BaseError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_ERROR', 422);
  }
}

export class ExternalServiceError extends BaseError {
  constructor(message: string, public readonly provider: string) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, false);
  }
}
```

### Middleware de Error Handling

```typescript
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Request failed', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  if (error instanceof BaseError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { field: error.field })
      }
    });
    return;
  }

  // Error no esperado
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
}
```

### Frontend Error Handling

```typescript
// services/apiService.ts
apiService.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server respondió con error
      const { status, data } = error.response;
      
      if (status === 401) {
        // Redirect a login
        window.location.href = '/login';
      }
      
      if (status === 400 && data.error?.field) {
        // Error de validación con campo específico
        throw new ValidationError(data.error.message, data.error.field);
      }
      
      // Error genérico del server
      throw new ApiError(data.error?.message || 'Request failed', status);
    }
    
    if (error.request) {
      // Request hecho pero no hay response - problema de red
      throw new NetworkError('No connection to server');
    }
    
    // Algo salió mal configurando el request
    throw new Error('Unexpected error');
  }
);
```

---

## 📝 Code Style & Conventions

### Naming Conventions

```typescript
// Classes: PascalCase
class ShipmentService {}

// Interfaces: PascalCase con I prefix (solo para interfaces de infrastructure)
interface IQuoteRepository {}

// Types/Models: PascalCase sin prefix
type Quote = { /* ... */ };

// Functions/Variables: camelCase
const calculateDistance = () => {};
let totalPrice = 0;

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = process.env.API_URL;

// Private members: prefix con _
class Shipment {
  private _status: ShipmentStatus;
}

// Booleans: is/has/should prefix
const isValid = true;
const hasPermission = false;
const shouldRetry = true;

// Handlers: handle/on prefix
const handleClick = () => {};
const onSubmit = () => {};

// Async functions: nombre descriptivo (no necesita async prefix si retorna Promise)
async function fetchQuotes(): Promise<Quote[]> {}
```

### File Naming

```
Backend:
- PascalCase para classes: ShipmentService.ts
- camelCase para utilities: formatDate.ts
- kebab-case para tests: shipment-service.test.ts

Frontend:
- PascalCase para components: QuoteCard.tsx
- camelCase para hooks: useFormValidation.ts
- camelCase para services: quoteService.ts
- kebab-case para tests: quote-card.test.tsx
```

### Import Order

```typescript
// 1. External libraries
import express from 'express';
import { Request, Response } from 'express';

// 2. Internal modules - domain
import { Shipment } from '@/domain/entities/Shipment';
import { ValidationError } from '@/domain/exceptions/ValidationError';

// 3. Internal modules - application
import { ShipmentService } from '@/application/services/ShipmentService';

// 4. Internal modules - infrastructure
import { QuoteRepository } from '@/infrastructure/database/QuoteRepository';

// 5. Types
import type { Quote, QuoteRequest } from '@/types';

// 6. Utils & constants
import { calculateDistance } from '@/utils/distance';
import { MAX_WEIGHT } from '@/constants';
```

---

## 🔐 Security Checklist

### Backend
- [ ] Todas las rutas validadas con middleware o en controller
- [ ] No usar `eval()` ni `Function()` constructor
- [ ] Rate limiting en endpoints públicos
- [ ] CORS configurado correctamente
- [ ] Helmet.j(TDD)

### Workflow
1. **Red:** Test que falla
2. **Green:** Código mínimo para pasar
3. **Refactor:** Mejorar sin romper

### Backend (Jest)
- **Unit:** Mock dependencies, test lógica aislada
- **Integration:** MongoDB Memory Server, test rutas completas
- Estructura: `__tests__/unit/` y `__tests__/integration/`

### Frontend (Vitest + RTL)
- Test comportamiento del usuario, no implementación
- `render()` + `screen` + `userEvent`
- Mock services, no componentes

### Coverage: 80% mínimo, 100% en services críticos

---

## 🚨 Error Handling

### Backend
- Excepciones tipadas: `ValidationError`, `BusinessRuleError`, `ExternalServiceError`
- Middleware centralizado para errors
- Log con contexto: path, method, body (sin secrets)

### Frontend
- Interceptores Axios para manejo consistente
- Errores de validación con field específico
- Errores de red con mensaje user-friendly
- NO exponer detalles técnicos al usuario

---

## 📝 Naming & Style

### Conventions
```typescript
PascalCase:   ShipmentService, Quote, IQuoteRepository
camelCase:    calculatePrice, totalAmount
SCREAMING:    MAX_RETRIES, API_BASE_URL
Booleans:     isValid, hasPermission
Handlers:     handleClick, onSubmit
```

### Files
```
Backend:  ShipmentService.ts, formatDate.ts, shipment-service.test.ts
Frontend: QuoteCard.tsx, useFormValidation.ts, quote-card.test.tsx
```

---

## 🔐 Security

### Critical
- [ ] Valida TODOS los inputs (backend + frontend)
- [ ] Secrets en `.env`, nunca en código
- [ ] Rate limiting en endpoints públicos
- [ ] No logs de passwords/tokens/tarjetas
- [ ] CORS + Helmet.js configurados
- [ ] JWT con expiración� Contexto Profundo

Para entender arquitectura, decisiones técnicas y patrones de prompting:

### Backend
- `logistics-back/ENGINEERING_CONTEXT.md` - Por qué arquitectura hexagonal, stack, patrones
- `logistics-back/ENGINEERING_PROMPTING.md` - Cómo construir features con IA

### Frontend  
- `logistics-front/ENGINEERING_CONTEXT.md` - Componentes, hooks, performance
- `logistics-front/ENGINEERING_PROMPTING.md` - Patrones de prompting React

### Sistema
- `ARCHITECTURE.md` - Patrones y validaciones
- `PRODUCT.md` - Contratos API y formatos JSON

---

## ✅ Pre-Commit Checklist

- [ ] Tests pasan + coverage ≥80%
- [ ] Linter sin errores
- [ ] No `console.log()`, no `any`, no código comentado
- [ ] Complejidad ≤10
- [ ] Commit descriptivo (no "fix", "changes")

---

**Calidad > Velocidad** - Código mantenible que otros 