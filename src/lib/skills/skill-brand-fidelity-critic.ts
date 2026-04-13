// src/lib/skills/skill-brand-fidelity-critic.ts - Brand Fidelity Critic
// Checks if output matches brand DNA and live site patterns
import { BrandVisualDNA } from './skill-brand-art-director';
import { Brand, VoiceCopy, DesignDirection } from '../schemas/skill-schemas';

interface FidelityIssue {
  code: string;
  message: string;
  severity: 'fatal' | 'high' | 'medium';
  fix: string;
}

interface FidelityResult {
  score: number;
  passed: boolean;
  issues: FidelityIssue[];
}

// Check generated page against brand DNA
export function runBrandFidelityCritic(
  brand: Brand,
  copy: VoiceCopy,
  design: DesignDirection,
  dna: BrandVisualDNA
): FidelityResult {
  console.log('[FidelityCritic] Checking brand alignment...');
  
  const issues: FidelityIssue[] = [];
  let deduct = 0;
  
  // 1. Check for banned section titles
  const sectionTitles = [
    copy.benefits?.[0]?.title || '',
    copy.trustSection?.headline || '',
    copy.finalCta?.headline || ''
  ];
  
  for (const title of sectionTitles) {
    for (const banned of dna.voice.bannedPhrases) {
      if (title.toLowerCase().includes(banned.toLowerCase())) {
        deduct += 15;
        issues.push({
          code: 'BANNED_TITLE',
          message: `Section uses banned phrase: "${title}"`,
          severity: 'fatal',
          fix: 'Use brand-authentic section title'
        });
      }
    }
  }
  
  // 2. Check typography (should not be all Inter)
  const typography = design.typography;
  // Check if using generic fonts
  const isGenericFont = typography?.display === 'Inter' && typography?.body === 'Inter';
  if (isGenericFont) {
    deduct += 10;
    issues.push({
      code: 'GENERIC_TYPOGRAPHY',
      message: 'Typography too generic - missing display font',
      severity: 'medium',
      fix: 'Add display font for headlines'
    });
  }
  
  // 3. Check layout pattern (generic 3-card grid)
  if (copy.benefits?.length === 3 && design.layout?.cardStyle === 'flat') {
    deduct += 10;
    issues.push({
      code: 'GENERIC_LAYOUT',
      message: 'Generic SaaS 3-card feature grid detected',
      severity: 'medium',
      fix: 'Use varied card sizes or masonry layout'
    });
  }
  
  // 4. Check for motion
  if (!design.motion || design.motion?.intensity === 'none') {
    deduct += 5;
    issues.push({
      code: 'NO_MOTION',
      message: 'Missing motion/delight layer',
      severity: 'medium',
      fix: 'Add hover effects or transitions'
    });
  }
  
  // 5. Check hero visual device
  const heroSection = 'hero';
  // If only gradient used (would check in actual renderer output)
  
  // 6. Check headline brand alignment
  const headline = copy.hero?.headline || '';
  const headlineKeywords = ['credit', 'club', 'cashback', 'reward', 'member'];
  const hasBrandKeyword = headlineKeywords.some(k => headline.toLowerCase().includes(k));
  if (!hasBrandKeyword) {
    deduct += 10;
    issues.push({
      code: 'OFF_BRAND_HEADLINE',
      message: 'Headline not aligned to brand proposition',
      severity: 'high',
      fix: 'Include brand-specific keyword in headline'
    });
  }
  
  // 7. Verify brand color usage
  const accent = design.palette?.accent;
  const avoidColors = dna.colorSystem?.avoid || [];
  for (const badColor of avoidColors) {
    if (accent?.toLowerCase().includes(badColor.toLowerCase())) {
      deduct += 10;
      issues.push({
        code: 'BAD_COLOR',
        message: `Using brand-avoided color: ${accent}`,
        severity: 'high',
        fix: 'Use brand accent colors'
      });
    }
  }
  
  // 8. Check for uniqueness vs generic templates
  const isAllGeneric = 
    design.artDirection === 'playful-modern' && 
    design.palette?.primary === '#1e293b' &&
    design.palette?.accent === '#3b82f6';
    
  if (isAllGeneric) {
    deduct += 15;
    issues.push({
      code: 'TEMPLATE_PATTERN',
      message: 'Detected generic template pattern',
      severity: 'high',
      fix: 'Apply brand-specific styling'
    });
  }
  
  const finalScore = Math.max(0, 100 - deduct);
  const passed = finalScore >= 75 && !issues.some(i => i.severity === 'fatal');
  
  console.log('[FidelityCritic] Score:', finalScore, 'Issues:', issues.length, 'Passed:', passed);
  
  return {
    score: finalScore,
    passed,
    issues
  };
}