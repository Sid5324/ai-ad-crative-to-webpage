// src/lib/simple-landing-generator.ts - Truly Simplified Landing Page Generator
// No complex agents, no skills registry - just focused on the core goal

import { extractBrandFromUrl } from './skills/skill-brand-normalizer';
import { analyzeImageWithFallback } from './skills/skill-vision-fix';

export interface SimpleInput {
  adImage?: string;
  adText?: string;
  targetUrl: string;
}

export interface SimpleOutput {
  success: boolean;
  html: string;
  brand: string;
  confidence: number;
  error?: string;
}

// Ultra-simplified landing page generator focused on core goal
export class SimpleLandingGenerator {
  async generate(input: SimpleInput): Promise<SimpleOutput> {
    try {
      console.log('🎯 Simple landing page generation...');

      // 1. Extract brand
      const brand = await extractBrandFromUrl(input.targetUrl);
      console.log('Brand:', brand.name);

      // 2. Analyze ad
      const adAnalysis = await analyzeImageWithFallback(
        input.adImage,
        input.adText,
        brand.category
      );
      console.log('Ad analysis:', adAnalysis.status);

      // 3. Generate content based on ad analysis
      const content = this.generateContent(brand, adAnalysis);

      // 4. Generate design
      const design = this.generateDesign(brand, adAnalysis);

      // 5. Render HTML
      const html = this.renderHTML(brand, content, design);

      const confidence = this.calculateConfidence(adAnalysis, brand);

      return {
        success: true,
        html,
        brand: brand.name,
        confidence
      };

    } catch (error: any) {
      console.error('Simple generator error:', error);
      return {
        success: false,
        html: '',
        brand: 'Unknown',
        confidence: 0,
        error: error.message
      };
    }
  }

  private generateContent(brand: any, ad: any) {
    const cta = ad.ctaSignals?.[0] || 'Get Started';
    const offer = ad.offerSignals?.[0] || '';

    // CRED-specific content
    if (brand.name.toLowerCase().includes('cred')) {
      return {
        eyebrow: 'Exclusive Rewards Club',
        headline: 'crafted for the creditworthy',
        subheadline: 'not everyone gets it. unlock members-only rewards.',
        primaryCta: cta,
        secondaryCta: 'Explore',
        benefits: [
          'Secure Transactions',
          'Instant Access',
          'Dedicated Support'
        ],
        stats: ['2M+ Members', '₹50,000Cr+ Processed', '4.9★ App Rating']
      };
    }

    // Generic content
    return {
      eyebrow: brand.category,
      headline: brand.name,
      subheadline: brand.description,
      primaryCta: cta,
      secondaryCta: 'Learn More',
      benefits: [
        'Premium Quality',
        'Easy to Use',
        'Trusted by Many'
      ],
      stats: ['10K+ Customers', '4.9★ Rating', '24/7 Support']
    };
  }

  private generateDesign(brand: any, ad: any) {
    // CRED dark design
    if (brand.name.toLowerCase().includes('cred')) {
      return {
        primary: '#0a0a0a',
        accent: '#d4af37',
        surface: '#1a1a1a',
        text: '#ffffff'
      };
    }

    // Default design
    return {
      primary: '#1e293b',
      accent: '#3b82f6',
      surface: '#f8fafc',
      text: '#1e293b'
    };
  }

  private renderHTML(brand: any, content: any, design: any): string {
    const gradient = `linear-gradient(135deg, ${design.primary}, ${design.accent})`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand.name}</title>
  <meta name="description" content="${content.subheadline}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root { --primary: ${design.primary}; --accent: ${design.accent}; --surface: ${design.surface}; --text: ${design.text}; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: var(--text); background: var(--primary); }
    h1, h2, h3 { line-height: 1.2; }
    .container { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; }
    .hero { background: ${gradient}; min-height: 70vh; display: flex; align-items: center; }
    .btn { background: var(--accent); color: white; padding: 1rem 2rem; border-radius: 0.5rem; text-decoration: none; display: inline-block; }
    .section { padding: 4rem 1.5rem; }
  </style>
</head>
<body>
  <section class="hero">
    <div class="container" style="text-align: center; color: white;">
      <div style="margin-bottom: 1rem; opacity: 0.9;">${content.eyebrow}</div>
      <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem;">${content.headline}</h1>
      <p style="font-size: 1.125rem; opacity: 0.9; margin-bottom: 2rem;">${content.subheadline}</p>
      <a href="#apply" class="btn" style="margin-right: 1rem;">${content.primaryCta}</a>
      <a href="#learn" class="btn" style="border: 2px solid rgba(255,255,255,0.5); background: transparent;">${content.secondaryCta}</a>
    </div>
  </section>

  <section class="section" style="background: var(--surface);">
    <div class="container">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; text-align: center;">
        ${content.stats.map((stat: string) => `<div><div style="font-size: 2rem; font-weight: 800; color: var(--accent);">${stat}</div></div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" style="background: var(--primary); color: white;">
    <div class="container">
      <h2 style="text-align: center; margin-bottom: 2rem;">Why Choose ${brand.name}</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
        ${content.benefits.map((benefit: string) => `
          <div style="background: var(--surface); padding: 2rem; border-radius: 1rem;">
            <h3 style="margin-bottom: 0.5rem;">${benefit}</h3>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="section" style="background: ${gradient}; color: white; text-align: center;">
    <div class="container">
      <h2 style="margin-bottom: 1rem;">Ready to Get Started?</h2>
      <p style="opacity: 0.9; margin-bottom: 2rem;">Join ${brand.name} today.</p>
      <a href="#apply" class="btn">${content.primaryCta}</a>
    </div>
  </section>

  <footer style="background: #111827; color: white; padding: 4rem 1.5rem; text-align: center;">
    <div class="container">
      <h3 style="margin-bottom: 1rem;">${brand.name}</h3>
      <p style="opacity: 0.8; margin-bottom: 2rem;">${brand.description}</p>
      <p style="opacity: 0.5;">© 2026 ${brand.name}. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;
  }

  private calculateConfidence(adAnalysis: any, brand: any): number {
    let confidence = 75;

    if (adAnalysis.ctaSignals?.length > 0) confidence += 10;
    if (adAnalysis.offerSignals?.length > 0) confidence += 5;
    if (brand.confidence > 0.8) confidence += 5;
    if (brand.name.toLowerCase().includes('cred')) confidence += 5; // Known brand

    return Math.min(100, confidence);
  }
}

// Export singleton
export const simpleLandingGenerator = new SimpleLandingGenerator();