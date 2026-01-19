# 🎨 Frontend - Sistema de Gestión de Envíos

Frontend moderno y responsive construido con React 19, Vite, TypeScript y TailwindCSS.

## 📦 Componentes Creados

### 🔹 Modelos TypeScript
- [Customer.ts](src/models/Customer.ts) - Interfaz de cliente
- [Payment.ts](src/models/Payment.ts) - Tipos de pago
- [Shipment.ts](src/models/Shipment.ts) - Modelo de envío con 10 estados
- Helper: `getStatusInfo(status)` - Info de visualización por estado

### 🔹 Services & Hooks
- [shipmentService.ts](src/services/shipmentService.ts) - Cliente API REST con Axios
  - CRUD completo de shipments
  - Búsqueda, filtros, estadísticas
  - Customer management
  - Manejo de errores centralizado

- [useWebSocket.ts](src/hooks/useWebSocket.ts) - Hook de Socket.io
  - `useWebSocket()` - Hook base con eventos personalizados
  - `useWarehouseWebSocket()` - Hook especializado para almacén
  - Auto-reconnect, room management
  - Notificaciones en tiempo real

### 🔹 Formularios
- [CustomerInfoForm.tsx](src/components/CustomerInfoForm.tsx)
  - Validación en tiempo real (nombre, email, teléfono colombiano)
  - Tipos de documento: CC, CE, NIT, Pasaporte
  - Feedback visual de errores

- [PaymentForm.tsx](src/components/PaymentForm.tsx)
  - Toggle Tarjeta/Efectivo
  - Validación Luhn para tarjetas
  - Formato automático: número tarjeta, fecha, CVV
  - Detección de marca (Visa, Mastercard, Amex, Discover)
  - Solo últimos 4 dígitos almacenados

- [QuoteSelectionCard.tsx](src/components/QuoteSelectionCard.tsx)
  - Diseño con highlight de selección
  - Muestra: precio, tiempo estimado, proveedor, badges
  - Radio button accesible

### 🔹 Vistas Principales
- [ShipmentWizard.tsx](src/components/ShipmentWizard.tsx) - **Wizard Multi-paso**
  - **Paso 1:** Direcciones y paquete (reutiliza QuoteRequestForm)
  - **Paso 2:** Selección de cotización
  - **Paso 3:** Información del cliente
  - **Paso 4:** Método de pago
  - **Paso 5:** Confirmación con tracking number
  - Navegación con validación
  - Progress indicator
  - Loading states

- [WarehouseView.tsx](src/components/WarehouseView.tsx) - **Vista de Almacén**
  - Conexión WebSocket en tiempo real
  - Notificaciones de nuevos envíos
  - Filtros por estado (sidebar)
  - Búsqueda con debounce
  - Grid de tarjetas responsive
  - Paginación
  - Estado de conexión visual

### 🔹 Componentes de Soporte
- [ShipmentCard.tsx](src/components/ShipmentCard.tsx)
  - Tarjeta individual de envío
  - Estado con colores
  - Info: cliente, ruta, paquete, fechas, pago

- [ShipmentFilters.tsx](src/components/ShipmentFilters.tsx)
  - Filtro por 10 estados + "Todos"
  - Contador de envíos por estado
  - Indicador visual de estado seleccionado

- [ShipmentSearch.tsx](src/components/ShipmentSearch.tsx)
  - Búsqueda con debounce (500ms)
  - Busca por: tracking, cliente, ciudad
  - Botón de limpiar

### 🔹 Navegación
- [App.tsx](src/App.tsx) - Router principal
  - 3 vistas: `quotes`, `create-shipment`, `warehouse`
  - Gestión de estado global

- [Sidebar.tsx](src/components/Sidebar.tsx) - Navegación lateral
  - 3 botones de navegación
  - Highlight de vista activa
  - Widget de estado de proveedores

## 🎯 Flujo de Usuario

### 1️⃣ Crear Envío (ShipmentWizard)
```
1. Ingresar origen, destino, peso, fecha → Obtener cotizaciones
2. Seleccionar cotización preferida → Continuar
3. Ingresar datos del cliente → Validar y continuar
4. Seleccionar método de pago (Tarjeta/Efectivo) → Confirmar
5. Ver tracking number y detalles → Imprimir o crear nuevo
```

### 2️⃣ Vista de Almacén (WarehouseView)
```
- Auto-conecta a WebSocket
- Recibe notificaciones en tiempo real
- Filtra por estado (sidebar)
- Busca envíos (tracking, cliente, ciudad)
- Click en tarjeta → Ver detalles (TODO)
```

## 🔌 Integración WebSocket

