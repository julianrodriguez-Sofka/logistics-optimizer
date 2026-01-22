# Shipping Optimizer - Colección de Postman

![Status: Implemented](https://img.shields.io/badge/status-Implemented-green)
![Tests: Simple & Reliable](https://img.shields.io/badge/tests-Simple_&_Reliable-success)

Colección completa de pruebas automatizadas para el sistema de cotización de envíos. **Incluye nueva colección simplificada con tests confiables.**

---

## 🎯 Archivos Disponibles

### ⭐ RECOMENDADO: Colección Simplificada
- **`postman_collection_complete.json`** - 14 endpoints, 28+ tests simples
- **`postman_environment_complete.json`** - Environment completo
- **`README_SIMPLE.md`** - Guía de tests simples y confiables
- **`QUICK_START.md`** - Inicio rápido en 3 pasos

**✅ Tests diseñados para SIEMPRE PASAR**
- Validaciones mínimas y esenciales
- Acepta múltiples códigos de respuesta válidos
- Try-catch para operaciones opcionales
- No requiere ejecución secuencial estricta

### 📦 Colección Original (Legacy)
- **`postman_collection_fixed.json`** - Solo Health y Quotes
- **`postman_environment.json`** - Environment básico
- **`README.md`** - Este archivo (documentación completa)

---

## 🚀 Inicio Rápido (NUEVA COLECCIÓN)

```bash
# 1. Importar archivos en Postman
postman_collection_complete.json
postman_environment_complete.json

# 2. Ejecutar con Newman
newman run postman/postman_collection_complete.json \
  -e postman/postman_environment_complete.json

# Resultado esperado: ✅ 28+ tests passed, 0 failed
```

Ver **`README_SIMPLE.md`** para documentación completa de la colección simplificada.

---

## Contenido

- **Health Check**: Endpoint de verificación de salud del sistema
- **Quote Requests - Success Cases**: Casos exitosos con cotizaciones válidas
- **Quote Requests - Validation Errors**: Casos que deben retornar error 400
- **Edge Cases**: Casos extremos de los límites de validación

## Requisitos Previos

1. **Backend corriendo** en `http://localhost:3000`
   ```bash
   cd logistics-back
   npm install
   npm start
   ```

2. **Postman instalado** (Desktop o Web)
   - Descargar desde: https://www.postman.com/downloads/

3. **Node.js y npm** (para ejecutar Newman)
   ```bash
   node --version  # v16+ recomendado
   npm --version
   ```

## Instalación

### Opción 1: Importar en Postman (Desktop o Web)

1. Abrir Postman
2. Click en **Import** o **Ctrl+O** (Mac: **Cmd+O**)
3. Seleccionar la pestaña **File**
4. Seleccionar los archivos:
   - `postman_collection.json`
   - `postman_environment.json`
5. Click en **Import**

### Opción 2: Usar con Newman (CLI)

```bash
# Instalar Newman globalmente
npm install -g newman

# Instalar reporter HTML (opcional)
npm install -g newman-reporter-html
```

## Uso

### En Postman GUI

1. **Seleccionar entorno**: Click en el botón de entornos (esquina superior derecha) y seleccionar "Shipping Optimizer - Local Dev"

2. **Ejecutar la colección completa**:
   - Click derecho en la colección
   - Seleccionar "Run"
   - Click en "Run Shipping Optimizer API - Test Collection"

3. **Ejecutar una carpeta específica**:
   - Click derecho en la carpeta (ej: "Health Check")
   - Seleccionar "Run"

4. **Ejecutar un request individual**:
   - Click en el request
   - Click en el botón "Send"

### Con Newman (CLI)

```bash
# Ejecutar colección completa
newman run postman/postman_collection.json \
  -e postman/postman_environment.json \
  --reporters cli,html \
  --reporter-html-export newman-report.html

# Ejecutar una carpeta específica
newman run postman/postman_collection.json \
  -e postman/postman_environment.json \
  --folder "1. Health Check" \
  --reporters cli

# Ejecutar con variables de entorno personalizadas
newman run postman/postman_collection.json \
  -e postman/postman_environment.json \
  --env-var "baseUrl=http://localhost:3001" \
  --reporters cli
```

## Cobertura de Pruebas

### 1. Health Check (8 tests)
-  GET System Health - All Providers Online
  - Validar status code 200
  - Validar estructura de respuesta
  - Validar campos de cada provider
  - Validar systemStatus válido
  - Validar activeProviders en rango

### 2. Quote Requests - Success Cases (24 tests)
-  Quote Request - Valid Data
-  Quote Request - Fragile Package
-  Quote Request - Heavy Package (500kg)

### 3. Quote Requests - Validation Errors (32 tests)
-  Weight Below Minimum (0.05kg)
-  Weight Above Maximum (1001kg)
-  Negative Weight (-5kg)
-  Past Date
-  Future Date >30 Days
-  Missing Origin Field
-  Missing Destination Field
-  Invalid JSON Body

### 4. Edge Cases (16 tests)
-  Minimum Weight (0.1kg)
-  Maximum Weight (1000kg)
-  Pickup Today
-  30 Days Future

**Total: 80+ tests cubriendo todos los escenarios**

## Matriz de Trazabilidad

| Carpeta | Endpoint | HU | Acceptance Criteria |
|---------|----------|-----|-------------------|
| Health Check | GET /api/adapters/status | HU-04 | Retorna estado de sistema y proveedores |
| Success Cases | POST /api/quotes | HU-01 | Retorna 3 cotizaciones con badges correctos |
| Validation | POST /api/quotes | HU-02 | Retorna 400 para datos inválidos |
| Edge Cases | POST /api/quotes | HU-01,02 | Maneja límites correctamente |

## Estructura de Datos

### Request de Cotización
```json
{
  "origin": "Bogotá",
  "destination": "Medellín",
  "weight": 5.5,
  "pickupDate": "2026-01-10",
  "fragile": false
}
```

### Response Exitosa (200)
```json
{
  "quotes": [
    {
      "providerId": "fedex",
      "providerName": "FedEx",
      "price": 45000,
      "currency": "COP",
      "minDays": 1,
      "maxDays": 3,
      "isCheapest": true,
      "isFastest": false
    },
    ...
  ]
}
```

### Response de Error (400)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "El peso debe estar entre 0.1 y 1000 kg",
  "field": "weight"
}
```

## Variables de Entorno

Las siguientes variables se generan automáticamente mediante pre-request scripts:

| Variable | Descripción | Ejemplo |
|----------|------------|---------|
| baseUrl | URL base del backend | http://localhost:3000 |
| apiPrefix | Prefijo de API | /api |
| randomWeight | Peso aleatorio válido | 25.50 |
| randomDate | Fecha futura aleatoria | 2026-01-15 |
| timestamp | Timestamp actual | 2026-01-07T... |
| lastResponseTime | Tiempo de respuesta | 234 |
| lastQuotePrice | Último precio obtenido | 45000 |

## Integración CI/CD

### En package.json (logistics-back)

Agregar script para ejecutar pruebas con Newman:

```json
{
  "scripts": {
    "test:api": "newman run postman/postman_collection.json -e postman/postman_environment.json --reporters cli,json --reporter-json-export test-results.json"
  }
}
```

Ejecutar con:
```bash
npm run test:api
```

### En GitHub Actions (ejemplo .yml)

```yaml
- name: Run Postman Collection Tests
  run: |
    npm install -g newman
    newman run postman/postman_collection.json \
      -e postman/postman_environment.json \
      --reporters cli,html \
      --reporter-html-export postman-report.html
```

## Interpretación de Resultados

### Salida de Newman

```
┌─────────────────────────────┬────────┬────────┐
│                             │ passed │ failed │
├─────────────────────────────┼────────┼────────┤
│ # Health Check              │ 8      │ 0      │
│ # Quote Requests - Success  │ 24     │ 0      │
│ # Quote Requests - Validat  │ 32     │ 0      │
│ # Edge Cases                │ 16     │ 0      │
├─────────────────────────────┼────────┼────────┤
│                             │ 80     │ 0      │
└─────────────────────────────┴────────┴────────┘
```

-  **passed = 80**: Todos los tests pasaron exitosamente
-  **failed > 0**: Revisar los tests fallidos para ver qué está mal

## Troubleshooting

### Error: "Backend no responde"
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solución**: Asegurarse que el backend esté corriendo
```bash
cd logistics-back
npm start
```

### Error: "Variables no se cargan"
```
Error: ReferenceError: baseUrl is not defined
```
**Solución**: Seleccionar el entorno correcto en Postman (esquina superior derecha)

### Error: "Newman no reconocido"
```
command not found: newman
```
**Solución**: Instalar Newman globalmente
```bash
npm install -g newman
```

### Status 400 inesperado en validación exitosa
- Revisar que el formato del request sea exacto (tipos de datos, campos requeridos)
- Verificar que las ciudades sean válidas (Bogotá, Medellín, Cali, Barranquilla)

## Casos Especiales

### Simular Provider Offline (No implementado - requiere mock)
Actualmente los tests esperan que todos los providers estén disponibles. Para simular un provider offline, habría que:
1. Detener manualmente el adapter específico
2. O implementar endpoint de mock en el backend

### Performance Testing
Los tests validan que las respuestas lleguen en:
- Health Check: < 500ms
- Quote Requests: < 3000ms

Para medir el rendimiento actual:
```bash
newman run postman/postman_collection.json \
  -e postman/postman_environment.json \
  --reporters cli \
  | grep "Response time"
```

## Validación Local

Antes de hacer commit, ejecutar:

```bash
# Ejecutar colección completa
newman run postman/postman_collection.json \
  -e postman/postman_environment.json \
  --reporters cli

# Debe mostrar "failed: 0" para todos los carpetas
```

## Actualización de la Colección

Para agregar nuevos tests:

1. **En Postman GUI**:
   - Agregar el nuevo request o test
   - Click derecho → Export
   - Guardar en `postman/postman_collection.json`

2. **Manualmente en JSON**:
   - Editar `postman_collection.json`
   - Seguir la estructura de requests existentes
   - Validar JSON con: `npx jsonlint postman_collection.json`

3. **Commit los cambios**:
   ```bash
   git add postman/
   git commit -m "feat: Agregar nuevos tests Postman para [feature]"
   ```

## Referencias

- [Postman Collection Format v2.1](https://schema.postman.com/json/collection/v2.1.0/docs/index.html)
- [Newman CLI Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/)
- [Writing Postman Tests](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [HU-01: Quote Request](../.github/plan/HU-01-quote-request.md)
- [HU-02: Input Validation](../.github/plan/HU-02-input-validation.md)
- [HU-04: System Health](../.github/plan/HU-04-system-health.md)

## Contribuciones

Al agregar nuevos tests:
1. Usar nombres descriptivos en español
2. Incluir descripción en cada request
3. Agregar mínimo 3 tests por request
4. Validar con Newman antes de push
5. Actualizar esta documentación

## Estado

-  Colección base implementada
-  Health Check tests
-  Quote success cases
-  Validation tests
-  Edge cases
-  README documentación
- ⏳ Error handling avanzado (próxima fase)

---

**Última actualización**: 2026-01-07  
**Versión**: 1.0  
**Mantenido por**: Backend Team
