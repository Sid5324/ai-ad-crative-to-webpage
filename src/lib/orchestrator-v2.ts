// src/lib/orchestrator-v2.ts - Master Orchestrator with 11 Skills (Enhanced)
import { extractBrandFromUrl } from './skills/skill-brand-normalizer';
import { runAdVisionSkill } from './skills/skill-ad-vision';
import { runStrategySkill } from './skills/skill-page-strategy';
import { runCopySkill } from './skills/skill-copywriter';
import { runDesignSkill } from './skills/skill-design-director';
import { runBrandArtDirector, validateBrandVoice, BrandVisualDNA } from './skills/skill-brand-art-director';
import { runBrandFidelityCritic } from './skills/skill-brand-fidelity-critic';
import { runSceneComposer, refineCopyForBlueprint } from './skills/skill-scene-composer';
import { runQASkill } from './skills/skill-quality-critic';
import { runRepairSkill } from './skills/skill-repair-editor';
import { renderLandingPage } from './skills/skill-renderer';
import { Brand, AdVision, PageStrategy, VoiceCopy, DesignDirection, QA } from './schemas/skill-schemas';

interface OrchestratorInput {
  url: string;
  adInput: string;
}

interface OrchestratorOutput {
  success: boolean;
  html: string;
  spec: {
    brand: Brand;
    ad: AdVision;
    strategy: PageStrategy;
    copy: VoiceCopy;
    design: DesignDirection;
    artDNA?: BrandVisualDNA;
  };
  quality: {
    score: number;
    passed: boolean;
    issues: Array<{ code: string; severity: string; message: string }>;
  };
  metadata: {
    generated: string;
    duration: number;
    skillsUsed: string[];
    version: string;
  };
}

