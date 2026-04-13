// app/api/generate-simple/route.ts - Truly Simplified Landing Page Generator API
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateTrulySimpleLandingPage, type LandingPageInput } from '@/lib/truly-simple-landing-generator';

const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  console.log('🎯 CORE LANDING PAGE GENERATION START');

  const body = await req.json();
  const input: LandingPageInput = {
    adImage: body.adImageUrl || undefined,
    adText: body.adInputValue || body.adCopy || undefined,
    category: body.category || 'Business', // Add default category
    targetUrl: body.targetUrl || body.url || ''
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
        error: 'Either adImageUrl or adInputValue (ad copy) is required'
      }, { status: 400 });
    }

    console.log('📋 Input:', {
      adType: input.adImage ? 'image' : 'text',
      targetUrl: input.targetUrl
    });

    // Generate landing page with truly simplified generator
    const result = await generateTrulySimpleLandingPage(input);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Generation failed',
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

    console.log('✅ Truly simple generation completed:');
    console.log(`   Brand: ${result.spec.brand.name}`);
    console.log(`   Category: ${result.spec.brand.category}`);
    console.log(`   Duration: ${result.metadata.duration}ms`);
    console.log(`   HTML Length: ${result.html.length} chars`);

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      brand: result.spec.brand,
      spec: result.spec,
      metadata: result.metadata,
      engine: 'truly-simple-landing-generator-v1.0'
    });

  } catch (error: any) {
    console.error('❌ API Error:', error?.message || error);

    return NextResponse.json({
      success: false,
      error: error?.message || 'Internal server error',
      metadata: {
        brand: 'Error',
        adType: 'unknown',
        confidence: 0,
        generationTime: 0
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