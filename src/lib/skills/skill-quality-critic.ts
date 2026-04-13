// src/lib/skills/skill-quality-critic.ts - Quality Critic Skill
import { QA, Brand, VoiceCopy, DesignDirection } from '../schemas/skill-schemas';
import { BANNED_PHRASES, BANNED_CTAS } from '../schemas/skill-schemas';

// Strict quality check -BINARY GATE (95% or fail)
export function runQASkill(
  brand: Brand, 
  copy: VoiceCopy, 
  design: DesignDirection
): QA {
  console.log('[QA] Running STRICT quality check...', { brand: brand.name, confidence: brand.confidence });
  
  const issues: QA['issues'] = [];
  let score = 100;
  
  // ========== STRICT BRAND CHECKS ==========
  
  // Brand name is placeholder/fallback - FAIL
  if (brand.name === 'Business Name' || brand.name.includes('Business') || brand.name.includes('Website at')) {
    score -= 50;
    issues.push({
      code: 'PLACEHOLDER_BRAND',
      severity: 'fatal',
      message: 'Brand name is placeholder - cannot render',
      field: 'brand.name',
      修复: 'normalize-brand'
    });
  }
  
  // Brand confidence too low - FAIL 
  if (brand.confidence < 0.7) {
    score -= 30;
    issues.push({
      code: 'LOW_CONFIDENCE',
      severity: 'fatal',
      message: `Brand confidence too low: ${brand.confidence}`,
      field: 'brand.confidence',
      修复: 'normalize-brand'
    });
  }
  
  // Category is generic Business - WARN
  if (brand.category === 'Business' || brand.category === '') {
    score -= 20;
    issues.push({
      code: 'GENERIC_CATEGORY',
      severity: 'high',
      message: 'Category not detected',
      field: 'brand.category',
      修复: 'normalize-brand'
    });
  }
  
  // ========== COPY CHECKS ==========
  
  const copyText = JSON.stringify(copy).toLowerCase();
  
  // ========== CATEGORY MISMATCH CHECK ==========
  const isFinanceCopy = copyText.includes('bank') || copyText.includes('credit') || copyText.includes('loan') || copyText.includes('invest');
  const isFinanceBrand = brand.category === 'Finance';
  
  // Non-finance brand with finance copy = HALLUCINATION
  if (!isFinanceBrand && isFinanceCopy && brand.confidence > 0.5) {
    score -= 30;
    issues.push({
      code: 'CATEGORY_HALLUCINATION',
      severity: 'fatal',
      message: `Finance copy for non-finance brand: ${brand.category}`,
      field: 'copy',
      修复: 'tighten-copy'
    });
  }
  
  // ========== PLACEHOLDER CHECK ==========
  if (copy.hero?.subheadline?.includes('Website at') || copy.hero?.subheadline?.includes('website at')) {
    score -= 40;
    issues.push({
      code: 'PLACEHOLDER_COPY',
      severity: 'fatal',
      message: 'Using placeholder description',
      field: 'copy.hero.subheadline',
      修复: 'tighten-copy'
    });
  }
  
  // ========== GENERIC COPY CHECK ==========
  const isGeneric = copyText.includes('bank-grade') || copyText.includes('industry-leading') || copyText.includes('trusted by thousands');
  if (isGeneric && brand.confidence > 0.6) {
    score -= 25;
    issues.push({
      code: 'GENERIC_HALLUCINATION',
      severity: 'high',
      message: 'Generic copied found - not brand specific',
      field: 'copy',
      修复: 'tighten-copy'
    });
  }
  
  // Banned phrases
  for (const phrase of BANNED_PHRASES) {
    if (copyText.includes(phrase)) {
      score -= 15;
      issues.push({
        code: 'BANNED_PHRASE',
        severity: 'high',
        message: `Generic phrase found: "${phrase}"`,
        field: 'copy',
        修复: 'tighten-copy'
      });
    }
  }
  
  // Banned CTAs
  for (const cta of BANNED_CTAS) {
    if (copy.hero?.primaryCta?.toLowerCase().includes(cta)) {
      score -= 10;
      issues.push({
        code: 'GENERIC_CTA',
        severity: 'medium',
        message: `Generic CTA: "${cta}"`,
        field: 'copy.hero.primaryCta',
        修复: 'rewrite-cta'
      });
    }
  }
  
  // Missing headline
  if (!copy.hero?.headline || copy.hero.headline.length < 10) {
    score -= 20;
    issues.push({
      code: 'MISSING_HEADLINE',
      severity: 'fatal',
      message: 'Missing or too short headline',
      field: 'copy.hero.headline',
      修复: 'rewrite-hero'
    });
  }
  
  // Missing benefits
  if (!copy.benefits || copy.benefits.length < 2) {
    score -= 15;
    issues.push({
      code: 'MISSING_BENEFITS',
      severity: 'high',
      message: 'Too few benefit sections',
      field: 'copy.benefits',
      修复: 'rewrite-hero'
    });
  }
  
  // ========== DESIGN CHECKS ==========
  
  // Using default/generic colors
  if (design.palette.primary === '#3b82f6' && design.artDirection === 'playful-modern') {
    score -= 5;
  }
  
  // ========== SCORE CALCULATION ==========
  
  score = Math.max(0, score);
  
  const fatalIssues = issues.filter(i => i.severity === 'fatal');
  const highIssues = issues.filter(i => i.severity === 'high');
  // Gate: 80+ score AND no fatal issues (allow 1 high issue if score >= 85)
  const passed = score >= 80 && fatalIssues.length === 0 && (highIssues.length === 0 || score >= 85);
  
  console.log('[QA] Score:', score, 'Issues:', issues.length, 'Passed:', passed);
  
  return {
    score,
    issues,
    passed,
    fatalIssues: fatalIssues.map(i => i.code),
    recommendations: generateRecommendations(issues, score)
  };
}

function generateRecommendations(issues: QA['issues'], score: number): string[] {
  const recs: string[] = [];
  
  if (score < 80) {
    recs.push('Improve overall copy quality');
  }
  
  const hasBrandIssue = issues.some(i => i.code.includes('BRAND'));
  if (hasBrandIssue) {
    recs.push('Normalize brand identity from URL');
  }
  
  const hasGenericPhrase = issues.some(i => i.code === 'BANNED_PHRASE');
  if (hasGenericPhrase) {
    recs.push('Rewrite copy to remove generic phrases');
  }
  
  const hasCtaIssue = issues.some(i => i.code === 'GENERIC_CTA');
  if (hasCtaIssue) {
    recs.push('Use brand-specific CTAs');
  }
  
  return recs;
}