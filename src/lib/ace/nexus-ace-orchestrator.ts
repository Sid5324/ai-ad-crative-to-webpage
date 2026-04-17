// src/lib/ace/nexus-ace-orchestrator.ts
// UNIFIED SYSTEM: 30-Agent Nexus Brain + ACE Nervous System
// SYSTEM IMPROVEMENTS: Zero-Knowledge Extraction, Design Schema, Proof-of-Work Gate

import { UnifiedGCM, IntentWeight } from './ace-gcm';
import { useModel, isGeminiAvailable, getVisionModelChain } from '../ai/models';
import { groqCall, geminiCall } from '../ai/providers';
import { generateProfessionalHTMLv2 } from '../skills/skill-v2-renderer';

// ============================================================
// DESIGN SCHEMA - Abstract traits instead of categories
// ============================================================
export interface DesignSchema {
  darkMode: boolean;
  cornerRadius: number;      // 0 = sharp, 10 = very rounded
  luminance: 'high' | 'medium' | 'low';
  density: 'compact' | 'standard' | 'spacious';
  typography: 'serif' | 'sans-serif' | 'display';
  contrast: 'subtle' | 'medium' | 'high';
  animationLevel: 'minimal' | 'standard' | 'enhanced';
}

// ============================================================
// VISUAL ATMOSPHERE TRACKER - For Visual Regression
// ============================================================
export interface VisualAtmosphere {
  uiMood: 'dark' | 'light' | 'neon' | 'minimalist';
  uiDensity: 'luxury' | 'utility';
  luminanceScore: number;  // 0-1 (0=dark, 1=bright)
  darkPixelRatio: number; // >0.6 = dark mode override
}

// ============================================================
// BRAND PERSONALITY VECTOR - For Contextual Copy Generation
// ============================================================
export interface BrandPersonality {
  tone: 'technical' | 'premium' | 'reliable' | 'fast' | 'minimal' | 'sleek';
  voice: 'formal' | 'casual' | 'urgent' | 'confident' | 'helpful';
  primaryCta: string;
  secondaryCta: string;
  keyTerms: string[];
  avoidTerms: string[];
}

// ============================================================
// BRAND MANIFEST - Unified Context Engine (ICE)
// ============================================================
export interface BrandManifest {
  // 🎯 CORE IDENTITY (Set by Agent #1)
  identity: {
    industry: string;
    brandName: string;
    targetUrl: string;
    ocrContent: string;
    proofPoints: string[];
  };

  // 🎨 VISUAL DNA (Set by Agent #1)
  visual: {
    atmosphere: VisualAtmosphere;
    colors: { primary: string; accent: string; logo: string };
    designSchema: DesignSchema;
  };

  // 🧠 PERSONALITY VECTOR (Set by Agent #3)
  personality: {
    tone: 'technical' | 'premium' | 'reliable' | 'fast' | 'minimal' | 'sleek';
    voice: 'formal' | 'casual' | 'urgent' | 'confident' | 'helpful';
    primaryCta: string;
    secondaryCta: string;
    keyTerms: string[];
    avoidTerms: string[];
  };

  // 📋 CONTENT BLUEPRINT (Set by Nexus Brain)
  content: {
    layout: string[];
    copy: Record<string, string>;
    sections: string[];
  };

  // 🎯 INTENT VECTOR (Set by Agent #1)
  intent: { b2b: number; b2c: number; confidence: number; evidence: string };

  // ✅ VALIDATION STATE (Updated by Agent #27)
  validation: {
    semanticDrift: number;
    visualRegression: boolean;
    brandAlignment: number;
  };
}

// ============================================================
// DESIGN TOKEN REGISTRY (DTR) - Mathematical Design Signature
// ============================================================
export interface DesignTokenRegistry {
  brand_dna: {
    palette: {
      bg_primary: string;
      text_primary: string;
      accent: string;
      surface_elevated: string;
    };
    typography: {
      scale_ratio: number;
      base_weight: string;
      heading_weight: string;
      font_family_cat: 'geometric-sans' | 'humanist-serif' | 'mono-technical';
    };
    geometry: {
      radius: string;
      container_max_width: string;
      visual_density: number; // 0-1: 0=minimalist, 1=bento
    };
  };
  semantic_anchors: {
    core_keywords: string[];
    tone_vector: { speed: number; luxury: number; utility: number };
    primary_cta: string;
    secondary_cta: string;
  };
  composition_primitives: {
    layout_type: 'zen-hero' | 'split-hero' | 'bento-grid';
    section_count: number;
    content_density: 'minimal' | 'standard' | 'rich';
  };
}

// ============================================================
// INTEGRATED CONTEXTUAL ENGINE (ICE) - Central State Machine
// ============================================================
export class BrandManifestEngine {
  private manifest: BrandManifest;
  private dtr: DesignTokenRegistry;

  constructor() {
    this.manifest = this.createEmptyManifest();
    this.dtr = this.createEmptyDTR();
  }

  private createEmptyDTR(): DesignTokenRegistry {
    return {
      brand_dna: {
        palette: {
          bg_primary: '#000000',
          text_primary: '#FFFFFF',
          accent: '#FF3008',
          surface_elevated: '#1A1A1A'
        },
        typography: {
          scale_ratio: 1.25,
          base_weight: '400',
          heading_weight: '900',
          font_family_cat: 'geometric-sans'
        },
        geometry: {
          radius: '12px',
          container_max_width: '1280px',
          visual_density: 0.25
        }
      },
      semantic_anchors: {
        core_keywords: [],
        tone_vector: { speed: 0.5, luxury: 0.5, utility: 0.5 },
        primary_cta: 'Get Started',
        secondary_cta: 'Learn More'
      },
      composition_primitives: {
        layout_type: 'zen-hero',
        section_count: 3,
        content_density: 'standard'
      }
    };
  }

  private createEmptyManifest(): BrandManifest {
    return {
      identity: {
        industry: 'generic',
        brandName: '',
        targetUrl: '',
        ocrContent: '',
        proofPoints: []
      },
      visual: {
        atmosphere: {
          uiMood: 'light',
          uiDensity: 'utility',
          luminanceScore: 0.7,
          darkPixelRatio: 0.2
        },
        colors: { primary: '#1E293B', accent: '#3B82F6', logo: '⭐' },
        designSchema: {
          darkMode: false,
          cornerRadius: 4,
          luminance: 'medium',
          density: 'standard',
          typography: 'sans-serif',
          contrast: 'medium',
          animationLevel: 'standard'
        }
      },
      personality: {
        tone: 'minimal',
        voice: 'confident',
        primaryCta: 'Get Started',
        secondaryCta: 'Learn More',
        keyTerms: [],
        avoidTerms: []
      },
      content: {
        layout: ['hero'],
        copy: {},
        sections: []
      },
      intent: { b2b: 0.5, b2c: 0.5, confidence: 0.5, evidence: 'init' },
      validation: {
        semanticDrift: 0,
        visualRegression: false,
        brandAlignment: 1
      }
    };
  }

  // 🎯 IDENTITY MUTATION - Agent #1 calls this
  updateIdentity(identity: Partial<BrandManifest['identity']>): void {
    this.manifest.identity = { ...this.manifest.identity, ...identity };
  }

  // 🎨 VISUAL MUTATION - Agent #1 calls this
  updateVisual(visual: Partial<BrandManifest['visual']>): void {
    this.manifest.visual = { ...this.manifest.visual, ...visual };
  }

  // 🧠 PERSONALITY MUTATION - Agent #3 calls this
  updatePersonality(personality: Partial<BrandManifest['personality']>): void {
    this.manifest.personality = { ...this.manifest.personality, ...personality };
  }

  // 📋 CONTENT MUTATION - Nexus Brain calls this
  updateContent(content: Partial<BrandManifest['content']>): void {
    this.manifest.content = { ...this.manifest.content, ...content };
  }

  // 🎯 INTENT MUTATION - Agent #1 calls this
  updateIntent(intent: Partial<BrandManifest['intent']>): void {
    this.manifest.intent = { ...this.manifest.intent, ...intent };
  }

  // ✅ VALIDATION MUTATION - Agent #27 calls this
  updateValidation(validation: Partial<BrandManifest['validation']>): void {
    this.manifest.validation = { ...this.manifest.validation, ...validation };
  }

  // 🔍 READ-ONLY ACCESSORS - All agents read from these
  getIdentity(): BrandManifest['identity'] {
    return { ...this.manifest.identity };
  }

  getVisual(): BrandManifest['visual'] {
    return { ...this.manifest.visual };
  }

  getPersonality(): BrandManifest['personality'] {
    return { ...this.manifest.personality };
  }

  getContent(): BrandManifest['content'] {
    return { ...this.manifest.content };
  }

  getIntent(): BrandManifest['intent'] {
    return { ...this.manifest.intent };
  }

  getValidation(): BrandManifest['validation'] {
    return { ...this.manifest.validation };
  }

  // 🎨 DTR MANAGEMENT
  updateDTR(dtr: Partial<DesignTokenRegistry>): void {
    this.dtr = { ...this.dtr, ...dtr };
  }

  getDTR(): Readonly<DesignTokenRegistry> {
    return JSON.parse(JSON.stringify(this.dtr));
  }

  // 🔒 IMMUTABLE FULL MANIFEST - For debugging only
  getFullManifest(): Readonly<BrandManifest> {
    return JSON.parse(JSON.stringify(this.manifest));
  }

