# 🗺️ Google Maps MCP Server

## Descripción

Servidor MCP (Model Context Protocol) para integración con Google Maps API. Proporciona herramientas para calcular rutas, geocodificar direcciones y obtener información de distancias.

## ✨ Características

- ✅ **Cálculo de rutas** con Google Maps Directions API
- ✅ **Geocodificación** de direcciones a coordenadas
- ✅ **Geocodificación inversa** de coordenadas a direcciones
- ✅ **Matriz de distancias** para múltiples orígenes/destinos
- ✅ **Caché de resultados** para optimizar rendimiento
- ✅ **Múltiples modos de viaje** (conducir, caminar, bicicleta, tránsito)

## 🛠️ Herramientas Disponibles

### 1. `calculate_route`

Calcula una ruta entre dos ubicaciones.

**Parámetros:**
- `origin` (string, requerido): Dirección de origen
- `destination` (string, requerido): Dirección de destino
- `mode` (string, opcional): Modo de viaje (`driving`, `walking`, `bicycling`, `transit`)
- `alternatives` (boolean, opcional): Retornar rutas alternativas

**Ejemplo de uso:**
```json
{
  "origin": "Bogotá, Colombia",
  "destination": "Medellín, Colombia",
  "mode": "driving",
  "alternatives": false
}
```

**Respuesta:**
```json
{
  "routes": [...],
  "mainRoute": {
    "summary": "Autopista Norte/Ruta Nacional 45A",
    "distance": {
      "text": "415 km",
      "meters": 415000,
      "kilometers": 415
    },
    "duration": {
      "text": "6 horas 30 mins",
      "seconds": 23400,
      "minutes": 390
    },
    "startAddress": "Bogotá, Colombia",
    "endAddress": "Medellín, Colombia",
    "steps": [...]
  }
}
```

### 2. `geocode_address`

Convierte una dirección en coordenadas geográficas.

**Parámetros:**
- `address` (string, requerido): Dirección a geocodificar

**Ejemplo de uso:**
```json
{
  "address": "Carrera 7 # 71-21, Bogotá, Colombia"
}
```

**Respuesta:**
```json
{
  "lat": 4.6533326,
  "lng": -74.0602244,
  "formattedAddress": "Cra. 7 #71-21, Bogotá, Colombia"
}
```

### 3. `reverse_geocode`

Convierte coordenadas geográficas en una dirección.

**Parámetros:**
- `latitude` (number, requerido): Latitud
- `longitude` (number, requerido): Longitud

**Ejemplo de uso:**
```json
{
  "latitude": 4.6533326,
  "longitude": -74.0602244
}
```

**Respuesta:**
```json
{
  "address": "Cra. 7 #71-21, Bogotá, Colombia"
}
```

### 4. `get_distance_matrix`

Obtiene distancias y duraciones para múltiples pares origen-destino.

**Parámetros:**
- `origins` (array, requerido): Array de direcciones de origen
- `destinations` (array, requerido): Array de direcciones de destino
- `mode` (string, opcional): Modo de viaje

**Ejemplo de uso:**
```json
{
  "origins": ["Bogotá, Colombia", "Cali, Colombia"],
  "destinations": ["Medellín, Colombia", "Cartagena, Colombia"],
  "mode": "driving"
}
```

## 📦 Instalación

### 1. Instalar Dependencias

```bash
cd mcp-servers/google-maps-mcp
npm install
```

### 2. Configurar API Key

Copia el archivo de ejemplo y configura tu API key:

```bash
cp .env.example .env
```

Edita `.env` y agrega tu API key de Google Maps:

```env
GOOGLE_MAPS_API_KEY=tu_api_key_real_aqui
```

### 3. Compilar el Servidor

```bash
npm run build
```

## ⚙️ Configuración en VS Code

El servidor MCP ya está configurado en `.vscode/settings.json`:

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node",
      "args": ["f:\\logistic-optimizer\\logistics-optimizer\\mcp-servers\\google-maps-mcp\\dist\\index.js"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "${env:GOOGLE_MAPS_API_KEY}"
      }
    }
  }
}
```

### Usar con Variables de Entorno del Sistema

**Opción 1: Variable de entorno del sistema (Recomendado para desarrollo)**

En Windows PowerShell:
```powershell
$env:GOOGLE_MAPS_API_KEY = "tu_api_key_aqui"
```

En Windows CMD:
```cmd
set GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

**Opción 2: Usar .env del servidor MCP**

El servidor también lee su propio archivo `.env`, así que puedes configurar la API key ahí.

## 🚀 Uso del Servidor MCP

### En GitHub Copilot

Una vez configurado, puedes usar las herramientas del MCP directamente en el chat de GitHub Copilot:

**Ejemplo 1: Calcular ruta**
```
@workspace Usa el MCP de Google Maps para calcular la ruta entre Bogotá y Medellín
```

