// app/api/generate/route.ts - Production Schema-Based Generator
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { productionOrchestrator } from '@/lib/orchestrator/production-orchestrator';

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

    // Create preview
    const previewId = nanoid(10);
    PREVIEWS[previewId] = {
      spec: result.spec,
      html: result.html
    };

    console.log('✅ Generated:');
    console.log('   Brand:', result.spec?.brand?.canonicalName);
    console.log('   Category:', result.spec?.category?.primary);
    console.log('   Confidence:', result.confidence);

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      spec: result.spec,
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