  // 🎯 NEGATIVE CONSTRAINT FEEDBACK LOOP
  generateCorrectionDirective(failureReason: string, currentOutput: any): string {
    const dtr = this.dtr;
    const personality = this.manifest.personality;

    let directive = `SEMANTIC_CORRECTION_REQUIRED: ${failureReason}\n\n`;

    // Analyze the failure and generate specific corrections
    if (failureReason.includes('VISUAL_REGRESSION')) {
      directive += `VISUAL_FIX: Source image uses ${dtr.brand_dna.palette.bg_primary} background. `;
      directive += `Current output uses different colors. FORCE: bg-[var(--brand-bg)] and text-[var(--brand-text)].\n`;
    }

    if (failureReason.includes('SEMANTIC_DRIFT')) {
      directive += `SEMANTIC_FIX: Source intent is ${JSON.stringify(dtr.semantic_anchors.tone_vector)}. `;
      directive += `Current output uses ${personality.avoidTerms.join(', ')} terms. `;
      directive += `REQUIRED: Use only ${dtr.semantic_anchors.core_keywords.join(', ')} keywords. `;
      directive += `FORBIDDEN: ${personality.avoidTerms.join(', ')}.\n`;
    }

    if (failureReason.includes('LAYOUT_DENSITY')) {
      const requiredDensity = dtr.composition_primitives.content_density;
      directive += `DENSITY_FIX: Source visual density is ${dtr.brand_dna.geometry.visual_density}. `;
      directive += `Current layout is too ${currentOutput.density > dtr.brand_dna.geometry.visual_density ? 'dense' : 'sparse'}. `;
      directive += `REQUIRED: ${requiredDensity} layout with ${dtr.composition_primitives.section_count} sections.\n`;
    }

    directive += `\nDESIGN_CONSTRAINTS:\n`;
    directive += `- Colors: bg=${dtr.brand_dna.palette.bg_primary}, text=${dtr.brand_dna.palette.text_primary}, accent=${dtr.brand_dna.palette.accent}\n`;
    directive += `- Typography: ${dtr.brand_dna.typography.font_family_cat} family, heading weight ${dtr.brand_dna.typography.heading_weight}\n`;
    directive += `- Layout: ${dtr.composition_primitives.layout_type} with ${dtr.composition_primitives.section_count} sections\n`;
    directive += `- CTA: Primary="${dtr.semantic_anchors.primary_cta}", Secondary="${dtr.semantic_anchors.secondary_cta}"\n`;

    return directive;
  }

  // 🧹 RESET - For new sessions
  reset(): void {
    this.manifest = this.createEmptyManifest();
    this.dtr = this.createEmptyDTR();
  }
}

// Default schema
const DEFAULT_SCHEMA: DesignSchema = {
  darkMode: false,
  cornerRadius: 4,
  luminance: 'medium',
  density: 'standard',
  typography: 'sans-serif',
  contrast: 'medium',
  animationLevel: 'standard'
};

// Default atmosphere
const DEFAULT_ATMOSPHERE: VisualAtmosphere = {
  uiMood: 'light',
  uiDensity: 'utility',
  luminanceScore: 0.7,
  darkPixelRatio: 0.2
};

// Extract design schema from vision analysis
const extractDesignSchemaFromVision = (visionResult: any): DesignSchema => {
  const visualStyle = visionResult.visual_style || 'minimal';
  
  // Map visual_style to design traits
  const schemaMap: Record<string, DesignSchema> = {
    'modern': {
      darkMode: false,
      cornerRadius: 8,
      luminance: 'high',
      density: 'spacious',
      typography: 'sans-serif',
      contrast: 'subtle',
      animationLevel: 'enhanced'
    },
    'classic': {
      darkMode: false,
      cornerRadius: 2,
      luminance: 'medium',
      density: 'standard',
      typography: 'serif',
      contrast: 'high',
      animationLevel: 'minimal'
    },
    'minimal': {
      darkMode: true,
      cornerRadius: 0,
      luminance: 'low',
      density: 'spacious',
      typography: 'sans-serif',
      contrast: 'high',
      animationLevel: 'minimal'
    },
    'dark': {
      darkMode: true,
      cornerRadius: 6,
      luminance: 'low',
      density: 'compact',
      typography: 'display',
      contrast: 'high',
      animationLevel: 'standard'
    },
    'luxury': {
      darkMode: true,
      cornerRadius: 2,
      luminance: 'low',
      density: 'spacious',
      typography: 'serif',
      contrast: 'subtle',
      animationLevel: 'minimal'
    }
  };
  
  return schemaMap[visualStyle] || DEFAULT_SCHEMA;
};

export class NexusACEOrchestrator {
  private gcm: UnifiedGCM;
  private traceId: string;
  private ice: BrandManifestEngine; // INTEGRATED CONTEXTUAL ENGINE

  constructor() {
    this.traceId = Math.random().toString(36).substring(7);
    this.gcm = this.initUnifiedGCM();
    this.ice = new BrandManifestEngine(); // Initialize ICE
  }

