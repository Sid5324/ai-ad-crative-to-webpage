// src/lib/production-agent-framework.ts - Production Agent Framework
// Based on Microsoft Agent Framework + Gemini Skills + AI Landing Page Templates
// GROQ + GEMINI ONLY - Sequential execution with terminal gates

import { z } from 'zod';

// ========== KNOWN BRANDS DATABASE ==========
// 100% confidence, no LLM calls
export const KNOWN_BRANDS: Record<string, Brand> = {
  'cred.club': {
    name: 'CRED',
    category: 'Fintech',
    confidence: 1.0,
    colors: { primary: '#E24B26', accent: '#E24B26', light: '#FFF5F2', dark: '#1A0F0A' },
    tone: ['Bold', 'Irreverent', 'Premium']
  },
  'doordash.com': {
    name: 'DoorDash',
    category: 'Food Delivery',
    confidence: 1.0,
    colors: { primary: '#FF3008', accent: '#00CCBC', light: '#FFF8F5', dark: '#1A0D0A' },
    tone: ['Reliable', 'Convenient', 'Fast']
  },
  'uber.com': {
    name: 'Uber',
    category: 'Ride Sharing',
    confidence: 1.0,
    colors: { primary: '#000000', accent: '#1FBAD6', light: '#F7F7F7', dark: '#1A1A1A' },
    tone: ['Modern', 'Accessible', 'Global']
  },
  'stripe.com': {
    name: 'Stripe',
    category: 'Fintech',
    confidence: 1.0,
    colors: { primary: '#635BFF', accent: '#635BFF', light: '#F6F8FA', dark: '#0A2540' },
    tone: ['Developer-First', 'Simple', 'Scalable']
  }
};

// ========== SCHEMAS ==========
export const BrandSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(3),
  confidence: z.number().min(0).max(1),
  colors: z.object({
    primary: z.string(),
    accent: z.string(),
    light: z.string(),
    dark: z.string()
  }).optional(),
  tone: z.array(z.string()).optional()
});

export const AdVisionSchema = z.object({
  visualMood: z.array(z.string()),
  ctaSignals: z.array(z.string()).optional(),
  confidence: z.number()
});

export const CopySchema = z.object({
  hero: z.object({
    headline: z.string().min(10),
    subheadline: z.string().min(20),
    primaryCta: z.string().min(3),
    secondaryCta: z.string().optional()
  }),
  benefits: z.array(z.object({
    title: z.string(),
    description: z.string()
  })).min(3)
});

export const DesignSchema = z.object({
  layout: z.string(),
  palette: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string()
  }),
  typography: z.object({
    heading: z.string(),
    body: z.string()
  })
});

export type Brand = z.infer<typeof BrandSchema>;
export type AdVision = z.infer<typeof AdVisionSchema>;
export type Copy = z.infer<typeof CopySchema>;
export type Design = z.infer<typeof DesignSchema>;

