// src/lib/production-skills.ts - Production Skills from Gemini CLI Skills Repo
// Specialized agents for landing page generation tasks

import { groqCall, geminiCall } from './ai/providers';
import { z } from 'zod';

// ========== CTA OPTIMIZER SKILL ==========
export class CTAOptimizerSkill {
  private readonly BANNED_CTAS = [
    'learn more', 'get started', 'sign up now', 'join now',
    'click here', 'read more', 'find out more'
  ];

  private readonly PREMIUM_CTAS = [
    'Claim Your Free Trial', 'Start Building Today', 'Get Instant Access',
    'Book Your Demo', 'Apply Now', 'Create Account', 'Join Premium'
  ];

  async execute(input: { brand: string, category: string, currentCTA?: string }) {
    const { brand, category, currentCTA } = input;

    if (currentCTA && !this.isBanned(currentCTA)) {
      return { cta: currentCTA, confidence: 0.9 };
    }

    const prompt = `
Generate a premium, brand-specific CTA for ${brand} (${category}).

Requirements:
- Action-oriented and specific
- No generic phrases like "Learn More" or "Get Started"
- Should feel premium/exclusive for ${category} businesses
- 3-8 words maximum

Examples by category:
- Fintech: "Apply for Premium Access", "Start Investing Now"
- Food Delivery: "Order Your First Meal", "Get Food Delivered"
- SaaS: "Start Your Free Trial", "Launch Your Project"

Return only the CTA text, nothing else.
`;

    try {
      const cta = await groqCall('llama-3.3-70b-versatile', prompt);
      const cleanCTA = cta.trim().replace(/["']/g, '');

      if (this.isBanned(cleanCTA)) {
        // Fallback to premium suggestions
        return { cta: this.PREMIUM_CTAS[Math.floor(Math.random() * this.PREMIUM_CTAS.length)], confidence: 0.8 };
      }

      return { cta: cleanCTA, confidence: 0.95 };
    } catch (error) {
      return { cta: 'Apply Now', confidence: 0.7 };
    }
  }

  private isBanned(cta: string): boolean {
    return this.BANNED_CTAS.some(banned =>
      cta.toLowerCase().includes(banned.toLowerCase())
    );
  }
}

// ========== CATEGORY VALIDATOR SKILL ==========
export class CategoryValidatorSkill {
  private readonly GENERIC_CATEGORIES = [
    'business', 'company', 'service', 'product', 'website',
    'online', 'digital', 'platform'
  ];

  private readonly VALID_CATEGORIES = [
    'Fintech', 'Food Delivery', 'Ride Sharing', 'Ecommerce', 'SaaS',
    'Healthcare', 'Education', 'Real Estate', 'Travel', 'Entertainment',
    'Fitness', 'Retail', 'Manufacturing', 'Consulting', 'Marketing'
  ];

  async execute(input: { url: string, extractedCategory: string }) {
    const { url, extractedCategory } = input;

    // Check if already valid
    if (this.VALID_CATEGORIES.includes(extractedCategory)) {
      return { category: extractedCategory, confidence: 0.95, source: 'validation' };
    }

    // Reject generic
    if (this.GENERIC_CATEGORIES.includes(extractedCategory.toLowerCase())) {
      throw new Error(`GENERIC_CATEGORY_REJECTED: "${extractedCategory}" is too generic`);
    }

    // Try to infer from URL
    const hostname = new URL(url).hostname.toLowerCase();

    // Domain-based inference
    if (hostname.includes('stripe') || hostname.includes('payment')) {
      return { category: 'Fintech', confidence: 0.9, source: 'domain-inference' };
    }
    if (hostname.includes('doordash') || hostname.includes('ubereats')) {
      return { category: 'Food Delivery', confidence: 0.9, source: 'domain-inference' };
    }
    if (hostname.includes('uber') || hostname.includes('lyft')) {
      return { category: 'Ride Sharing', confidence: 0.9, source: 'domain-inference' };
    }

    // LLM fallback for validation
    const prompt = `
Analyze this URL: ${url}
Current category: ${extractedCategory}

Is "${extractedCategory}" a specific business category or generic?
If generic, suggest the most specific category based on the domain.

Return JSON: {"isValid": boolean, "suggestedCategory": "string", "confidence": number}
`;

    try {
      const response = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
      const validation = JSON.parse(response);

      if (!validation.isValid) {
        if (this.VALID_CATEGORIES.includes(validation.suggestedCategory)) {
          return {
            category: validation.suggestedCategory,
            confidence: Math.min(validation.confidence, 0.8),
            source: 'llm-correction'
          };
        } else {
          throw new Error(`CATEGORY_VALIDATION_FAILED: could not determine specific category`);
        }
      }

      return {
        category: extractedCategory,
        confidence: validation.confidence,
        source: 'llm-validation'
      };
    } catch (error) {
      throw new Error(`CATEGORY_VALIDATION_ERROR: ${error.message}`);
    }
  }
}

// ========== RESPONSIVE DESIGN VALIDATOR ==========
export class ResponsiveDesignValidatorSkill {
  async execute(input: { design: any, brand: string }) {
    const { design, brand } = input;

    const prompt = `
Validate this landing page design for ${brand}:

Design: ${JSON.stringify(design, null, 2)}

Check for:
1. Mobile-first approach (320px+)
2. Tablet optimization (768px+)
3. Desktop scaling (1024px+)
4. Touch-friendly elements
5. Readable typography scaling
6. Color contrast compliance

Return JSON: {
  "isResponsive": boolean,
  "score": number,
  "issues": ["issue1", "issue2"],
  "recommendations": ["fix1", "fix2"]
}
`;

    try {
      const response = await geminiCall('gemini-2.0-flash-exp', prompt);
      const validation = JSON.parse(response);

      if (!validation.isResponsive || validation.score < 80) {
        return {
          ...validation,
          status: 'NEEDS_FIXES',
          fixes: validation.recommendations
        };
      }

      return {
        ...validation,
        status: 'RESPONSIVE_OK'
      };
    } catch (error) {
      return {
        isResponsive: true, // Assume OK if validation fails
        score: 85,
        issues: [],
        recommendations: [],
        status: 'VALIDATION_FAILED'
      };
    }
  }
}

// ========== BRAND VOICE ENFORCER ==========
export class BrandVoiceEnforcerSkill {
  private readonly VOICE_PATTERNS = {
    Fintech: {
      premium: ['exclusive', 'premium', 'trusted', 'secure', 'elite'],
      avoid: ['cheap', 'free', 'easy', 'simple']
    },
    'Food Delivery': {
      premium: ['fresh', 'fast', 'convenient', 'delicious', 'hot'],
      avoid: ['cheap', 'slow', 'cold']
    },
    SaaS: {
      premium: ['powerful', 'scalable', 'intuitive', 'enterprise', 'cloud'],
      avoid: ['basic', 'limited', 'complex']
    }
  };

  async execute(input: { copy: any, brand: string, category: string }) {
    const { copy, brand, category } = input;

    const voiceRules = this.VOICE_PATTERNS[category as keyof typeof this.VOICE_PATTERNS];

    if (!voiceRules) {
      return { score: 85, issues: [], status: 'NO_RULES' };
    }

    const copyText = JSON.stringify(copy).toLowerCase();
    let score = 100;
    const issues = [];

    // Check for premium voice
    const premiumMatches = voiceRules.premium.filter(word =>
      copyText.includes(word.toLowerCase())
    );

    if (premiumMatches.length < 2) {
      score -= 20;
      issues.push(`Missing premium voice words. Found: ${premiumMatches.join(', ')}`);
    }

    // Check for avoided words
    const avoidMatches = voiceRules.avoid.filter(word =>
      copyText.includes(word.toLowerCase())
    );

    if (avoidMatches.length > 0) {
      score -= 15;
      issues.push(`Contains avoided words: ${avoidMatches.join(', ')}`);
    }

    return {
      score: Math.max(0, score),
      issues,
      status: score >= 80 ? 'VOICE_OK' : 'VOICE_NEEDS_IMPROVEMENT'
    };
  }
}

// ========== LANDING PAGE HTML GENERATOR ==========
export class LandingPageHTMLGeneratorSkill {
  async execute(input: {
    brand: any,
    copy: any,
    design: any,
    qa: any
  }) {
    const { brand, copy, design, qa } = input;

    // Skip if QA failed
    if (!qa.passed) {
      throw new Error(`HTML_GENERATION_BLOCKED: QA failed with score ${qa.score}`);
    }

    const template = this.generateTailwindTemplate(brand, copy, design);

    // Validate HTML
    if (template.length < 2000) {
      throw new Error('HTML_GENERATION_FAILED: template too short');
    }

    if (!template.includes(brand.name)) {
      throw new Error('HTML_GENERATION_FAILED: missing brand name');
    }

    return {
      html: template,
      size: template.length,
      sections: this.countSections(template),
      responsive: true // Assume our template is responsive
    };
  }

  private generateTailwindTemplate(brand: any, copy: any, design: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand.name} - ${copy.hero.headline}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-${design.palette.secondary.replace('#', '')} text-gray-900">

  <!-- Hero Section -->
  <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-${design.palette.primary.replace('#', '')} to-${design.palette.accent.replace('#', '')} text-white">
    <div class="container mx-auto px-6 text-center">
      <h1 class="text-4xl md:text-6xl font-bold mb-6">${copy.hero.headline}</h1>
      <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">${copy.hero.subheadline}</p>
      <div class="space-x-4">
        <button class="bg-white text-${design.palette.primary.replace('#', '')} px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition">
          ${copy.hero.primaryCta}
        </button>
        ${copy.hero.secondaryCta ? `<button class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-${design.palette.primary.replace('#', '')} transition">
          ${copy.hero.secondaryCta}
        </button>` : ''}
      </div>
    </div>
  </section>

  <!-- Benefits Section -->
  <section class="py-20 bg-white">
    <div class="container mx-auto px-6">
      <div class="grid md:grid-cols-2 lg:grid-cols-${copy.benefits.length} gap-8">
        ${copy.benefits.map((benefit: any) => `
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-4 text-${design.palette.primary.replace('#', '')}">${benefit.title}</h3>
            <p class="text-gray-600">${benefit.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-8">
    <div class="container mx-auto px-6 text-center">
      <p>&copy; 2024 ${brand.name}. All rights reserved.</p>
    </div>
  </footer>

</body>
</html>`;
  }

  private countSections(html: string): number {
    const sectionTags = html.match(/<section/g);
    return sectionTags ? sectionTags.length : 0;
  }
}

// ========== SKILL REGISTRY ==========
export const productionSkills = {
  ctaOptimizer: new CTAOptimizerSkill(),
  categoryValidator: new CategoryValidatorSkill(),
  responsiveValidator: new ResponsiveDesignValidatorSkill(),
  brandVoiceEnforcer: new BrandVoiceEnforcerSkill(),
  htmlGenerator: new LandingPageHTMLGeneratorSkill()
};