// src/lib/orchestrator/production-orchestrator.ts - Production orchestrator with validation/repair loops
import { BrandIdentity, CategoryResult, PageSpec, looksLikeTagline } from '../schemas/page-schemas';
import { validateSpec, ValidationResult, generateRepairPrompts } from '../validators/spec-validator';
import { groqCall } from '../ai/providers';

interface AgentContext {
  url: string;
  adText?: string;
  siteContent?: string;
  fetchError?: string;
}

interface AgentResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  confidence: number;
}

// ========== PREFLIGHT AGENT ==========
class PreflightAgent {
  async execute(input: { url: string; adText?: string }): Promise<AgentResult<AgentContext>> {
    const ctx: AgentContext = {
      url: input.url,
      adText: input.adText
    };

    // Normalize URL
    try {
      const urlObj = new URL(input.url);
      ctx.url = urlObj.protocol + '//' + urlObj.hostname + urlObj.pathname;
    } catch {
      return { ok: false, error: 'Invalid URL format', confidence: 0 };
    }

    // Detect input mode
    ctx.siteContent = await this.fetchSiteContent(ctx.url);

    return { ok: true, data: ctx, confidence: 1.0 };
  }

  private async fetchSiteContent(url: string): Promise<string | undefined> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      return html.substring(0, 10000); // Limit size
    } catch (error) {
      console.warn(`Site fetch failed for ${url}:`, error);
      return undefined;
    }
  }
}

// ========== IDENTITY EXTRACTOR AGENT ==========
class IdentityExtractorAgent {
  async execute(ctx: AgentContext): Promise<AgentResult<BrandIdentity>> {
    const hasContent = ctx.siteContent && ctx.siteContent.length > 100;

    // If no content available, use simple hostname-based extraction
    if (!hasContent) {
      return this.extractFromHostname(ctx.url);
    }

    const prompt = `
Extract canonical brand identity from this URL and content:

URL: ${ctx.url}
Content: ${ctx.siteContent?.substring(0, 2000) || 'No content available'}

Instructions:
1. Look for: JSON-LD organization name, og:site_name, <title> prefix, logo alt, footer legal, navbar
2. REJECT taglines, slogans, "Welcome to...", location-based names like "X in City, Country"
3. Keep it short: max 30 characters for brand name
4. Provide evidence list

Return JSON: {
  "canonicalName": "brand name only",
  "shortName": "abbreviated if needed",
  "domain": "${ctx.url}",
  "confidence": 0.8,
  "evidence": ["source1", "source2"]
}
`;

    try {
      const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
      const identity = raw as any;

      // Only reject if it REALLY looks like a tagline (contains location or service words)
      if (this.isObviouslyTagline(identity.canonicalName)) {
        // Try hostname fallback instead
        return this.extractFromHostname(ctx.url);
      }

      return {
        ok: true,
        data: identity,
        confidence: identity.confidence || 0.7
      };
    } catch (error) {
      // Fallback on error
      return this.extractFromHostname(ctx.url);
    }
  }

  // Simple hostname-based extraction when content unavailable
  private extractFromHostname(url: string): AgentResult<BrandIdentity> {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      const domain = hostname.split('.')[0];

      // Clean and capitalize
      const brandName = domain
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .filter(word => word.length > 0)
        .join(' ');

      return {
        ok: true,
        data: {
          canonicalName: brandName,
          shortName: brandName.substring(0, 15),
          domain: url,
          confidence: 0.6, // Lower confidence but valid
          evidence: ['hostname_fallback']
        },
        confidence: 0.6
      };
    } catch {
      return {
        ok: false,
        error: 'Failed to extract brand from URL',
        confidence: 0
      };
    }
  }

  // Check if name is obviously a tagline (not a brand name)
  private isObviouslyTagline(name?: string): boolean {
    if (!name) return true;
    const n = name.toLowerCase();
    // Contains location patterns
    if (/ in [a-z]+,? [a-z]/i.test(n)) return true;
    if (/, [a-z]{2,}$/.test(n)) return true;
    // Contains service/description words
    if (/^(the |a |an )?(luxury |premium |)?(chauffeur|limousine|service|company|solutions)/i.test(n)) return true;
    // Too long
    if (name.length > 40) return true;
    return false;
  }
}