  private initUnifiedGCM(): UnifiedGCM {
    return {
      intent_vector: { b2b: 0.5, b2c: 0.5, confidence: 0.5, evidence: 'init' },
      visual_dna: { primary: '#1E293B', accent: '#3B82F6', logo: '⭐' },
      validated_proof_points: [],
      page_blueprint: { layout: 'standard', sections: [], flow: 'linear', category: 'generic' },
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

  // 🎯 VISION ANALYSIS SKILL - With Fallback Chain
  private async visionAnalysisSkill(imageUrl: string): Promise<any> {
    console.log(`[${this.traceId}] 👁️ Running Vision Analysis on: ${imageUrl}`);

    // Check if Gemini is available
    if (!isGeminiAvailable()) {
      console.error(`[${this.traceId}] ❌ Gemini API not configured - cannot analyze images`);
      throw new Error('Gemini API key not configured for vision analysis');
    }

    // Get fallback chain
    const modelChain = getVisionModelChain();
    console.log(`[${this.traceId}] 📋 Vision model chain: ${modelChain.join(' -> ')}`);

    // Download image first
    let imageBuffer: ArrayBuffer;
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      imageBuffer = await response.arrayBuffer();
      console.log(`[${this.traceId}] 📥 Downloaded image: ${imageBuffer.byteLength} bytes`);
    } catch (error: any) {
      throw new Error(`Failed to download image: ${error.message}`);
    }

    const visionPrompt = `
      Analyze this image for landing page content:
      1. Extract all visible text (OCR)
      2. Determine market intent: B2B (business/merchant focus) or B2C (consumer focus)
      3. Find specific proof points/numbers (e.g., "500k+", "5-star")
      4. Identify brand colors - extract ACTUAL hex codes visible in the image
      5. Identify visual style - choose from: modern, classic, minimal, dark, luxury
      6. Identify UI traits: corner_radius (0-10), typography_style, density

      IMPORTANT: Ignore any timestamps, IDs, or URLs in the image filename/metadata.
      Focus only on the actual content shown in the image.

      Return JSON:
      {
        "text_content": "string",
        "market_intent": "B2B" | "B2C",
        "confidence": 0-1,
        "proof_points": ["500k+", "5-star"],
        "colors": ["#FF3008", "#000000"],
        "visual_style": "modern" | "classic" | "minimal" | "dark" | "luxury",
        "corner_radius": 0-10,
        "typography_style": "serif" | "sans-serif" | "display",
        "density": "compact" | "standard" | "spacious"
      }
    `;

    // Try each model in the fallback chain
    let lastError: Error | null = null;
    
    for (const model of modelChain) {
      try {
        console.log(`[${this.traceId}] 🔄 Trying vision model: ${model}`);
        
        const raw = await geminiCall(model, visionPrompt, {
          images: [{ data: Buffer.from(imageBuffer) }]
        });

        // Clean up JSON response - remove code fences if present
        let cleanedRaw = raw.trim();
        if (cleanedRaw.startsWith('```json')) {
          cleanedRaw = cleanedRaw.slice(7);
        }
        if (cleanedRaw.startsWith('```')) {
          cleanedRaw = cleanedRaw.slice(3);
        }
        if (cleanedRaw.endsWith('```')) {
          cleanedRaw = cleanedRaw.slice(0, -3);
        }
        cleanedRaw = cleanedRaw.trim();

        const result = JSON.parse(cleanedRaw);
        console.log(`[${this.traceId}] ✅ Vision Analysis SUCCESS with ${model}: ${result.market_intent} (${result.confidence})`);
        
        return result;
        
      } catch (error: any) {
        const errorMsg = error.message || '';
        
        // Check for quota error
        if (errorMsg.includes('429') || errorMsg.includes('quota')) {
          console.warn(`[${this.traceId}] ⚠️ Model ${model} quota exceeded, trying next...`);
          lastError = error;
          continue; // Try next model
        }
        
        // Check for model not found or service unavailable
        if (errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('503')) {
          console.warn(`[${this.traceId}] ⚠️ Model ${model} unavailable (${errorMsg.includes('503') ? 'high demand' : 'not found'}), trying next...`);
          lastError = error;
          continue; // Try next model
        }
        
        // Check for JSON parse error - try next model
        if (errorMsg.includes('Unexpected token') || errorMsg.includes('JSON')) {
          console.warn(`[${this.traceId}] ⚠️ Model ${model} returned invalid JSON, trying next...`);
          lastError = error;
          continue;
        }
        
        // Other error - try next model
        console.warn(`[${this.traceId}] ⚠️ Model ${model} failed: ${errorMsg.substring(0, 50)}`);
        lastError = error;
        continue;
      }
    }

    // All models failed
    console.error(`[${this.traceId}] ❌ All vision models failed`);
    throw new Error(`All Gemini vision models failed. Last error: ${lastError?.message}`);
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

      // Agent 1: Ad Analyzer (Multimodal) - ZERO-KNOWLEDGE EXTRACTION → ICE
      await this.runAgent(1, 'AdAnalyzer', async () => {
        if (input.adInputType === 'image_url') {
          // VISION ANALYSIS - Extract everything from image, not from dictionary
          const visionResult = await this.visionAnalysisSkill(input.adInputValue);

          // 🎯 UPDATE ICE IDENTITY with OCR validation
          const brandName = new URL(input.targetUrl).hostname.replace(/^www\./, '').split('.')[0];
          const capitalizedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
          const industry = this.detectIndustryFromVision(visionResult, input.targetUrl);

          // 🔍 OCR QUALITY GATE - Validate and clean OCR content
          const ocrValidation = this.validateOCRContent(visionResult.text_content || '', industry);
          console.log(`[${this.traceId}] 🔍 OCR Validation: valid=${ocrValidation.isValid}, confidence=${ocrValidation.confidence.toFixed(2)}`);
          if (!ocrValidation.isValid) {
            console.warn(`[${this.traceId}] ⚠️ OCR content flagged as corrupted, using fallback: "${ocrValidation.cleanedText}"`);
          }

          this.ice.updateIdentity({
            industry,
            brandName: capitalizedBrand,
            targetUrl: input.targetUrl,
            ocrContent: ocrValidation.cleanedText, // Use validated/cleaned OCR
            proofPoints: visionResult.proof_points || []
          });

          // 🎯 UPDATE ICE INTENT
          this.ice.updateIntent({
            b2b: visionResult.market_intent === 'B2B' ? 0.9 : 0.1,
            b2c: visionResult.market_intent === 'B2C' ? 0.9 : 0.1,
            confidence: visionResult.confidence,
            evidence: `Vision: ${visionResult.market_intent}`
          });

          // 🎨 UPDATE ICE VISUAL
          const visualAtmosphere = this.extractVisualAtmosphere(visionResult);
          const designSchema = extractDesignSchemaFromVision(visionResult);

          // ARCHITECTURAL OVERRIDE: If dark pixel ratio > 0.6, force dark mode
          if (visualAtmosphere.darkPixelRatio > 0.6) {
            designSchema.darkMode = true;
            designSchema.luminance = 'low';
            console.log(`[${this.traceId}] 🚨 VISUAL OVERRIDE: Dark mode forced (${visualAtmosphere.darkPixelRatio} ratio)`);
          }

          this.ice.updateVisual({
            atmosphere: visualAtmosphere,
            colors: {
              primary: visionResult.colors?.[0] || '#1E293B',
              accent: visionResult.colors?.[1] || '#3B82F6',
              logo: '⭐'
            },
            designSchema
          });

          // 🎨 POPULATE DTR - Mathematical design signature from vision
          const dtr = this.extractDesignTokenRegistry(visionResult, industry);
          this.ice.updateDTR(dtr);
          console.log(`[${this.traceId}] 🎨 Design Token Registry:`, dtr);

          // 🧠 UPDATE ICE PERSONALITY
          const personality = this.extractBrandPersonality(industry, input.targetUrl, visionResult.text_content || '');
          this.ice.updatePersonality(personality);
          console.log(`[${this.traceId}] 🎭 Brand Personality:`, personality);

          // 🔄 BACKWARD COMPATIBILITY - Update GCM for existing agents
          this.gcm.intent_vector = this.ice.getIntent();
          this.gcm.validated_proof_points = (visionResult.proof_points || []).map((point: string) => ({
            value: point,
            source: 'vision_analysis',
            context: visionResult.text_content
          }));
          this.gcm.visual_dna = this.ice.getVisual().colors;

          console.log(`[${this.traceId}] ✅ ICE Updated - Industry: ${industry}, Personality: ${personality.tone}`);

        } else {
          // Vision failed - fallback to text analysis of URL
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

          // Detect industry from URL in fallback mode
          const industry = this.detectIndustryFromVision({}, input.targetUrl);

          // Extract brand personality in fallback mode
          const personality = this.extractBrandPersonality(industry, input.targetUrl, '');

          // Update ICE with fallback data
          this.ice.updateIdentity({ industry });
          this.ice.updatePersonality(personality);
        }
      });

      // Agent 3: Brand DNA Extractor - ZERO-KNOWLEDGE (no dictionary lookup)
      await this.runAgent(3, 'BrandDNAExtractor', async () => {
        try {
          // Use colors from vision analysis (extracted from image, not dictionary)
          // Only add logo if needed - extract from URL domain
          const hostname = new URL(input.targetUrl).hostname.replace(/^www\./, '');
          const domain = hostname.split('.')[0];
          
          // If colors not extracted from vision, use defaults based on design schema
          if (!this.gcm.visual_dna.primary || this.gcm.visual_dna.primary === '#1E293B') {
            // Use design schema from ICE to determine colors
            const visual = this.ice.getVisual();
            const schema = visual.designSchema;

            if (schema.darkMode) {
              this.gcm.visual_dna = {
                primary: '#0F172A',
                accent: schema.contrast === 'high' ? '#F8FAFC' : '#94A3B8',
                logo: '⭐'
              };
            } else {
              this.gcm.visual_dna = {
                primary: '#1E293B',
                accent: '#3B82F6',
                logo: '⭐'
              };
            }
            console.log(`[${this.traceId}] 🎨 Using design schema colors: darkMode=${schema.darkMode}`);
          }
          
          // Log what we have
          console.log(`[${this.traceId}] ✅ Visual DNA: primary=${this.gcm.visual_dna.primary}, accent=${this.gcm.visual_dna.accent}`);
          
        } catch (error) {
          console.warn(`[${this.traceId}] Brand extraction fallback`);
        }
      });

      // Agent 4: Offer Proof Guard - Filters timestamps, PII, credit cards
      await this.runAgent(4, 'OfferProofGuard', async () => {
        // Filter out timestamps, credit cards, phone numbers, and other PII
        this.gcm.validated_proof_points = this.gcm.validated_proof_points.filter(point => {
          const value = point.value;
          const cleanValue = value.replace(/[^0-9kKmMbB+]/g, '');

          // Reject obvious timestamps (13+ digits starting with 17)
          if (/^17\d{11,}/.test(value)) {
            console.warn(`[${this.traceId}] 🚨 Filtered timestamp: ${value}`);
            return false;
          }

          // Reject credit card patterns (4 groups of 4 digits, asterisks, etc)
          if (/^[\d*]{13,19}$/.test(value) || /^\*+[\d*]+$/.test(value) || /\d{4}[\s*]+\d{4}/.test(value) || /\*{4}.*\d{4}/.test(value)) {
            console.warn(`[${this.traceId}] 🚨 Filtered credit card: ${value}`);
            return false;
          }

          // Reject patterns that look like credit cards (e.g., "**** 3554 5678 9998")
          if ((value.match(/\d+/g) || []).length >= 3 && value.includes('*')) {
            console.warn(`[${this.traceId}] 🚨 Filtered potential credit card: ${value}`);
            return false;
          }

          // Reject phone numbers (10+ digits, possibly with dashes/parens)
          if (/^[\d\-\(\)]{10,15}$/.test(value) && /^[\d\(\)\-]*\d{3}[\-\)]*\d{3}[\-\)]*\d{4}/.test(value)) {
            console.warn(`[${this.traceId}] 🚨 Filtered phone number: ${value}`);
            return false;
          }

          // Reject dates (MM/YY, YYYY, etc)
          if (/^\d{2}\/\d{2,4}$/.test(value) || /^(19|20)\d{2}$/.test(value)) {
            console.warn(`[${this.traceId}] 🚨 Filtered date: ${value}`);
            return false;
          }

          // Reject single digits or invalid numbers
          const numValue = parseFloat(cleanValue.replace(/[kKmMbB]/g, ''));
          if (numValue < 10) return false;

          // Accept valid proof points (numbers with k/K/m/M/b/B/+ like "500K+", "1M+", etc)
          return /^\d+[kKmMbB]?\+?$/i.test(cleanValue);
        });

        console.log(`[${this.traceId}] ✅ Validated proof points: ${this.gcm.validated_proof_points.length}`);
      });

      // 🛑 PROOF-OF-WORK GATE: Stop if no proof points AND low confidence
      const hasProofPoints = this.gcm.validated_proof_points.length > 0;
      const hasConfidence = this.gcm.intent_vector.confidence >= 0.7;
      
      if (!hasProofPoints && !hasConfidence) {
        console.error(`[${this.traceId}] 🚫 PROOF-OF-WORK GATE BLOCKED: No proof points AND confidence < 0.7`);
        this.gcm.qa_gate_status = 'BLOCKED';
        this.gcm.error_logs.push('PROOF_OF_WORK_FAILED: No proof points and confidence too low to proceed');
        return {
          success: false,
          html: '',
          gcm: this.gcm,
          errors: this.gcm.error_logs
        };
      }
      
