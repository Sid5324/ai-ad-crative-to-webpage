// app/api/generate/route.ts - Simplified for testing
import { NextResponse } from 'next/server';

// Force redeploy test
const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: 'API reachable',
      received: body
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Invalid request'
    }, { status: 400 });
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

    if (!input.adInputValue) {
      return NextResponse.json({ success: false, error: 'Either adImageUrl or adInputValue required' }, { status: 400 });
    }

    console.log('📋 Input Type:', input.adInputType);
    console.log('🎯 Target URL:', input.targetUrl);

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

     // Create preview
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

// Simple test version - no middleware
export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: 'API reachable',
      received: body
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Invalid request'
    }, { status: 400 });
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