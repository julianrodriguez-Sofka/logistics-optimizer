# Funcionalidad de Creación de Envíos con Selección de Cotizaciones

## 📋 Resumen de la Implementación

Se ha implementado un flujo completo para que los usuarios puedan:
1. Ver cotizaciones de diferentes proveedores
2. Seleccionar una cotización
3. Completar un formulario con información del remitente y destinatario
4. Elegir método de pago (Tarjeta de crédito/débito o Efectivo)
5. Crear el envío mediante API REST

## 🎯 Características Implementadas

### Frontend

#### 1. **Componente QuoteResultsList Actualizado**
- ✅ Botón "Seleccionar" en cada cotización
- ✅ Callback `onSelectQuote` para manejar la selección
- ✅ Integración con el flujo de creación de envíos

#### 2. **Componente ShipmentDetailsForm (Nuevo)**
**Ubicación:** `logistics-front/src/components/ShipmentDetailsForm.tsx`

**Características:**
- 📝 Formulario dividido en secciones claras:
  - **Información del Remitente:**
    - Nombre completo
    - Email
    - Teléfono
    - Tipo de documento (CC, CE, NIT, Pasaporte)
    - Número de documento
    - Dirección completa de recogida
  
  - **Información del Destinatario:**
    - Nombre completo
    - Teléfono
    - Dirección completa de entrega
  
  - **Descripción del Paquete** (opcional)

- ✅ Validaciones en tiempo real
- ✅ Indicadores visuales de errores
- ✅ Formato automático de teléfonos colombianos
- ✅ Validación de emails
- ✅ Diseño responsivo con Tailwind CSS

#### 3. **Componente PaymentForm (Mejorado)**
**Ubicación:** `logistics-front/src/components/PaymentForm.tsx`

**Características:**
- 💳 Soporte para Tarjeta de Crédito/Débito:
  - Validación con algoritmo de Luhn
  - Formato automático del número de tarjeta
  - Detección de marca (Visa, Mastercard, AmEx, Discover)
  - Validación de fecha de expiración
  - Validación de CVV (3-4 dígitos)
  
- 💵 Soporte para Pago en Efectivo:
  - Información clara sobre el proceso
  - Confirmación al momento de la recogida

#### 4. **ShipmentWizard Actualizado**
**Ubicación:** `logistics-front/src/components/ShipmentWizard.tsx`

**Flujo de trabajo:**
1. **Paso 1:** Información del envío (origen, destino, peso, etc.)
2. **Paso 2:** Selección de cotización (si no viene pre-seleccionada)
3. **Paso 3:** Detalles del envío (remitente y destinatario)
4. **Paso 4:** Método de pago
5. **Paso 5:** Confirmación con número de seguimiento

**Mejoras:**
- ✅ Acepta cotización pre-seleccionada desde App
- ✅ Salta pasos innecesarios si viene desde selección de cotización
- ✅ Indicador de progreso visual
- ✅ Manejo de errores robusto
- ✅ Página de confirmación mejorada con:
  - Número de seguimiento destacado
  - Información de remitente y destinatario
  - Detalles del proveedor y pago
  - Opciones para crear otro envío o imprimir

#### 5. **App.tsx Actualizado**
**Características:**
- ✅ Estado global para cotización seleccionada
- ✅ Función `handleSelectQuote` para manejar la selección
- ✅ Navegación fluida entre vistas
- ✅ Pasa datos de cotización y request al ShipmentWizard

#### 6. **Servicio de Envíos**
**Ubicación:** `logistics-front/src/services/shipmentService.ts`

**Funcionalidades:**
- ✅ `createShipment()` - Crear nuevo envío
- ✅ `getShipments()` - Obtener envíos con paginación
- ✅ `getShipmentById()` - Obtener envío por ID
- ✅ `getShipmentByTrackingNumber()` - Rastrear envío
- ✅ `updateShipmentStatus()` - Actualizar estado
- ✅ `getStatistics()` - Obtener estadísticas
- ✅ Transformación de datos entre frontend y backend
- ✅ Manejo de errores consistente

### Backend

#### 1. **Entidades de Dominio**
**Ubicación:** `logistics-back/src/domain/entities/`

- ✅ `Shipment.ts` - Entidad principal con validaciones
- ✅ `Customer.ts` - Información del cliente
- ✅ `Payment.ts` - Datos de pago
- ✅ `ShipmentStatus.ts` - Estados del envío

#### 2. **Servicio de Envíos**
**Ubicación:** `logistics-back/src/application/services/ShipmentService.ts`

