/**
 * WebSocket Service using Socket.io
 * Real-time communication for shipment updates
 * Following Observer pattern and Single Responsibility Principle
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Logger } from '../logging/Logger';

export enum WebSocketEvents {
  // Client -> Server
  JOIN_WAREHOUSE = 'warehouse:join',
  LEAVE_WAREHOUSE = 'warehouse:leave',
  TRACK_SHIPMENT = 'shipment:track',
  UNTRACK_SHIPMENT = 'shipment:untrack',
  
  // Server -> Client
  SHIPMENT_CREATED = 'shipment:created',
  SHIPMENT_UPDATED = 'shipment:updated',
  STATUS_CHANGED = 'shipment:status:changed',
  PAYMENT_PROCESSED = 'payment:processed',
  NOTIFICATION = 'notification',
  ERROR = 'error',
}

export interface SocketData {
  userId?: string;
  trackingNumbers: Set<string>;
  isWarehouseConnected: boolean;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private logger = Logger.getInstance();
  private connectedClients: Map<string, Socket> = new Map();

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.logger.info('🔌 Initializing WebSocket Service...');

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupConnectionHandlers();
    this.logger.info('✅ WebSocket Service initialized');
  }

  /**
   * Setup connection handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      this.logger.info('Client connected', { socketId: socket.id });
      
      // Initialize socket data
      const socketData: SocketData = {
        trackingNumbers: new Set(),
        isWarehouseConnected: false,
      };
      (socket as any).customData = socketData;

      this.connectedClients.set(socket.id, socket);

      // Handle warehouse join
      socket.on(WebSocketEvents.JOIN_WAREHOUSE, () => {
        this.handleJoinWarehouse(socket);
      });

      // Handle warehouse leave
      socket.on(WebSocketEvents.LEAVE_WAREHOUSE, () => {
        this.handleLeaveWarehouse(socket);
      });

      // Handle shipment tracking
      socket.on(WebSocketEvents.TRACK_SHIPMENT, (trackingNumber: string) => {
        this.handleTrackShipment(socket, trackingNumber);
      });

      // Handle shipment untracking
      socket.on(WebSocketEvents.UNTRACK_SHIPMENT, (trackingNumber: string) => {
        this.handleUntrackShipment(socket, trackingNumber);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        this.logger.error('Socket error', { socketId: socket.id, error });
      });
    });
  }

  /**
   * Handle client joining warehouse view
   */
  private handleJoinWarehouse(socket: Socket): void {
    const data = (socket as any).customData as SocketData;
    data.isWarehouseConnected = true;
    
    socket.join('warehouse');
    this.logger.info('Client joined warehouse', { socketId: socket.id });
    
    socket.emit('warehouse:joined', { message: 'Successfully joined warehouse view' });
  }

  /**
   * Handle client leaving warehouse view
   */
  private handleLeaveWarehouse(socket: Socket): void {
    const data = (socket as any).customData as SocketData;
    data.isWarehouseConnected = false;
    
    socket.leave('warehouse');
    this.logger.info('Client left warehouse', { socketId: socket.id });
  }

  /**
   * Handle shipment tracking subscription
   */
  private handleTrackShipment(socket: Socket, trackingNumber: string): void {
    const data = (socket as any).customData as SocketData;
    data.trackingNumbers.add(trackingNumber);
    
    socket.join(`shipment:${trackingNumber}`);
    this.logger.info('Client tracking shipment', { 
      socketId: socket.id, 
      trackingNumber 
    });
    
    socket.emit('shipment:tracking', { trackingNumber, subscribed: true });
  }

  /**
   * Handle shipment untracking
   */
  private handleUntrackShipment(socket: Socket, trackingNumber: string): void {
    const data = (socket as any).customData as SocketData;
    data.trackingNumbers.delete(trackingNumber);
    
    socket.leave(`shipment:${trackingNumber}`);
    this.logger.info('Client stopped tracking shipment', { 
      socketId: socket.id, 
      trackingNumber 
    });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(socket: Socket): void {
    this.connectedClients.delete(socket.id);
    this.logger.info('Client disconnected', { socketId: socket.id });
  }

  /**
   * Emit shipment created event to warehouse
   */
  emitShipmentCreated(shipment: any): void {
    if (!this.io) return;
    
    this.io.to('warehouse').emit(WebSocketEvents.SHIPMENT_CREATED, shipment);
    this.logger.debug('Shipment created event emitted', { 
      trackingNumber: shipment.trackingNumber 
    });
  }

  /**
   * Emit shipment updated event
   */
  emitShipmentUpdated(trackingNumber: string, updates: any): void {
    if (!this.io) return;
    
    // Emit to warehouse
    this.io.to('warehouse').emit(WebSocketEvents.SHIPMENT_UPDATED, {
      trackingNumber,
      updates,
      timestamp: new Date(),
    });
    
    // Emit to specific shipment trackers
    this.io.to(`shipment:${trackingNumber}`).emit(WebSocketEvents.SHIPMENT_UPDATED, {
      trackingNumber,
      updates,
      timestamp: new Date(),
    });
    
    this.logger.debug('Shipment updated event emitted', { trackingNumber });
  }

  /**
   * Emit status changed event
   */
  emitStatusChanged(trackingNumber: string, oldStatus: string, newStatus: string, notes?: string): void {
    if (!this.io) return;
    
    const payload = {
      trackingNumber,
      oldStatus,
      newStatus,
      notes,
      timestamp: new Date(),
    };
    
    // Emit to warehouse
    this.io.to('warehouse').emit(WebSocketEvents.STATUS_CHANGED, payload);
    
    // Emit to specific shipment trackers
    this.io.to(`shipment:${trackingNumber}`).emit(WebSocketEvents.STATUS_CHANGED, payload);
    
    this.logger.debug('Status changed event emitted', { 
      trackingNumber, 
      oldStatus, 
      newStatus 
    });
  }

  /**
   * Emit payment processed event
   */
  emitPaymentProcessed(shipmentId: string, trackingNumber: string, paymentStatus: string): void {
    if (!this.io) return;
    
    const payload = {
      shipmentId,
      trackingNumber,
      paymentStatus,
      timestamp: new Date(),
    };
    
    this.io.to('warehouse').emit(WebSocketEvents.PAYMENT_PROCESSED, payload);
    this.io.to(`shipment:${trackingNumber}`).emit(WebSocketEvents.PAYMENT_PROCESSED, payload);
    
    this.logger.debug('Payment processed event emitted', { trackingNumber, paymentStatus });
  }

  /**
   * Send notification to all warehouse clients
   */
  sendWarehouseNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    if (!this.io) return;
    
    this.io.to('warehouse').emit(WebSocketEvents.NOTIFICATION, {
      type,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Send error to specific client
   */
  sendError(socketId: string, error: string): void {
    const socket = this.connectedClients.get(socketId);
    if (socket) {
      socket.emit(WebSocketEvents.ERROR, { error, timestamp: new Date() });
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get warehouse connected clients count
   */
  getWarehouseClientsCount(): number {
    if (!this.io) return 0;
    const room = this.io.sockets.adapter.rooms.get('warehouse');
    return room ? room.size : 0;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }

  /**
   * Close WebSocket server
   */
  async close(): Promise<void> {
    if (this.io) {
      await new Promise<void>((resolve) => {
        this.io!.close(() => {
          this.logger.info('WebSocket server closed');
          resolve();
        });
      });
      this.io = null;
      this.connectedClients.clear();
    }
  }
}
