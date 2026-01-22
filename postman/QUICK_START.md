# ⚡ Quick Start - Postman Collection

## 🎯 Archivos Disponibles

### ✅ Colección Completa (RECOMENDADO)
- **`postman_collection_complete.json`** - 23 endpoints, 50+ tests
- **`postman_environment_complete.json`** - Environment con todas las variables
- **`README_COMPLETE.md`** - Documentación completa

**Cobertura:** Health, Quotes, Customers, Shipments, E2E Flows

### 📦 Colección Básica (Legacy)
- **`postman_collection_fixed.json`** - Solo Health y Quotes
- **`postman_environment.json`** - Environment básico
- **`README.md`** - Documentación básica

---

## 🚀 Inicio Rápido (3 pasos)

### 1. Iniciar Backend
```bash
cd logistics-back
npm install
npm start
# Server running on http://localhost:3000
```

### 2. Importar en Postman
```
1. Abrir Postman
2. Import → File
3. Seleccionar:
   - postman_collection_complete.json
   - postman_environment_complete.json
4. Environment: Seleccionar "Shipping Optimizer - Complete Dev Environment"
```

### 3. Ejecutar Tests
```
Opción A - GUI:
  Click derecho en colección → Run → Run Shipping Optimizer API

Opción B - CLI (Newman):
  npm install -g newman newman-reporter-htmlextra
  newman run postman_collection_complete.json \
    -e postman_environment_complete.json \
    --reporters cli,htmlextra
```

---

## 📋 Comandos Útiles

### Ejecutar Todo
```bash
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export report.html
```

### Solo Health Check
```bash
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json \
  --folder "1. Health & Status"
```

### Solo Customers
```bash
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json \
  --folder "3. Customers - CRUD"
```

### Solo Shipments
```bash
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json \
  --folder "4. Shipments - Full CRUD"
```

### Generar Reporte HTML Premium
```bash
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json \
  --reporters htmlextra \
  --reporter-htmlextra-export report.html \
  --reporter-htmlextra-darkTheme \
  --reporter-htmlextra-title "Shipping Optimizer API Tests"
```

---

## 🎯 Flujos de Prueba

### Flujo 1: Validación Rápida del Sistema
```
1. GET Health Check
2. GET Adapters Status
3. POST Quote - Valid Data
```
**Tiempo:** ~5 segundos  
**Resultado esperado:** 3 tests passed

### Flujo 2: CRUD de Clientes
```
1. POST Create Customer → Guarda ID
2. GET Customer by ID
3. GET Customer by Email
4. PUT Update Customer
5. DELETE Customer
```
**Tiempo:** ~10 segundos  
**Resultado esperado:** 18 tests passed

### Flujo 3: Creación y Rastreo de Envío
```
1. POST Quote - Valid Data → Guarda quote
2. POST Create Shipment → Guarda tracking
3. GET Shipment by Tracking Number
4. PUT Update Shipment Status
5. POST Cancel Shipment
```
**Tiempo:** ~15 segundos  
**Resultado esperado:** 24 tests passed

### Flujo 4: Colección Completa
```
Ejecutar TODOS los 23 endpoints
```
**Tiempo:** ~30-40 segundos  
**Resultado esperado:** 50+ tests passed

---

## 📊 Endpoints por Módulo

### 🏥 Health & Status (2)
- `GET /api/health`
- `GET /api/adapters/status`

### 💰 Quotes (4)
- `POST /api/quotes` (success, fragile, validation errors)

### 👥 Customers (7)
- `POST` Create
- `GET` List all
- `GET /:id` By ID
- `GET /email/:email` By email
- `GET /search` Search
- `PUT /:id` Update
- `DELETE /:id` Delete

### 📦 Shipments (9)
- `POST` Create
- `GET` List all
- `GET /:id` By ID
- `GET /track/:trackingNumber` Track
- `GET /statistics` Stats
- `GET /status/:status` By status
- `GET /search` Search
- `PUT /:id/status` Update status
- `POST /:id/cancel` Cancel

---

## ✅ Checklist de Verificación

Antes de ejecutar, asegurarse:

- [ ] Backend corriendo en `http://localhost:3000`
- [ ] MongoDB corriendo (si usa persistencia)
- [ ] Environment seleccionado en Postman
- [ ] Newman instalado (para CLI)

Verificar que backend responde:
```bash
curl http://localhost:3000/api/health
# Debe retornar: {"status":"OK"} o similar
```

---

## 🐛 Errores Comunes

### "ECONNREFUSED"
➡️ Backend no está corriendo
```bash
cd logistics-back && npm start
```

### "lastCustomerId is not defined"
➡️ Ejecutar requests en orden secuencial, no en paralelo

### "ValidationError: Invalid email"
➡️ Los pre-request scripts generan emails válidos automáticamente

### Tests fallan con 400
➡️ Verificar formato de datos en body del request

---

## 📈 Salida Esperada (Newman)

```
┌─────────────────────────────┬────────┬────────┐
│                             │ passed │ failed │
├─────────────────────────────┼────────┼────────┤
│ 1. Health & Status          │ 9      │ 0      │
│ 2. Quotes                   │ 15     │ 0      │
│ 3. Customers - CRUD         │ 18     │ 0      │
│ 4. Shipments - Full CRUD    │ 24     │ 0      │
│ 5. End-to-End Flows         │ 1      │ 0      │
├─────────────────────────────┼────────┼────────┤
│                     TOTAL   │ 50+    │ 0      │
└─────────────────────────────┴────────┴────────┘

Execution time: ~35 seconds
```

---

## 🎓 Próximos Pasos

1. **Ver README_COMPLETE.md** para documentación detallada
2. **Ejecutar flujos E2E** para validar el sistema completo
3. **Integrar en CI/CD** usando Newman en GitHub Actions
4. **Personalizar variables** en el environment según ambiente (dev, staging, prod)

---

**Tip:** Usa `Ctrl+Alt+C` en Postman para copiar un request como cURL  
**Tip:** Usa `pm.expect()` en tests para assertions más legibles  
**Tip:** Ejecuta `newman run --help` para ver todas las opciones disponibles

---

**¿Problemas?** Ver `README_COMPLETE.md` sección Troubleshooting  
**¿Agregar tests?** Ver `README_COMPLETE.md` sección "Agregar Nuevos Tests"