**Ejemplo 2: Geocodificar dirección**
```
@workspace Usa el MCP para obtener las coordenadas de "Carrera 7 # 71-21, Bogotá"
```

**Ejemplo 3: Matriz de distancias**
```
@workspace Calcula las distancias entre [Bogotá, Cali] y [Medellín, Cartagena]
```

### Desde el Backend de Logistics Optimizer

El backend ya usa la librería de Google Maps directamente a través del `GoogleMapsAdapter`. El servidor MCP es adicional y sirve para:

1. **Desarrollo interactivo** con GitHub Copilot
2. **Pruebas rápidas** de funcionalidad de mapas
3. **Integración con otras herramientas** que soporten MCP

## 🧪 Probar el Servidor

### Modo de Desarrollo

Para desarrollo activo con hot-reload:

```bash
npm run dev
```

### Prueba Manual

Puedes probar el servidor manualmente enviándole mensajes JSON:

```bash
node dist/index.js
```

Luego envía (stdin):
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

## 📊 Integración con el Proyecto

### Backend (logistics-back)

El backend usa `GoogleMapsAdapter` que consume directamente la API de Google Maps:

- **Ubicación**: [logistics-back/src/infrastructure/adapters/GoogleMapsAdapter.ts](../../logistics-back/src/infrastructure/adapters/GoogleMapsAdapter.ts)
- **Servicio**: Integrado en `QuoteService`
- **Configuración**: `.env` en `logistics-back/`

### Frontend (logistics-front)

El frontend usa `@react-google-maps/api` para visualización:

- **Componentes**: `RouteMap.tsx`, `RouteMapModal.tsx`
- **Configuración**: `.env` en `logistics-front/`
- **Variable**: `VITE_GOOGLE_MAPS_API_KEY`

### Servidor MCP

El servidor MCP es una **capa adicional** para:

- Interacción con GitHub Copilot
- Pruebas y desarrollo
- Futura integración con otros servicios

## 🔒 Seguridad

### Variables de Entorno

**NUNCA** incluyas la API key directamente en el código. Usa:

1. Archivos `.env` (ya están en `.gitignore`)
2. Variables de entorno del sistema
3. Gestores de secretos en producción

### Restricciones de API Key

Configura restricciones en Google Cloud Console:

1. **Restricción de Aplicación**: HTTP referrers para frontend
2. **Restricción de API**: Solo habilita las APIs necesarias:
   - Directions API
   - Geocoding API
   - Maps JavaScript API
   - Distance Matrix API

## 📈 Monitoreo

Verifica el uso de la API en [Google Cloud Console](https://console.cloud.google.com/):

- Dashboard de APIs
- Cuotas y límites
- Costos y facturación

**Crédito Gratuito**: $200 USD/mes
**Solicitudes gratuitas**: ~28,000 solicitudes de Directions API/mes

## 🐛 Solución de Problemas

### Error: "API key not configured"

**Causa**: La variable `GOOGLE_MAPS_API_KEY` no está configurada

**Solución**:
1. Verifica el archivo `.env` en `mcp-servers/google-maps-mcp/`
2. O configura la variable de entorno del sistema

### Error: "No routes found"

**Causa**: Las direcciones no son válidas o no hay ruta disponible

**Solución**:
1. Verifica que las direcciones sean correctas
2. Prueba con direcciones más específicas
3. Verifica el modo de viaje (ej: no hay rutas de bicicleta entre ciudades lejanas)

### Error: "ZERO_RESULTS"

**Causa**: Google Maps no puede encontrar la ubicación

**Solución**:
1. Usa direcciones más específicas
2. Incluye ciudad y país
3. Prueba con coordenadas en lugar de direcciones

### El servidor MCP no aparece en VS Code

**Causa**: El servidor no está compilado o la configuración es incorrecta

**Solución**:
1. Ejecuta `npm run build` en el directorio del servidor
2. Verifica la ruta en `.vscode/settings.json`
3. Reinicia VS Code

## 📚 Scripts Disponibles

```bash
# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar el servidor compilado
npm start

# Preparar para distribución (ejecuta build automáticamente)
npm run prepare
```

## 🔄 Actualización del Servidor

Para actualizar el servidor después de cambios en el código:

```bash
cd mcp-servers/google-maps-mcp
npm run build
```

Si usas el modo dev, los cambios se recargan automáticamente:

```bash
npm run dev
```

## 📖 Recursos Adicionales

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [MCP SDK for TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)

## 🎯 Próximos Pasos

Una vez configurado el servidor MCP:

1. **Configura tu API key** en el archivo `.env`
2. **Compila el servidor** con `npm run build`
3. **Reinicia VS Code** para cargar la configuración MCP
4. **Prueba el servidor** usando GitHub Copilot con comandos como:
   ```
   @workspace Calcula la ruta entre Bogotá y Medellín usando el MCP de Google Maps
   ```

---

**Estado**: ✅ Listo para usar
**Versión**: 1.0.0
**Última actualización**: Enero 2026
