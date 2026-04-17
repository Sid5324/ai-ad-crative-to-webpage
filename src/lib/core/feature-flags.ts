// src/lib/core/feature-flags.ts - Feature Flags and A/B Testing System
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  conditions?: FeatureCondition[];
  variants?: FeatureVariant[];
  metadata?: {
    owner: string;
    created: string;
    lastModified: string;
  };
}

export interface FeatureCondition {
  type: 'user' | 'ip' | 'country' | 'browser' | 'custom';
  operator: 'equals' | 'contains' | 'regex' | 'range';
  value: any;
}

export interface FeatureVariant {
  name: string;
  weight: number; // Relative weight for A/B testing
  config: Record<string, any>;
}

export interface FeatureContext {
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  custom?: Record<string, any>;
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> flagKey -> variant

  constructor() {
    this.initializeDefaultFlags();
  }

  addFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  updateFlag(key: string, updates: Partial<FeatureFlag>): void {
    const existing = this.flags.get(key);
    if (existing) {
      this.flags.set(key, { ...existing, ...updates });
    }
  }

  removeFlag(key: string): void {
    this.flags.delete(key);
  }

  isEnabled(key: string, context?: FeatureContext): boolean {
    const flag = this.flags.get(key);
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userHash = this.generateUserHash(context?.userId || context?.sessionId || 'anonymous');
      const userPercentage = (userHash % 100) + 1;

      if (userPercentage > flag.rolloutPercentage) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions && flag.conditions.length > 0) {
      return flag.conditions.every(condition => this.evaluateCondition(condition, context));
    }

