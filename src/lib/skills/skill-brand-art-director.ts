// src/lib/skills/skill-brand-art-director.ts - Brand Art Director Skill
// Produces visual DNA instead of generic design tokens
import { Brand, AdVision, PageStrategy } from '../schemas/skill-schemas';

interface BrandVisualDNA {
  brandName: string;
  voice: {
    descriptors: string[];
    bannedPhrases: string[];
    preferredPhrases: string[];
  };
  artDirection: {
    aesthetic: string;
    layoutStyle: 'editorial' | 'masonry' | 'cinematic' | 'product-premium';
    depthStyle: 'flat' | 'glass' | 'physical' | 'pseudo-morphic';
    textureLevel: number;
    contrastStyle: 'muted' | 'high' | 'spotlight';
  };
  typography: {
    displayRole: string;
    bodyRole: string;
    avoidFonts: string[];
  };
  colorSystem: {
    base: string[];
    accent: string[];
    avoid: string[];
  };
  interaction: {
    motionStyle: 'minimal' | 'delightful' | 'physical';
    buttonStyle: 'high-contrast' | 'subtle' | 'elevated';
  };
  composition: {
    symmetryBias: number;
    density: 'airy' | 'balanced' | 'dense';
    sectionRhythm: 'uniform' | 'varied' | 'dramatic';
  };
}

// CRED-specific brand DNA (from live site analysis)
const CRED_DNA: BrandVisualDNA = {
  brandName: 'CRED',
  voice: {
    descriptors: ['exclusive', 'sharp', 'aspirational', 'self-assured', 'members-only'],
    bannedPhrases: [
      'Why Choose CRED',
      'Ready to Apply?',
      'Why Leading Indians Choose Us', 
      'Dedicated Support',
      'Get Started',
      'Learn More',
      'Trusted by thousands',
      'Premium service'
    ],
    preferredPhrases: [
      'crafted for the creditworthy',
      'not everyone gets it',
      'make it to the club',
      'unlock cashback',
      '-members only'
    ]
  },
  artDirection: {
    aesthetic: 'dark premium with sculpted contrast and NeoPOP-inspired moments',
    layoutStyle: 'product-premium',
    depthStyle: 'physical',
    textureLevel: 2,
    contrastStyle: 'spotlight'
  },
  typography: {
    displayRole: 'hybrid-bold',
    bodyRole: 'neutral-sans',
    avoidFonts: ['plain Inter-only treatment']
  },
  colorSystem: {
    base: ['#0a0a0a', '#171717', '#f5f1e8'],
    accent: ['#d4af37', '#ffffff'],
    avoid: ['generic blue fintech palette', 'random gradient purple']
  },
  interaction: {
    motionStyle: 'delightful',
    buttonStyle: 'high-contrast',
  },
  composition: {
    symmetryBias: 3,
    density: 'balanced',
    sectionRhythm: 'dramatic'
  }
};

// Generate brand-specific visual DNA
export function runBrandArtDirector(
  brand: Brand,
  ad: AdVision,
  strategy: PageStrategy
): BrandVisualDNA {
  console.log('[ArtDirector] Generating brand visual DNA...');
  
  const category = brand.category;
  const tone = brand.tone || [];
  const name = brand.name.toLowerCase();
  
  // CRED gets special treatment
  if (name.includes('cred') || category === 'Finance') {
    return getCredDNA(brand);
  }
  
  // Other premium brands
  if (tone.includes('Premium') || tone.includes('Exclusive')) {
    return getPremiumDNA(brand);
  }
  
  // E-commerce
  if (category === 'E-commerce' || category === 'Food & Dining') {
    return getEcommerceDNA(brand);
  }
  
  // Default modern
  return getDefaultDNA(brand);
}

function getCredDNA(brand: Brand): BrandVisualDNA {
  // Start with CRED DNA and add any brand-specific tone descriptors
  const descriptors = [...CRED_DNA.voice.descriptors];
  if (brand.tone) {
    for (const t of brand.tone) {
      if (!descriptors.includes(t)) {
        descriptors.push(t);
      }
    }
  }
  return {
    ...CRED_DNA,
    voice: {
      ...CRED_DNA.voice,
      descriptors
    }
  };
}

