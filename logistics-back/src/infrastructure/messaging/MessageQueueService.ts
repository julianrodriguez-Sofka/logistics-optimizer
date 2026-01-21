/**
 * Message Queue Service
 * Handles shipment and payment event processing
 * Following Publisher-Subscriber pattern
 */

import { RabbitMQConnection } from './RabbitMQConnection';
import { Logger } from '../logging/Logger';

export enum QueueNames {
  SHIPMENT_CREATED = 'shipment.created',
  SHIPMENT_UPDATED = 'shipment.updated',
  PAYMENT_PROCESSING = 'payment.processing',
  PAYMENT_COMPLETED = 'payment.completed',
  STATUS_CHANGED = 'shipment.status.changed',
  NOTIFICATION = 'notification.send',
}

export interface ShipmentCreatedMessage {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  customerId: string;
  customerEmail: string;
  timestamp: Date;
}

export interface ShipmentUpdatedMessage {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  updates: Record<string, any>;
  timestamp: Date;
}

export interface PaymentProcessingMessage {
  id: string;
  shipmentId: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  timestamp: Date;
}

export interface StatusChangedMessage {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  oldStatus: string;
  newStatus: string;
  notes?: string;
  timestamp: Date;
}

export class MessageQueueService {
  private static instance: MessageQueueService;
  private rabbitMQ: RabbitMQConnection;
  private logger = Logger.getInstance();
  private initialized = false;

  private constructor() {
    this.rabbitMQ = RabbitMQConnection.getInstance();
  }

  static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService();
    }
    return MessageQueueService.instance;
  }

  /**
   * Initialize all queues
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.info('Message Queue Service already initialized');
      return;
    }

    try {
      this.logger.info('📨 Initializing Message Queue Service...');

      // Assert all queues
      await this.rabbitMQ.assertQueue(QueueNames.SHIPMENT_CREATED);
      await this.rabbitMQ.assertQueue(QueueNames.SHIPMENT_UPDATED);
      await this.rabbitMQ.assertQueue(QueueNames.PAYMENT_PROCESSING);
      await this.rabbitMQ.assertQueue(QueueNames.PAYMENT_COMPLETED);
      await this.rabbitMQ.assertQueue(QueueNames.STATUS_CHANGED);
      await this.rabbitMQ.assertQueue(QueueNames.NOTIFICATION);

      this.initialized = true;
      this.logger.info('✅ Message Queue Service initialized');
    } catch (error: any) {
      this.logger.error('Failed to initialize Message Queue Service', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Publish shipment created event
   */
  async publishShipmentCreated(message: ShipmentCreatedMessage): Promise<boolean> {
    try {
      return await this.rabbitMQ.publishToQueue(QueueNames.SHIPMENT_CREATED, {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('Error publishing shipment created event', { error: error.message });
      return false;
    }
  }

  /**
   * Publish shipment updated event
   */
  async publishShipmentUpdated(message: ShipmentUpdatedMessage): Promise<boolean> {
    try {
      return await this.rabbitMQ.publishToQueue(QueueNames.SHIPMENT_UPDATED, {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('Error publishing shipment updated event', { error: error.message });
      return false;
    }
  }

  /**
   * Publish payment processing event
   */
  async publishPaymentProcessing(message: PaymentProcessingMessage): Promise<boolean> {
    try {
      return await this.rabbitMQ.publishToQueue(QueueNames.PAYMENT_PROCESSING, {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('Error publishing payment processing event', { error: error.message });
      return false;
    }
  }

  /**
   * Publish payment completed event
   */
  async publishPaymentCompleted(message: PaymentProcessingMessage): Promise<boolean> {
    try {
      return await this.rabbitMQ.publishToQueue(QueueNames.PAYMENT_COMPLETED, {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('Error publishing payment completed event', { error: error.message });
      return false;
    }
  }

  /**
   * Publish status changed event
   */
  async publishStatusChanged(message: StatusChangedMessage): Promise<boolean> {
    try {
      return await this.rabbitMQ.publishToQueue(QueueNames.STATUS_CHANGED, {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('Error publishing status changed event', { error: error.message });
      return false;
    }
  }

  /**
   * Publish notification event
   */
  async publishNotification(message: {
    type: 'email' | 'sms';
    recipient: string;
    subject?: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      return await this.rabbitMQ.publishToQueue(QueueNames.NOTIFICATION, {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('Error publishing notification event', { error: error.message });
      return false;
    }
  }

  /**
   * Start consuming messages (for workers)
   */
  async startConsumers(handlers: {
    onShipmentCreated?: (msg: ShipmentCreatedMessage) => Promise<void>;
    onShipmentUpdated?: (msg: ShipmentUpdatedMessage) => Promise<void>;
    onPaymentProcessing?: (msg: PaymentProcessingMessage) => Promise<void>;
    onPaymentCompleted?: (msg: PaymentProcessingMessage) => Promise<void>;
    onStatusChanged?: (msg: StatusChangedMessage) => Promise<void>;
    onNotification?: (msg: any) => Promise<void>;
  }): Promise<void> {
    this.logger.info('Starting message consumers...');

    if (handlers.onShipmentCreated) {
      await this.rabbitMQ.consumeQueue(
        QueueNames.SHIPMENT_CREATED,
        handlers.onShipmentCreated
      );
    }

    if (handlers.onShipmentUpdated) {
      await this.rabbitMQ.consumeQueue(
        QueueNames.SHIPMENT_UPDATED,
        handlers.onShipmentUpdated
      );
    }

    if (handlers.onPaymentProcessing) {
      await this.rabbitMQ.consumeQueue(
        QueueNames.PAYMENT_PROCESSING,
        handlers.onPaymentProcessing
      );
    }

    if (handlers.onPaymentCompleted) {
      await this.rabbitMQ.consumeQueue(
        QueueNames.PAYMENT_COMPLETED,
        handlers.onPaymentCompleted
      );
    }

    if (handlers.onStatusChanged) {
      await this.rabbitMQ.consumeQueue(
        QueueNames.STATUS_CHANGED,
        handlers.onStatusChanged
      );
    }

    if (handlers.onNotification) {
      await this.rabbitMQ.consumeQueue(
        QueueNames.NOTIFICATION,
        handlers.onNotification
      );
    }

    this.logger.info('✅ All message consumers started');
  }

  /**
   * Generate unique message ID
   * NOSONAR: Math.random() is safe here - only used for non-cryptographic message tracking IDs
   * Security: This is NOT used for authentication, tokens, or security-sensitive operations
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // NOSONAR
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && this.rabbitMQ.isConnected();
  }
}
