// app/api/generate/route.ts - ACE Nervous System with GCM
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ACENexusOrchestrator } from '@/lib/ace/ace-orchestrator';

const PREVIEWS: Record<string, any> = {};
const aceOrchestrator = new ACENexusOrchestrator();

export async function POST(req: Request) {
  const traceId = Math.random().toString(36).substring(7);
  console.log(`🚀 [${traceId}] ACE NERVOUS SYSTEM - GCM STATE MANAGEMENT`);
  console.log(`🚀 [${traceId}] ==================================================`);

  const body = await req.json();
  console.log(`📥 [${traceId}] RAW BODY:`, JSON.stringify(body).substring(0, 500));
  
  const input = {
    targetUrl: body.targetUrl || body.url || '',
    adInputType: (body.adImageUrl ? 'image_url' : 'copy') as 'image_url' | 'copy',
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

    // Execute ACE Orchestrator with GCM
    const result = await aceOrchestrator.execute(input);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.errors?.[0] || 'Generation failed',
        errors: result.errors,
        gcm: result.gcm
      }, { status: 400 });
    }

    // Log GCM State - Using CORRECT property names for Elastic Weighting
    console.log('🧠 GCM State - ELASTIC WEIGHTING:');
    console.log('   Intent Weights:', result.gcm.intent_weights);
    console.log('   Confidence Score:', result.gcm.confidence_score);
    console.log('   Primary Intent:', result.gcm.intent_weights?.sort((a, b) => b.weight - a.weight)[0]?.label);
    console.log('   Visual DNA:', result.gcm.visualDNA.primaryColor);
    console.log('   Proof Points:', result.gcm.proofPoints?.map(p => p.value));
    console.log('   Copy Framework:', result.gcm.copyFramework);
    console.log('   Brand Name:', result.gcm.visualDNA.logoEmoji);

// Create preview
    const previewId = nanoid(10);
    PREVIEWS[previewId] = {
      spec: result.gcm,
      html: result.html
    };

console.log('✅ [${traceId}] ACE Generation Complete');
  console.log('   [${traceId}] Agents Run:', result.gcm.agentTrace?.length || 0);
  console.log('   [${traceId}] HTML Length:', result.html?.length || 0);

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      spec: result.gcm,
      agentTrace: result.gcm.agentTrace,
      engine: 'ACE-Nervous-System-v2.0'
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