// ========== STATE MACHINE ==========
export enum AgentState {
  PENDING = 'PENDING',
  BRAND_VALIDATED = 'BRAND_VALIDATED',
  BRAND_REJECTED = 'BRAND_REJECTED',
  AD_ANALYZED = 'AD_ANALYZED',
  STRATEGY_PLANNED = 'STRATEGY_PLANNED',
  COPY_GENERATED = 'COPY_GENERATED',
  DESIGN_CREATED = 'DESIGN_CREATED',
  QA_PASSED = 'QA_PASSED',
  QA_BLOCKED = 'QA_BLOCKED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// ========== PROVIDER CALLS ==========
// Only GROQ + GEMINI
async function groqCall(model: string, prompt: string, responseFormat?: any) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      ...(responseFormat && { response_format: responseFormat })
    })
  });

  if (!response.ok) {
    throw new Error(`GROQ API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function geminiCall(model: string, prompt: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`GEMINI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ========== AGENTS ==========
// Based on Microsoft Agent Framework patterns

class BrandAgent {
  async execute(input: { url: string }) {
    const hostname = new URL(input.url).hostname.replace(/^www\./, '');

    // Known brands first (100% confidence)
    if (KNOWN_BRANDS[hostname]) {
      return KNOWN_BRANDS[hostname];
    }

    // LLM fallback with strict validation
    try {
      const response = await groqCall('llama-3.3-70b-versatile',
        `Extract brand information from URL: ${hostname}
        Return JSON: {"name": "brand name", "category": "specific category like Fintech, Food Delivery, SaaS", "confidence": 0.85}
        Category must be specific, not generic like "Business".`,
        { type: 'json_object' }
      );

      const brand = BrandSchema.parse(response);

      // Terminal validation - reject low confidence
      if (brand.confidence < 0.8) {
        throw new Error(`BRAND_REJECTED: confidence ${brand.confidence.toFixed(2)} < 0.8`);
      }

      // Terminal validation - reject generic categories
      const genericCategories = ['business', 'company', 'service', 'product'];
      if (genericCategories.includes(brand.category.toLowerCase())) {
        throw new Error(`BRAND_REJECTED: generic category "${brand.category}"`);
      }

      return brand;
    } catch (error) {
      if (error.message.includes('BRAND_REJECTED')) {
        throw error;
      }
      throw new Error(`BRAND_EXTRACTION_FAILED: ${error.message}`);
    }
  }
}

class AdVisionAgent {
  async execute(input: { image?: string, text?: string, category: string }) {
    const hasImage = !!input.image;
    const hasText = !!input.text;

    if (!hasImage && !hasText) {
      throw new Error('No ad creative provided');
    }

    try {
      const prompt = hasImage
        ? `Analyze this ad image for a ${input.category} business. Extract visual mood, CTA signals, and key elements. Return JSON: {"visualMood": ["mood1", "mood2"], "ctaSignals": ["cta1", "cta2"], "confidence": 0.9}`
        : `Analyze this ad text: "${input.text}". Extract mood, CTA signals. Return JSON: {"visualMood": ["mood1", "mood2"], "ctaSignals": ["cta1", "cta2"], "confidence": 0.9}`;

      const response = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
      return AdVisionSchema.parse(response);
    } catch (error) {
      throw new Error(`AD_ANALYSIS_FAILED: ${error.message}`);
    }
  }
}

class CopyAgent {
  async execute(input: { brand: Brand, ad: AdVision, category: string }) {
    const { brand, ad } = input;

    const prompt = `
Write premium landing page copy for ${brand.name} (${brand.category}).

Brand voice: ${brand.tone?.join(', ') || 'professional, premium'}
Visual mood: ${ad.visualMood.join(', ')}
CTA signals: ${ad.ctaSignals?.join(', ') || 'Apply Now'}

Requirements:
- Hero headline: compelling, specific to ${brand.category}
- 4-5 benefit sections with titles and descriptions
- Primary CTA: specific and actionable (no "Learn More", "Get Started")
- Secondary CTA: optional
- Avoid generic phrases

Return JSON structure:
{
  "hero": {
    "headline": "string",
    "subheadline": "string",
    "primaryCta": "string",
    "secondaryCta": "string"
  },
  "benefits": [
    {"title": "string", "description": "string"},
    {"title": "string", "description": "string"}
  ]
}`;

    try {
      const response = await groqCall('mixtral-8x7b-32768', prompt, { type: 'json_object' });
      return CopySchema.parse(response);
    } catch (error) {
      throw new Error(`COPY_GENERATION_FAILED: ${error.message}`);
    }
  }
}

class DesignAgent {
  async execute(input: { brand: Brand, ad: AdVision }) {
    const { brand, ad } = input;

    const prompt = `
Design a premium landing page for ${brand.name}.

Brand colors: ${JSON.stringify(brand.colors)}
Visual mood: ${ad.visualMood.join(', ')}

Return design specification:
{
  "layout": "hero-centered or split-hero or dark-premium",
  "palette": {
    "primary": "${brand.colors?.primary || '#3b82f6'}",
    "secondary": "${brand.colors?.light || '#f8fafc'}",
    "accent": "${brand.colors?.accent || '#3b82f6'}"
  },
  "typography": {
    "heading": "bold, modern font",
    "body": "clean, readable font"
  }
}`;

    try {
      const response = await geminiCall('gemini-2.0-flash-exp', prompt);
      // Parse the JSON response
      const designData = JSON.parse(response);
      return DesignSchema.parse(designData);
    } catch (error) {
      throw new Error(`DESIGN_GENERATION_FAILED: ${error.message}`);
    }
  }
}

class QAAgent {
  async execute(input: { brand: Brand, copy: Copy, design: Design }) {
    const { brand, copy, design } = input;

    let score = 100;
    const issues = [];

    // Brand checks
    if (brand.confidence < 0.8) {
      score -= 30;
      issues.push({ code: 'LOW_CONFIDENCE', severity: 'fatal' });
    }

    // Copy checks
    if (!copy.hero.headline || copy.hero.headline.length < 10) {
      score -= 25;
      issues.push({ code: 'MISSING_HEADLINE', severity: 'fatal' });
    }

    if (!copy.benefits || copy.benefits.length < 3) {
      score -= 20;
      issues.push({ code: 'INSUFFICIENT_BENEFITS', severity: 'high' });
    }

    // CTA quality
    const genericCTAs = ['learn more', 'get started', 'sign up', 'join now'];
    if (genericCTAs.some(cta => copy.hero.primaryCta.toLowerCase().includes(cta))) {
      score -= 20;
      issues.push({ code: 'GENERIC_CTA', severity: 'high' });
    }

    const passed = score >= 85 &&
                  !issues.some(i => i.severity === 'fatal') &&
                  issues.filter(i => i.severity === 'high').length <= 1;

    return {
      score,
      passed,
      issues,
      fatalIssues: issues.filter(i => i.severity === 'fatal').map(i => i.code)
    };
  }
}

// ========== PRODUCTION WORKFLOW ==========
export class ProductionLandingPageWorkflow {
  private agents = {
    brand: new BrandAgent(),
    adVision: new AdVisionAgent(),
    copy: new CopyAgent(),
    design: new DesignAgent(),
    qa: new QAAgent()
  };

  async execute(input: {
    url: string;
    image?: string;
    text?: string;
    category: string;
  }) {
    console.log('[ProductionWorkflow] Starting sequential execution...');

    const result = {
      state: AgentState.PENDING as AgentState,
      data: {} as any,
      errors: [] as string[]
    };

    try {
      // STEP 1: BRAND EXTRACTION (TERMINAL GATE)
      console.log('[ProductionWorkflow] Step 1: Brand extraction...');
      result.data.brand = await this.agents.brand.execute({ url: input.url });

      const brand = result.data.brand as Brand;
      console.log(`[ProductionWorkflow] Brand validated: ${brand.name} (${brand.category}) confidence: ${brand.confidence}`);
      result.state = AgentState.BRAND_VALIDATED;

      // STEP 2: AD ANALYSIS
      console.log('[ProductionWorkflow] Step 2: Ad analysis...');
      result.data.ad = await this.agents.adVision.execute({
        image: input.image,
        text: input.text,
        category: input.category
      });
      result.state = AgentState.AD_ANALYZED;

      // STEP 3: COPY GENERATION
      console.log('[ProductionWorkflow] Step 3: Copy generation...');
      result.data.copy = await this.agents.copy.execute({
        brand,
        ad: result.data.ad,
        category: input.category
      });
      result.state = AgentState.COPY_GENERATED;

      // STEP 4: DESIGN CREATION
      console.log('[ProductionWorkflow] Step 4: Design creation...');
      result.data.design = await this.agents.design.execute({
        brand,
        ad: result.data.ad
      });
      result.state = AgentState.DESIGN_CREATED;

      // STEP 5: QA GATE (TERMINAL)
      console.log('[ProductionWorkflow] Step 5: QA validation...');
      const qa = await this.agents.qa.execute(result.data);

      console.log(`[ProductionWorkflow] QA Score: ${qa.score}, Passed: ${qa.passed}`);
      if (!qa.passed) {
        result.state = AgentState.QA_BLOCKED;
        result.errors = qa.issues.map(i => i.code);
        return result;
      }

      result.state = AgentState.QA_PASSED;
      result.state = AgentState.COMPLETED;

      console.log('[ProductionWorkflow] Execution completed successfully');
      return result;

    } catch (error: any) {
      console.error('[ProductionWorkflow] Execution failed:', error.message);

      if (error.message.includes('BRAND_REJECTED')) {
        result.state = AgentState.BRAND_REJECTED;
      } else {
        result.state = AgentState.FAILED;
      }

      result.errors = [error.message];
      return result;
    }
  }
}

// ========== EXPORTS ==========
export const productionWorkflow = new ProductionLandingPageWorkflow();