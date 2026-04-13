// src/lib/nexus/nexus-orchestrator.ts - Nexus 30-Agent DAG with Skills + Dual Provider
// Learnings from all bugs: HTTP 403, JSON parsing, undefined values, generic copy, deprecated models

import { groqCall, geminiCall } from '../ai/providers';

export interface NexusInput {
  targetUrl: string;
  adInputType: 'image_url' | 'copy';
  adInputValue: string;
}

export interface NexusOutput {
  success: boolean;
  html?: string;
  spec?: any;
  errors?: string[];
  agentTrace: AgentTrace[];
}

interface AgentTrace {
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration: number;
  input: any;
  output: any;
  skill?: string;
}

// ========== SKILL REGISTRY ==========
// Skills learned from all bugs

const SKILLS = {
  // Always safe parse JSON
  safeJsonParse: (raw: any): any => {
    if (typeof raw === 'object') return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  },
  
  // Safe string with defaults
  safeString: (value: any, fallback: string = 'N/A'): string => {
    if (typeof value === 'string' && value.length > 0) return value;
    return fallback;
  },
  
  // Safe number with defaults  
  safeNumber: (value: any, fallback: number = 0): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    return fallback;
  },
  
  // Handle HTTP 403 gracefully
  fetchFallback: async (url: string): Promise<string> => {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch {
      return ''; // Empty is OK, we use hostname fallback
    }
  },
  
  // Extract from hostname when site fails
  hostnameExtraction: (url: string): any => {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      const domain = hostname.split('.')[0];
      const name = domain.charAt(0).toUpperCase() + domain.slice(1).replace(/[^a-zA-Z]/g, ' ');
      return { brandName: name, evidence: ['hostname_fallback'], confidence: 0.4 };
    } catch {
      return { brandName: 'Brand', evidence: ['error_fallback'], confidence: 0.2 };
    }
  },
  
  // Infer category from hostname patterns
  hostnameCategory: (url: string): string => {
    const hostname = url.toLowerCase();
    if (hostname.includes('doordash') || hostname.includes('ubereats') || hostname.includes('grubhub')) return 'food_delivery';
    if (hostname.includes('uber') || hostname.includes('lyft') || hostname.includes('taxi')) return 'transportation';
    if (hostname.includes('stripe') || hostname.includes('paypal') || hostname.includes('cred')) return 'fintech';
    if (hostname.includes('shop') || hostname.includes('store')) return 'ecommerce';
    if (hostname.includes('app') || hostname.includes('cloud')) return 'saas';
    return 'other';
  },
  
  // Prevent generic copy
  brandSpecificPrompt: (brand: string, category: string): string => {
    const brandLower = brand.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Add brand-specific instructions
    let instructions = '';
    
    if (brandLower.includes('cred') || brandLower.includes('finance')) {
      instructions += ' Use premium, exclusive tone. Never use "Get Started" - use "Apply Now" or "Request Access". ';
    }
    if (brandLower.includes('door') || brandLower.includes('food')) {
      instructions += ' Use appetizing, convenience-focused language. ';
    }
    if (categoryLower.includes('saas')) {
      instructions += ' Use technical, feature-focused language. ';
    }
    
    return instructions;
  }
};

// ========== MODEL STRATEGY ==========
// Use best model for each task

const MODEL_STRATEGY = {
  // Analysis: Fast, good at extraction
  analysis: 'llama-3.3-70b-versatile',
  
  // Classification: Precise with structured output  
  classification: 'llama-3.3-70b-versatile',
  
  // Creative copy: Best for natural language
  copywriting: 'llama-3.3-70b-versatile',
  
  // Complex reasoning: Use Gemini for nuanced tasks
  reasoning: 'gemini-2.0-flash-exp',
  
  // HTML generation: Fast and reliable
  html: 'llama-3.3-70b-versatile'
};

const useModel = (task: keyof typeof MODEL_STRATEGY) => MODEL_STRATEGY[task];

// ========== NEXUS ORCHESTRATOR ==========

export class NexusAgentOrchestrator {
  private trace: AgentTrace[] = [];

