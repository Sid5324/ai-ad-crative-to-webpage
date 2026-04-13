// packages/agents/component-plan-agent.ts
import { BaseAgent } from './base-agent';
import { ComponentPlanOutput } from '../schemas/types';

export interface ComponentPlanInput {
  strategy: any;
  copy: any;
  tokens: any;
}

export class ComponentPlanAgent extends BaseAgent<ComponentPlanInput, ComponentPlanOutput> {
  constructor() {
    super({
      name: 'component-plan-agent',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request', 'session'],
        write_scopes: ['request'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'component-matching',
          'slot-mapping',
          'layout-logic',
          'responsive-planning'
        ],
        optional: [
          'accessibility-layout-checking'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: ComponentPlanInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<ComponentPlanOutput> {
    const { input } = context;

    // Determine page sections based on strategy
    const pageSections = this.determinePageSections(input.strategy);

    // Select components for each section
    const componentSelections = await this.selectComponents(pageSections, input);

    // Map content to component slots
    const slotMappings = await this.mapContentToSlots(componentSelections, input.copy);

    // Plan responsive layout
    const responsivePlan = await this.planResponsiveLayout(componentSelections, input.tokens);

    return {
      page_id: this.generatePageId(input),
      components: componentSelections.map((selection, index) => ({
        component_type: selection.type,
        variant: selection.variant,
        slot_map: slotMappings[index] || {},
        visibility_rules: selection.visibility_rules || []
      }))
    };
  }

  private determinePageSections(strategy: any): string[] {
    // Use strategy section order, with fallbacks
    if (strategy?.section_order && Array.isArray(strategy.section_order)) {
      return strategy.section_order;
    }

    // Default section order based on page goal
    const goal = strategy?.page_goal || 'lead_generation';

    switch (goal) {
      case 'direct_sales':
        return ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta'];
      case 'lead_generation':
        return ['hero', 'problem', 'solution', 'benefits', 'social_proof', 'cta'];
      case 'build_awareness':
        return ['hero', 'story', 'impact', 'call_to_action'];
      default:
        return ['hero', 'features', 'benefits', 'testimonials', 'cta'];
    }
  }

  private async selectComponents(sections: string[], input: ComponentPlanInput): Promise<any[]> {
    const components = [];

    for (const section of sections) {
      const componentSelection = await this.executeSkill('component-matching', {
        content_type: section,
        user_journey: this.inferUserJourney(input.strategy),
        brand_style: input.tokens?.theme_name || 'professional'
      });

      components.push({
        type: this.mapSectionToComponent(section),
        variant: componentSelection.recommended_components?.[0]?.variant || 'default',
        visibility_rules: this.generateVisibilityRules(section, input.strategy)
      });
    }

    return components;
  }

  private async mapContentToSlots(components: any[], copy: any): Promise<any[]> {
    const slotMappings = [];

    for (const component of components) {
      const slotMapping = await this.executeSkill('slot-mapping', {
        content: copy,
        component_structure: component,
        component_type: component.type
      });

      slotMappings.push(slotMapping.mappings || {});
    }

    return slotMappings;
  }

  private async planResponsiveLayout(components: any[], tokens: any): Promise<any> {
    const layoutPlan = await this.executeSkill('responsive-planning', {
      components: components.map(c => c.type),
      design_tokens: tokens,
      content_priority: this.determineContentPriority(components)
    });

    return {
      breakpoints: layoutPlan.breakpoints || ['mobile', 'tablet', 'desktop'],
      layout_rules: layoutPlan.layout_rules || []
    };
  }

  private mapSectionToComponent(section: string): string {
    const componentMap: Record<string, string> = {
      'hero': 'hero_section',
      'problem': 'problem_statement',
      'solution': 'solution_showcase',
      'features': 'feature_grid',
      'benefits': 'benefit_list',
      'pricing': 'pricing_table',
      'testimonials': 'testimonial_carousel',
      'social_proof': 'trust_indicators',
      'story': 'narrative_section',
      'impact': 'impact_metrics',
      'faq': 'faq_accordion',
      'cta': 'call_to_action'
    };

    return componentMap[section] || 'content_section';
  }

  private inferUserJourney(strategy: any): string {
    const goal = strategy?.page_goal || 'lead_generation';
    const funnel = strategy?.audience_analysis?.funnel_stage || 'consideration';

    if (goal === 'direct_sales' && funnel === 'conversion') {
      return 'purchase_intent';
    }
    if (funnel === 'awareness') {
      return 'brand_discovery';
    }
    if (funnel === 'consideration') {
      return 'solution_exploration';
    }

    return 'general_evaluation';
  }

  private generateVisibilityRules(section: string, strategy: any): string[] {
    const rules = [];

    // Add rules based on must_include/must_avoid
    if (strategy?.must_include && strategy.must_include.includes(section)) {
      rules.push('always_visible');
    }

    if (strategy?.must_avoid && strategy.must_avoid.some((avoid: string) =>
      section.toLowerCase().includes(avoid.toLowerCase()))) {
      rules.push('conditionally_hidden');
    }

    // Add responsive rules
    if (['testimonials', 'pricing'].includes(section)) {
      rules.push('hide_on_mobile');
    }

    return rules.length > 0 ? rules : ['default'];
  }

  private determineContentPriority(components: any[]): any {
    // Prioritize hero, then key conversion elements, then supporting content
    const priorities = {
      high: components.filter(c => ['hero_section', 'call_to_action'].includes(c.type)).length,
      medium: components.filter(c => ['feature_grid', 'benefit_list', 'problem_statement'].includes(c.type)).length,
      low: components.filter(c => ['testimonial_carousel', 'faq_accordion'].includes(c.type)).length
    };

    return priorities;
  }

  private generatePageId(input: ComponentPlanInput): string {
    const timestamp = Date.now();
    const strategy = input.strategy?.page_goal || 'general';
    const theme = input.tokens?.theme_name || 'default';

    return `page_${strategy}_${theme}_${timestamp}`;
  }

  protected calculateConfidence(output: ComponentPlanOutput): number {
    let confidence = 0.8; // Base confidence

    if (output.components && output.components.length > 0) confidence += 0.1;
    if (output.page_id) confidence += 0.05;
    if (output.components?.some(c => c.slot_map && Object.keys(c.slot_map).length > 0)) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: ComponentPlanOutput): any {
    return {
      component_types: output.components?.map(c => c.component_type) || [],
      layout_patterns: output.components?.map(c => c.variant) || [],
      content_mapping: output.components?.filter(c => c.slot_map).length || 0
    };
  }
}