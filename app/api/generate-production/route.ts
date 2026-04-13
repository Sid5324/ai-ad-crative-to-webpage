// app/api/generate-production/route.ts - Production API with Agent Framework
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateProductionLandingPage, type ProductionLandingInput } from '@/lib/production-landing-generator';

const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  console.log('🚀 PRODUCTION LANDING PAGE GENERATION START');

  const body = await req.json();
  const input: ProductionLandingInput = {
    targetUrl: body.targetUrl || body.url || '',
    adImage: body.adImageUrl || undefined,
    adText: body.adInputValue || body.adCopy || undefined,
    category: body.category || undefined
  };

  try {
    if (!input.targetUrl) {
      return NextResponse.json({
        success: false,
        error: 'targetUrl is required'
      }, { status: 400 });
    }

    if (!input.adImage && !input.adText) {
      return NextResponse.json({
        success: false,
        error: 'Either adImageUrl or adInputValue is required'
      }, { status: 400 });
    }

    console.log('📋 Production Input:', {
      url: input.targetUrl,
      hasImage: !!input.adImage,
      hasText: !!input.adText,
      category: input.category
    });

    // Generate with production framework
    const result = await generateProductionLandingPage(input);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.errors[0] || 'Generation failed',
        state: result.state,
        errors: result.errors,
        spec: result.spec,
        metadata: result.metadata
      }, { status: 400 });
    }

    // Create preview
    const previewId = nanoid(10);
    PREVIEWS[previewId] = {
      spec: result.spec,
      html: result.html,
      metadata: result.metadata
    };

    console.log('✅ Production generation completed:');
    console.log(`   State: ${result.state}`);
    console.log(`   QA Score: ${result.metadata.qaScore}`);
    console.log(`   Duration: ${result.metadata.duration}ms`);
    console.log(`   HTML Size: ${result.html?.length} chars`);

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      spec: result.spec,
      state: result.state,
      metadata: result.metadata,
      engine: 'production-agent-framework-v1.0'
    });

  } catch (error: any) {
    console.error('❌ Production API Error:', error?.message || error);

    return NextResponse.json({
      success: false,
      error: error?.message || 'Internal server error',
      state: 'CRITICAL_ERROR',
      metadata: {
        duration: 0,
        skillsUsed: [],
        version: 'production-v1.0'
      }
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