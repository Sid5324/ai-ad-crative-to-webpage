// packages/agents/ad-analyzer.ts
import { BaseAgent } from './base-agent';
import { AdAnalyzerOutput } from '../schemas/types';

export interface AdAnalyzerInput {
  adInputType: 'image_url' | 'copy';
  adInputValue: string;
  audienceOverride?: string;
}

export class AdAnalyzerAgent extends BaseAgent<AdAnalyzerInput, AdAnalyzerOutput> {
  constructor() {
    super({
      name: 'ad-analyzer',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request'],
        write_scopes: ['request', 'brand'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'multimodal-ad-reading',
          'OCR-text-extraction',
          'message-hierarchy-analysis',
          'CTA-detection',
          'audience-inference'
        ],
        optional: [
          'video-frame-summary',
          'emotion-tone-analysis'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: AdAnalyzerInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<AdAnalyzerOutput> {
    const { input } = context;

    let extractedContent: any = {};

    // Extract content based on input type
    if (input.adInputType === 'image_url') {
      extractedContent = await this.analyzeImageAd(input.adInputValue);
    } else {
      extractedContent = await this.analyzeTextAd(input.adInputValue);
    }

    // Analyze message hierarchy
    const messageAnalysis = await this.analyzeMessageHierarchy(extractedContent);

    // Detect CTAs
    const ctaAnalysis = await this.detectCTAs(extractedContent, messageAnalysis);

    // Infer audience
    const audienceAnalysis = await this.inferAudience(messageAnalysis, ctaAnalysis, input.audienceOverride);

    return {
      brand_name: messageAnalysis.brand_name || 'Unknown Brand',
      ad_format: input.adInputType === 'image_url' ? 'visual_ad' : 'text_ad',
      primary_hook: messageAnalysis.primary_hook,
      secondary_messages: messageAnalysis.secondary_messages,
      cta: ctaAnalysis.primary_cta,
      audience_segments: audienceAnalysis.segments,
      offer: ctaAnalysis.offer,
      tone: messageAnalysis.tone || ['professional'],
      visual_cues: extractedContent.visual_cues || []
    };
  }

  private async analyzeImageAd(imageUrl: string): Promise<any> {
    // Use multimodal analysis skill
    const multimodalResult = await this.executeSkill('multimodal-ad-reading', {
      imageData: imageUrl,
      analysisType: 'full'
    });

    // Extract text using OCR if needed
    let ocrResult = {};
    if (!multimodalResult.text || multimodalResult.text.length < 10) {
      ocrResult = await this.executeSkill('OCR-text-extraction', {
        imageData: imageUrl,
        language: 'en'
      });
    }

    return {
      ...multimodalResult,
      ...ocrResult,
      visual_cues: multimodalResult.layout?.elements || []
    };
  }

  private async analyzeTextAd(textContent: string): Promise<any> {
    return {
      text: textContent,
      visual_cues: [],
      layout: { elements: ['text'] }
    };
  }

  private async analyzeMessageHierarchy(content: any): Promise<any> {
    const analysisResult = await this.executeSkill('message-hierarchy-analysis', {
      content: content.text || content,
      format: content.layout ? 'visual' : 'text'
    });

    return {
      brand_name: this.extractBrandName(content, analysisResult),
      primary_hook: analysisResult.primary_message || content.text?.split('.')[0] || 'Unknown hook',
      secondary_messages: analysisResult.secondary_messages || [],
      tone: this.detectTone(content, analysisResult)
    };
  }

  private async detectCTAs(content: any, messageAnalysis: any): Promise<any> {
    const ctaResult = await this.executeSkill('CTA-detection', {
      content: content.text || content,
      context: messageAnalysis,
      format: content.layout ? 'visual' : 'text'
    });

    return {
      primary_cta: ctaResult.primary_cta || 'Contact Us',
      secondary_ctas: ctaResult.secondary_ctas || [],
      offer: ctaResult.offer || 'Special offer'
    };
  }

  private async inferAudience(messageAnalysis: any, ctaAnalysis: any, override?: string): Promise<any> {
    const audienceResult = await this.executeSkill('audience-inference', {
      content: messageAnalysis,
      cta: ctaAnalysis,
      override: override
    });

    return {
      segments: audienceResult.segments || ['general_consumers'],
      primary_segment: audienceResult.primary_segment || 'general_consumers'
    };
  }

  private extractBrandName(content: any, analysis: any): string {
    // Try to extract brand from content or analysis
    if (analysis.brand_mentions && analysis.brand_mentions.length > 0) {
      return analysis.brand_mentions[0];
    }

    // Look for common brand patterns in text
    const text = content.text || '';
    const brandPatterns = [
      /(?:by|from)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i,
      /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/
    ];

    for (const pattern of brandPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Unknown Brand';
  }

  private detectTone(content: any, analysis: any): string[] {
    // Default tone detection based on content analysis
    const text = (content.text || '').toLowerCase();

    const tones = [];
    if (text.includes('professional') || text.includes('expert')) tones.push('professional');
    if (text.includes('friendly') || text.includes('welcome')) tones.push('friendly');
    if (text.includes('urgent') || text.includes('limited time')) tones.push('urgent');
    if (text.includes('premium') || text.includes('luxury')) tones.push('premium');

    return tones.length > 0 ? tones : ['professional'];
  }

  protected calculateConfidence(output: AdAnalyzerOutput): number {
    // Calculate confidence based on analysis completeness
    let confidence = 0.8; // Base confidence

    if (output.primary_hook && output.primary_hook !== 'Unknown hook') confidence += 0.1;
    if (output.brand_name && output.brand_name !== 'Unknown Brand') confidence += 0.05;
    if (output.audience_segments && output.audience_segments.length > 0) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: AdAnalyzerOutput): any {
    return {
      brand_patterns: [output.brand_name],
      tone_patterns: output.tone,
      cta_patterns: [output.cta],
      audience_patterns: output.audience_segments
    };
  }
}