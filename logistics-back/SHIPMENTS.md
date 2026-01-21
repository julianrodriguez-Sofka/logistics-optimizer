# 📦 Sistema de Gestión de Envíos (Shipments)

Sistema completo de gestión de envíos con pagos, clientes, estado de envíos, notificaciones en tiempo real y mensajería asíncrona.

## 🏗️ Arquitectura

### Stack Tecnológico

- **Backend:** Node.js + TypeScript + Express
- **Base de Datos:** MongoDB (Mongoose)
- **Mensajería:** RabbitMQ (AMQP)
- **Tiempo Real:** Socket.io (WebSocket)
- **Patrones:** DDD, SOLID, Repository, Strategy, Observer, Singleton

### Diagrama de Flujo

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │◄───────►│   Backend   │◄───────►│   MongoDB   │
│   (React)   │         │  (Express)  │         │             │
└─────────────┘         └──────┬──────┘         └─────────────┘
                               │
                    ┌──────────┼──────────┐
                    │                     │
              ┌─────▼─────┐         ┌────▼──────┐
              │  RabbitMQ │         │ Socket.io │
              │  (Queues) │         │  (Rooms)  │
              └───────────┘         └───────────┘
```

## 📁 Estructura de Capas (DDD)

```
logistics-back/src/
├── domain/                         # 🎯 CAPA DE DOMINIO (Negocio Puro)
│   ├── entities/
│   │   ├── Customer.ts             # Entidad Cliente
│   │   ├── Payment.ts              # Value Object Pago (inmutable)
│   │   ├── Shipment.ts             # Aggregate Root Envío
│   │   └── ShipmentStatus.ts       # Value Object Estado (State Machine)
│   └── interfaces/
│       └── IRepositories.ts        # Contratos Repository
│
├── application/                    # ⚙️ CAPA DE APLICACIÓN (Casos de Uso)
│   └── services/
│       ├── PaymentService.ts       # Procesamiento de pagos
│       └── ShipmentService.ts      # Lógica de negocio envíos
│
└── infrastructure/                 # 🔧 CAPA DE INFRAESTRUCTURA (Detalles)
    ├── database/
    │   ├── schemas/
    │   │   ├── CustomerSchema.ts   # Mongoose Schema Cliente
    │   │   └── ShipmentSchema.ts   # Mongoose Schema Envío
    │   └── repositories/
    │       ├── CustomerRepository.ts
    │       └── ShipmentRepository.ts
    ├── messaging/
    │   ├── RabbitMQConnection.ts   # Singleton RabbitMQ
    │   └── MessageQueueService.ts  # Publisher-Subscriber
    ├── websocket/
    │   └── WebSocketService.ts     # Socket.io Singleton
    ├── controllers/
    │   ├── CustomerController.ts   # HTTP Handlers Clientes
    │   └── ShipmentController.ts   # HTTP Handlers Envíos
    ├── routes/
    │   ├── customers.routes.ts     # Rutas API Clientes
    │   └── shipments.routes.ts     # Rutas API Envíos
    └── middlewares/
        └── validateShipment.ts     # Validación Requests
