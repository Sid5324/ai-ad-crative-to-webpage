// packages/orchestrator/validator.ts - Validation and repair layer
import { 
  BrandAnalysisSchema, 
  CopySpecSchema, 
  DesignTokensSchema,
  FinalPageSpecSchema,
  ValidationIssueSchema,
  type BrandAnalysis,
  type CopySpec,
  type DesignTokens,
  type ValidationIssue 
} from './schemas';

// ============== Clean Functions ==============

/**
 * Strip markdown code fences and JSON prefixes from LLM output
 */
export function cleanLLMOutput(raw: string): string {
  return raw
    .replace(/^```(?:json|markdown|txt)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^Here'?s?\s+the\s+JSON:\s*/i, '')
    .replace(/^Output:\s*/i, '')
    .trim();
}

/**
 * Attempt to parse JSON safely
 */
export function safeJsonParse(raw: unknown): unknown {
  if (typeof raw === 'object' && raw !== null) return raw;
  if (typeof raw !== 'string') return raw;
  
  const cleaned = cleanLLMOutput(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    return cleaned; // Return cleaned string if parse fails
  }
}

// ============== Validation Logic ==============

const TEMPLATE_LEAKS = [
  'business name', 'company name', 'brand name',
  'get started', 'learn more', 'start free trial',
  'grow your business', 'premium service',
];

/**
 * Check if a string contains template leak or code fence
 */
export function hasTemplateLeak(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const v = value.toLowerCase().trim();
  if (v.startsWith('```json') || v.startsWith('```')) return true;
  return TEMPLATE_LEAKS.some(leak => v === leak || v.includes(leak.toLowerCase()));
}

/**
 * Scan an object tree for template leaks
 */
export function scanForLeaks(obj: unknown, path = ''): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (typeof obj === 'string') {
    if (hasTemplateLeak(obj)) {
      issues.push({
        code: 'TEMPLATE_LEAK',
        message: `Template leak detected at ${path}: "${obj.substring(0, 50)}"`,
        field: path,
        severity: 'fatal',
      });
    }
    if (obj.includes('```')) {
      issues.push({
        code: 'CODE_FENCE',
        message: `Code fence in output at ${path}`,
        field: path,
        severity: 'fatal',
      });
    }
    return issues;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => issues.push(...scanForLeaks(v, `${path}[${i}]`)));
    return issues;
  }
  
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      issues.push(...scanForLeaks(v, path ? `${path}.${k}` : k));
    }
  }
  
  return issues;
}

/**
 * Validate brand analysis output
 */
export function validateBrandAnalysis(input: unknown): { 
  ok: boolean; 
  data?: BrandAnalysis; 
  issues: ValidationIssue[] 
} {
  const issues = scanForLeaks(input, 'brand');
  
  try {
    const parsed = BrandAnalysisSchema.parse(input);
    return { ok: true, data: parsed, issues };
  } catch (e) {
    issues.push({
      code: 'SCHEMA_PARSE_ERROR',
      message: String(e),
      severity: 'fatal',
    });
    return { ok: false, issues };
  }
}

/**
 * Validate copy spec output
 */
export function validateCopySpec(input: unknown): { 
  ok: boolean; 
  data?: CopySpec; 
  issues: ValidationIssue[] 
} {
  const issues = scanForLeaks(input, 'copy');
  
  // Try to clean and parse JSON strings
  let parsedInput = input;
  if (typeof input === 'string') {
    const cleaned = cleanLLMOutput(input);
    try {
      parsedInput = JSON.parse(cleaned);
    } catch {
      issues.push({
        code: 'JSON_PARSE_FAILED',
        message: 'Could not parse copy as JSON',
        severity: 'fatal',
      });
      return { ok: false, issues };
    }
  }
  
  try {
    const parsed = CopySpecSchema.parse(parsedInput);
    return { ok: true, data: parsed, issues };
  } catch (e) {
    issues.push({
      code: 'SCHEMA_PARSE_ERROR',
      message: String(e),
      severity: 'fatal',
    });
    return { ok: false, issues };
  }
}

/**
 * Validate design tokens
 */
