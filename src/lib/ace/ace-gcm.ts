// ACE-GCM: Global Context Manifest with ELASTIC WEIGHTING
// Fixes "Context Vanishing Syndrome" AND "Tunnel Vision Trap"
// - Uses probability vectors instead of binary locks
// - Confidence gates create emergency brakes
// - Self-correction without infinite loops

export interface IntentWeight {
  label: 'B2B' | 'B2C' | 'D2C';
  weight: number;       // 0.0 - 1.0
  evidence: string;      // Why this was scored this way
}

// NEW: Proof points with relevance tags
export interface ProofPointWithRelevance {
  value: string;
  relevance: {
    B2B?: number;   // Relevance to B2B audience (0-1)
    B2C?: number;  // Relevance to B2C audience (0-1)
  };
  source: string;    // Where extracted from
}

export interface GlobalContextManifest {
  // 🎯 ELASTIC WEIGHTING: Probability vector (not binary lock)
  intent_weights: IntentWeight[];
  
  // 🎯 CONFIDENCE SCORE: Emergency brake threshold
  // If below 0.7, trigger "Deep Research" loop
  confidence_score: number;
  
  // 🎯 INTENT CHALLENGE LOG: Allows agents to challenge the lock
  intent_challenge_log: IntentChallenge[];
  
  // 📊 PROOF POINTS with relevance tags
  proofPoints: ProofPointWithRelevance[];
  
  // Research Findings (from Agents 1-4)
  research: {
    audienceType: 'b2b' | 'b2c' | 'd2c' | 'unknown';
    audienceJTBD: string;
    brandDNA: {
      primaryColor: string;
      accentColor: string;
      fontFamily: string;
      logoEmoji: string;
    };
  };
  
  // Strategy (from Agents 5-6)
  strategy: {
    headlineFramework: 'AIDA' | 'PAS' | 'BAB' | 'Feature-Benefit';
    ctaPrimary: string;
    ctaSecondary: string;
  };
  
  // Validation Gates (for QA)
  gates: {
    contrastRatio: number;
    brandColorEnforced: boolean;
    proofPointsIncluded: boolean;
    frameworkUsed: boolean;
    semanticDriftScore: number;
  };
  
  // Self-correction state
  correction: {
    retryCount: number;
    maxRetries: number;
    lastDriftReason?: string;
  };
  
  // State
  finalized: boolean;
}

export interface IntentChallenge {
  agent: string;
  timestamp: number;
  concern: string;
  recommendation: string;
  resolved: boolean;
}

// Create initial GCM with ELASTIC WEIGHTING
export function createGCM(input: {
  targetUrl: string;
  adContent: string;
  inferredCategory: string;
}): GlobalContextManifest {
  
  // Calculate probability distribution, NOT binary lock
  const intentDistribution = calculateIntentWeights(input.adContent, input.targetUrl);
  
  // Calculate confidence based on evidence strength
  const confidenceScore = calculateConfidenceScore(intentDistribution);
  
  // Extract proof points with relevance tags
  const proofPoints = extractProofPointsWithRelevance(input.adContent, intentDistribution);
  
  // Determine primary intent from highest weight
  const primaryIntent = getPrimaryIntent(intentDistribution);
  
  return {
    intent_weights: intentDistribution,
    confidence_score: confidenceScore,
    intent_challenge_log: [],
    proofPoints,
    research: {
      audienceType: primaryIntent,
      audienceJTBD: extractJTBD(primaryIntent, input.adContent),
      brandDNA: {
        primaryColor: '#1E293B',
        accentColor: '#3B82F6',
        fontFamily: 'Inter',
        logoEmoji: detectCategoryEmoji(input.inferredCategory)
      }
    },
    strategy: {
      headlineFramework: inferFramework(primaryIntent),
      ctaPrimary: inferPrimaryCTA(primaryIntent),
      ctaSecondary: inferSecondaryCTA(primaryIntent)
    },
    gates: {
      contrastRatio: 4.5,
      brandColorEnforced: false,
      proofPointsIncluded: false,
      frameworkUsed: false,
      semanticDriftScore: 0
    },
    correction: {
      retryCount: 0,
      maxRetries: 3  // Cap to prevent infinite loops
    },
    finalized: false
  };
}

