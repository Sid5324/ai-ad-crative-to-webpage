// packages/agents/page-strategy.ts
import { BaseAgent } from './base-agent';
import { PageStrategyOutput } from '../schemas/types';

export interface PageStrategyInput {
  adAnalysis: any;
  urlAnalysis: any;
  audienceAnalysis: any;
}

export class PageStrategyAgent extends BaseAgent<PageStrategyInput, PageStrategyOutput> {
  constructor() {
    super({
      name: 'page-strategy',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request', 'brand', 'session'],
        write_scopes: ['request', 'session'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'conversion-planning',
          'narrative-structuring',
          'section-prioritization',
          'persuasion-logic',
          'component-selection'
        ],
        optional: [
          'A/B-variant-planning',
          'CRO-heuristics'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: PageStrategyInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<PageStrategyOutput> {
    const { input } = context;

    // Plan conversion strategy
    const conversionPlan = await this.planConversionStrategy(input);

    // Structure narrative
    const narrativeStructure = await this.structureNarrative(input, conversionPlan);

    // Prioritize sections
    const sectionPriorities = await this.prioritizeSections(narrativeStructure, input);

    // Design CTA strategy
    const ctaStrategy = await this.designCTAstrategy(input, conversionPlan);

    // Select components
    const componentSelection = await this.selectComponents(input, sectionPriorities);

    return {
      page_goal: conversionPlan.primary_goal,
      narrative_angle: narrativeStructure.angle,
      section_order: sectionPriorities.order,
      cta_strategy: ctaStrategy.approach,
      must_include: sectionPriorities.required_sections,
      must_avoid: this.determineAvoidances(input, conversionPlan)
    };
  }

  private async planConversionStrategy(input: PageStrategyInput): Promise<any> {
    const conversionResult = await this.executeSkill('conversion-planning', {
      goals: this.extractGoals(input),
      audience: input.audienceAnalysis,
      content: { ad: input.adAnalysis, brand: input.urlAnalysis }
    });

    return {
      primary_goal: conversionResult.strategy === 'lead_generation' ? 'capture_lead' :
                   conversionResult.strategy === 'sales' ? 'drive_purchase' : 'build_awareness',
      funnel_stages: conversionResult.key_actions || [],
      optimization_points: conversionResult.optimization_points || []
    };
  }

  private async structureNarrative(input: PageStrategyInput, conversionPlan: any): Promise<any> {
    const narrativeResult = await this.executeSkill('narrative-structuring', {
      topic: input.adAnalysis.primary_hook || 'business_solution',
      audience: input.audienceAnalysis,
      goal: conversionPlan.primary_goal
    });

    return {
      angle: narrativeResult.structure?.flow ?
             this.determineNarrativeAngle(narrativeResult.structure.flow) :
             'problem_solution_benefits',
      emotional_arc: narrativeResult.emotional_arc || ['curiosity', 'concern', 'relief', 'confidence', 'action'],
      key_messages: narrativeResult.structure?.flow || []
    };
  }

  private async prioritizeSections(narrativeStructure: any, input: PageStrategyInput): Promise<any> {
    const prioritizationResult = await this.executeSkill('section-prioritization', {
      narrative: narrativeStructure,
      audience: input.audienceAnalysis,
      brand: input.urlAnalysis,
      conversion_goal: input.adAnalysis.cta
    });

    return {
      order: prioritizationResult.recommended_components || this.getDefaultSectionOrder(),
      required_sections: this.extractRequiredSections(input),
      priorities: prioritizationResult.priorities || {}
    };
  }

  private async designCTAstrategy(input: PageStrategyInput, conversionPlan: any): Promise<any> {
    const ctaLogic = await this.executeSkill('persuasion-logic', {
      audience: input.audienceAnalysis,
      offer: input.adAnalysis.offer,
      context: conversionPlan.primary_goal
    });

    return {
      approach: this.determineCTAStrategy(ctaLogic, input.audienceAnalysis.funnel_stage),
      hierarchy: ['primary', 'secondary', 'micro'],
      psychology: ctaLogic.persuasion_elements || ['urgency', 'value', 'social_proof']
    };
  }

  private async selectComponents(input: PageStrategyInput, sectionPriorities: any): Promise<any> {
    const componentResult = await this.executeSkill('component-selection', {
      content_type: 'landing_page',
      user_journey: input.audienceAnalysis.funnel_stage,
      brand_style: Array.isArray(input.urlAnalysis?.brand_voice) ? input.urlAnalysis.brand_voice.join(' ') : (typeof input.urlAnalysis?.brand_voice === 'string' ? input.urlAnalysis.brand_voice : 'professional')
    });

    return {
      recommended: componentResult.recommended_components || [],
      layout_strategy: componentResult.layout_strategy || 'f-pattern',
      responsive_considerations: componentResult.responsive_breakpoints || ['mobile', 'tablet', 'desktop']
    };
  }

  private extractGoals(input: PageStrategyInput): string[] {
    const goals = [];

    // Extract from ad CTA
    if (input.adAnalysis.cta) {
      if (input.adAnalysis.cta.toLowerCase().includes('trial') ||
          input.adAnalysis.cta.toLowerCase().includes('demo')) {
        goals.push('lead_generation');
      }
      if (input.adAnalysis.cta.toLowerCase().includes('buy') ||
          input.adAnalysis.cta.toLowerCase().includes('purchase')) {
        goals.push('direct_sales');
      }
    }

    // Extract from audience funnel stage
    if (input.audienceAnalysis.funnel_stage === 'consideration') {
      goals.push('education');
    }
    if (input.audienceAnalysis.funnel_stage === 'conversion') {
      goals.push('purchase');
    }

    return goals.length > 0 ? goals : ['lead_generation'];
  }

  private determineNarrativeAngle(flow: string[]): string {
    if (flow.includes('hook') && flow.includes('problem') && flow.includes('solution')) {
      return 'problem_solution_benefits';
    }
    if (flow.includes('story') || flow.includes('case_study')) {
      return 'story_driven';
    }
    if (flow.includes('benefits') && flow.includes('features')) {
      return 'benefit_focused';
    }
    return 'educational';
  }

  private getDefaultSectionOrder(): string[] {
    return [
      'hero',
      'problem',
      'solution',
      'benefits',
      'social_proof',
      'features',
      'pricing',
      'faq',
      'cta'
    ];
  }

  private extractRequiredSections(input: PageStrategyInput): string[] {
    const required = ['hero'];

    // Add based on audience pain points
    if (input.audienceAnalysis.pain_points?.length > 0) {
      required.push('problem');
    }

    // Add based on brand services
    if (input.urlAnalysis.services?.length > 0) {
      required.push('solution');
    }

    // Add based on trust signals
    if (input.urlAnalysis.trust_signals?.length > 0) {
      required.push('social_proof');
    }

    return required;
  }

  private determineCTAStrategy(ctaLogic: any, funnelStage: string): string {
    if (funnelStage === 'awareness') {
      return 'soft_cta_lead_magnet';
    }
    if (funnelStage === 'consideration') {
      return 'demo_trial_focused';
    }
    if (funnelStage === 'conversion') {
      return 'direct_purchase';
    }
    return 'progressive_cta_ladder';
  }

  private determineAvoidances(input: PageStrategyInput, conversionPlan: any): string[] {
    const avoidances = [];

    // Avoid overwhelming if audience is in early funnel
    if (input.audienceAnalysis.funnel_stage === 'awareness') {
      avoidances.push('complex_pricing_tables');
      avoidances.push('detailed_feature_lists');
    }

    // Avoid generic content
    if (!input.urlAnalysis.facts?.length) {
      avoidances.push('generic_statistics');
    }

    // Avoid mismatched tone
    if (input.adAnalysis.tone?.includes('professional') &&
        input.urlAnalysis.brand_voice?.includes('casual')) {
      avoidances.push('informal_language');
    }

    return avoidances;
  }

  protected calculateConfidence(output: PageStrategyOutput): number {
    let confidence = 0.8; // Base confidence

    if (output.page_goal && output.page_goal !== 'build_awareness') confidence += 0.05;
    if (output.narrative_angle) confidence += 0.05;
    if (output.section_order?.length > 0) confidence += 0.05;
    if (output.cta_strategy) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: PageStrategyOutput): any {
    return {
      strategy_patterns: [output.page_goal],
      narrative_patterns: [output.narrative_angle],
      section_patterns: output.section_order,
      cta_patterns: [output.cta_strategy]
    };
  }
}