// Master orchestrator - runs all skills with brand fidelity
export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const startTime = Date.now();
  const skillsUsed: string[] = [];
  
  console.log('🚀 Starting 11-skill orchestrator (with brand art direction)...');
  console.log('  URL:', input.url);
  console.log('  Ad:', input.adInput?.substring(0, 50));
  
  try {
    // ========== SKILL 1: BRAND NORMALIZER ==========
    console.log('\n[1/11] Brand Normalizer...');
    const brand = await extractBrandFromUrl(input.url);
    skillsUsed.push('brand-normalizer');
    console.log('  →', brand.name, brand.category);
    
    // ========== SKILL 2: AD VISION READER ==========
    console.log('\n[2/11] Ad Vision Reader...');
    const ad = await runAdVisionSkill(input.adInput, brand.category);
    skillsUsed.push('ad-vision-reader');
    console.log('  →', ad.status, ad.ctaSignals?.[0]);
    
    // ========== SKILL 3: PAGE STRATEGIST ==========
    console.log('\n[3/11] Page Strategist...');
    const strategy = runStrategySkill(brand, ad);
    skillsUsed.push('page-strategist');
    console.log('  →', strategy.narrativeStyle, strategy.layoutMode);
    
    // ========== SKILL 4: VOICE COPYWRITER ==========
    console.log('\n[4/11] Voice Copywriter...');
    let copy = runCopySkill(brand, ad, strategy);
    skillsUsed.push('voice-copywriter');
    console.log('  →', copy.hero.headline?.substring(0, 40));
    
    // ========== SKILL 5: DESIGN DIRECTOR ==========
    console.log('\n[5/11] Design Director...');
    const design = runDesignSkill(brand, ad, strategy);
    skillsUsed.push('design-director');
    console.log('  →', design.artDirection, design.palette.accent);
    
    // ========== SKILL 6: BRAND ART DIRECTOR (NEW) ==========
    console.log('\n[6/11] Brand Art Director (DNA)...');
    const artDNA = runBrandArtDirector(brand, ad, strategy);
    skillsUsed.push('brand-art-director');
    console.log('  →', artDNA.artDirection.aesthetic);
    
    // ========== SKILL 7: SCENE COMPOSER (NEW) ==========
    console.log('\n[7/11] Scene Composer...');
    const blueprint = runSceneComposer(brand, copy, design, artDNA);
    console.log('  → Hero composition:', blueprint.hero.composition);
    
    // Apply scene-based copy refinement
    copy = refineCopyForBlueprint(copy, blueprint, artDNA);
    skillsUsed.push('scene-composer');
    console.log('  → Refined headline:', copy.hero.headline?.substring(0, 40));
    
    // ========== SKILL 8: QUALITY CRITIC (Pre) ==========
    console.log('\n[8/11] Quality Critic (pre-check)...');
    const qaPre = runQASkill(brand, copy, design);
    skillsUsed.push('quality-critic');
    console.log('  → Score:', qaPre.score, 'Issues:', qaPre.issues.length);
    
    // ========== SKILL 9: BRAND FIDELITY CRITIC (NEW) ==========
    console.log('\n[9/11] Brand Fidelity Critic...');
    const fidelity = runBrandFidelityCritic(brand, copy, design, artDNA);
    skillsUsed.push('brand-fidelity-critic');
    console.log('  → Fidelity Score:', fidelity.score, 'Issues:', fidelity.issues.length);
    
    // ========== SKILL 10: REPAIR (if needed) ==========
    let finalBrand = brand;
    let finalCopy = copy;
    let finalDesign = design;
    
    const needsRepair = !qaPre.passed || !fidelity.passed;
    if (needsRepair) {
      console.log('\n[10/11] Repair Editor (fixing issues)...');
      const repairResult = runRepairSkill(brand, copy, design, qaPre);
      finalBrand = repairResult.brand;
      finalCopy = repairResult.copy;
      finalDesign = repairResult.design;
      skillsUsed.push('repair-editor');
      console.log('  → Fixed:', repairResult.repair.regeneratedFields.join(', '));
    } else {
      skillsUsed.push('repair-skipped');
    }
    
    // ========== SKILL 11: RENDERER ==========
    console.log('\n[11/11] Component Composer (Renderer)...');
    const html = renderLandingPage(finalBrand, finalCopy, finalDesign);
    skillsUsed.push('component-composer');
    
    // ========== FINAL QA ==========
    console.log('\n[FINAL] Quality Critic (final check)...');
    const qaFinal = runQASkill(finalBrand, finalCopy, finalDesign);
    
    // Combine scores: quality (60%) + fidelity (40%)
    const combinedScore = Math.round((qaFinal.score * 0.6) + (fidelity.score * 0.4));
    const passed = combinedScore >= 80 && qaFinal.passed;
    
    const duration = Date.now() - startTime;
    console.log('\n✅ Orchestrator complete in', duration + 'ms');
    console.log('   Final Score:', combinedScore, '(QA:', qaFinal.score, '+ Fidelity:', fidelity.score, ')');
    
    return {
      success: passed,
      html,
      spec: {
        brand: finalBrand,
        ad,
        strategy,
        copy: finalCopy,
        design: finalDesign,
        artDNA
      },
      quality: {
        score: combinedScore,
        passed,
        issues: [
          ...qaFinal.issues.map(i => ({ code: i.code, severity: i.severity, message: i.message })),
          ...fidelity.issues.map(i => ({ code: i.code, severity: i.severity, message: i.message }))
        ]
      },
      metadata: {
        generated: new Date().toISOString(),
        duration,
        skillsUsed,
        version: '2.1.0' // With brand art direction
      }
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Orchestrator error:', error);
    
    return {
      success: false,
      html: '',
      spec: {
        brand: { name: 'Error', tagline: '', category: 'Business', description: '', audience: 'consumer', tone: ['Professional'], colors: { primary: '#000', accent: '#Gold' }, confidence: 0 },
        ad: { status: 'unavailable', visualMood: [], audienceSignals: [], ctaSignals: [], confidence: 0 },
        strategy: { narrativeStyle: 'product-benefit', layoutMode: 'hero-stats-features-cta', sectionPlan: [], conversionPath: { primary: 'Get Started' }, confidence: 0 },
        copy: { hero: { eyebrow: '', headline: 'Error', subheadline: '', primaryCta: 'Get Started' }, benefits: [], finalCta: { headline: '', subheadline: '', button: 'Get Started' }, voice: 'default' },
        design: { artDirection: 'playful-modern', palette: { bg: '#000', surface: '#111', text: '#fff', primary: '#000', accent: '#Gold' }, typography: { display: 'Inter', body: 'Inter', scale: 'balanced' }, layout: { heroStyle: 'split', sectionSpacing: 'balanced', cardStyle: 'soft' }, motion: { intensity: 'none', style: 'fade' }, density: 'comfortable' }
      },
      quality: {
        score: 0,
        passed: false,
        issues: [{ code: 'ERROR', severity: 'fatal', message: String(error) }]
      },
      metadata: {
        generated: new Date().toISOString(),
        duration,
        skillsUsed,
        version: '2.1.0'
      }
    };
  }
}

export { runOrchestrator as masterOrchestrator };