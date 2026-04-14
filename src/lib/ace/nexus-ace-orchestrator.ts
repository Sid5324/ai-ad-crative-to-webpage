// src/lib/ace/nexus-ace-orchestrator.ts
// UNIFIED SYSTEM: 30-Agent Nexus Brain + ACE Nervous System
// Fixes Context Vanishing, Image Analysis, and Semantic Drift

import { UnifiedGCM, IntentWeight } from './ace-gcm';
import { useModel, isGeminiAvailable } from '../ai/models';
import { groqCall, geminiCall } from '../ai/providers';
import { generateProfessionalHTMLv2 } from '../skills/skill-v2-renderer';

export class NexusACEOrchestrator {
  private gcm: UnifiedGCM;
  private traceId: string;

  constructor() {
    this.traceId = Math.random().toString(36).substring(7);
    this.gcm = this.initUnifiedGCM();
  }

  private initUnifiedGCM(): UnifiedGCM {
    return {
      intent_vector: { b2b: 0.5, b2c: 0.5, confidence: 0.5, evidence: 'init' },
      visual_dna: { primary: '#1E293B', accent: '#3B82F6', logo: '⭐' },
      validated_proof_points: [],
      page_blueprint: { layout: 'standard', sections: [], flow: 'linear' },
      copy_framework: 'FEATURE_BENEFIT',
      cta_strategy: { primary: 'Get Started', secondary: 'Learn More' },
      design_tokens: {},
      html_manifest: '',
      qa_gate_status: 'CLEARED',
      semantic_drift_score: 0,
      error_logs: [],
      retry_count: 0,
      max_retries: 2,
      agent_trace: []
    };
  }

