// app/api/generate/route.ts - Modern Ad Creative Generation System
import { NextResponse } from 'next/server';
import { modernOrchestrator } from '@/lib/core/modern-orchestrator';
import { withRateLimit } from '@/lib/core/rate-limiter';
import { withAnalytics } from '@/lib/core/analytics';
import { withAPIVersioning } from '@/lib/core/api-versioning';
import { withFeatureFlags } from '@/lib/core/feature-flags';

// In-memory preview storage (volatile)
const PREVIEWS: Record<string, any> = {};

// Core generation handler - receives Request with feature flags already set
async function handleGeneration(req: Request, featureContext: any) {
  const traceId = featureContext.sessionId;
  const startTime = Date.now();

  console.log(`🚀 [${traceId}] MODERN AD CREATIVE GENERATION SYSTEM`);
  console.log(`🚀 [${traceId}] ========================================`);

  try {
    const body = await req.json();
    console.log(`📥 [${traceId}] RAW BODY:`, JSON.stringify(body).substring(0, 500));

    const input = {
      targetUrl: body.targetUrl || body.url || '',
      adInputType: body.adInputType as 'image_url' | 'copy',
      adInputValue: body.adImageUrl || body.adInputValue || body.adCopy || ''
    };

    console.log(`🔧 [${traceId}] CONSTRUCTED INPUT:`, {
      targetUrl: input.targetUrl,
      adInputType: input.adInputType,
      adInputValue: input.adInputValue ? input.adInputValue.substring(0, 100) + '...' : '(empty)',
      adInputValueLength: input.adInputValue?.length
    });

    // Validate input
    if (!input.targetUrl) {
      return NextResponse.json({ success: false, error: 'targetUrl required' }, { status: 400 });
    }

    if (!input.adInputValue) {
      return NextResponse.json({ success: false, error: 'Either adImageUrl or adInputValue required' }, { status: 400 });
    }

    console.log(`📋 [${traceId}] Input Type:`, input.adInputType);
    console.log(`🎯 [${traceId}] Target URL:`, input.targetUrl);

    // Execute Modern Orchestrator
    const result = await modernOrchestrator.generate(input, featureContext);

    if (!result.success) {
      console.error(`❌ [${traceId}] Generation failed:`, result.errors);
      return NextResponse.json({
        success: false,
        error: result.errors?.[0] || 'Generation failed',
        errors: result.errors,
        performance: result.performance
      }, { status: 400 });
    }

    console.log(`✅ [${traceId}] Generation completed successfully`);
    console.log(`   [${traceId}] Duration: ${result.performance?.duration}ms`);
    console.log(`   [${traceId}] HTML Length: ${result.html?.length || 0}`);
    console.log(`   [${traceId}] Semantic Score: ${result.metadata?.validation?.['semantic-drift']?.score || 'N/A'}`);

    // Create preview (simple random ID)
    const previewId = Math.random().toString(36).substring(2, 12);
    PREVIEWS[previewId] = {
      html: result.html,
      metadata: result.metadata,
      performance: result.performance
    };

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      metadata: result.metadata,
      performance: result.performance,
      engine: `Modern-Ad-Creative-System-v${featureContext.version}-prod-v4`,
      features: result.metadata?.features
    });

  } catch (error: any) {
    console.error(`💥 [${traceId}] Critical error:`, error?.message || error);

    return NextResponse.json({
      success: false,
      error: error?.message || 'Internal server error',
      performance: {
        duration: Date.now() - startTime,
        error: true
      }
    }, { status: 500 });
  }
}

// Apply all middleware layers (outermost first, executes innermost first)
export const POST = withRateLimit('api_generation',
  withAnalytics('generation',
    withAPIVersioning(
      withFeatureFlags(handleGeneration)
    )
  )
);

// GET handler for retrieving previews by ID (no middleware needed)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id || !PREVIEWS[id]) {
    return NextResponse.json({ error: 'Preview expired' }, { status: 404 });
  }

  return NextResponse.json(PREVIEWS[id]);
}