```

## 🎯 Entidades del Dominio

### 1. Customer (Cliente)

**Propósito:** Representa un cliente con validación de negocio

```typescript
interface CustomerData {
  name: string;               // Mín 3 caracteres
  email: string;              // Formato válido
  phone: string;              // Formato colombiano: +57 3XX XXXXXXX
  address: string;            // Dirección completa
  documentType: 'CC' | 'CE' | 'NIT' | 'PASSPORT';
  documentNumber: string;     // Mín 5 caracteres
}
```

**Métodos:**
- `validateCustomer()` - Validación completa
- `isValidEmail(email)` - Valida formato email
- `isValidPhone(phone)` - Valida teléfono colombiano
- `update(data)` - Actualización parcial
- `toJSON()` - Serialización

### 2. Payment (Pago) - Value Object

**Propósito:** Representa un pago **inmutable** con validación Luhn

```typescript
interface PaymentData {
  method: 'CARD' | 'CASH';
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  cardInfo?: {
    lastFourDigits: string;  // Solo últimos 4 dígitos (seguridad)
    cardHolderName: string;
    expirationDate: string;  // MM/YY
    cvv: string;             // 3-4 dígitos
  };
}
```

**Características:**
- ✅ **Algoritmo Luhn** para validar tarjetas
- ✅ **Inmutable** (no se puede modificar después de crear)
- ✅ Validación de fecha de expiración
- ✅ Solo almacena últimos 4 dígitos de tarjeta
- ✅ Detecta marca de tarjeta (Visa, Mastercard, Amex, Discover)

**Métodos:**
- `validateCardNumberLuhn(cardNumber)` - Validación Luhn
- `complete()` - Marca como completado
- `fail()` - Marca como fallido
- `getMaskedCardNumber()` - Retorna `****1234`

### 3. ShipmentStatus (Estado) - State Machine

**Propósito:** Gestiona transiciones de estado con validación

```typescript
type ShipmentStatusType =
  | 'PENDING_PAYMENT'      // Esperando pago
  | 'PAYMENT_CONFIRMED'    // Pago confirmado
  | 'PROCESSING'           // En procesamiento
  | 'READY_FOR_PICKUP'     // Listo para recoger
  | 'IN_TRANSIT'           // En tránsito
  | 'OUT_FOR_DELIVERY'     // En reparto
  | 'DELIVERED'            // Entregado
  | 'FAILED_DELIVERY'      // Intento fallido
  | 'CANCELLED'            // Cancelado
  | 'RETURNED';            // Devuelto
