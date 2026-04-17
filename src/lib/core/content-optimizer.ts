// src/lib/core/content-optimizer.ts - AI-Powered Content Optimization System
export interface ContentMetrics {
  engagement: number; // 0-1 scale
  conversion: number; // 0-1 scale
  readability: number; // 0-1 scale
  uniqueness: number; // 0-1 scale
  relevance: number; // 0-1 scale
  performance: {
    loadTime: number;
    size: number;
    lighthouseScore: number;
  };
}

export interface OptimizationRule {
  id: string;
  name: string;
  condition: (metrics: ContentMetrics) => boolean;
  action: (content: string, metrics: ContentMetrics) => Promise<string>;
  priority: number; // 1-10, higher = more important
  cooldown: number; // milliseconds between applications
}

export interface OptimizationResult {
  originalContent: string;
  optimizedContent: string;
  appliedRules: string[];
  improvements: Record<string, number>; // metric -> improvement delta
  confidence: number; // 0-1, how confident we are in the optimization
}

export class ContentOptimizer {
  private rules: Map<string, OptimizationRule> = new Map();
  private ruleCooldowns: Map<string, number> = new Map();
  private optimizationHistory: Array<{
    contentId: string;
    originalMetrics: ContentMetrics;
    optimizedMetrics: ContentMetrics;
    appliedRules: string[];
    timestamp: number;
  }> = [];

  constructor() {
    this.initializeDefaultRules();
  }

  addRule(rule: OptimizationRule): void {
    this.rules.set(rule.id, rule);
  }

  async optimize(
    content: string,
    metrics: ContentMetrics,
    contentId?: string
  ): Promise<OptimizationResult> {
    const applicableRules = this.getApplicableRules(metrics)
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    let optimizedContent = content;
    const appliedRules: string[] = [];
    const improvements: Record<string, number> = {};

    for (const rule of applicableRules) {
      // Check cooldown
      const lastApplied = this.ruleCooldowns.get(rule.id) || 0;
      if (Date.now() - lastApplied < rule.cooldown) {
        continue;
      }

      try {
        console.log(`🎯 Applying optimization rule: ${rule.name}`);
        const newContent = await rule.action(optimizedContent, metrics);
        const improvement = this.calculateImprovement(content, newContent, metrics);

        if (improvement > 0) {
          optimizedContent = newContent;
          appliedRules.push(rule.id);
          this.ruleCooldowns.set(rule.id, Date.now());

          // Track improvements
          Object.assign(improvements, improvement);
        }
      } catch (error) {
        console.error(`Failed to apply rule ${rule.id}:`, error);
      }
    }

    const result: OptimizationResult = {
      originalContent: content,
      optimizedContent,
      appliedRules,
      improvements,
      confidence: this.calculateConfidence(appliedRules, improvements)
    };

    // Store in history
    if (contentId) {
      this.optimizationHistory.push({
        contentId,
        originalMetrics: metrics,
        optimizedMetrics: { ...metrics }, // Would be recalculated in real implementation
        appliedRules,
        timestamp: Date.now()
      });
    }

    return result;
  }

