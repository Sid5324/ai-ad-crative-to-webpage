// src/lib/core/semantic-sanitizer.ts - Global Filter Wrapper for Template Neutrality
export class SemanticSanitizer {
  private personality: any;
  private avoidTerms: string[];
  private synonymMap: Record<string, string>;

  constructor(personality?: any) {
    this.updatePersonality(personality);
  }

  updatePersonality(personality?: any): void {
    this.personality = personality;
    this.avoidTerms = personality?.avoidTerms || [];
    this.synonymMap = this.buildSynonymMap();
  }

  // Global Filter Wrapper - Mandatory middleware for all render output
  sanitize(content: string): string {
    if (!content || !this.avoidTerms.length) return content;

    let sanitized = content;

    // Apply synonym replacement for forbidden terms
    this.avoidTerms.forEach(term => {
      const synonym = this.synonymMap[term.toLowerCase()];
      if (synonym) {
        // Case-insensitive replacement
        const regex = new RegExp(term, 'gi');
        sanitized = sanitized.replace(regex, synonym);
      }
    });

    return sanitized;
  }

  // Deep validation for config objects
  validateConfig(config: any, path: string = 'root'): ValidationResult {
    const violations: string[] = [];

    this.deepScan(config, path, violations);

    return {
      valid: violations.length === 0,
      violations,
      sanitized: violations.length > 0 ? this.sanitizeConfig(config) : config
    };
  }

  private deepScan(obj: any, path: string, violations: string[]): void {
    if (typeof obj === 'string') {
      const forbidden = this.avoidTerms.filter(term =>
        obj.toLowerCase().includes(term.toLowerCase())
      );
      if (forbidden.length > 0) {
        violations.push(`${path}: Contains forbidden terms [${forbidden.join(', ')}] in "${obj}"`);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.deepScan(item, `${path}[${index}]`, violations);
      });
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        this.deepScan(value, `${path}.${key}`, violations);
      });
    }
  }

  private sanitizeConfig(config: any): any {
    if (typeof config === 'string') {
      return this.sanitize(config);
    } else if (Array.isArray(config)) {
      return config.map(item => this.sanitizeConfig(item));
    } else if (config && typeof config === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(config)) {
        sanitized[key] = this.sanitizeConfig(value);
      }
      return sanitized;
    }
    return config;
  }

  private buildSynonymMap(): Record<string, string> {
    const tone = this.personality?.tone || 'neutral';
    const industry = this.personality?.industry || 'generic';

    // Context-aware synonym mapping
    const synonymMaps: Record<string, Record<string, string>> = {
      'fast': {
        'luxury': 'quality',
        'premium': 'reliable',
        'technical': 'simple',
        'api': 'system',
        'exclusive': 'special',
        'elegant': 'clean',
        'sophisticated': 'smart'
      },
      'premium': {
        'luxury': 'elite',
        'premium': 'exclusive',
        'technical': 'advanced',
        'api': 'platform',
        'exclusive': 'private',
        'elegant': 'refined',
        'sophisticated': 'premium'
      },
      'reliable': {
        'luxury': 'trusted',
        'premium': 'proven',
        'technical': 'robust',
        'api': 'service',
        'exclusive': 'dedicated',
        'elegant': 'professional',
        'sophisticated': 'comprehensive'
      },
      'neutral': {
        'luxury': 'quality',
        'premium': 'excellent',
        'technical': 'advanced',
        'api': 'service',
        'exclusive': 'special',
        'elegant': 'refined',
        'sophisticated': 'advanced'
      }
    };

    // Industry-specific overrides
    const industryOverrides: Record<string, Record<string, string>> = {
      'food_delivery': {
        'luxury': 'fresh',
        'premium': 'quality',
        'technical': 'smart',
        'api': 'app'
      },
      'fintech': {
        'luxury': 'secure',
        'premium': 'trusted',
        'technical': 'advanced',
        'api': 'platform'
      }
    };

    // Merge maps: industry overrides take precedence over tone
    const baseMap = synonymMaps[tone] || synonymMaps['neutral'];
    const industryMap = industryOverrides[industry] || {};

    return { ...baseMap, ...industryMap };
  }

  // Template slot filling with semantic validation
  fillTemplate(template: string, slots: Record<string, string>): string {
    let filled = template;

    // Fill slots
    Object.entries(slots).forEach(([slot, value]) => {
      const placeholder = `{{${slot}}}`;
      filled = filled.replace(new RegExp(placeholder, 'g'), value);
    });

    // Sanitize the final result
    return this.sanitize(filled);
  }
}

interface ValidationResult {
  valid: boolean;
  violations: string[];
  sanitized?: any;
}

// Global semantic sanitizer instance
export const semanticSanitizer = new SemanticSanitizer();