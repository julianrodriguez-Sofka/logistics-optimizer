# 📦 Shipping Optimizer - Colección Completa de Postman

![Status: Implemented](https://img.shields.io/badge/status-Complete-success)
![Tests: 50+](https://img.shields.io/badge/tests-50+-blue)
![Coverage: All Endpoints](https://img.shields.io/badge/coverage-All_Endpoints-green)

Colección completa de pruebas automatizadas para **TODOS** los endpoints del sistema de logística. Incluye 50+ tests cubriendo Quotes, Customers, Shipments y flujos E2E completos.

---

## 📚 Contenido de la Colección

### 1. Health & Status (2 endpoints, 9 tests)
- ✅ `GET /api/health` - Verificación general del servidor
- ✅ `GET /api/adapters/status` - Estado de adaptadores de proveedores

### 2. Quotes (4 endpoints, 15 tests)
- ✅ `POST /api/quotes` - Solicitar cotizaciones
  - Caso exitoso (peso normal)
  - Paquete frágil (+15% recargo)
  - Validación de peso mínimo (400)
  - Validación de campos requeridos (400)

### 3. Customers - CRUD Completo (7 endpoints, 18 tests)
- ✅ `POST /api/customers` - Crear cliente
- ✅ `GET /api/customers` - Listar clientes (paginado)
- ✅ `GET /api/customers/:id` - Obtener por ID
- ✅ `GET /api/customers/email/:email` - Buscar por email
- ✅ `GET /api/customers/search?q=` - Búsqueda por nombre
- ✅ `PUT /api/customers/:id` - Actualizar cliente
- ✅ `DELETE /api/customers/:id` - Eliminar cliente

### 4. Shipments - CRUD Completo (9 endpoints, 24 tests)
- ✅ `POST /api/shipments` - Crear envío
- ✅ `GET /api/shipments` - Listar envíos (paginado)
- ✅ `GET /api/shipments/:id` - Obtener por ID
- ✅ `GET /api/shipments/track/:trackingNumber` - Rastrear por tracking
- ✅ `GET /api/shipments/statistics` - Estadísticas del sistema
- ✅ `GET /api/shipments/status/:status` - Filtrar por estado
- ✅ `GET /api/shipments/search?q=` - Búsqueda de envíos
- ✅ `PUT /api/shipments/:id/status` - Actualizar estado
- ✅ `POST /api/shipments/:id/cancel` - Cancelar envío

### 5. End-to-End Flows (1 flujo documentado)
- ✅ Quote → Create Shipment → Track → Update Status → Cancel

**Total: 23 endpoints únicos, 50+ tests automatizados**

---

## 🚀 Instalación y Uso

### Requisitos Previos

1. **Backend corriendo** en `http://localhost:3000`
   ```bash
   cd logistics-back
   npm install
   npm start
   ```

2. **Postman** (Desktop o Web) o **Newman** (CLI)

### Importar en Postman

1. Abrir Postman
2. Click en **Import**
3. Seleccionar ambos archivos:
   - `postman_collection_complete.json`
   - `postman_environment_complete.json`
4. Seleccionar environment "Shipping Optimizer - Complete Dev Environment"

### Ejecutar con Newman (CLI)

```bash
# Instalar Newman
npm install -g newman newman-reporter-htmlextra

# Ejecutar colección completa
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export postman-report.html

# Ejecutar solo una carpeta específica
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json \
  --folder "3. Customers - CRUD" \
  --reporters cli
```

---

## 📊 Estructura de Datos

### Customer (ICustomer)
```json
{
  "name": "Carlos Rodríguez",
  "email": "carlos@example.com",
  "phone": "3001234567",
  "documentType": "CC",
  "documentNumber": "1234567890"
}
```

**Validaciones:**
- `name`: Min 3 caracteres
- `email`: Formato válido (RFC 5321)
- `phone`: Formato colombiano `3XXXXXXXXX` o `+573XXXXXXXXX`
- `documentType`: Uno de: `CC`, `CE`, `NIT`, `PASSPORT`
- `documentNumber`: Min 5 caracteres

### Shipment Request
```json
{
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "3109876543",
    "documentType": "CC",
    "documentNumber": "9876543210"
  },
  "address": {
    "origin": "Bogotá, Cundinamarca, Colombia",
    "destination": "Medellín, Antioquia, Colombia"
  },
  "package": {
    "weight": 5.5,
    "dimensions": {
      "length": 30,
      "width": 20,
      "height": 15
    },
    "fragile": false,
    "description": "Documentos importantes"
  },
  "pickupDate": "2026-01-25T10:00:00.000Z",
  "selectedQuote": {
    "providerId": "local",
    "providerName": "Local Courier",
    "price": 25000,
    "currency": "COP",
    "minDays": 2,
    "maxDays": 4,
    "estimatedDays": 3
  },
  "payment": {
    "method": "CREDIT_CARD",
    "amount": 25000,
    "currency": "COP",
    "transactionId": "TXN-12345",
    "status": "COMPLETED"
  }
}
```

### Shipment Response
```json
{
  "id": "6789abcd1234efgh5678ijkl",
  "trackingNumber": "LOG-20260122-4567",
  "customer": { /* ... */ },
  "address": { /* ... */ },
  "package": { /* ... */ },
  "currentStatus": "PENDING",
  "statusHistory": [
    {
      "status": "PENDING",
      "timestamp": "2026-01-22T12:00:00.000Z",
      "notes": "Envío creado",
      "location": "Sistema"
    }
  ],
  "createdAt": "2026-01-22T12:00:00.000Z",
  "updatedAt": "2026-01-22T12:00:00.000Z",
  "estimatedDeliveryDate": "2026-01-25T10:00:00.000Z"
}
```

**Tracking Number Format:** `LOG-YYYYMMDD-XXXX` (LOG + Fecha + Aleatorio)

### Estados de Envío (ShipmentStatus)
```
PENDING → PROCESSING → READY_FOR_PICKUP → PICKED_UP → 
IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED

Alternativos:
CANCELLED, RETURNED, FAILED_DELIVERY
```

---

## 🧪 Tests Implementados

### Health Check
```javascript
pm.test('Status code es 200')
pm.test('Respuesta indica sistema saludable')
pm.test('Tiempo de respuesta < 500ms')
```

### Adapters Status
```javascript
pm.test('Retorna 3 proveedores')
pm.test('Cada provider tiene status ONLINE/OFFLINE/DEGRADED')
pm.test('activeCount está entre 0 y 3')
```

### Quotes
```javascript
pm.test('Retorna 3 cotizaciones')
pm.test('Cada quote tiene estructura correcta')
pm.test('Exactamente 1 tiene badge isCheapest=true')
pm.test('Exactamente 1 tiene badge isFastest=true')
pm.test('Validación de peso < 0.1kg retorna 400')
```

### Customers
```javascript
pm.test('Customer creado tiene ID')
pm.test('Email tiene formato válido')
pm.test('Phone tiene formato colombiano')
pm.test('GET by ID retorna customer correcto')
pm.test('Búsqueda por email funciona')
pm.test('Update actualiza nombre correctamente')
pm.test('Delete retorna 200/204')
```

### Shipments
```javascript
pm.test('Tracking number tiene formato LOG-YYYYMMDD-XXXX')
pm.test('Status inicial es PENDING')
pm.test('Shipment tiene customer y address')
pm.test('GET by tracking retorna shipment correcto')
pm.test('Statistics contiene total y byStatus')
pm.test('Filtro por status retorna solo PENDING')
pm.test('Update status cambia a PROCESSING')
pm.test('StatusHistory tiene registro nuevo')
pm.test('Cancel cambia status a CANCELLED')
```

---

## 🔄 Variables de Entorno

### Variables Estáticas
| Variable | Valor | Descripción |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:3000` | URL del backend |
| `apiPrefix` | `/api` | Prefijo de rutas API |

### Variables Dinámicas (Generadas por Pre-request Scripts)
| Variable | Ejemplo | Uso |
|----------|---------|-----|
| `randomWeight` | `25.50` | Peso aleatorio para quotes |
| `randomDate` | `2026-01-25` | Fecha futura aleatoria |
| `testCustomerEmail` | `customer1737500000@test.com` | Email único por timestamp |
| `testCustomerPhone` | `3007500000` | Teléfono único por timestamp |
| `lastCustomerId` | `678abc...` | ID del último customer creado |
| `lastShipmentId` | `789def...` | ID del último shipment creado |
| `lastTrackingNumber` | `LOG-20260122-4567` | Último tracking generado |
| `lastQuoteData` | `{...}` | Datos de última cotización |
| `shipmentPickupDate` | `2026-01-24T10:00:00Z` | Fecha pickup para shipment |

---

## 📈 Flujo E2E Completo

### 1. Solicitar Cotización
```http
POST /api/quotes
{
  "origin": "Bogotá",
  "destination": "Medellín",
  "weight": 5.5,
  "pickupDate": "2026-01-25",
  "fragile": false
}
```
**Response:** 3 cotizaciones con badges

### 2. Crear Envío con Quote Seleccionada
```http
POST /api/shipments
{
  "customer": { /* datos */ },
  "selectedQuote": { /* quote del paso 1 */ },
  ...
}
```
**Response:** Shipment con tracking `LOG-20260122-XXXX`

### 3. Rastrear Envío
```http
GET /api/shipments/track/LOG-20260122-XXXX
```
**Response:** Detalles completos del envío

### 4. Actualizar Estado
```http
PUT /api/shipments/{id}/status
{
  "status": "PROCESSING",
  "notes": "Preparando envío",
  "location": "Bodega Bogotá"
}
```

### 5. Cancelar (si necesario)
```http
POST /api/shipments/{id}/cancel
{
  "reason": "Cancelado por cliente"
}
```

---

## 🎯 Ejecución por Casos de Uso

### Caso 1: Validar Sistema Completo
```bash
# Ejecutar toda la colección
newman run postman_collection_complete.json -e postman_environment_complete.json
```

**Resultado esperado:** 50+ tests passed

### Caso 2: Solo Verificar APIs de Clientes
```bash
newman run postman_collection_complete.json \
  -e postman_environment_complete.json \
  --folder "3. Customers - CRUD"
```

**Resultado esperado:** 18 tests passed

### Caso 3: Probar Flujo de Creación de Envío
Ejecutar en orden:
1. `POST Quote - Valid Data`
2. `POST Create Shipment`
3. `GET Shipment by Tracking Number`

### Caso 4: CI/CD Integration
```bash
# Generar reporte HTML para análisis
newman run postman_collection_complete.json \
  -e postman_environment_complete.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export report.html \
  --reporter-htmlextra-darkTheme
```

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED 127.0.0.1:3000"
**Solución:** Asegurarse que el backend esté corriendo
```bash
cd logistics-back && npm start
```

### Error: "ValidationError: Invalid phone format"
**Solución:** Usar formato colombiano válido:
- ✅ `3001234567` (10 dígitos)
- ✅ `+573001234567` (con código país)
- ❌ `300-123-4567` (guiones no permitidos)

### Error: "Cannot set status to X from Y"
**Solución:** Validar transiciones de estado permitidas:
```
PENDING → PROCESSING ✅
PENDING → DELIVERED ❌ (saltar estados no permitido)
DELIVERED → PROCESSING ❌ (no se puede retroceder)
```

### Tests fallan con "lastCustomerId is not defined"
**Solución:** Ejecutar requests en orden:
1. Primero `POST Create Customer`
2. Luego `GET Customer by ID`

---

## 📝 Agregar Nuevos Tests

### 1. En Postman GUI
```
1. Crear nuevo request
2. Agregar Pre-request Script (si necesario)
3. Agregar Tests en la pestaña "Tests"
4. Export → Save as postman_collection_complete.json
```

### 2. Estructura de un Test
```javascript
// Pre-request Script (opcional)
pm.environment.set('myVariable', 'value');

// Tests
pm.test('Descripción del test', () => {
    const response = pm.response.json();
    pm.expect(response).to.have.property('field');
    pm.expect(response.field).to.equal('expectedValue');
});

// Guardar variable para siguiente request
pm.environment.set('nextVariable', response.id);
```

---

## 📊 Cobertura de Tests

| Módulo | Endpoints | Tests | Coverage |
|--------|-----------|-------|----------|
| Health | 2 | 9 | 100% |
| Quotes | 4 | 15 | 100% |
| Customers | 7 | 18 | 100% |
| Shipments | 9 | 24 | 100% |
| E2E Flows | 1 | 1 | 100% |
| **TOTAL** | **23** | **50+** | **100%** |

---

## 🔗 Referencias

- [Postman Docs](https://learning.postman.com/docs/)
- [Newman CLI](https://learning.postman.com/docs/running-collections/using-newman-cli/)
- [Writing Tests](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Chai Assertion Library](https://www.chaijs.com/api/bdd/)

### Documentación del Proyecto
- [HU-01: Quote Request](../.github/plan/HU-01-quote-request.md)
- [HU-02: Input Validation](../.github/plan/HU-02-input-validation.md)
- [Arquitectura del Sistema](../.github/ARCHITECTURE.md)

---

## 🎓 Mejores Prácticas Implementadas

✅ **Tests atómicos** - Cada test verifica una sola cosa  
✅ **Pre-request scripts** - Datos dinámicos y únicos  
✅ **Variables de entorno** - Reutilización entre requests  
✅ **Assertions específicas** - Mensajes claros de error  
✅ **Flujos E2E** - Tests que simulan casos reales  
✅ **Documentación inline** - Descripciones en cada request  
✅ **CI/CD ready** - Compatible con Newman para pipelines  

---

**Versión:** 2.0.0  
**Última actualización:** 2026-01-22  
**Mantenido por:** QA & Backend Team

**¡Colección lista para usar en desarrollo, testing y CI/CD! 🚀**
