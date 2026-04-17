// src/lib/core/monitoring.ts - Comprehensive Monitoring System
interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  successRate: number;
  cacheHitRate: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: number;
  activeConnections: number;
  lastError?: Error;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private maxMetrics = 1000;

  record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  increment(name: string, tags?: Record<string, string>): void {
    this.record(name, 1, tags);
  }

  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.record(`${name}_duration`, duration, tags);
  }

  getMetrics(name?: string, since?: number): Metric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since);
    }

    return filtered;
  }

  getAggregatedMetrics(): Record<string, { count: number; sum: number; avg: number; min: number; max: number }> {
    const aggregated: Record<string, { values: number[]; timestamps: number[] }> = {};

    for (const metric of this.metrics) {
      if (!aggregated[metric.name]) {
        aggregated[metric.name] = { values: [], timestamps: [] };
      }
      aggregated[metric.name].values.push(metric.value);
      aggregated[metric.name].timestamps.push(metric.timestamp);
    }

    const result: Record<string, { count: number; sum: number; avg: number; min: number; max: number }> = {};

    for (const [name, data] of Object.entries(aggregated)) {
      const values = data.values;
      result[name] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }

    return result;
  }
}

export class HealthMonitor {
  private startTime = Date.now();
  private lastHealthCheck = Date.now();
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 5;

  async checkHealth(): Promise<SystemHealth> {
    const now = Date.now();
    const uptime = now - this.startTime;

    // Basic health checks
    const memoryUsage = this.getMemoryUsage();
    const activeConnections = await this.getActiveConnections();

    // Determine status
    let status: SystemHealth['status'] = 'healthy';
    let lastError: Error | undefined;

    try {
      await this.performHealthChecks();
      this.consecutiveFailures = 0;
    } catch (error) {
      this.consecutiveFailures++;
      lastError = error as Error;

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        status = 'unhealthy';
      } else {
        status = 'degraded';
      }
    }

    this.lastHealthCheck = now;

    return {
      status,
      uptime,
      memoryUsage,
      activeConnections,
      lastError
    };
  }

  private async performHealthChecks(): Promise<void> {
    // Check database connectivity (if applicable)
    // Check external API availability
    // Check cache health
    // Check file system access

    // For now, just a basic check
    if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) { // 500MB
      throw new Error('High memory usage detected');
    }
  }

  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return usage.heapUsed / usage.heapTotal;
  }

  private async getActiveConnections(): Promise<number> {
    // This would need to be implemented based on your server setup
    // For now, return a mock value
    return 0;
  }
}

export class PerformanceMonitor {
  private metrics = new MetricsCollector();
  private health = new HealthMonitor();

  recordRequest(endpoint: string, duration: number, success: boolean): void {
    this.metrics.timing('request', duration, { endpoint, success: success.toString() });
    this.metrics.increment(success ? 'request_success' : 'request_error', { endpoint });
  }

  recordCacheHit(cacheType: string): void {
    this.metrics.increment('cache_hit', { type: cacheType });
  }

  recordCacheMiss(cacheType: string): void {
    this.metrics.increment('cache_miss', { type: cacheType });
  }

  recordValidationFailure(ruleId: string, severity: string): void {
    this.metrics.increment('validation_failure', { rule: ruleId, severity });
  }

  recordAIApiCall(provider: string, model: string, tokens: number, success: boolean): void {
    this.metrics.increment('ai_api_call', {
      provider,
      model,
      success: success.toString()
    });
    this.metrics.record('ai_tokens_used', tokens, { provider, model });
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const aggregated = this.metrics.getAggregatedMetrics();

    const requestCount = aggregated.request?.count || 0;
    const errorCount = aggregated.request_error?.count || 0;
    const totalDuration = aggregated.request_duration?.sum || 0;

    return {
      requestCount,
      errorCount,
      averageResponseTime: requestCount > 0 ? totalDuration / requestCount : 0,
      successRate: requestCount > 0 ? (requestCount - errorCount) / requestCount : 0,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return this.health.checkHealth();
  }

  private calculateCacheHitRate(): number {
    const hits = this.metrics.getAggregatedMetrics().cache_hit?.count || 0;
    const misses = this.metrics.getAggregatedMetrics().cache_miss?.count || 0;
    const total = hits + misses;
    return total > 0 ? hits / total : 0;
  }

  getRecentErrors(hours: number = 1): Metric[] {
    const since = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.getMetrics('request_error', since);
  }

   getSlowRequests(thresholdMs: number = 5000): Metric[] {
     const since = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
     const slowRequests = this.metrics.getMetrics('request_duration', since)
       .filter(m => m.value > thresholdMs);
     return slowRequests;
   }

    async recordOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
      const startTime = Date.now();
      try {
        const result = await operation();
        const duration = Date.now() - startTime;
        this.recordRequest(operationName, duration, true);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.recordRequest(operationName, duration, false);
        throw error;
      }
    }

   recordError(error: Error, context?: Record<string, string>): void {
     this.metrics.increment('error', context);
     // Also could log to external service
     console.error(`[Monitoring] Error in ${context?.operation || 'unknown'}:`, error.message);
   }
 }

// Global monitoring instance
export const performanceMonitor = new PerformanceMonitor();