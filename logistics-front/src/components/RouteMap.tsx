import { useEffect, type FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { IRouteSegment } from '../models/Quote';

// Fix for default markers in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface RouteMapProps {
  origin: string;
  destination: string;
  originCoords?: [number, number];
  destCoords?: [number, number];
  routeCoordinates?: Array<[number, number]>; // Full route path
  segments?: IRouteSegment[]; // Multi-modal route segments
  distance?: string;
  duration?: string;
  transportMode?: string;
  onClose?: () => void;
}

// Component to fit bounds when route changes
const FitBounds: FC<{ bounds: L.LatLngBounds }> = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  return null;
};

export const RouteMap: FC<RouteMapProps> = ({ 
  origin, 
  destination, 
  originCoords,
  destCoords,
  routeCoordinates,
  segments, // Multi-modal segments
  distance,
  duration,
  transportMode = 'driving-car'
}) => {
  // Use provided coordinates or fallback to defaults
  const defaultOrigin: [number, number] = originCoords || [4.7110, -74.0721];
  const defaultDest: [number, number] = destCoords || [6.2442, -75.5812];
  
  // Use full route coordinates if provided, otherwise use straight line
  const routePath: Array<[number, number]> = routeCoordinates && routeCoordinates.length > 0 
    ? routeCoordinates 
    : [defaultOrigin, defaultDest];
  
  const bounds = L.latLngBounds(routePath);
  const center: [number, number] = [
    (defaultOrigin[0] + defaultDest[0]) / 2,
    (defaultOrigin[1] + defaultDest[1]) / 2
  ];

  // Generate unique key to force MapContainer recreation when route changes
  const mapKey = `${defaultOrigin[0]}-${defaultOrigin[1]}-${defaultDest[0]}-${defaultDest[1]}-${routePath.length}-${segments?.length || 0}`;

  // Get transport mode icon and color
  const getTransportInfo = (mode: string) => {
    switch (mode) {
      case 'driving-hgv':
        return { icon: 'local_shipping', color: '#FF9800', label: 'Camión' };
      case 'foot-walking':
        return { icon: 'directions_walk', color: '#2196F3', label: 'Caminando' };
      case 'cycling-regular':
        return { icon: 'directions_bike', color: '#8BC34A', label: 'Bicicleta' };
      case 'air-ground':
        return { icon: 'flight', color: '#2196F3', label: 'Avión + Camión' };
      default:
        return { icon: 'directions_car', color: '#6B8E7D', label: 'Auto' };
    }
  };

  const transportInfo = getTransportInfo(transportMode);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Route info header */}
      <div className="bg-white p-4 rounded-t-xl border-b border-border-light">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-muted mb-1">Origen</p>
            <p className="text-sm font-bold text-text-dark">{origin}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Destino</p>
            <p className="text-sm font-bold text-text-dark">{destination}</p>
          </div>
          {distance && duration && (
            <div>
              <p className="text-xs text-text-muted mb-1">Información</p>
              <p className="text-sm font-bold text-primary">
                {distance} • {duration}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-xs" style={{ color: transportInfo.color }}>
                  {transportInfo.icon}
                </span>
                <p className="text-xs text-text-muted">{transportInfo.label}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <MapContainer
          key={mapKey} // Force recreation when route changes
          center={center}
          zoom={7}
          className="w-full h-full"
          style={{ minHeight: '500px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Origin Marker */}
          <Marker position={defaultOrigin}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-primary">Origen</p>
                <p className="text-xs">{origin}</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Destination Marker */}
          <Marker position={defaultDest}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-accent-info">Destino</p>
                <p className="text-xs">{destination}</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Route lines */}
          {segments && segments.length > 0 ? (
            // Multi-modal route: render each segment with its own style
            <>
              {segments.map((segment, index) => (
                <Polyline
                  key={`segment-${index}`}
                  positions={segment.coordinates}
                  color={segment.color}
                  weight={segment.mode === 'air' ? 3 : 4}
                  opacity={segment.mode === 'air' ? 0.7 : 0.85}
                  dashArray={segment.mode === 'air' ? '15, 15' : undefined} // Dashed for air
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold" style={{ color: segment.color }}>
                        {segment.mode === 'air' ? '✈️' : '🚛'} {segment.transportLabel}
                      </p>
                      <p className="text-xs mt-1">📏 {segment.distanceKm.toFixed(1)} km</p>
                      <p className="text-xs">⏱️ {segment.durationMinutes} min</p>
                    </div>
                  </Popup>
                </Polyline>
              ))}
              
              {/* Airport marker (intermediate point for multi-modal) */}
              {segments.length >= 2 && segments[0].coordinates.length > 0 && (
                <Marker 
                  position={segments[0].coordinates[segments[0].coordinates.length - 1]}
                  icon={L.divIcon({
                    className: 'custom-airport-icon',
                    html: '<div style="background: white; border: 2px solid #2196F3; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 18px;">✈️</div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                  })}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold text-blue-600">Aeropuerto</p>
                      <p className="text-xs">Punto de transbordo</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </>
          ) : (
            // Single-mode route: render single polyline
            <Polyline
              positions={routePath}
              color={transportInfo.color}
              weight={4}
              opacity={0.8}
            />
          )}
          
          {/* Fit bounds */}
          <FitBounds bounds={bounds} />
        </MapContainer>
      </div>

      {/* Info footer */}
      <div className="bg-gradient-to-r from-primary/5 to-accent-info/5 p-4 rounded-b-xl">
        <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
          <span className="material-symbols-outlined text-base">info</span>
          <p>Mapa proporcionado por OpenStreetMap • Rutas por OpenRouteService</p>
        </div>
      </div>
    </div>
  );
};
