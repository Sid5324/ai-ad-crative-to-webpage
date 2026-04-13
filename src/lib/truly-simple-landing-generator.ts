// src/lib/truly-simple-landing-generator.ts - Simplified generator with state machine
import { extractBrandFromUrl } from './skills/skill-brand-normalizer';
import { analyzeImageWithFallback } from './skills/skill-vision-fix';
import { runCopySkill } from './skills/skill-copywriter';
import { runDesignFix } from './skills/skill-design-fix';
import { renderLandingPageFix } from './skills/skill-renderer-fix';
import { runQASkill } from './skills/skill-quality-critic';
import { Brand, AdVision, PageStrategy, VoiceCopy, DesignDirection, QA } from './schemas/skill-schemas';
import { 
  LandingPageStateMachine, 
  PipelineState, 
  createStateMachine,
  ExecutionResult 
} from './state-machine';

export interface LandingPageInput {
  adImage?: string;
  adText?: string;
  category: string;
  targetUrl: string;
}

export interface LandingPageOutput {
  success: boolean;
  html: string;
  spec: {
    brand: Brand;
    ad: AdVision;
    strategy: PageStrategy;
    copy: VoiceCopy;
    design: DesignDirection;
  };
  metadata: {
    generated: string;
    duration: number;
    skillsUsed: string[];
    version: string;
    state?: string;
    qaScore?: number;
    stateHistory?: Array<{ state: string; time: number }>;
    errors?: Array<{ code: string; message: string }>;
  };
}

// Simple strategy generator - no complex agent needed
function createSimpleStrategy(brand: Brand, ad: AdVision): PageStrategy {
  const category = brand.category;
  const audience = brand.audience;

  // Finance + premium = trust-heavy
  if (category === 'Finance' || ad.visualMood?.includes('premium')) {
    return {
      narrativeStyle: 'trust-heavy-fintech',
      layoutMode: 'dark-premium',
      sectionPlan: [
        { type: 'hero', priority: 10, required: true },
        { type: 'stats-bar', priority: 9, required: true },
        { type: 'benefits', priority: 8, required: true },
        { type: 'trust-bar', priority: 7, required: true },
        { type: 'cta', priority: 10, required: true }
      ],
      conversionPath: {
        primary: ad.ctaSignals?.[0] || 'Apply Now',
        secondary: 'Learn More'
      },
      confidence: 0.9
    };
  }

  // Food/restaurant = product-benefit
  if (category === 'Food & Dining') {
    return {
      narrativeStyle: 'product-benefit',
      layoutMode: 'centered-hero',
      sectionPlan: [
        { type: 'hero', priority: 10, required: true },
        { type: 'stats-bar', priority: 9, required: true },
        { type: 'benefits', priority: 8, required: true },
        { type: 'cta', priority: 10, required: true }
      ],
      conversionPath: {
        primary: ad.ctaSignals?.[0] || 'Order Now',
        secondary: 'View Menu'
      },
      confidence: 0.9
    };
  }

  // B2B/SaaS = editorial-premium
  if (audience === 'b2b' || audience === 'merchant' || category === 'SaaS') {
    return {
      narrativeStyle: 'editorial-premium',
      layoutMode: 'split-hero',
      sectionPlan: [
        { type: 'hero', priority: 10, required: true },
        { type: 'stats-bar', priority: 9, required: true },
        { type: 'benefits', priority: 8, required: true },
        { type: 'trust-bar', priority: 7, required: true },
        { type: 'cta', priority: 10, required: true }
      ],
      conversionPath: {
        primary: ad.ctaSignals?.[0] || 'Start Free Trial',
        secondary: 'Schedule Demo'
      },
      confidence: 0.9
    };
  }

  // Default consumer
  return {
    narrativeStyle: 'product-benefit',
    layoutMode: 'centered-hero',
    sectionPlan: [
      { type: 'hero', priority: 10, required: true },
      { type: 'benefits', priority: 8, required: true },
      { type: 'cta', priority: 10, required: true }
    ],
    conversionPath: {
      primary: ad.ctaSignals?.[0] || 'Get Started',
      secondary: 'Learn More'
    },
    confidence: 0.8
  };
}

