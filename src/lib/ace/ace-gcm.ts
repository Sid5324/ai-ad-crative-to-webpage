// ACE-GCM: Global Context Manifest
// Fixes "Context Vanishing Syndrome" by preserving findings across ALL agents

export interface GlobalContextManifest {
  // Research Findings (from Agents 1-4)
  research: {
    audienceType: 'b2b' | 'b2c' | 'd2c' | 'unknown';
    audienceJTBD: string; // Jobs to be Done
    brandDNA: {
      primaryColor: string;
      accentColor: string;
      fontFamily: string;
      logoEmoji: string;
    };
    proofPoints: string[]; // Non-negotiable stats to include
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
  };
  
  // State
  finalized: boolean;
}

// Create initial GCM from research agents
export function createGCM(input: {
  targetUrl: string;
  adContent: string;
  inferredCategory: string;
}): GlobalContextManifest {
  
  // Determine audience type from content analysis
  const audienceType = detectAudienceType(input.adContent);
  
  return {
    research: {
      audienceType,
      audienceJTBD: extractJTBD(audienceType, input.adContent),
      brandDNA: {
        primaryColor: '#FF3008', // Will be updated by brand analyzer
        accentColor: '#FF4D4D',
        fontFamily: 'Inter',
        logoEmoji: detectCategoryEmoji(input.inferredCategory)
      },
      proofPoints: extractProofPoints(input.adContent)
    },
    strategy: {
      headlineFramework: inferFramework(audienceType),
      ctaPrimary: inferPrimaryCTA(audienceType),
      ctaSecondary: inferSecondaryCTA(audienceType)
    },
    gates: {
      contrastRatio: 4.5,
      brandColorEnforced: false,
      proofPointsIncluded: false,
      frameworkUsed: false
    },
    finalized: false
  };
}

// Detect B2B vs B2C from content
function detectAudienceType(content: string): 'b2b' | 'b2c' | 'd2c' | 'unknown' {
  const lower = content.toLowerCase();
  
  // B2B indicators
  const b2bTerms = ['merchant', 'partner', 'restaurant owner', 'business', 'grow revenue', 'increase sales', 'enterprise', 'integrat'];
  const b2bScore = b2bTerms.filter(t => lower.includes(t)).length;
  
  // B2C indicators  
  const b2cTerms = ['order now', 'delivered', 'food', 'eat', 'restaurant', 'buy', 'get started'];
  const b2cScore = b2cTerms.filter(t => lower.includes(t)).length;
  
  if (b2bScore >= 2) return 'b2b';
  if (b2cScore >= 2) return 'b2c';
  return 'unknown';
}

// Extract Jobs to be Done
function extractJTBD(audienceType: 'b2b' | 'b2c' | 'd2c' | 'unknown', content: string): string {
  if (audienceType === 'b2b') {
    return 'Struggling with off-premise sales and reaching new customers';
  }
  if (audienceType === 'b2c') {
    return 'Wanting quick, convenient food delivery';
  }
  return 'General customer engagement';
}

// Extract proof points (stats, numbers)
function extractProofPoints(content: string): string[] {
  const numbers = content.match(/\d+/g) || [];
  const proofPoints: string[] = [];
  
  for (const num of numbers) {
    if (parseInt(num) > 100) {
      proofPoints.push(num);
    }
  }
  
  return proofPoints;
}

// Infer headline framework based on audience
function inferFramework(audienceType: 'b2b' | 'b2c' | 'd2c' | 'unknown'): 'AIDA' | 'PAS' | 'BAB' | 'Feature-Benefit' {
  if (audienceType === 'b2b') return 'PAS'; // Problem-Agitation-Solution works for businesses
  if (audienceType === 'b2c') return 'AIDA'; // Attention-Interest-Desire-Action for consumers
  return 'Feature-Benefit';
}

// Infer primary CTA based on audience
function inferPrimaryCTA(audienceType: 'b2b' | 'b2c' | 'd2c' | 'unknown'): string {
  const ctaMap = {
    'b2b': 'Get Started',
    'b2c': 'Order Now',
    'd2c': 'Shop Now',
    'unknown': 'Learn More'
  };
  return ctaMap[audienceType] || 'Learn More';
}

function inferSecondaryCTA(audienceType: 'b2b' | 'b2c' | 'd2c' | 'unknown'): string {
  const ctaMap = {
    'b2b': 'Schedule Demo',
    'b2c': 'Browse Menu',
    'd2c': 'Browse',
    'unknown': 'Contact Us'
  };
  return ctaMap[audienceType] || 'Learn More';
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

// Update GCM with findings from each agent
export function updateGCM(
  gcm: GlobalContextManifest,
  agentName: string,
  findings: any
): GlobalContextManifest {
  
  switch (agentName) {
    case 'ad-analyzer':
      gcm.research.audienceType = findings.audienceType || gcm.research.audienceType;
      break;
      
    case 'url-brand-analyzer':
      gcm.research.brandDNA = {
        ...gcm.research.brandDNA,
        ...findings.brandDNA
      };
      gcm.gates.brandColorEnforced = true;
      break;
      
    case 'offer-proof-guard':
      gcm.research.proofPoints = findings.validatedProofPoints || gcm.research.proofPoints;
      break;
      
    case 'copy-generator':
      gcm.strategy.headlineFramework = findings.framework || gcm.strategy.headlineFramework;
      gcm.gates.frameworkUsed = true;
      break;
  }
  
  return gcm;
}

// Finalize GCM - mark as complete
export function finalizeGCM(gcm: GlobalContextManifest): GlobalContextManifest {
  return {
    ...gcm,
    finalized: true
  };
}