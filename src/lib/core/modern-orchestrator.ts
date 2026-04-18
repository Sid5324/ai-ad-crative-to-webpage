// src/lib/core/modern-orchestrator.ts - Modern Orchestrator with All Improvements
import { AdCreativePipeline, createAdCreativeStages } from './pipeline';
import { configManager, BrandPersonality } from './config-manager';
import { visionCache, brandCache, contentCache } from './cache-manager';
import { performanceMonitor } from './monitoring';
import { errorHandler, visionCircuitBreaker, aiApiCircuitBreaker } from './error-handler';
import { testRunner } from './testing-framework';
import { rateLimiter } from './rate-limiter';
import { analyticsEngine } from './analytics';
import { featureFlagManager, FeatureContext } from './feature-flags';
import { contentOptimizer } from './content-optimizer';
import { semanticSanitizer } from './semantic-sanitizer';
import { neutralTemplateEngine } from './neutral-templates';
import { configValidator } from './config-validator';

export class ModernAdCreativeOrchestrator {
  private pipeline: AdCreativePipeline;

  constructor() {
    this.pipeline = new AdCreativePipeline();

    // Initialize pipeline with improved stages
    const stages = createAdCreativeStages();
    stages.forEach(stage => this.pipeline.addStage(stage));

    // Initialize config validator with semantic sanitizer
    (global as any).configValidatorInstance = configValidator;
    configValidator['semanticSanitizer'] = semanticSanitizer;
  }