// 🎯 ELASTIC WEIGHTING: Calculate probability distribution
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
    { term: 'b2b', weight: 0.95 },
    { term: 'integrat', weight: 0.75 }
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
    { term: 'get started', weight: 0.4 },
    { term: 'consumer', weight: 0.7 }
  ];
  
  // Calculate weighted scores
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
  
  // Normalize to probability distribution
  const total = b2bScore + b2cScore + 0.01; // Avoid division by zero
  const b2bProb = b2bScore / total;
  const b2cProb = b2cScore / total;
  
  return [
    { 
      label: 'B2B', 
      weight: Math.min(1, b2bProb),
      evidence: b2bEvidence.join(', ') || 'No evidence'
    },
    { 
      label: 'B2C', 
      weight: Math.min(1, b2cProb),
      evidence: b2cEvidence.join(', ') || 'No evidence'
    }
  ];
}

// 🎯 CONFIDENCE SCORE: Calculate confidence from evidence strength
function calculateConfidenceScore(weights: IntentWeight[]): number {
  const primary = Math.max(...weights.map(w => w.weight));
  const secondary = weights
    .filter(w => w.weight !== primary)
    .reduce((max, w) => Math.max(max, w.weight), 0);
  
  // High confidence = strong primary, weak secondary
  // Low confidence = weak primary OR strong secondary (ambiguous)
  if (primary < 0.3) return 0.2;  // Too weak to decide
  if (primary > 0.8 || secondary < 0.1) return 0.95;  // Clear winner
  if (primary > 0.6) return 0.8;
  return 0.5;  // Ambiguous - needs deep research
}

// 📊 PROOF POINTS with relevance tags
function extractProofPointsWithRelevance(
  content: string, 
  weights: IntentWeight[]
): ProofPointWithRelevance[] {
  const numberMatches = content.match(/\d+[\d,]*\+?/g) || [];
  const proofPoints: ProofPointWithRelevance[] = [];
  
  for (const num of numberMatches) {
    const value = num.replace(/,/g, '');
    const intVal = parseInt(value);
    
    if (intVal > 100) {
      // Calculate relevance based on the number context
      const b2bContext = ['merchant', 'partner', 'business', 'revenue', 'sales', 'grow', 'customer'];
      const b2cContext = ['order', 'eat', 'food', 'delivered', 'happy', 'love', 'people'];
      
      const text = content.toLowerCase();
      const b2bMatches = b2bContext.filter(t => text.includes(t)).length;
      const b2cMatches = b2cContext.filter(t => text.includes(t)).length;
      
      proofPoints.push({
        value: num,
        relevance: {
          B2B: b2bMatches > 0 ? Math.min(1, b2bMatches * 0.3) : 0,
          B2C: b2cMatches > 0 ? Math.min(1, b2cMatches * 0.3) : 0
        },
        source: 'ad-content'
      });
    }
  }
  
  return proofPoints;
}

function getPrimaryIntent(weights: IntentWeight[]): 'b2b' | 'b2c' | 'd2c' | 'unknown' {
  const maxWeight = weights.reduce((max, w) => w.weight > max.weight ? w : max, weights[0]);
  
  if (maxWeight.label === 'B2B') return 'b2b';
  if (maxWeight.label === 'B2C') return 'b2c';
  return 'unknown';
}

function extractJTBD(audienceType: string, content: string): string {
  if (audienceType === 'b2b') return 'Struggling with off-premise sales';
  if (audienceType === 'b2c') return 'Wanting quick, convenient delivery';
  return 'General customer engagement';
}

function detectCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    'food_delivery': '🍕',
    'luxury_transportation': '🚗',
    'saas': '💻',
    'ecommerce': '🛒',
    'healthcare': '🏥',
    'real_estate': '🏠'
  };
  return emojis[category] || '⭐';
}

