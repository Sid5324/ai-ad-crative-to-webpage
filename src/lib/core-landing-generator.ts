// @ts-nocheck
// src/lib/core-landing-generator.ts - Simplified Core Landing Page Generator
// Focuses on what we actually need: ad analysis → content matching → design → HTML

import { extractBrandFromUrl } from './skills/skill-brand-normalizer';
import { analyzeImageWithFallback } from './skills/skill-vision-fix';
import { runCopySkill } from './skills/skill-copywriter';
import { runDesignFix } from './skills/skill-design-fix';
import { renderLandingPageFix } from './skills/skill-renderer-fix';

// Simple strategy interface for the generator
interface SimpleStrategy {
  narrativeStyle: string;
  layoutMode: string;
  conversionPath: {
    primary: string;
    secondary?: string;
  };
}

export interface LandingPageInput {
  adImage?: string;      // Image URL
  adText?: string;       // Ad copy text
  targetUrl: string;     // Target website URL
}

export interface LandingPageOutput {
  success: boolean;
  html: string;
  metadata: {
    brand: string;
    adType: 'image' | 'text' | 'mixed';
    confidence: number;
    generationTime: number;
  };
  error?: string;
}

// Simplified, focused landing page generator
export class CoreLandingGenerator {
  async generate(input: LandingPageInput): Promise<LandingPageOutput> {
    const startTime = Date.now();

    try {
      console.log('🎯 Generating landing page...');
      console.log('   Ad:', input.adImage ? 'image' : input.adText ? 'text' : 'none');
      console.log('   Target:', input.targetUrl);

      // 1. Extract brand from target URL
      console.log('🏢 Extracting brand...');
      const brand = await extractBrandFromUrl(input.targetUrl);

      // 2. Analyze ad content (image or text)
      console.log('📢 Analyzing ad...');
      const adAnalysis = await analyzeImageWithFallback(
        input.adImage,
        input.adText,
        brand.category
      );

      // 3. Generate matching content
      console.log('✍️ Generating content...');
      const strategy: SimpleStrategy = {
        narrativeStyle: 'trust-heavy-fintech',
        layoutMode: 'hero-stats-features-cta',
        conversionPath: {
          primary: adAnalysis.ctaSignals?.[0] || 'Apply Now',
          secondary: 'Learn More'
        }
      };

      const copy = runCopySkill(brand, adAnalysis, strategy as any);

      // 4. Generate design that matches
      console.log('🎨 Generating design...');
      const design = runDesignFix(brand, adAnalysis, strategy);

      // 5. Run STRICT QA before rendering
      console.log('🔒 Running QA gate...');
      const qa = runQASkill(brand, copy, design);
      console.log(`[QA] Score: ${qa.score}, Passed: ${qa.passed}, Issues: ${qa.issues.length}`);
      
      if (!qa.passed) {
        const fatal = qa.fatalIssues.join(', ') || 'low score';
        console.error(`[QA] FAILED - ${fatal}. Blocking render.`);
        throw new Error(`QA_BLOCKED: ${fatal}`);
      }

      // 6. Render final HTML only if QA passes
      console.log('🖥️ Rendering HTML (QA passed)...');
      const html = renderLandingPageFix(brand, copy, design, qa);

      const generationTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(adAnalysis, brand);

      console.log('✅ Generated successfully!');
      console.log(`   Brand: ${brand.name}`);
      console.log(`   Confidence: ${confidence}%`);
      console.log(`   Time: ${generationTime}ms`);

      return {
        success: true,
        html,
        metadata: {
          brand: brand.name,
          adType: input.adImage ? 'image' : input.adText ? 'text' : 'mixed',
          confidence,
          generationTime,
          qaScore: qa.score
        }
      };

    } catch (error: any) {
      console.error('❌ Generation failed:', error);

      return {
        success: false,
        html: '',
        metadata: {
          brand: 'Unknown',
          adType: 'unknown',
          confidence: 0,
          generationTime: Date.now() - startTime
        },
        error: error.message
      };
    }
  }

  private calculateConfidence(adAnalysis: any, brand: any): number {
    let confidence = 70; // Base confidence

    // Higher confidence for clear ad signals
    if (adAnalysis.ctaSignals?.length > 0) confidence += 10;
    if (adAnalysis.offerSignals?.length > 0) confidence += 10;
    if (adAnalysis.confidence > 0.7) confidence += 5;

    // Higher confidence for strong brand detection
    if (brand.confidence > 0.8) confidence += 5;

    return Math.min(100, confidence);
  }

  // Utility method to get generation stats
  getStats() {
    return {
      version: '2.0.0-simplified',
      capabilities: [
        'Ad image analysis',
        'Ad text parsing',
        'Brand extraction',
        'Content matching',
        'Design generation',
        'HTML rendering'
      ],
      supportedInputs: [
        'Image URLs',
        'Ad copy text',
        'Target website URLs'
      ],
      outputFormat: 'Complete HTML landing page'
    };
  }
}

// Export singleton instance
export const coreLandingGenerator = new CoreLandingGenerator();