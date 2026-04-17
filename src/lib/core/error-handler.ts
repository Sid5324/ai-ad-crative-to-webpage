// src/lib/core/error-handler.ts - Advanced Error Handling System
export interface ErrorContext {
  operation: string;
  stage: string;
  input?: any;
  metadata?: Record<string, any>;
  timestamp: number;
  traceId: string;
}

export interface ErrorRecovery {
  strategy: 'retry' | 'fallback' | 'skip' | 'fail';
  maxRetries?: number;
  backoffMs?: number;
  fallbackValue?: any;
  condition?: (error: Error, context: ErrorContext) => boolean;
}

export class ErrorHandler {
  private recoveries: Map<string, ErrorRecovery> = new Map();
  private errorHistory: ErrorContext[] = [];
  private maxHistory = 100;

  constructor() {
    this.initializeDefaultRecoveries();
  }

  registerRecovery(operation: string, recovery: ErrorRecovery): void {
    this.recovery.set(operation, recovery);
  }

  async handleError(
    error: Error,
    context: ErrorContext,
    customRecovery?: ErrorRecovery
  ): Promise<{ shouldRetry: boolean; fallbackValue?: any; finalError?: Error }> {
    // Log error
    this.logError(error, context);

    // Get recovery strategy
    const recovery = customRecovery || this.recoveries.get(context.operation);

    if (!recovery) {
      return { shouldRetry: false, finalError: error };
    }

    // Check if recovery condition is met
    if (recovery.condition && !recovery.condition(error, context)) {
      return { shouldRetry: false, finalError: error };
    }

    // Execute recovery strategy
    switch (recovery.strategy) {
      case 'retry':
        return await this.handleRetry(error, context, recovery);

      case 'fallback':
        return { shouldRetry: false, fallbackValue: recovery.fallbackValue };

      case 'skip':
        console.warn(`[${context.traceId}] Skipping operation ${context.operation} due to error: ${error.message}`);
        return { shouldRetry: false };

      case 'fail':
      default:
        return { shouldRetry: false, finalError: error };
    }
  }

  private async handleRetry(
    error: Error,
    context: ErrorContext,
    recovery: ErrorRecovery
  ): Promise<{ shouldRetry: boolean; fallbackValue?: any; finalError?: Error }> {
    const retryCount = context.metadata?.retryCount || 0;

    if (recovery.maxRetries && retryCount >= recovery.maxRetries) {
      console.error(`[${context.traceId}] Max retries exceeded for ${context.operation}`);
      return { shouldRetry: false, finalError: error };
    }

    // Calculate backoff delay
    const delay = recovery.backoffMs ? recovery.backoffMs * Math.pow(2, retryCount) : 0;

    if (delay > 0) {
      console.log(`[${context.traceId}] Retrying ${context.operation} in ${delay}ms (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return { shouldRetry: true };
  }

  private logError(error: Error, context: ErrorContext): void {
    console.error(`[${context.traceId}] ❌ Error in ${context.operation} at stage ${context.stage}:`, {
      message: error.message,
      stack: error.stack,
      context: {
        operation: context.operation,
        stage: context.stage,
        timestamp: context.timestamp,
        metadata: context.metadata
      }
    });

    // Store in history
    this.errorHistory.push(context);
    if (this.errorHistory.length > this.maxHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistory);
    }
  }

  private initializeDefaultRecoveries(): void {
    // Vision API failures
    this.registerRecovery('vision-analysis', {
      strategy: 'retry',
      maxRetries: 3,
      backoffMs: 1000,
      condition: (error) => error.message.includes('quota') || error.message.includes('unavailable')
    });

    // Content generation failures
    this.registerRecovery('content-generation', {
      strategy: 'fallback',
      fallbackValue: {
        headline: 'Premium Services',
        subheadline: 'Experience quality solutions tailored to your needs',
        personalityTone: 'minimal'
      }
    });

    // Brand extraction failures
    this.registerRecovery('brand-extraction', {
      strategy: 'fallback',
      fallbackValue: {
        tone: 'minimal',
        voice: 'confident',
        keyTerms: ['service', 'quality', 'professional'],
        avoidTerms: []
      }
    });

    // HTML rendering failures
    this.registerRecovery('html-rendering', {
      strategy: 'skip',
      condition: (error, context) => context.stage === 'validation' // Skip validation if rendering fails
    });
  }

  getErrorHistory(hours: number = 24): ErrorContext[] {
    const since = Date.now() - (hours * 60 * 60 * 1000);
    return this.errorHistory.filter(e => e.timestamp >= since);
  }

  getErrorStats(hours: number = 24): Record<string, number> {
    const recent = this.getErrorHistory(hours);
    const stats: Record<string, number> = {};

    for (const error of recent) {
      stats[error.operation] = (stats[error.operation] || 0) + 1;
    }

    return stats;
  }
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold = 5,
    private timeoutMs = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Specialized circuit breakers for different services
export const visionCircuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30s timeout
export const aiApiCircuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1min timeout

// Global error handler instance
export const errorHandler = new ErrorHandler();