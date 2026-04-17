// src/lib/core/modern-orchestrator.ts - Modern Orchestrator with All Improvements
import { AdCreativePipeline, createAdCreativeStages } from './pipeline';
import { configManager, BrandPersonality } from './config-manager';
import { visionCache, brandCache, contentCache } from './cache-manager';
import { performanceMonitor } from './monitoring';
import { errorHandler, visionCircuitBreaker, aiApiCircuitBreaker } from './error-handler';
import { testRunner } from './testing-framework';
import { rateLimiter } from './rate-limiter';
import { analyticsEngine } from './analytics';
import { featureFlagManager } from './feature-flags';
import { contentOptimizer } from './content-optimizer';

export class ModernAdCreativeOrchestrator {
  private pipeline: AdCreativePipeline;

  constructor() {
    this.pipeline = new AdCreativePipeline();

    // Initialize pipeline with improved stages
    const stages = createAdCreativeStages();
    stages.forEach(stage => this.pipeline.addStage(stage));
  }

  async generate(input: {
    adInputType: 'image_url' | 'copy';
    adInputValue: string;
    targetUrl: string;
  }, context?: { userId?: string; sessionId?: string }): Promise<{
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
        metadata: { startTime }
      });

      // Extract brand information (with caching)
      const brandData = await this.extractBrandInfo(input.targetUrl, traceId);

      // Get personality from configuration
      const personality = this.getPersonality(brandData.domain, brandData.industry);

      // Check feature flags
      const advancedCaching = featureFlagManager.isEnabled('advanced_caching', context);
      const semanticValidation = featureFlagManager.isEnabled('semantic_validation', context);
      const errorRecovery = featureFlagManager.isEnabled('error_recovery', context);

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
          errors: result.context.errors.map(e => e.message),
          performance: this.getPerformanceMetrics(startTime)
        };
      }

      let finalHtml = result.data.html;

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

      // Record error analytics
      analyticsEngine.recordEvent({
        type: 'error',
        sessionId: traceId,
        data: { error: (error as Error).message, critical: true },
        userId: context?.userId,
        metadata: { duration: Date.now() - startTime, success: false }
      });

      // Record error
      performanceMonitor.recordError('orchestrator_failure', error as Error);

      return {
        success: false,
        errors: [(error as Error).message],
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

    // Extract brand information
    brandData = {
      domain,
      name: domain.split('.')[0],
      industry: this.detectIndustry(domain),
      colors: this.getDefaultColors(domain)
    };

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
  <title>${personality.name} - Premium Services</title>
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