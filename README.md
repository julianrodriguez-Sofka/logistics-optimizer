# 🚢 Logistics Shipping Optimizer

Sistema de optimización de envíos que compara cotizaciones de múltiples proveedores (FedEx, DHL, Local) en tiempo real. Diseñado con principios SOLID y arquitectura limpia.

**Stack:** Node.js + TypeScript + Express + MongoDB + React + Vite + Docker

---

## 🏛️ Arquitectura

### Arquitectura de Alto Nivel

```
Frontend (React:5173) → Backend (Express:3000) → [Shipping Providers + MongoDB:27017]
```

**Flujo Principal:**
1. Usuario solicita cotización desde el frontend
2. Backend consulta cache en MongoDB (TTL 5 minutos)
3. Si no hay cache, consulta a los providers en paralelo
4. Aplica transformaciones (recargos por fragilidad, badges)
5. Guarda resultado en cache y retorna al frontend

### Arquitectura Hexagonal (Backend)

El backend sigue **Arquitectura Hexagonal** para separar la lógica de negocio de las dependencias externas:

```
logistics-back/src/
├── domain/              # Capa de Dominio (Negocio Puro)
│   ├── entities/        # Entidades del negocio
│   ├── interfaces/      # Contratos (IShippingProvider, IQuoteRepository)
│   └── exceptions/      # Excepciones de negocio
│
├── application/         # Capa de Aplicación (Casos de Uso)
│   ├── services/        # QuoteService, BadgeService, ProviderHealthService
│   └── utils/           # Utilidades (timeout, validators)
│
└── infrastructure/      # Capa de Infraestructura (Detalles)
    ├── adapters/        # Adapters de providers (FedEx, DHL, Local)
    ├── controllers/     # Controllers HTTP
    ├── database/        # Repositorios y conexión MongoDB
    ├── middlewares/     # Middlewares Express
    └── routes/          # Definición de rutas
```

**Beneficios:**
-  **Testabilidad:** Lógica de negocio independiente de frameworks
-  **Flexibilidad:** Fácil cambiar tecnologías (BD, HTTP, providers)
-  **Mantenibilidad:** Separación clara de responsabilidades

### Arquitectura Frontend (Component-Based)

El frontend utiliza una **arquitectura basada en componentes** con separación por tipo de responsabilidad:

```
logistics-front/src/
├── models/              # Interfaces TypeScript (Contratos de datos)
│   ├── Quote.ts         # IQuote, IQuoteResponse, IProviderMessage
│   ├── QuoteRequest.ts  # IQuoteRequest
│   └── ProviderStatus.ts
│
├── services/            # Capa de servicios (Comunicación API)
│   └── quoteService.ts  # Llamadas HTTP con fetch nativo
│
├── components/          # Componentes React (Presentación)
│   ├── QuoteRequestForm.tsx    # Formulario principal
│   ├── QuoteResultsList.tsx    # Lista de resultados
│   ├── ProviderStatusWidget.tsx
│   ├── FormField.tsx           # Componentes reutilizables
│   └── ...
│
├── hooks/               # Custom Hooks (Lógica de negocio)
│   ├── useQuoteFormState.ts    # Manejo de estado del formulario
│   ├── useFormValidation.ts    # Lógica de validación
│   └── useProviderStatus.ts    # Estado de proveedores
│
└── utils/               # Utilidades compartidas
    ├── validation/      # Validadores centralizados
    │   ├── QuoteValidator.ts
    │   └── QuoteValidationRules.ts
    ├── adapters/        # Adapters para transformación de datos
    ├── constants.ts     # Constantes de configuración
    └── providerConfig.ts
```

**Características:**
-  **Separación por tipo de responsabilidad:** Organización horizontal clara
-  **Composición de componentes:** UI construida con componentes pequeños y reutilizables
-  **Custom Hooks:** Lógica de negocio extraída de componentes (SRP)
-  **Capa de servicios simple:** Comunicación directa con API sin abstracciones innecesarias

