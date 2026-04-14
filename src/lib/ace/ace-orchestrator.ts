// ACE NERVOUS SYSTEM - ELASTIC WEIGHTING EDITION
// Replaces rigid intent locking with probability vectors
// Adds Challenger Agents for self-correction

import { inferCategory, getCategoryColors } from '../skills/skill-category-inference';
import { generateProfessionalHTMLv2 } from '../skills/skill-v2-renderer';
import {
  createGCM,
  GlobalContextManifest,
  getPrimaryIntentLabel,
  getIntentWeights,
  addIntentChallenge,
  shouldTriggerDeepResearch,
  IntentWeight
} from './ace-gcm';

export interface GCMState {
  // 🎯 ELASTIC WEIGHTING: Probability vector
  intent_weights: IntentWeight[];
  confidence_score: number;
  
  // 🎯 INTENT CHALLENGE LOG (for self-correction)
  intent_challenges: IntentChallenge[];
  
  // Visual DNA
  visualDNA: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    logoEmoji: string;
    contrastRatio: number;
  };
  
  // 🎯 PROOF POINTS with relevance tags
  proofPoints: ProofPointRelevance[];
  
  // Framework
  copyFramework: 'PAS' | 'AIDA' | 'BAB' | 'FEATURE_BENEFIT';
  uiPhysics: 'STANDARD' | 'GLASSMORPHISM' | 'EDITORIAL' | 'MINIMAL';
  
  // Gate Status
  gatesPass: {
    researchFamily: boolean;
    creationFamily: boolean;
    governanceFamily: boolean;
    challengerPassed: boolean;
  };
  
  // Self-Correction State
  correction: {
    retryCount: number;
    maxRetries: number;
    lastDriftReason?: string;
  };
  
  // Trace
  agentTrace: AgentRun[];
  errorLogs: string[];
}

export interface ProofPointRelevance {
  value: string;
  relevance: { B2B?: number; B2C?: number };
}

export interface IntentChallenge {
  agent: string;
  timestamp: number;
  concern: string;
  recommendation: string;
  resolved: boolean;
}

export interface AgentRun {
  agent: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'CHALLENGE';
  duration: number;
  findings?: any;
  error?: string;
}

// 🎯 ELASTIC WEIGHTING: Get primary from probability vector
function getPrimaryFromWeights(weights: IntentWeight[]): string {
  const sorted = [...weights].sort((a, b) => b.weight - a.weight);
  return sorted[0].label;
}

// 🎯 ELASTIC WEIGHTING: Calculate weights from content
function calculateIntentWeights(content: string, targetUrl: string): IntentWeight[] {
  const text = (content + ' ' + targetUrl).toLowerCase();
  
  // B2B terms with weights
  const b2bTerms = [
    { term: 'merchant', weight: 0.9 },
    { term: 'partner', weight: 0.85 },
    { term: 'business', weight: 0.7 },
    { term: 'restaurant owner', weight: 0.95 },
    { term: 'enterprise', weight: 0.8 },
    { term: 'grow revenue', weight: 0.85 },
    { term: 'increase sales', weight: 0.8 },
    { term: 'b2b', weight: 0.95 }
  ];
  
  // B2C terms with weights
  const b2cTerms = [
    { term: 'order now', weight: 0.9 },
    { term: 'delivered', weight: 0.7 },
    { term: 'food', weight: 0.6 },
    { term: 'eat', weight: 0.5 },
    { term: 'hungry', weight: 0.7 },
    { term: 'shop', weight: 0.6 },
    { term: 'buy', weight: 0.5 },
    { term: 'consumer', weight: 0.7 }
  ];
  
  let b2bScore = 0;
  let b2bEvidence: string[] = [];
  for (const { term, weight } of b2bTerms) {
    if (text.includes(term)) {
      b2bScore += weight;
      b2bEvidence.push(term);
    }
  }
  
  let b2cScore = 0;
  let b2cEvidence: string[] = [];
  for (const { term, weight } of b2cTerms) {
    if (text.includes(term)) {
      b2cScore += weight;
      b2cEvidence.push(term);
    }
  }
  
  const total = b2bScore + b2cScore + 0.01;
  const b2bProb = b2bScore / total;
  const b2cProb = b2cScore / total;
  
  return [
    { label: 'B2B', weight: Math.min(1, b2bProb), evidence: b2bEvidence.join(', ') || 'none' },
    { label: 'B2C', weight: Math.min(1, b2cProb), evidence: b2cEvidence.join(', ') || 'none' }
  ];
}

