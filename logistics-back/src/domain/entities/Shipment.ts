/**
 * Shipment Aggregate Root
 * Main entity that aggregates Customer, Quote, Payment, and Status
 * Following DDD Aggregate pattern and SOLID principles
 */

import { ICustomer } from './Customer';
import { IPaymentData } from './Payment';
import { IShipmentStatus, ShipmentStatusType } from './ShipmentStatus';
import { Quote } from './Quote';

export interface IShipmentAddress {
  origin: string;
  destination: string;
  originCoordinates?: { lat: number; lng: number };
  destinationCoordinates?: { lat: number; lng: number };
}

export interface IPackageDetails {
  weight: number; // in kg
  dimensions: {
    length: number; // in cm
    width: number;
    height: number;
  };
  fragile: boolean;
  description?: string;
}

export interface IShipmentData {
  id?: string;
  trackingNumber?: string;
  
  // Customer information
  customer: ICustomer;
  
  // Shipment details
  address: IShipmentAddress;
  package: IPackageDetails;
  pickupDate: Date;
  
  // Selected quote
  selectedQuote: Quote;
  
  // Payment information
  payment: IPaymentData;
  
  // Status tracking
  currentStatus: ShipmentStatusType;
  statusHistory: IShipmentStatus[];
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
}

export class Shipment {
  private _id?: string;
  private _trackingNumber: string;
  private _customer: ICustomer;
  private _address: IShipmentAddress;
  private _package: IPackageDetails;
  private _pickupDate: Date;
  private _selectedQuote: Quote;
  private _payment: IPaymentData;
  private _currentStatus: ShipmentStatusType;
  private _statusHistory: IShipmentStatus[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _estimatedDeliveryDate?: Date;
  private _actualDeliveryDate?: Date;
  private _notes?: string;

  constructor(data: IShipmentData) {
    this.validateShipment(data);
    
    this._id = data.id;
    this._trackingNumber = data.trackingNumber || this.generateTrackingNumber();
    this._customer = data.customer;
    this._address = data.address;
    this._package = data.package;
    this._pickupDate = data.pickupDate;
    this._selectedQuote = data.selectedQuote;
    this._payment = data.payment;
    this._currentStatus = data.currentStatus;
    this._statusHistory = data.statusHistory;
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();
    this._estimatedDeliveryDate = data.estimatedDeliveryDate;
    this._actualDeliveryDate = data.actualDeliveryDate;
    this._notes = data.notes;
  }

  // Getters
  get id(): string | undefined { return this._id; }
  get trackingNumber(): string { return this._trackingNumber; }
  get customer(): ICustomer { return this._customer; }
  get address(): IShipmentAddress { return this._address; }
  get package(): IPackageDetails { return this._package; }
  get pickupDate(): Date { return this._pickupDate; }
  get selectedQuote(): Quote { return this._selectedQuote; }
  get payment(): IPaymentData { return this._payment; }
  get currentStatus(): ShipmentStatusType { return this._currentStatus; }
  get statusHistory(): IShipmentStatus[] { return this._statusHistory; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get estimatedDeliveryDate(): Date | undefined { return this._estimatedDeliveryDate; }
  get actualDeliveryDate(): Date | undefined { return this._actualDeliveryDate; }
  get notes(): string | undefined { return this._notes; }

  /**
   * Validate shipment data
   */
  private validateShipment(data: IShipmentData): void {
    if (!data.customer) {
      throw new Error('Customer information is required');
    }

    if (!data.address.origin || !data.address.destination) {
      throw new Error('Origin and destination addresses are required');
    }

    if (!data.package || data.package.weight <= 0) {
      throw new Error('Valid package weight is required');
    }

    if (!data.selectedQuote) {
      throw new Error('A quote must be selected');
    }

    if (!data.payment) {
      throw new Error('Payment information is required');
    }

    const pickupDate = new Date(data.pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (pickupDate < today) {
      throw new Error('Pickup date cannot be in the past');
    }
  }

  /**
   * Generate unique tracking number
   * Format: LOG-YYYYMMDD-XXXX (LOG + Date + Random)
   * NOSONAR: Math.random() is safe here - tracking numbers are PUBLIC identifiers
   * Security: NOT used for authentication, authorization, or access control
   */
  private generateTrackingNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // NOSONAR
    
    return `LOG-${year}${month}${day}-${random}`;
  }

  /**
   * Update shipment status with validation
   * Implements business rules for status transitions
   */
  updateStatus(
    newStatus: ShipmentStatusType,
    notes?: string,
    location?: string,
    updatedBy?: string
  ): void {
    // Import is needed but avoiding circular dependency
    const ShipmentStatus = require('./ShipmentStatus').ShipmentStatus;
    
    // Validate transition
    if (!ShipmentStatus.canTransition(this._currentStatus, newStatus)) {
      throw new Error(
        `Invalid status transition from ${this._currentStatus} to ${newStatus}`
      );
    }

    // Add to history
    this._statusHistory.push({
      status: this._currentStatus,
      timestamp: new Date(),
      notes,
      location,
      updatedBy,
    });

    // Update current status
    this._currentStatus = newStatus;
    this._updatedAt = new Date();

    // If delivered, set actual delivery date
    if (newStatus === 'DELIVERED') {
      this._actualDeliveryDate = new Date();
    }
  }

  /**
   * Calculate estimated delivery date based on quote
   */
  calculateEstimatedDelivery(): Date {
    const estimatedDays = this._selectedQuote.estimatedDays || this._selectedQuote.minDays;
    const deliveryDate = new Date(this._pickupDate);
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
    
    this._estimatedDeliveryDate = deliveryDate;
    return deliveryDate;
  }

  /**
   * Check if shipment is delayed
   */
  isDelayed(): boolean {
    if (!this._estimatedDeliveryDate || this._actualDeliveryDate) {
      return false;
    }

    return new Date() > this._estimatedDeliveryDate && !this.isDelivered();
  }

  /**
   * Check if shipment is delivered
   */
  isDelivered(): boolean {
    return this._currentStatus === 'DELIVERED';
  }

  /**
   * Check if shipment can be cancelled
   */
  canBeCancelled(): boolean {
    return !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(this._currentStatus);
  }

  /**
   * Get total cost including payment amount
   */
  getTotalCost(): number {
    return this._payment.amount;
  }

  /**
   * Get provider name from selected quote
   */
  getProviderName(): string {
    return this._selectedQuote.providerName;
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): IShipmentData {
    return {
      id: this._id,
      trackingNumber: this._trackingNumber,
      customer: this._customer,
      address: this._address,
      package: this._package,
      pickupDate: this._pickupDate,
      selectedQuote: this._selectedQuote,
      payment: this._payment,
      currentStatus: this._currentStatus,
      statusHistory: this._statusHistory,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      estimatedDeliveryDate: this._estimatedDeliveryDate,
      actualDeliveryDate: this._actualDeliveryDate,
      notes: this._notes,
    };
  }

  /**
   * Get shipment summary for display
   */
  getSummary(): {
    trackingNumber: string;
    customer: string;
    route: string;
    provider: string;
    status: string;
    cost: number;
  } {
    return {
      trackingNumber: this._trackingNumber,
      customer: this._customer.name,
      route: `${this._address.origin} → ${this._address.destination}`,
      provider: this.getProviderName(),
      status: this._currentStatus,
      cost: this.getTotalCost(),
    };
  }
}
