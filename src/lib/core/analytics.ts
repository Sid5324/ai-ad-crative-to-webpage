// src/lib/core/analytics.ts - Advanced Analytics and Insights System
export interface AnalyticsEvent {
  id: string;
  type: 'generation' | 'error' | 'performance' | 'user_interaction' | 'system_health';
  timestamp: number;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  metadata?: {
    userAgent?: string;
    ip?: string;
    url?: string;
    duration?: number;
    success?: boolean;
  };
}

export interface AnalyticsQuery {
  type?: string;
  userId?: string;
  dateFrom?: number;
  dateTo?: number;
  limit?: number;
  groupBy?: string;
}

export interface AnalyticsReport {
  totalEvents: number;
  eventsByType: Record<string, number>;
  topErrors: Array<{ error: string; count: number }>;
  performanceMetrics: {
    avgGenerationTime: number;
    successRate: number;
    errorRate: number;
  };
  userInsights: {
    totalUsers: number;
    avgSessionLength: number;
    popularFeatures: Array<{ feature: string; usage: number }>;
  };
  trends: Array<{
    period: string;
    events: number;
    successRate: number;
    avgDuration: number;
  }>;
}

export class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events in memory
  private aggregationCache: Map<string, any> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  recordEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now()
    };

    this.events.push(fullEvent);

    // Maintain size limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Invalidate cache
    this.aggregationCache.clear();

    // Log high-priority events
    if (event.type === 'error' || event.type === 'system_health') {
      console.log(`📊 Analytics Event: ${event.type}`, {
        sessionId: event.sessionId,
        data: event.data
      });
    }
  }

  queryEvents(query: AnalyticsQuery): AnalyticsEvent[] {
    let filtered = this.events;

    if (query.type) {
      filtered = filtered.filter(e => e.type === query.type);
    }

    if (query.userId) {
      filtered = filtered.filter(e => e.userId === query.userId);
    }

    if (query.dateFrom) {
      filtered = filtered.filter(e => e.timestamp >= query.dateFrom!);
    }

    if (query.dateTo) {
      filtered = filtered.filter(e => e.timestamp <= query.dateTo!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  generateReport(timeRange: number = 24 * 60 * 60 * 1000): AnalyticsReport {
    const cacheKey = `report_${timeRange}`;
    const cached = this.aggregationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const since = Date.now() - timeRange;
    const recentEvents = this.events.filter(e => e.timestamp >= since);

    // Basic counts
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Error analysis
    const errorEvents = recentEvents.filter(e => e.type === 'error');
    const errorCounts = errorEvents.reduce((acc, event) => {
      const errorMsg = event.data.error || event.data.message || 'Unknown error';
      acc[errorMsg] = (acc[errorMsg] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));

    // Performance metrics
    const generationEvents = recentEvents.filter(e => e.type === 'generation');
    const successfulGenerations = generationEvents.filter(e => e.metadata?.success !== false);
    const avgGenerationTime = generationEvents.length > 0
      ? generationEvents.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) / generationEvents.length
      : 0;

    const successRate = generationEvents.length > 0
      ? successfulGenerations.length / generationEvents.length
      : 0;

    // User insights
    const uniqueUsers = new Set(recentEvents.map(e => e.userId).filter(Boolean));
    const sessionsByUser = recentEvents.reduce((acc, event) => {
      if (event.userId) {
        if (!acc[event.userId]) acc[event.userId] = [];
        acc[event.userId].push(event);
      }
      return acc;
    }, {} as Record<string, AnalyticsEvent[]>);

    const avgSessionLength = Object.values(sessionsByUser).length > 0
      ? Object.values(sessionsByUser).reduce((sum, events) => {
          if (events.length > 1) {
            const first = Math.min(...events.map(e => e.timestamp));
            const last = Math.max(...events.map(e => e.timestamp));
            return sum + (last - first);
          }
          return sum;
        }, 0) / Object.values(sessionsByUser).length
      : 0;

    // Feature usage
    const featureUsage = recentEvents.reduce((acc, event) => {
      if (event.data.feature) {
        acc[event.data.feature] = (acc[event.data.feature] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const popularFeatures = Object.entries(featureUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([feature, usage]) => ({ feature, usage }));

    // Trends (last 7 days, daily)
    const trends = this.generateTrends(recentEvents, 7);

    const report: AnalyticsReport = {
      totalEvents: recentEvents.length,
      eventsByType,
      topErrors,
      performanceMetrics: {
        avgGenerationTime,
        successRate,
        errorRate: 1 - successRate
      },
      userInsights: {
        totalUsers: uniqueUsers.size,
        avgSessionLength,
        popularFeatures
      },
      trends
    };

    // Cache the report
    this.aggregationCache.set(cacheKey, {
      data: report,
      timestamp: Date.now()
    });

    return report;
  }

  private generateTrends(events: AnalyticsEvent[], days: number): Array<{
    period: string;
    events: number;
    successRate: number;
    avgDuration: number;
  }> {
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - i);
      periodStart.setHours(0, 0, 0, 0);

      const periodEnd = new Date(periodStart);
      periodEnd.setHours(23, 59, 59, 999);

      const periodEvents = events.filter(e =>
        e.timestamp >= periodStart.getTime() && e.timestamp <= periodEnd.getTime()
      );

      const generationEvents = periodEvents.filter(e => e.type === 'generation');
      const successfulGenerations = generationEvents.filter(e => e.metadata?.success !== false);

      const avgDuration = generationEvents.length > 0
        ? generationEvents.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) / generationEvents.length
        : 0;

      const successRate = generationEvents.length > 0
        ? successfulGenerations.length / generationEvents.length
        : 0;

      trends.push({
        period: periodStart.toISOString().split('T')[0],
        events: periodEvents.length,
        successRate,
        avgDuration
      });
    }

    return trends;
  }

  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['id', 'type', 'timestamp', 'userId', 'sessionId', 'data', 'metadata'];
      const rows = this.events.map(event => [
        event.id,
        event.type,
        new Date(event.timestamp).toISOString(),
        event.userId || '',
        event.sessionId,
        JSON.stringify(event.data),
        JSON.stringify(event.metadata || {})
      ]);

      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    return JSON.stringify(this.events, null, 2);
  }

  getStorageStats(): {
    totalEvents: number;
    memoryUsage: number;
    cacheEntries: number;
    oldestEvent: number;
    newestEvent: number;
  } {
    const memoryUsage = this.events.length * 500; // Rough estimate: 500 bytes per event

    return {
      totalEvents: this.events.length,
      memoryUsage,
      cacheEntries: this.aggregationCache.size,
      oldestEvent: this.events.length > 0 ? this.events[0].timestamp : 0,
      newestEvent: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : 0
    };
  }
}

// Global analytics instance
export const analyticsEngine = new AnalyticsEngine();

// Analytics middleware
export async function withAnalytics(
  eventType: AnalyticsEvent['type'],
  handler: (req: Request, ...args: any[]) => Promise<Response>
) {
  return async (req: Request, ...args: any[]) => {
    const startTime = Date.now();
    const sessionId = Math.random().toString(36).substring(7);
    let success = false;

    try {
      const response = await handler(req, ...args);
      success = response.status < 400;

      // Record the event
      analyticsEngine.recordEvent({
        type: eventType,
        sessionId,
        data: { method: req.method, url: req.url },
        metadata: {
          userAgent: req.headers.get('User-Agent') || undefined,
          duration: Date.now() - startTime,
          success
        }
      });

      return response;
    } catch (error) {
      // Record error event
      analyticsEngine.recordEvent({
        type: 'error',
        sessionId,
        data: {
          error: (error as Error).message,
          stack: (error as Error).stack
        },
        metadata: {
          userAgent: req.headers.get('User-Agent') || undefined,
          duration: Date.now() - startTime,
          success: false
        }
      });

      throw error;
    }
  };
}