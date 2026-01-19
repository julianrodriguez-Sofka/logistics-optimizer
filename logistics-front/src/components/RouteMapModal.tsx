import { RouteMap } from './RouteMap';
import type { FC } from 'react';

interface RouteMapModalProps {
  isOpen: boolean;
  origin: string;
  destination: string;
  onClose: () => void;
}

/**
 * RouteMapModal Component
 * Modal wrapper for the RouteMap component
 * 
 * Provides a full-screen overlay to display the route map
 */
export const RouteMapModal: FC<RouteMapModalProps> = ({
  isOpen,
  origin,
  destination,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl">map</span>
            <div>
              <h2 className="text-xl font-bold">Ruta de Envío</h2>
              <p className="text-sm text-white/80">OpenStreetMap - Vista Interactiva</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* Map Container */}
        <div className="bg-white">
          <RouteMap origin={origin} destination={destination} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};