// ========== CATEGORY CLASSIFIER AGENT ==========
class CategoryClassifierAgent {
  async execute(ctx: AgentContext, brand: BrandIdentity): Promise<AgentResult<CategoryResult>> {
    // Try to infer from hostname if no content
    const hostnameCategory = this.inferFromHostname(ctx.url, brand.canonicalName);
    const hasContent = ctx.siteContent && ctx.siteContent.length > 100;

    if (!hasContent) {
      return {
        ok: true,
        data: hostnameCategory,
        confidence: hostnameCategory.confidence
      };
    }

    const prompt = `
Classify this business into ONE category from this list ONLY:

Categories: fintech, food_delivery, transportation, saas, ecommerce, healthcare,
education, travel, real_estate, media, hospitality, legal, beauty, fitness,
automotive, insurance, logistics, marketplace, professional_services, other

URL: ${ctx.url}
Brand: ${brand.canonicalName}
Content sample: ${ctx.siteContent?.substring(0, 1500) || 'No content'}

Instructions:
1. Use ONLY categories from the list above
2. If uncertain (<60% confidence), use "other"
3. Provide 2-3 pieces of evidence
4. NEVER invent new categories

Return JSON: {
  "primary": "category_name",
  "confidence": 0.8,
  "evidence": ["evidence1", "evidence2"]
}
`;

    try {
      const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
      const category = raw as any;

      return {
        ok: true,
        data: category,
        confidence: category.confidence || 0.7
      };
    } catch (error) {
      // Fallback to hostname-based inference
      return {
        ok: true,
        data: hostnameCategory,
        confidence: hostnameCategory.confidence
      };
    }
  }

  // Infer category from hostname patterns
  private inferFromHostname(url: string, brandName: string): CategoryResult {
    const hostname = url.toLowerCase();

    // Food delivery patterns
    if (hostname.includes('doordash') || hostname.includes('ubereats') || hostname.includes('grubhub') || hostname.includes('foodpanda')) {
      return { primary: 'food_delivery', confidence: 0.9, evidence: ['hostname_pattern'] };
    }

    // Ride sharing / transportation
    if (hostname.includes('uber') || hostname.includes('lyft') || hostname.includes('taxi')) {
      return { primary: 'transportation', confidence: 0.8, evidence: ['hostname_pattern'] };
    }

    // Fintech patterns
    if (hostname.includes('stripe') || hostname.includes('paypal') || hostname.includes('cred') || hostname.includes('bank')) {
      return { primary: 'fintech', confidence: 0.8, evidence: ['hostname_pattern'] };
    }

    // Ecommerce
    if (hostname.includes('shop') || hostname.includes('store') || hostname.includes('amazon')) {
      return { primary: 'ecommerce', confidence: 0.7, evidence: ['hostname_pattern'] };
    }

    // SaaS
    if (hostname.includes('app') || hostname.includes('cloud') || hostname.includes('software')) {
      return { primary: 'saas', confidence: 0.7, evidence: ['hostname_pattern'] };
    }

    // Default
    return { primary: 'other', confidence: 0.5, evidence: ['hostname_fallback'] };
  }
}