    return true;
  }

  getVariant(key: string, context?: FeatureContext): string | null {
    const flag = this.flags.get(key);
    if (!flag?.variants || flag.variants.length === 0) {
      return null;
    }

    // Check if user already has an assignment
    const userId = context?.userId || context?.sessionId;
    if (userId) {
      const userAssignments = this.userAssignments.get(userId);
      if (userAssignments?.has(key)) {
        return userAssignments.get(key)!;
      }
    }

    // Select variant based on weights
    const totalWeight = flag.variants.reduce((sum, v) => sum + v.weight, 0);
    const randomValue = this.generateUserHash(userId || 'anonymous') % totalWeight;

    let cumulativeWeight = 0;
    for (const variant of flag.variants) {
      cumulativeWeight += variant.weight;
      if (randomValue < cumulativeWeight) {
        // Store assignment for consistency
        if (userId) {
          if (!this.userAssignments.has(userId)) {
            this.userAssignments.set(userId, new Map());
          }
          this.userAssignments.get(userId)!.set(key, variant.name);
        }

        return variant.name;
      }
    }

    return flag.variants[0].name; // Fallback
  }

  getVariantConfig(key: string, variantName: string): Record<string, any> | null {
    const flag = this.flags.get(key);
    const variant = flag?.variants?.find(v => v.name === variantName);
    return variant?.config || null;
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getEnabledFlags(context?: FeatureContext): string[] {
    return Array.from(this.flags.keys()).filter(key => this.isEnabled(key, context));
  }

  private evaluateCondition(condition: FeatureCondition, context?: FeatureContext): boolean {
    if (!context) return false;

    const contextValue = this.getContextValue(condition.type, context);
    if (contextValue === undefined) return false;

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      case 'regex':
        return new RegExp(condition.value).test(String(contextValue));
      case 'range':
        const [min, max] = condition.value;
        const numValue = Number(contextValue);
        return numValue >= min && numValue <= max;
      default:
        return false;
    }
  }

  private getContextValue(type: string, context: FeatureContext): any {
    switch (type) {
      case 'user':
        return context.userId;
      case 'ip':
        return context.ip;
      case 'country':
        return context.country;
      case 'browser':
        return this.parseBrowser(context.userAgent);
      case 'custom':
        return context.custom;
      default:
        return undefined;
    }
  }

  private parseBrowser(userAgent?: string): string {
    if (!userAgent) return 'unknown';

    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
    if (ua.includes('edg')) return 'edge';
    return 'other';
  }

  private generateUserHash(identifier: string): number {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private initializeDefaultFlags(): void {
    // Advanced caching feature flag
    this.addFlag({
      key: 'advanced_caching',
      name: 'Advanced Caching',
      description: 'Enable advanced caching strategies for better performance',
      enabled: true,
      rolloutPercentage: 100,
      metadata: {
        owner: 'system',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    });

    // Semantic validation feature flag
    this.addFlag({
      key: 'semantic_validation',
      name: 'Semantic Validation',
      description: 'Enable advanced semantic drift detection',
      enabled: true,
      rolloutPercentage: 100,
      variants: [
        { name: 'strict', weight: 80, config: { threshold: 0.8 } },
        { name: 'lenient', weight: 20, config: { threshold: 0.95 } }
      ],
      metadata: {
        owner: 'system',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    });

    // Error recovery feature flag
    this.addFlag({
      key: 'error_recovery',
      name: 'Error Recovery',
      description: 'Enable automatic error recovery mechanisms',
      enabled: true,
      rolloutPercentage: 100,
      conditions: [
        {
          type: 'custom',
          operator: 'equals',
          value: { premium: true }
        }
      ],
      metadata: {
        owner: 'system',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    });

    // Template neutrality feature flag
    this.addFlag({
      key: 'template_neutrality',
      name: 'Template Neutrality',
      description: 'Use neutral templates with semantic slot filling',
      enabled: true,
      rolloutPercentage: 100, // Full rollout - fix semantic drift
      metadata: {
        owner: 'system',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    });

    // Analytics feature flag
    this.addFlag({
      key: 'analytics',
      name: 'Analytics Tracking',
      description: 'Enable detailed analytics and performance tracking',
      enabled: true,
      rolloutPercentage: 100,
      metadata: {
        owner: 'system',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    });
  }

  // Administrative methods
  resetUserAssignments(userId?: string): void {
    if (userId) {
      this.userAssignments.delete(userId);
    } else {
      this.userAssignments.clear();
    }
  }

  getStats(): {
    totalFlags: number;
    enabledFlags: number;
    totalAssignments: number;
  } {
    let totalAssignments = 0;
    for (const assignments of this.userAssignments.values()) {
      totalAssignments += assignments.size;
    }

    return {
      totalFlags: this.flags.size,
      enabledFlags: Array.from(this.flags.values()).filter(f => f.enabled).length,
      totalAssignments
    };
  }
}

// Global feature flag manager
export const featureFlagManager = new FeatureFlagManager();

// Middleware for feature flags
export function withFeatureFlags(
  handler: (req: Request, context: FeatureContext, ...args: any[]) => Promise<Response>
) {
  return async (req: Request, ...args: any[]) => {
    const context: FeatureContext = {
      userId: req.headers.get('X-User-ID') || undefined,
      sessionId: req.headers.get('X-Session-ID') || Math.random().toString(36).substring(7),
      ip: req.headers.get('X-Forwarded-For')?.split(',')[0] || req.headers.get('X-Real-IP') || undefined,
      userAgent: req.headers.get('User-Agent') || undefined
    };

    // Add feature flags to request headers for downstream use
    const enabledFlags = featureFlagManager.getEnabledFlags(context);
    const headers = new Headers(req.headers);
    headers.set('X-Enabled-Features', enabledFlags.join(','));

    const enhancedReq = new Request(req, { headers });

    return handler(enhancedReq, context, ...args);
  };
}

// Utility functions
export function isFeatureEnabled(key: string, context?: FeatureContext): boolean {
  return featureFlagManager.isEnabled(key, context);
}

export function getFeatureVariant(key: string, context?: FeatureContext): string | null {
  return featureFlagManager.getVariant(key, context);
}

export function getFeatureConfig(key: string, variantName: string): Record<string, any> | null {
  return featureFlagManager.getVariantConfig(key, variantName);
}