function getPremiumDNA(brand: Brand): BrandVisualDNA {
  return {
    brandName: brand.name,
    voice: {
      descriptors: ['premium', 'elegant', 'exclusive'],
      bannedPhrases: ['Get Started', 'Learn More', 'Premium service'],
      preferredPhrases: ['crafted for you', 'exclusive access', 'limited time']
    },
    artDirection: {
      aesthetic: 'luxury dark with depth',
      layoutStyle: 'product-premium',
      depthStyle: 'glass',
      textureLevel: 2,
      contrastStyle: 'high'
    },
    typography: {
      displayRole: 'luxury-serif',
      bodyRole: 'humanist-sans',
      avoidFonts: ['Roboto']
    },
    colorSystem: {
      base: ['#0a0a0a', '#1a1a1a'],
      accent: ['#c9a227', '#ffffff'],
      avoid: ['#3b82f6']
    },
    interaction: {
      motionStyle: 'delightful',
      buttonStyle: 'high-contrast'
    },
    composition: {
      symmetryBias: 2,
      density: 'balanced',
      sectionRhythm: 'dramatic'
    }
  };
}

function getEcommerceDNA(brand: Brand): BrandVisualDNA {
  return {
    brandName: brand.name,
    voice: {
      descriptors: ['friendly', 'vibrant', 'clear'],
      bannedPhrases: ['Get Started', 'Learn More'],
      preferredPhrases: ['free delivery', 'easy returns', 'best sellers']
    },
    artDirection: {
      aesthetic: 'bright modern commerce',
      layoutStyle: 'masonry',
      depthStyle: 'flat',
      textureLevel: 0,
      contrastStyle: 'muted'
    },
    typography: {
      displayRole: 'bold-grotesk',
      bodyRole: 'neutral-sans',
      avoidFonts: []
    },
    colorSystem: {
      base: ['#ffffff', '#f8fafc'],
      accent: ['#10b981', '#3b82f6'],
      avoid: []
    },
    interaction: {
      motionStyle: 'delightful',
      buttonStyle: 'high-contrast'
    },
    composition: {
      symmetryBias: 1,
      density: 'airy',
      sectionRhythm: 'varied'
    }
  };
}

function getDefaultDNA(brand: Brand): BrandVisualDNA {
  return {
    brandName: brand.name,
    voice: {
      descriptors: ['modern', 'professional'],
      bannedPhrases: ['Get Started'],
      preferredPhrases: []
    },
    artDirection: {
      aesthetic: 'clean modern',
      layoutStyle: 'product-premium',
      depthStyle: 'flat',
      textureLevel: 1,
      contrastStyle: 'high'
    },
    typography: {
      displayRole: 'bold-sans',
      bodyRole: 'neutral-sans',
      avoidFonts: []
    },
    colorSystem: {
      base: ['#ffffff', '#f1f5f9'],
      accent: ['#3b82f6'],
      avoid: []
    },
    interaction: {
      motionStyle: 'minimal',
      buttonStyle: 'subtle'
    },
    composition: {
      symmetryBias: 1,
      density: 'balanced',
      sectionRhythm: 'uniform'
    }
  };
}

// Check copy against brand voice
export function validateBrandVoice(copy: any, dna: BrandVisualDNA): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check banned phrases
  const allCopy = JSON.stringify(copy).toLowerCase();
  for (const phrase of dna.voice.bannedPhrases) {
    if (allCopy.includes(phrase.toLowerCase())) {
      issues.push(`Banned phrase: "${phrase}"`);
    }
  }
  
  // Check for brand-specific language
  const hasPreferred = dna.voice.preferredPhrases.some(p => allCopy.includes(p.toLowerCase()));
  if (!hasPreferred && dna.voice.preferredPhrases.length > 0) {
    issues.push('Missing brand voice - no preferred phrases found');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

export type { BrandVisualDNA };
export { CRED_DNA };