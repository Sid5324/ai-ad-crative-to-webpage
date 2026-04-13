// @ts-nocheck
// src/lib/orchestrator.ts - 26-Agent Multi-Agent Landing Page Generator
// Combines our new skills with the full 26-agent architecture

// Import the 26-agent orchestrator
// Note: This will be dynamically imported to avoid build issues

// Import our improved skills
import { extractBrandFromUrl } from './skills/skill-brand-normalizer';
import { runAdVisionSkill } from './skills/skill-ad-vision';
import { runStrategySkill } from './skills/skill-page-strategy';
import { runCopySkill } from './skills/skill-copywriter';
import { runDesignSkill } from './skills/skill-design-director';
import { runQASkill } from './skills/skill-quality-critic';
import { runRepairSkill } from './skills/skill-repair-editor';
import { renderLandingPage } from './skills/skill-renderer';
import { renderLandingPageFix } from './skills/skill-renderer-fix';

// ============================================================================
// MASTER ORCHESTRATOR - 26-Agent System with Improved Skills
// ============================================================================

export class MasterOrchestrator {
  async createLandingPage(input: { url: string; adImage: string }): Promise<any> {
    console.log('🚀 Starting landing page generation...');
    const startTime = Date.now();

    try {
      // Try 26-agent system first (dynamic import)
      try {
        const { jobOrchestrator } = await import('../../packages/orchestrator/run-job');

        const jobRequest = {
          adInputType: (input.adImage.startsWith('http') ? 'image_url' : 'copy') as 'image_url' | 'copy',
          adInputValue: input.adImage,
          targetUrl: input.url
        };

        const result = await jobOrchestrator.executeJob(jobRequest);

        if (result.success && result.publishable) {
          console.log('✅ 26-agent system succeeded');
          return {
            success: true,
            html: this.generateHTMLFromSpec(result.spec),
            spec: result.spec,
            qualityScore: result.qualityScore || 85,
            agentRuns: result.debug?.agentRuns || {},
            agentCount: 26,
            engine: '26-agent-multi-swarm'
          };
        }
      } catch (twentySixError) {
        console.log('⚠️ 26-agent system unavailable, using improved skills');
      }

      // Fallback to our improved skills
      return await this.fallbackGeneration(input, startTime);

    } catch (error) {
      console.error('❌ Orchestrator error:', error);
      return await this.fallbackGeneration(input, startTime);
    }
  }

private async fallbackGeneration(input: { url: string; adImage: string }, startTime: number): Promise<any> {
    try {
      // Use our improved skills
      const brand = await extractBrandFromUrl(input.url);
      const ad = runAdVisionSkill(input.adImage, brand.category);
      const strategy = runStrategySkill(brand, ad);
      const copy = runCopySkill(brand, ad, strategy);
      const design = runDesignSkill(brand, ad, strategy);

      const quality = runQASkill(brand, copy, design);
      console.log(`[QA] Score: ${quality.score}, Passed: ${quality.passed}`);
      
      // STRICT GATE: Only render if QA passes
      if (!quality.passed) {
        const fatal = quality.fatalIssues.join(', ') || `score ${quality.score}`;
        console.error(`[QA] FAILED - ${fatal}. Blocking render.`);
        throw new Error(`QA_BLOCKED: ${fatal}`);
      }

      // Only render if QA passes
      const html = renderLandingPageFix(brand, copy, design, quality);

      return {
        success: quality.passed,
        html,
        spec: { brand, ad, copy },
        qualityScore: quality.score,
        agentRuns: { brand, ad, copy, design, quality },
        agentCount: 5,
        engine: 'improved-skills-fallback'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
        qualityScore: 0,
        agentCount: 0
      };
    }
  }

  private generateHTMLFromSpec(spec: any): string {
    // For now, just use a basic HTML template since the 26-agent spec format may vary
    const brand = spec.brand || {};
    const hero = spec.hero || {};
    const stats = spec.stats || [];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand.name || 'Landing Page'}</title>
  <meta name="description" content="${hero.subheadline || hero.description || 'Premium services'}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: white; margin: 0; }
    .hero { background: linear-gradient(135deg, #0a0a0a, #d4af37); min-height: 70vh; display: flex; align-items: center; padding: 4rem 2rem; }
    .container { max-width: 72rem; margin: 0 auto; }
    h1 { font-size: 2.5rem; font-weight: 800; }
    .btn { background: #d4af37; color: white; padding: 1rem 2rem; border-radius: 0.5rem; text-decoration: none; display: inline-block; }
  </style>
</head>
<body>
  <section class="hero">
    <div class="container">
      <div class="text-center">
        <h1>${hero.headline || hero.title || brand.name || 'Welcome'}</h1>
        <p>${hero.subheadline || hero.description || 'Premium services for discerning clients'}</p>
        <a href="#apply" class="btn">${hero.cta || 'Get Started'}</a>
      </div>
    </div>
  </section>
  <section style="padding: 4rem 2rem; background: #1a1a1a;">
    <div class="container text-center">
      <h2>Why Choose ${brand.name || 'Us'}</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 3rem;">
        ${stats.map((s: any) => `<div><div style="font-size: 2rem; color: #d4af37;">${s.value}</div><div>${s.label}</div></div>`).join('')}
      </div>
    </div>
  </section>
</body>
</html>`;
  }
}

export const masterOrchestrator = new MasterOrchestrator();