```

**Transiciones Válidas:**
```
PENDING_PAYMENT → [PAYMENT_CONFIRMED, CANCELLED]
PAYMENT_CONFIRMED → [PROCESSING, CANCELLED]
PROCESSING → [READY_FOR_PICKUP, CANCELLED]
READY_FOR_PICKUP → [IN_TRANSIT, CANCELLED]
IN_TRANSIT → [OUT_FOR_DELIVERY, FAILED_DELIVERY]
OUT_FOR_DELIVERY → [DELIVERED, FAILED_DELIVERY]
FAILED_DELIVERY → [OUT_FOR_DELIVERY, RETURNED]
DELIVERED → [RETURNED] (solo si es devolución)
```

**Métodos:**
- `canTransition(current, next)` - Valida si la transición es permitida
- `getDisplayName()` - Nombre en español
- `getStatusColor()` - Color para UI
- `isTerminal()` - Si es estado final
- `isActive()` - Si requiere acción

### 4. Shipment (Envío) - Aggregate Root

**Propósito:** Entidad principal que combina todo

```typescript
interface ShipmentData {
  customer: Customer;
  origin: Address;
  destination: Address;
  package: Package;
  selectedQuote: Quote;
  payment: Payment;
  currentStatus: ShipmentStatus;
  trackingNumber?: string;  // LOG-YYYYMMDD-XXXX
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  pickupDate: Date;
  statusHistory: StatusHistoryEntry[];
}
```

**Métodos:**
- `updateStatus(newStatus)` - Actualiza estado con validación
- `calculateEstimatedDelivery()` - Calcula fecha estimada
- `isDelayed()` - Detecta retrasos
- `canBeCancelled()` - Si se puede cancelar
- `getSummary()` - Resumen del envío

## ⚙️ Servicios de Aplicación

### PaymentService

**Responsabilidad:** Procesamiento de pagos con validaciones

```typescript
class PaymentService {
  processPayment(data: PaymentData): Promise<Payment>
  processCardPayment(data: CardPaymentData): Promise<Payment>
  processCashPayment(amount: number): Promise<Payment>
  confirmCashPayment(transactionId: string): Promise<Payment>
  refundPayment(transactionId: string): Promise<Payment>
  getCardBrand(cardNumber: string): string
}
```

**Características:**
- ✅ Validación Luhn completa
- ✅ Validación CVV (3-4 dígitos)
- ✅ Validación fecha expiración
- ✅ Generación de Transaction ID: `TXN-YYYYMMDD-timestamp-random`
- ✅ Detección de marca: Visa, Mastercard, Amex, Discover
- ✅ Solo almacena últimos 4 dígitos

### ShipmentService

**Responsabilidad:** Lógica de negocio principal de envíos

```typescript
class ShipmentService {
  createShipment(data: CreateShipmentDTO): Promise<Shipment>
  getShipmentById(id: string): Promise<Shipment>
  getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment>
  getAllShipments(page: number, limit: number): Promise<Shipment[]>
  getShipmentsByStatus(status: ShipmentStatusType): Promise<Shipment[]>
  getShipmentsByCustomer(customerId: string): Promise<Shipment[]>
  updateShipmentStatus(id: string, newStatus: ShipmentStatusType): Promise<Shipment>
  searchShipments(query: string): Promise<Shipment[]>
  getStatistics(): Promise<ShipmentStatistics>
  cancelShipment(id: string, reason: string): Promise<Shipment>
}
```

**Flujo de Creación (createShipment):**
1. Busca o crea cliente por email
2. Procesa pago con PaymentService
3. Determina estado inicial (PAYMENT_CONFIRMED o PENDING_PAYMENT)
4. Crea envío con tracking number
5. Calcula fecha estimada de entrega
6. **Publica evento en RabbitMQ** (shipment.created, payment.processing)
7. **Emite evento WebSocket** (SHIPMENT_CREATED al room 'warehouse')
8. Retorna envío creado

## 🔌 Infraestructura

### RabbitMQ - Mensajería Asíncrona

**Propósito:** Desacoplar operaciones y procesos en segundo plano

**Queues (Colas):**
```typescript
enum QueueNames {
  SHIPMENT_CREATED = 'shipment.created',
  SHIPMENT_UPDATED = 'shipment.updated',
  PAYMENT_PROCESSING = 'payment.processing',
  PAYMENT_COMPLETED = 'payment.completed',
  STATUS_CHANGED = 'shipment.status.changed',
  NOTIFICATION = 'notification.send'
}
```

**Eventos Publicados:**
- `shipment.created` - Al crear nuevo envío
- `shipment.updated` - Al actualizar información
- `payment.processing` - Al procesar pago
- `payment.completed` - Al completar pago
- `shipment.status.changed` - Al cambiar estado
- `notification.send` - Para enviar notificaciones (email, SMS)

**Formato de Mensaje:**
```typescript
{
  id: string;              // ID único del evento
  timestamp: Date;         // Fecha del evento
  shipmentId: string;      // ID del envío
  trackingNumber: string;  // Número de seguimiento
  // ... datos específicos del evento
}
```

### WebSocket - Comunicación en Tiempo Real

**Propósito:** Notificaciones instantáneas a clientes conectados

**Rooms (Salas):**
- `warehouse` - Todos los clientes del almacén
- `shipment:{trackingNumber}` - Clientes rastreando un envío específico

**Eventos Cliente → Servidor:**
```typescript
'JOIN_WAREHOUSE'     // Cliente se une a almacén
'LEAVE_WAREHOUSE'    // Cliente sale de almacén
'TRACK_SHIPMENT'     // Cliente rastrea envío
'UNTRACK_SHIPMENT'   // Cliente deja de rastrear
```

**Eventos Servidor → Cliente:**
```typescript
'SHIPMENT_CREATED'   // Nuevo envío creado
'SHIPMENT_UPDATED'   // Envío actualizado
'STATUS_CHANGED'     // Estado cambió
'PAYMENT_PROCESSED'  // Pago procesado
'NOTIFICATION'       // Notificación general
'ERROR'              // Error ocurrido
```

**Ejemplo de Uso:**
```typescript
// Cliente se conecta
socket.emit('JOIN_WAREHOUSE');

// Cliente escucha nuevos envíos
socket.on('SHIPMENT_CREATED', (shipment) => {
  console.log('Nuevo envío:', shipment);
});

// Cliente rastrea envío específico
socket.emit('TRACK_SHIPMENT', { trackingNumber: 'LOG-20260119-0001' });

