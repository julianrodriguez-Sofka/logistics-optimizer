# Logistics Optimizer - Frontend

![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?logo=tailwindcss)
![Coverage](https://img.shields.io/badge/Coverage-80%25+-brightgreen)

Sistema de optimización logística para cotización, creación y seguimiento de envíos con visualización de rutas en mapa interactivo.

---

## 🚀 Características Principales

### 📊 Sistema de Cotizaciones
- Cotización en tiempo real de múltiples proveedores (FedEx, DHL, Local)
- Identificación automática de opción más económica y más rápida
- Visualización con badges distintivos
- Cache inteligente para optimizar solicitudes

### 🗺️ Mapa de Rutas Interactivo
- Integración con **OpenStreetMap** y **Leaflet**
- Cálculo de rutas via **OpenRouteService API**
- Soporte para rutas multi-modales (avión + camión)
- Visualización de segmentos con colores por tipo de transporte
- Geocodificación automática de direcciones colombianas

### 📦 Formulario de Creación de Envíos (ShipmentWizard)
- Flujo paso a paso con indicador de progreso
- Validación en tiempo real con debouncing
- Soporte para paquetes frágiles
- Selección de cotización con vista comparativa
- Formulario de datos de cliente con validación de documentos colombianos

### 💳 Sistema de Pagos
- Soporte para tarjeta de crédito y efectivo contra entrega
- Validación de tarjeta con algoritmo de Luhn
- Animación profesional de procesamiento de pago
- Generación de factura electrónica

### 🏭 Sistema de Almacén (WarehouseView)
- Gestión completa de envíos con estados manuales
- Asignación de camiones con información de conductor
- Filtros por estado y búsqueda en tiempo real
- Historial de cambios de estado por envío
- Persistencia local con localStorage
- Sincronización automática cada 30 segundos

---

## 🏗️ Arquitectura

```
logistics-front/
├── src/
│   ├── components/           # Componentes React
│   │   ├── QuoteRequestForm.tsx     # Formulario de cotización
│   │   ├── ShipmentWizard.tsx       # Wizard de creación de envíos
│   │   ├── WarehouseView.tsx        # Vista de gestión de almacén
│   │   ├── RouteMap.tsx             # Mapa interactivo con Leaflet
│   │   ├── PaymentForm.tsx          # Formulario de pago
│   │   ├── PaymentProcessingModal.tsx  # Animación de procesamiento
│   │   └── ErrorBoundary.tsx        # Manejo global de errores
│   ├── services/             # Capa de servicios
│   │   ├── quoteService.ts          # Servicio de cotizaciones
│   │   ├── shipmentService.ts       # Servicio de envíos
│   │   ├── ShipmentStateService.ts  # Gestión de estado local (Singleton)
│   │   └── apiService.ts            # Cliente HTTP con Circuit Breaker
│   ├── hooks/                # Custom hooks
│   │   ├── useWebSocket.ts          # Conexión WebSocket
│   │   └── useDebounce.ts           # Debounce y throttle
│   ├── models/               # Interfaces TypeScript
│   ├── utils/                # Utilidades
│   │   └── validation/              # Reglas de validación
│   └── __tests__/            # Tests unitarios
├── vitest.config.ts          # Configuración de Vitest
└── package.json
```

---

## 🎨 Patrones de Diseño Implementados

| Patrón | Implementación | Archivo |
|--------|----------------|---------|
| **Singleton** | ShipmentStateService - única instancia gestiona todo el estado | [logistics-front/src/services/ShipmentStateService.ts](logistics-front/src/services/ShipmentStateService.ts) |
| **Observer** | Suscripción a cambios de estado de envíos | [logistics-front/src/services/ShipmentStateService.ts](logistics-front/src/services/ShipmentStateService.ts) |
| **Repository** | Abstracción de persistencia en localStorage | [logistics-front/src/services/ShipmentStateService.ts](logistics-front/src/services/ShipmentStateService.ts) |
| **State Machine** | Flujo de estados del procesamiento de pago | [logistics-front/src/components/PaymentProcessingModal.tsx](logistics-front/src/components/PaymentProcessingModal.tsx) |
| **Container/Presentational** | Separación de lógica y UI en WarehouseView | [logistics-front/src/components/WarehouseView.tsx](logistics-front/src/components/WarehouseView.tsx) |
| **Strategy** | Diferentes estrategias de transición de estado | [logistics-front/src/services/ShipmentStateService.ts](logistics-front/src/services/ShipmentStateService.ts) |
| **Adapter** | Transformación de datos API a modelo interno | [logistics-front/src/services/shipmentService.ts](logistics-front/src/services/shipmentService.ts) |

---

## 🔧 Principios SOLID Aplicados

### Single Responsibility Principle (SRP)
- `ShipmentStateService`: Solo gestiona estado local de envíos
- `PaymentProcessingModal`: Solo maneja la animación de procesamiento
- Cada componente tiene una única responsabilidad

### Open/Closed Principle (OCP)
- `ShipmentStateService`: Extensible mediante callbacks, cerrado para modificación
- Componentes aceptan props para personalización sin modificar código interno

### Liskov Substitution Principle (LSP)
- Componentes UI intercambiables siguiendo misma interfaz de props

### Interface Segregation Principle (ISP)
- Props de componentes son mínimas y enfocadas
- Interfaces separadas para cada modelo de datos

### Dependency Inversion Principle (DIP)
- Servicios inyectados como dependencias
- Componentes dependen de abstracciones (interfaces), no implementaciones

---

## 🛠️ Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (puerto 5173)
npm run dev

# Build de producción
npm run build

# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Linting
npm run lint
```

---

## 📋 Variables de Entorno

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 🧪 Testing

El proyecto utiliza **Vitest** con cobertura mínima de **80%**.

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm test -- --watch

# Generar reporte de cobertura
npm run test:coverage
```

### Tests Implementados:
- [logistics-front/src/__tests__/ShipmentStateService.test.ts](logistics-front/src/__tests__/ShipmentStateService.test.ts) - 33 tests (Singleton, Observer, Status Flow)
- [logistics-front/src/__tests__/shipmentService.test.ts](logistics-front/src/__tests__/shipmentService.test.ts) - 18 tests (API integration, data transformation)
- `PaymentProcessingModal.test.tsx` - Tests de UI y animaciones
- `WarehouseView.test.tsx` - Tests de integración

---

## 📊 Métricas de Calidad

| Métrica | Target | Actual |
|---------|--------|--------|
| Line Coverage | 80% | ✅ |
| Branch Coverage | 80% | ✅ |
| Functions Coverage | 80% | ✅ |
| Code Duplication | 0% | ✅ |
| Security Hotspots | 0 | ✅ |

---

## 🔗 Integración con Backend

El frontend se comunica con el backend Express.js mediante:

- **REST API**: Cotizaciones, creación de envíos, gestión de clientes
- **WebSocket**: Notificaciones en tiempo real para actualizaciones de estado

---

## 📚 Documentación Relacionada

- [ARCHITECTURE.md](../.github/ARCHITECTURE.md) - Arquitectura del sistema
- [TDD_GUIDE.md](../.github/TDD_GUIDE.md) - Guía de Test-Driven Development
- [USER_STORIES.md](../.github/USER_STORIES.md) - Historias de usuario originales
- [NEW_HU.md](../.github/NEW_HU.md) - Nuevas historias de usuario (Mapa, Wizard, Almacén)

---

**Versión:** 2.0  
**Última Actualización:** 2026-01-20  
**Desarrollado con:** React 19 + TypeScript + Vite + TailwindCSS