// ========== SPEC BUILDER AGENT ==========
class SpecBuilderAgent {
  async execute(ctx: AgentContext, brand: BrandIdentity, category: CategoryResult): Promise<AgentResult<PageSpec>> {
    const prompt = `
Build a complete landing page specification for:

Brand: ${brand.canonicalName}
Category: ${category.primary}
URL: ${ctx.url}
Ad text: ${ctx.adText || 'None provided'}

Requirements:
- Hero: eyebrow, headline, subheadline, primary CTA, optional secondary CTA
- Stats: 3-4 relevant metrics with labels
- Benefits: 4-5 specific benefits
- Trust signals: 2-3 if relevant
- Design tokens: primary, background, surface colors (hex codes)

IMPORTANT:
- Use specific, brand-relevant CTAs (not "Learn More", "Get Started")
- Make copy category-appropriate
- Colors should be brand-appropriate hex codes

Return valid JSON matching the PageSpec schema.
`;

    try {
      let raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
      
      // Parse JSON if it's a string
      if (typeof raw === 'string') {
        try {
          raw = JSON.parse(raw);
        } catch {
          // Use fallback
          return this.generateFallbackSpec(brand, category);
        }
      }
      
      const spec = raw as any;

      // Pre-process to ensure required fields exist
      if (!spec.brand || !spec.category || !spec.hero || !spec.benefits) {
        return this.generateFallbackSpec(brand, category);
      }

      // Validate immediately (but be lenient)
      const validation = validateSpec(spec);

      if (!validation.ok && !validation.repairable) {
        // Try repair if repairable
        if (validation.repairable) {
          const repaired = await this.repairSpec(spec, validation);
          if (repaired) {
            const repairValidation = validateSpec(repaired);
            if (repairValidation.ok) {
              return { ok: true, data: repairValidation.data!, confidence: 0.8 };
            }
          }
        }

        return {
          ok: false,
          error: `Spec validation failed: ${validation.issues.join(', ')}`,
          confidence: validation.score / 100
        };
      }

      return {
        ok: true,
        data: validation.data!,
        confidence: 0.9
      };

    } catch (error) {
      // Fallback: generate basic spec
      return this.generateFallbackSpec(brand, category);
    }
  }

  // Generate fallback spec when LLM fails
  private generateFallbackSpec(brand: BrandIdentity, category: CategoryResult): AgentResult<PageSpec> {
    const defaultColors: Record<string, { primary: string; background: string; surface: string }> = {
      fintech: { primary: '#635BFF', background: '#0A2540', surface: '#F6F8FA' },
      food_delivery: { primary: '#FF3008', background: '#FFFFFF', surface: '#FFF8F5' },
      transportation: { primary: '#000000', background: '#1A1A1A', surface: '#F7F7F7' },
      ecommerce: { primary: '#FF9900', background: '#FFFFFF', surface: '#FAFAFA' },
      saas: { primary: '#3B82F6', background: '#0F172A', surface: '#1E293B' },
      other: { primary: '#1E293B', background: '#FFFFFF', surface: '#F8FAFC' }
    };

    const colors = defaultColors[category.primary] || defaultColors.other;

    const fallbackSpec: PageSpec = {
      brand: {
        canonicalName: brand.canonicalName,
        shortName: brand.shortName || brand.canonicalName.substring(0, 15),
        domain: brand.domain,
        confidence: 0.6,
        evidence: ['fallback_generation']
      },
      category: {
        primary: category.primary,
        confidence: 0.6,
        evidence: category.evidence
      },
      hero: {
        eyebrow: 'Welcome',
        headline: `Experience ${brand.canonicalName}`,
        subheadline: `Premium services tailored for you. Get started today!`,
        primaryCta: 'Get Started',
        secondaryCta: 'Learn More'
      },
      stats: [
        { label: 'Customers', value: '10K+' },
        { label: 'Years Experience', value: '5+' },
        { label: 'Satisfaction', value: '99%' }
      ],
      benefits: [
        { title: 'Quality Service', description: 'We deliver exceptional quality in everything we do.' },
        { title: 'Expert Team', description: 'Our experienced team ensures best outcomes.' },
        { title: 'Customer First', description: 'Your satisfaction is our top priority.' }
      ],
      trustSignals: ['licensed', 'insured', 'trusted'],
      designTokens: {
        primaryColor: colors.primary,
        backgroundColor: colors.background,
        surfaceColor: colors.surface
      }
    };

    return {
      ok: true,
      data: fallbackSpec,
      confidence: 0.5
    };
  }

  private async repairSpec(originalSpec: any, validation: ValidationResult): Promise<PageSpec | null> {
    const repairs = generateRepairPrompts(validation.issues, originalSpec);

    if (repairs.length === 0) return null;

    const repairPrompt = `
Fix this landing page spec based on these validation issues:

ISSUES: ${validation.issues.join(', ')}

ORIGINAL SPEC: ${JSON.stringify(originalSpec, null, 2)}

REPAIRS NEEDED:
${repairs.map(r => `- ${r.field}: ${r.prompt}`).join('\n')}

Return the COMPLETE, FIXED PageSpec JSON.
`;

    try {
      const raw = await groqCall('llama-3.3-70b-versatile', repairPrompt, { type: 'json_object' });
      return raw as PageSpec;
    } catch {
      return null;
    }
  }
}