  // 🎯 VISION ANALYSIS SKILL - Fixes Image Bug
  private async visionAnalysisSkill(imageUrl: string): Promise<any> {
    console.log(`[${this.traceId}] 👁️ Running Vision Analysis on: ${imageUrl}`);

    // Check if Gemini is available
    if (!isGeminiAvailable()) {
      console.error(`[${this.traceId}] ❌ Gemini API not configured - cannot analyze images`);
      throw new Error('Gemini API key not configured for vision analysis');
    }

    try {
      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      const imageBuffer = await response.arrayBuffer();

      console.log(`[${this.traceId}] 📥 Downloaded image: ${imageBuffer.byteLength} bytes`);

      // Vision LLM call
      const visionPrompt = `
        Analyze this image for landing page content:
        1. Extract all visible text (OCR)
        2. Determine market intent: B2B (business/merchant focus) or B2C (consumer focus)
        3. Find specific proof points/numbers (e.g., "500k+", "5-star")
        4. Identify brand colors and visual style

        IMPORTANT: Ignore any timestamps, IDs, or URLs in the image filename/metadata.
        Focus only on the actual content shown in the image.

        Return JSON:
        {
          "text_content": "string",
          "market_intent": "B2B" | "B2C",
          "confidence": 0-1,
          "proof_points": ["500k+", "5-star"],
          "colors": ["#FF3008", "#000000"],
          "visual_style": "modern" | "classic" | "minimal"
        }
      `;

      const raw = await geminiCall(useModel('vision'), visionPrompt, {
        images: [{ data: Buffer.from(imageBuffer) }]
      });

      const result = JSON.parse(raw);
      console.log(`[${this.traceId}] ✅ Vision Analysis: ${result.market_intent} (${result.confidence})`);

      return result;

    } catch (error: any) {
      console.error(`[${this.traceId}] ❌ Vision Analysis Failed:`, error.message);

      // Check for quota exceeded
      if (error.message.includes('quota') || error.message.includes('429')) {
        console.error(`[${this.traceId}] 💰 Gemini API quota exceeded - upgrade to paid plan`);
        throw new Error('Gemini API quota exceeded. Please upgrade to a paid plan or wait for quota reset.');
      }

      // Check for model not found
      if (error.message.includes('not found')) {
        console.error(`[${this.traceId}] 🤖 Gemini model not available`);
        throw new Error('Gemini vision model not available. Please check API key permissions.');
      }

      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }

  // 🤖 AGENT OPERATOR - Runs Nexus Agents
  private async runAgent(agentId: number, agentName: string, logic: () => Promise<void>): Promise<void> {
    console.log(`[${this.traceId}] 🤖 Running Agent #${agentId}: ${agentName}`);

    try {
      await logic();
    } catch (error) {
      console.error(`[${this.traceId}] ❌ Agent #${agentId} Failed:`, error);
      this.gcm.error_logs.push(`Agent ${agentId} (${agentName}) failed: ${error}`);
      this.gcm.qa_gate_status = 'REPAIRING';
    }
  }

  async execute(input: { adInputType: string; adInputValue: string; targetUrl: string }): Promise<{
    success: boolean;
    html?: string;
    gcm: UnifiedGCM;
    errors?: string[];
  }> {
    console.log(`[${this.traceId}] 🚀 Starting Unified Nexus-ACE Orchestrator`);

    try {
      // ═══════════════════════════════════════════════════════════
      // 🏗️ FAMILY 1: RESEARCH (Agents 1-6) - THE EYES
      // ═══════════════════════════════════════════════════════════

      // Agent 1: Ad Analyzer (Multimodal)
      await this.runAgent(1, 'AdAnalyzer', async () => {
        if (input.adInputType === 'image_url') {
          // 🎯 VISION ANALYSIS - Fixes the Image Bug
          const visionResult = await this.visionAnalysisSkill(input.adInputValue);

          this.gcm.intent_vector = {
            b2b: visionResult.market_intent === 'B2B' ? 0.9 : 0.1,
            b2c: visionResult.market_intent === 'B2C' ? 0.9 : 0.1,
            confidence: visionResult.confidence,
            evidence: `Vision: ${visionResult.market_intent}`
          };

          // Extract real proof points from vision, not URL
          this.gcm.validated_proof_points = visionResult.proof_points.map((point: string) => ({
            value: point,
            source: 'vision_analysis',
            context: visionResult.text_content
          }));

        } else {
          // Vision failed - fallback to text analysis of URL (not ideal but better than nothing)
          console.log(`[${this.traceId}] ⚠️ Vision failed, falling back to URL text analysis`);

          const textIntent = input.adInputValue.toLowerCase();
          const b2bScore = (textIntent.match(/merchant|business|partner|b2b/gi) || []).length;
          const b2cScore = (textIntent.match(/order|buy|consumer|hungry|b2c/gi) || []).length;

          this.gcm.intent_vector = {
            b2b: b2bScore > b2cScore ? 0.8 : 0.2,
            b2c: b2cScore > b2bScore ? 0.8 : 0.2,
            confidence: Math.max(b2bScore, b2cScore) > 0 ? 0.7 : 0.3,
            evidence: `Fallback: B2B(${b2bScore}), B2C(${b2cScore})`
          };
        }
      });

      // Agent 3: Brand DNA Extractor
      await this.runAgent(3, 'BrandDNAExtractor', async () => {
        try {
          const hostname = new URL(input.targetUrl).hostname.replace(/^www\./, '');
          const brandMap: Record<string, any> = {
            'doordash': { primary: '#FF3008', accent: '#FF4D4D', logo: '🍕' },
            'uber': { primary: '#000000', accent: '#00C2C2', logo: '🚗' },
            'airbnb': { primary: '#FF5A5F', accent: '#FF5A5F', logo: '🏠' },
            'stripe': { primary: '#635BFF', accent: '#0A2540', logo: '💳' }
          };

          const brand = brandMap[hostname.split('.')[0]] || { primary: '#1E293B', accent: '#3B82F6', logo: '⭐' };
          this.gcm.visual_dna = brand;
        } catch (error) {
          console.warn(`[${this.traceId}] Brand extraction fallback`);
        }
      });

      // Agent 4: Offer Proof Guard - Fixes Timestamp Bug
      await this.runAgent(4, 'OfferProofGuard', async () => {
        // Filter out timestamps and invalid numbers
        this.gcm.validated_proof_points = this.gcm.validated_proof_points.filter(point => {
          const value = point.value.replace(/[^0-9kKmMbB+]/g, '');

          // Reject obvious timestamps (13+ digits starting with 17)
          if (/^17\d{11,}/.test(point.value)) {
            console.warn(`[${this.traceId}] 🚨 Filtered timestamp: ${point.value}`);
            return false;
          }

          // Reject single digits or invalid numbers
          const numValue = parseFloat(value.replace(/[kKmMbB]/g, ''));
          if (numValue < 10) return false;

          return true;
        });

        console.log(`[${this.traceId}] ✅ Validated proof points: ${this.gcm.validated_proof_points.length}`);
      });

      // 🛑 BLOCKING GATE: Research Quality Check
      if (this.gcm.intent_vector.confidence < 0.6) {
        console.warn(`[${this.traceId}] ⚠️ LOW CONFIDENCE: ${this.gcm.intent_vector.confidence} - Elastic fallback`);
        // Elastic weighting: don't fail, just use balanced approach
      }

      // ═══════════════════════════════════════════════════════════
      // 🧠 FAMILY 2: STRATEGY (Agents 7-12) - THE BRAIN
      // ═══════════════════════════════════════════════════════════

      // Agent 7: Page Strategy
      await this.runAgent(7, 'PageStrategy', async () => {
        const isB2B = this.gcm.intent_vector.b2b > 0.6;
        this.gcm.page_blueprint = {
          layout: isB2B ? 'b2b-professional' : 'b2c-consumer',
          sections: isB2B
            ? ['hero', 'features', 'proof', 'testimonials', 'faq', 'cta']
            : ['hero', 'benefits', 'social-proof', 'testimonials', 'faq', 'cta'],
          flow: isB2B ? 'trust-building' : 'conversion-focused'
        };
      });

      // Agent 9: Copy Framework Selector
      await this.runAgent(9, 'CopyFrameworkSelector', async () => {
        this.gcm.copy_framework = this.gcm.intent_vector.b2b > 0.6 ? 'PAS' : 'AIDA';
        this.gcm.cta_strategy = {
          primary: this.gcm.intent_vector.b2b > 0.6 ? 'Get Started' : 'Order Now',
          secondary: this.gcm.intent_vector.b2b > 0.6 ? 'Schedule Demo' : 'Learn More'
        };
      });

      // ═══════════════════════════════════════════════════════════
      // 🏭 FAMILY 3: FACTORY (Agents 13-26) - THE HANDS
      // ═══════════════════════════════════════════════════════════

      // Agent 13: Headliner Generator
      await this.runAgent(13, 'HeadlinerGenerator', async () => {
        // Generate copy based on framework
        let headline = '';
        let subheadline = '';

        if (this.gcm.copy_framework === 'PAS') {
          headline = 'Grow Your Business with Premium Solutions';
          subheadline = this.gcm.validated_proof_points.length > 0
            ? `Join ${this.gcm.validated_proof_points[0].value}+ satisfied customers`
            : 'Professional services you can trust';
        } else {
          headline = 'Experience Premium Quality';
          subheadline = this.gcm.validated_proof_points.length > 0
            ? `Join ${this.gcm.validated_proof_points[0].value}+ happy customers`
            : 'Experience the difference';
        }

        this.gcm.design_tokens = {
          headline,
          subheadline,
          primary_cta: this.gcm.cta_strategy.primary,
          secondary_cta: this.gcm.cta_strategy.secondary
        };
      });

      // Agent 15: Design Token Generator
      await this.runAgent(15, 'DesignTokenGenerator', async () => {
        this.gcm.design_tokens = {
          ...this.gcm.design_tokens,
          primary_color: this.gcm.visual_dna.primary,
          accent_color: this.gcm.visual_dna.accent,
          logo_emoji: this.gcm.visual_dna.logo,
          layout: this.gcm.page_blueprint.layout
        };
      });

      // Agent 19: Component Renderer
      await this.runAgent(19, 'ComponentRenderer', async () => {
        const brandName = new URL(input.targetUrl).hostname.replace(/^www\./, '').split('.')[0];
        const capitalizedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);

        this.gcm.html_manifest = generateProfessionalHTMLv2({
          brandName: capitalizedBrand,
          brandColors: {
            primary: this.gcm.visual_dna.primary,
            accent: this.gcm.visual_dna.accent,
            light: this.gcm.visual_dna.primary + '10',
            dark: this.gcm.visual_dna.primary
          },
          copy: this.gcm.design_tokens,
          category: 'food_delivery' // Will be improved by Agent 3
        });
      });

      // ═══════════════════════════════════════════════════════════
      // 🛡️ FAMILY 4: GOVERNANCE (Agents 27-30) - THE EXECUTIONER
      // ═══════════════════════════════════════════════════════════

      // Agent 27: QA Validator - Semantic Drift Gate
      await this.runAgent(27, 'QAValidator', async () => {
        const issues: string[] = [];

        // Check 1: Proof points in output
        for (const point of this.gcm.validated_proof_points) {
          if (!this.gcm.html_manifest.includes(point.value)) {
            issues.push(`MISSING_PROOF_POINT: ${point.value}`);
          }
        }

        // Check 2: Brand colors present
        if (!this.gcm.html_manifest.includes(this.gcm.visual_dna.primary)) {
          issues.push(`MISSING_BRAND_COLOR: ${this.gcm.visual_dna.primary}`);
        }

        // Check 3: Semantic drift
        const driftScore = this.calculateSemanticDrift();
        this.gcm.semantic_drift_score = driftScore;

        if (driftScore > 0.35) {
          issues.push(`SEMANTIC_DRIFT: Score ${driftScore} exceeds threshold`);
        }

        this.gcm.qa_gate_status = issues.length === 0 ? 'CLEARED' : 'BLOCKED';
        if (issues.length > 0) {
          this.gcm.error_logs.push(...issues);
        }
      });

      // Agent 29: Repair Agent - Auto-repair if needed
      if (this.gcm.qa_gate_status === 'BLOCKED' && this.gcm.retry_count < this.gcm.max_retries) {
        await this.runAgent(29, 'RepairAgent', async () => {
          console.log(`[${this.traceId}] 🔧 Auto-repairing build (attempt ${this.gcm.retry_count + 1})`);

          // Force simpler copy to reduce drift
          this.gcm.design_tokens.headline = this.gcm.intent_vector.b2b > 0.6
            ? 'Professional Business Solutions'
            : 'Premium Consumer Experience';
          this.gcm.design_tokens.subheadline = 'Trusted by thousands worldwide';

          this.gcm.retry_count++;
        });

        // Re-run renderer
        await this.runAgent(19, 'ComponentRenderer', async () => {
          const brandName = new URL(input.targetUrl).hostname.replace(/^www\./, '').split('.')[0];
          const capitalizedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);

          this.gcm.html_manifest = generateProfessionalHTMLv2({
            brandName: capitalizedBrand,
            brandColors: {
              primary: this.gcm.visual_dna.primary,
              accent: this.gcm.visual_dna.accent,
              light: this.gcm.visual_dna.primary + '10',
              dark: this.gcm.visual_dna.primary
            },
            copy: this.gcm.design_tokens,
            category: 'food_delivery'
          });
        });
      }

      console.log(`[${this.traceId}] ✅ Nexus-ACE Complete. Gate: ${this.gcm.qa_gate_status}`);

      return {
        success: this.gcm.qa_gate_status === 'CLEARED',
        html: this.gcm.html_manifest,
        gcm: this.gcm,
        errors: this.gcm.error_logs
      };

    } catch (error: any) {
      console.error(`[${this.traceId}] 💥 System Failure:`, error);
      return {
        success: false,
        gcm: this.gcm,
        errors: [...this.gcm.error_logs, error.message]
      };
    }
  }

  // 📊 SEMANTIC DRIFT CALCULATION
  private calculateSemanticDrift(): number {
    // Simple keyword-based drift detection for now
    const content = this.gcm.html_manifest.toLowerCase();
    const isB2B = this.gcm.intent_vector.b2b > 0.6;

    let driftScore = 0;

    if (isB2B) {
      // B2B content should avoid consumer-focused terms
      const b2cTerms = ['buy now', 'shop', 'hungry', 'delicious', 'tasty'];
      const b2cMatches = b2cTerms.filter(term => content.includes(term)).length;
      driftScore = Math.min(b2cMatches * 0.15, 1);
    } else {
      // B2C content should avoid business-focused terms
      const b2bTerms = ['enterprise', 'solution', 'partner', 'grow revenue', 'scale'];
      const b2bMatches = b2bTerms.filter(term => content.includes(term)).length;
      driftScore = Math.min(b2bMatches * 0.12, 1);
    }

    return driftScore;
  }
}