// src/lib/validators/spec-validator.ts - Null-safe specification validator
import { PageSpec, PageSpecSchema } from '../schemas/page-schemas';

export type ValidationResult = {
  ok: boolean;
  data?: PageSpec;
  issues: string[];
  score: number;
  repairable: boolean;
};

export function validateSpec(spec: unknown): ValidationResult {
  const issues: string[] = [];
  let score = 100;
  let repairable = true;

  try {
    const parsed = PageSpecSchema.safeParse(spec);
    if (!parsed.success) {
      issues.push(`Schema validation failed: ${parsed.error.message}`);
      score -= 50;
      repairable = false;
      return { ok: false, issues, score, repairable };
    }

    const data = parsed.data;

    // ========== BRAND VALIDATION ==========
    if (data.brand.canonicalName.length > 50) {
      issues.push('Brand name suspiciously long - likely a tagline');
      score -= 20;
      repairable = true;
    }

    if (data.brand.confidence < 0.6) {
      issues.push('Low brand confidence');
      score -= 15;
      repairable = true;
    }

    // ========== CATEGORY VALIDATION ==========
    if (data.category.confidence < 0.6) {
      issues.push('Low category confidence');
      score -= 15;
      repairable = true;
    }

    // ========== CONTENT VALIDATION ==========
    const allText = [
      data.hero.eyebrow, data.hero.headline, data.hero.subheadline,
      data.hero.primaryCta,
      ...(data.hero.secondaryCta ? [data.hero.secondaryCta] : []),
      ...data.benefits.flatMap(b => [b.title, b.description]),
      ...data.stats.flatMap(s => [s.label, s.value]),
      ...(data.trustSignals || [])
    ];

    // Check for banned/generic phrases
    const genericPhrases = [
      'start', 'join', 'get', 'free', 'premium', 'best', 'world-class',
      'industry-leading', 'trusted by thousands', 'bank-grade'
    ];

    let genericCount = 0;
    for (const text of allText) {
      const lowerText = text.toLowerCase();
      for (const phrase of genericPhrases) {
        if (lowerText.includes(phrase)) {
          genericCount++;
          break; // Count each text once
        }
      }
    }

    if (genericCount > 3) {
      issues.push(`Too many generic phrases (${genericCount} detected)`);
      score -= Math.min(25, genericCount * 5);
      repairable = true;
    }

    // Check for missing content
    if (data.benefits.length < 3) {
      issues.push('Insufficient benefits');
      score -= 20;
      repairable = true;
    }

    if (data.stats.length < 2) {
      issues.push('Insufficient stats');
      score -= 10;
      repairable = true;
    }

    // ========== DESIGN VALIDATION ==========
    // Basic color validation (already done by regex, but check for defaults)
    if (data.designTokens.primaryColor === '#3b82f6') {
      issues.push('Using default primary color');
      score -= 5;
      repairable = true;
    }

    // ========== FATAL ISSUES ==========
    const fatalIssues = issues.filter(i =>
      i.includes('Schema validation failed') ||
      i.includes('Brand name suspiciously long')
    );

    if (fatalIssues.length > 0) {
      repairable = false;
    }

    const passed = score >= 75 && fatalIssues.length === 0;

    return {
      ok: passed,
      data: passed ? data : undefined,
      issues,
      score,
      repairable
    };

  } catch (error) {
    return {
      ok: false,
      issues: [`Validator crashed: ${String(error)}`],
      score: 0,
      repairable: false
    };
  }
}

// ========== REPAIR FUNCTIONS ==========
export function generateRepairPrompts(issues: string[], originalSpec: PageSpec): Array<{
  field: string;
  prompt: string;
}> {
  const repairs: Array<{field: string; prompt: string}> = [];

  for (const issue of issues) {
    if (issue.includes('generic phrases')) {
      repairs.push({
        field: 'copy',
        prompt: `Replace generic phrases like "premium", "best", "trusted" with specific, brand-relevant copy.`
      });
    }

    if (issue.includes('Brand name suspiciously long')) {
      repairs.push({
        field: 'brand.canonicalName',
        prompt: `Extract just the core brand name from: "${originalSpec.brand.canonicalName}". Remove location/descriptive text.`
      });
    }

    if (issue.includes('Low category confidence')) {
      repairs.push({
        field: 'category',
        prompt: `Review category "${originalSpec.category.primary}" with evidence: ${originalSpec.category.evidence.join(', ')}. Use 'other' if uncertain.`
      });
    }

    if (issue.includes('Insufficient benefits')) {
      repairs.push({
        field: 'benefits',
        prompt: `Add 3-4 specific benefits for a ${originalSpec.category.primary} business.`
      });
    }
  }

  return repairs;
}