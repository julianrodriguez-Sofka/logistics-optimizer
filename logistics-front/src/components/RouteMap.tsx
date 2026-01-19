import { useEffect, type FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
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
  distance?: string;
  duration?: string;
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
  distance,
  duration 
}) => {
  // Default coords if not provided (Bogotá and Medellín as example)
  const defaultOrigin: [number, number] = originCoords || [4.7110, -74.0721];
  const defaultDest: [number, number] = destCoords || [6.2442, -75.5812];
  
  const bounds = L.latLngBounds([defaultOrigin, defaultDest]);
  const center: [number, number] = [
    (defaultOrigin[0] + defaultDest[0]) / 2,
    (defaultOrigin[1] + defaultDest[1]) / 2
  ];

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
            </div>
          )}
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <MapContainer
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
          
          {/* Route line */}
          <Polyline
            positions={[defaultOrigin, defaultDest]}
            color="#6B8E7D"
            weight={4}
            opacity={0.8}
          />
          
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
