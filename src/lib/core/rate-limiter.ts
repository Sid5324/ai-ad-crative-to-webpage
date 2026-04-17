// src/lib/core/rate-limiter.ts - Advanced Rate Limiting System
interface RateLimitRule {
  id: string;
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator: (req: Request) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

export class RateLimiter {
  private rules: Map<string, RateLimitRule> = new Map();
  private storage: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.initializeDefaultRules();
  }

  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
  }

  async checkLimit(ruleId: string, req: Request): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return { allowed: true, remaining: Infinity, resetTime: 0 };
    }

    const key = rule.keyGenerator(req);
    const storageKey = `${ruleId}:${key}`;

    const now = Date.now();
    let entry = this.storage.get(storageKey);

    // Initialize or reset entry if window has expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + rule.windowMs,
        lastRequest: now
      };
    }

    // Check if limit exceeded
    const isAtLimit = entry.count >= rule.maxRequests;
    if (isAtLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }

    // Increment counter
    entry.count++;
    entry.lastRequest = now;
    this.storage.set(storageKey, entry);

    return {
      allowed: true,
      remaining: rule.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  async recordResult(ruleId: string, req: Request, success: boolean): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    // Optionally skip rate limiting based on request outcome
    if ((success && rule.skipSuccessfulRequests) || (!success && rule.skipFailedRequests)) {
      const key = rule.keyGenerator(req);
      const storageKey = `${ruleId}:${key}`;
      this.storage.delete(storageKey);
    }
  }

  private initializeDefaultRules(): void {
    // API Generation Rate Limit
    this.addRule({
      id: 'api_generation',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      keyGenerator: (req) => this.getClientIP(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    });

    // Image Processing Rate Limit (stricter)
    this.addRule({
      id: 'image_processing',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 image processing requests per minute
      keyGenerator: (req) => this.getClientIP(req)
    });

    // Health Check Rate Limit (more lenient)
    this.addRule({
      id: 'health_check',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 health checks per minute
      keyGenerator: (req) => this.getClientIP(req)
    });
  }

  private getClientIP(req: Request): string {
    // Try to get IP from various headers (for Vercel/serverless)
    const headers = req.headers as any;

    return (
      headers['x-forwarded-for']?.split(',')[0] ||
      headers['x-real-ip'] ||
      headers['x-client-ip'] ||
      headers['cf-connecting-ip'] ||
      'unknown'
    );
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.storage) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.storage.delete(key));
    console.log(`🧹 Cleaned up ${keysToDelete.length} expired rate limit entries`);
  }

  getStats(): {
    activeRules: number;
    activeEntries: number;
    totalRequests: number;
  } {
    let totalRequests = 0;
    for (const entry of this.storage.values()) {
      totalRequests += entry.count;
    }

    return {
      activeRules: this.rules.size,
      activeEntries: this.storage.size,
      totalRequests
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Middleware function for Next.js API routes
export function withRateLimit(
  ruleId: string,
  handler: (req: Request, ...args: any[]) => Promise<Response>
) {
  return async (req: Request, ...args: any[]) => {
    const limitResult = await rateLimiter.checkLimit(ruleId, req);

    if (!limitResult.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: limitResult.retryAfter,
        resetTime: new Date(limitResult.resetTime).toISOString()
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': limitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(limitResult.resetTime).toISOString(),
          'Retry-After': (limitResult.retryAfter || 60).toString()
        }
      });
    }

    try {
      const response = await handler(req, ...args);

      // Record the result for potential rule adjustments
      const success = response.status < 400;
      await rateLimiter.recordResult(ruleId, req, success);

      // Add rate limit headers to successful responses
      if (success) {
        const headers = new Headers(response.headers);
        headers.set('X-RateLimit-Remaining', (limitResult.remaining - 1).toString());
        headers.set('X-RateLimit-Reset', new Date(limitResult.resetTime).toISOString());

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      }

      return response;
    } catch (error) {
      // Record failed requests
      await rateLimiter.recordResult(ruleId, req, false);
      throw error;
    }
  };
}