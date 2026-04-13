// app/api/generate/route.ts - Simplified Generator ( Single Sequential Pipeline)
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateTrulySimpleLandingPage, type LandingPageInput } from '@/lib/truly-simple-landing-generator';

const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  console.log('🚀 SIMPLIFIED LANDING PAGE GENERATION START');

  const body = await req.json();
  const input: LandingPageInput = {
    adImage: body.adImageUrl || undefined,
    adText: body.adInputValue || body.adCopy || undefined,
    category: body.category || 'Business',
    targetUrl: body.targetUrl || body.url || ''
  };

  try {
    if (!input.targetUrl) {
      return NextResponse.json({ success: false, error: 'targetUrl required' }, { status: 400 });
    }

    if (!input.adImage && !input.adText) {
      return NextResponse.json({ success: false, error: 'Either adImageUrl or adInputValue required' }, { status: 400 });
    }

    console.log('📋 Input:', input.adImage ? 'image' : 'text');
    console.log('🎯 Target:', input.targetUrl);

    // SINGLE SEQUENTIAL PIPELINE - No dual paths, no parallel execution
    const result = await generateTrulySimpleLandingPage(input);

    if (!result.success) {
      const meta = result.metadata as any || {};
      return NextResponse.json({
        success: false,
        error: meta.errors?.[0]?.message || 'Generation failed',
        state: meta.state,
        qaScore: meta.qaScore,
        stateHistory: meta.stateHistory,
        debug: { errors: meta.errors }
      }, { status: 400 });
    }

    // Create preview
    const previewId = nanoid(10);
    PREVIEWS[previewId] = {
      spec: result.spec,
      html: result.html,
      metadata: result.metadata
    };

    console.log('✅ Generated:');
    console.log('   Brand:', result.spec?.brand?.name);
    console.log('   Category:', result.spec?.brand?.category);
    const meta = result.metadata as any;
    console.log('   QA Score:', meta?.qaScore);
    console.log('   State:', meta?.state);

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      spec: result.spec,
      qualityScore: meta?.qaScore || 85,
      engine: 'truly-simple-v2.0',
      state: meta?.state,
      stateHistory: meta?.stateHistory,
      debug: { errors: meta?.errors }
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