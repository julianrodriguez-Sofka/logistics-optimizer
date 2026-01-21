/**
 * Shipment Status Value Object
 * Represents the lifecycle status of a shipment
 */

export type ShipmentStatusType = 
  | 'PENDING_PAYMENT'      // Waiting for payment
  | 'PAYMENT_CONFIRMED'    // Payment received
  | 'PROCESSING'           // Being prepared for shipment
  | 'READY_FOR_PICKUP'     // Ready to be picked up
  | 'IN_TRANSIT'           // On the way
  | 'OUT_FOR_DELIVERY'     // With delivery driver
  | 'DELIVERED'            // Successfully delivered
  | 'FAILED_DELIVERY'      // Delivery attempt failed
  | 'CANCELLED'            // Cancelled by customer
  | 'RETURNED';            // Returned to sender

export interface IShipmentStatus {
  status: ShipmentStatusType;
  timestamp: Date;
  notes?: string;
  location?: string;
  updatedBy?: string;
}

export class ShipmentStatus {
  private _status: ShipmentStatusType;
  private _timestamp: Date;
  private _notes?: string;
  private _location?: string;
  private _updatedBy?: string;

  constructor(data: IShipmentStatus) {
    this._status = data.status;
    this._timestamp = data.timestamp;
    this._notes = data.notes;
    this._location = data.location;
    this._updatedBy = data.updatedBy;
  }

  // Getters
  get status(): ShipmentStatusType { return this._status; }
  get timestamp(): Date { return this._timestamp; }
  get notes(): string | undefined { return this._notes; }
  get location(): string | undefined { return this._location; }
  get updatedBy(): string | undefined { return this._updatedBy; }

  /**
   * Check if status can transition to new status
   * Implements business rules for status transitions
   */
  static canTransition(current: ShipmentStatusType, next: ShipmentStatusType): boolean {
    const validTransitions: Record<ShipmentStatusType, ShipmentStatusType[]> = {
      PENDING_PAYMENT: ['PAYMENT_CONFIRMED', 'CANCELLED'],
      PAYMENT_CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['READY_FOR_PICKUP', 'CANCELLED'],
      READY_FOR_PICKUP: ['IN_TRANSIT', 'CANCELLED'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED_DELIVERY', 'RETURNED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_DELIVERY'],
      FAILED_DELIVERY: ['IN_TRANSIT', 'RETURNED'],
      DELIVERED: [], // Terminal state
      CANCELLED: [], // Terminal state
      RETURNED: [], // Terminal state
    };

    return validTransitions[current]?.includes(next) ?? false;
  }

  /**
   * Get human-readable status name in Spanish
   */
  getDisplayName(): string {
    const displayNames: Record<ShipmentStatusType, string> = {
      PENDING_PAYMENT: 'Pendiente de Pago',
      PAYMENT_CONFIRMED: 'Pago Confirmado',
      PROCESSING: 'En Procesamiento',
      READY_FOR_PICKUP: 'Listo para Recoger',
      IN_TRANSIT: 'En Tránsito',
      OUT_FOR_DELIVERY: 'En Reparto',
      DELIVERED: 'Entregado',
      FAILED_DELIVERY: 'Intento de Entrega Fallido',
      CANCELLED: 'Cancelado',
      RETURNED: 'Devuelto',
    };

    return displayNames[this._status];
  }

  /**
   * Get status color for UI
   */
  getStatusColor(): string {
    const colors: Record<ShipmentStatusType, string> = {
      PENDING_PAYMENT: '#FFA500',      // Orange
      PAYMENT_CONFIRMED: '#4169E1',    // Royal Blue
      PROCESSING: '#9370DB',           // Medium Purple
      READY_FOR_PICKUP: '#20B2AA',     // Light Sea Green
      IN_TRANSIT: '#1E90FF',           // Dodger Blue
      OUT_FOR_DELIVERY: '#FFD700',     // Gold
      DELIVERED: '#32CD32',            // Lime Green
      FAILED_DELIVERY: '#FF6347',      // Tomato
      CANCELLED: '#808080',            // Gray
      RETURNED: '#DC143C',             // Crimson
    };

    return colors[this._status];
  }

  /**
   * Check if status is terminal (no more transitions possible)
   */
  isTerminal(): boolean {
    return ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(this._status);
  }

  /**
   * Check if shipment is active (in progress)
   */
  isActive(): boolean {
    return [
      'PROCESSING',
      'READY_FOR_PICKUP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
    ].includes(this._status);
  }

  /**
   * Convert to plain object
   */
  toJSON(): IShipmentStatus {
    return {
      status: this._status,
      timestamp: this._timestamp,
      notes: this._notes,
      location: this._location,
      updatedBy: this._updatedBy,
    };
  }
}