---

## 🎨 Patrones de Diseño

### 1. **Template Method Pattern** ⭐

**Patrón principal utilizado para eliminar código duplicado entre proveedores.**

#### ¿Por qué Template Method y NO Adapter?

**Contexto del ejercicio:** Aunque el ejercicio sugiere usar *Adapter Pattern* para "unificar interfaces de diferentes proveedores", la realidad es que:

-  **NO hay APIs externas reales** de FedEx, DHL o Local que adaptar
-  **NO estamos traduciendo** una interfaz existente a otra
-  **Estamos simulando** los proveedores implementándolos desde cero
-  **El problema real era** código duplicado (validaciones repetidas)

**Decisión técnica:** Se implementó **Template Method** porque resuelve el problema real del código:

```typescript
// Clase base abstracta define el esqueleto
abstract class BaseShippingAdapter implements IShippingProvider {
  protected readonly MIN_WEIGHT = 0.1;
  protected readonly MAX_WEIGHT = 1000;

  // MÉTODO TEMPLATE: Define pasos comunes (concreto)
  protected validateShippingRequest(weight: number, destination: string): void {
    if (weight < this.MIN_WEIGHT) throw new Error(...);
    if (weight > this.MAX_WEIGHT) throw new Error(...);
    if (!destination) throw new Error(...);
  }

  // HOOK METHOD: Cada subclase define su algoritmo (abstracto)
  abstract calculateShipping(weight: number, destination: string): Promise<Quote>;
}

// Implementación concreta
class FedExAdapter extends BaseShippingAdapter {
  async calculateShipping(weight: number, destination: string): Promise<Quote> {
    // 1. USA el método template heredado
    this.validateShippingRequest(weight, destination);
    
    // 2. Implementa su algoritmo específico
    const zone = ZoneConfig.getZoneByDestination(destination);
    const weightCost = WeightPricingCalculator.calculateCost(...);
    const price = this.BASE_PRICE + (weightCost * zoneMultiplier);
    
    return new Quote({...});
  }
}
```

#### ¿Qué resuelve Template Method?

**Problema original (sin patrón):**
```typescript
 CÓDIGO DUPLICADO en cada clase:

class FedExAdapter {
  calculateShipping() {
    if (weight < 0.1) throw...  // Duplicado
    if (weight > 1000) throw... // Duplicado
    if (!destination) throw...  // Duplicado
    // lógica FedEx
  }
}

class DHLAdapter {
  calculateShipping() {
    if (weight < 0.1) throw...  // Duplicado
    if (weight > 1000) throw... // Duplicado
    if (!destination) throw...  // Duplicado
    // lógica DHL
  }
}

// ~45 líneas duplicadas entre 3 adapters
```

**Solución con Template Method:**
```typescript
 CÓDIGO REUTILIZADO:

abstract class BaseShippingAdapter {
  protected validateShippingRequest() { ... } // UNA sola vez
  abstract calculateShipping();
}

class FedExAdapter extends BaseShippingAdapter {
  calculateShipping() {
    this.validateShippingRequest(); // Heredado
    // solo lógica específica de FedEx
  }
}

// ~45 líneas eliminadas
```

#### ¿Por qué NO es Adapter Pattern?

**Adapter Pattern** requiere:
```typescript
// API externa existente (que NO podemos modificar)
class FedExExternalAPI {
  getFedExShippingCost(params: FedExParams): FedExResponse { ... }
}

// Adapter traduce la interfaz externa a nuestra interfaz
class FedExAdapter implements IShippingProvider {
  constructor(private fedexAPI: FedExExternalAPI) {}
  
  calculateShipping(weight, dest): Quote {
    // ADAPTA: Traduce nuestros parámetros → FedExParams
    const fedexParams = this.translateToFedExFormat(weight, dest);
    
    // LLAMA a la API externa
    const fedexResponse = this.fedexAPI.getFedExShippingCost(fedexParams);
    
    // ADAPTA: Traduce FedExResponse → Quote
    return this.translateToQuote(fedexResponse);
  }
}
```

