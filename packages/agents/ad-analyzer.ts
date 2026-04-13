// packages/agents/ad-analyzer.ts - PRODUCTION AD ANALYZER AGENT
import { BaseAgent, ExecutionContext, AgentConfig } from './base-agent';
import { groqCall } from '../../src/lib/ai/providers';

export interface AdAnalyzerInput {
  adInputType: 'image_url' | 'copy';
  adInputValue: string;
}

export interface AdAnalyzerOutput {
  emotionalHook: string;
  visualWeight: string;
  ctaIntent: string;
  audienceSegment: string;
  messageHierarchy: string[];
  confidence: number;
}

export class AdAnalyzerAgent extends BaseAgent<AdAnalyzerInput, AdAnalyzerOutput> {
  constructor() {
    super({
      name: 'ad-analyzer',
      version: '2.0.0',
      memoryPolicy: {
        read_scopes: ['request'],
        write_scopes: ['request', 'brand'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: ['multimodal-ad-reading', 'cta-detection', 'audience-inference']
      }
    } as AgentConfig);
  }

  protected async executeCore(context: {
    input: AdAnalyzerInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<AdAnalyzerOutput> {
    const { input } = context;
    const { adInputType, adInputValue } = input;

    console.log('[AdAnalyzer] Processing ad input:', adInputType);

    // Build analysis prompt
    const prompt = adInputType === 'image_url'
      ? `Analyze this ad image and extract: emotional hook, visual weight/style, CTA intent, audience segment, message hierarchy. Return JSON with fields: emotionalHook, visualWeight, ctaIntent, audienceSegment, messageHierarchy (array), confidence (0-1).`
      : `Analyze this ad copy: "${adInputValue}". Extract: emotional hook, CTA intent, audience segment, message hierarchy. Return JSON with fields: emotionalHook, ctaIntent, audienceSegment, messageHierarchy (array), confidence (0-1).`;

    try {
      const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
      const result = raw as any;

      return {
        emotionalHook: result.emotionalHook || 'N/A',
        visualWeight: result.visualWeight || 'modern',
        ctaIntent: result.ctaIntent || 'Get Started',
        audienceSegment: result.audienceSegment || 'general',
        messageHierarchy: result.messageHierarchy || ['main benefit'],
        confidence: result.confidence || 0.7
      };
    } catch (error) {
      console.error('[AdAnalyzer] LLM call failed:', error);
      // Return fallback
      return {
        emotionalHook: 'Value proposition',
        visualWeight: 'modern',
        ctaIntent: 'Get Started',
        audienceSegment: 'general',
        messageHierarchy: ['main benefit'],
        confidence: 0.5
      };
    }
  }
}