export function validateDesignTokens(input: unknown): { 
  ok: boolean; 
  data?: DesignTokens; 
  issues: ValidationIssue[] 
} {
  const issues: ValidationIssue[] = [];
  
  let parsedInput = input;
  if (typeof input === 'string') {
    const cleaned = cleanLLMOutput(input);
    try {
      parsedInput = JSON.parse(cleaned);
    } catch {
      issues.push({
        code: 'JSON_PARSE_FAILED',
        message: 'Could not parse design tokens as JSON',
        severity: 'fatal',
      });
      return { ok: false, issues };
    }
  }
  
  try {
    const parsed = DesignTokensSchema.parse(parsedInput);
    return { ok: true, data: parsed, issues };
  } catch (e) {
    issues.push({
      code: 'SCHEMA_PARSE_ERROR',
      message: String(e),
      severity: 'fatal',
    });
    return { ok: false, issues };
  }
}

/**
 * Complete validation of all pipeline outputs
 */
export interface PipelineValidationResult {
  ok: boolean;
  brand?: BrandAnalysis;
  copy?: CopySpec;
  design?: DesignTokens;
  issues: ValidationIssue[];
  
  // Status classification
  isValid: boolean;
  isRepairable: boolean;
  isFatal: boolean;
}

/**
 * Validate all collected pipeline outputs
 */
export function validatePipelineOutputs(context: {
  brand?: unknown;
  copy?: unknown;
  design?: unknown;
}): PipelineValidationResult {
  const allIssues: ValidationIssue[] = [];
  
  // Validate brand
  const brandResult = context.brand ? validateBrandAnalysis(context.brand) : { ok: false, issues: [{ code: 'MISSING', message: 'No brand data', severity: 'fatal' as const }] };
  if (!brandResult.ok) allIssues.push(...brandResult.issues);
  
  // Validate copy
  const copyResult = context.copy ? validateCopySpec(context.copy) : { ok: false, issues: [{ code: 'MISSING', message: 'No copy data', severity: 'fatal' as const }] };
  if (!copyResult.ok) allIssues.push(...copyResult.issues);
  
  // Validate design
  const designResult = context.design ? validateDesignTokens(context.design) : { ok: false, issues: [{ code: 'MISSING', message: 'No design data', severity: 'fatal' as const }] };
  if (!designResult.ok) allIssues.push(...designResult.issues);
  
  // Classify severity
  const hasFatal = allIssues.some(i => i.severity === 'fatal');
  const hasWarning = allIssues.some(i => i.severity === 'warning');
  
  return {
    ok: !hasFatal,
    brand: brandResult.data,
    copy: copyResult.data,
    design: designResult.data,
    issues: allIssues,
    isValid: !hasFatal && !hasWarning,
    isRepairable: hasWarning || allIssues.length > 0,
    isFatal: hasFatal,
  };
}

// ============== Publish Gate Integration ==============

export interface PublishGateInput {
  brand?: BrandAnalysis;
  copy?: CopySpec;
  design?: DesignTokens;
  qualityScore?: number;
  fallbackCount?: number;
}

/**
 * Evaluate if content is publishable
 */
export function evaluateForPublish(input: PublishGateInput): {
  canPublish: boolean;
  status: 'passed' | 'blocked' | 'warning';
  reasons: string[];
  qualityScore: number;
} {
  const reasons: string[] = [];
  let score = 100;
  
  // Check brand
  if (!input.brand?.name || hasTemplateLeak(input.brand.name)) {
    reasons.push('Invalid or placeholder brand name');
    score -= 40;
  }
  
  // Check hero copy for leaks
  const hero = input.copy?.hero;
  if (hero) {
    if (hasTemplateLeak(hero.headline)) {
      reasons.push('Hero headline is generic/template');
      score -= 25;
    }
    if (hasTemplateLeak(hero.subheadline)) {
      reasons.push('Hero subheadline is generic/template');
      score -= 15;
    }
    if (hasTemplateLeak(hero.primary_cta)) {
      reasons.push('Primary CTA is generic');
      score -= 10;
    }
  }
  
  // Check benefits
  if (!input.copy?.benefits || input.copy.benefits.length < 2) {
    reasons.push('Too few benefits');
    score -= 15;
  }
  
  // Check stats
  if (!input.copy?.stats || input.copy.stats.length < 2) {
    reasons.push('Too few stats');
    score -= 10;
  }
  
  // Factor in existing quality score
  if (input.qualityScore !== undefined) {
    score = Math.min(score, input.qualityScore);
  }
  
  // Factor in fallbacks
  if (input.fallbackCount && input.fallbackCount > 0) {
    score -= input.fallbackCount * 5;
  }
  
  score = Math.max(0, score);
  
  const canPublish = reasons.length === 0 && score >= 80;
  
  return {
    canPublish,
    status: canPublish ? 'passed' : (score >= 50 ? 'warning' : 'blocked'),
    reasons,
    qualityScore: score,
  };
}