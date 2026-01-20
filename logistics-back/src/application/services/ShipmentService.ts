/**
 * Shipment Service
 * Core business logic for shipment management
 * Integrates Repository, MessageQueue, and WebSocket
 * Following SOLID principles and Clean Architecture
 */

import { Shipment, IShipmentData } from '../../domain/entities/Shipment';
import { Customer, ICustomer } from '../../domain/entities/Customer';
import { ShipmentStatusType } from '../../domain/entities/ShipmentStatus';
import { IShipmentRepository, ICustomerRepository } from '../../domain/interfaces/IRepositories';
import { Logger } from '../../infrastructure/logging/Logger';
import { MessageQueueService } from '../../infrastructure/messaging/MessageQueueService';
import { WebSocketService } from '../../infrastructure/websocket/WebSocketService';
import { PaymentService, PaymentRequest } from './PaymentService';

export interface CreateShipmentRequest {
  customer: ICustomer;
  address: {
    origin: string;
    destination: string;
    originCoordinates?: { lat: number; lng: number };
    destinationCoordinates?: { lat: number; lng: number };
  };
  package: {
    weight: number;
    dimensions: { length: number; width: number; height: number };
    fragile: boolean;
    description?: string;
  };
  pickupDate: Date;
  selectedQuote: any; // Quote from quote service
  paymentRequest: PaymentRequest;
}

export class ShipmentService {
  private logger = Logger.getInstance();
  private messageQueue = MessageQueueService.getInstance();
  private webSocket = WebSocketService.getInstance();
  private paymentService: PaymentService;

  constructor(
    private shipmentRepository: IShipmentRepository,
    private customerRepository: ICustomerRepository
  ) {
    this.paymentService = new PaymentService();
  }

  /**
   * Create new shipment with payment processing
   */
  async createShipment(request: CreateShipmentRequest): Promise<IShipmentData> {
    try {
      this.logger.info('Creating new shipment', {
        origin: request.address.origin,
        destination: request.address.destination,
      });

      // Step 1: Create or get customer
      let customer = await this.customerRepository.findByEmail(request.customer.email);
      
      if (!customer) {
        const customerEntity = new Customer(request.customer);
        customer = await this.customerRepository.create(customerEntity.toJSON());
        this.logger.info('New customer created', { customerId: customer.id });
      }

      // Step 2: Process payment
      const payment = await this.paymentService.processPayment(
        request.paymentRequest,
        'temp-id' // Will be updated with actual shipment ID
      );

      // Step 3: Determine initial status based on payment
      let initialStatus: ShipmentStatusType;
      if (payment.status === 'COMPLETED') {
        initialStatus = 'PAYMENT_CONFIRMED';
      } else if (payment.status === 'PENDING') {
        initialStatus = 'PENDING_PAYMENT';
      } else {
        throw new Error(`Cannot create shipment with payment status: ${payment.status}`);
      }

      // Step 4: Create shipment
      // For MongoDB, we need to pass just the customer ID in the repository layer
      const shipmentData: IShipmentData = {
        customer: customer,
        address: request.address,
        package: request.package,
        pickupDate: request.pickupDate,
        selectedQuote: request.selectedQuote,
        payment: payment.toJSON(),
        currentStatus: initialStatus,
        statusHistory: [],
      };

      const shipmentEntity = new Shipment(shipmentData);
      shipmentEntity.calculateEstimatedDelivery();

      // For MongoDB, pass customer ID instead of full object
      const shipmentToSave = {
        ...shipmentEntity.toJSON(),
        customer: customer.id // Use customer ID for MongoDB ObjectId reference
      };

      const createdShipment = await this.shipmentRepository.create(shipmentToSave as unknown as IShipmentData);

      this.logger.info('Shipment created successfully', {
        shipmentId: createdShipment.id,
        trackingNumber: createdShipment.trackingNumber,
      });

      // Step 5: Publish events
      await this.publishShipmentCreatedEvents(createdShipment);

      // Step 6: Emit WebSocket event
      this.webSocket.emitShipmentCreated(createdShipment);

      return createdShipment;
    } catch (error: any) {
      this.logger.error('Error creating shipment', { error: error.message });
      throw error;
    }
  }

