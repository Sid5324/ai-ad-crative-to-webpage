// src/lib/production-landing-generator.ts - Production Landing Page Generator
// Uses Production Agent Framework + Production Skills

import { productionWorkflow, ProductionLandingPageWorkflow } from './production-agent-framework';
import { productionSkills } from './production-skills';

export interface ProductionLandingInput {
  targetUrl: string;
  adImage?: string;
  adText?: string;
  category?: string;
}

export interface ProductionLandingOutput {
  success: boolean;
  html?: string;
  spec?: any;
  state: string;
  errors: string[];
  metadata: {
    duration: number;
    skillsUsed: string[];
    version: string;
    qaScore?: number;
  };
}

// Enhanced generator with production framework
export async function generateProductionLandingPage(
  input: ProductionLandingInput
): Promise<ProductionLandingOutput> {
  const startTime = Date.now();
  console.log('[ProductionGenerator] Starting production generation...');

  try {
    // Normalize input
    const normalizedInput = {
      url: input.targetUrl,
      image: input.adImage,
      text: input.adText,
      category: input.category || 'Business'
    };

    // Execute production workflow
    const result = await productionWorkflow.execute(normalizedInput);

    if (result.state === 'BRAND_REJECTED') {
      return {
        success: false,
        state: result.state,
        errors: result.errors,
        metadata: {
          duration: Date.now() - startTime,
          skillsUsed: ['brand-agent'],
          version: 'production-v1.0'
        }
      };
    }

    if (result.state === 'QA_BLOCKED') {
      return {
        success: false,
        state: result.state,
        errors: result.errors,
        spec: result.data,
        metadata: {
          duration: Date.now() - startTime,
          skillsUsed: ['brand-agent', 'ad-vision-agent', 'copy-agent', 'design-agent', 'qa-agent'],
          version: 'production-v1.0',
          qaScore: result.data.qa?.score
        }
      };
    }

    if (result.state === 'COMPLETED') {
      // Generate HTML using production skills
      const htmlResult = await productionSkills.htmlGenerator.execute({
        brand: result.data.brand,
        copy: result.data.copy,
        design: result.data.design,
        qa: result.data.qa
      });

      return {
        success: true,
        html: htmlResult.html,
        spec: result.data,
        state: result.state,
        errors: [],
        metadata: {
          duration: Date.now() - startTime,
          skillsUsed: [
            'brand-agent', 'ad-vision-agent', 'copy-agent',
            'design-agent', 'qa-agent', 'html-generator'
          ],
          version: 'production-v1.0',
          qaScore: result.data.qa?.score
        }
      };
    }

    // Other states (FAILED, etc.)
    return {
      success: false,
      state: result.state,
      errors: result.errors,
      metadata: {
        duration: Date.now() - startTime,
        skillsUsed: [],
        version: 'production-v1.0'
      }
    };

  } catch (error: any) {
    console.error('[ProductionGenerator] Critical error:', error.message);

    return {
      success: false,
      state: 'CRITICAL_ERROR',
      errors: [error.message],
      metadata: {
        duration: Date.now() - startTime,
        skillsUsed: [],
        version: 'production-v1.0'
      }
    };
  }
}