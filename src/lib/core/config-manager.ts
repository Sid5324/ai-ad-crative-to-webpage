// src/lib/core/config-manager.ts - Configuration Management System
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
  condition: (context: any) => boolean;
  action: (context: any) => Promise<ValidationResult> | ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  score?: number;
  message?: string;
  suggestions?: string[];
}

export interface BrandPersonality {
  id: string;
  name: string;
  tone: string;
  voice: string;
  keyTerms: string[];
  avoidTerms: string[];
  cta: { primary: string; secondary: string };
  visual: {
    colors: { primary: string; accent: string };
    typography: { family: string; weight: string };
    layout: string[];
  };
}

export class ConfigManager {
  private rules: Map<string, ValidationRule> = new Map();
  private personalities: Map<string, BrandPersonality> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultPersonalities();
  }

  // Validation Rules Management
  addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  getRule(id: string): ValidationRule | undefined {
    return this.rules.get(id);
  }

  getAllRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  enableRule(id: string): void {
    const rule = this.rules.get(id);
    if (rule) rule.enabled = true;
  }

  disableRule(id: string): void {
    const rule = this.rules.get(id);
    if (rule) rule.enabled = false;
  }

  // Personality Management
  addPersonality(personality: BrandPersonality): void {
    this.personalities.set(personality.id, personality);
  }

  getPersonality(id: string): BrandPersonality | undefined {
    return this.personalities.get(id);
  }

  findPersonalityByDomain(domain: string): BrandPersonality | undefined {
    // Find exact match first
    for (const [_, personality] of this.personalities) {
      if (domain.includes(personality.id)) {
        return personality;
      }
    }
    return undefined;
  }

  // Dynamic Rule Evaluation
  async validate(context: any): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        const conditionMet = rule.condition(context);
        if (conditionMet) {
          const result = await rule.action(context);
          results.push(result);
        }
      } catch (error) {
        console.error(`Rule ${rule.id} failed:`, error);
        results.push({
          passed: false,
          message: `Rule execution failed: ${error}`
        });
      }
    }

    return results;
  }

  private initializeDefaultRules(): void {
    // Semantic Drift Rule
    this.addRule({
      id: 'semantic-drift',
      name: 'Semantic Drift Detection',
      description: 'Ensures generated content matches brand personality',
      enabled: true,
      severity: 'error',
      condition: (context) => context.content && context.personality,
      action: async (context) => {
        const driftScore = this.calculateSemanticDrift(context);
        const threshold = this.getThresholdForSeverity('semantic-drift');

        return {
          passed: driftScore <= threshold,
          score: driftScore,
          message: driftScore > threshold
            ? `Semantic drift score ${driftScore.toFixed(3)} exceeds threshold ${threshold}`
            : `Semantic drift score: ${driftScore.toFixed(3)}`,
          suggestions: driftScore > threshold ? [
            'Review personality alignment',
            'Check content filtering',
            'Adjust brand keywords'
          ] : []
        };
      }
    });

    // Visual Consistency Rule
    this.addRule({
      id: 'visual-consistency',
      name: 'Visual Consistency Check',
      description: 'Ensures colors and styling match brand guidelines',
      enabled: true,
      severity: 'error',
      condition: (context) => context.html && context.brandColors,
      action: async (context) => {
        const hasPrimaryColor = context.html.includes(context.brandColors.primary);
        const hasAccentColor = context.html.includes(context.brandColors.accent);

        return {
          passed: hasPrimaryColor && hasAccentColor,
          message: hasPrimaryColor && hasAccentColor
            ? 'Visual consistency verified'
            : `Missing brand colors: ${!hasPrimaryColor ? 'primary ' : ''}${!hasAccentColor ? 'accent' : ''}`.trim()
        };
      }
    });

    // Content Quality Rule
    this.addRule({
      id: 'content-quality',
      name: 'Content Quality Assessment',
      description: 'Checks for gibberish, coherence, and brand alignment',
      enabled: true,
      severity: 'warning',
      condition: (context) => context.content,
      action: async (context) => {
        const quality = this.assessContentQuality(context.content);
        return {
          passed: quality.score > 0.7,
          score: quality.score,
          message: quality.message,
          suggestions: quality.suggestions
        };
      }
    });
  }

  private initializeDefaultPersonalities(): void {
    // DoorDash Personality
    this.addPersonality({
      id: 'doordash',
      name: 'DoorDash',
      tone: 'fast',
      voice: 'urgent',
      keyTerms: ['delivery', 'fresh', 'hot', 'fast', 'restaurant', 'food'],
      avoidTerms: ['luxury', 'premium', 'technical', 'api', 'exclusive', 'elegant', 'sophisticated'],
      cta: { primary: 'Order Now', secondary: 'Browse Menu' },
      visual: {
        colors: { primary: '#EB1700', accent: '#FFFFFF' },
        typography: { family: 'Inter', weight: '500' },
        layout: ['hero', 'features', 'stats', 'app-download', 'cta']
      }
    });

    // Default Food Delivery Personality
    this.addPersonality({
      id: 'food_delivery',
      name: 'Food Delivery Generic',
      tone: 'fast',
      voice: 'casual',
      keyTerms: ['food', 'delivery', 'restaurant', 'fresh', 'order'],
      avoidTerms: ['luxury', 'premium', 'technical', 'api'],
      cta: { primary: 'Order Now', secondary: 'Browse Menu' },
      visual: {
        colors: { primary: '#FF6B35', accent: '#F7931E' },
        typography: { family: 'Inter', weight: '400' },
        layout: ['hero', 'benefits', 'how-it-works', 'app-download', 'cta']
      }
    });
  }

  private calculateSemanticDrift(context: any): number {
    // Enhanced semantic drift calculation
    let driftScore = 0;
    const content = (context.html || '').toLowerCase();
    const personality = context.personality;

    if (personality) {
      // Check avoid terms
      const avoidMatches = personality.avoidTerms.filter(term =>
        content.includes(term.toLowerCase())
      ).length;
      driftScore += Math.min(avoidMatches * 0.15, 0.3);

      // Check key terms
      const keyMatches = personality.keyTerms.filter(term =>
        content.includes(term.toLowerCase())
      ).length;
      const expectedMatches = Math.min(personality.keyTerms.length, 3);
      const keyScore = keyMatches / expectedMatches;
      if (keyScore < 0.5) driftScore += 0.2;
    }

    return Math.min(driftScore, 1);
  }

  private assessContentQuality(content: string): { score: number; message: string; suggestions: string[] } {
    let score = 1.0;
    const suggestions: string[] = [];

    // Check for gibberish patterns
    const gibberishPatterns = [
      /^[a-z]{1,2}(\s+[a-z]{1,2})+$/, // Single letters
      /\b[a-z]{8,}\b/, // Very long words
      /[0-9]{6,}/, // Long number sequences
    ];

    const hasGibberish = gibberishPatterns.some(pattern => pattern.test(content));
    if (hasGibberish) {
      score -= 0.3;
      suggestions.push('Remove gibberish content');
    }

    // Check content length
    if (content.length < 100) {
      score -= 0.2;
      suggestions.push('Add more content');
    }

    return {
      score: Math.max(0, score),
      message: `Content quality: ${(score * 100).toFixed(0)}%`,
      suggestions
    };
  }

  private getThresholdForSeverity(ruleId: string): number {
    // Dynamic thresholds based on rule and context
    const thresholds: Record<string, number> = {
      'semantic-drift': 0.8,
      'visual-consistency': 0.9,
      'content-quality': 0.7
    };
    return thresholds[ruleId] || 0.8;
  }
}

// Global configuration instance
export const configManager = new ConfigManager();