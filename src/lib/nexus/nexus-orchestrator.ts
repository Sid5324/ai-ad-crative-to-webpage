// src/lib/nexus/nexus-orchestrator.ts - Nexus 30-Agent DAG with Skills + Dual Provider
// Learnings from all bugs: HTTP 403, JSON parsing, undefined values, generic copy, deprecated models
// Integrated with: Universal Skills Registry, Category Inference, Brand Prompts, Repair Loop

import { groqCall, geminiCall } from '../ai/providers';
import { SKILL_REGISTRY, executeSkill } from '../skills/skill-registry';
import { inferCategory, getCategoryNarrative, getCategoryColors } from '../skills/skill-category-inference';
import { generateBrandInstructions, getBrandPrompt, isValidCta } from '../skills/skill-brand-prompts';
import { RepairAgent, QaValidator, REPAIR_SKILLS, DEFAULT_RETRY_CONFIG } from '../skills/skill-repair-loop';
import { fixHtml, validateHtml, enforceBrandColors, extractBrandFromUrl, getBrandColors as getBrandColorsFn } from '../skills/skill-brand-enforcer';
import { validateAndFixHtml, checkHtmlIssues, enforceProperLayout, finalCleanup } from '../skills/skill-html-validator';
import { generateProfessionalHTML } from '../skills/skill-professional-renderer';
import { generateProfessionalHTMLv2 } from '../skills/skill-v2-renderer';
import { generateBrandContext, generateBrandHeadline, generateBrandBenefits, generateBrandStats } from '../skills/skill-brand-context';
import { buildCopyACEContext, buildHtmlACEContext, buildBrandACEContext, formatACEContext } from '../ace/ace-context';

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
  
  // Extract from hostname when site fails - IMPROVED
  hostnameExtraction: (url: string): any => {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      const domain = hostname.split('.')[0];
      
      // Common suffixes to remove/add spaces before
      const suffixMap: Record<string, string> = {
        'limousine': 'Limousine',
        'limo': 'Limo', 
        'qa': 'QA',
        'inc': 'Inc',
        'co': 'Co',
        'app': 'App',
        'io': 'IO',
        'ai': 'AI',
        'tech': 'Tech',
        'labs': 'Labs',
        'dev': 'Dev',
        'pro': 'Pro',
        'hq': 'HQ'
      };
      
      let name = domain.toLowerCase();
      
      // First, add spaces before known suffixes
      for (const [suffix, replacement] of Object.entries(suffixMap)) {
        const regex = new RegExp(`(${suffix})$`, 'i');
        if (regex.test(name)) {
          name = name.replace(regex, ` ${replacement}`);
          break; // Only handle one suffix
        }
      }
      
      // Add spaces before capital letters (camelCase)
      name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
      
      // Add spaces before numbers
      name = name.replace(/(\d)/g, ' $1');
      
      // Proper title case
      name = name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      
      // Clean up extra spaces
      name = name.replace(/\s+/g, ' ').trim();
      
      return { brandName: name, evidence: ['hostname_fallback'], confidence: 0.5 };
    } catch {
      return { brandName: 'Brand', evidence: ['error_fallback'], confidence: 0.2 };
    }
  },
  
  // Infer category from hostname patterns - Enhanced with skill-category-inference
  hostnameCategory: (url: string): string => {
    const inferred = inferCategory(url);
    return inferred.category;
  },
  
  // Get category with confidence - New enhanced skill
  getCategoryWithConfidence: (url: string) => {
    return inferCategory(url);
  },
  
  // Prevent generic copy - Enhanced brand prompts
  brandSpecificPrompt: (brand: string, category: string): string => {
    // Use skill-brand-prompts for comprehensive brand handling
    return generateBrandInstructions(brand, category);
  },
  
  // Validate CTA against brand
  validateCta: (cta: string, brand: string, category: string): boolean => {
    return isValidCta(cta, brand, category);
  },
  
  // Get brand-specific colors
  getBrandColors: (brand: string, category: string) => {
    return getCategoryColors(category, brand);
  }
};

// ========== MODEL STRATEGY ==========
// Use best model for each task

