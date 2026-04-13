// src/lib/pipelines/typed-pipeline.ts - Core Typed Pipeline
// Fixes: Vision failure, context loss, fake scores

import { extractBrandFromUrl } from '../skills/skill-brand-normalizer';
import { analyzeImageWithFallback } from '../skills/skill-vision-fix';
import { runStrategySkill } from '../skills/skill-page-strategy';
import { runCopySkill } from '../skills/skill-copywriter';
import { runDesignFix } from '../skills/skill-design-fix';
import { renderLandingPageFix } from '../skills/skill-renderer-fix';
import { validateHardGates } from '../skills/skill-validation';
import { Brand, AdVision, PageStrategy, VoiceCopy, DesignDirection } from '../schemas/skill-schemas';

// ========== CORE TYPES ==========
export type PipelineInput = {
  imageUrl?: string;
  adText?: string;
  targetUrl: string;
};

export type PipelineContext = {
  input: PipelineInput;
  brand: Brand | null;
  vision: AdVision | null;
  strategy: PageStrategy | null;
  copy: VoiceCopy | null;
  design: DesignDirection | null;
};

export type PipelineResult = {
  success: boolean;
  html: string;
  errors: string[];
  context: PipelineContext;
  validated: boolean;
};

// ========== STAGE 1: CRITICAL EXTRACTION ==========
async function extractCritical(input: PipelineInput): Promise<PipelineContext> {
  console.log('[Stage 1] Brand + Vision extraction...');
  
  // Extract brand (fail fast)
  const brand = await extractBrandFromUrl(input.targetUrl);
  if (!brand || !brand.name || brand.name.length < 2) {
    throw new Error('CRITICAL: Brand extraction failed');
  }
  
  // Vision with proper fallback - uses image colors in output
  const vision = await analyzeImageWithFallback(input.imageUrl, input.adText, brand.category);
  
  console.log('[Stage 1] Brand:', brand.name, '| Vision:', vision.status, vision.ctaSignals?.[0]);
  
  return {
    input,
    brand,
    vision,
    strategy: null,
    copy: null,
    design: null
  };
}

// ========== STAGE 2: PLANNING ==========
async function planPage(ctx: PipelineContext): Promise<PipelineContext> {
  console.log('[Stage 2] Planning...');
  
  const strategy = runStrategySkill(ctx.brand!, ctx.vision!);
  console.log('[Stage 2] Strategy:', strategy.narrativeStyle);
  
  return { ...ctx, strategy };
}

// ========== STAGE 3: COPY WITH VISION CONTEXT ==========
async function generateCopy(ctx: PipelineContext): Promise<PipelineContext> {
  console.log('[Stage 3] Copy generation...');
  
  const copy = runCopySkill(ctx.brand!, ctx.vision!, ctx.strategy!);
  console.log('[Stage 3] Headline:', copy.hero?.headline?.substring(0, 40));
  
  return { ...ctx, copy };
}

// ========== STAGE 4: DESIGN WITH VISION COLORS ==========
async function generateDesign(ctx: PipelineContext): Promise<PipelineContext> {
  console.log('[Stage 4] Design with vision colors...');
  
  // Passes vision colors to design
  const design = runDesignFix(ctx.brand!, ctx.vision!, ctx.strategy!);
  console.log('[Stage 4] Design:', design.artDirection, '| Accent:', design.palette.accent);
  
  return { ...ctx, design };
}

// ========== STAGE 5: HARD VALIDATION ==========
function runValidation(ctx: PipelineContext): { pass: boolean; errors: string[] } {
  console.log('[Stage 5] Hard validation...');
  return validateHardGates(ctx);
}

// ========== STAGE 6: RENDER ==========
async function render(ctx: PipelineContext): Promise<string> {
  console.log('[Stage 6] Rendering...');
  return renderLandingPageFix(ctx.brand!, ctx.copy!, ctx.design!);
}

// ========== MASTER PIPELINE ==========
export async function runTypedPipeline(input: PipelineInput): Promise<PipelineResult> {
  const errors: string[] = [];
  let ctx: PipelineContext = {
    input,
    brand: null,
    vision: null,
    strategy: null,
    copy: null,
    design: null
  };
  
  try {
    // Stage 1
    ctx = await extractCritical(input);
    
    // Stage 2
    ctx = await planPage(ctx);
    
    // Stage 3
    ctx = await generateCopy(ctx);
    
    // Stage 4
    ctx = await generateDesign(ctx);
    
    // Stage 5 - FAIL FAST
    const validation = runValidation(ctx);
    if (!validation.pass) {
      console.log('[VALIDATION FAILED]', validation.errors);
      return {
        success: false,
        html: '',
        errors: validation.errors,
        context: ctx,
        validated: false
      };
    }
    
    // Stage 6
    const html = await render(ctx);
    
    return {
      success: true,
      html,
      errors: [],
      context: ctx,
      validated: true
    };
    
  } catch (e: any) {
    console.error('[PIPELINE ERROR]', e.message);
    return {
      success: false,
      html: '',
      errors: [e.message],
      context: ctx,
      validated: false
    };
  }
}

export { runTypedPipeline as masterPipeline };