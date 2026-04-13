// app/api/generate-26/route.ts - 26 Agent Multi-Agent AI Landing Page Generation
// Combines patterns from: gpt-researcher, superagent, babyagi, agent-gpt, autogpts

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { masterOrchestrator } from '@/lib/orchestrator';

export async function POST(req: Request) {
  console.log('🚀 [26-Agent API] Starting multi-agent landing page generation...');

  const body = await req.json();
  const input = {
    url: body.targetUrl || body.url || '',
    adImage: body.adImageUrl || body.adImage || '',
    adCopy: body.adCopy || body.adInputValue || ''
  };

  try {
    if (!input.url || !input.adImage) {
      return NextResponse.json({
        success: false,
        error: 'adImage and targetUrl are required'
      }, { status: 400 });
    }

    console.log('📋 Input:', { url: input.url, adImage: input.adImage.substring(0, 50) + '...' });

    // Execute the 26-agent orchestrator
    const result = await masterOrchestrator.createLandingPage(input);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Generation failed validation',
        qualityScore: result.qualityScore,
        debug: result.agentRuns
      }, { status: 400 });
    }

    console.log('✅ [26-Agent API] Success:', {
      qualityScore: result.qualityScore,
      agentRuns: Object.keys(result.agentRuns).length,
      htmlLength: result.html?.length
    });

    // Generate preview ID
    const previewId = nanoid(10);

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/api/preview?id=${previewId}`,
      html: result.html,
      spec: result.spec,
      qualityScore: result.qualityScore,
      engine: '26-agent-multi-swarm',
      debug: {
        agentRuns: result.agentRuns as Record<string, any>,
        phases: ['research-swarm', 'strategy-swarm', 'creative-swarm', 'validation-swarm', 'render-swarm'],
        totalAgents: 5
      }
    });

  } catch (error: any) {
    console.error('❌ [26-Agent API] Error:', error.message);

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      qualityScore: 0,
      engine: '26-agent-multi-swarm'
    }, { status: 500 });
  }
}