**En nuestro código:**
-  NO hay API externa de FedEx
-  NO hay traducción de interfaces
-  Implementamos la lógica desde cero
-  Solo reutilizamos validaciones comunes

#### Conclusión profesional

**Patrón implementado:** Template Method 

**Razones:**
1. Define un esqueleto de algoritmo en la clase base
2. Comparte comportamiento común (`validateShippingRequest`)
3. Permite que subclases definan pasos específicos (`calculateShipping`)
4. Resuelve duplicación de código (principio DRY)

**Nota sobre el ejercicio:**  
El ejercicio sugiere *Adapter* porque en un contexto real con APIs externas de FedEx/DHL sería el patrón correcto. Sin embargo, al **simular** los proveedores desde cero, Template Method es la solución técnicamente apropiada para evitar duplicación.

**Patrón secundario:** Strategy Pattern (uso polimórfico mediante `IShippingProvider`)

**Beneficios:**
-  **DRY:** Eliminó ~45 líneas duplicadas
-  **Open/Closed:** Agregar providers sin modificar código base
-  **Mantenimiento:** Cambios en validaciones en un solo lugar
-  **Extensibilidad:** Fácil agregar nuevos providers

**Ubicación:**
- Clase template base: `infrastructure/adapters/BaseShippingAdapter.ts`
- Interfaz: `domain/interfaces/IShippingProvider.ts`
- Implementaciones concretas: `infrastructure/adapters/{FedEx,DHL,Local}Adapter.ts`

---

### 2. **Repository Pattern**

**¿Por qué?** Abstraer la persistencia para facilitar testing y cambios de tecnología.

```typescript
interface IQuoteRepository {
  findCached(request: QuoteRequest): Promise<Quote[] | null>;
  save(quotes: Quote[], request: QuoteRequest): Promise<void>;
}
```

**Beneficios:**
-  Testing con mocks sin base de datos real
-  Cambiar BD sin tocar servicios de aplicación
-  Cache transparente con TTL

**Ubicación:** 
- Interfaz: `domain/interfaces/IQuoteRepository.ts`
- Implementación: `infrastructure/database/repositories/`

---

### 3. **Dependency Injection** (Backend)

**¿Por qué?** Reducir acoplamiento y facilitar testing.

```typescript
// Backend
class QuoteService {
  constructor(
    private providers: IShippingProvider[],
    private quoteRepository?: IQuoteRepository
  ) {}
}
```

**Beneficios:**
-  Testing sin dependencias reales
-  Configuración flexible
-  Facilita mocking

**Nota Frontend:** El frontend usa un enfoque más simple con funciones directas (`requestQuotes`) sin abstracciones innecesarias, apropiado para el tamaño del proyecto.

---

### 4. **Singleton Pattern**

**¿Por qué?** Una única conexión a MongoDB en toda la aplicación.

```typescript
class DatabaseService {
  private static instance: DatabaseService;
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
}
```

**Beneficios:**
-  Evita múltiples conexiones concurrentes
-  Ahorro de recursos
-  Estado centralizado

**Ubicación:** `logistics-back/src/infrastructure/database/DatabaseService.ts`

---


## 🚀 Instalación y Ejecución

### Prerrequisitos

- Node.js >= 20x
- npm >= 9.x
- Docker y Docker Compose (opcional)

### Opción 1: Ejecución con Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd shipping-optimizer

# 2. Iniciar todos los servicios
docker-compose up -d

# 3. Verificar que los servicios estén corriendo
docker-compose ps

# Servicios disponibles:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3000
# - MongoDB: localhost:27017
```

**Comandos útiles:**

```bash
# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener servicios
docker-compose down

# Reconstruir servicios después de cambios
docker-compose up -d --build
```

### Opción 2: Ejecución Local

#### Backend

```bash
cd logistics-back

# 1. Instalar dependencias
npm install

