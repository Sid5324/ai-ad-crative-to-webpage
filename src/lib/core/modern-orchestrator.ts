// src/lib/core/modern-orchestrator.ts - Modern Orchestrator with All Improvements
import { AdCreativePipeline, createAdCreativeStages } from './pipeline';
import { configManager, BrandPersonality } from './config-manager';
import { visionCache, brandCache, contentCache } from './cache-manager';
import { performanceMonitor } from './monitoring';
import { errorHandler, visionCircuitBreaker, aiApiCircuitBreaker } from './error-handler';
import { testRunner } from './testing-framework';

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
  }): Promise<{
    success: boolean;
    html?: string;
    metadata?: any;
    errors?: string[];
    performance?: any;
  }> {
    const traceId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    try {
      console.log(`[${traceId}] 🚀 Starting modern ad creative generation`);

      // Extract brand information
      const brandData = await this.extractBrandInfo(input.targetUrl, traceId);

      // Get personality from configuration
      const personality = this.getPersonality(brandData.domain, brandData.industry);

      // Run pipeline with monitoring
      const result = await performanceMonitor.recordOperation(
        'pipeline_execution',
        () => this.pipeline.execute({
          ...input,
          brandData,
          personality
        }, { traceId })
      );

      if (!result.success) {
        console.error(`[${traceId}] ❌ Pipeline failed:`, result.context.errors);

        // Attempt recovery
        const recoveryResult = await this.attemptRecovery(result.context.errors, input, traceId);
        if (recoveryResult) {
          return recoveryResult;
        }

        return {
          success: false,
          errors: result.context.errors.map(e => e.message),
          performance: this.getPerformanceMetrics(startTime)
        };
      }

      // Validate final output
      const validationResults = await configManager.validate({
        html: result.data.html,
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

      console.log(`[${traceId}] ✅ Generation completed successfully`);

      return {
        success: true,
        html: result.data.html,
        metadata: {
          personality: personality.id,
          validationResults,
          traceId
        },
        performance: this.getPerformanceMetrics(startTime)
      };

    } catch (error) {
      console.error(`[${traceId}] 💥 Critical error:`, error);

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