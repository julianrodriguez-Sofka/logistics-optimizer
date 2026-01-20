/**
 * RabbitMQ Connection Manager
 * Singleton pattern for managing RabbitMQ connection
 * Following SOLID principles - Single Responsibility
 */

import amqp from 'amqplib';
import type { Channel, ChannelModel } from 'amqplib';
import { Logger } from '../logging/Logger';

export class RabbitMQConnection {
  private static instance: RabbitMQConnection;
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private logger = Logger.getInstance();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;

  private constructor() {}

  static getInstance(): RabbitMQConnection {
    if (!RabbitMQConnection.instance) {
      RabbitMQConnection.instance = new RabbitMQConnection();
    }
    return RabbitMQConnection.instance;
  }

  /**
   * Connect to RabbitMQ
   */
  async connect(url: string = process.env.RABBITMQ_URL || 'amqp://localhost'): Promise<void> {
    if (this.isConnecting) {
      this.logger.info('RabbitMQ connection already in progress');
      return;
    }

    if (this.connection) {
      this.logger.info('RabbitMQ already connected');
      return;
    }

    try {
      this.isConnecting = true;
      this.logger.info('🐰 Connecting to RabbitMQ...', { url });

      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Set prefetch to process one message at a time
      await this.channel.prefetch(1);

      this.logger.info('✅ RabbitMQ connected successfully');

      // Handle connection events
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', { error: err.message });
        this.handleDisconnect();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.handleDisconnect();
      });

      this.isConnecting = false;
    } catch (error: any) {
      this.isConnecting = false;
      this.logger.error('Failed to connect to RabbitMQ', { error: error.message });
      this.scheduleReconnect(url);
      throw error;
    }
  }

  /**
   * Handle disconnection and attempt reconnection
   */
  private handleDisconnect(): void {
    this.connection = null;
    this.channel = null;

    if (!this.reconnectInterval) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(url?: string): void {
    if (this.reconnectInterval) return;

    this.logger.info('Scheduling RabbitMQ reconnection in 5 seconds...');
    this.reconnectInterval = setTimeout(async () => {
      this.reconnectInterval = null;
      try {
        await this.connect(url);
      } catch (error) {
        // Will schedule another reconnect
      }
    }, 5000);
  }

  /**
   * Get current channel
   */
  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized. Call connect() first.');
    }
    return this.channel;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  /**
   * Close connection gracefully
   */
  async close(): Promise<void> {
    try {
      if (this.reconnectInterval) {
        clearTimeout(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.logger.info('RabbitMQ connection closed');
    } catch (error: any) {
      this.logger.error('Error closing RabbitMQ connection', { error: error.message });
    }
  }

  /**
   * Assert queue exists (create if not)
   */
  async assertQueue(queueName: string, options?: amqp.Options.AssertQueue): Promise<void> {
    const channel = this.getChannel();
    await channel.assertQueue(queueName, {
      durable: true, // Survive broker restart
      ...options,
    });
    this.logger.info(`Queue asserted: ${queueName}`);
  }

  /**
   * Publish message to queue
   */
  async publishToQueue(queueName: string, message: any): Promise<boolean> {
    try {
      const channel = this.getChannel();
      const buffer = Buffer.from(JSON.stringify(message));
      
      const sent = channel.sendToQueue(queueName, buffer, {
        persistent: true, // Save to disk
      });

      if (sent) {
        this.logger.debug(`Message published to queue: ${queueName}`, { 
          messageId: message.id || 'unknown' 
        });
      } else {
        this.logger.warn(`Message buffer full for queue: ${queueName}`);
      }

      return sent;
    } catch (error: any) {
      this.logger.error('Error publishing message', { 
        queue: queueName, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Consume messages from queue
   */
  async consumeQueue(
    queueName: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    const channel = this.getChannel();

    await channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        this.logger.debug(`Processing message from queue: ${queueName}`, {
          messageId: content.id || 'unknown',
        });

        await handler(content);

        // Acknowledge message
        channel.ack(msg);
        this.logger.debug(`Message acknowledged from queue: ${queueName}`);
      } catch (error: any) {
        this.logger.error('Error processing message', {
          queue: queueName,
          error: error.message,
        });

        // Reject and requeue message (will be retried)
        channel.nack(msg, false, true);
      }
    });

    this.logger.info(`Consumer started for queue: ${queueName}`);
  }

  /**
   * Purge queue (delete all messages)
   */
  async purgeQueue(queueName: string): Promise<void> {
    const channel = this.getChannel();
    await channel.purgeQueue(queueName);
    this.logger.info(`Queue purged: ${queueName}`);
  }
}