// Cliente escucha cambios de estado
socket.on('STATUS_CHANGED', (data) => {
  console.log('Estado cambió:', data.newStatus);
});
```

### MongoDB Repositories

**CustomerRepository:**
- `create(customer)` - Crea cliente (maneja duplicados)
- `findById(id)` - Busca por ID
- `findByEmail(email)` - Busca por email (único)
- `findByDocument(type, number)` - Busca por documento
- `update(id, data)` - Actualiza cliente
- `delete(id)` - Elimina cliente
- `findAll(page, limit)` - Lista paginada
- `search(query)` - Búsqueda full-text

**ShipmentRepository:**
- `create(shipment)` - Crea envío
- `findById(id)` - Busca por ID (con populate de customer)
- `findByTrackingNumber(trackingNumber)` - Busca por tracking
- `findByCustomer(customerId)` - Envíos de un cliente
- `findByStatus(status)` - Envíos por estado
- `findAll(page, limit)` - Lista paginada
- `update(id, data)` - Actualiza envío
- `updateStatus(id, status, reason)` - Actualiza estado con historial
- `delete(id)` - Elimina envío
- `search(query)` - Búsqueda full-text
- `findDelayed()` - Envíos retrasados
- `getStatistics()` - Estadísticas del dashboard

**Índices MongoDB:**
```javascript
// CustomerSchema
{ email: 1 }                    // Único
{ documentNumber: 1 }           // Único
{ name: 1, email: 1 }           // Compuesto
{ name: 'text', email: 'text' } // Full-text search

// ShipmentSchema
{ trackingNumber: 1 }           // Único
{ customer: 1 }                 // Referencia
{ currentStatus: 1 }            // Filtrado
{ 'payment.status': 1 }         // Pagos
{ pickupDate: 1 }               // Fecha recogida
{ estimatedDeliveryDate: 1 }    // Fecha estimada
{ currentStatus: 1, pickupDate: 1 } // Compuesto
{ trackingNumber: 'text', ... } // Full-text search
```

## 🌐 API REST

### Shipments API

**Base URL:** `http://localhost:3000/api/shipments`

#### Endpoints

**1. Crear Envío**
```http
POST /api/shipments
Content-Type: application/json

{
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+57 300 1234567",
    "address": "Calle 123 #45-67, Bogotá",
    "documentType": "CC",
    "documentNumber": "1234567890"
  },
  "origin": {
    "city": "Bogotá",
    "address": "Calle 123 #45-67",
    "postalCode": "110111"
  },
  "destination": {
    "city": "Medellín",
    "address": "Carrera 43A #1-50",
    "postalCode": "050021"
  },
  "package": {
    "weight": 5,
    "length": 30,
    "width": 20,
    "height": 15,
    "isFragile": true,
    "description": "Laptop"
  },
  "pickupDate": "2026-01-20T10:00:00.000Z",
  "selectedQuote": {
    "providerName": "DHL",
    "price": 45000,
    "estimatedDays": 2,
    "service": "EXPRESS"
  },
  "payment": {
    "method": "CARD",
    "amount": 45000,
    "cardNumber": "4532015112830366",
    "cardHolderName": "JUAN PEREZ",
    "expirationDate": "12/26",
    "cvv": "123"
  }
}

Response 201 Created:
{
  "success": true,
  "message": "Shipment created successfully",
  "data": {
    "id": "67881234abcdef123456",
    "trackingNumber": "LOG-20260119-0001",
    "customer": { ... },
    "currentStatus": "PAYMENT_CONFIRMED",
    "estimatedDeliveryDate": "2026-01-22T10:00:00.000Z",
    "payment": {
      "status": "COMPLETED",
      "transactionId": "TXN-20260119-1737307200000-abc123"
    }
  }
}
```

**2. Listar Envíos (Paginado)**
```http
GET /api/shipments?page=1&limit=20

Response 200:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

**3. Obtener Envío por ID**
```http
GET /api/shipments/:id

Response 200:
{
  "success": true,
  "data": { ... }
}
```

**4. Rastrear Envío (Tracking Público)**
```http
GET /api/shipments/track/LOG-20260119-0001

