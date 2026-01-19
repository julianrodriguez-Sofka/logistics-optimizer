/**
 * API Service with Circuit Breaker Pattern
 * Implements:
 * - Circuit Breaker Pattern (prevents cascading failures)
 * - Retry Pattern with Exponential Backoff
 * - Request Deduplication
 * - Error Normalization
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Each class handles one concern
 * - Open/Closed: Extensible without modification
 * - Dependency Inversion: Depends on abstractions
 */

import { API } from '../utils/constants';

// Types
export interface ApiError {
  message: string;
  code: string;
  status?: number;
  retryable: boolean;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

// Circuit Breaker States
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit Breaker Implementation
 * Prevents cascading failures by stopping requests to failing services
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;
  private readonly successThreshold: number;

  constructor(
    failureThreshold: number = 5,
    recoveryTimeout: number = 30000,
    successThreshold: number = 2
  ) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.successThreshold = successThreshold;
  }

  canRequest(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      // Check if recovery timeout has passed
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        console.log('🔄 Circuit Breaker: Transitioning to HALF_OPEN');
        return true;
      }
      return false;
    }

    // HALF_OPEN: Allow limited requests
    return true;
  }

  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        console.log('✅ Circuit Breaker: Service recovered, CLOSED');
      }
    } else {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      console.log('❌ Circuit Breaker: Failed in HALF_OPEN, back to OPEN');
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log(`❌ Circuit Breaker: Threshold reached (${this.failureCount}), OPEN`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}

/**
 * Request Deduplication
 * Prevents duplicate in-flight requests
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if there's already a pending request with this key
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`🔄 Request deduplicated: ${key}`);
      return pending as Promise<T>;
    }

    // Create new request and store it
    const request = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

/**
 * API Service
 * Central service for all API calls with error handling
 */
class ApiService {
  private baseUrl: string;
  private circuitBreaker: CircuitBreaker;
  private deduplicator: RequestDeduplicator;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || API.DEFAULT_BASE_URL;
    this.circuitBreaker = new CircuitBreaker(5, 30000, 2);
    this.deduplicator = new RequestDeduplicator();
    this.defaultTimeout = API.DEFAULT_TIMEOUT;
  }

  /**
   * Normalize errors to consistent format
   */
  private normalizeError(error: unknown): ApiError {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          message: 'La solicitud tardó demasiado. Por favor, intente de nuevo.',
          code: 'TIMEOUT',
          retryable: true,
        };
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        return {
          message: 'Error de conexión. Verifique su conexión a internet.',
          code: 'NETWORK_ERROR',
          retryable: true,
        };
      }

      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        retryable: false,
      };
    }

    return {
      message: 'Ha ocurrido un error inesperado',
      code: 'UNKNOWN_ERROR',
      retryable: false,
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   */
  private getBackoffDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Make HTTP request with retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    config: RequestConfig = {}
  ): Promise<T> {
    const { retries = 3, retryDelay = 1000, timeout = this.defaultTimeout } = config;

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      // Check circuit breaker
      if (!this.circuitBreaker.canRequest()) {
        throw new Error('Servicio temporalmente no disponible. Intente en unos momentos.');
      }

      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: config.signal || controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error: ApiError = {
            message: errorData.error || errorData.message || `HTTP ${response.status}`,
            code: `HTTP_${response.status}`,
            status: response.status,
            retryable: response.status >= 500 || response.status === 429,
          };

          if (!error.retryable || attempt === retries) {
            this.circuitBreaker.recordFailure();
            throw new Error(error.message);
          }

          lastError = error;
          const delay = this.getBackoffDelay(attempt, retryDelay);
          console.log(`⏳ Retry ${attempt + 1}/${retries} in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        // Success
        this.circuitBreaker.recordSuccess();
        return await response.json();
      } catch (error) {
        const normalizedError = this.normalizeError(error);
        lastError = normalizedError;

        // Don't retry non-retryable errors
        if (!normalizedError.retryable || attempt === retries) {
          this.circuitBreaker.recordFailure();
          throw new Error(normalizedError.message);
        }

        const delay = this.getBackoffDelay(attempt, retryDelay);
        console.log(`⏳ Retry ${attempt + 1}/${retries} in ${delay}ms... (${normalizedError.code})`);
        await this.sleep(delay);
      }
    }

    throw new Error(lastError?.message || 'Request failed after all retries');
  }

  /**
   * POST request with deduplication
   */
  async post<T>(
    endpoint: string,
    data: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestKey = `POST:${endpoint}:${JSON.stringify(data)}`;

    return this.deduplicator.deduplicate(requestKey, () =>
      this.fetchWithRetry<T>(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }, config)
    );
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string>,
    config?: RequestConfig
  ): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    return this.fetchWithRetry<T>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, config);
  }

  /**
   * Reset circuit breaker (for testing or manual recovery)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    this.deduplicator.clear();
  }

  /**
   * Get circuit breaker state (for debugging/monitoring)
   */
  getCircuitState(): string {
    return this.circuitBreaker.getState();
  }
}

// Singleton instance
export const apiService = new ApiService();

export default apiService;
