// app/api/generate/route.ts - Nexus 30-Agent DAG System
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { nexusOrchestrator } from '@/lib/nexus/nexus-orchestrator';

const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  console.log('🚀 PRODUCTION LANDING PAGE GENERATION START');

  const body = await req.json();
  const nexusInput = {
    targetUrl: body.targetUrl || body.url || '',
    adInputType: (body.adImageUrl ? 'image_url' : 'copy') as 'image_url' | 'copy',
    adInputValue: body.adImageUrl || body.adInputValue || body.adCopy || ''
  };

  try {
    if (!nexusInput.targetUrl) {
      return NextResponse.json({ success: false, error: 'targetUrl required' }, { status: 400 });
    }

    if (!nexusInput.adInputValue) {
      return NextResponse.json({ success: false, error: 'Either adImageUrl or adInputValue required' }, { status: 400 });
    }

    console.log('📋 Nexus Input:', nexusInput.adInputType);
    console.log('🎯 Target:', nexusInput.targetUrl);

    // Generate with Nexus 30-Agent DAG System
    const result = await nexusOrchestrator.execute(nexusInput);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.errors?.[0] || 'Generation failed',
        errors: result.errors,
        agentTrace: result.agentTrace
      }, { status: 400 });
    }

    // Create preview
    const previewId = nanoid(10);
    PREVIEWS[previewId] = {
      spec: result.spec,
      html: result.html
    };

    console.log('✅ Nexus Generated:');
    console.log('   Agents Run:', result.agentTrace?.length || 0);
    console.log('   HTML Length:', result.html?.length || 0);

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      spec: result.spec,
      agentTrace: result.agentTrace,
      engine: 'nexus-30-agent-dag-v1.0'
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