Response 200:
{
  "success": true,
  "data": {
    "trackingNumber": "LOG-20260119-0001",
    "currentStatus": "IN_TRANSIT",
    "estimatedDeliveryDate": "2026-01-22T10:00:00.000Z",
    "statusHistory": [
      {
        "status": "PENDING_PAYMENT",
        "timestamp": "2026-01-19T08:00:00Z",
        "reason": "Initial creation"
      },
      {
        "status": "PAYMENT_CONFIRMED",
        "timestamp": "2026-01-19T08:05:00Z",
        "reason": "Payment completed"
      },
      {
        "status": "IN_TRANSIT",
        "timestamp": "2026-01-19T10:00:00Z",
        "reason": "Picked up by courier"
      }
    ]
  }
}
```

**5. Filtrar por Estado**
```http
GET /api/shipments/status/IN_TRANSIT

Response 200:
{
  "success": true,
  "data": [ ... ]
}
```

**6. Envíos de un Cliente**
```http
GET /api/shipments/customer/:customerId

Response 200:
{
  "success": true,
  "data": [ ... ]
}
```

**7. Actualizar Estado**
```http
PUT /api/shipments/:id/status
Content-Type: application/json

{
  "status": "OUT_FOR_DELIVERY",
  "reason": "En reparto a destino"
}

Response 200:
{
  "success": true,
  "message": "Status updated successfully",
  "data": { ... }
}
```

**8. Buscar Envíos**
```http
GET /api/shipments/search?q=juan

Response 200:
{
  "success": true,
  "data": [ ... ]
}
```

**9. Estadísticas del Dashboard**
```http
GET /api/shipments/statistics

Response 200:
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "PENDING_PAYMENT": 10,
      "IN_TRANSIT": 45,
      "DELIVERED": 80,
      ...
    },
    "delayed": 5,
    "delivered": 80
  }
}
```

**10. Cancelar Envío**
```http
POST /api/shipments/:id/cancel
Content-Type: application/json

{
  "reason": "Cliente solicitó cancelación"
}

Response 200:
{
  "success": true,
  "message": "Shipment cancelled successfully",
  "data": { ... }
}
```

### Customers API

**Base URL:** `http://localhost:3000/api/customers`

**1. Crear Cliente**
```http
POST /api/customers
Content-Type: application/json

{
  "name": "María García",
  "email": "maria@example.com",
  "phone": "+57 301 9876543",
  "address": "Carrera 7 #32-16, Cali",
  "documentType": "CC",
  "documentNumber": "9876543210"
}
```

**2. Listar Clientes**
```http
GET /api/customers?page=1&limit=20
```

**3. Buscar Cliente por Email**
```http
GET /api/customers/email/maria@example.com
```

**4. Buscar Clientes**
```http
GET /api/customers/search?q=maria
```

**5. Actualizar Cliente**
```http
PUT /api/customers/:id
```

**6. Eliminar Cliente**
```http
DELETE /api/customers/:id
```

## 🧪 Testing con Postman

1. **Importar Colección:** `postman/postman_collection_fixed.json`
2. **Configurar Ambiente:** `postman/postman_environment.json`
3. **Variables de Entorno:**
   - `base_url`: http://localhost:3000
   - `tracking_number`: (se guardará automáticamente)

**Tests Disponibles:**
- Crear Cliente
- Crear Envío con Pago Tarjeta
- Crear Envío con Pago Efectivo
- Rastrear Envío
- Actualizar Estado
- Obtener Estadísticas
- Buscar Envíos

## 🐳 Docker Setup

**1. Iniciar Servicios:**
```bash
docker-compose up -d
```

**Servicios Levantados:**
- MongoDB: `localhost:27017`
- RabbitMQ: `localhost:5672` (AMQP)
- RabbitMQ Management: `localhost:15672` (UI - user: guest, pass: guest)
- Backend: `localhost:3000`
- Frontend: `localhost:5173`

