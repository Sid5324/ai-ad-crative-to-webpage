// src/lib/skills/skill-design-fix.ts - Design that uses actual brand colors
import { Brand, AdVision, PageStrategy, DesignDirection } from '../schemas/skill-schemas';

export function runDesignFix(
  brand: Brand,
  ad: AdVision,
  strategy: PageStrategy
): DesignDirection {
  console.log('[DesignFix] Using brand colors:', { brand: brand.name, colors: brand.colors });
  
  const brandName = brand.name.toLowerCase();
  const brandColors = brand.colors;
  const category = brand.category;
  const visionMood = ad.visualMood?.[0] || 'premium';
  const visionOffers = ad.offerSignals || [];
  
  // Use brand's actual colors
  const bg = brandColors.primary === '#0a0a0a' || brandColors.primary === '#1e293b' 
    ? '#0a0a0a' 
    : '#ffffff';
  const isDark = brandColors.primary === '#0a0a0a' || brandColors.dark === '#1A0F0A';
  
  // CRED - use actual brand red
  if (brandName.includes('cred')) {
    return {
      artDirection: 'cred-bold',
      palette: {
        bg: '#0a0a0a',
        surface: '#141212',
        text: '#ffffff',
        primary: '#E24B26',
        accent: '#FF6B47'
      },
      typography: {
        display: 'Inter',
        body: 'Inter',
        scale: 'dramatic'
      },
      layout: {
        heroStyle: 'asymmetric',
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
  
  // Finance + premium mood = dark premium
  if (category === 'Finance' || brandColors.accent === '#10b981') {
    return {
      artDirection: 'fintech-premium',
      palette: {
        bg: '#0a0a0a',
        surface: '#171717',
        text: '#ffffff',
        primary: brandColors.primary,
        accent: brandColors.accent
      },
      typography: {
        display: 'Inter',
        body: 'Inter',
        scale: 'dramatic'
      },
      layout: {
        heroStyle: 'asymmetric',
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
  
  // Has discount/offer = high contrast
  if (visionOffers.includes('discount') || visionOffers.includes('sale')) {
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
  
  // B2B/Merchant = clean SaaS
  if (brand.audience === 'merchant' || brand.audience === 'b2b') {
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
  
  // Default modern
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