// Calculate confidence score
function calculateConfidenceScore(weights: IntentWeight[]): number {
  const primary = Math.max(...weights.map(w => w.weight));
  const secondary = weights
    .filter(w => w.weight !== primary)
    .reduce((max, w) => Math.max(max, w.weight), 0);
  
  if (primary < 0.3) return 0.2;
  if (primary > 0.8 || secondary < 0.1) return 0.95;
  if (primary > 0.6) return 0.8;
  return 0.5;
}

// 🎯 SEMANTIC DRIFT: Calculate drift from intent vector
function calculateSemanticDrift(text: string, intentLabel: string): number {
  const textLower = text.toLowerCase();
  
  const b2bTerms = ['merchant', 'partner', 'business', 'grow', 'revenue', 'enterprise'];
  const b2cTerms = ['order', 'buy', 'shop', 'eat', 'hungry', 'delivered'];
  
  if (intentLabel === 'B2B') {
    const b2cCount = b2cTerms.filter(t => textLower.includes(t)).length;
    return b2cCount * 0.25;
  }
  if (intentLabel === 'B2C') {
    const b2bCount = b2bTerms.filter(t => textLower.includes(t)).length;
    return b2bCount * 0.2;
  }
  return 0;
}

export class ACENexusOrchestrator {
  private gcm: GCMState;
  
  constructor() {
    this.gcm = this.initGCM();
  }
  
  private initGCM(): GCMState {
    return {
      intent_weights: [
        { label: 'B2B', weight: 0.5, evidence: 'init' },
        { label: 'B2C', weight: 0.5, evidence: 'init' }
      ],
      confidence_score: 0.5,
      intent_challenges: [],
      visualDNA: {
        primaryColor: '#1E293B',
        accentColor: '#3B82F6',
        fontFamily: 'Inter',
        logoEmoji: '⭐',
        contrastRatio: 4.5
      },
      proofPoints: [],
      copyFramework: 'FEATURE_BENEFIT',
      uiPhysics: 'STANDARD',
      gatesPass: {
        researchFamily: false,
        creationFamily: false,
        governanceFamily: false,
        challengerPassed: false
      },
      correction: {
        retryCount: 0,
        maxRetries: 3
      },
      agentTrace: [],
      errorLogs: []
    };
  }
  
  // 🎯 CHALLENGER AGENT: Devil's Advocate
  // Challenges the intent if evidence is weak
  private async runDevilsAdvocate(htmlContent: string, intentLabel: string): Promise<IntentChallenge | null> {
    const drift = calculateSemanticDrift(htmlContent, intentLabel);
    const confidence = this.gcm.confidence_score;
    
    // Challenge conditions
    if (drift > 0.4) {
      return {
        agent: 'DevilsAdvocate',
        timestamp: Date.now(),
        concern: `SEMANTIC DRIFT detected: ${drift} (threshold: 0.4)`,
        recommendation: `Lower ${intentLabel} weight from ${this.getWeight(intentLabel)} to allow hybrid messaging`,
        resolved: false
      };
    }
    
    if (confidence < 0.6) {
      return {
        agent: 'DevilsAdvocate',
        timestamp: Date.now(),
        concern: `LOW CONFIDENCE: ${confidence} - ambiguous intent`,
        recommendation: 'Trigger deep research for re-evaluation',
        resolved: false
      };
    }
    
    return null;
  }
  
  private getWeight(label: string): number {
    const w = this.gcm.intent_weights.find(w => w.label === label);
    return w?.weight || 0;
  }
  
