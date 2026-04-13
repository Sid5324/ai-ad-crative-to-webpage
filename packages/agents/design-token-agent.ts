// packages/agents/design-token-agent.ts
import { BaseAgent } from './base-agent';
import { DesignTokenOutput } from '../schemas/types';

export interface DesignTokenInput {
  brandData: any;
}

export class DesignTokenAgent extends BaseAgent<DesignTokenInput, DesignTokenOutput> {
  constructor() {
    super({
      name: 'design-token-agent',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request', 'brand'],
        write_scopes: ['request'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'brand-token-extraction',
          'typography-pairing',
          'color-system-mapping',
          'visual-tone-classification'
        ],
        optional: [
          'accessibility-aware-token-adjustment',
          'dark-light-adaptation'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: DesignTokenInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<DesignTokenOutput> {
    const { input } = context;

    // Extract brand colors
    const colorTokens = await this.extractColorTokens(input.brandData);

    // Determine typography
    const typographyTokens = await this.determineTypography(input.brandData);

    // Classify visual tone
    const visualTone = await this.classifyVisualTone(input.brandData);

    // Generate complete design system
    const designSystem = await this.generateDesignSystem(colorTokens, typographyTokens, visualTone);

    return {
      theme_name: this.generateThemeName(input.brandData),
      colors: designSystem.colors,
      typography: designSystem.typography,
      radius_scale: designSystem.radius_scale,
      shadow_style: designSystem.shadow_style
    };
  }

  private async extractColorTokens(brandData: any): Promise<any> {
    // Convert brandData to string content for the skill
    const content = JSON.stringify(brandData);
    const brandName = brandData?.brand_name || brandData?.business_name || '';
    
    const colorAnalysis = await this.executeSkill('brand-token-extraction', {
      content: content,
      url: brandData?.domain || '',
      brandData: brandData,
      images: brandData.visual_identity?.logo_style ? [brandData.visual_identity.logo_style] : []
    });

    return {
      primary: colorAnalysis.primary_colors?.[0] || '#0066CC',
      secondary: colorAnalysis.secondary_colors?.[0] || '#6B7280',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827'
    };
  }

  private async determineTypography(brandData: any): Promise<any> {
    const typographyAnalysis = await this.executeSkill('typography-pairing', {
      brand_style: this.inferBrandStyle(brandData),
      content_type: 'landing_page'
    });

    return {
      display_font: typographyAnalysis.heading_font?.name || 'Inter',
      body_font: typographyAnalysis.body_font?.name || 'Inter',
      tone: this.determineTypographyTone(brandData)
    };
  }

  private async classifyVisualTone(brandData: any): Promise<any> {
    const brandName = brandData?.brand_name || brandData?.business_name || '';
    const isLimo = brandName.toLowerCase().includes('limousine') || brandName.toLowerCase().includes('astar');
    
    const toneAnalysis = await this.executeSkill('visual-tone-classification', {
      content: JSON.stringify(brandData),
      brand_data: brandData,
      industry: brandData.industry
    });

    return {
      style: toneAnalysis.classification || (isLimo ? 'luxury' : 'modern'),
      formality: this.determineFormality(brandData),
      energy: this.determineEnergy(brandData)
    };
  }

  private async generateDesignSystem(colors: any, typography: any, tone: any): Promise<any> {
    // Generate radius scale based on visual tone
    const radiusScale = this.determineRadiusScale(tone);

    // Generate shadow style based on visual tone
    const shadowStyle = this.determineShadowStyle(tone);

    return {
      colors,
      typography,
      radius_scale: radiusScale,
      shadow_style: shadowStyle
    };
  }

  private inferBrandStyle(brandData: any): string {
    const industry = brandData.industry?.toLowerCase() || '';
    const brandVoice = Array.isArray(brandData?.brand_voice) ? brandData.brand_voice.join(' ').toLowerCase() : (typeof brandData?.brand_voice === 'string' ? brandData.brand_voice.toLowerCase() : '');

    if (industry.includes('tech') || industry.includes('software')) {
      return 'tech_modern';
    }
    if (industry.includes('finance') || industry.includes('legal')) {
      return 'corporate';
    }
    if (brandVoice.includes('friendly') || brandVoice.includes('casual')) {
      return 'friendly';
    }
    if (brandVoice.includes('premium') || brandVoice.includes('luxury')) {
      return 'premium';
    }

    return 'professional';
  }

  private determineTypographyTone(brandData: any): string {
    const brandVoice = Array.isArray(brandData?.brand_voice) ? brandData.brand_voice.join(' ').toLowerCase() : (typeof brandData?.brand_voice === 'string' ? brandData.brand_voice.toLowerCase() : '');

    if (brandVoice.includes('friendly') || brandVoice.includes('approachable')) {
      return 'warm';
    }
    if (brandVoice.includes('professional') || brandVoice.includes('corporate')) {
      return 'formal';
    }
    if (brandVoice.includes('modern') || brandVoice.includes('innovative')) {
      return 'contemporary';
    }

    return 'neutral';
  }

  private determineFormality(brandData: any): string {
    const brandVoice = Array.isArray(brandData?.brand_voice) ? brandData.brand_voice.join(' ').toLowerCase() : (typeof brandData?.brand_voice === 'string' ? brandData.brand_voice.toLowerCase() : '');

    if (brandVoice.includes('formal') || brandVoice.includes('corporate')) {
      return 'formal';
    }
    if (brandVoice.includes('casual') || brandVoice.includes('friendly')) {
      return 'casual';
    }

    return 'professional';
  }

  private determineEnergy(brandData: any): string {
    const industry = brandData.industry?.toLowerCase() || '';
    const brandVoice = Array.isArray(brandData?.brand_voice) ? brandData.brand_voice.join(' ').toLowerCase() : (typeof brandData?.brand_voice === 'string' ? brandData.brand_voice.toLowerCase() : '');

    if (industry.includes('tech') || industry.includes('startup') || brandVoice.includes('innovative')) {
      return 'energetic';
    }
    if (industry.includes('finance') || industry.includes('legal') || brandVoice.includes('trustworthy')) {
      return 'calm';
    }

    return 'balanced';
  }

  private determineRadiusScale(tone: any): 'tight' | 'balanced' | 'soft' {
    if (tone.style === 'modern' || tone.energy === 'energetic') {
      return 'tight';
    }
    if (tone.formality === 'casual' || tone.style === 'friendly') {
      return 'soft';
    }

    return 'balanced';
  }

  private determineShadowStyle(tone: any): 'minimal' | 'elevated' | 'dramatic' {
    if (tone.style === 'minimal' || tone.formality === 'formal') {
      return 'minimal';
    }
    if (tone.energy === 'energetic' || tone.style === 'modern') {
      return 'elevated';
    }

    return 'elevated';
  }

  private generateThemeName(brandData: any): string {
    const industry = brandData.industry?.toLowerCase().replace(/\s+/g, '_') || 'business';
    const style = this.inferBrandStyle(brandData);

    return `${industry}_${style}`;
  }

  protected calculateConfidence(output: DesignTokenOutput): number {
    let confidence = 0.85; // Base confidence

    if (output.colors?.primary && output.colors.primary !== '#0066CC') confidence += 0.05;
    if (output.typography?.display_font && output.typography.display_font !== 'Inter') confidence += 0.05;
    if (output.theme_name && !output.theme_name.includes('business_professional')) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: DesignTokenOutput): any {
    return {
      color_scheme: [output.colors?.primary, output.colors?.secondary].filter(Boolean),
      typography_stack: [output.typography?.display_font, output.typography?.body_font].filter(Boolean),
      design_system: [output.radius_scale, output.shadow_style]
    };
  }
}