      // 🛑 BLOCKING GATE: Research Quality Check (elastic fallback for partial failures)
      if (!hasConfidence) {
        console.warn(`[${this.traceId}] ⚠️ LOW CONFIDENCE: ${this.gcm.intent_vector.confidence} - Elastic fallback, continuing with balanced approach`);
      }

      if (!hasProofPoints) {
        console.warn(`[${this.traceId}] ⚠️ NO PROOF POINTS: Proceeding without validated proof points`);
      }

      // ═══════════════════════════════════════════════════════════
      // 🧠 NEXUS BRAIN: Consolidated Strategy, Copy, and Layout Engine
      // ═══════════════════════════════════════════════════════════

      // Agent 7-15: Nexus Brain - Unified Strategy Engine (Reads from ICE)
      await this.runAgent(7, 'NexusBrain', async () => {
        await this.runNexusBrain();
      });

      // ═══════════════════════════════════════════════════════════
      // 🏭 FAMILY 3: FACTORY (Agents 16-26) - THE HANDS
      // ═══════════════════════════════════════════════════════════

      // Agent 19: Component Renderer - Uses DTR for pixel-perfect branding
      await this.runAgent(19, 'ComponentRenderer', async () => {
        const identity = this.ice.getIdentity();
        const visual = this.ice.getVisual();
        const content = this.ice.getContent();
        const dtr = this.ice.getDTR();

        const forceDarkMode = visual.atmosphere.darkPixelRatio > 0.6;
        console.log(`[${this.traceId}] 🎨 Rendering with DTR - Category: ${identity.industry}, DarkMode: ${forceDarkMode}`);

        this.gcm.html_manifest = generateProfessionalHTMLv2({
          brandName: identity.brandName,
          brandColors: {
            primary: dtr.brand_dna.palette.accent, // Use DTR accent as primary
            accent: dtr.brand_dna.palette.surface_elevated, // Use surface for accent
            light: dtr.brand_dna.palette.bg_primary, // Use background for light
            dark: dtr.brand_dna.palette.text_primary // Use text for dark
          },
          copy: { ...this.gcm.design_tokens, ...content.copy },
          category: identity.industry,
          darkMode: forceDarkMode, // DTR atmosphere override
          dtr: dtr // Pass full DTR for advanced rendering
        });
      });

      // ═══════════════════════════════════════════════════════════
      // 🛡️ FAMILY 4: GOVERNANCE (Agents 27-30) - THE EXECUTIONER
      // ═══════════════════════════════════════════════════════════

      // Agent 26: Code Linter - Syntax validation and semantic alignment
      await this.runAgent(26, 'CodeLinter', async () => {
        const content = this.gcm.html_manifest;
        const issues: string[] = [];

        // SYNTAX CHECKS
        // Check for invalid Tailwind classes
        const invalidClasses = content.match(/bg-black\/\d+\/\d+/g);
        if (invalidClasses) {
          issues.push(`SYNTAX_ERROR: Invalid Tailwind classes: ${invalidClasses.join(', ')}`);
        }

        // Check for malformed CSS
        if (content.includes('background: linear-gradient(') && !content.includes(');')) {
          issues.push('SYNTAX_ERROR: Malformed CSS gradient');
        }

        // SEMANTIC CHECKS
        const personality = this.ice.getPersonality();

        // Check for personality alignment
        let brandAlignment = 1.0;
        if (personality.keyTerms.length > 0) {
          const termMatches = personality.keyTerms.filter(term =>
            content.toLowerCase().includes(term.toLowerCase())
          ).length;
          brandAlignment = termMatches / Math.min(personality.keyTerms.length, 5);
        }

        // Check for forbidden terms
        const forbiddenMatches = personality.avoidTerms.filter(term =>
          content.toLowerCase().includes(term.toLowerCase())
        );
        if (forbiddenMatches.length > 0) {
          issues.push(`SEMANTIC_VIOLATION: Forbidden terms used: ${forbiddenMatches.join(', ')}`);
          brandAlignment -= 0.2 * forbiddenMatches.length;
        }

        // Update ICE validation
        this.ice.updateValidation({ brandAlignment: Math.max(0, brandAlignment) });

        if (issues.length > 0) {
          console.error(`[${this.traceId}] 🚨 Linter Issues: ${issues.join(', ')}`);
          // Auto-fix syntax errors
          let fixedContent = content;
          if (invalidClasses) {
            // Replace invalid classes with valid ones
            invalidClasses.forEach(cls => {
              const validCls = cls.replace(/\/\d+\/\d+/, '');
              fixedContent = fixedContent.replace(cls, validCls);
            });
            this.gcm.html_manifest = fixedContent;
            console.log(`[${this.traceId}] 🔧 Auto-fixed ${invalidClasses.length} syntax errors`);
          }
        }
      });

      // Agent 27: QA Validator - Semantic Drift Gate + Industry Cross-Validation
      await this.runAgent(27, 'QAValidator', async () => {
        const issues: string[] = [];

        // Check 1: Proof points in output (only if we have valid proof points)
        if (this.gcm.validated_proof_points.length > 0) {
          for (const point of this.gcm.validated_proof_points) {
            if (!this.gcm.html_manifest.includes(point.value)) {
              issues.push(`MISSING_PROOF_POINT: ${point.value}`);
            }
          }
        } else {
          console.log(`[${this.traceId}] ℹ️ No valid proof points to verify - skipping check`);
        }

        // Check 2: Brand colors present
        if (!this.gcm.html_manifest.includes(this.gcm.visual_dna.primary)) {
          issues.push(`MISSING_BRAND_COLOR: ${this.gcm.visual_dna.primary}`);
        }

        // Check 3: Semantic drift (B2B vs B2C mismatch)
        const driftScore = this.calculateSemanticDrift();
        this.gcm.semantic_drift_score = driftScore;

        if (driftScore > 0.7) {
          issues.push(`SEMANTIC_DRIFT: Score ${driftScore} exceeds threshold`);
        }

        // Check 4: Industry Category Cross-Validation (NEW)
        // Compare generated HTML category with target URL industry
        const htmlLower = this.gcm.html_manifest.toLowerCase();
        const targetUrlLower = input.targetUrl.toLowerCase();
        
        // Check for food/delivery keywords in HTML when URL is NOT food-related
        const isFoodHTML = htmlLower.includes('pizza') || htmlLower.includes('delivery') || htmlLower.includes('restaurant') || htmlLower.includes('food');
        const isFoodURL = targetUrlLower.includes('doordash') || targetUrlLower.includes('food') || targetUrlLower.includes('restaurant') || targetUrlLower.includes('delivery');
        
        const identity = this.ice.getIdentity();
        if (isFoodHTML && !isFoodURL && identity.industry !== 'food_delivery') {
          issues.push(`CATEGORY_MISMATCH: HTML contains food/delivery content but target is ${identity.industry}`);
          console.error(`[${this.traceId}] 🚨 CATEGORY MISMATCH: Food template used for non-food URL`);
        }

        // Check for fintech keywords in HTML when URL IS fintech
        const isFintechHTML = htmlLower.includes('credit') || htmlLower.includes('payment') || htmlLower.includes('card');
        
        // 🎨 VISUAL REGRESSION CHECK: Compare DTR colors with output
        const dtr = this.ice.getDTR();
        const expectedBg = dtr.brand_dna.palette.bg_primary.toLowerCase();
        const expectedText = dtr.brand_dna.palette.text_primary.toLowerCase();
        const expectedAccent = dtr.brand_dna.palette.accent.toLowerCase();

        const hasExpectedBg = htmlLower.includes(expectedBg);
        const hasExpectedText = htmlLower.includes(expectedText);
        const hasExpectedAccent = htmlLower.includes(expectedAccent);

        if (!hasExpectedBg || !hasExpectedText || !hasExpectedAccent) {
          issues.push(`VISUAL_REGRESSION: Missing DTR colors - Expected: ${expectedBg}, ${expectedText}, ${expectedAccent}`);
          this.ice.updateValidation({ visualRegression: true });
          console.error(`[${this.traceId}] 🚨 VISUAL REGRESSION: DTR colors not found in output`);
        } else {
          this.ice.updateValidation({ visualRegression: false });
        }

        // This is informational - doesn't block unless severe
        if (!isFintechHTML && (targetUrlLower.includes('cred') || targetUrlLower.includes('finance') || targetUrlLower.includes('stripe'))) {
          console.warn(`[${this.traceId}] ⚠️ Target is fintech but HTML may not reflect premium fintech brand`);
        }

        this.gcm.qa_gate_status = issues.length === 0 ? 'CLEARED' : 'BLOCKED';
        if (issues.length > 0) {
          this.gcm.error_logs.push(...issues);
          console.error(`[${this.traceId}] ❌ QA Issues: ${issues.join(', ')}`);
        }
      });

