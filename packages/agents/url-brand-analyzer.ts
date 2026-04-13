// packages/agents/url-brand-analyzer.ts
import { BaseAgent } from './base-agent';
import { UrlBrandAnalyzerOutput } from '../schemas/types';

export interface UrlBrandAnalyzerInput {
  url: string;
}

export class UrlBrandAnalyzerAgent extends BaseAgent<UrlBrandAnalyzerInput, UrlBrandAnalyzerOutput> {
  constructor() {
    super({
      name: 'url-brand-analyzer',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request'],
        write_scopes: ['request', 'brand'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'DOM-content-extraction',
          'business-classification',
          'trust-signal-detection',
          'brand-style-detection'
        ],
        optional: [
          'sitemap-understanding',
          'metadata-extraction',
          'color-logo-extraction'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: UrlBrandAnalyzerInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<UrlBrandAnalyzerOutput> {
    const { input } = context;

    // Extract DOM content
    const domContent = await this.executeSkill('DOM-content-extraction', {
      url: input.url,
      selectors: ['h1', 'h2', 'p', '.hero', '.about', '.services']
    });

    // Classify business
    const businessClassification = await this.executeSkill('business-classification', {
      content: domContent.content || domContent,
      domain: input.url
    });

    // Detect trust signals
    const trustSignals = await this.executeSkill('trust-signal-detection', {
      content: domContent.content || domContent,
      domain: input.url
    });

    // Detect brand style
    const brandStyle = await this.executeSkill('brand-style-detection', {
      content: domContent.content || domContent,
      images: domContent.images || []
    });

    return {
      domain: this.extractDomain(input.url),
      brand_name: domContent.business_name || businessClassification.business_name || this.extractDomain(input.url).replace('www.', '').split('.')[0],
      industry: businessClassification.industry || 'Unknown',
      services: businessClassification.services || domContent.services || [],
      facts: this.extractFacts(domContent, businessClassification),
      trust_signals: trustSignals.signals || domContent.trust_signals || [],
      existing_sections: this.extractSections(domContent),
      brand_voice: brandStyle.tone || domContent.brand_voice || [],
      visual_identity: {
        primary_colors: brandStyle.colors?.primary || ['#000000'],
        font_hints: brandStyle.typography?.fonts || [],
        logo_style: brandStyle.logo_style || 'Unknown'
      }
    };
  }

  private extractSections(domContent: any): string[] {
    const sections = new Set<string>();

    // Extract from headings and content structure
    const headings = domContent.headings || [];
    const content = domContent.content || '';

    // Common section patterns
    const sectionPatterns = [
      /about/i, /services/i, /products/i, /contact/i, /team/i,
      /portfolio/i, /blog/i, /pricing/i, /testimonials/i, /faq/i
    ];

    // Check headings
    headings.forEach((heading: string) => {
      sectionPatterns.forEach(pattern => {
        if (pattern.test(heading)) {
          sections.add(heading.toLowerCase().replace(/[^a-z]/g, '_'));
        }
      });
    });

    // Check content for section mentions
    sectionPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        const match = content.match(pattern);
        if (match) {
          sections.add(match[0].toLowerCase());
        }
      }
    });

    return Array.from(sections);
  }

  private extractFacts(domContent: any, businessClassification: any): string[] {
    const facts: string[] = [];
    const content = domContent.content || '';

    // Extract key facts from content
    const factPatterns = [
      /founded in (\d{4})/i,
      /(\d+) years? of experience/i,
      /serving (\d+) customers/i,
      /over (\d+) (projects|clients)/i
    ];

    factPatterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        facts.push(match[0]);
      }
    });

    // Add business classification facts
    if (businessClassification.industry) {
      facts.push(`${businessClassification.industry} industry focus`);
    }

    return facts;
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  protected calculateConfidence(output: UrlBrandAnalyzerOutput): number {
    let confidence = 0.7; // Base confidence

    if (output.industry && output.industry !== 'Unknown') confidence += 0.1;
    if (output.services && output.services.length > 0) confidence += 0.1;
    if (output.trust_signals && output.trust_signals.length > 0) confidence += 0.05;
    if (output.existing_sections && output.existing_sections.length > 0) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: UrlBrandAnalyzerOutput): any {
    return {
      industry_patterns: [output.industry],
      service_patterns: output.services,
      trust_patterns: output.trust_signals,
      section_patterns: output.existing_sections
    };
  }
}