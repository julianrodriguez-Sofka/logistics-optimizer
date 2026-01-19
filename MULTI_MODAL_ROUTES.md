# 🚀 Rutas Multi-Modal: Avión + Camión

## 📋 Resumen

El sistema ahora soporta rutas multi-modales que combinan transporte aéreo y terrestre para entregas de larga distancia. Esta funcionalidad calcula automáticamente:

1. **Segmento Aéreo**: Vuelo desde el origen hasta el aeropuerto más cercano al destino
2. **Segmento Terrestre**: Entrega por camión desde el aeropuerto hasta el destino final

## ✨ Características

### Modos de Transporte Disponibles

| Modo | Código | Descripción | Color en Mapa | Velocidad Promedio |
|------|--------|-------------|---------------|-------------------|
| Auto | `driving-car` | Vehículo personal | Verde (#6B8E7D) | ~80 km/h |
| Camión | `driving-hgv` | Transporte pesado | Naranja (#FF9800) | ~60 km/h |
| Bicicleta | `cycling-regular` | Ciclismo | Verde claro (#8BC34A) | ~15 km/h |
| Caminando | `foot-walking` | A pie | Azul (#2196F3) | ~5 km/h |
| **Avión + Camión** | `air-ground` | Multi-modal | Azul + Naranja | Avión: 800 km/h<br>Camión: 60 km/h |

### Cálculo de Rutas Multi-Modal

#### 1. Segmento Aéreo (Avión)
- **Cálculo**: Distancia geodésica (Great Circle) usando fórmula de Haversine
- **Origen**: Dirección proporcionada por el usuario
- **Destino**: Aeropuerto más cercano a la dirección de destino
- **Velocidad**: 800 km/h (promedio de vuelo comercial)
- **Tiempo adicional**: +60 minutos (procedimientos aeroportuarios)
- **Visualización**: Línea azul **discontinua** (#2196F3)

#### 2. Segmento Terrestre (Camión)
- **Cálculo**: Ruta real por carretera usando OpenRouteService API
- **Origen**: Aeropuerto de llegada
- **Destino**: Dirección final proporcionada por el usuario
- **Velocidad**: Variable según ruta (promedio ~60 km/h)
- **Visualización**: Línea naranja **sólida** (#FF9800) siguiendo carreteras

## 🛩️ Aeropuertos Incluidos

El sistema actualmente soporta los siguientes aeropuertos colombianos:

| Ciudad | Aeropuerto | Código | Coordenadas |
|--------|-----------|--------|-------------|
| Bogotá | El Dorado | BOG | 4.701594, -74.146947 |
| Medellín | José María Córdova | MDE | 6.164516, -75.423119 |
| Cali | Alfonso Bonilla Aragón | CLO | 3.543222, -76.381583 |
| Cartagena | Rafael Núñez | CTG | 10.442381, -75.512961 |
| Barranquilla | Ernesto Cortissoz | BAQ | 10.889628, -74.780653 |

## 🎨 Visualización en el Mapa

### Rutas Simples (Modo único)
- Una sola línea de color según el tipo de transporte
- Línea **sólida** siguiendo la geometría de la ruta real

### Rutas Multi-Modal (Avión + Camión)
- **Segmento aéreo**: Línea azul **discontinua** (dashed)
  - Representa vuelo directo en línea recta
  - Al hacer clic muestra: distancia, duración, "Avión"
  
- **Segmento terrestre**: Línea naranja **sólida**
  - Sigue carreteras reales desde aeropuerto a destino
  - Al hacer clic muestra: distancia, duración, "Camión"

- **Marcadores**:
  - 📍 Verde: Punto de origen
  - 📍 Rojo: Punto de destino
  - ✈️ Aeropuerto intermedio (visible en segmentos)

## 💻 Implementación Técnica

### Backend

#### Nuevo Adaptador: `MultiModalRouteAdapter.ts`

```typescript
// Calcula ruta multi-modal
async calculateRoute(origin: Location, destination: Location): Promise<RouteInfo>

// Encuentra aeropuerto más cercano
private findNearestAirport(location: Location): Location

// Calcula segmento aéreo (geodésico)
private calculateAirSegment(origin: Location, airport: Location): RouteSegment

// Calcula segmento terrestre (OpenRouteService)
private async calculateGroundSegment(airport: Location, destination: Location): Promise<RouteSegment>

// Distancia geodésica (Haversine)
private calculateGeodesicDistance(lat1, lon1, lat2, lon2): number
```

#### Estructura de Datos

**RouteSegment** (Nuevo):
```typescript
interface RouteSegment {
  mode: 'air' | 'ground';
  transportLabel: string; // "Avión" o "Camión"
  coordinates: Array<[number, number]>; // Coordenadas [lat, lng]
  distanceKm: number;
  durationMinutes: number;
  color: string; // Color para visualización
}
```

**RouteInfo** (Actualizado):
```typescript
interface RouteInfo {
  // ... campos existentes ...
  transportMode: TransportMode; // Incluye 'air-ground'
  segments?: RouteSegment[]; // Array de segmentos para rutas multi-modal
}
```

### Frontend

#### Componentes Actualizados

**QuoteRequestForm.tsx**:
- Selector visual de modos de transporte (5 botones con iconos)
- Envía `transportMode` en la petición de cotización

**RouteMap.tsx**:
- Detecta presencia de `segments[]` en routeInfo
- Renderiza múltiples `<Polyline>` si hay segmentos
- Aplica `dashArray` para líneas aéreas discontinuas
- Popups individuales por segmento con información detallada

**RouteMapModal.tsx**:
- Pasa `segments` al componente RouteMap
- Maneja visualización de rutas complejas

#### Hooks

**useQuoteFormState.ts**:
- Agregado campo `transportMode` al estado del formulario
- Valor por defecto: `'driving-car'`

## 📊 Ejemplo de Uso

### Request (Frontend → Backend)

```typescript
POST /api/quotes

{
  "origin": "Calle 100, Bogotá",
  "destination": "Carrera 43A, Medellín",
  "weight": 25.5,
  "pickupDate": "2026-01-20",
  "fragile": false,
  "transportMode": "air-ground" // ✨ Nuevo campo
}
```

### Response (Backend → Frontend)

```json
{
  "quotes": [...],
  "messages": [],
  "routeInfo": {
    "distanceKm": 287.4,
    "durationSeconds": 9720,
    "durationFormatted": "2h 42min",
    "transportMode": "air-ground",
    "segments": [ // ✨ Nuevo array
      {
        "mode": "air",
        "transportLabel": "Avión",
        "coordinates": [
          [4.7110, -74.0721],
          [6.1645, -75.4231]
        ],
        "distanceKm": 240.5,
        "durationMinutes": 78, // 18min vuelo + 60min procedimientos
        "color": "#2196F3"
      },
      {
        "mode": "ground",
        "transportLabel": "Camión",
        "coordinates": [
          [6.1645, -75.4231],
          [6.1660, -75.4240],
          // ... cientos de puntos siguiendo carreteras ...
          [6.2442, -75.5812]
        ],
        "distanceKm": 46.9,
        "durationMinutes": 84,
        "color": "#FF9800"
      }
    ]
  }
}
```

## 🔧 Configuración

### Variables de Entorno (.env)

```bash
# OpenRouteService API Key (GRATIS - 2000 requests/día)
OPENROUTESERVICE_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjkwZmU1ODYwMDc3MDQyN2JiYTlhNzlkMjUyMWI5Njk2IiwiaCI6Im11cm11cjY0In0=
```

### Inicialización del Servicio

```typescript
// routes/quotes.routes.ts

// Adaptador estándar (una sola modalidad)
const routeCalculator = new OpenRouteServiceAdapter(apiKey);

// Adaptador multi-modal (avión + camión)
const multiModalCalculator = new MultiModalRouteAdapter(apiKey);

// QuoteService usa ambos adaptadores
const quoteService = new QuoteService(
  providers,
  quoteRepository,
  routeCalculator,        // Para modos simples
  multiModalCalculator     // Para modo air-ground
);
```

## 🧪 Testing

### Test Manual

1. **Iniciar servicios**:
   ```bash
   docker-compose up -d
   ```

2. **Acceder a frontend**: http://localhost:5173

3. **Probar ruta multi-modal**:
   - Origen: `Bogotá, Colombia`
   - Destino: `Medellín, Colombia`
   - Peso: `25 kg`
   - Modo: **Avión + Camión** (botón con icono de avión)
   - Click en "Calculate Rates"

4. **Verificar resultado**:
   - Mapa debe mostrar:
     - Línea azul discontinua (Bogotá → Aeropuerto MDE)
     - Línea naranja sólida (Aeropuerto → Medellín centro)
   - Click en cada línea muestra detalles del segmento

### Test con cURL

```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Bogotá, Colombia",
    "destination": "Medellín, Colombia",
    "weight": 25,
    "pickupDate": "2026-01-20",
    "fragile": false,
    "transportMode": "air-ground"
  }'
```

## 📈 Ventajas del Sistema Multi-Modal

### ✅ Beneficios

1. **Entregas más rápidas**: Vuelo directo reduce tiempo en distancias largas
2. **Optimización de costos**: Combina velocidad aérea con economía terrestre
3. **Visualización clara**: Mapa muestra ambos segmentos con estilos distintos
4. **Flexibilidad**: Usuario elige el modo según necesidades (tiempo vs costo)
5. **Escalabilidad**: Fácil agregar más aeropuertos o modalidades (tren, barco)

### ⚡ Performance

- **Cache**: 1 hora de TTL para rutas calculadas
- **API gratuita**: OpenRouteService (2000 requests/día)
- **Cálculos eficientes**: Geodésica para aire, API para tierra

## 🚧 Mejoras Futuras

### Fase 2 (Planeadas)
- [ ] Agregar más aeropuertos internacionales
- [ ] Soporte para rutas marítimas (barco + camión)
- [ ] Soporte para rutas de tren
- [ ] Cálculo de costos diferenciados por segmento
- [ ] Comparación automática: multi-modal vs terrestre completo
- [ ] Incluir escalas en vuelos (múltiples aeropuertos)
- [ ] Optimización de ruta (elegir mejor aeropuerto según distancia total)

### Fase 3 (Futuras)
- [ ] Machine Learning para predecir mejor modo de transporte
- [ ] Integración con APIs de aerolíneas (disponibilidad real)
- [ ] Cálculo de huella de carbono por modalidad
- [ ] Soporte para múltiples segmentos (avión + tren + camión)

## 📚 Referencias

- [OpenRouteService API Documentation](https://openrouteservice.org/dev/#/api-docs)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [Great Circle Distance](https://en.wikipedia.org/wiki/Great-circle_distance)
- [Leaflet Maps](https://leafletjs.com/)
- [React Leaflet](https://react-leaflet.js.org/)

## 🎯 Conclusión

El sistema multi-modal proporciona una solución completa y visual para planificación de entregas que requieren múltiples modos de transporte. La implementación es escalable, eficiente y proporciona una excelente experiencia de usuario.

---

**Última actualización**: 19 de enero de 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado y funcional