      // Agent 29: Repair Agent - Negative Constraint Feedback Loop
      if (this.gcm.qa_gate_status === 'BLOCKED' && this.gcm.retry_count < this.gcm.max_retries) {
        await this.runAgent(29, 'RepairAgent', async () => {
          console.log(`[${this.traceId}] 🔧 Auto-repairing build (attempt ${this.gcm.retry_count + 1})`);

          // Generate correction directive from ICE
          const validation = this.ice.getValidation();
          let failureReason = 'UNKNOWN';

          if (validation.semanticDrift > 0.3) failureReason = 'SEMANTIC_DRIFT';
          if (validation.visualRegression) failureReason = 'VISUAL_REGRESSION';

          const correctionDirective = this.ice.generateCorrectionDirective(failureReason, {
            density: this.ice.getDTR().brand_dna.geometry.visual_density
          });

          console.log(`[${this.traceId}] 📝 Correction Directive:\n${correctionDirective}`);

          // 🔧 ACTUALLY APPLY THE CORRECTIONS TO ICE STATE
          const dtr = this.ice.getDTR();
          const personality = this.ice.getPersonality();

          // SEMANTIC CORRECTIONS: Modify personality to match correction
          if (failureReason === 'SEMANTIC_DRIFT') {
            if (correctionDirective.includes('speed') || correctionDirective.includes('fast')) {
              // Force speed-focused personality for food delivery
              this.ice.updatePersonality({
                ...personality,
                tone: 'fast',
                voice: 'urgent',
                keyTerms: ['food', 'delivery', 'restaurant', 'order', 'fresh', 'fast', 'hot'],
                avoidTerms: ['luxury', 'premium', 'technical', 'api', 'exclusive', 'elegant', 'sophisticated']
              });
              console.log(`[${this.traceId}] 🎯 Applied semantic correction: Forced speed-focused personality`);
            } else if (correctionDirective.includes('luxury') || correctionDirective.includes('premium')) {
              // Force luxury personality
              this.ice.updatePersonality({
                ...personality,
                tone: 'premium',
                voice: 'confident',
                keyTerms: ['premium', 'exclusive', 'credit', 'rewards', 'financial'],
                avoidTerms: ['cheap', 'budget', 'fast food', 'delivery']
              });
              console.log(`[${this.traceId}] 🎯 Applied semantic correction: Forced premium personality`);
            }
          }

          // VISUAL CORRECTIONS: Ensure DTR colors are used
          if (failureReason === 'VISUAL_REGRESSION') {
            // Force re-application of DTR colors, mapped to GCM structure
            this.gcm.visual_dna = {
              primary: dtr.brand_dna.palette.accent,
              accent: dtr.brand_dna.palette.surface_elevated,
              logo: '⭐'
            };
            console.log(`[${this.traceId}] 🎨 Applied visual correction: Forced DTR colors`);
          }

          // Regenerate content with corrected personality
          await this.runNexusBrain();

          this.gcm.retry_count++;
          console.log(`[${this.traceId}] ✅ Repair complete - regenerated content with corrections`);
        });

        // 🔄 RECURSIVE RETRY: Run the entire pipeline again with corrected state
        console.log(`[${this.traceId}] 🔄 Retrying entire pipeline with corrections applied...`);
        return this.execute(input);
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

  // 📊 SEMANTIC DRIFT CALCULATION - Enhanced coherence and gibberish detection
  private calculateSemanticDrift(): number {
    const content = this.gcm.html_manifest.toLowerCase();
    let driftScore = 0;

    // Read from ICE
    const dtr = this.ice.getDTR();
    const personality = this.ice.getPersonality();

    // Check 1: Gibberish and nonsense detection
    const headlineMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (headlineMatch) {
      const headline = headlineMatch[1].toLowerCase();

      // Check for obvious gibberish patterns (but be less aggressive)
      const gibberishPatterns = [
        /^[a-z]{1,2}(\s+[a-z]{1,2})+\b/, // Single letters only
        /\b[a-z]{15,}\b/, // Extremely long words (likely OCR errors)
        /[0-9]{8,}/, // Very long number sequences (likely IDs)
        /\b[a-z]*\d{4,}[a-z]*\b/i, // Numbers in middle of words
        /\b\d+\s+\d+\s+\d+\b/ // Sequences of numbers (likely OCR fragments)
      ];

      const hasGibberish = gibberishPatterns.some(pattern => pattern.test(headline));
      if (hasGibberish) {
        driftScore += 0.6; // Penalty for gibberish but less aggressive
        console.error(`[${this.traceId}] 🚨 GIBBERISH DETECTED in headline: "${headlineMatch[1]}"`);
      }

      // Check for all caps (likely OCR shouting) but allow normal capitalization
      if (headline === headline.toUpperCase() && headline.length > 20 && !headline.includes('FAST')) {
        driftScore += 0.2;
      }

      // Check for excessive whitespace or line breaks
      if (headline.includes('\n') || headline.includes('\r') || /^\s*$/.test(headline)) {
        driftScore += 0.4;
        console.warn(`[${this.traceId}] ⚠️ FORMATTING ISSUE in headline: contains line breaks or excessive whitespace`);
      }

      // Check for all caps (likely OCR shouting)
      if (headline === headline.toUpperCase() && headline.length > 10) {
        driftScore += 0.3;
      }
    }

    // Check 2: Semantic coherence (does the headline make sense?)
    if (headlineMatch) {
      const headline = headlineMatch[1];
      const words = headline.split(/\s+/).filter(word => word.length > 2);

      // Check if headline contains recognizable business terms
      const businessTerms = [
        'credit', 'payment', 'card', 'bank', 'loan', 'reward', 'premium', 'exclusive',
        'food', 'delivery', 'restaurant', 'order', 'fresh', 'fast', 'ride', 'driver',
        'software', 'app', 'platform', 'business', 'shop', 'product', 'service'
      ];

      const businessWords = words.filter(word =>
        businessTerms.some(term => word.toLowerCase().includes(term))
      ).length;

      const coherenceRatio = words.length > 0 ? businessWords / words.length : 0;
      if (coherenceRatio < 0.3) {
        driftScore += 0.4; // Headline doesn't make business sense
      }
    }

    // Check 3: Core keyword alignment (DTR semantic anchors)
    if (dtr.semantic_anchors.core_keywords.length > 0) {
      const keywordMatches = dtr.semantic_anchors.core_keywords.filter(keyword =>
        content.includes(keyword.toLowerCase())
      ).length;
      const expectedMatches = Math.min(dtr.semantic_anchors.core_keywords.length, 3);
      const keywordScore = keywordMatches / expectedMatches;
      if (keywordScore < 0.5) driftScore += 0.3;
    }

    // Check 4: Avoid terms alignment
    const avoidTermMatches = personality.avoidTerms.filter(term =>
      content.includes(term.toLowerCase())
    ).length;
    driftScore += Math.min(avoidTermMatches * 0.15, 0.3);

    // Check 5: Tone vector alignment
    const toneVector = dtr.semantic_anchors.tone_vector;
    if (toneVector.speed > 0.6 && !content.includes('fast') && !content.includes('quick')) {
      driftScore += 0.15;
    }
    if (toneVector.luxury > 0.6 && (content.includes('cheap') || content.includes('budget'))) {
      driftScore += 0.25;
    }
    if (toneVector.utility > 0.6 && !content.includes('reliable') && !content.includes('trusted')) {
      driftScore += 0.1;
    }

    // Check 6: CTA alignment
    const expectedPrimaryCTA = dtr.semantic_anchors.primary_cta.toLowerCase();
    const expectedSecondaryCTA = dtr.semantic_anchors.secondary_cta.toLowerCase();
    if (!content.includes(expectedPrimaryCTA)) driftScore += 0.1;
    if (!content.includes(expectedSecondaryCTA)) driftScore += 0.05;

    // Update ICE validation state
    this.ice.updateValidation({ semanticDrift: driftScore });

    console.log(`[${this.traceId}] 📊 Semantic drift score: ${driftScore.toFixed(3)}`);
    return Math.min(driftScore, 1);
  }

  // 🔍 CORE KEYWORD EXTRACTION - From OCR content
  private extractCoreKeywords(ocrContent: string, industry: string): string[] {
    const words = ocrContent.toLowerCase().split(/\s+/);
    const industryKeywords: Record<string, string[]> = {
      'fintech': ['credit', 'card', 'payment', 'bank', 'loan', 'reward'],
      'food_delivery': ['food', 'delivery', 'restaurant', 'order', 'meal'],
      'transportation': ['ride', 'driver', 'car', 'travel'],
      'saas': ['software', 'app', 'platform', 'business', 'cloud'],
      'ecommerce': ['shop', 'product', 'buy', 'store', 'price']
    };

    const relevantWords = industryKeywords[industry] || [];
    return words.filter(word => relevantWords.some(kw => word.includes(kw))).slice(0, 5);
  }

  // 🎯 TONE VECTOR CALCULATION
  private calculateToneVector(ocrContent: string, industry: string): { speed: number; luxury: number; utility: number } {
    const content = ocrContent.toLowerCase();

    // Speed indicators
    const speedWords = ['fast', 'quick', 'instant', 'rapid', 'speed', 'now', 'immediate'];
    let speedScore = speedWords.reduce((score, word) =>
      score + (content.includes(word) ? 0.2 : 0), 0);

    // Luxury indicators
    const luxuryWords = ['premium', 'luxury', 'exclusive', 'elite', 'sophisticated', 'refined'];
    let luxuryScore = luxuryWords.reduce((score, word) =>
      score + (content.includes(word) ? 0.2 : 0), 0);

    // Utility indicators
    const utilityWords = ['reliable', 'trusted', 'easy', 'simple', 'efficient', 'practical'];
    let utilityScore = utilityWords.reduce((score, word) =>
      score + (content.includes(word) ? 0.2 : 0), 0);

    // Industry bias
    if (industry === 'food_delivery') speedScore += 0.3;
    if (industry === 'fintech') luxuryScore += 0.2;
    if (industry === 'saas') utilityScore += 0.2;

    // Normalize
    const total = speedScore + luxuryScore + utilityScore || 1;
    return {
      speed: Math.min(speedScore / total, 1),
      luxury: Math.min(luxuryScore / total, 1),
      utility: Math.min(utilityScore / total, 1)
    };
  }

  // 🎬 CTA GENERATION FROM TONE
  private getPrimaryCTAFromTone(toneVector: { speed: number; luxury: number; utility: number }): string {
    if (toneVector.speed > 0.5) return 'Order Now';
    if (toneVector.luxury > 0.5) return 'Apply Now';
    if (toneVector.utility > 0.5) return 'Get Started';
    return 'Learn More';
  }

  private getSecondaryCTAFromTone(toneVector: { speed: number; luxury: number; utility: number }): string {
    if (toneVector.speed > 0.5) return 'Browse Menu';
    if (toneVector.luxury > 0.5) return 'Check Eligibility';
    if (toneVector.utility > 0.5) return 'View Features';
    return 'Contact Us';
  }

  // 🎭 VISUAL ATMOSPHERE EXTRACTION - For Visual Regression Check
  private extractVisualAtmosphere(visionResult: any): VisualAtmosphere {
    const colors = visionResult?.colors || [];
    let darkPixelRatio = 0.2;
    let luminanceScore = 0.7;

    // Calculate dark pixel ratio from extracted colors
    if (colors.length > 0) {
      for (const color of colors) {
        const hex = color.replace('#', '');
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          luminanceScore = Math.min(luminanceScore, luminance);
        }
      }
      // If average luminance is low, dark pixel ratio is high
      darkPixelRatio = luminanceScore < 0.5 ? 0.7 : 0.2;
    }

    // Override from vision luminance if provided
    if (visionResult?.luminance) {
      if (visionResult.luminance === 'low') {
        darkPixelRatio = 0.8;
        luminanceScore = 0.2;
      } else if (visionResult.luminance === 'high') {
        darkPixelRatio = 0.1;
        luminanceScore = 0.9;
      }
    }

    // Determine UI mood and density
    let uiMood: VisualAtmosphere['uiMood'] = luminanceScore < 0.5 ? 'dark' : 'light';
    let uiDensity: VisualAtmosphere['uiDensity'] = 'utility';

    // Check for neon/expensive colors (high saturation + high brightness = luxury)
    if (colors.length >= 2) {
      const hex1 = colors[0].replace('#', '');
      if (hex1.length === 6) {
        const r = parseInt(hex1.slice(0, 2), 16);
        const g = parseInt(hex1.slice(2, 4), 16);
        const saturation = Math.max(r, g) > 200 && Math.min(r, g) < 100 ? 'neon' : uiMood;
        if (saturation === 'neon') uiMood = 'neon';
      }
    }

    return {
      uiMood,
      uiDensity,
      luminanceScore,
      darkPixelRatio
    };
  }