**2. Ver Logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f rabbitmq
```

**3. Detener Servicios:**
```bash
docker-compose down
```

**4. Limpiar Todo (incluyendo volúmenes):**
```bash
docker-compose down -v
```

## 🔍 Monitoreo

### RabbitMQ Management UI

**URL:** http://localhost:15672  
**Credenciales:** guest / guest

**Visualizar:**
- ✅ Conexiones activas
- ✅ Canales abiertos
- ✅ Colas (queues) y mensajes pendientes
- ✅ Exchanges
- ✅ Rate de mensajes (publicados/consumidos)

### MongoDB Compass

**Connection String:**
```
mongodb://admin:adminpassword@localhost:27017/?authSource=admin
```

**Base de Datos:** `logistics-optimizer`

**Colecciones:**
- `customers` - Clientes
- `shipments` - Envíos
- `quotes` - Cotizaciones (cache)

## 🎨 Frontend (Próximo Paso)

### Componentes a Crear

**1. Formulario de Envío:**
- `ShipmentWizard.tsx` - Wizard multi-paso
- `CustomerInfoForm.tsx` - Datos del cliente
- `PaymentForm.tsx` - Formulario de pago (Tarjeta/Efectivo)
- `QuoteSelectionCard.tsx` - Selección de cotización

**2. Vista de Almacén:**
- `WarehouseView.tsx` - Vista principal del almacén
- `ShipmentCard.tsx` - Tarjeta individual de envío
- `ShipmentFilters.tsx` - Filtros por estado
- `ShipmentSearch.tsx` - Búsqueda de envíos
- `ShipmentStatusBadge.tsx` - Badge de estado con color

**3. Tracking Público:**
- `TrackingPage.tsx` - Página de seguimiento
- `TrackingTimeline.tsx` - Línea de tiempo de estados
- `TrackingMap.tsx` - Mapa con ruta (opcional)

**4. Dashboard:**
- `DashboardView.tsx` - Vista de estadísticas
- `StatisticsCards.tsx` - Tarjetas con métricas
- `ShipmentChart.tsx` - Gráficos de envíos

### Hooks Personalizados

```typescript
// hooks/useWebSocket.ts
const { connected, emit, on } = useWebSocket('http://localhost:3000');

// hooks/useShipments.ts
const { shipments, loading, createShipment, updateStatus } = useShipments();

// hooks/useShipmentTracking.ts
const { tracking, loading } = useShipmentTracking(trackingNumber);
```

### Servicios Frontend

```typescript
// services/shipmentService.ts
export const shipmentService = {
  createShipment: (data) => axios.post('/api/shipments', data),
  getShipments: (page, limit) => axios.get('/api/shipments', { params: { page, limit } }),
  trackShipment: (trackingNumber) => axios.get(`/api/shipments/track/${trackingNumber}`),
  updateStatus: (id, status, reason) => axios.put(`/api/shipments/${id}/status`, { status, reason }),
  getStatistics: () => axios.get('/api/shipments/statistics'),
  searchShipments: (query) => axios.get('/api/shipments/search', { params: { q: query } }),
};
```

## 📋 Checklist de Implementación

### ✅ Backend Completado

- [x] Domain Entities (Customer, Payment, Shipment, ShipmentStatus)
- [x] Repository Interfaces
- [x] MongoDB Schemas con índices
- [x] Repository Implementations
- [x] RabbitMQ Connection Manager
- [x] Message Queue Service
- [x] WebSocket Service
- [x] Payment Service (con Luhn)
- [x] Shipment Service
- [x] Controllers (Shipment, Customer)
- [x] Routes (Shipments, Customers)
- [x] Validation Middleware
- [x] Integration en app.ts e index.ts
- [x] Docker Compose con RabbitMQ

### 🔄 Pendiente

- [ ] Frontend Service Layer
- [ ] Frontend WebSocket Integration
- [ ] Customer Info Form
- [ ] Payment Form
- [ ] Shipment Wizard
- [ ] Warehouse View
- [ ] Tracking Page
- [ ] Dashboard
- [ ] Tests de Integración

## 🚀 Próximos Pasos

1. **Probar Backend:**
   ```bash
   docker-compose up -d
   # Esperar a que levanten los servicios
   # Probar endpoints con Postman
   ```

2. **Desarrollar Frontend:**
   - Crear service layer
   - Implementar hooks de WebSocket
   - Crear formularios
   - Implementar Warehouse View

3. **Testing:**
   - Tests unitarios de entidades
   - Tests de integración de API
   - Tests end-to-end

4. **Optimizaciones:**
   - Agregar Redis para caché
   - Implementar rate limiting
   - Agregar autenticación JWT
   - Implementar notificaciones email/SMS

---

**¿Listo para continuar con el Frontend?** 🚀