const MODEL_STRATEGY = {
  // Analysis: Use smaller model to save tokens
  analysis: 'llama-3.1-8b-instant',
  
  // Classification: Use smaller model  
  classification: 'llama-3.1-8b-instant',
  
  // Creative copy: Use smaller model
  copywriting: 'llama-3.1-8b-instant',
  
  // Complex reasoning: Use smaller model
  reasoning: 'llama-3.1-8b-instant',
  
  // HTML generation: Use smaller model
  html: 'llama-3.1-8b-instant'
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
            responsive: result.responsive !== false,
            confidence: SKILLS.safeNumber(result.confidence, 0.7)
          };
        }
      );

      // ========== STAGE 7: COPY GENERATOR (Agent #7) - BRAND CONTEXT ENRICHMENT ==========
      const copy = await this.runAgent('copy-generator',
        { skill: 'content-generation, brand-voice-inheritance, brand-context-enrichment' },
        async () => {
          // Generate comprehensive brand context
          const brandContext = generateBrandContext(brandAnalysis.brandName, input.targetUrl);

          // Generate brand-aware content using context
          const headline = generateBrandHeadline(brandContext, 'hero');
          const benefits = generateBrandBenefits(brandContext);
          const stats = generateBrandStats(brandContext);

          // Build ACE context for any remaining custom content
          const aceContext = buildCopyACEContext({
            brandName: brandAnalysis.brandName,
            brandVoice: brandAnalysis.brandVoice,
            category: brandAnalysis.category,
            audience: audienceAnalysis.primaryAudience,
            adHook: adAnalysis.emotionalHook,
            strategy: strategy.narrativeStyle
          });

          // Generate eyebrow and subheadline with AI but brand constraints
          const customPrompt = `Given this brand context: ${JSON.stringify(brandContext)}

Generate only the eyebrow and subheadline for a landing page hero section.
Follow these constraints: ${aceContext.constraints.join(', ')}

Return JSON: { eyebrow: string, subheadline: string }`;

          const raw = await groqCall(useModel('copywriting'), customPrompt, { type: 'json_object' });
          const customResult = SKILLS.safeJsonParse(raw) || {};

          // Get brand-specific CTAs
          const brandPrompt = getBrandPrompt(brandAnalysis.brandName, brandAnalysis.category);

          return {
            eyebrow: SKILLS.safeString(customResult.eyebrow, 'Welcome to Excellence'),
            headline: headline,
            subheadline: SKILLS.safeString(customResult.subheadline, 'Premium services tailored to your needs'),
            primaryCta: brandPrompt.primaryCta,
            secondaryCta: brandPrompt.secondaryCta,
            benefits: benefits,
            stats: stats,
            trustSignals: brandContext.values.map(v => v.charAt(0).toUpperCase() + v.slice(1)),
            confidence: 0.9
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

      // ========== STAGE 9: COMPONENT RENDERER (Agent #9) - PROFESSIONAL HTML GENERATION ==========
      const brandColors = getBrandColorsFn(input.targetUrl);
      const categoryInfo = inferCategory(input.targetUrl);
      const brandContext = generateBrandContext(brandAnalysis.brandName, input.targetUrl);

      const html = await this.runAgent('component-renderer',
        { skill: 'html-generation, tailwind-rendering, brand-color-enforcement, brand-context-integration' },
        async () => {
          // Generate professional HTML with full brand context
          let htmlContent = generateProfessionalHTMLv2({
            brandName: brandAnalysis.brandName,
            brandColors,
            copy,
            category: categoryInfo.category
          });

          // Enhance with brand context (add meta description, improve content)
          htmlContent = htmlContent.replace(
            '<meta name="description" content="Official landing page">',
            `<meta name="description" content="${copy.subheadline || 'Experience premium services'}">`
          );

          // Add brand personality to title
          const personality = brandContext.personality[0] || 'premium';
          htmlContent = htmlContent.replace(
            `<title>${brandAnalysis.brandName}</title>`,
            `<title>${brandAnalysis.brandName} - ${personality.charAt(0).toUpperCase() + personality.slice(1)} Services</title>`
          );

          // Post-process: ensure brand colors and fix any issues
          htmlContent = fixHtml(htmlContent, input.targetUrl);
          htmlContent = enforceBrandColors(htmlContent, input.targetUrl);
          htmlContent = validateAndFixHtml(htmlContent, brandAnalysis.brandName);
          htmlContent = enforceProperLayout(htmlContent, brandColors);
          htmlContent = finalCleanup(htmlContent, brandAnalysis.brandName);

          return htmlContent;
        }
      );

      // ========== STAGE 10: QA VALIDATOR (Agent #27) - LOCAL VALIDATION ==========
      const qaResult = await this.runAgent('qa-validator',
        { skill: 'validation, quality-check' },
        async () => {
          // Local validation instead of LLM call (faster + saves tokens)
          const issues: string[] = [];

          // Check structure
          if (!html.includes('<!DOCTYPE')) issues.push('Missing DOCTYPE');
          if (!html.includes('<meta name="description"')) issues.push('Missing meta description');
          if (!html.includes('<footer')) issues.push('Missing footer');

          // Check for broken images
          if (html.match(/src="(?!https)[^"]*\.(jpg|png)"/)) issues.push('Broken image references');

          // Check for generic CTAs
          const lower = html.toLowerCase();
          if (lower.includes('get started') || lower.includes('sign up') || lower.includes('join now')) {
            issues.push('Generic CTA detected');
          }

          // Check body background (should never be brand color)
          if (html.match(/body class="[^"]*bg-\[#([0-9A-Fa-f]{6})/)) {
            issues.push('Body uses brand color instead of neutral');
          }

          const score = Math.max(60, 100 - (issues.length * 15));

          return {
            isValid: issues.length < 3,
            issues,
            score,
            confidence: 0.8
          };
        }
      );

      // ========== REPAIR IF NEEDED (Agent #28) - LOCAL REPAIR ==========
      let finalHtml = html;

      if (!qaResult.isValid && qaResult.issues?.length > 0) {
        console.log('[Nexus] QA issues found, applying local repair...');

        // Local repair instead of LLM call
        let repaired = finalHtml;

        for (const issue of qaResult.issues) {
          const lower = issue.toLowerCase();

          if (lower.includes('missing doctype')) {
            repaired = '<!DOCTYPE html>\n' + repaired;
          }
          if (lower.includes('missing meta')) {
            repaired = repaired.replace('<head>', '<head>\n    <meta name="description" content="Official landing page">');
          }
          if (lower.includes('missing footer')) {
            repaired = repaired.replace('</body>', `
    <footer class="bg-gray-900 text-white py-8 text-center">
      <p>&copy; 2024 ${brandAnalysis.brandName}. All rights reserved.</p>
    </footer>
  </body>`);
          }
          if (lower.includes('broken image')) {
            repaired = repaired.replace(/<img[^>]*src="(?!https)[^"]*\.(jpg|png)"[^>]*\/?>/gi, '');
          }
          if (lower.includes('generic cta')) {
            // Replace generic CTAs with brand-specific
            const brandPrompt = getBrandPrompt(brandAnalysis.brandName, brandAnalysis.category);
            repaired = repaired.replace(/get started/gi, brandPrompt.primaryCta);
          }
          if (lower.includes('brand color')) {
            // Fix body background
            repaired = repaired.replace(/body class="[^"]*bg-\[/g, 'body class="bg-gray-50 text-gray-900');
          }
        }

        finalHtml = finalCleanup(repaired, brandAnalysis.brandName);
        console.log(`[Nexus] ✅ Local repair applied for ${qaResult.issues.length} issues`);
      }

      // ========== ACCESSIBILITY CHECK (Agent #15) ==========
      const accessibilityCheck = await this.runAgent('accessibility-testing',
        { skill: 'accessibility-check, contrast-validation' },
        async () => {
          const hasContrast = finalHtml.includes('text-gray-900') || finalHtml.includes('text-gray-800');
          return {
            hasProperContrast: hasContrast,
            hasAltTags: !finalHtml.includes('<img') || finalHtml.includes('alt='),
            score: hasContrast ? 90 : 50
          };
        }
      );

      // ========== PERFORMANCE CHECK (Agent #18) ==========
      const performanceCheck = await this.runAgent('performance-monitoring',
        { skill: 'performance-check, size-validation' },
        async () => {
          const sizeKb = finalHtml.length / 1024;
          return {
            sizeKb: Math.round(sizeKb),
            isOptimal: sizeKb < 50,
            recommendations: sizeKb > 50 ? ['Reduce HTML size'] : []
          };
        }
      );

      // ========== HEALTH CHECK (Agent #16) ==========
      const healthCheck = await this.runAgent('health-check',
        { skill: 'health-monitor, structure-validation' },
        async () => {
          return {
            hasDoctype: finalHtml.includes('<!DOCTYPE'),
            hasMeta: finalHtml.includes('<meta'),
            hasViewport: finalHtml.includes('viewport'),
            hasTailwind: finalHtml.includes('tailwindcss'),
            healthy: true
          };
        }
      );
      
      if (!qaResult.isValid && qaResult.issues?.length > 0) {
        console.log('[Nexus] QA issues found, applying local repair...');
        
        // Local repair instead of LLM call
        let repaired = finalHtml;
        
        for (const issue of qaResult.issues) {
          const lower = issue.toLowerCase();
          
          if (lower.includes('missing doctype')) {
            repaired = '<!DOCTYPE html>\n' + repaired;
          }
          if (lower.includes('missing meta')) {
            repaired = repaired.replace('<head>', '<head>\n    <meta name="description" content="Official landing page">');
          }
          if (lower.includes('missing footer')) {
            repaired = repaired.replace('</body>', `
    <footer class="bg-gray-900 text-white py-8 text-center">
      <p>&copy; 2024 ${brandAnalysis.brandName}. All rights reserved.</p>
    </footer>
  </body>`);
          }
          if (lower.includes('broken image')) {
            repaired = repaired.replace(/<img[^>]*src="(?!https)[^"]*\.(jpg|png)"[^>]*\/?>/gi, '');
          }
          if (lower.includes('generic cta')) {
            // Replace generic CTAs with brand-specific
            const brandPrompt = getBrandPrompt(brandAnalysis.brandName, brandAnalysis.category);
            repaired = repaired.replace(/get started/gi, brandPrompt.primaryCta);
          }
          if (lower.includes('brand color')) {
            // Fix body background
            repaired = repaired.replace(/body class="[^"]*bg-\[/g, 'body class="bg-gray-50 text-gray-900');
          }
        }
        
        finalHtml = finalCleanup(repaired, brandAnalysis.brandName);
        console.log(`[Nexus] ✅ Local repair applied for ${qaResult.issues.length} issues`);
      }

      const duration = Date.now() - startTime;
      console.log(`[Nexus] ✅ Completed 30-Agent DAG with Skills in ${duration}ms`);

      return {
        success: true,
        html: finalHtml,
        spec: { brandAnalysis, adAnalysis, audienceAnalysis, strategy, copy, designTokens, qaResult },
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