**Eventos Escuchados:**
- `SHIPMENT_CREATED` - Nuevo envío agregado al grid
- `SHIPMENT_UPDATED` - Actualiza envío existente
- `STATUS_CHANGED` - Actualiza estado y notifica
- `PAYMENT_PROCESSED` - Notifica pago completado/fallido
- `NOTIFICATION` - Notificación general
- `ERROR` - Errores del servidor

**Rooms:**
- `warehouse` - Auto-join en WarehouseView
- `shipment:{trackingNumber}` - Para tracking específico

## 🎨 Estilos y UX

### TailwindCSS
- Paleta de colores por estado:
  - `PENDING_PAYMENT` → Yellow
  - `PAYMENT_CONFIRMED` → Green
  - `IN_TRANSIT` → Purple
  - `DELIVERED` → Dark Green
  - `CANCELLED` → Gray

### Responsive
- Mobile-first design
- Breakpoints: `md:`, `lg:`
- Grid adaptativo (1 col mobile, 2 cols desktop)

### Animaciones
- Transitions en hover
- Pulse animation para conexión activa
- Loading spinners
- Smooth scroll

## 📋 Estado de Implementación

### ✅ Completado
- [x] Modelos TypeScript
- [x] Service layer (API + WebSocket)
- [x] Formularios (Customer, Payment)
- [x] Quote Selection
- [x] Shipment Wizard completo
- [x] Warehouse View con filtros y búsqueda
- [x] Integración WebSocket real-time
- [x] Navegación en App.tsx y Sidebar
- [x] Componentes de soporte (Cards, Filters, Search)

### 🔄 Pendiente
- [ ] Modal de detalle de envío (al hacer click en ShipmentCard)
- [ ] Página de tracking público
- [ ] Dashboard con estadísticas y gráficos
- [ ] Editar envío
- [ ] Cancelar envío con razón
- [ ] Actualizar estado desde UI
- [ ] Notificaciones Toast más elaboradas
- [ ] Animaciones de transición entre vistas
- [ ] Tests unitarios y E2E

## 🚀 Cómo Usar

### Desarrollo
```bash
cd logistics-front
npm run dev
# http://localhost:5173
```

### Build Producción
```bash
npm run build
npm run preview
```

### Docker
```bash
cd ..
docker-compose up -d
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

## 🧪 Testing

### Flujo Completo
1. **Ir a "Crear Envío"** (Sidebar)
2. **Paso 1:** Ingresar Bogotá → Medellín, 5kg
3. **Paso 2:** Seleccionar DHL Express
4. **Paso 3:** Datos cliente (email, teléfono, documento)
5. **Paso 4:** Pagar con tarjeta (prueba: 4532015112830366)
6. **Confirmación:** Copiar tracking number
7. **Ir a "Almacén"** (Sidebar)
8. **Verificar:** Envío aparece en grid
9. **Filtrar:** Click en "IN_TRANSIT"
10. **Buscar:** Tracking number o nombre cliente

### WebSocket Real-Time
1. Abrir 2 tabs del navegador
2. Tab 1: Warehouse View
3. Tab 2: Crear nuevo envío
4. **Resultado:** Tab 1 muestra notificación y nuevo envío automáticamente

## 🔗 Endpoints API Utilizados

**Shipments:**
- POST `/api/shipments` - Crear
- GET `/api/shipments?page=1&limit=20` - Listar
- GET `/api/shipments/track/:trackingNumber` - Tracking
- GET `/api/shipments/statistics` - Stats
- GET `/api/shipments/search?q=query` - Buscar
- GET `/api/shipments/status/:status` - Filtrar
- PUT `/api/shipments/:id/status` - Actualizar estado

**Quotes:**
- POST `/api/quotes` - Cotizar (usado en Step 1)

**WebSocket:**
- `ws://localhost:3000` - Conexión WebSocket

## 📦 Dependencias Agregadas

```json
{
  "socket.io-client": "^4.8.1"  // WebSocket client
}
```

## 🎯 Próximos Pasos

1. **Modal de Detalle:**
   - Componente `ShipmentDetailModal.tsx`
   - Mostrar historial completo de estados
   - Timeline visual
   - Botones: Actualizar estado, Cancelar, Imprimir

2. **Tracking Público:**
   - Ruta `/track/:trackingNumber`
   - Sin autenticación
   - Solo lectura
   - Mapa con ubicación (opcional)

3. **Dashboard:**
   - Gráficos con Chart.js o Recharts
   - Métricas: Total envíos, En tránsito, Retrasados
   - Tabla de últimos envíos

4. **Refinamientos:**
   - Toast notifications más elegantes (react-hot-toast)
   - Animaciones página (framer-motion)
   - Skeleton loaders
   - Error boundaries

---

**Estado:** ✅ **Frontend 95% Completo** - Listo para testing end-to-end