# 2. Asegurarse de tener MongoDB corriendo

docker run -d -p 27017:27017 mongodb:7

# 3. Iniciar en modo desarrollo
npm run dev

# 4. Compilar para producción
npm run build
npm start
```

#### Frontend

```bash
cd logistics-front

# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run dev

# 3. Compilar para producción
npm run build
npm run preview
```

### Variables de Entorno

**Backend** (`logistics-back/.env`):
```env
PORT=3000
MONGODB_URI=mongodb://admin:adminpassword@localhost:27017/logistics-optimizer?authSource=admin
NODE_ENV=development
```

**Frontend** (`logistics-front/.env`):
```env
VITE_API_URL=http://localhost:3000
```

---

## 🧪 Tests

### Backend Tests

El backend utiliza **Jest** con cobertura completa de unit e integration tests.

```bash
cd logistics-back

# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch

# Tests de API con Postman/Newman
npm run test:api
```

**Estructura de Tests:**

```
src/__tests__/
├── unit/                # Tests unitarios
│   ├── application/     # Tests de servicios
│   ├── domain/          # Tests de entidades
│   └── infrastructure/  # Tests de adapters
└── integration/         # Tests de integración
    ├── quotes.test.ts
    ├── validation-middleware.test.ts
    └── adapters-status.test.ts
```

**Cobertura Esperada:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

### Frontend Tests

El frontend utiliza **Vitest** con React Testing Library.

```bash
cd logistics-front

# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test -- --coverage

# Tests en modo watch
npm test -- --watch

# Tests con UI interactiva
npm test -- --ui
```

**Tipos de Tests:**
- **Unit Tests:** Hooks, validators, services
- **Component Tests:** Renderizado, interacciones
- **Integration Tests:** Flujos completos

### CI/CD Pipeline

El proyecto incluye GitHub Actions para CI/CD:

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  backend-tests:
    - npm install
    - npm test
    - npm run test:coverage
  
  frontend-tests:
    - npm install
    - npm test -- --run
    - npm run build
  
  docker-build:
    - docker-compose build
    - docker-compose up -d
    - npm run test:api
```

**Para ejecutar localmente:**

```bash
# 1. Backend tests
cd logistics-back && npm test

# 2. Frontend tests
cd logistics-front && npm test -- --run

# 3. Integration tests
docker-compose up -d
cd logistics-back && npm run test:api
```

---

## 🤖 AI Collaboration Log

> **Nota:** Esta sección documenta ejemplos donde se corrigió o mejoró el código generado por IA durante el desarrollo.

### Ejemplo 1: Patron Adapter 

**Contexto:**
La IA habia creado de manera parcialmente correcta el patron Adapter, pero luego de un analisis de aplicativo y de que pues se estaban 
simulando los proveedores y de que la IA habia generado casi que el mismo metodo para calcular los precios se desidio mejor usar
el Patron Template que es similar a el patron Adapter que no se enfoca en "traducir" si no a implementar esa misma logica para aquellas subclases


**Código generado por IA (Incorrecto):**
```typescript
export class FedExAdapter implements IShippingProvider {
  private readonly BASE_PRICE = 50;
  private readonly PRICE_PER_KG = 3.5;
  private readonly MIN_DELIVERY_DAYS = 3;
  private readonly MAX_DELIVERY_DAYS = 4;

  async calculateShipping(weight: number, destination: string): Promise<Quote> {
    // Validate weight
    if (weight < 0.1) {
      throw new Error('Weight must be greater than 0.1 kg');
    }
    if (weight > 1000) {
      throw new Error('Weight must be less than or equal to 1000 kg');
    }

    if (!destination || destination.trim() === '') {
      throw new Error('Destination is required');
    }
    const price = this.BASE_PRICE + (weight * this.PRICE_PER_KG);
    return new Quote({
      providerId:...
      ...
      ...
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

**Código corregido:**
```typescript
export class FedExAdapter extends BaseShippingAdapter {
  private readonly BASE_PRICE = 10000;
  private readonly MIN_DELIVERY_DAYS = 3;
  private readonly MAX_DELIVERY_DAYS = 4;
  private readonly CARRIER_NAME = 'FedEx';