export async function generateTrulySimpleLandingPage(input: LandingPageInput): Promise<LandingPageOutput> {
  const startTime = Date.now();
  
  // Create state machine - tracks execution state with proper cancellation
  const sm = createStateMachine();
  console.log('[SimpleGenerator] State machine started:', sm.currentState);

  // ========== BRAND EXTRACTION ==========
  let brand: Brand;
  try {
    sm.transition(PipelineState.BRAND_EXTRACTING);
    console.log('[SimpleGenerator] Step 1: Extracting brand...');
    brand = await extractBrandFromUrl(input.targetUrl);
    
    // TERMINAL BRAND VALIDATION - confidence < 0.8 = STOP PIPELINE
    if (brand.confidence < 0.8) {
      sm.reject('BRAND_REJECTED', `Brand confidence ${brand.confidence.toFixed(2)} < 0.8 threshold`);
      return buildErrorOutput(sm, startTime);
    }

    // TERMINAL CATEGORY VALIDATION - generic categories = STOP PIPELINE
    const genericCategories = ['business', 'company', 'service', 'product'];
    if (genericCategories.includes(brand.category.toLowerCase())) {
      sm.reject('BRAND_REJECTED', `Category "${brand.category}" too generic`);
      return buildErrorOutput(sm, startTime);
    }
    
    sm.transition(PipelineState.BRAND_OK);
    console.log('[SimpleGenerator] Brand validated:', { name: brand.name, confidence: brand.confidence, category: brand.category });
  } catch (error) {
    sm.fail('BRAND_ERROR', error instanceof Error ? error.message : String(error));
    return buildErrorOutput(sm, startTime);
  }

  // ========== VISION ANALYZER ==========
  let adVision: AdVision;
  try {
    sm.transition(PipelineState.VISION_ANALYZING);
    console.log('[SimpleGenerator] Step 2: Analyzing ad...');
    adVision = await analyzeImageWithFallback(input.adImage, input.adText, input.category);
    
    if (!adVision || !adVision.visualMood) {
      sm.fail('VISION_ERROR', 'Vision analysis returned invalid result');
      return buildErrorOutput(sm, startTime);
    }
    
    sm.transition(PipelineState.VISION_OK);
    console.log('[SimpleGenerator] Vision analyzed:', { mood: adVision.visualMood });
  } catch (error) {
    sm.fail('VISION_ERROR', error instanceof Error ? error.message : String(error));
    return buildErrorOutput(sm, startTime);
  }

  // ========== STRATEGY ==========
  let strategy: PageStrategy;
  try {
    sm.transition(PipelineState.STRATEGY_BUILDING);
    console.log('[SimpleGenerator] Step 3: Creating strategy...');
    strategy = createSimpleStrategy(brand, adVision);
    sm.transition(PipelineState.STRATEGY_OK);
  } catch (error) {
    sm.fail('STRATEGY_ERROR', error instanceof Error ? error.message : String(error));
    return buildErrorOutput(sm, startTime);
  }

  // ========== COPYWRITER ==========
  let copy: VoiceCopy;
  try {
    sm.transition(PipelineState.COPY_WRITING);
    console.log('[SimpleGenerator] Step 4: Generating copy...');
    copy = runCopySkill(brand, adVision, strategy);
    
    // Validate copy output
    if (!copy.hero?.headline || copy.hero.headline.length < 10) {
      sm.reject('INVALID_COPY', 'Copy generation returned invalid result');
      return buildErrorOutput(sm, startTime);
    }
    
    sm.transition(PipelineState.COPY_OK);
  } catch (error) {
    sm.fail('COPY_ERROR', error instanceof Error ? error.message : String(error));
    return buildErrorOutput(sm, startTime);
  }

  // ========== DESIGN ==========
  let design: DesignDirection;
  try {
    sm.transition(PipelineState.DESIGN_CREATING);
    console.log('[SimpleGenerator] Step 5: Creating design...');
    design = runDesignFix(brand, adVision, strategy);
    sm.transition(PipelineState.DESIGN_OK);
  } catch (error) {
    sm.fail('DESIGN_ERROR', error instanceof Error ? error.message : String(error));
    return buildErrorOutput(sm, startTime);
  }

  // ========== QA GATE (BLOCKS RENDERING) ==========
  let qa: QA;
  try {
    sm.transition(PipelineState.QA_CHECKING);
    console.log('[SimpleGenerator] Step 6: Running QA gate...');
    qa = runQASkill(brand, copy, design);
    console.log(`[QA] Score: ${qa.score}, Passed: ${qa.passed}`);
    
    if (!qa.passed) {
      // QA_BLOCKED is terminal - do NOT continue to rendering
      const issues = qa.fatalIssues.concat(qa.issues.filter(i => i.severity === 'high').map(i => i.code));
      sm.qaBlocked(issues);
      return buildErrorOutput(sm, startTime);
    }
    
    sm.transition(PipelineState.QA_PASSED);
  } catch (error) {
    sm.fail('QA_ERROR', error instanceof Error ? error.message : String(error));
    return buildErrorOutput(sm, startTime);
  }

  // ========== RENDER (ONLY IF QA PASSED) ==========
  let html: string;
  try {
    sm.transition(PipelineState.RENDERING);
    console.log('[SimpleGenerator] Step 7: Rendering HTML (QA passed)...');
    html = renderLandingPageFix(brand, copy, design, qa);
    
    if (!html || html.length < 500) {
      sm.reject('INVALID_HTML', 'Rendering returned invalid HTML');
      return buildErrorOutput(sm, startTime);
    }
    
    sm.complete();
    const duration = Date.now() - startTime;
    console.log('[SimpleGenerator] Generation complete!', { duration, htmlLength: html.length });

    return {
      success: true,
      html,
      spec: { brand, ad: adVision, strategy, copy, design },
      metadata: {
        generated: new Date().toISOString(),
        qaScore: qa.score,
        state: sm.currentState,
        duration,
        skillsUsed: ['brand-normalizer', 'vision-analyzer', 'strategy-simple', 'copywriter', 'design-fix', 'renderer-fix'],
        version: 'truly-simple-v2.0'
      } as any
    };
  } catch (error) {
    sm.fail('RENDER_ERROR', error instanceof Error ? error.message : String(error));
    return buildErrorOutput(sm, startTime);
  }
}

// Helper to build error output with state info
function buildErrorOutput(sm: LandingPageStateMachine, startTime: number): LandingPageOutput {
  const state = sm.currentState;
  console.error('[SimpleGenerator] TERMINATED:', state, 'Errors:', sm.executionErrors.map(e => e.message).join('; '));
  
  // Determine success based on state type
  let success = false;
  if (state === PipelineState.COMPLETED) success = true;
  
  return {
    success,
    html: '',
    spec: null as any,
    metadata: {
      generated: new Date().toISOString(),
      state,
      stateHistory: sm.getHistory().map(h => ({ state: h.state, time: h.time - startTime })),
      errors: sm.executionErrors.map(e => ({ code: e.code, message: e.message })),
      duration: Date.now() - startTime,
      version: 'truly-simple-v2.0'
    } as any
  };
}