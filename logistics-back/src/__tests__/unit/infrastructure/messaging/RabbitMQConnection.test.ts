/**
 * RabbitMQConnection Unit Tests
 * Tests connection management, reconnection, and message operations
 */

import { RabbitMQConnection } from '../../../../infrastructure/messaging/RabbitMQConnection';
import amqp from 'amqplib';

// Mock amqplib with factory pattern to avoid hoisting issues
let mockChannel: any;
let mockConnection: any;

jest.mock('amqplib', () => ({
  connect: jest.fn(async () => {
    mockChannel = {
      prefetch: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
      sendToQueue: jest.fn().mockReturnValue(true),
      consume: jest.fn().mockResolvedValue({ consumerTag: 'consumer-1' }),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
      purgeQueue: jest.fn().mockResolvedValue({ messageCount: 0 }),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    return mockConnection;
  }),
}));

jest.mock('../../../../infrastructure/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

describe('RabbitMQConnection', () => {
  let connection: RabbitMQConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset singleton instance
    (RabbitMQConnection as any).instance = null;
    connection = RabbitMQConnection.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RabbitMQConnection.getInstance();
      const instance2 = RabbitMQConnection.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    it('should establish connection successfully', async () => {
      await connection.connect('amqp://localhost');

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost');
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.prefetch).toHaveBeenCalledWith(1);
      expect(connection.isConnected()).toBe(true);
    });

    it('should use default URL from env if not provided', async () => {
      process.env.RABBITMQ_URL = 'amqp://env-url';
      
      await connection.connect();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://env-url');
    });

    it('should use fallback URL if no env variable', async () => {
      delete process.env.RABBITMQ_URL;
      
      await connection.connect();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost');
    });

    it('should not connect if already connected', async () => {
      await connection.connect('amqp://localhost');
      jest.clearAllMocks();

      await connection.connect('amqp://localhost');

      expect(amqp.connect).not.toHaveBeenCalled();
    });

    it('should not connect if connection in progress', async () => {
      const connectPromise = connection.connect('amqp://localhost');
      const secondConnect = connection.connect('amqp://localhost');

      await connectPromise;
      await secondConnect;

      expect(amqp.connect).toHaveBeenCalledTimes(1);
    });

    it('should setup error event handler', async () => {
      await connection.connect('amqp://localhost');

      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should setup close event handler', async () => {
      await connection.connect('amqp://localhost');

      expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should handle connection failure', async () => {
      (amqp.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

      await expect(connection.connect('amqp://localhost')).rejects.toThrow('Connection refused');
      expect(connection.isConnected()).toBe(false);
    });
  });

  describe('handleDisconnect', () => {
    it('should clear connection and channel on disconnect', async () => {
      await connection.connect('amqp://localhost');
      
      const errorHandler = (mockConnection.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      )[1];
      
      errorHandler(new Error('Connection lost'));

      expect(connection.isConnected()).toBe(false);
    });
  });

  describe('getChannel', () => {
    it('should return channel when connected', async () => {
      await connection.connect('amqp://localhost');

      const channel = connection.getChannel();

      expect(channel).toBe(mockChannel);
    });

    it('should throw error when not connected', () => {
      expect(() => connection.getChannel()).toThrow(
        'RabbitMQ channel not initialized. Call connect() first.'
      );
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', async () => {
      await connection.connect('amqp://localhost');

      expect(connection.isConnected()).toBe(true);
    });

    it('should return false when not connected', () => {
      expect(connection.isConnected()).toBe(false);
    });
  });

  describe('close', () => {
    it('should close channel and connection gracefully', async () => {
      await connection.connect('amqp://localhost');

      await connection.close();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(connection.isConnected()).toBe(false);
    });

    it('should handle close errors gracefully', async () => {
      await connection.connect('amqp://localhost');
      mockChannel.close.mockRejectedValueOnce(new Error('Close failed'));

      await expect(connection.close()).resolves.not.toThrow();
    });

    it('should handle closing when not connected', async () => {
      await expect(connection.close()).resolves.not.toThrow();
    });
  });

  describe('assertQueue', () => {
    it('should create queue with durable option', async () => {
      await connection.connect('amqp://localhost');

      await connection.assertQueue('test-queue');

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test-queue', {
        durable: true,
      });
    });

    it('should merge custom options with defaults', async () => {
      await connection.connect('amqp://localhost');

      await connection.assertQueue('test-queue', { exclusive: true });

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test-queue', {
        durable: true,
        exclusive: true,
      });
    });

    it('should throw error if not connected', async () => {
      await expect(connection.assertQueue('test-queue')).rejects.toThrow(
        'RabbitMQ channel not initialized'
      );
    });
  });

  describe('publishToQueue', () => {
    it('should publish message successfully', async () => {
      await connection.connect('amqp://localhost');
      const message = { id: 'msg-1', data: 'test' };

      const result = await connection.publishToQueue('test-queue', message);

      expect(result).toBe(true);
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test-queue',
        expect.any(Buffer),
        { persistent: true }
      );
    });

    it('should serialize message to JSON', async () => {
      await connection.connect('amqp://localhost');
      const message = { id: 'msg-1', data: 'test' };

      await connection.publishToQueue('test-queue', message);

      const buffer = (mockChannel.sendToQueue as jest.Mock).mock.calls[0][1];
      expect(JSON.parse(buffer.toString())).toEqual(message);
    });

    it('should return false when buffer is full', async () => {
      await connection.connect('amqp://localhost');
      mockChannel.sendToQueue.mockReturnValueOnce(false);

      const result = await connection.publishToQueue('test-queue', { data: 'test' });

      expect(result).toBe(false);
    });

    it('should throw error on publish failure', async () => {
      await connection.connect('amqp://localhost');
      mockChannel.sendToQueue.mockImplementationOnce(() => {
        throw new Error('Publish failed');
      });

      await expect(
        connection.publishToQueue('test-queue', { data: 'test' })
      ).rejects.toThrow('Publish failed');
    });

    it('should throw error if not connected', async () => {
      await expect(
        connection.publishToQueue('test-queue', {})
      ).rejects.toThrow('RabbitMQ channel not initialized');
    });
  });

  describe('consumeQueue', () => {
    it('should setup consumer successfully', async () => {
      await connection.connect('amqp://localhost');
      const handler = jest.fn().mockResolvedValue(undefined);

      await connection.consumeQueue('test-queue', handler);

      expect(mockChannel.consume).toHaveBeenCalledWith('test-queue', expect.any(Function));
    });

    it('should process messages and acknowledge', async () => {
      await connection.connect('amqp://localhost');
      const handler = jest.fn().mockResolvedValue(undefined);
      const mockMessage = {
        content: Buffer.from(JSON.stringify({ id: 'msg-1', data: 'test' })),
      };

      await connection.consumeQueue('test-queue', handler);

      const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(handler).toHaveBeenCalledWith({ id: 'msg-1', data: 'test' });
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle null messages', async () => {
      await connection.connect('amqp://localhost');
      const handler = jest.fn();

      await connection.consumeQueue('test-queue', handler);

      const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
      await consumeCallback(null);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should nack and requeue on handler error', async () => {
      await connection.connect('amqp://localhost');
      const handler = jest.fn().mockRejectedValue(new Error('Handler failed'));
      const mockMessage = {
        content: Buffer.from(JSON.stringify({ id: 'msg-1' })),
      };

      await connection.consumeQueue('test-queue', handler);

      const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });

    it('should handle JSON parse errors', async () => {
      await connection.connect('amqp://localhost');
      const handler = jest.fn();
      const mockMessage = {
        content: Buffer.from('invalid json'),
      };

      await connection.consumeQueue('test-queue', handler);

      const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(handler).not.toHaveBeenCalled();
      expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true);
    });
  });

  describe('purgeQueue', () => {
    it('should purge queue successfully', async () => {
      await connection.connect('amqp://localhost');

      await connection.purgeQueue('test-queue');

      expect(mockChannel.purgeQueue).toHaveBeenCalledWith('test-queue');
    });

    it('should throw error if not connected', async () => {
      await expect(connection.purgeQueue('test-queue')).rejects.toThrow(
        'RabbitMQ channel not initialized'
      );
    });
  });
});
