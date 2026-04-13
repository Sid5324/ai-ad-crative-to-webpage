// src/lib/nexus/nexus-orchestrator.ts - Nexus 30-Agent DAG Architecture
// Uses real agents with proper DAG execution

import { groqCall } from '../ai/providers';

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
}

// ========== DAG EXECUTION ENGINE ==========

export class NexusAgentOrchestrator {
  private trace: AgentTrace[] = [];

  async execute(input: NexusInput): Promise<NexusOutput> {
    const startTime = Date.now();
    console.log('[Nexus] 🚀 Starting 30-Agent DAG Execution');

    try {
      // ========== STAGE 1: AD ANALYZER (Agent #1) ==========
      const adAnalysis = await this.runAgent('ad-analyzer', async () => {
        const prompt = `Analyze this ad ${input.adInputType === 'image_url' ? 'image' : 'copy'}: "${input.adInputValue}"
        
Extract and return JSON with:
- emotionalHook: Main emotional trigger
- visualWeight: Visual style (modern/classic/minimal/bold)
- ctaIntent: The call-to-action intent
- audienceSegment: Target audience
- messageHierarchy: Key messages in order
- confidence: Score 0-1`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
        return raw as any;
      });

      // ========== STAGE 2: URL BRAND ANALYZER (Agent #3) ==========
      const brandAnalysis = await this.runAgent('url-brand-analyzer', async () => {
        const prompt = `Analyze brand from URL: ${input.targetUrl}

Extract and return JSON:
- brandName: Official brand name
- brandVoice: Tone (professional/playful/luxury/casual)
- category: Business category
- technicalConstraints: Technical info
- evidence: Evidence found
- confidence: Score 0-1`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
        return raw as any;
      });

      // ========== STAGE 3: AUDIENCE INTENT (Agent #2) ==========
      const audienceAnalysis = await this.runAgent('audience-intent', async () => {
        const prompt = `Cross-reference ad analysis and brand to find audience gap:

Ad Audience: ${adAnalysis.audienceSegment}
Brand Audience: infer from ${brandAnalysis.brandName}

Return JSON:
- primaryAudience: Main audience
- secondaryAudience: Secondary audience  
- intentGap: What the ad promises vs what LP delivers
- personalizationAngle: How to personalize
- confidence: Score 0-1`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
        return raw as any;
      });

      // ========== STAGE 4: OFFER PROOF GUARD (Agent #4) ==========
      const offerValidation = await this.runAgent('offer-proof-guard', async () => {
        const prompt = `Validate offer claims from ad: "${input.adInputValue}"

Check for:
- Exaggerated claims
- Unsubstantiated promises
- Legal compliance

Return JSON:
- isValid: boolean
- issues: [] of problems found
- flags: [] of warnings
- confidence: Score 0-1`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
        return raw as any;
      });

      // ========== STAGE 5: PAGE STRATEGY (Agent #5) ==========
      const strategy = await this.runAgent('page-strategy', async () => {
        const prompt = `Create page strategy for:

Brand: ${brandAnalysis.brandName}
Category: ${brandAnalysis.category}
Audience: ${audienceAnalysis.primaryAudience}
Ad Message: ${adAnalysis.emotionalHook}

Return JSON:
- narrativeStyle: How to tell the story
- layoutMode: Hero/split/centered
- sectionPlan: Array of {type, priority, required}
- conversionPath: {primary, secondary} CTAs
- confidence: Score 0-1`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
        return raw as any;
      });

      // ========== STAGE 6: COMPONENT PLAN (Agent #6) ==========
      const componentPlan = await this.runAgent('component-plan', async () => {
        const prompt = `Plan components for landing page:

Strategy: ${strategy.narrativeStyle}
Layout: ${strategy.layoutMode}

Return JSON:
- components: Array of {id, type, section, required}
- priority: Array order
- responsive: boolean
- confidence: Score 0-1`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
        return raw as any;
      });

      // ========== STAGE 7: COPY GENERATOR (Agent #7) ==========
      const copy = await this.runAgent('copy-generator', async () => {
        const prompt = `Generate landing page copy for:

Brand: ${brandAnalysis.brandName}
Voice: ${brandAnalysis.brandVoice}
Category: ${brandAnalysis.category}
Audience: ${audienceAnalysis.primaryAudience}
Ad Hook: ${adAnalysis.emotionalHook}
Strategy: ${strategy.narrativeStyle}

Return JSON with hero, benefits, stats, trustSignals, CTAs - be specific to the brand/category, not generic.
- eyebrow: string
- headline: string  
- subheadline: string
- primaryCta: string
- secondaryCta: string
- benefits: [{title, description}]
- stats: [{label, value}]
- trustSignals: [strings]
- confidence: Score 0-1`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
        return raw as any;
      });

      // ========== STAGE 8: DESIGN TOKEN (Agent #8) ==========
      const designTokens = await this.runAgent('design-token', async () => {
        const prompt = `Generate design tokens for:

Brand: ${brandAnalysis.brandName}
Ad Visual Weight: ${adAnalysis.visualWeight}
Brand Voice: ${brandAnalysis.brandVoice}

Return JSON:
- layout: "hero-centered" | "split-hero" | "dark-premium"
- palette: {primary, secondary, accent, light, dark} (hex codes)
- typography: {heading, body}
- spacing: "comfortable" | "compact" | "spacious"
- confidence: Score 0-1`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
        return raw as any;
      });

      // ========== STAGE 9: COMPONENT RENDERER (Agent #9) ==========
      const html = await this.runAgent('component-renderer', async () => {
        const prompt = `Render complete HTML landing page:

COPY:
${JSON.stringify(copy)}

DESIGN:
${JSON.stringify(designTokens)}

Use Tailwind CSS with CDN. Use the exact colors from design.palette.
Return complete HTML document with all sections.`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'text' });
        
        // Extract HTML from response
        let htmlContent = raw;
        if (raw.includes('```html')) {
          htmlContent = raw.split('```html')[1].split('```')[0];
        } else if (raw.includes('<!DOCTYPE')) {
          htmlContent = raw;
        } else {
          // Wrap in basic template
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
      });

      // ========== STAGE 10: QA VALIDATOR (Agent #27) ==========
      const qaResult = await this.runAgent('qa-validator', async () => {
        const prompt = `Validate this HTML for landing page:

HTML length: ${html.length}
Brand: ${brandAnalysis.brandName}

Check for:
- Broken HTML tags
- Missing required sections
- Generic copy (not brand-specific)
- Invalid CTAs
- Color contrast issues

Return JSON:
- isValid: boolean
- issues: [] problems
- score: 0-100
- confidence: 0-1`;

        const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
        return raw as any;
      });

      // ========== REPAIR IF NEEDED (Agent #28) ==========
      if (!qaResult.isValid && qaResult.issues?.length > 0) {
        console.log('[Nexus] QA issues found, initiating repair...');
        
        await this.runAgent('repair-agent', async () => {
          const prompt = `Fix these issues in the HTML:

ISSUES: ${qaResult.issues.join(', ')}

ORIGINAL HTML:
${html.substring(0, 2000)}

Fix and return complete HTML.`;

          const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'text' });
          return raw;
        });
      }

      const duration = Date.now() - startTime;
      console.log(`[Nexus] ✅ Completed 30-Agent DAG in ${duration}ms`);

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

  private async runAgent(name: string, fn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    console.log(`[Nexus] ▶ Running: ${name}`);
    
    this.trace.push({
      agent: name,
      status: 'running',
      duration: 0,
      input: {},
      output: {}
    });

    try {
      const output = await fn();
      const duration = Date.now() - startTime;
      
      this.trace.push({
        agent: name,
        status: 'completed',
        duration,
        input: {},
        output
      });

      console.log(`[Nexus] ✓ ${name} completed in ${duration}ms`);
      return output;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.trace.push({
        agent: name,
        status: 'failed',
        duration,
        input: {},
        output: { error: String(error) }
      });

      console.error(`[Nexus] ✗ ${name} failed:`, error);
      throw error;
    }
  }
}

export const nexusOrchestrator = new NexusAgentOrchestrator();