// ========== PRODUCTION ORCHESTRATOR ==========
export class ProductionOrchestrator {
  private agents = {
    preflight: new PreflightAgent(),
    identity: new IdentityExtractorAgent(),
    category: new CategoryClassifierAgent(),
    specBuilder: new SpecBuilderAgent()
  };

  async generateLandingPage(input: {
    url: string;
    adText?: string;
  }): Promise<{
    success: boolean;
    html?: string;
    spec?: PageSpec;
    issues: string[];
    confidence: number;
  }> {
    console.log('[ProductionOrchestrator] Starting generation...');

    // ========== STAGE 1: PREFLIGHT ==========
    console.log('[ProductionOrchestrator] Stage 1: Preflight');
    const preflight = await this.agents.preflight.execute(input);
    if (!preflight.ok || !preflight.data) {
      return {
        success: false,
        issues: [preflight.error || 'Preflight failed'],
        confidence: 0
      };
    }

    // ========== STAGE 2: IDENTITY EXTRACTION ==========
    console.log('[ProductionOrchestrator] Stage 2: Identity extraction');
    const identity = await this.agents.identity.execute(preflight.data);
    if (!identity.ok || !identity.data) {
      return {
        success: false,
        issues: [identity.error || 'Identity extraction failed'],
        confidence: 0
      };
    }

    // ========== STAGE 3: CATEGORY CLASSIFICATION ==========
    console.log('[ProductionOrchestrator] Stage 3: Category classification');
    const category = await this.agents.category.execute(preflight.data, identity.data);

    // ========== STAGE 4: SPEC BUILDING WITH REPAIR LOOP ==========
    console.log('[ProductionOrchestrator] Stage 4: Spec building');
    const spec = await this.agents.specBuilder.execute(preflight.data, identity.data, category.data!);

    if (!spec.ok || !spec.data) {
      return {
        success: false,
        issues: [spec.error || 'Spec building failed'],
        confidence: spec.confidence
      };
    }

    // ========== STAGE 5: RENDER ==========
    console.log('[ProductionOrchestrator] Stage 5: Rendering HTML');
    const html = renderPage(spec.data);

    console.log('[ProductionOrchestrator] Generation completed successfully');

    return {
      success: true,
      html,
      spec: spec.data,
      issues: [],
      confidence: spec.confidence
    };
  }
}