  private getApplicableRules(metrics: ContentMetrics): OptimizationRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      try {
        return rule.condition(metrics);
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
        return false;
      }
    });
  }

  private calculateImprovement(
    original: string,
    optimized: string,
    metrics: ContentMetrics
  ): Record<string, number> {
    const improvements: Record<string, number> = {};

    // Length optimization
    const originalLength = original.length;
    const optimizedLength = optimized.length;
    if (optimizedLength < originalLength * 0.9) {
      improvements.sizeReduction = (originalLength - optimizedLength) / originalLength;
    }

    // Readability improvement (simplified)
    const originalSentences = original.split(/[.!?]+/).length;
    const optimizedSentences = optimized.split(/[.!?]+/).length;
    if (optimizedSentences > originalSentences) {
      improvements.readability = 0.1; // Assume shorter sentences improve readability
    }

    // Uniqueness improvement (simplified)
    const originalWords = new Set(original.toLowerCase().split(/\s+/));
    const optimizedWords = new Set(optimized.toLowerCase().split(/\s+/));
    const newWords = Array.from(optimizedWords).filter(word => !originalWords.has(word));
    if (newWords.length > 0) {
      improvements.uniqueness = Math.min(newWords.length / originalWords.size, 0.3);
    }

    return improvements;
  }

  private calculateConfidence(appliedRules: string[], improvements: Record<string, number>): number {
    let confidence = 0.5; // Base confidence

    // More rules applied = higher confidence
    confidence += Math.min(appliedRules.length * 0.1, 0.3);

    // Better improvements = higher confidence
    const totalImprovement = Object.values(improvements).reduce((sum, val) => sum + val, 0);
    confidence += Math.min(totalImprovement * 2, 0.4);

    return Math.min(confidence, 1.0);
  }

  private initializeDefaultRules(): void {
    // Readability Optimization
    this.addRule({
      id: 'readability_improvement',
      name: 'Readability Enhancement',
      condition: (metrics) => metrics.readability < 0.7,
      action: async (content, metrics) => {
        // Break long sentences
        let optimized = content.replace(/([^.!?]{100,200}[.!?])/g, '$1\n');

        // Add transition words
        const transitions = ['however', 'therefore', 'moreover', 'consequently'];
        const sentences = optimized.split(/[.!?]+/);
        if (sentences.length > 3) {
          const insertIndex = Math.floor(sentences.length / 2);
          const transition = transitions[Math.floor(Math.random() * transitions.length)];
          sentences.splice(insertIndex, 0, ` ${transition}`);
          optimized = sentences.join('.');
        }

        return optimized;
      },
      priority: 8,
      cooldown: 60 * 1000 // 1 minute
    });

    // Performance Optimization
    this.addRule({
      id: 'performance_optimization',
      name: 'Performance Enhancement',
      condition: (metrics) => metrics.performance.loadTime > 3000 || metrics.performance.size > 500000,
      action: async (content, metrics) => {
        // Remove unnecessary whitespace
        let optimized = content.replace(/\s+/g, ' ').trim();

        // Optimize images (placeholder)
        optimized = optimized.replace(
          /<img([^>]*)>/g,
          '<img$1 loading="lazy">'
        );

        // Minify inline styles
        optimized = optimized.replace(
          /style="([^"]*)"/g,
          (match, styles) => `style="${styles.replace(/\s+/g, ' ').trim()}"`
        );

        return optimized;
      },
      priority: 9,
      cooldown: 30 * 1000 // 30 seconds
    });

    // Engagement Optimization
    this.addRule({
      id: 'engagement_boost',
      name: 'Engagement Enhancement',
      condition: (metrics) => metrics.engagement < 0.6,
      action: async (content, metrics) => {
        // Add power words
        const powerWords = ['amazing', 'revolutionary', 'exclusive', 'limited', 'powerful'];
        let optimized = content;

        // Add power words to headlines
        optimized = optimized.replace(
          /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g,
          (match, headline) => {
            const word = powerWords[Math.floor(Math.random() * powerWords.length)];
            return match.replace(headline, `${word} ${headline.toLowerCase()}`);
          }
        );

        // Add urgency elements
        if (!optimized.includes('limited time') && !optimized.includes('today')) {
          optimized = optimized.replace(
            /(get started|sign up|learn more)/i,
            '$1 today'
          );
        }

        return optimized;
      },
      priority: 7,
      cooldown: 120 * 1000 // 2 minutes
    });

    // SEO Optimization
    this.addRule({
      id: 'seo_optimization',
      name: 'SEO Enhancement',
      condition: (metrics) => metrics.relevance < 0.7,
      action: async (content, metrics) => {
        // Add semantic HTML elements
        let optimized = content.replace(
          /<div[^>]*class="[^"]*hero[^"]*"[^>]*>(.*?)<\/div>/g,
          '<header class="hero">$1</header>'
        );

        // Improve heading hierarchy
        optimized = optimized.replace(
          /<div[^>]*>([^<]{50,100})<\/div>/g,
          '<section>$1</section>'
        );

        // Add alt text placeholders
        optimized = optimized.replace(
          /<img([^>]*)>/g,
          '<img$1 alt="Descriptive image">'
        );

        return optimized;
      },
      priority: 6,
      cooldown: 180 * 1000 // 3 minutes
    });

    // Content Uniqueness
    this.addRule({
      id: 'uniqueness_enhancement',
      name: 'Content Uniqueness Boost',
      condition: (metrics) => metrics.uniqueness < 0.6,
      action: async (content, metrics) => {
        // Add unique identifiers
        const timestamp = Date.now();
        let optimized = content.replace(
          /(id|class)="([^"]*)"/g,
          (match, attr, value) => `${attr}="${value}-${timestamp}"`
        );

        // Add custom data attributes
        optimized = optimized.replace(
          /<body([^>]*)>/,
          `<body$1 data-generated="${timestamp}">`
        );

        return optimized;
      },
      priority: 5,
      cooldown: 300 * 1000 // 5 minutes
    });
  }

  getOptimizationHistory(contentId?: string): Array<{
    contentId: string;
    improvements: Record<string, number>;
    appliedRules: string[];
    timestamp: number;
  }> {
    if (contentId) {
      return this.optimizationHistory
        .filter(h => h.contentId === contentId)
        .map(h => ({
          contentId: h.contentId,
          improvements: this.calculateImprovement('', '', h.originalMetrics), // Would need original content
          appliedRules: h.appliedRules,
          timestamp: h.timestamp
        }));
    }

    return this.optimizationHistory.slice(-50); // Last 50 optimizations
  }

  getRuleStats(): Record<string, { applied: number; lastUsed: number; avgImprovement: number }> {
    const stats: Record<string, { applied: number; lastUsed: number; avgImprovement: number }> = {};

    for (const history of this.optimizationHistory) {
      for (const ruleId of history.appliedRules) {
        if (!stats[ruleId]) {
          stats[ruleId] = { applied: 0, lastUsed: 0, avgImprovement: 0 };
        }
        stats[ruleId].applied++;
        stats[ruleId].lastUsed = Math.max(stats[ruleId].lastUsed, history.timestamp);
      }
    }

    return stats;
  }
}

// Global content optimizer
export const contentOptimizer = new ContentOptimizer();