**Características:**
- ✅ Creación de envíos con procesamiento de pago
- ✅ Gestión de clientes (crear o recuperar)
- ✅ Cálculo de fecha estimada de entrega
- ✅ Integración con cola de mensajes
- ✅ Notificaciones en tiempo real vía WebSocket
- ✅ Historial de estados

#### 3. **Controlador REST**
**Ubicación:** `logistics-back/src/infrastructure/controllers/ShipmentController.ts`

**Endpoints:**
- `POST /api/shipments` - Crear envío
- `GET /api/shipments` - Listar envíos (paginado)
- `GET /api/shipments/:id` - Obtener por ID
- `GET /api/shipments/track/:trackingNumber` - Rastrear
- `GET /api/shipments/status/:status` - Filtrar por estado
- `GET /api/shipments/statistics` - Estadísticas
- `PUT /api/shipments/:id/status` - Actualizar estado
- `POST /api/shipments/:id/cancel` - Cancelar envío

#### 4. **Validaciones**
**Ubicación:** `logistics-back/src/infrastructure/middlewares/validateShipment.ts`

**Validaciones implementadas:**
- ✅ Datos del cliente (nombre, email, teléfono, documento)
- ✅ Direcciones (origen y destino)
- ✅ Información del paquete (peso, dimensiones)
- ✅ Fecha de recogida (no puede ser pasada)
- ✅ Cotización seleccionada
- ✅ Información de pago

#### 5. **Servicio de Pago**
**Ubicación:** `logistics-back/src/application/services/PaymentService.ts`

**Características:**
- ✅ Procesamiento de pagos con tarjeta
- ✅ Registro de pagos en efectivo
- ✅ Validación de información de tarjeta
- ✅ Enmascaramiento de números de tarjeta (solo últimos 4 dígitos)
- ✅ Generación de ID de transacción

## 🔒 Seguridad

- ✅ Validación de datos en frontend y backend
- ✅ Encriptación de datos sensibles de tarjetas
- ✅ Solo se almacenan últimos 4 dígitos de tarjetas
- ✅ Validación de formato de email y teléfono
- ✅ Prevención de inyección SQL mediante ODM (Mongoose)
- ✅ Sanitización de entradas

## 🎨 UI/UX

- ✅ Diseño moderno con Tailwind CSS
- ✅ Iconos de Google Material Symbols
- ✅ Indicadores de progreso claros
- ✅ Validaciones en tiempo real
- ✅ Mensajes de error descriptivos
- ✅ Diseño responsivo (móvil y escritorio)
- ✅ Feedback visual en cada acción
- ✅ Estados de carga durante peticiones

## 📊 Flujo de Datos

```
Usuario → Selecciona Cotización → App.tsx (handleSelectQuote)
                                        ↓
                                  ShipmentWizard
                                        ↓
                            ShipmentDetailsForm (Paso 3)
                                        ↓
                              PaymentForm (Paso 4)
                                        ↓
                          shipmentService.createShipment()
                                        ↓
                          POST /api/shipments (Backend)
                                        ↓
                              ShipmentController
                                        ↓
                               ShipmentService
                                        ↓
                   ├─ PaymentService (procesa pago)
                   ├─ CustomerRepository (crea/obtiene cliente)
                   └─ ShipmentRepository (guarda envío)
                                        ↓
                              WebSocket + Queue
                                        ↓
                           Confirmación al Usuario
```

## 🧪 Testing

### Datos de Prueba

**Tarjeta de Crédito (Testing):**
```
Número: 4111 1111 1111 1111 (Visa)
Titular: JUAN PEREZ
Vencimiento: 12/25
CVV: 123
```

**Teléfonos Válidos:**
```
+57 300 1234567
3001234567
+57 310 9876543
```

## 📝 Modelos de Datos

### CreateShipmentDTO (Frontend → Backend)
```typescript
{
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    documentType: 'CC' | 'CE' | 'NIT' | 'PASSPORT';
    documentNumber: string;
  };
  origin: {
    city: string;
    address: string;
    postalCode?: string;
    coordinates?: { lat: number; lon: number };
  };
  destination: {
    city: string;
    address: string;
    postalCode?: string;
    coordinates?: { lat: number; lon: number };
  };
  package: {
    weight: number;
    length: number;
    width: number;
    height: number;
    isFragile: boolean;
    description?: string;
  };
  selectedQuote: Quote;
  pickupDate: Date;
  payment: {
    method: 'CARD' | 'CASH';
    amount: number;
    cardNumber?: string;
    cardHolderName?: string;
    expirationDate?: string;
    cvv?: string;
  };
  notes?: string;
}
```