  // 🛡️ COLOR CONTRAST VALIDATION - WCAG 2.1 AA Compliance
  private validateAndFixColorContrast(palette: any): any {
    // Calculate relative luminance for each color
    const getLuminance = (hex: string): number => {
      const rgb = hex.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0];
      const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    // Calculate contrast ratio
    const getContrastRatio = (lum1: number, lum2: number): number => {
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const bgLum = getLuminance(palette.bg_primary);
    const textLum = getLuminance(palette.text_primary);
    const contrastRatio = getContrastRatio(bgLum, textLum);

    // WCAG AA requires 4.5:1 for normal text
    if (contrastRatio < 4.5) {
      console.warn(`[${this.traceId}] ⚠️ Poor contrast detected (${contrastRatio.toFixed(2)}:1), fixing colors`);

      // If background is dark, make text light; if background is light, make text dark
      if (bgLum < 0.5) {
        // Dark background - make text white/light
        palette.text_primary = '#FFFFFF';
      } else {
        // Light background - make text black/dark
        palette.text_primary = '#000000';
      }

      console.log(`[${this.traceId}] ✅ Fixed contrast: bg=${palette.bg_primary}, text=${palette.text_primary}`);
    }

    return palette;
  }

  // 🎭 BRAND PERSONALITY EXTRACTOR - Maps brands to personality vectors
  private extractBrandPersonality(industry: string, targetUrl: string, ocrContent: string): BrandPersonality {
    const urlLower = targetUrl.toLowerCase();
    const ocrLower = ocrContent.toLowerCase();

    // Brand-specific personality mapping
    const brandPersonalities: Record<string, BrandPersonality> = {
      // Fintech brands
      'cred': {
        tone: 'premium',
        voice: 'confident',
        primaryCta: 'Apply Now',
        secondaryCta: 'Check Eligibility',
        keyTerms: ['credit', 'rewards', 'exclusive', 'premium', 'eligibility'],
        avoidTerms: ['cheap', 'budget', 'fast food', 'delivery']
      },
      'stripe': {
        tone: 'technical',
        voice: 'formal',
        primaryCta: 'Start Building',
        secondaryCta: 'View Docs',
        keyTerms: ['api', 'integration', 'developer', 'payment', 'infrastructure'],
        avoidTerms: ['easy', 'simple', 'consumer', 'buy now']
      },
      'paytm': {
        tone: 'reliable',
        voice: 'helpful',
        primaryCta: 'Get Started',
        secondaryCta: 'Explore Services',
        keyTerms: ['secure', 'trusted', 'services', 'digital', 'payments'],
        avoidTerms: ['luxury', 'premium', 'technical']
      },

      // Food delivery brands
      'doordash': {
        tone: 'fast',
        voice: 'urgent',
        primaryCta: 'Order Now',
        secondaryCta: 'Browse Menu',
        keyTerms: ['delivery', 'fresh', 'hot', 'fast', 'restaurant', 'food'],
        avoidTerms: ['luxury', 'premium', 'technical', 'api']
      },
      'ubereats': {
        tone: 'reliable',
        voice: 'casual',
        primaryCta: 'Order Food',
        secondaryCta: 'Find Restaurants',
        keyTerms: ['food', 'delivery', 'restaurant', 'local', 'fresh'],
        avoidTerms: ['luxury', 'technical', 'api']
      },

      // Default personalities by industry
      'fintech_default': {
        tone: 'technical',
        voice: 'formal',
        primaryCta: 'Get Started',
        secondaryCta: 'Learn More',
        keyTerms: ['secure', 'payment', 'financial', 'trusted'],
        avoidTerms: ['food', 'delivery', 'restaurant']
      },
      'food_delivery_default': {
        tone: 'fast',
        voice: 'casual',
        primaryCta: 'Order Now',
        secondaryCta: 'Browse Menu',
        keyTerms: ['food', 'delivery', 'restaurant', 'fresh'],
        avoidTerms: ['api', 'technical', 'integration']
      }
    };

    // Try exact brand match first
    for (const [brand, personality] of Object.entries(brandPersonalities)) {
      if (brand !== 'fintech_default' && brand !== 'food_delivery_default' && urlLower.includes(brand)) {
        console.log(`[${this.traceId}] 🎭 Found exact brand match: ${brand}`);
        return personality;
      }
    }

    // Fall back to industry default
    const industryKey = `${industry}_default`;
    const defaultPersonality = brandPersonalities[industryKey] || brandPersonalities['fintech_default'];

    console.log(`[${this.traceId}] 🎭 Using industry default personality: ${industryKey}`);
    return defaultPersonality;
  }

  // 🔍 OCR QUALITY VALIDATION GATE - Prevents content poisoning
  private validateOCRContent(ocrText: string, industry: string): { isValid: boolean; cleanedText: string; confidence: number } {
    if (!ocrText || ocrText.trim().length < 3) {
      return { isValid: false, cleanedText: '', confidence: 0 };
    }

    const text = ocrText.toLowerCase().trim();

    // Dictionary check - percentage of recognizable words
    const dictionaryWords = [
      'credit', 'card', 'payment', 'bank', 'money', 'account', 'loan', 'reward', 'premium', 'exclusive',
      'food', 'delivery', 'restaurant', 'order', 'fresh', 'fast', 'pizza', 'burger', 'meal',
      'ride', 'driver', 'taxi', 'car', 'travel', 'hotel', 'flight', 'vacation',
      'software', 'app', 'platform', 'solution', 'business', 'enterprise', 'team', 'cloud',
      'shop', 'store', 'product', 'buy', 'cart', 'sale', 'price', 'quality'
    ];

    const words = text.split(/\s+/).filter(word => word.length > 2);
    const recognizedWords = words.filter(word => dictionaryWords.some(dict => word.includes(dict)));
    const dictionaryDensity = words.length > 0 ? recognizedWords.length / words.length : 0;

    // Gibberish check - look for nonsensical patterns
    const gibberishPatterns = [
      /^[a-z]{1,2}(\s+[a-z]{1,2})+$/, // Single letters
      /\b[a-z]{8,}\b/, // Very long words (likely OCR errors)
      /[0-9]{6,}/, // Long number sequences (likely IDs)
      /\b[a-z]+\d+[a-z]*\b/i, // Words with numbers in middle
      /\b[a-z]*\d{2,}[a-z]*\b/i // Short alphanumeric combos
    ];

    const hasGibberish = gibberishPatterns.some(pattern => pattern.test(text));
    const hasAllCaps = text === text.toUpperCase() && text.length > 10; // Likely OCR shouting

    // Industry relevance check
    const industryKeywords: Record<string, string[]> = {
      'fintech': ['credit', 'card', 'payment', 'bank', 'loan', 'reward'],
      'food_delivery': ['food', 'delivery', 'restaurant', 'order', 'meal'],
      'transportation': ['ride', 'driver', 'car', 'travel'],
      'saas': ['software', 'app', 'platform', 'business', 'cloud'],
      'ecommerce': ['shop', 'product', 'buy', 'store', 'price']
    };

    const industryWords = industryKeywords[industry] || [];
    const industryMatches = words.filter(word => industryWords.some(kw => word.includes(kw))).length;
    const industryRelevance = words.length > 0 ? industryMatches / words.length : 0;

    // Overall confidence score
    let confidence = 0;
    if (dictionaryDensity > 0.6) confidence += 0.4; // Good dictionary coverage
    if (industryRelevance > 0.3) confidence += 0.3; // Relevant to industry
    if (!hasGibberish) confidence += 0.2; // No gibberish patterns
    if (!hasAllCaps) confidence += 0.1; // Not shouting

    const isValid = confidence > 0.5 && !hasGibberish;

    // Clean the text if needed
    let cleanedText = ocrText;
    if (!isValid) {
      // Generate industry-appropriate fallback
      const fallbacks: Record<string, string> = {
        'fintech': 'Premium financial services for modern businesses',
        'food_delivery': 'Fresh food delivered fast to your door',
        'transportation': 'Reliable transportation solutions',
        'saas': 'Powerful software for growing businesses',
        'ecommerce': 'Quality products at great prices'
      };
      cleanedText = fallbacks[industry] || 'Premium services for your needs';
    }

    return { isValid, cleanedText, confidence };
  }

  // 🎨 DESIGN TOKEN REGISTRY EXTRACTOR - Mathematical design signature with contrast validation
  private extractDesignTokenRegistry(visionResult: any, industry: string): DesignTokenRegistry {
    const colors = visionResult.colors || [];
    const identity = this.ice.getIdentity();
    const ocrContent = identity.ocrContent;

    // Extract and validate color palette with contrast checking
    let palette = {
      bg_primary: colors[0] || '#000000',
      text_primary: colors[1] || '#FFFFFF',
      accent: colors[2] || '#FF3008',
      surface_elevated: colors[3] || '#1A1A1A'
    };

    // 🛡️ CONTRAST VALIDATION - Ensure accessibility compliance
    palette = this.validateAndFixColorContrast(palette);

    // Calculate visual density from content and colors
    const hasRichContent = ocrContent.length > 50;
    const hasMultipleColors = colors.length >= 3;
    const visualDensity = (hasRichContent ? 0.4 : 0) + (hasMultipleColors ? 0.3 : 0) +
                         (visionResult.density === 'compact' ? 0.3 : 0);

    // Determine typography from visual style
    const visualStyle = visionResult.visual_style || 'modern';
    let typography: {
      scale_ratio: number;
      base_weight: string;
      heading_weight: string;
      font_family_cat: 'geometric-sans' | 'humanist-serif' | 'mono-technical';
    } = {
      scale_ratio: 1.25,
      base_weight: '400',
      heading_weight: '900',
      font_family_cat: 'geometric-sans'
    };

    if (visualStyle === 'luxury' || visualStyle === 'classic') {
      typography = {
        ...typography,
        font_family_cat: 'humanist-serif',
        heading_weight: '700'
      };
    } else if (visualStyle === 'technical') {
      typography = {
        ...typography,
        font_family_cat: 'mono-technical',
        base_weight: '300'
      };
    }

    // Extract semantic anchors from OCR
    const coreKeywords = this.extractCoreKeywords(ocrContent, industry);
    const toneVector = this.calculateToneVector(ocrContent, industry);

    // Determine layout type based on visual density
    let layoutType: 'zen-hero' | 'split-hero' | 'bento-grid' = 'split-hero';
    let sectionCount = 4;

    if (visualDensity < 0.3) {
      layoutType = 'zen-hero';
      sectionCount = 2;
    } else if (visualDensity > 0.7) {
      layoutType = 'bento-grid';
      sectionCount = 6;
    }

    // Determine content density
    const contentDensity = visualDensity < 0.3 ? 'minimal' : visualDensity > 0.7 ? 'rich' : 'standard';

    return {
      brand_dna: {
        palette,
        typography,
        geometry: {
          radius: visionResult.corner_radius ? `${visionResult.corner_radius}px` : '12px',
          container_max_width: '1280px',
          visual_density: Math.min(visualDensity, 1)
        }
      },
      semantic_anchors: {
        core_keywords: coreKeywords,
        tone_vector: toneVector,
        primary_cta: this.getPrimaryCTAFromTone(toneVector),
        secondary_cta: this.getSecondaryCTAFromTone(toneVector)
      },
      composition_primitives: {
        layout_type: layoutType,
        section_count: sectionCount,
        content_density: contentDensity
      }
    };
  }

  // 🧠 NEXUS BRAIN - Reads from ICE, writes unified content blueprint
  private async runNexusBrain(): Promise<void> {
    console.log(`[${this.traceId}] 🧠 Running Nexus Brain - Unified Strategy Engine`);

    // 📖 READ FROM ICE - All context comes from centralized manifest
    const identity = this.ice.getIdentity();
    const visual = this.ice.getVisual();
    const personality = this.ice.getPersonality();

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: COMPOSITION LOGIC - Dynamic Layout Based on Personality
    // ═══════════════════════════════════════════════════════════

    // Atomic Layout Construction based on personality + content weight
    const layoutComposition = this.buildAtomicLayout(personality, identity.proofPoints, identity.ocrContent);

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: COPY ARCHITECTURE - Validated OCR + Tone Vector → Headlines
    // ═══════════════════════════════════════════════════════════

    // Use validated OCR content (already cleaned by quality gate)
    const validatedOcrContent = identity.ocrContent;
    const copyTokens = await this.generateContextualCopy(personality, validatedOcrContent, identity.proofPoints);

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: DESIGN TOKEN INTEGRATION - Typography + Colors
    // ═══════════════════════════════════════════════════════════

    const designTokens = this.generateDesignTokens(personality, visual.atmosphere);

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: ICE CONTENT BLUEPRINT - Unified Manifest Update
    // ═══════════════════════════════════════════════════════════

    this.ice.updateContent({
      layout: [personality.tone === 'minimal' ? 'minimal-focus' : 'standard'],
      copy: copyTokens,
      sections: layoutComposition
    });

    // 🔄 BACKWARD COMPATIBILITY - Update GCM for existing agents
    this.gcm.page_blueprint = {
      layout: personality.tone === 'minimal' ? 'minimal-focus' : 'standard',
      sections: layoutComposition,
      flow: personality.voice === 'urgent' ? 'conversion-focused' : 'trust-building',
      category: identity.industry
    };

    this.gcm.copy_framework = personality.tone === 'technical' ? 'PAS' : 'AIDA';
    this.gcm.cta_strategy = {
      primary: personality.primaryCta,
      secondary: personality.secondaryCta
    };

    this.gcm.design_tokens = {
      ...copyTokens,
      ...designTokens,
      layout: this.gcm.page_blueprint.layout
    };

    console.log(`[${this.traceId}] ✅ Nexus Brain Complete - Layout: ${layoutComposition.length} sections, Tone: ${personality.tone}`);
  }

  // 🏗️ ATOMIC LAYOUT CONSTRUCTION - Personality-driven composition
  private buildAtomicLayout(personality: BrandPersonality, proofPoints: string[], ocrContent: string): string[] {
    const sections: string[] = ['hero']; // Hero is always first

    // Content weight assessment
    const hasProofPoints = proofPoints.length > 0;
    const hasRichContent = ocrContent.length > 50;
    const contentWeight = hasProofPoints && hasRichContent ? 'heavy' : 'light';

    // Personality-driven section selection
    if (personality.tone === 'minimal') {
      // Stripe-style: Minimal, focused
      if (contentWeight === 'heavy') sections.push('features');
      sections.push('cta');
    } else if (personality.tone === 'technical') {
      // Developer-focused: Docs, integrations
      sections.push('features');
      if (hasProofPoints) sections.push('integrations');
      sections.push('docs', 'cta');
    } else if (personality.tone === 'fast') {
      // DoorDash-style: Speed-focused
      sections.push('how-it-works');
      if (hasProofPoints) sections.push('stats');
      sections.push('app-download', 'cta');
    } else if (personality.tone === 'premium') {
      // CRED-style: Trust-focused
      sections.push('trust-badges');
      if (hasProofPoints) sections.push('benefits');
      sections.push('testimonials', 'cta');
    } else {
      // Standard layout with conditional sections
      sections.push('features');
      if (hasProofPoints) sections.push('stats', 'benefits');
      if (contentWeight === 'heavy') sections.push('testimonials');
      sections.push('faq', 'cta');
    }

    return sections;
  }

  // ✍️ CONTEXTUAL COPY ARCHITECT - Validated OCR + Tone Vector → Headlines
  private async generateContextualCopy(
    personality: BrandPersonality,
    validatedOcrContent: string,
    proofPoints: string[]
  ): Promise<Record<string, string>> {
    const hasProof = proofPoints.length > 0;
    const proofPoint = proofPoints[0] || '';

    let headline = '';
    let subheadline = '';

    // Primary: Use validated OCR as semantic foundation (no more gibberish)
    if (validatedOcrContent && validatedOcrContent.length > 10 && !validatedOcrContent.includes('Premium financial services')) {
      // OCR passed quality gate - use it as foundation and properly format
      const ocrWords = validatedOcrContent.split(' ').slice(0, 4).join(' ');

      // Properly capitalize and clean the headline
      headline = ocrWords.charAt(0).toUpperCase() + ocrWords.slice(1).toLowerCase();
      // Remove any extra whitespace and ensure it's clean
      headline = headline.trim().replace(/\s+/g, ' ');

      if (personality.tone === 'technical') {
        headline = `Build with ${headline}`;
        subheadline = hasProof ? `Trusted by ${proofPoint} developers` : 'Developer-first solutions';
      } else if (personality.tone === 'premium') {
        // Keep as-is for premium tone
        subheadline = hasProof ? `Join ${proofPoint} satisfied members` : 'Exclusive access to premium services';
      } else if (personality.tone === 'fast') {
        // Keep as-is for fast tone
        subheadline = hasProof ? `${proofPoint} delivered daily` : 'Fast, reliable service';
      } else if (personality.tone === 'reliable') {
        // Keep as-is for reliable tone
        subheadline = hasProof ? `Trusted by ${proofPoint} customers` : 'Reliable solutions you can depend on';
      } else {
        // Keep as-is for other tones
        subheadline = hasProof ? `Join ${proofPoint} happy users` : 'Experience the difference';
      }
    } else {
      // Fallback: Industry + personality-driven headlines (when OCR failed quality gate)
      console.log(`[${this.traceId}] 📝 Using personality-driven fallback copy`);

      if (personality.tone === 'technical') {
        headline = 'Powerful APIs for Modern Businesses';
        subheadline = hasProof ? `Trusted by ${proofPoint} companies` : 'Build faster with our platform';
      } else if (personality.tone === 'premium') {
        headline = 'Financial Freedom Starts Here';
        subheadline = hasProof ? `Join ${proofPoint} satisfied members` : 'Exclusive access to premium services';
      } else if (personality.tone === 'fast') {
        headline = 'Fresh Food, Fast Delivery';
        subheadline = hasProof ? `${proofPoint} meals delivered daily` : 'Hot food at your door in minutes';
      } else if (personality.tone === 'reliable') {
        headline = 'Trusted Solutions for Your Business';
        subheadline = hasProof ? `Chosen by ${proofPoint} companies` : 'Reliable service you can depend on';
      } else {
        headline = 'Welcome to Excellence';
        subheadline = hasProof ? `Join ${proofPoint} satisfied customers` : 'Experience something extraordinary';
      }
    }

    // Final validation - ensure headline makes sense and is properly formatted
    if (headline.length < 5 || headline.includes('undefined') || headline.includes('null') ||
        /^\s*$/.test(headline) || headline.includes('\n') || headline.includes('\r')) {
      // Fallback based on personality
      if (personality.tone === 'technical') {
        headline = 'Powerful APIs for Modern Businesses';
      } else if (personality.tone === 'premium') {
        headline = 'Premium Services for Your Needs';
      } else if (personality.tone === 'fast') {
        headline = 'Fast, Reliable Service';
      } else {
        headline = 'Premium Services for Your Needs';
      }
      subheadline = hasProof ? `Join ${proofPoint} satisfied customers` : 'Experience the difference';
    }

    // Final cleanup - ensure no extra whitespace or special characters
    headline = headline.trim().replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    subheadline = subheadline.trim().replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ');

    return {
      headline,
      subheadline,
      personalityTone: personality.tone,
      personalityVoice: personality.voice,
      ocrUsed: (validatedOcrContent && validatedOcrContent.length > 10) ? 'true' : 'false'
    };
  }

  // 🎨 DESIGN TOKEN INTEGRATION - Typography + Colors + Personality
  private generateDesignTokens(personality: BrandPersonality, atmosphere: VisualAtmosphere): Record<string, string> {
    // Typography mapping based on personality
    const typographyMap: Record<string, { fontFamily: string; fontWeight: string; letterSpacing: string }> = {
      'technical': { fontFamily: 'JetBrains Mono', fontWeight: '400', letterSpacing: '-0.01em' },
      'premium': { fontFamily: 'Inter', fontWeight: '600', letterSpacing: '0' },
      'minimal': { fontFamily: 'Inter', fontWeight: '300', letterSpacing: '-0.02em' },
      'fast': { fontFamily: 'Inter', fontWeight: '500', letterSpacing: '0' },
      'sleek': { fontFamily: 'Inter', fontWeight: '400', letterSpacing: '-0.01em' }
    };

    const typography = typographyMap[personality.tone] || typographyMap['minimal'];

    return {
      primary_color: this.gcm.visual_dna.primary,
      accent_color: this.gcm.visual_dna.accent,
      fontFamily: typography.fontFamily,
      fontWeight: typography.fontWeight,
      letterSpacing: typography.letterSpacing,
      uiMood: atmosphere.uiMood,
      uiDensity: atmosphere.uiDensity
    };
  }

  // 🎯 ZERO-KNOWLEDGE INDUSTRY DETECTION - From vision or fallback
  private detectIndustryFromVision(visionResult: any, targetUrl: string): string {
    const urlLower = targetUrl.toLowerCase();
    
    // First try to derive from vision analysis text content if available
    const textContent = (visionResult?.text_content || '').toLowerCase();
    
    // Define industry keywords (NOT a lookup table - just semantic classification)
    const industryKeywords: Record<string, string[]> = {
      'fintech': ['credit', 'card', 'payment', 'loan', 'invest', 'bank', 'money', 'financial', 'crypto'],
      'food_delivery': ['food', 'restaurant', 'pizza', 'delivery', 'eat', 'hungry', 'meal', 'order', 'cook'],
      'transportation': ['ride', 'driver', 'taxi', 'car', 'trip', 'travel', 'airport', 'luxury'],
      'saas': ['software', 'app', 'cloud', 'enterprise', 'team', 'business', 'analytics', 'dashboard'],
      'ecommerce': ['shop', 'store', 'product', 'buy', 'cart', ' discount', 'sale'],
      'healthcare': ['health', 'doctor', 'medical', 'patient', 'care', 'clinic', 'hospital'],
      'travel': ['hotel', 'booking', 'flight', 'vacation', 'resort', 'tour']
    };
    
    // Score each industry based on text content
    let bestIndustry = 'generic';
    let bestScore = 0;
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      const score = keywords.filter(kw => textContent.includes(kw) || urlLower.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestIndustry = industry;
      }
    }
    
    // Fallback: derive from URL domain if no text content
    if (bestScore === 0) {
      if (urlLower.includes('cred') || urlLower.includes('finance') || urlLower.includes('stripe') || urlLower.includes('payment')) {
        bestIndustry = 'fintech';
      } else if (urlLower.includes('doordash') || urlLower.includes('ubereats') || urlLower.includes('grubhub')) {
        bestIndustry = 'food_delivery';
      } else if (urlLower.includes('uber') || urlLower.includes('lyft') || urlLower.includes('taxi')) {
        bestIndustry = 'transportation';
      } else if (urlLower.includes('shop') || urlLower.includes('store') || urlLower.includes('amazon')) {
        bestIndustry = 'ecommerce';
      }
    }
    
    console.log(`[${this.traceId}] 🎯 Detected industry: ${bestIndustry} (score: ${bestScore})`);
    return bestIndustry;
  }

