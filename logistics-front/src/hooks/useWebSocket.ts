import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Shipment, ShipmentStatusType } from '../models/Shipment';

// For WebSocket, we need the base URL (without /api)
// In Docker, use 'http://backend:3000', in local dev use 'http://localhost:3000'
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://backend:3000';

// WebSocket event types as const object (compatible with verbatimModuleSyntax)
export const WebSocketEvents = {
  // Client to Server
  JOIN_WAREHOUSE: 'JOIN_WAREHOUSE',
  LEAVE_WAREHOUSE: 'LEAVE_WAREHOUSE',
  TRACK_SHIPMENT: 'TRACK_SHIPMENT',
  UNTRACK_SHIPMENT: 'UNTRACK_SHIPMENT',

  // Server to Client
  SHIPMENT_CREATED: 'SHIPMENT_CREATED',
  SHIPMENT_UPDATED: 'SHIPMENT_UPDATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  NOTIFICATION: 'NOTIFICATION',
  ERROR: 'ERROR',
} as const;

// Event payload interfaces
export interface ShipmentCreatedPayload {
  shipment: Shipment;
}

export interface ShipmentUpdatedPayload {
  shipment: Shipment;
}

export interface StatusChangedPayload {
  shipmentId: string;
  trackingNumber: string;
  oldStatus: ShipmentStatusType;
  newStatus: ShipmentStatusType;
  timestamp: Date;
  reason?: string;
}

export interface PaymentProcessedPayload {
  shipmentId: string;
  transactionId: string;
  amount: number;
  status: 'COMPLETED' | 'FAILED';
}

export interface NotificationPayload {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: unknown;
}

// Event handlers type
export interface WebSocketEventHandlers {
  onShipmentCreated?: (payload: ShipmentCreatedPayload) => void;
  onShipmentUpdated?: (payload: ShipmentUpdatedPayload) => void;
  onStatusChanged?: (payload: StatusChangedPayload) => void;
  onPaymentProcessed?: (payload: PaymentProcessedPayload) => void;
  onNotification?: (payload: NotificationPayload) => void;
  onError?: (error: string) => void;
}

export interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  joinWarehouse: () => void;
  leaveWarehouse: () => void;
  trackShipment: (trackingNumber: string) => void;
  untrackShipment: (trackingNumber: string) => void;
  connectedClientsCount: number;
}

/**
 * Custom hook for WebSocket connection and event handling
 */
export const useWebSocket = (handlers?: WebSocketEventHandlers): UseWebSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectedClientsCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    console.log('🔌 Connecting to WebSocket:', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initializing socket state from effect is intentional
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error);
      setConnected(false);
    });

    // Custom event handlers
    if (handlers?.onShipmentCreated) {
      newSocket.on(WebSocketEvents.SHIPMENT_CREATED, handlers.onShipmentCreated);
    }

    if (handlers?.onShipmentUpdated) {
      newSocket.on(WebSocketEvents.SHIPMENT_UPDATED, handlers.onShipmentUpdated);
    }

    if (handlers?.onStatusChanged) {
      newSocket.on(WebSocketEvents.STATUS_CHANGED, handlers.onStatusChanged);
    }

    if (handlers?.onPaymentProcessed) {
      newSocket.on(WebSocketEvents.PAYMENT_PROCESSED, handlers.onPaymentProcessed);
    }

    if (handlers?.onNotification) {
      newSocket.on(WebSocketEvents.NOTIFICATION, handlers.onNotification);
    }

    if (handlers?.onError) {
      newSocket.on(WebSocketEvents.ERROR, handlers.onError);
    }

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting WebSocket');
      newSocket.disconnect();
      setSocket(null);
    };
  }, [handlers]);

  // Join warehouse room
  const joinWarehouse = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('📦 Joining warehouse room');
      socketRef.current.emit(WebSocketEvents.JOIN_WAREHOUSE);
    }
  }, []);

  // Leave warehouse room
  const leaveWarehouse = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('📦 Leaving warehouse room');
      socketRef.current.emit(WebSocketEvents.LEAVE_WAREHOUSE);
    }
  }, []);

  // Track specific shipment
  const trackShipment = useCallback((trackingNumber: string) => {
    if (socketRef.current?.connected) {
      console.log('📍 Tracking shipment:', trackingNumber);
      socketRef.current.emit(WebSocketEvents.TRACK_SHIPMENT, { trackingNumber });
    }
  }, []);

  // Untrack specific shipment
  const untrackShipment = useCallback((trackingNumber: string) => {
    if (socketRef.current?.connected) {
      console.log('📍 Untracking shipment:', trackingNumber);
      socketRef.current.emit(WebSocketEvents.UNTRACK_SHIPMENT, { trackingNumber });
    }
  }, []);

  // Memoize return object - use state instead of ref for socket
  const returnValue = useMemo(() => ({
    socket,
    connected,
    joinWarehouse,
    leaveWarehouse,
    trackShipment,
    untrackShipment,
    connectedClientsCount,
  }), [socket, connected, joinWarehouse, leaveWarehouse, trackShipment, untrackShipment, connectedClientsCount]);

  return returnValue;
};

