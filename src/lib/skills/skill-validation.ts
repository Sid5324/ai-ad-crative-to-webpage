// src/lib/skills/skill-validation.ts - Hard validation gates
import { PipelineContext } from '../pipelines/typed-pipeline';

// Returns errors that MUST be fixed
export function validateHardGates(ctx: PipelineContext): { pass: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. Brand required
  if (!ctx.brand?.name || ctx.brand.name.length < 2) {
    errors.push('MISSING_BRAND');
  }
  
  // 2. Vision failed without fallback
  if (!ctx.vision?.ctaSignals?.[0]) {
    errors.push('MISSING_VISION_CTA');
  }
  
  // 3. Copy empty
  if (!ctx.copy?.hero?.headline || ctx.copy.hero.headline.length < 5) {
    errors.push('MISSING_HEADLINE');
  }
  
  // 4. Design invalid
  if (!ctx.design?.palette?.accent) {
    errors.push('MISSING_DESIGN');
  }
  
  // 5. Banned phrases in copy - only block most egregious
  const allCopy = JSON.stringify(ctx.copy).toLowerCase();
  const banned = ['get started'];
  for (const phrase of banned) {
    if (allCopy.includes(phrase)) {
      errors.push(`BANNED_PHRASE:${phrase}`);
    }
  }
  
  const pass = errors.length === 0;
  console.log('[Validation]', pass ? 'PASSED' : 'FAILED:', errors.join(', '));
  
  return { pass, errors };
}