  // 🎯 WEIGHT ADJUSTER: Dynamic thresholding
  // Adjusts weights if Challenger found issues
  private adjustWeights(challenge: IntentChallenge): void {
    const currentWeights = this.gcm.intent_weights;
    
    if (challenge.concern.includes('SEMANTIC DRIFT')) {
      // Reduce primary weight to allow hybrid
      const newWeights = currentWeights.map(w => ({
        ...w,
        weight: w.label === 'B2B' ? w.weight * 0.7 : w.weight + 0.3
      }));
      this.gcm.intent_weights = newWeights;
      this.gcm.intent_challenges.push({ ...challenge, resolved: true });
    }
    
    if (challenge.concern.includes('LOW CONFIDENCE')) {
      // Flatten weights - more ambiguous
      const newWeights = currentWeights.map(w => ({
        ...w,
        weight: 0.5
      }));
      this.gcm.intent_weights = newWeights;
      this.gcm.confidence_score = 0.7;
      this.gcm.intent_challenges.push({ ...challenge, resolved: true });
    }
  }
  
  private async generateVisualDNA(targetUrl: string): Promise<void> {
    try {
      const hostname = new URL(targetUrl).hostname.toLowerCase().replace(/^www\./, '');
      
      const brandDNA: Record<string, any> = {
        'doordash': { primary: '#FF3008', accent: '#FF4D4D', emoji: '🍕' },
        'uber': { primary: '#000000', accent: '#00C2C2', emoji: '🚗' },
        'airbnb': { primary: '#FF5A5F', accent: '#FF5A5F', emoji: '🏠' },
        'stripe': { primary: '#635BFF', accent: '#0A2540', emoji: '💳' }
      };
      
      let matchedColor = null;
      for (const [brand, dna] of Object.entries(brandDNA)) {
        if (hostname.includes(brand)) {
          matchedColor = dna;
          break;
        }
      }
      
      this.gcm.visualDNA = {
        primaryColor: matchedColor?.primary || '#1E293B',
        accentColor: matchedColor?.accent || '#3B82F6',
        fontFamily: 'Inter',
        logoEmoji: matchedColor?.emoji || '⭐',
        contrastRatio: 4.5
      };
      
    } catch (e) {
      this.gcm.errorLogs.push(`VisualDNA error: ${e}`);
    }
  }
  
  private extractProofPoints(content: string): void {
    // Match numbers with optional suffixes like k, K, +, etc.
    const numberMatches = content.match(/\d+[\d,]*[kKmMbB]?\+?/g) || [];
    const significantStats = numberMatches.filter((n: string) => {
      // Extract numeric value for filtering
      const cleanNum = n.replace(/,/g, '').replace(/\+/g, '').toLowerCase();
      let numericValue = 0;

      if (cleanNum.includes('k')) {
        numericValue = parseFloat(cleanNum.replace('k', '')) * 1000;
      } else if (cleanNum.includes('m')) {
        numericValue = parseFloat(cleanNum.replace('m', '')) * 1000000;
      } else if (cleanNum.includes('b')) {
        numericValue = parseFloat(cleanNum.replace('b', '')) * 1000000000;
      } else {
        numericValue = parseFloat(cleanNum);
      }

      return numericValue > 100;
    });

    this.gcm.proofPoints = significantStats.map(value => ({
      value,
      relevance: {}  // Will be enriched by agent
    }));
  }
  
  private recordFailure(agent: string, error: string): void {
    this.gcm.errorLogs.push(`[${agent}] FAIL: ${error}`);
    this.gcm.agentTrace.push({
      agent,
      status: 'FAIL',
      duration: 0,
      error
    });
  }
  