// ========== HTML RENDERER ==========
function renderPage(spec: PageSpec): string {
  const tokens = spec.designTokens;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${spec.brand.canonicalName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: ${tokens.backgroundColor};
      --surface: ${tokens.surfaceColor};
      --text: #ffffff;
      --primary: ${tokens.primaryColor};
      --accent: ${adjustColor(tokens.primaryColor, 20)};
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-font-smoothing: antialiased; }
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: var(--text); background: var(--bg); }
    h1, h2, h3 { line-height: 1.2; }
    .container { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; }
    @media (min-width: 768px) { .container { padding: 0 2rem; } }
    .section { padding: 4rem 1.5rem; }
    @media (min-width: 768px) { .section { padding: 5rem 2rem; } }
    .hero { background: linear-gradient(180deg, var(--surface), var(--bg)); min-height: 70vh; display: flex; align-items: center; }
    .card { background: var(--surface); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 2rem; }
    .btn { display: inline-block; padding: 1rem 2.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; transition: all 0.3s ease; cursor: pointer; border: none; font-size: 1rem; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .btn-primary { background: var(--accent); color: white; }
    .btn-outline { border: 2px solid rgba(255,255,255,0.5); color: white; background: transparent; }
    .text-center { text-align: center; }
    .text-accent { color: var(--accent); }
    .grid-2 { display: grid; grid-template-columns: 1fr; gap: 3rem; }
    @media (min-width: 768px) { .grid-2 { grid-template-columns: repeat(2, 1fr); } }
    .grid-3 { display: grid; grid-template-columns: 1fr; gap: 2rem; }
    @media (min-width: 768px) { .grid-3 { grid-template-columns: repeat(3, 1fr); } }
    .flex { display: flex; }
    .flex-wrap { flex-wrap: wrap; }
    .gap-2 { gap: 1rem; }
    .gap-4 { gap: 2rem; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .mb-2 { margin-bottom: 1rem; }
    .mb-4 { margin-bottom: 2rem; }
    .mb-6 { margin-bottom: 3rem; }
  </style>
</head>
<body>
<!-- HERO -->
<section class="hero">
<div class="container">
<div class="grid-2">
<div class="flex flex-col gap-2">
<div style="display: inline-block; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">${spec.hero.eyebrow}</div>
<h1 style="font-size: clamp(2rem, 5vw, 3rem); font-weight: 800;">${spec.hero.headline}</h1>
<p style="max-width: 32rem; opacity: 0.9;">${spec.hero.subheadline}</p>
<div class="flex flex-wrap gap-2" style="margin-top: 2rem;">
<a href="#apply" class="btn btn-primary">${spec.hero.primaryCta}</a>
${spec.hero.secondaryCta ? `<a href="#learn" class="btn btn-outline">${spec.hero.secondaryCta}</a>` : ''}
</div>
</div>
</div>
</div>
</section>

<!-- STATS -->
<section class="section" style="background: var(--surface);">
<div class="container">
<div class="grid-3 text-center">
${spec.stats.map(stat => `<div><div class="text-accent" style="font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 800;">${stat.value}</div><div style="opacity: 0.8;">${stat.label}</div></div>`).join('')}
</div>
</div>
</section>

<!-- TRUST SIGNALS -->
${spec.trustSignals && spec.trustSignals.length > 0 ? `
<section class="section" style="background: var(--bg);">
<div class="container text-center">
<h2 style="margin-bottom: 2rem;">Why Choose ${spec.brand.canonicalName}</h2>
<div class="flex flex-wrap justify-center gap-4">
${spec.trustSignals.map(signal => `
<div class="flex items-center gap-1">
<span style="width: 0.5rem; height: 0.5rem; background: #22c55e; border-radius: 50%;"></span>
<span style="font-size: 0.875rem; opacity: 0.8;">${signal}</span>
</div>
`).join('')}
</div>
</div>
</section>
` : ''}

<!-- BENEFITS -->
<section class="section" style="background: var(--surface);">
<div class="container">
<h2 class="text-center mb-6">Benefits</h2>
<div class="grid-3">
${spec.benefits.map(benefit => `
<div class="card">
<h3 class="mb-2">${benefit.title}</h3>
<p style="opacity: 0.8;">${benefit.description}</p>
</div>
`).join('')}
</div>
</div>
</section>

<!-- CTA -->
<section class="section" style="background: linear-gradient(135deg, var(--primary), var(--accent));">
<div class="container text-center">
<h2 class="mb-2">Ready to Get Started?</h2>
<p style="opacity: 0.9; margin-bottom: 2rem;">Join thousands of satisfied customers.</p>
<a href="#apply" class="btn btn-primary">${spec.hero.primaryCta}</a>
</div>
</section>

<!-- FOOTER -->
<footer style="background: #111827; padding: 4rem 1.5rem; text-align: center;">
<div class="container">
<h3 class="mb-2">${spec.brand.canonicalName}</h3>
<p style="opacity: 0.8; margin-bottom: 2rem;">Experience the difference with ${spec.brand.shortName}.</p>
<div style="border-top: 1px solid #374151; padding-top: 2rem;">
<p style="opacity: 0.8;">© 2024 ${spec.brand.canonicalName}. All rights reserved.</p>
</div>
</div>
</footer>
</body>
</html>`;
}

// Simple color adjustment utility
function adjustColor(hex: string, amount: number): string {
  // Remove # and convert to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Adjust each component
  const newR = Math.max(0, Math.min(255, r + amount));
  const newG = Math.max(0, Math.min(255, g + amount));
  const newB = Math.max(0, Math.min(255, b + amount));

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export const productionOrchestrator = new ProductionOrchestrator();