  /**
   * Get shipment by ID
   */
  async getShipmentById(id: string): Promise<IShipmentData | null> {
    try {
      return await this.shipmentRepository.findById(id);
    } catch (error: any) {
      this.logger.error('Error getting shipment by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Get shipment by tracking number
   */
  async getShipmentByTrackingNumber(trackingNumber: string): Promise<IShipmentData | null> {
    try {
      return await this.shipmentRepository.findByTrackingNumber(trackingNumber);
    } catch (error: any) {
      this.logger.error('Error getting shipment by tracking number', { 
        trackingNumber, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get all shipments with pagination
   */
  async getAllShipments(page: number = 1, limit: number = 20): Promise<{
    shipments: IShipmentData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const [shipments, total] = await Promise.all([
        this.shipmentRepository.findAll(page, limit),
        this.shipmentRepository.count(),
      ]);

      return {
        shipments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      this.logger.error('Error getting all shipments', { error: error.message });
      throw error;
    }
  }

  /**
   * Get shipments by status
   */
  async getShipmentsByStatus(
    status: ShipmentStatusType,
    page: number = 1,
    limit: number = 20
  ): Promise<IShipmentData[]> {
    try {
      return await this.shipmentRepository.findByStatus(status, page, limit);
    } catch (error: any) {
      this.logger.error('Error getting shipments by status', { 
        status, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get shipments by customer
   */
  async getShipmentsByCustomer(
    customerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<IShipmentData[]> {
    try {
      return await this.shipmentRepository.findByCustomer(customerId, page, limit);
    } catch (error: any) {
      this.logger.error('Error getting shipments by customer', { 
        customerId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(
    id: string,
    newStatus: ShipmentStatusType,
    notes?: string
  ): Promise<IShipmentData> {
    try {
      this.logger.info('Updating shipment status', { shipmentId: id, newStatus });

      // Get current shipment
      const shipment = await this.shipmentRepository.findById(id);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      const oldStatus = shipment.currentStatus;

      // Update status
      const updated = await this.shipmentRepository.updateStatus(id, newStatus, notes);
      if (!updated) {
        throw new Error('Failed to update shipment status');
      }

      // Publish events
      await this.messageQueue.publishStatusChanged({
        id: this.generateEventId(),
        shipmentId: id,
        trackingNumber: shipment.trackingNumber!,
        oldStatus,
        newStatus,
        notes,
        timestamp: new Date(),
      });

      // Emit WebSocket event
      this.webSocket.emitStatusChanged(
        shipment.trackingNumber!,
        oldStatus,
        newStatus,
        notes
      );

      this.logger.info('Shipment status updated successfully', {
        shipmentId: id,
        oldStatus,
        newStatus,
      });

      return updated;
    } catch (error: any) {
      this.logger.error('Error updating shipment status', { 
        shipmentId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Search shipments
   */
  async searchShipments(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<IShipmentData[]> {
    try {
      return await this.shipmentRepository.search(query, page, limit);
    } catch (error: any) {
      this.logger.error('Error searching shipments', { query, error: error.message });
      throw error;
    }
  }

  /**
   * Get shipment statistics
   */
  async getStatistics(): Promise<any> {
    try {
      return await this.shipmentRepository.getStatistics();
    } catch (error: any) {
      this.logger.error('Error getting shipment statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(id: string, reason: string): Promise<IShipmentData> {
    try {
      this.logger.info('Cancelling shipment', { shipmentId: id, reason });

      const shipment = await this.shipmentRepository.findById(id);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      const shipmentEntity = new Shipment(shipment);
      if (!shipmentEntity.canBeCancelled()) {
        throw new Error('Shipment cannot be cancelled in its current state');
      }

      const updated = await this.updateShipmentStatus(id, 'CANCELLED', reason);

      this.logger.info('Shipment cancelled successfully', { shipmentId: id });
      return updated;
    } catch (error: any) {
      this.logger.error('Error cancelling shipment', { 
        shipmentId: id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Publish shipment created events
   */
  private async publishShipmentCreatedEvents(shipment: IShipmentData): Promise<void> {
    await this.messageQueue.publishShipmentCreated({
      id: this.generateEventId(),
      shipmentId: shipment.id!,
      trackingNumber: shipment.trackingNumber!,
      customerId: (shipment.customer as any).id || (shipment.customer as any)._id,
      customerEmail: shipment.customer.email,
      timestamp: new Date(),
    });

    // Send notification
    await this.messageQueue.publishNotification({
      type: 'email',
      recipient: shipment.customer.email,
      subject: `Shipment Created - ${shipment.trackingNumber}`,
      message: `Your shipment has been created successfully. Tracking number: ${shipment.trackingNumber}`,
      metadata: {
        trackingNumber: shipment.trackingNumber,
        estimatedDelivery: shipment.estimatedDeliveryDate,
      },
    });
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
