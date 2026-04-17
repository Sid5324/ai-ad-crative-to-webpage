// src/lib/core/config-validator.ts - Deep Config Validation System
export class ConfigValidator {
  private semanticSanitizer: any;

  constructor(semanticSanitizer: any) {
    this.semanticSanitizer = semanticSanitizer;
  }

  // Deep validation of entire config tree
  validateConfigTree(config: any, personality: any): ValidationReport {
    const violations: ConfigViolation[] = [];
    const sanitizedConfig = { ...config };

    this.semanticSanitizer.updatePersonality(personality);

    // Validate root level
    this.validateObject(config, 'root', violations, sanitizedConfig);

    return {
      valid: violations.length === 0,
      violations,
      sanitizedConfig,
      severity: this.calculateSeverity(violations)
    };
  }

  private validateObject(obj: any, path: string, violations: ConfigViolation[], sanitized: any): void {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path === 'root' ? key : `${path}.${key}`;

      if (typeof value === 'string') {
        this.validateString(value, currentPath, violations);
        sanitized[key] = this.semanticSanitizer.sanitize(value);
      } else if (Array.isArray(value)) {
        this.validateArray(value, currentPath, violations, sanitized[key] = []);
      } else if (value && typeof value === 'object') {
        sanitized[key] = {};
        this.validateObject(value, currentPath, violations, sanitized[key]);
      } else {
        sanitized[key] = value;
      }
    }
  }

  private validateArray(arr: any[], path: string, violations: ConfigViolation[], sanitized: any[]): void {
    arr.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;

      if (typeof item === 'string') {
        this.validateString(item, itemPath, violations);
        sanitized[index] = this.semanticSanitizer.sanitize(item);
      } else if (item && typeof item === 'object') {
        sanitized[index] = Array.isArray(item) ? [] : {};
        this.validateObject(item, itemPath, violations, sanitized[index]);
      } else {
        sanitized[index] = item;
      }
    });
  }

  private validateString(value: string, path: string, violations: ConfigViolation[]): void {
    const result = this.semanticSanitizer.validateConfig({ test: value }, '');
    if (!result.valid) {
      violations.push({
        path,
        value,
        violations: result.violations,
        severity: 'error',
        suggestion: `Replace with: ${result.sanitized?.test || 'sanitized content'}`
      });
    }
  }

  private calculateSeverity(violations: ConfigViolation[]): 'low' | 'medium' | 'high' | 'critical' {
    if (violations.length === 0) return 'low';

    const errorCount = violations.filter(v => v.severity === 'error').length;
    const criticalPaths = ['benefits', 'testimonials', 'headerTag', 'trustIndicators'];

    const hasCritical = violations.some(v =>
      criticalPaths.some(critical => v.path.includes(critical))
    );

    if (hasCritical || errorCount > 5) return 'critical';
    if (errorCount > 2) return 'high';
    if (errorCount > 0) return 'medium';
    return 'low';
  }

  // Pre-flight validation before rendering
  async preFlightCheck(config: any, personality: any): Promise<{
    canProceed: boolean;
    issues: ConfigViolation[];
    recommendedActions: string[];
  }> {
    const report = this.validateConfigTree(config, personality);

    const recommendedActions = [];

    if (report.severity === 'critical') {
      recommendedActions.push('STOP: Critical config violations detected. Manual review required.');
    } else if (report.severity === 'high') {
      recommendedActions.push('WARNING: Multiple config violations. Sanitization applied.');
    }

    if (report.violations.some(v => v.path.includes('headerTag'))) {
      recommendedActions.push('Header tag sanitized - verify branding consistency.');
    }

    if (report.violations.some(v => v.path.includes('benefits'))) {
      recommendedActions.push('Benefits section sanitized - review messaging alignment.');
    }

    return {
      canProceed: report.severity !== 'critical',
      issues: report.violations,
      recommendedActions
    };
  }
}

interface ConfigViolation {
  path: string;
  value: string;
  violations: string[];
  severity: 'error' | 'warning';
  suggestion: string;
}

interface ValidationReport {
  valid: boolean;
  violations: ConfigViolation[];
  sanitizedConfig: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Global config validator instance
export const configValidator = new ConfigValidator(null);