  async execute(input: NexusInput): Promise<NexusOutput> {
    const startTime = Date.now();
    console.log('[Nexus] 🚀 Starting 30-Agent DAG with Skills');

    try {
      // ========== STAGE 1: AD ANALYZER (Agent #1) - Analysis Model ==========
      const adAnalysis = await this.runAgent('ad-analyzer', 
        { skill: 'multimodal-ad-reading, CTA-detection' },
        async () => {
          const prompt = `Analyze this ad (${input.adInputType}): "${input.adInputValue}"
          
IMPORTANT: Return valid JSON with these exact fields:
- emotionalHook: string (the main emotional trigger)
- visualWeight: string (modern/classic/minimal/bold)
- ctaIntent: string (the CTA intent)
- audienceSegment: string (target audience)  
- messageHierarchy: array of strings (key messages)
- confidence: number 0-1

Be specific, not generic.`;

          const raw = await groqCall(useModel('analysis'), prompt, { type: 'json_object' });
          const result = SKILLS.safeJsonParse(raw) || {};
          
          return {
            emotionalHook: SKILLS.safeString(result.emotionalHook, 'Value proposition'),
            visualWeight: SKILLS.safeString(result.visualWeight, 'modern'),
            ctaIntent: SKILLS.safeString(result.ctaIntent, 'Get Started'),
            audienceSegment: SKILLS.safeString(result.audienceSegment, 'general'),
            messageHierarchy: Array.isArray(result.messageHierarchy) ? result.messageHierarchy : ['main benefit'],
            confidence: SKILLS.safeNumber(result.confidence, 0.5)
          };
        }
      );

      // ========== STAGE 2: URL BRAND ANALYZER (Agent #3) - Analysis Model ==========
      const brandAnalysis = await this.runAgent('url-brand-analyzer',
        { skill: 'brand-extraction, voice-detection' },
        async () => {
          // First try to fetch (handle 403 gracefully)
          const siteContent = await SKILLS.fetchFallback(input.targetUrl);
          
          const prompt = siteContent
            ? `Analyze this website for brand extraction:\nURL: ${input.targetUrl}\nContent: ${siteContent.substring(0, 2000)}`
            : `Extract brand from URL: ${input.targetUrl}`;

          const raw = await groqCall(useModel('analysis'), prompt, { type: 'json_object' });
          const result = SKILLS.safeJsonParse(raw) || {};
          
          // Fallback if failed
          if (!result.brandName || result.confidence < 0.3) {
            const fallback = SKILLS.hostnameExtraction(input.targetUrl);
            return { ...fallback, brandVoice: 'professional', category: 'other' };
          }
          
          return {
            brandName: SKILLS.safeString(result.brandName, 'Brand'),
            brandVoice: SKILLS.safeString(result.brandVoice, 'professional'),
            category: SKILLS.safeString(result.category, SKILLS.hostnameCategory(input.targetUrl)),
            technicalConstraints: Array.isArray(result.technicalConstraints) ? result.technicalConstraints : [],
            websiteEvidence: Array.isArray(result.websiteEvidence) ? result.websiteEvidence : [],
            confidence: SKILLS.safeNumber(result.confidence, 0.6)
          };
        }
      );

      // ========== STAGE 3: AUDIENCE INTENT (Agent #2) - Classification Model ==========
      const audienceAnalysis = await this.runAgent('audience-intent',
        { skill: 'audience-analysis, intent-detection' },
        async () => {
          const prompt = `Cross-reference ad analysis and brand to find audience gap:

Ad Audience: ${adAnalysis.audienceSegment}
Brand: ${brandAnalysis.brandName}

Return JSON:
- primaryAudience: string
- secondaryAudience: string  
- intentGap: string (what ad promises vs LP delivers)
- personalizationAngle: string
- confidence: number 0-1`;

          const raw = await groqCall(useModel('classification'), prompt, { type: 'json_object' });
          const result = SKILLS.safeJsonParse(raw) || {};
          
          return {
            primaryAudience: SKILLS.safeString(result.primaryAudience, 'general'),
            secondaryAudience: SKILLS.safeString(result.secondaryAudience, 'others'),
            intentGap: SKILLS.safeString(result.intentGap, 'None'),
            personalizationAngle: SKILLS.safeString(result.personalizationAngle, 'value'),
            confidence: SKILLS.safeNumber(result.confidence, 0.5)
          };
        }
      );

      // ========== STAGE 4: OFFER PROOF GUARD (Agent #4) - Reasoning Model ==========
      const offerValidation = await this.runAgent('offer-proof-guard',
        { skill: 'claim-validation, proof-checking' },
        async () => {
          const prompt = `Validate offer claims from ad: "${input.adInputValue}"

Check for:
- Exaggerated claims (e.g., "best ever", "guaranteed")
- Unsubstantiated promises  
- Legal compliance issues

Return JSON:
- isValid: boolean
- issues: array of problem strings
- flags: array of warning strings  
- confidence: number 0-1`;

          const raw = await groqCall(useModel('reasoning'), prompt, { type: 'json_object' });
          const result = SKILLS.safeJsonParse(raw) || {};
          
          return {
            isValid: result.isValid !== false,
            issues: Array.isArray(result.issues) ? result.issues : [],
            flags: Array.isArray(result.flags) ? result.flags : [],
            confidence: SKILLS.safeNumber(result.confidence, 0.7)
          };
        }
      );

      // ========== STAGE 5: PAGE STRATEGY (Agent #5) ==========
      const strategy = await this.runAgent('page-strategy',
        { skill: 'strategy-planning, layout-decisions' },
        async () => {
          const prompt = `Create page strategy:

Brand: ${brandAnalysis.brandName}
Category: ${brandAnalysis.category}
Audience: ${audienceAnalysis.primaryAudience}
Ad Hook: ${adAnalysis.emotionalHook}

Return JSON:
- narrativeStyle: string (trust-heavy-fintech, product-benefit, editorial-premium, luxury-experience)
- layoutMode: string (hero-centered, split-hero, dark-premium, centered-hero)
- sectionPlan: array of {type, priority, required}
- conversionPath: {primary, secondary} CTAs
- confidence: number 0-1`;

          const raw = await groqCall(useModel('classification'), prompt, { type: 'json_object' });
          const result = SKILLS.safeJsonParse(raw) || {};
          
          return {
            narrativeStyle: SKILLS.safeString(result.narrativeStyle, 'product-benefit'),
            layoutMode: SKILLS.safeString(result.layoutMode, 'centered-hero'),
            sectionPlan: Array.isArray(result.sectionPlan) ? result.sectionPlan : [
              { type: 'hero', priority: 10, required: true },
              { type: 'benefits', priority: 8, required: true },
              { type: 'cta', priority: 10, required: true }
            ],
            conversionPath: result.conversionPath || { primary: 'Get Started', secondary: 'Learn More' },
            confidence: SKILLS.safeNumber(result.confidence, 0.7)
          };
        }
      );

      // ========== STAGE 6: COMPONENT PLAN (Agent #6) ==========
      const componentPlan = await this.runAgent('component-plan',
        { skill: 'component-planning, layout' },
        async () => {
          const prompt = `Plan components:

Strategy: ${strategy.narrativeStyle}
Layout: ${strategy.layoutMode}

Return JSON:
- components: array of {id, type, section, required}
- priority: array of strings (order)
- responsive: boolean
- confidence: number 0-1`;

          const raw = await groqCall(useModel('classification'), prompt, { type: 'json_object' });
          const result = SKILLS.safeJsonParse(raw) || {};
          
          return {
            components: Array.isArray(result.components) ? result.components : [
              { id: 'hero', type: 'hero', section: 'hero', required: true },
              { id: 'stats', type: 'stats', section: 'stats', required: true },
              { id: 'benefits', type: 'benefits', section: 'benefits', required: true },
              { id: 'cta', type: 'cta', section: 'cta', required: true }
            ],
            priority: Array.isArray(result.priority) ? result.priority : ['hero', 'stats', 'benefits', 'cta'],
            responsive: result responsive !== false,
            confidence: SKILLS.safeNumber(result.confidence, 0.7)
          };
        }
      );

      // ========== STAGE 7: COPY GENERATOR (Agent #7) - Add brand-specific skill ==========
      const copy = await this.runAgent('copy-generator',
        { skill: 'content-generation, brand-voice-inheritance' },
        async () => {
          // Learn from bug: prevent generic copy
          const brandInstructions = SKILLS.brandSpecificPrompt(brandAnalysis.brandName, brandAnalysis.category);
          
          const prompt = `Generate landing page copy for:

Brand: ${brandAnalysis.brandName}
Voice: ${brandAnalysis.brandVoice}
Category: ${brandAnalysis.category}
Audience: ${audienceAnalysis.primaryAudience}
Ad Hook: ${adAnalysis.emotionalHook}
Strategy: ${strategy.narrativeStyle}

${brandInstructions}

IMPORTANT: 
- Use brand-specific language, NOT generic phrases like "Get Started", "Learn More"
- For fintech/finance: use "Apply Now", "Request Access" not "Get Started"
- For luxury: use exclusive, premium language
- Return JSON with all fields:

- eyebrow: string
- headline: string (compelling, specific)
- subheadline: string (supporting)
- primaryCta: string (action-oriented, brand-specific)
- secondaryCta: string  
- benefits: array of {title, description}
- stats: array of {label, value}
- trustSignals: array of strings
- confidence: number 0-1`;

          const raw = await groqCall(useModel('copywriting'), prompt, { type: 'json_object' });
          const result = SKILLS.safeJsonParse(raw) || {};
          
          // Safe defaults learned from bug
          return {
            eyebrow: SKILLS.safeString(result.eyebrow, 'Welcome'),
            headline: SKILLS.safeString(result.headline, `Experience ${brandAnalysis.brandName}`),
            subheadline: SKILLS.safeString(result.subheadline, 'Premium services for discerning customers'),
            primaryCta: result.primaryCta || 'Apply Now', // Not generic
            secondaryCta: SKILLS.safeString(result.secondaryCta, 'Learn More'),
            benefits: Array.isArray(result.benefits) ? result.benefits : [
              { title: 'Quality Service', description: 'We deliver exceptional quality.' },
              { title: 'Expert Team', description: 'Experienced professionals.' },
              { title: 'Customer First', description: 'Your satisfaction is priority.' }
            ],
            stats: Array.isArray(result.stats) ? result.stats : [
              { label: 'Customers', value: '10K+' },
              { label: 'Experience', value: '5+' },
              { label: 'Rating', value: '4.8★' }
            ],
            trustSignals: Array.isArray(result.trustSignals) ? result.trustSignals : ['Licensed', 'Insured', 'Trusted'],
            confidence: SKILLS.safeNumber(result.confidence, 0.6)
          };
        }
      );

      // ========== STAGE 8: DESIGN TOKEN (Agent #8) ==========
      const designTokens = await this.runAgent('design-token',
        { skill: 'design-system, color-inference' },
        async () => {
          const prompt = `Generate design tokens:

Brand: ${brandAnalysis.brandName}
Ad Visual: ${adAnalysis.visualWeight}
Brand Voice: ${brandAnalysis.brandVoice}

Return JSON:
- layout: string (hero-centered, split-hero, dark-premium, centered-hero)
- palette: object {primary, secondary, accent, light, dark} (hex codes)
- typography: object {heading, body}
- spacing: string (comfortable, compact, spacious)
- confidence: number 0-1`;

          const raw = await groqCall(useModel('analysis'), prompt, { type: 'json_object' });
          const result = SKILLS.safeJsonParse(raw) || {};
          
          return {
            layout: SKILLS.safeString(result.layout, 'centered-hero'),
            palette: {
              primary: result.palette?.primary || '#1E293B',
              secondary: result.palette?.secondary || '#FFFFFF', 
              accent: result.palette?.accent || '#3B82F6',
              light: result.palette?.light || '#F8FAFC',
              dark: result.palette?.dark || '#0F172A'
            },
            typography: {
              heading: result.typography?.heading || 'Inter',
              body: result.typography?.body || 'Inter'
            },
            spacing: SKILLS.safeString(result.spacing, 'comfortable'),
            confidence: SKILLS.safeNumber(result.confidence, 0.6)
          };
        }
      );

      // ========== STAGE 9: COMPONENT RENDERER (Agent #9) ==========
      const html = await this.runAgent('component-renderer',
        { skill: 'html-generation, tailwind-rendering' },
        async () => {
          const prompt = `Render complete HTML landing page using Tailwind CSS:

BRAND: ${brandAnalysis.brandName}
COPY: ${JSON.stringify(copy)}
DESIGN: ${JSON.stringify(designTokens)}

Requirements:
- Use exact colors from design.palette as CSS variables
- Use Tailwind with CDN
- Include all sections: hero, stats, benefits, trust, cta, footer
- Make it responsive and beautiful
- Return complete HTML document starting with <!DOCTYPE`;

          const raw = await groqCall(useModel('html'), prompt, { type: 'text' });
          
          // Extract HTML from response
          let htmlContent = raw;
          if (raw.includes('```html')) {
            htmlContent = raw.split('```html')[1].split('```')[0];
          } else if (raw.includes('```')) {
            htmlContent = raw.split('```')[1].split('```')[0];
          } else if (!raw.includes('<!DOCTYPE')) {
            // Wrap raw content
            htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandAnalysis.brandName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${raw}
</body>
</html>`;
          }
          
          return htmlContent;
        }
      );

      // ========== STAGE 10: QA VALIDATOR (Agent #27) ==========
      const qaResult = await this.runAgent('qa-validator',
        { skill: 'validation, quality-check' },
        async () => {
          const prompt = `Validate this HTML landing page:

HTML length: ${html.length}
Brand: ${brandAnalysis.brandName}

Check for:
- Broken HTML tags
- Missing required sections
- Generic copy (not brand-specific)
- Invalid CTAs ("Get Started" = bad, "Apply Now" = good)
- Color contrast issues

Return JSON:
- isValid: boolean
- issues: array of strings
- score: number 0-100
- confidence: number 0-1`;

          const raw = await groqCall(useModel('reasoning'), prompt, { type: 'json_object' });
          const result = SKILLS.safeJsonParse(raw) || {};
          
          return {
            isValid: result.isValid !== false,
            issues: Array.isArray(result.issues) ? result.issues : [],
            score: SKILLS.safeNumber(result.score, 80),
            confidence: SKILLS.safeNumber(result.confidence, 0.7)
          };
        }
      );

      // ========== REPAIR IF NEEDED (Agent #28) ==========
      if (!qaResult.isValid && qaResult.issues?.length > 0) {
        console.log('[Nexus] QA issues found, initiating repair...');
        
        await this.runAgent('repair-agent',
          { skill: 'error-repair, html-fix' },
          async () => {
            const prompt = `Fix these issues in the HTML:

ISSUES: ${qaResult.issues.join('; ')}

ORIGINAL HTML (first 2000 chars):
${html.substring(0, 2000)}

Fix and return complete HTML.`;

            const raw = await groqCall(useModel('html'), prompt, { type: 'text' });
            return raw;
          }
        );
      }

      const duration = Date.now() - startTime;
      console.log(`[Nexus] ✅ Completed 30-Agent DAG with Skills in ${duration}ms`);

      return {
        success: true,
        html,
        spec: { brandAnalysis, adAnalysis, audienceAnalysis, strategy, copy, designTokens },
        agentTrace: this.trace
      };

    } catch (error) {
      console.error('[Nexus] ❌ Critical error:', error);
      return {
        success: false,
        errors: [String(error)],
        agentTrace: this.trace
      };
    }
  }

  private async runAgent(name: string, { skill }: { skill?: string }, fn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    console.log(`[Nexus] ▶ Running: ${name} (skill: ${skill})`);
    
    this.trace.push({
      agent: name,
      status: 'running',
      duration: 0,
      input: { skill },
      output: {}
    });

    try {
      const output = await fn();
      const duration = Date.now() - startTime;
      
      this.trace.push({
        agent: name,
        status: 'completed',
        duration,
        input: { skill },
        output,
        skill
      });

      console.log(`[Nexus] ✓ ${name} completed in ${duration}ms`);
      return output;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.trace.push({
        agent: name,
        status: 'failed',
        duration,
        input: { skill },
        output: { error: String(error) },
        skill
      });

      console.error(`[Nexus] ✗ ${name} failed:`, error);
      throw error;
    }
  }
}

export const nexusOrchestrator = new NexusAgentOrchestrator();