  async calculateShipping(weight: number, destination: string): Promise<Quote> {
    this.validateShippingRequest(weight, destination);

    const zone = ZoneConfig.getZoneByDestination(destination);
    const weightCost = WeightPricingCalculator.calculateCost(
      weight,
      WeightPricingCalculator.getFedExTiers()
    );

    const zoneMultiplier = ZoneConfig.getMultiplier(this.CARRIER_NAME, zone);
    const price = this.BASE_PRICE + (weightCost * zoneMultiplier);

    return new Quote({
      providerId: 'fedex-ground',
      providerName: 'FedEx Ground',
      price: price,
      currency: 'COP',
      minDays: this.MIN_DELIVERY_DAYS,
      maxDays: this.MAX_DELIVERY_DAYS,
      transportMode: 'Truck',
      isCheapest: false,
      isFastest: false,
    });
  }

}
```
---

### Ejemplo 2: Front End 

**Contexto:**
Le habia pedido a la IA que me generara la UI de la plataforma en base a un ejemplo que genere usando https://stitch.withgoogle.com/
Pero cuando la IA empezo a generar esta UI inicialmente le costo mucho tomar el ejemplo de la imagen que le comparti y finalmente 
genero el codigo pero no tuvo encuenta la componetizacion y genero un archivo extremadamento largo. Luego de a ver tenido este codigo,
se le pidio con un agente especializado en React que usara buenas practicas y componetizara ese codigo generado.

**Código generado por IA (Incorrecto):**
```typescript
 return (
    <div className="flex h-screen w-full bg-background-light">
      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:flex flex-col w-[280px] h-full border-r border-border-light bg-card-light flex-shrink-0">
        <div className="p-6 flex flex-col h-full justify-between">
          <div className="flex flex-col gap-8">
            {/* Logo */}
            <div className="flex gap-3 items-center">
              <div className="bg-primary/10 flex items-center justify-center size-10 rounded-full shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
                  local_shipping
                </span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-text-dark text-lg font-bold leading-tight">Logistics Pro</h1>
                <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Optimizer v2.4</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-2">
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
                <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                  dashboard
                </span>
                <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Dashboard</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20" href="#">
                <span className="material-symbols-outlined text-primary fill-1" style={{ fontSize: '24px' }}>
                  package_2
                </span>
                <p className="text-primary text-sm font-bold leading-normal">New Shipment</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
                <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                  local_shipping
                </span>
                <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Carriers</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
                <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                  receipt_long
                </span>
                <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Invoices</p>
              </a>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-2">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-light transition-colors group" href="#">
              <span className="material-symbols-outlined text-text-muted group-hover:text-primary" style={{ fontSize: '24px' }}>
                settings
              </span>
              <p className="text-text-muted group-hover:text-text-dark text-sm font-medium leading-normal">Settings</p>
            </a>
            <div className="mt-4 pt-4 border-t border-border-light flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div className="flex flex-col">
                <p className="text-text-dark text-sm font-medium">Alex Morgan</p>
                <p className="text-text-muted text-xs">alex@company.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background-light relative">
        {/* Header */}
        <header className="w-full px-6 py-8 md:px-12 flex flex-col gap-2">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div className="flex min-w-72 flex-col gap-2">
              <h2 className="text-text-dark text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                New Shipment Estimate
              </h2>
              <p className="text-text-muted text-base font-normal leading-normal">
                Enter details to compare rates across all connected providers via Unified API.
              </p>
            </div>
            <button className="bg-accent-info hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-accent-info/20">
              <span className="material-symbols-outlined text-xl">history</span>
              View Past Quotes
            </button>
          </div>
        </header>

        {/* Stats Section */}
        <section className="w-full px-6 md:px-12 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-light bg-card-light shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wide">Unified API Status</p>
                <span className="material-symbols-outlined text-accent-success" style={{ fontSize: '20px' }}>
                  check_circle
                </span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-text-dark tracking-tight text-2xl font-bold leading-none">Online</p>
                <p className="text-accent-success text-sm font-medium mb-0.5">99.9% Uptime</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-light bg-card-light shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wide">Active Adapters</p>
                <span className="material-symbols-outlined text-accent-info" style={{ fontSize: '20px' }}>
                  hub
                </span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-text-dark tracking-tight text-2xl font-bold leading-none">3/3</p>
                <p className="text-text-muted text-sm font-medium mb-0.5">FedEx, DHL, Local</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-light bg-card-light shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wide">Avg. Response Time</p>
                <span className="material-symbols-outlined text-accent-purple" style={{ fontSize: '20px' }}>
                  speed
                </span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-text-dark tracking-tight text-2xl font-bold leading-none">120ms</p>
                <p className="text-text-muted text-sm font-medium mb-0.5">Optimized</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <div className="flex-1 w-full px-6 md:px-12 pb-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Step 1: Form */}
            <div className="xl:col-span-5 flex flex-col gap-6" id="step-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`step-indicator ${currentStep === 1 ? 'active' : 'completed'}`}>
                  {currentStep === 1 ? '1' : <span className="material-symbols-outlined text-sm">check</span>}
                </div>
                <h3 className="text-text-dark text-xl font-bold">Enter Shipment Details</h3>
              </div>
              
              <QuoteRequestForm onSubmit={handleSubmit} loading={loading} />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-600">error</span>
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-border-light bg-background-light p-5 flex gap-4">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary">integration_instructions</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-text-dark text-sm font-bold">Standardized Output</h4>
                  <p className="text-text-muted text-xs leading-relaxed">
                    Our backend adapter normalizes data from FedEx, DHL, and local couriers into a single JSON response, 
                    ensuring consistent pricing models across providers.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Results */}
            <div 
              className={`xl:col-span-7 flex flex-col gap-6 transition-opacity duration-300 ${
                currentStep === 2 ? 'opacity-100' : 'opacity-50 pointer-events-none'
              }`} 
              id="step-2"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`step-indicator ${currentStep === 2 ? 'active' : 'inactive'}`}>2</div>
                <h3 className={`text-xl font-bold ${currentStep === 2 ? 'text-text-dark' : 'text-text-muted'}`}>
                  Recommended Options
                </h3>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-text-muted">Loading quotes...</p>
                </div>
              )}

              {!loading && currentStep === 2 && (
                <>
                  <QuoteResultsList quotes={quotes} messages={messages} />
                  <button
                    onClick={handleNewQuote}
                    className="bg-border-light hover:bg-primary hover:text-white text-text-dark px-5 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined">refresh</span>
                    New Quote
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Código corregido:**
```typescript
return (
    <div className="flex h-screen w-full bg-background-light">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background-light relative">
        <PageHeader
          title="New Shipment Estimate"
          description="Enter details to compare rates across all connected providers via Unified API."
        />

        <div className="flex-1 w-full px-6 md:px-12 pb-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-5 flex flex-col gap-6">
              <QuoteRequestForm onSubmit={handleSubmit} loading={loading} />
              {error && <ErrorAlert message={error} />}
            </div>
            <div
              className={`xl:col-span-7 flex flex-col gap-6 transition-opacity duration-300 ${
                currentStep === 2 ? 'opacity-100' : 'opacity-50 pointer-events-none'
              }`}
            >

              {loading && <LoadingSpinner message="Loading quotes..." />}
              {!loading && currentStep === 2 && (
                <>
                  <QuoteResultsList quotes={quotes} messages={messages} />
                  <button
                    onClick={handleNewQuote}
                    className="bg-border-light hover:bg-primary hover:text-white text-text-dark px-5 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined">refresh</span>
                    New Quote
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```