  // 🎨 Industry-based color defaults
  private getIndustryColors(industry: string): { primary: string; accent: string; logo: string } {
    const industryColors: Record<string, { primary: string; accent: string; logo: string }> = {
      'fintech': { primary: '#1A1A2E', accent: '#E94560', logo: '💳' },
      'food_delivery': { primary: '#FF6B35', accent: '#F7931E', logo: '🍔' },
      'saas': { primary: '#2563EB', accent: '#7C3AED', logo: '💻' },
      'ecommerce': { primary: '#059669', accent: '#10B981', logo: '🛒' },
      'travel': { primary: '#0EA5E9', accent: '#6366F1', logo: '✈️' },
      'healthcare': { primary: '#10B981', accent: '#059669', logo: '🏥' },
      'generic': { primary: '#1E293B', accent: '#3B82F6', logo: '⭐' }
    };
    return industryColors[industry] || industryColors['generic'];
  }

  // 📋 Industry-based section defaults
  private getIndustrySections(industry: string): string[] {
    const industrySections: Record<string, string[]> = {
      'fintech': ['hero', 'trust-badges', 'features', 'security', 'testimonials', 'cta'],
      'food_delivery': ['hero', 'benefits', 'restaurants', 'reviews', 'app-download', 'cta'],
      'saas': ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta'],
      'ecommerce': ['hero', 'products', 'benefits', 'reviews', ' Guarantees', 'cta'],
      'travel': ['hero', 'destinations', 'deals', 'testimonials', 'booking', 'cta'],
      'healthcare': ['hero', 'services', 'doctors', 'testimonials', 'insurance', 'cta'],
      'generic': ['hero', 'features', 'benefits', 'testimonials', 'faq', 'cta']
    };
    return industrySections[industry] || industrySections['generic'];
  }
}