function inferFramework(audienceType: string): 'AIDA' | 'PAS' | 'BAB' | 'Feature-Benefit' {
  if (audienceType === 'b2b') return 'PAS';
  if (audienceType === 'b2c') return 'AIDA';
  return 'Feature-Benefit';
}

function inferPrimaryCTA(audienceType: string): string {
  const ctaMap: Record<string, string> = {
    'b2b': 'Get Started',
    'b2c': 'Order Now',
    'd2c': 'Shop Now',
    'unknown': 'Learn More'
  };
  return ctaMap[audienceType] || 'Learn More';
}

function inferSecondaryCTA(audienceType: string): string {
  const ctaMap: Record<string, string> = {
    'b2b': 'Schedule Demo',
    'b2c': 'Browse Menu',
    'd2c': 'Browse',
    'unknown': 'Contact Us'
  };
  return ctaMap[audienceType] || 'Learn More';
}

// 🎯 GET PRIMARY INTENT: Returns the weighted primary intent
export function getPrimaryIntentLabel(gcm: GlobalContextManifest): string {
  const sorted = [...gcm.intent_weights].sort((a, b) => b.weight - a.weight);
  return sorted[0].label;
}

// 🎯 GET INTENT WEIGHTS: Returns raw probability distribution
export function getIntentWeights(gcm: GlobalContextManifest): { label: string; weight: number }[] {
  return gcm.intent_weights.map(w => ({ label: w.label, weight: w.weight }));
}

// 📡 INTENT CHALLENGE LOG: Add a challenge from a challenger agent
export function addIntentChallenge(
  gcm: GlobalContextManifest,
  agent: string,
  concern: string,
  recommendation: string
): GlobalContextManifest {
  return {
    ...gcm,
    intent_challenge_log: [
      ...gcm.intent_challenge_log,
      {
        agent,
        timestamp: Date.now(),
        concern,
        recommendation,
        resolved: false
      }
    ]
  };
}

// 🔄 DRIFT-BACK PROTOCOL: Trigger re-evaluation if confidence is low
export function shouldTriggerDeepResearch(gcm: GlobalContextManifest): boolean {
  return gcm.confidence_score < 0.7 && gcm.correction.retryCount < gcm.correction.maxRetries;
}

// 📝 UPDATE PROOF POINTS: Add fresh proof points from research
export function updateProofPoints(
  gcm: GlobalContextManifest,
  newPoints: ProofPointWithRelevance[]
): GlobalContextManifest {
  return {
    ...gcm,
    proofPoints: newPoints
  };
}

// Finalize GCM
export function finalizeGCM(gcm: GlobalContextManifest): GlobalContextManifest {
  return {
    ...gcm,
    finalized: true
  };
}

// Unified GCM for Nexus-ACE Integration
export interface UnifiedGCM {
  // 🔬 RESEARCH FAMILY (Agents 1-6)
  intent_vector: { b2b: number; b2c: number; confidence: number; evidence: string };
  visual_dna: { primary: string; accent: string; logo: string };
  validated_proof_points: Array<{ value: string; source: string; context: string }>;

  // 🧠 STRATEGY FAMILY (Agents 7-12)
  page_blueprint: { layout: string; sections: string[]; flow: string };
  copy_framework: 'PAS' | 'AIDA' | 'BAB' | 'FEATURE_BENEFIT';
  cta_strategy: { primary: string; secondary: string };

  // 🏭 FACTORY FAMILY (Agents 13-26)
  design_tokens: Record<string, string>;
  html_manifest: string;

  // 🛡️ GOVERNANCE FAMILY (Agents 27-30)
  qa_gate_status: 'CLEARED' | 'BLOCKED' | 'REPAIRING';
  semantic_drift_score: number;
  error_logs: string[];

  // 🔄 SELF-CORRECTION
  retry_count: number;
  max_retries: number;

  // 📊 TRACEABILITY
  agent_trace?: any[];
}