/**
 * Hook specifically for warehouse view with real-time updates
 */
export const useWarehouseWebSocket = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  const handlers: WebSocketEventHandlers = useMemo(() => ({
    onShipmentCreated: ({ shipment }) => {
      console.log('📦 New shipment created:', shipment.trackingNumber);
      setShipments((prev) => [shipment, ...prev]);
      setNotifications((prev) => [
        ...prev,
        {
          message: `Nuevo envío creado: ${shipment.trackingNumber}`,
          type: 'success',
          data: shipment,
        },
      ]);
    },

    onShipmentUpdated: ({ shipment }) => {
      console.log('📦 Shipment updated:', shipment.trackingNumber);
      setShipments((prev) =>
        prev.map((s) => (s.id === shipment.id ? shipment : s))
      );
    },

    onStatusChanged: (payload) => {
      console.log('📍 Status changed:', payload.trackingNumber, payload.newStatus);
      setShipments((prev) =>
        prev.map((s) =>
          s.id === payload.shipmentId
            ? { ...s, currentStatus: payload.newStatus }
            : s
        )
      );
      setNotifications((prev) => [
        ...prev,
        {
          message: `Estado actualizado: ${payload.trackingNumber} → ${payload.newStatus}`,
          type: 'info',
          data: payload,
        },
      ]);
    },

    onPaymentProcessed: (payload) => {
      console.log('💳 Payment processed:', payload.transactionId);
      setNotifications((prev) => [
        ...prev,
        {
          message: `Pago ${payload.status === 'COMPLETED' ? 'completado' : 'fallido'}: ${payload.transactionId}`,
          type: payload.status === 'COMPLETED' ? 'success' : 'error',
          data: payload,
        },
      ]);
    },

    onNotification: (notification) => {
      console.log('🔔 Notification:', notification);
      setNotifications((prev) => [...prev, notification]);
    },

    onError: (error) => {
      console.error('🔴 WebSocket error:', error);
      setNotifications((prev) => [
        ...prev,
        {
          message: error,
          type: 'error',
        },
      ]);
    },
  }), []);

  const { connected, joinWarehouse, leaveWarehouse, ...rest } = useWebSocket(handlers);

  // Auto-join warehouse on mount
  useEffect(() => {
    if (connected) {
      joinWarehouse();
    }

    return () => {
      if (connected) {
        leaveWarehouse();
      }
    };
  }, [connected, joinWarehouse, leaveWarehouse]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    connected,
    joinWarehouse,
    leaveWarehouse,
    ...rest,
    shipments,
    setShipments,
    notifications,
    clearNotifications,
    removeNotification,
  };
};
