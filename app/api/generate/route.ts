// app/api/generate/route.ts - Unified Nexus-ACE Nervous System
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { NexusACEOrchestrator } from '@/lib/ace/nexus-ace-orchestrator';

// Force redeploy test
const PREVIEWS: Record<string, any> = {};
const unifiedOrchestrator = new NexusACEOrchestrator();

export async function POST(req: Request) {
  const traceId = Math.random().toString(36).substring(7);
  console.log(`🚀 [${traceId}] ACE NERVOUS SYSTEM - GCM STATE MANAGEMENT`);
  console.log(`🚀 [${traceId}] ==================================================`);

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

  try {
    if (!input.targetUrl) {
      return NextResponse.json({ success: false, error: 'targetUrl required' }, { status: 400 });
    }

    if (!input.adInputValue) {
      return NextResponse.json({ success: false, error: 'Either adImageUrl or adInputValue required' }, { status: 400 });
    }

    console.log('📋 Input Type:', input.adInputType);
    console.log('🎯 Target URL:', input.targetUrl);

    // Execute Unified Nexus-ACE Orchestrator
    const result = await unifiedOrchestrator.execute(input);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.errors?.[0] || 'Generation failed',
        errors: result.errors,
        gcm: result.gcm
      }, { status: 400 });
    }

    // Log Unified GCM State - Nexus-ACE System
    console.log(`[${traceId}] 🧠 GCM State - NEXUS-ACE UNIFIED:`);
    console.log(`[${traceId}]   Intent Vector:`, result.gcm.intent_vector);
    console.log(`[${traceId}]   Visual DNA:`, result.gcm.visual_dna);
    console.log(`[${traceId}]   Proof Points:`, result.gcm.validated_proof_points?.map(p => p.value));
    console.log(`[${traceId}]   Copy Framework:`, result.gcm.copy_framework);
    console.log(`[${traceId}]   QA Gate:`, result.gcm.qa_gate_status);
    console.log(`[${traceId}]   Semantic Drift:`, result.gcm.semantic_drift_score);

// Create preview
    const previewId = nanoid(10);
    PREVIEWS[previewId] = {
      spec: result.gcm,
      html: result.html
    };

    console.log(`✅ [${traceId}] ACE Generation Complete`);
    console.log(`   [${traceId}] Agents Run:`, result.gcm.agent_trace?.length || 0);
    console.log(`   [${traceId}] HTML Length:`, result.html?.length || 0);

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      spec: result.gcm,
      agentTrace: result.gcm.agent_trace || [],
      engine: 'Nexus-ACE-Unified-v1.0'
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