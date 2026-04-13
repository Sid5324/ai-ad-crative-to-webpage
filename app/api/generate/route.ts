// app/api/generate/route.ts - Production Schema-Based Generator
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { productionOrchestrator } from '@/lib/orchestrator/production-orchestrator';

// Helper to flatten nested spec for React
function flattenSpec(spec: any): any {
  if (!spec) return {};
  
  return {
    brand: spec.brand?.canonicalName || spec.brand || 'Brand',
    category: spec.category?.primary || spec.category || 'other',
    confidence: spec.brand?.confidence || spec.confidence || 0.5,
    hero: {
      eyebrow: spec.hero?.eyebrow || '',
      headline: spec.hero?.headline || spec.hero?.headline?.headline || 'Headline',
      subheadline: spec.hero?.subheadline || spec.hero?.subheadline?.subheadline || 'Subheadline',
      primaryCta: typeof spec.hero?.primaryCta === 'string' ? spec.hero.primaryCta : spec.hero?.primaryCta?.label || 'Get Started',
      secondaryCta: typeof spec.hero?.secondaryCta === 'string' ? spec.hero.secondaryCta : spec.hero?.secondaryCta?.label || ''
    },
    stats: spec.stats || [],
    benefits: spec.benefits || [],
    trustSignals: spec.trustSignals || [],
    designTokens: {
      primaryColor: spec.designTokens?.primaryColor || '#1E293B',
      backgroundColor: spec.designTokens?.backgroundColor || '#FFFFFF',
      surfaceColor: spec.designTokens?.surfaceColor || '#F8FAFC'
    }
  };
}

const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  console.log('🚀 PRODUCTION LANDING PAGE GENERATION START');

  const body = await req.json();
  const input = {
    url: body.targetUrl || body.url || '',
    adText: body.adInputValue || body.adCopy || undefined
  };

  try {
    if (!input.url) {
      return NextResponse.json({ success: false, error: 'targetUrl required' }, { status: 400 });
    }

    if (!body.adImageUrl && !input.adText) {
      return NextResponse.json({ success: false, error: 'Either adImageUrl or adInputValue required' }, { status: 400 });
    }

    console.log('📋 Input:', body.adImageUrl ? 'image' : 'text');
    console.log('🎯 Target:', input.url);

    // SINGLE SEQUENTIAL PIPELINE - No dual paths, no parallel execution
    // Generate with production orchestrator (handles HTTP 403 gracefully)
    const result = await productionOrchestrator.generateLandingPage(input);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.issues[0] || 'Generation failed',
        issues: result.issues,
        confidence: result.confidence
      }, { status: 400 });
    }

    // Create preview - flatten spec for React
    const flattenedSpec = flattenSpec(result.spec);
    const previewId = nanoid(10);
    PREVIEWS[previewId] = {
      spec: flattenedSpec,
      html: result.html
    };

    console.log('✅ Generated:');
    console.log('   Brand:', flattenedSpec.brand);
    console.log('   Category:', flattenedSpec.category);
    console.log('   Confidence:', result.confidence);

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      spec: flattenedSpec,
      confidence: result.confidence,
      issues: result.issues,
      engine: 'production-schema-orchestrator-v2.0'
    });

  } catch (error: any) {
    console.error('❌ ERROR:', error?.message || error);

    return NextResponse.json({
      success: false,
      error: error?.message || 'Internal server error',
      debug: { error: true }
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id || !PREVIEWS[id]) {
    return NextResponse.json({ error: 'Preview expired' }, { status: 404 });
  }

  return NextResponse.json(PREVIEWS[id]);
}