  // Main execution with ELASTIC WEIGHTING
  async execute(input: { adInputType: string; adInputValue: string; targetUrl: string }): Promise<{
    success: boolean;
    html?: string;
    gcm: GCMState;
    errors?: string[];
  }> {
    // 🚨 CRITICAL DEBUG: Log input validation
    console.log('🔍 INPUT VALIDATION:');
    console.log('   adInputType:', input.adInputType);
    console.log('   adInputValue present:', !!input.adInputValue);
    console.log('   adInputValue length:', input.adInputValue?.length || 0);
    console.log('   adInputValue preview:', input.adInputValue?.substring(0, 80) || '(empty)');
    console.log('   targetUrl:', input.targetUrl);

    // Deep research loop for low confidence
    let deepResearchAttempts = 0;
    const MAX_DEEP_RESEARCH = 2;

    const attemptGeneration = async (): Promise<{ html: string; intentLabel: string }> => {
      const startTime = Date.now();
      this.gcm = this.initGCM();
      
      try {
        // ═══════════════════════════════════════════════════
        // 🏗️ STAGE 1: RESEARCH FAMILY - ELASTIC WEIGHTING
        // ═══════════════════════════════════════════════════
        
        const t1 = Date.now();
        
        // 🎯 Use probability vector, NOT binary lock
        this.gcm.intent_weights = calculateIntentWeights(input.adInputValue, input.targetUrl);
        this.gcm.confidence_score = calculateConfidenceScore(this.gcm.intent_weights);

        // 🎯 DEBUG: Log intent analysis
        console.log('🎯 INTENT ANALYSIS:');
        console.log('   B2B weight:', this.gcm.intent_weights.find(w => w.label === 'B2B')?.weight);
        console.log('   B2C weight:', this.gcm.intent_weights.find(w => w.label === 'B2C')?.weight);
        console.log('   Confidence:', this.gcm.confidence_score);

        // Intent analysis completed

        const primaryIntent = getPrimaryFromWeights(this.gcm.intent_weights);
        
        // Set persona based on PRIMARY (but aware of secondary)
        if (primaryIntent === 'B2B') {
          this.gcm.copyFramework = 'PAS';
        } else {
          this.gcm.copyFramework = 'AIDA';
        }
        
        // Generate Visual DNA
        await this.generateVisualDNA(input.targetUrl);

        // Extract Proof Points
        this.extractProofPoints(input.adInputValue);

        // Proof points extracted
        // Visual DNA extracted
        
        this.gcm.gatesPass.researchFamily = true;
        this.gcm.agentTrace.push({ agent: 'Research-Family', status: 'PASS', duration: Date.now() - t1 });
        
        // ═══════════════════════════════════════════════════
        // 🧠 STAGE 2: CREATION FAMILY
        // ═══════════════════════════════════════════════════
        
        const t2 = Date.now();
        
        const categoryInfo = inferCategory(input.targetUrl);
        const category = categoryInfo.category;
        
        const lockedColors = {
          primary: this.gcm.visualDNA.primaryColor,
          accent: this.gcm.visualDNA.accentColor,
          light: this.gcm.visualDNA.primaryColor + '10',
          dark: this.gcm.visualDNA.primaryColor
        };
        
        const framework = this.gcm.copyFramework;
        let copy: any = {};
        
        // 🎯 Use weights to generate ADAPTIVE copy
        const b2bWeight = this.getWeight('B2B');
        const b2cWeight = this.getWeight('B2C');
        
        if (framework === 'PAS' || b2bWeight > 0.6) {
          // Hybrid B2B + B2C awareness
          copy = {
            headliner: b2bWeight > 0.6 ? 'Business Growth Partner' : 'Premium Experience',
            headline: 'Grow Your Business with Premium Solutions',
            subheadline: `Join ${this.gcm.proofPoints.length > 0 ? this.gcm.proofPoints[0].value + '+' : 'thousands of'} satisfied customers`,
            primaryCta: 'Get Started',
            secondaryCta: 'Schedule Demo'
          };
        } else {
          copy = {
            headliner: 'Premium Experience',
            headline: 'Experience Premium Quality',
            subheadline: `Join ${this.gcm.proofPoints.length > 0 ? this.gcm.proofPoints[0].value + '+' : 'thousands of'} happy customers`,
            primaryCta: 'Order Now',
            secondaryCta: 'Learn More'
          };
        }
        
        this.gcm.agentTrace.push({ agent: 'Copy-Generator', status: 'PASS', duration: Date.now() - t2 });
        
        // ═══════════════════════════════════════════════════
        // 🎨 STAGE 3: RENDERER
        // ═══════════════════════════════════════════════════
        
        const t3 = Date.now();
        
        // Extract brand name from URL properly
        const urlObj = new URL(input.targetUrl);
        const domain = urlObj.hostname.replace(/^www\./, '');
        const brandName = domain.split('.')[0]; // Get first part before TLD

        const htmlContent = generateProfessionalHTMLv2({
          brandName: brandName.charAt(0).toUpperCase() + brandName.slice(1), // Capitalize
          brandColors: lockedColors,
          copy,
          category
        });
        
        this.gcm.agentTrace.push({ agent: 'Renderer', status: 'PASS', duration: Date.now() - t3 });
        
        // ═══════════════════════════════════════════════════
        // 🛡️ STAGE 4: GOVERNANCE + CHALLENGER AGENTS
        // ═══════════════════════════════════════════════════
        
        const t4 = Date.now();
        const governanceIssues: string[] = [];
        
        // Check: proof points
        for (const proof of this.gcm.proofPoints) {
          if (proof.value.length >= 3 && !htmlContent.includes(proof.value)) {
            governanceIssues.push(`PROOF_POINT_MISSING: "${proof.value}"`);
          }
        }
        
        // Check: brand color
        if (!htmlContent.includes(this.gcm.visualDNA.primaryColor)) {
          governanceIssues.push(`BRAND_COLOR_MISSING`);
        }
        
        this.gcm.agentTrace.push({ agent: 'Governance-Basic', status: 'PASS', duration: Date.now() - t4 });
        
        // 🎯 CHALLENGER: Devil's Advocate Agent
        const tChallenger = Date.now();
        const challenge = await this.runDevilsAdvocate(htmlContent, primaryIntent);
        
        if (challenge) {
          this.gcm.agentTrace.push({
            agent: 'DevilsAdvocate',
            status: 'CHALLENGE',
            duration: Date.now() - tChallenger,
            findings: challenge
          });
          
          // 🎯 WEIGHT ADJUSTER: Adjust weights based on challenge
          this.adjustWeights(challenge);
          
          governanceIssues.push(`CHALLENGE: ${challenge.concern}`);
          
          // Increment retry count
          this.gcm.correction.retryCount++;
          
          // If within retry cap, try again
          if (this.gcm.correction.retryCount < this.gcm.correction.maxRetries) {
            this.gcm.correction.lastDriftReason = challenge.recommendation;
            this.gcm.gatesPass.challengerPassed = false;
            return { html: htmlContent, intentLabel: primaryIntent };
          }
        } else {
          this.gcm.gatesPass.challengerPassed = true;
        }
        
        this.gcm.gatesPass.governanceFamily = true;
        
        // If governance found issues, try repair
        if (governanceIssues.length > 0) {
          for (const issue of governanceIssues) {
            this.recordFailure('QA-Validator', issue);
          }
          
          const simpleCopy = {
            headliner: primaryIntent === 'B2B' ? 'Business Partner' : 'Experience',
            headline: `${input.adInputValue.slice(0, 40)}`,
            subheadline: 'Professional services you can trust',
            primaryCta: primaryIntent === 'B2B' ? 'Get Started' : 'Order Now',
            secondaryCta: 'Learn More'
          };
          
          const repairedHtml = generateProfessionalHTMLv2({
            brandName: input.targetUrl.split('.')[0].replace(/^www\./, ''),
            brandColors: lockedColors,
            copy: simpleCopy,
            category
          });
          
          this.gcm.agentTrace.push({
            agent: 'QA-Repair',
            status: 'PASS',
            duration: Date.now() - t4,
            findings: { repairsApplied: governanceIssues.length }
          });
          
          return {
            html: repairedHtml,
            intentLabel: primaryIntent
          };
        }
        
        return { html: htmlContent, intentLabel: primaryIntent };
        
      } catch (error: any) {
        this.recordFailure('System', error.message);
        throw error;
      }
    };
    
    // ═══════════════════════════════════════════════════
    // 🔄 DRIFT-BACK PROTOCOL with max-retries cap
    // ═══════════════════════════════════════════════════
    
    let result: { html: string; intentLabel: string };
    
    while (deepResearchAttempts < MAX_DEEP_RESEARCH) {
      try {
        const attempt = await attemptGeneration();
        result = attempt;
        
        // Check if Challenger passed
        if (this.gcm.gatesPass.challengerPassed) {
          break;
        }
        
        // Deep research retry
        deepResearchAttempts++;
        
        if (deepResearchAttempts >= MAX_DEEP_RESEARCH) {
          this.gcm.errorLogs.push('Max deep research attempts reached');
          break;
        }
        
      } catch (e) {
        break;
      }
    }
    
    if (!result) {
      return { success: false, gcm: this.gcm, errors: this.gcm.errorLogs };
    }
    
    return {
      success: true,
      html: result.html,
      gcm: this.gcm,
      errors: this.gcm.errorLogs
    };
  }
}