## 🚀 Cómo Usar

### 1. Desde la Vista de Cotizaciones

1. Ingresa origen, destino y detalles del paquete
2. Haz clic en "Calcular Cotizaciones"
3. Revisa las cotizaciones disponibles
4. Haz clic en **"Seleccionar"** en la cotización deseada
5. Completa el formulario de envío:
   - Información del remitente
   - Información del destinatario
   - Descripción del paquete (opcional)
6. Selecciona método de pago y completa los datos
7. Confirma y recibe tu número de seguimiento

### 2. Desde el Menú "Crear Envío"

1. Navega a la sección "Crear Envío" en el sidebar
2. Sigue el wizard completo paso a paso

## 🔄 Estados del Envío

- `PENDING_PAYMENT` - Pendiente de pago
- `PAYMENT_CONFIRMED` - Pago confirmado
- `PROCESSING` - En procesamiento
- `READY_FOR_PICKUP` - Listo para recogida
- `IN_TRANSIT` - En tránsito
- `OUT_FOR_DELIVERY` - En entrega
- `DELIVERED` - Entregado
- `FAILED_DELIVERY` - Fallo en entrega
- `CANCELLED` - Cancelado
- `RETURNED` - Devuelto

## 📦 Archivos Creados/Modificados

### Nuevos Archivos
- `logistics-front/src/components/ShipmentDetailsForm.tsx`

### Archivos Modificados
- `logistics-front/src/components/QuoteResultsList.tsx`
- `logistics-front/src/components/ShipmentWizard.tsx`
- `logistics-front/src/App.tsx`

### Archivos Existentes Validados
- `logistics-front/src/services/shipmentService.ts` ✅
- `logistics-front/src/components/PaymentForm.tsx` ✅
- `logistics-front/src/models/*` ✅
- `logistics-back/src/domain/entities/*` ✅
- `logistics-back/src/application/services/ShipmentService.ts` ✅
- `logistics-back/src/infrastructure/controllers/ShipmentController.ts` ✅
- `logistics-back/src/infrastructure/routes/shipments.routes.ts` ✅

## 🎓 Buenas Prácticas Implementadas

1. **Arquitectura Limpia (Clean Architecture)**
   - Separación de capas: Domain, Application, Infrastructure
   - Dependencias dirigidas hacia adentro

2. **Principios SOLID**
   - Single Responsibility: Cada componente tiene una responsabilidad única
   - Dependency Injection: Servicios inyectados en controladores
   - Interface Segregation: Interfaces específicas por funcionalidad

3. **DDD (Domain-Driven Design)**
   - Entidades de dominio con validaciones
   - Value Objects para datos complejos
   - Aggregate Roots (Shipment)

4. **Validación en Múltiples Capas**
   - Frontend: Validación en tiempo real
   - Backend: Middleware de validación
   - Dominio: Validaciones de negocio

5. **Manejo de Errores**
   - Try-catch en todas las operaciones asíncronas
   - Mensajes de error descriptivos
   - Logging centralizado

6. **Seguridad**
   - Sanitización de inputs
   - Enmascaramiento de datos sensibles
   - Validación de tipos de documento

7. **TypeScript**
   - Tipos estrictos en todo el código
   - Interfaces bien definidas
   - Type safety garantizado

## 🔧 Configuración Requerida

### Variables de Entorno (Frontend)
```env
VITE_API_URL=http://localhost:3000/api
```

### Variables de Entorno (Backend)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/logistics
NODE_ENV=development
```

## 📚 Próximas Mejoras Sugeridas

- [ ] Integración con pasarelas de pago reales (Stripe, PayU)
- [ ] Notificaciones por email al crear envío
- [ ] SMS de confirmación al destinatario
- [ ] Tracking en tiempo real con WebSockets
- [ ] Historial de envíos del cliente
- [ ] Generación de etiquetas de envío en PDF
- [ ] Integración con APIs de proveedores reales
- [ ] Dashboard de métricas y analytics
- [ ] Sistema de calificación de proveedores
- [ ] Soporte para envíos internacionales

## 👨‍💻 Desarrollado con

- React 18 + TypeScript
- Tailwind CSS
- Axios
- Express.js
- MongoDB + Mongoose
- Node.js
- Clean Architecture
- SOLID Principles
- DDD Patterns

---

**Autor:** Desarrollador Senior
**Fecha:** Enero 2026
**Versión:** 2.4.0
