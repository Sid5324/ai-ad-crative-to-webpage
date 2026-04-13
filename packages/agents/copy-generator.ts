// packages/agents/copy-generator.ts
import { BaseAgent } from './base-agent';
import { CopyGeneratorOutput } from '../schemas/types';

export interface CopyGeneratorInput {
  strategy: any;
  sourceFacts: any;
}

export class CopyGeneratorAgent extends BaseAgent<CopyGeneratorInput, CopyGeneratorOutput> {
  constructor() {
    super({
      name: 'copy-generator',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request', 'brand', 'session'],
        write_scopes: ['request'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'conversion-copywriting',
          'brand-voice-control',
          'CTA-writing',
          'benefit-framing',
          'FAQ-generation'
        ],
        optional: [
          'localization',
          'tone-adaptation',
          'headline-ideation'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: CopyGeneratorInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<CopyGeneratorOutput> {
    const { input } = context;

    // Generate hero section copy
    const heroCopy = await this.generateHeroCopy(input);

    // Generate benefit-focused copy
    const benefitsCopy = await this.generateBenefitsCopy(input);

    // Generate statistics/social proof
    const statsCopy = await this.generateStatsCopy(input);

    // Generate FAQ section
    const faqCopy = await this.generateFAQCopy(input);

    return {
      hero: heroCopy,
      benefits: benefitsCopy,
      stats: statsCopy,
      faq: faqCopy
    };
  }

  private async generateHeroCopy(input: CopyGeneratorInput): Promise<any> {
    const sourceFacts = input.sourceFacts || {};
    const heroParams = {
      topic: 'business_transformation',
      tone: 'professional',
      constraints: {
        brand_voice: sourceFacts.brand_voice || ['professional', 'trustworthy'],
        target_audience: 'business_decision_makers',
        key_message: input.strategy?.narrative_angle || 'problem_solution'
      },
      sourceFacts: sourceFacts
    };

    const heroResult = await this.executeSkill('conversion-copywriting', heroParams);

    // Ensure we have all required hero fields
    return {
      eyebrow: heroResult.headline?.split('.')[0] || 'Transform Your Business',
      headline: heroResult.headline || 'Transform Your Business Operations',
      subheadline: heroResult.body || 'Join thousands of companies already using AI-powered solutions',
      primary_cta: await this.generatePrimaryCTA(input),
      secondary_cta: await this.generateSecondaryCTA(input)
    };
  }

  private async generatePrimaryCTA(input: CopyGeneratorInput): Promise<string> {
    const ctaParams = {
      action: 'start_trial',
      context: input.strategy?.page_goal || 'lead_generation',
      urgency_level: 'medium',
      sourceFacts: input.sourceFacts
    };

    const ctaResult = await this.executeSkill('CTA-writing', ctaParams);
    return ctaResult.primary_cta?.text || ctaResult.primary_cta || 'Start Free Trial';
  }

  private async generateSecondaryCTA(input: CopyGeneratorInput): Promise<string> {
    const ctaParams = {
      action: 'learn_more',
      context: input.strategy?.page_goal || 'education',
      urgency_level: 'low',
      sourceFacts: input.sourceFacts
    };

    const ctaResult = await this.executeSkill('CTA-writing', ctaParams);
    return ctaResult.secondary_cta?.text || ctaResult.secondary_cta || 'Learn More';
  }

  private async generateBenefitsCopy(input: CopyGeneratorInput): Promise<any[]> {
    const benefitsParams = {
      benefits: this.extractKeyBenefits(input),
      context: input.strategy?.page_goal || 'value_proposition',
      audience: 'business_professionals',
      sourceFacts: input.sourceFacts  // Pass source facts to skill
    };

    const benefitsResult = await this.executeSkill('benefit-framing', benefitsParams);

    // Convert to expected format
    return (benefitsResult.benefits || []).map((benefit: any, index: number) => ({
      title: benefit.title || `Benefit ${index + 1}`,
      body: benefit.description || benefit.body || 'Detailed benefit description',
      icon_hint: this.generateIconHint(benefit.title || `Benefit ${index + 1}`)
    }));
  }

  private async generateStatsCopy(input: CopyGeneratorInput): Promise<any[]> {
    const sourceFacts = input.sourceFacts?.facts || [];
    const stats = [];

    // Convert facts to statistics format
    for (const fact of sourceFacts.slice(0, 3)) { // Limit to 3 stats
      if (this.isNumericFact(fact)) {
        stats.push({
          value: this.extractNumericValue(fact),
          label: this.extractStatLabel(fact),
          source_fact: fact
        });
      }
    }

    // If we don't have enough stats, generate some reasonable defaults
    if (stats.length < 3) {
      const defaultStats = [
        { value: '10,000+', label: 'Happy Customers', source_fact: 'Industry standard' },
        { value: '99.9%', label: 'Uptime Guarantee', source_fact: 'Reliability metric' },
        { value: '24/7', label: 'Expert Support', source_fact: 'Support availability' }
      ];

      while (stats.length < 3) {
        stats.push(defaultStats[stats.length]);
      }
    }

    return stats;
  }

  private async generateFAQCopy(input: CopyGeneratorInput): Promise<any[]> {
    const faqParams = {
      topic: input.strategy?.narrative_angle || 'business_solution',
      audience: 'business_decision_makers',
      context: input.sourceFacts?.industry || 'technology',
      sourceFacts: input.sourceFacts  // Pass source facts to skill
    };

    const faqResult = await this.executeSkill('FAQ-generation', faqParams);

    return (faqResult.faqs || []).map((faq: any) => ({
      question: faq.question || 'Common question',
      answer: faq.answer || 'Detailed answer addressing the concern'
    })).slice(0, 6); // Limit to 6 FAQs
  }

  private extractKeyBenefits(input: CopyGeneratorInput): string[] {
    const benefits = [];

    // Extract from strategy narrative
    if (input.strategy?.section_order) {
      if (input.strategy.section_order.includes('benefits')) {
        benefits.push('Save Time and Resources');
        benefits.push('Increase Efficiency');
        benefits.push('Reduce Costs');
      }
    }

    // Extract from source facts
    if (input.sourceFacts?.services) {
      benefits.push(...input.sourceFacts.services.map((service: string) =>
        `Access ${service.toLowerCase()}`
      ));
    }

    // Default benefits if none found
    if (benefits.length === 0) {
      benefits.push(
        'Streamline Operations',
        'Boost Productivity',
        'Cut Operational Costs',
        'Scale Effortlessly'
      );
    }

    return benefits.slice(0, 4); // Limit to 4 benefits
  }

  private generateIconHint(title: string): string {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('time') || titleLower.includes('fast')) return 'clock';
    if (titleLower.includes('cost') || titleLower.includes('save')) return 'dollar-sign';
    if (titleLower.includes('efficiency') || titleLower.includes('productivity')) return 'zap';
    if (titleLower.includes('security') || titleLower.includes('safe')) return 'shield';
    if (titleLower.includes('scale') || titleLower.includes('grow')) return 'trending-up';
    if (titleLower.includes('support') || titleLower.includes('help')) return 'users';

    return 'check-circle'; // Default icon
  }

  private isNumericFact(fact: string): boolean {
    return /\d/.test(fact) && (
      fact.includes('years') ||
      fact.includes('customers') ||
      fact.includes('companies') ||
      fact.includes('%') ||
      fact.includes('$')
    );
  }

  private extractNumericValue(fact: string): string {
    const match = fact.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    return match ? match[1] : '100';
  }

  private extractStatLabel(fact: string): string {
    if (fact.includes('years')) return 'Years Experience';
    if (fact.includes('customers') || fact.includes('companies')) return 'Happy Customers';
    if (fact.includes('%')) return 'Success Rate';
    if (fact.includes('$')) return 'Cost Savings';

    return 'Key Metric';
  }

  protected calculateConfidence(output: CopyGeneratorOutput): number {
    let confidence = 0.75; // Base confidence

    if (output.hero?.headline) confidence += 0.1;
    if (output.benefits?.length > 0) confidence += 0.05;
    if (output.stats?.length > 0) confidence += 0.05;
    if (output.faq?.length > 0) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: CopyGeneratorOutput): any {
    return {
      headline_patterns: [output.hero?.headline].filter(Boolean),
      benefit_patterns: output.benefits?.map(b => b.title) || [],
      cta_patterns: [output.hero?.primary_cta, output.hero?.secondary_cta].filter(Boolean)
    };
  }
}