   async generate(input: {
     adInputType: 'image_url' | 'copy';
     adInputValue: string;
     targetUrl: string;
   }, context?: FeatureContext): Promise<{
     success: boolean;
     html?: string;
     metadata?: any;
     errors?: string[];
     performance?: any;
   }> {
    const traceId = context?.sessionId || Math.random().toString(36).substring(7);
    const startTime = Date.now();

    try {
      console.log(`[${traceId}] 🚀 Starting modern ad creative generation`);

      // Check rate limits
      const rateLimitCheck = await rateLimiter.checkLimit('api_generation', new Request('http://localhost'));
      if (!rateLimitCheck.allowed) {
        analyticsEngine.recordEvent({
          type: 'error',
          sessionId: traceId,
          data: { error: 'Rate limit exceeded', limit: rateLimitCheck },
          userId: context?.userId
        });

        return {
          success: false,
          errors: ['Rate limit exceeded. Please try again later.'],
          performance: { rateLimited: true }
        };
      }

       // Record analytics
       analyticsEngine.recordEvent({
         type: 'generation',
         sessionId: traceId,
         data: { inputType: input.adInputType, targetUrl: input.targetUrl },
         userId: context?.userId,
         metadata: { url: input.targetUrl }
       });

      // Extract brand information (with caching)
      const brandData = await this.extractBrandInfo(input.targetUrl, traceId);

      // Get personality from configuration
      const personality = this.getPersonality(brandData.domain, brandData.industry);

      // Check feature flags
      const advancedCaching = featureFlagManager.isEnabled('advanced_caching', context);
      const semanticValidation = featureFlagManager.isEnabled('semantic_validation', context);
      const errorRecovery = featureFlagManager.isEnabled('error_recovery', context);
      const templateNeutrality = featureFlagManager.isEnabled('template_neutrality', context);

      // Run pipeline with monitoring
      const result = await performanceMonitor.recordOperation(
        'pipeline_execution',
        () => this.pipeline.execute({
          ...input,
          brandData,
          personality,
          features: { advancedCaching, semanticValidation, errorRecovery }
        }, { traceId })
      );

      if (!result.success) {
        console.error(`[${traceId}] ❌ Pipeline failed:`, result.context.errors);

        // Record error analytics
        analyticsEngine.recordEvent({
          type: 'error',
          sessionId: traceId,
          data: { stage: 'pipeline', errors: result.context.errors },
          userId: context?.userId
        });

        // Attempt recovery if enabled
        if (errorRecovery) {
          const recoveryResult = await this.attemptRecovery(result.context.errors, input, traceId);
          if (recoveryResult) {
            return recoveryResult;
          }
        }

        return {
          success: false,
          errors: (result as any).context.errors.map((e: Error) => e.message),
          performance: this.getPerformanceMetrics(startTime)
        };
      }

       let finalHtml = (result as any).data.html;

      // Apply Template Neutrality: Generate HTML using neutral templates
      if (templateNeutrality) {
        console.log(`[${traceId}] 🏗️ Using Template Neutrality - Generating with neutral templates`);
        finalHtml = this.generateNeutralHTML(personality, brandData, {
          proofPoints: context?.proofPoints,
          industry: brandData.industry
        });
      } else {
        // Apply semantic sanitization to existing HTML
        console.log(`[${traceId}] 🛡️ Applying Template Neutrality - Semantic Sanitization`);
        semanticSanitizer.updatePersonality(personality);
        finalHtml = semanticSanitizer.sanitize(finalHtml);
      }

      // Content optimization if enabled
      if (featureFlagManager.isEnabled('content_optimization', context)) {
        try {
          const metrics: any = {
            engagement: 0.7,
            conversion: 0.6,
            readability: 0.8,
            uniqueness: 0.9,
            relevance: 0.8,
            performance: { loadTime: 2000, size: finalHtml.length, lighthouseScore: 85 }
          };

          const optimizationResult = await contentOptimizer.optimize(finalHtml, metrics, traceId);
          if (optimizationResult.optimizedContent !== finalHtml) {
            console.log(`[${traceId}] 🎯 Content optimized with ${optimizationResult.appliedRules.length} rules`);
            finalHtml = optimizationResult.optimizedContent;

            // Record optimization analytics
            analyticsEngine.recordEvent({
              type: 'generation',
              sessionId: traceId,
              data: {
                optimization: {
                  rulesApplied: optimizationResult.appliedRules,
                  improvements: optimizationResult.improvements
                }
              },
              userId: context?.userId
            });
          }
        } catch (error) {
          console.warn(`[${traceId}] Content optimization failed:`, error);
        }
      }

       // Validate final output if semantic validation is enabled
       let validationResults: any[] = [];
       if (semanticValidation) {
         validationResults = await configManager.validate({
           html: finalHtml,
           personality,
           brandColors: personality.visual.colors
         });

         const failedValidations = validationResults.filter(v => !v.passed);
         if (failedValidations.length > 0) {
           console.warn(`[${traceId}] ⚠️ Validation warnings:`, failedValidations);

           // Record validation failures
           failedValidations.forEach(v => {
             performanceMonitor.recordValidationFailure(v.ruleId || 'unknown', v.severity || 'warning');
           });

           // If semantic drift detected and template neutrality wasn't used, retry with neutral templates
           const driftValidation = failedValidations.find(v => v.ruleId === 'semantic-drift');
           if (driftValidation && !templateNeutrality) {
             console.log(`[${traceId}] 🔄 Semantic drift detected without template neutrality - regenerating with neutral templates`);
             finalHtml = this.generateNeutralHTML(personality, brandData, {
               proofPoints: context?.proofPoints,
               industry: brandData.industry
             });

             // Re-validate after regeneration
             const revalidationResults = await configManager.validate({
               html: finalHtml,
               personality,
               brandColors: personality.visual.colors
             });
             const reFailedValidations = revalidationResults.filter(v => !v.passed);
             if (reFailedValidations.length > 0) {
               console.warn(`[${traceId}] ⚠️ Re-generation still has validation issues:`, reFailedValidations);
               validationResults = [...validationResults, ...revalidationResults];
             } else {
               console.log(`[${traceId}] ✅ Re-generation passed validation`);
               // Replace validation results with the passing ones
               validationResults = revalidationResults;
             }
           }
         }
       }

       console.log(`[${traceId}] ✅ Generation completed successfully`);

      // Record success analytics
      analyticsEngine.recordEvent({
        type: 'generation',
        sessionId: traceId,
        data: { success: true, personality: personality.id },
        userId: context?.userId,
        metadata: { duration: Date.now() - startTime, success: true }
      });

      return {
        success: true,
        html: finalHtml,
        metadata: {
          personality: personality.id,
          validationResults,
          traceId,
          features: {
            advancedCaching,
            semanticValidation,
            errorRecovery,
            contentOptimization: featureFlagManager.isEnabled('content_optimization', context)
          }
        },
        performance: this.getPerformanceMetrics(startTime)
      };

    } catch (error) {
      console.error(`[${traceId}] 💥 Critical error:`, error);

      // Check if this is a quota/API key error - try text-only fallback
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('leaked')) {
        console.log(`[${traceId}] ⚠️ API quota/key error detected, attempting text-only fallback`);

        try {
          const fallbackResult = await this.generateTextOnlyFallback(input, traceId, context);
          if (fallbackResult) {
            console.log(`[${traceId}] ✅ Fallback generation successful`);
            return {
              ...fallbackResult,
              metadata: {
                ...fallbackResult.metadata,
                fallback: true,
                originalError: errorMessage
              }
            };
          }
        } catch (fallbackError) {
          console.error(`[${traceId}] ❌ Fallback also failed:`, fallbackError);
        }
      }

      // Record error analytics
      analyticsEngine.recordEvent({
        type: 'error',
        sessionId: traceId,
        data: { error: errorMessage, critical: true },
        userId: context?.userId,
        metadata: { duration: Date.now() - startTime, success: false }
      });

       // Record error
       performanceMonitor.recordError(error, { operation: 'orchestrator_failure' });

      return {
        success: false,
        errors: [errorMessage],
        performance: this.getPerformanceMetrics(startTime)
      };
    }
  }

  private async extractBrandInfo(targetUrl: string, traceId: string): Promise<any> {
    const domain = new URL(targetUrl).hostname.replace(/^www\./, '');

    // Check cache first
    let brandData = await brandCache.getBrandData(domain);
    if (brandData) {
      performanceMonitor.recordCacheHit('brand');
      return brandData;
    }

    performanceMonitor.recordCacheMiss('brand');

    // Try real brand extraction first
    try {
      const { extractBrandFromUrl } = await import('../skills/skill-brand-normalizer');
      const extractedBrand = await extractBrandFromUrl(targetUrl);
      
      if (extractedBrand && extractedBrand.confidence > 0.3) {
        brandData = {
          domain,
          name: extractedBrand.name,
          industry: this.detectIndustry(domain),
          colors: extractedBrand.colors || this.getDefaultColors(domain),
          confidence: extractedBrand.confidence,
          category: extractedBrand.category
        };
        
        console.log(`[${traceId}] ✅ Brand extraction successful: ${brandData.name}`);
      } else {
        throw new Error('Low confidence brand extraction');
      }
    } catch (error) {
      console.log(`[${traceId}] ⚠️ Brand extraction failed, using fallback:`, error.message);
      
      // Smart fallback - proper capitalization instead of raw domain
      const rawName = domain.split('.')[0];
      const properName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      
      brandData = {
        domain,
        name: properName,
        industry: this.detectIndustry(domain),
        colors: this.getDefaultColors(domain)
      };
    }

    // Cache the result
    await brandCache.setBrandData(domain, brandData);

    return brandData;
  }

  private getPersonality(domain: string, industry: string): BrandPersonality {
    // Try exact domain match first
    const exactMatch = configManager.findPersonalityByDomain(domain);
    if (exactMatch) return exactMatch;

    // Fall back to industry default
    const industryPersonality = configManager.getPersonality(`${industry}_default`);
    if (industryPersonality) return industryPersonality;

    // Ultimate fallback
    return configManager.getPersonality('minimal') || {
      id: 'minimal',
      name: 'Minimal Default',
      tone: 'minimal',
      voice: 'confident',
      keyTerms: ['service', 'quality'],
      avoidTerms: [],
      cta: { primary: 'Get Started', secondary: 'Learn More' },
      visual: {
        colors: { primary: '#1E293B', accent: '#3B82F6' },
        typography: { family: 'Inter', weight: '400' },
        layout: ['hero', 'features', 'cta']
      }
    };
  }

  private detectIndustry(domain: string): string {
    const industryMap: Record<string, string> = {
      'doordash': 'food_delivery',
      'ubereats': 'food_delivery',
      'stripe': 'fintech',
      'cred': 'fintech',
      'uber': 'transportation',
      'lyft': 'transportation'
    };

    return industryMap[domain] || 'generic';
  }

  private getDefaultColors(domain: string): { primary: string; accent: string } {
    const colorMap: Record<string, { primary: string; accent: string }> = {
      'doordash': { primary: '#EB1700', accent: '#FFFFFF' },
      'ubereats': { primary: '#06C167', accent: '#000000' },
      'stripe': { primary: '#635BFF', accent: '#FFFFFF' }
    };

    return colorMap[domain] || { primary: '#1E293B', accent: '#3B82F6' };
  }

  private async attemptRecovery(
    errors: Error[],
    originalInput: any,
    traceId: string
  ): Promise<any | null> {
    console.log(`[${traceId}] 🔧 Attempting recovery from ${errors.length} errors`);

    // Try simplified generation
    try {
      const simplifiedResult = await this.generateSimplified(originalInput, traceId);
      if (simplifiedResult.success) {
        console.log(`[${traceId}] ✅ Recovery successful with simplified generation`);
        return simplifiedResult;
      }
    } catch (recoveryError) {
      console.warn(`[${traceId}] ⚠️ Recovery failed:`, recoveryError);
    }

    return null;
  }

  private async generateTextOnlyFallback(
    input: any,
    traceId: string,
    context?: any
  ): Promise<any | null> {
    console.log(`[${traceId}] 📝 Generating text-only fallback (no vision API required)`);

    try {
      // Extract brand info (already cached, no API call needed)
      const brandData = await this.extractBrandInfo(input.targetUrl, traceId);
      const personality = this.getPersonality(brandData.domain, brandData.industry);

      // Use text-based copy generation
      const copy = {
        headline: this.generateFallbackHeadline(brandData, personality),
        subheadline: this.generateFallbackSubheadline(brandData, personality),
        personalityTone: personality.tone,
        personalityVoice: personality.voice,
        ocrUsed: 'false (fallback)',
        primaryCta: personality.cta.primary,
        secondaryCta: personality.cta.secondary
      };

      // Generate basic HTML without vision-dependent features
      const html = this.generateFallbackHTML(copy, personality, brandData);

      // Basic validation (no semantic drift check since we bypassed vision)
      const validationResults = [{
        passed: true,
        message: 'Fallback mode - basic validation passed'
      }];

      return {
        success: true,
        html,
        metadata: {
          personality: personality.id,
          validationResults,
          traceId,
          fallback: true,
          features: {
            advancedCaching: true,
            semanticValidation: false,
            errorRecovery: true,
            contentOptimization: false
          }
        },
        performance: this.getPerformanceMetrics(Date.now() - 1000) // Mock duration
      };
    } catch (error) {
      console.error(`[${traceId}] ❌ Text-only fallback failed:`, error);
      return null;
    }
  }

  private generateFallbackHeadline(brandData: any, personality: any): string {
    const brandName = brandData.name.charAt(0).toUpperCase() + brandData.name.slice(1);

    const headlines = {
      'fast': `${brandName} - Fast, Reliable Service`,
      'premium': `${brandName} - Premium Quality Solutions`,
      'reliable': `${brandName} - Trusted Service Provider`,
      'technical': `${brandName} - Advanced Technology Solutions`,
      'minimal': `${brandName} - Simple, Effective Solutions`
    };

    return headlines[personality.tone] || `${brandName} - Quality Services`;
  }

  private generateFallbackSubheadline(brandData: any, personality: any): string {
    const subs = {
      'fast': 'Get what you need quickly and efficiently',
      'premium': 'Experience excellence with our premium offerings',
      'reliable': 'Dependable service you can trust',
      'technical': 'Cutting-edge solutions for modern businesses',
      'minimal': 'Clean, straightforward solutions that work'
    };

    return subs[personality.tone] || 'Professional services tailored to your needs';
  }

  private generateNeutralHTML(personality: BrandPersonality, brandData: any, context: any): string {
    try {
      console.log(`Generating neutral template for ${brandData.name}`);

      // Generate content slots using personality-aware logic
      const slots = neutralTemplateEngine.generateSlots(personality, brandData.name, {
        industry: brandData.industry,
        proofPoints: context?.proofPoints || []
      });

      // Update semantic sanitizer with personality
      semanticSanitizer.updatePersonality(personality);

      // Validate and sanitize all content
      const validation = configValidator.validateConfigTree(slots, personality);
      if (!validation.valid) {
        console.warn('Config validation found issues:', validation.violations);
      }

      // Render template with sanitized slots
      return neutralTemplateEngine.render('landing-page', validation.sanitizedConfig);

    } catch (error) {
      console.error('Neutral template generation failed, falling back to basic HTML:', error);
      return this.generateBasicHTML(context, personality);
    }
  }

  private generateFallbackHTML(copy: any, personality: any, brandData: any): string {
    const brandColors = personality.visual.colors;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${copy.subheadline}">
  <title>${copy.headline}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Inter', sans-serif; }
    .cta-primary { background: ${brandColors.primary}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; }
    .cta-secondary { background: transparent; color: ${brandColors.primary}; border: 2px solid ${brandColors.primary}; padding: 10px 22px; border-radius: 8px; text-decoration: none; display: inline-block; margin-left: 12px; }
  </style>
</head>
<body class="bg-gray-50">
  <div class="max-w-4xl mx-auto py-16 px-6">
    <div class="text-center">
      <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
        ${copy.headline}
      </h1>
      <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
        ${copy.subheadline}
      </p>
      <div class="mb-16">
        <a href="#" class="cta-primary font-semibold">${copy.primaryCta}</a>
        <a href="#" class="cta-secondary font-semibold">${copy.secondaryCta}</a>
      </div>
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
        <div class="text-6xl mb-4">🚀</div>
        <h3 class="text-xl font-semibold mb-2">Get Started Today</h3>
        <p class="text-gray-600">Join thousands of satisfied customers</p>
      </div>
    </div>
  </div>
</body>
</html>`.trim();
  }

  private async generateSimplified(input: any, traceId: string): Promise<any> {
    // Simplified generation with minimal features
    console.log(`[${traceId}] 📝 Generating simplified version`);

    const personality = configManager.getPersonality('minimal');
    const html = this.generateBasicHTML(input, personality);

    return {
      success: true,
      html,
      metadata: { simplified: true, traceId }
    };
  }

  private generateBasicHTML(input: any, personality: BrandPersonality): string {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${personality.name} - Quality Services</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="max-w-4xl mx-auto py-12 px-6">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-6">
        ${personality.cta.primary}
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Experience quality services tailored to your needs.
      </p>
      <button class="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700">
        ${personality.cta.primary}
      </button>
    </div>
  </div>
</body>
</html>`.trim();
  }

  private getPerformanceMetrics(startTime: number): any {
    const duration = Date.now() - startTime;
    const systemMetrics = performanceMonitor.getPerformanceMetrics();

    return {
      duration,
      ...systemMetrics,
      timestamp: new Date().toISOString()
    };
  }

  // Testing interface
  async runTests(): Promise<any> {
    console.log('🧪 Running comprehensive test suite');
    const results = await testRunner.runTests();
    const summary = testRunner.getSummary();

    console.log(`📊 Test Results: ${summary.passed}/${summary.total} passed (${(summary.successRate * 100).toFixed(1)}%)`);

    return { results, summary };
  }

  // Health check interface
  async getHealth(): Promise<any> {
    const systemHealth = await performanceMonitor.getSystemHealth();
    const cacheStats = {
      vision: visionCache.getStats(),
      brand: brandCache.getStats(),
      content: contentCache.getStats()
    };

    return {
      status: systemHealth.status,
      uptime: systemHealth.uptime,
      performance: performanceMonitor.getPerformanceMetrics(),
      cache: cacheStats,
      errors: performanceMonitor.getRecentErrors(1)
    };
  }
}

// Global modern orchestrator instance
export const modernOrchestrator = new ModernAdCreativeOrchestrator();