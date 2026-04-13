// src/lib/skills/skill-design-director.ts - Design Director Skill
import { DesignDirection, Brand, AdVision, PageStrategy } from '../schemas/skill-schemas';

// Generate design tokens based on brand, ad, and strategy
export function runDesignSkill(
  brand: Brand, 
  ad: AdVision, 
  strategy: PageStrategy
): DesignDirection {
  console.log('[Design] Generating design direction...', { brand: brand.name, category: brand.category });
  
  const category = brand.category;
  const tone = brand.tone || [];
  const narrative = strategy.narrativeStyle;
  const layout = strategy.layoutMode;
  const brandName = brand.name.toLowerCase();
  const brandColors = brand.colors;
  
  // Check for known premium brands first - use their actual colors
  if (brandName.includes('cred')) {
    return {
      artDirection: 'cred-bold',
      palette: {
        bg: '#0a0a0a',
        surface: '#141212',
        text: '#ffffff',
        primary: brandColors.accent || '#E24B26',
        accent: brandColors.accent || '#E24B26'
      },
      typography: { display: 'Inter', body: 'Inter', scale: 'dramatic' },
      layout: { heroStyle: 'asymmetric', sectionSpacing: 'balanced', cardStyle: 'outlined' },
      motion: { intensity: 'premium', style: 'fade' },
      density: 'comfortable'
    };
  }
  
  // Finance / Premium → dark elegant but USE BRAND COLORS
  if (category === 'Finance' || narrative === 'trust-heavy-fintech') {
    return getFintechDarkDesign(brand);
  }
  
  // Editorial/premium
  if (narrative === 'editorial-premium' || tone.includes('Premium')) {
    return getEditorialDesign(brand);
  }
  
  // Merchant/B2B
  if (brand.audience === 'merchant' || brand.audience === 'b2b') {
    return getB2BDesign(brand);
  }
  
  // Campaign/offer
  if (narrative === 'campaign-first' || layout === 'campaign') {
    return getCampaignDesign(brand);
  }
  
  // Transportation/Luxury services  
  if (category === 'Transportation' || category === 'Luxury') {
    return getLuxuryTransportDesign(brand);
  }
  
  // SaaS
  if (category === 'SaaS') {
    return getSaaSDesign(brand);
  }
  
  // Default - use brand colors
  return {
    artDirection: 'playful-modern',
    palette: {
      bg: brandColors.light || '#ffffff',
      surface: brandColors.primary || '#f8fafc',
      text: '#1a1a1a',
      primary: brandColors.primary || '#1e293b',
      accent: brandColors.accent || '#3b82f6'
    },
    typography: { display: 'Inter', body: 'Inter', scale: 'balanced' },
    layout: { heroStyle: 'centered', sectionSpacing: 'balanced', cardStyle: 'soft' },
    motion: { intensity: 'subtle', style: 'fade' },
    density: 'comfortable'
  };
}

function getFintechDarkDesign(brand: Brand): DesignDirection {
  // Use brand's actual colors from detection
  const colors = brand.colors;
  return {
    artDirection: 'fintech-dark-elegant',
    palette: {
      bg: colors.dark || '#0a0a0a',
      surface: colors.primary || '#1a1a1a',
      text: '#ffffff',
      primary: colors.primary || '#1a1a1a',
      accent: colors.accent || '#d4af37'
    },
    typography: {
      display: 'Inter',
      body: 'Inter',
      scale: 'balanced'
    },
    layout: {
      heroStyle: 'centered',
      sectionSpacing: 'balanced',
      cardStyle: 'outlined'
    },
    motion: {
      intensity: 'premium',
      style: 'fade'
    },
    density: 'comfortable'
  };
}

function getLuxuryTransportDesign(brand: Brand): DesignDirection {
  // Luxury transport - black/gold or brand colors
  const colors = brand.colors;
  return {
    artDirection: 'minimal-luxury',
    palette: {
      bg: '#000000',
      surface: '#1a1a1a',
      text: '#ffffff',
      primary: '#000000',
      accent: colors.accent || '#d4af37'
    },
    typography: {
      display: 'Inter',
      body: 'Inter',
      scale: 'dramatic'
    },
    layout: {
      heroStyle: 'split',
      sectionSpacing: 'balanced',
      cardStyle: 'outlined'
    },
    motion: {
      intensity: 'premium',
      style: 'fade'
    },
    density: 'comfortable'
  };
}

function getEditorialDesign(brand: Brand): DesignDirection {
  return {
    artDirection: 'editorial-premium',
    palette: {
      bg: '#ffffff',
      surface: '#fafafa',
      text: '#1a1a1a',
      primary: '#1a1a1a',
      accent: '#c9a227'
    },
    typography: {
      display: 'Playfair Display',
      body: 'Inter',
      scale: 'dramatic'
    },
    layout: {
      heroStyle: 'asymmetric',
      sectionSpacing: 'airy',
      cardStyle: 'flat'
    },
    motion: {
      intensity: 'premium',
      style: 'slide'
    },
    density: 'spacious'
  };
}

function getB2BDesign(brand: Brand): DesignDirection {
  return {
    artDirection: 'clean-saas',
    palette: {
      bg: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      primary: '#1e293b',
      accent: '#3b82f6'
    },
    typography: {
      display: 'Inter',
      body: 'Inter',
      scale: 'balanced'
    },
    layout: {
      heroStyle: 'split',
      sectionSpacing: 'balanced',
      cardStyle: 'soft'
    },
    motion: {
      intensity: 'subtle',
      style: 'micro'
    },
    density: 'comfortable'
  };
}

function getCampaignDesign(brand: Brand): DesignDirection {
  return {
    artDirection: 'high-contrast-campaign',
    palette: {
      bg: '#ffffff',
      surface: '#fef3c7',
      text: '#1e293b',
      primary: '#dc2626',
      accent: '#f59e0b'
    },
    typography: {
      display: 'Inter',
      body: 'Inter',
      scale: 'balanced'
    },
    layout: {
      heroStyle: 'centered',
      sectionSpacing: 'tight',
      cardStyle: 'outlined'
    },
    motion: {
      intensity: 'subtle',
      style: 'fade'
    },
    density: 'compact'
  };
}

function getSaaSDesign(brand: Brand): DesignDirection {
  return {
    artDirection: 'minimal-luxury',
    palette: {
      bg: '#ffffff',
      surface: '#f8fafc',
      text: '#334155',
      primary: '#0f172a',
      accent: '#8b5cf6'
    },
    typography: {
      display: 'Inter',
      body: 'Inter',
      scale: 'compact'
    },
    layout: {
      heroStyle: 'split',
      sectionSpacing: 'balanced',
      cardStyle: 'soft'
    },
    motion: {
      intensity: 'premium',
      style: 'slide'
    },
    density: 'comfortable'
  };
}

function getModernDesign(brand: Brand): DesignDirection {
  return {
    artDirection: 'playful-modern',
    palette: {
      bg: '#ffffff',
      surface: '#f1f5f9',
      text: '#1e293b',
      primary: '#1e293b',
      accent: '#06b6d4'
    },
    typography: {
      display: 'Inter',
      body: 'Inter',
      scale: 'balanced'
    },
    layout: {
      heroStyle: 'split',
      sectionSpacing: 'airy',
      cardStyle: 'soft'
    },
    motion: {
      intensity: 'subtle',
      style: 'fade'
    },
    density: 'comfortable'
  };
}