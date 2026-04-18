// src/lib/core/pipeline.ts - Modern Pipeline Architecture
import { analyzeImageWithFallback } from '../skills/skill-vision-fix';
import { extractBrandFromUrl } from '../skills/skill-brand-normalizer';
import { Brand as ExtractedBrand } from '../schemas/skill-schemas';
import { neutralTemplateEngine } from './neutral-templates';
import { semanticSanitizer } from './semantic-sanitizer';
import { configValidator } from './config-validator';
import { BrandPersonality } from './config-manager';

// Helper function to map extracted category to industry key
function categoryToIndustry(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('finance') || cat.includes('fintech') || cat.includes('bank') || cat.includes('credit')) {
    return 'fintech';
  }
  if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant') || cat.includes('delivery')) {
    return 'food_delivery';
  }
  if (cat.includes('transport') || cat.includes('travel') || cat.includes('logistics') || cat.includes('car') || cat.includes('ride')) {
    return 'transportation';
  }
  return 'generic';
}

export interface PipelineStage<TInput, TOutput> {
  name: string;
  execute: (input: TInput, context: PipelineContext) => Promise<TOutput>;
  canSkip?: (context: PipelineContext) => boolean;
  timeout?: number;
}

export interface PipelineContext {
  traceId: string;
  startTime: number;
  metadata: Map<string, any>;
  errors: Error[];
  warnings: string[];
}

export interface PipelineResult<T> {
  success: boolean;
  data?: T;
  context: PipelineContext;
  duration: number;
}

export class AdCreativePipeline {
  private stages: PipelineStage<any, any>[] = [];

  addStage<TInput, TOutput>(stage: PipelineStage<TInput, TOutput>): this {
    this.stages.push(stage);
    return this;
  }

  async execute<TInput, TOutput>(
    input: TInput,
    initialContext?: Partial<PipelineContext>
  ): Promise<PipelineResult<TOutput>> {
    const context: PipelineContext = {
      traceId: initialContext?.traceId || Math.random().toString(36).substring(7),
      startTime: Date.now(),
      metadata: initialContext?.metadata || new Map(),
      errors: [],
      warnings: [],
      ...initialContext
    };

    let currentInput = input;
    let lastResult: any = null;

    try {
      for (const stage of this.stages) {
        if (stage.canSkip && stage.canSkip(context)) {
          console.log(`[${context.traceId}] ⏭️ Skipping stage: ${stage.name}`);
          continue;
        }

        console.log(`[${context.traceId}] ▶️ Executing stage: ${stage.name}`);

        const stagePromise = stage.execute(currentInput, context);
        const timeoutPromise = stage.timeout
          ? new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Stage ${stage.name} timed out`)), stage.timeout)
            )
          : null;

        const result = timeoutPromise
          ? await Promise.race([stagePromise, timeoutPromise])
          : await stagePromise;

        currentInput = result;
        lastResult = result;

        console.log(`[${context.traceId}] ✅ Stage ${stage.name} completed`);
      }

      return {
        success: true,
        data: lastResult,
        context,
        duration: Date.now() - context.startTime
      };

    } catch (error) {
      console.error(`[${context.traceId}] 💥 Pipeline failed at stage`, error);
      context.errors.push(error as Error);

      return {
        success: false,
        context,
        duration: Date.now() - context.startTime
      };
    }
  }
}

// Stage definitions for ad creative generation
export const createAdCreativeStages = (): PipelineStage<any, any>[] => [
  {
    name: 'input-validation',
    execute: async (input, context) => {
      if (!input.targetUrl) throw new Error('targetUrl is required');
      if (!input.adInputValue) throw new Error('adInputValue is required');
      return { ...input, validated: true };
    }
  },
  {
    name: 'vision-analysis',
    execute: async (input: any, context) => {
      // Only analyze image URLs; skip for copy
      if (input.adInputType === 'image_url' && input.adInputValue) {
        try {
          const vision = await analyzeImageWithFallback(
            input.adInputValue,
            undefined,
            input.brandData?.industry || 'generic'
          );
          return { ...input, visionData: vision };
        } catch (error: any) {
          context.warnings.push(`Vision analysis failed: ${error.message}`);
        }
      }
      return input;
    },
    canSkip: (context) => context.metadata.get('skipVision') === true
  },
  {
    name: 'brand-extraction',
    execute: async (input: any, context) => {
      try {
        const extractedBrand: ExtractedBrand = await extractBrandFromUrl(input.targetUrl);
        const industry = categoryToIndustry(extractedBrand.category || '');
        // Merge extracted brand with existing brandData, overriding with richer data
        const enrichedBrandData = {
          ...input.brandData,
          name: extractedBrand.name,
          category: extractedBrand.category,
          colors: extractedBrand.colors || input.brandData?.colors,
          confidence: extractedBrand.confidence,
          industry
        };
        return { ...input, brandData: enrichedBrandData };
      } catch (error: any) {
        context.warnings.push(`Brand extraction failed: ${error.message}`);
        return input;
      }
    }
  },
  {
    name: 'content-generation',
    execute: async (input: any, context) => {
      // Generate content slots using neutral template engine
      const slots = neutralTemplateEngine.generateSlots(
        input.personality,
        input.brandData.name,
        {
          industry: input.brandData.industry,
          proofPoints: []
        }
      );
      return { ...input, slots };
    }
  },
  {
    name: 'html-rendering',
    execute: async (input: any, context) => {
      // Validate and sanitize slots, then render to HTML
      semanticSanitizer.updatePersonality(input.personality);
      const validation = configValidator.validateConfigTree(input.slots, input.personality);
      const html = neutralTemplateEngine.render('landing-page', validation.sanitizedConfig);
      return { ...input, html, validation };
    }
  },
  {
    name: 'quality-validation',
    execute: async (input: any, context) => {
      // Ensure HTML is present and well-formed
      if (!input.html) {
        throw new Error('No HTML generated in html-rendering stage');
      }
      // Basic structure check
      if (!input.html.includes('<!DOCTYPE html>') || !input.html.includes('</html>')) {
        context.warnings.push('Generated HTML may be incomplete (missing doctype or closing tag)');
      }
      // Length check
      if (input.html.length < 200) {
        context.warnings.push('Generated HTML is suspiciously short');
      }
      // Return full accumulated input
      return input;
    }
  }
];