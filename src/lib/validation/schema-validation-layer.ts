// @ts-nocheck
// src/lib/validation/schema-validation-layer.ts
// Schema Validation Layer for Agent Contracts

import { z } from 'zod';
import { ValidationIssue } from '../agent-contracts/agent-result';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  isFatal: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  sanitized?: any;
  metadata: {
    validatedAt: string;
    schemaVersion: string;
    validationTime: number;
  };
}

export interface ValidationConfig {
  strict: boolean;
  allowUnknownFields: boolean;
  sanitize: boolean;
  maxDepth: number;
  timeout: number;
}

// ============================================================================
// SCHEMA VALIDATOR CLASS
// ============================================================================

export class SchemaValidator {
  private static instance: SchemaValidator;
  private schemaCache = new Map<string, z.ZodSchema>();

  static getInstance(): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator();
    }
    return SchemaValidator.instance;
  }

  // Validate data against schema
  async validate<T>(
    data: any,
    schema: z.ZodSchema<T>,
    config: Partial<ValidationConfig> = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const validationConfig: ValidationConfig = {
      strict: true,
      allowUnknownFields: false,
      sanitize: true,
      maxDepth: 10,
      timeout: 10000,
      ...config
    };

    try {
      // Check for timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Validation timeout')), validationConfig.timeout)
      );

      const validationPromise = this.performValidation(data, schema, validationConfig);

      const result = await Promise.race([validationPromise, timeoutPromise]);

      return {
        isValid: result.isValid,
        isFatal: result.errors.some(e => e.severity === 'fatal'),
        errors: result.errors.filter(e => e.severity === 'fatal'),
        warnings: result.errors.filter(e => e.severity !== 'fatal'),
        sanitized: result.sanitized,
        metadata: {
          validatedAt: new Date().toISOString(),
          schemaVersion: '1.0.0',
          validationTime: Date.now() - startTime
        }
      };

    } catch (error: any) {
      return {
        isValid: false,
        isFatal: true,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Validation failed: ${error.message}`,
          severity: 'fatal'
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date().toISOString(),
          schemaVersion: '1.0.0',
          validationTime: Date.now() - startTime
        }
      };
    }
  }

  private async performValidation<T>(
    data: any,
    schema: z.ZodSchema<T>,
    config: ValidationConfig
  ): Promise<{ isValid: boolean; errors: ValidationIssue[]; sanitized?: T }> {
    try {
      let processedData = data;

      // Pre-process for safety
      if (config.sanitize) {
        processedData = this.sanitizeData(data, config.maxDepth);
      }

      // Parse with Zod
      const result = schema.safeParse(processedData);

      if (result.success) {
        return {
          isValid: true,
          errors: [],
          sanitized: result.data
        };
      } else {
        // Convert Zod errors to our format
        const errors: ValidationIssue[] = result.error.errors.map(err => ({
          code: 'SCHEMA_VALIDATION_ERROR',
          message: err.message,
          severity: config.strict ? 'fatal' : 'warning',
          field: err.path.join('.'),
          data: {
            code: err.code,
            path: err.path
          }
        }));

        return {
          isValid: false,
          errors
        };
      }

    } catch (error: any) {
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_EXCEPTION',
          message: `Unexpected validation error: ${error.message}`,
          severity: 'fatal'
        }]
      };
    }
  }

  // Sanitize data for safety
  private sanitizeData(data: any, maxDepth: number, currentDepth: number = 0): any {
    if (currentDepth >= maxDepth) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      // Remove potentially dangerous content
      return data.replace(/<script[^>]*>.*?<\/script>/gi, '[SCRIPT_REMOVED]');
    }

    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.slice(0, 1000).map(item =>
          this.sanitizeData(item, maxDepth, currentDepth + 1)
        );
      }

      const sanitized: Record<string, any> = {};
      const keys = Object.keys(data).slice(0, 100); // Limit keys

      for (const key of keys) {
        if (typeof key === 'string' && key.length < 100) {
          sanitized[key] = this.sanitizeData(data[key], maxDepth, currentDepth + 1);
        }
      }

      return sanitized;
    }

    // Primitive types
    if (typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }

    // Convert unknown types to string
    return String(data).substring(0, 1000);
  }

  // Cache schema for performance
  cacheSchema(name: string, schema: z.ZodSchema): void {
    this.schemaCache.set(name, schema);
  }

  getCachedSchema(name: string): z.ZodSchema | null {
    return this.schemaCache.get(name) || null;
  }
}

// ============================================================================
// BUSINESS RULE VALIDATOR
// ============================================================================

export interface BusinessRule {
  name: string;
  condition: (data: any, context?: any) => boolean;
  message: string;
  severity: 'warning' | 'error' | 'fatal';
  suggestion?: string;
}

export class BusinessRuleValidator {
  private rules: BusinessRule[] = [];

  addRule(rule: BusinessRule): void {
    this.rules.push(rule);
  }

  addRules(rules: BusinessRule[]): void {
    this.rules.push(...rules);
  }

  async validate(data: any, context?: any): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationIssue[] = [];

    for (const rule of this.rules) {
      try {
        const passes = rule.condition(data, context);
        if (!passes) {
          errors.push({
            code: `BUSINESS_RULE_${rule.name.toUpperCase()}`,
            message: rule.message,
            severity: rule.severity,
            suggestion: rule.suggestion
          });
        }
      } catch (error: any) {
        errors.push({
          code: `RULE_EXECUTION_ERROR`,
          message: `Failed to execute rule ${rule.name}: ${error.message}`,
          severity: 'fatal'
        });
      }
    }

    return {
      isValid: !errors.some(e => e.severity === 'fatal' || e.severity === 'error'),
      isFatal: errors.some(e => e.severity === 'fatal'),
      errors: errors.filter(e => e.severity === 'fatal' || e.severity === 'error'),
      warnings: errors.filter(e => e.severity === 'warning'),
      metadata: {
        validatedAt: new Date().toISOString(),
        schemaVersion: '1.0.0',
        validationTime: Date.now() - startTime
      }
    };
  }
}

// ============================================================================
// AGENT-SPECIFIC VALIDATION RULES
// ============================================================================

export const AGENT_VALIDATION_RULES: Record<string, BusinessRule[]> = {
  // Research agents
  'research': [
    {
      name: 'has_sources',
      condition: (data) => data?.sources && Array.isArray(data.sources) && data.sources.length > 0,
      message: 'Research must include sources',
      severity: 'error',
      suggestion: 'Add source citations to research output'
    },
    {
      name: 'reasonable_length',
      condition: (data) => !data?.content || data.content.length < 100000,
      message: 'Research content too long',
      severity: 'warning',
      suggestion: 'Summarize content to reduce length'
    }
  ],

  // Content agents
  'content': [
    {
      name: 'has_title',
      condition: (data) => data?.title && typeof data.title === 'string' && data.title.length > 3,
      message: 'Content must have a title',
      severity: 'fatal',
      suggestion: 'Add a clear, descriptive title'
    },
    {
      name: 'no_banned_phrases',
      condition: (data) => {
        const content = JSON.stringify(data).toLowerCase();
        const banned = ['get started', 'learn more', 'premium service'];
        return !banned.some(phrase => content.includes(phrase));
      },
      message: 'Content contains banned generic phrases',
      severity: 'error',
      suggestion: 'Use specific, brand-appropriate language'
    }
  ],

  // Automation agents
  'automation': [
    {
      name: 'has_success_indicator',
      condition: (data) => typeof data?.success === 'boolean',
      message: 'Automation must report success status',
      severity: 'fatal',
      suggestion: 'Add boolean success field to automation results'
    },
    {
      name: 'has_logs',
      condition: (data) => data?.logs && Array.isArray(data.logs),
      message: 'Automation should include execution logs',
      severity: 'warning',
      suggestion: 'Add logs array to track execution steps'
    }
  ]
};

// ============================================================================
// INTEGRATED VALIDATION PIPELINE
// ============================================================================

export interface ValidationPipelineConfig {
  schemaValidation: boolean;
  businessRules: boolean;
  customRules?: BusinessRule[];
}

export class ValidationPipeline {
  private schemaValidator: SchemaValidator;
  private businessValidator: BusinessRuleValidator;

  constructor() {
    this.schemaValidator = SchemaValidator.getInstance();
    this.businessValidator = new BusinessRuleValidator();
  }

  async validateAgentResult<T>(
    agentFamily: string,
    data: any,
    schema: z.ZodSchema<T>,
    config: ValidationPipelineConfig = {
      schemaValidation: true,
      businessRules: true
    }
  ): Promise<ValidationResult> {
    const results: ValidationResult[] = [];

    // Schema validation
    if (config.schemaValidation) {
      const schemaResult = await this.schemaValidator.validate(data, schema);
      results.push(schemaResult);
    }

    // Business rule validation
    if (config.businessRules) {
      const agentRules = AGENT_VALIDATION_RULES[agentFamily] || [];
      if (config.customRules) {
        agentRules.push(...config.customRules);
      }

      this.businessValidator.addRules(agentRules);
      const businessResult = await this.businessValidator.validate(data);
      results.push(businessResult);
    }

    // Combine results
    const combined: ValidationResult = {
      isValid: results.every(r => r.isValid),
      isFatal: results.some(r => r.isFatal),
      errors: results.flatMap(r => r.errors),
      warnings: results.flatMap(r => r.warnings),
      sanitized: results.find(r => r.sanitized)?.sanitized,
      metadata: {
        validatedAt: new Date().toISOString(),
        schemaVersion: '1.0.0',
        validationTime: results.reduce((sum, r) => sum + r.metadata.validationTime, 0)
      }
    };

    return combined;
  }
}

// Export singleton instances
export const schemaValidator = SchemaValidator.getInstance();
export const validationPipeline = new ValidationPipeline();