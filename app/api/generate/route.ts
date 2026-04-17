// app/api/generate/route.ts - Modern Ad Creative Generation System
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { modernOrchestrator } from '@/lib/core/modern-orchestrator';
import { performanceMonitor } from '@/lib/core/monitoring';

// Force redeploy test
const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  const traceId = Math.random().toString(36).substring(7);
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
      performanceMonitor.recordRequest('/api/generate', Date.now() - startTime, false);
      return NextResponse.json({ success: false, error: 'targetUrl required' }, { status: 400 });
    }

    if (!input.adInputValue) {
      performanceMonitor.recordRequest('/api/generate', Date.now() - startTime, false);
      return NextResponse.json({ success: false, error: 'Either adImageUrl or adInputValue required' }, { status: 400 });
    }

    console.log('📋 Input Type:', input.adInputType);
    console.log('🎯 Target URL:', input.targetUrl);

    // Execute Modern Orchestrator
    const result = await modernOrchestrator.generate(input);

    // Record performance metrics
    performanceMonitor.recordRequest('/api/generate', Date.now() - startTime, result.success);

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

    // Create preview
    const previewId = nanoid(10);
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
      engine: 'Modern-Ad-Creative-System-v2.0'
    });

  } catch (error: any) {
    console.error(`💥 [${traceId}] Critical error:`, error?.message || error);

    // Record error
    performanceMonitor.recordRequest('/api/generate', Date.now() - startTime, false);

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id || !PREVIEWS[id]) {
    return NextResponse.json({ error: 'Preview expired' }, { status: 404 });
  }

  return NextResponse.json(PREVIEWS[id]);
}