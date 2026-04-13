// packages/agents/audience-intent.ts
import { BaseAgent } from './base-agent';
import { AudienceIntentOutput } from '../schemas/types';

export interface AudienceIntentInput {
  adAnalysis: any;
  urlAnalysis: any;
}

export class AudienceIntentAgent extends BaseAgent<AudienceIntentInput, AudienceIntentOutput> {
  constructor() {
    super({
      name: 'audience-intent',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request', 'brand'],
        write_scopes: ['request', 'session'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'persona-mapping',
          'funnel-stage-inference',
          'objection-detection',
          'pain-point-clustering'
        ],
        optional: [
          'psychographic-analysis',
          'behavioral-pattern-recognition'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: AudienceIntentInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<AudienceIntentOutput> {
    const { input } = context;

    // Map to personas
    const personaAnalysis = await this.executeSkill('persona-mapping', {
      adContent: input.adAnalysis,
      brandData: input.urlAnalysis,
      context: 'landing_page_conversion'
    });

    // Infer funnel stage
    const funnelAnalysis = await this.executeSkill('funnel-stage-inference', {
      adContent: input.adAnalysis,
      brandContent: input.urlAnalysis,
      user_signals: this.extractUserSignals(input)
    });

    // Detect objections
    const objectionAnalysis = await this.executeSkill('objection-detection', {
      adContent: input.adAnalysis,
      brandContent: input.urlAnalysis,
      funnel_stage: funnelAnalysis.stage
    });

    // Cluster pain points
    const painPointAnalysis = await this.executeSkill('pain-point-clustering', {
      content: { ...input.adAnalysis, ...input.urlAnalysis },
      objections: objectionAnalysis.objections,
      context: funnelAnalysis.stage
    });

    return {
      primary_persona: personaAnalysis.primary_persona || this.createDefaultPersona(input),
      funnel_stage: funnelAnalysis.stage || 'consideration',
      pain_points: painPointAnalysis.clusters || [],
      desired_outcomes: this.extractDesiredOutcomes(input, personaAnalysis),
      objections: objectionAnalysis.objections || []
    };
  }

  private extractUserSignals(input: AudienceIntentInput): any[] {
    const signals = [];

    // Extract signals from ad analysis
    if (input.adAnalysis) {
      signals.push({
        type: 'ad_response',
        content: input.adAnalysis.primary_hook,
        audience_segments: input.adAnalysis.audience_segments
      });
    }

    // Extract signals from brand analysis
    if (input.urlAnalysis) {
      signals.push({
        type: 'brand_interaction',
        content: input.urlAnalysis.existing_sections,
        industry: input.urlAnalysis.industry
      });
    }

    return signals;
  }

  private createDefaultPersona(input: AudienceIntentInput): string {
    // Create a persona based on available data
    const adSegments = input.adAnalysis?.audience_segments || [];
    const industry = input.urlAnalysis?.industry || 'general';

    if (adSegments.includes('business_professionals') || industry.includes('B2B')) {
      return 'Business Professional';
    } else if (adSegments.includes('tech_savvy') || industry.includes('Technology')) {
      return 'Tech-Savvy Consumer';
    } else if (adSegments.includes('young_professionals')) {
      return 'Young Professional';
    } else {
      return 'General Consumer';
    }
  }

  private extractDesiredOutcomes(input: AudienceIntentInput, personaAnalysis: any): string[] {
    const outcomes = new Set<string>();

    // Extract from ad CTAs and offers
    if (input.adAnalysis?.cta) {
      outcomes.add(this.inferOutcomeFromCTA(input.adAnalysis.cta));
    }

    if (input.adAnalysis?.offer) {
      outcomes.add('Get special offer');
    }

    // Extract from brand services
    if (input.urlAnalysis?.services) {
      input.urlAnalysis.services.forEach((service: string) => {
        outcomes.add(`Access ${service.toLowerCase()}`);
      });
    }

    // Add persona-specific outcomes
    if (personaAnalysis?.motivations) {
      personaAnalysis.motivations.forEach((motivation: string) => {
        outcomes.add(motivation);
      });
    }

    return Array.from(outcomes);
  }

  private inferOutcomeFromCTA(cta: string): string {
    const ctaLower = cta.toLowerCase();

    if (ctaLower.includes('learn more') || ctaLower.includes('discover')) {
      return 'Learn about the solution';
    } else if (ctaLower.includes('contact') || ctaLower.includes('get quote')) {
      return 'Get personalized consultation';
    } else if (ctaLower.includes('start') || ctaLower.includes('begin')) {
      return 'Start using the service';
    } else if (ctaLower.includes('download') || ctaLower.includes('get')) {
      return 'Access valuable resources';
    } else {
      return 'Take action on offer';
    }
  }

  protected calculateConfidence(output: AudienceIntentOutput): number {
    let confidence = 0.75; // Base confidence

    if (output.primary_persona && output.primary_persona !== 'General Consumer') confidence += 0.1;
    if (output.funnel_stage && output.funnel_stage !== 'consideration') confidence += 0.05;
    if (output.pain_points && output.pain_points.length > 0) confidence += 0.05;
    if (output.desired_outcomes && output.desired_outcomes.length > 0) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: AudienceIntentOutput): any {
    return {
      persona_patterns: [output.primary_persona],
      funnel_patterns: [output.funnel_stage],
      pain_point_patterns: output.pain_points,
      objection_patterns: output.objections
    };
  }
}