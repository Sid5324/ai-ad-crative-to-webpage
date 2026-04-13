// src/lib/skills/skill-page-strategy.ts - Page Strategy Skill
import { PageStrategy, Brand, AdVision } from '../schemas/skill-schemas';

// Determine page strategy based on brand and ad analysis
export function runStrategySkill(brand: Brand, ad: AdVision): PageStrategy {
  console.log('[Strategy] Determining page strategy...');
  
  const category = brand.category;
  const audience = brand.audience;
  const tone = brand.tone;
  const adStatus = ad.status;
  const offerSignals = ad.offerSignals || [];
  
  // Financial services → trust-heavy fintech
  if (category === 'Finance' || category === 'Real Estate') {
    return {
      narrativeStyle: 'trust-heavy-fintech',
      layoutMode: 'dark-premium',
      sectionPlan: [
        { type: 'hero', priority: 10, required: true },
        { type: 'stats-bar', priority: 9, required: true },
        { type: 'trust-bar', priority: 8, required: true },
        { type: 'benefits', priority: 7, required: true },
        { type: 'testimonial', priority: 6, required: false },
        { type: 'faq', priority: 5, required: false },
        { type: 'cta', priority: 10, required: true },
        { type: 'footer', priority: 1, required: true }
      ],
      conversionPath: {
        primary: ad.ctaSignals?.[0] || 'Apply Now',
        secondary: 'Learn More'
      },
      confidence: 0.85
    };
  }
  
  // Premium/exclusive tone → editorial premium
  if (tone.includes('Premium') || tone.includes('Exclusive')) {
    return {
      narrativeStyle: 'editorial-premium',
      layoutMode: 'asymmetric',
      sectionPlan: [
        { type: 'hero', priority: 10, required: true },
        { type: 'intro', priority: 9, required: false },
        { type: 'benefits', priority: 8, required: true },
        { type: 'feature-mosaic', priority: 7, required: false },
        { type: 'testimonial', priority: 6, required: true },
        { type: 'cta', priority: 10, required: true },
        { type: 'footer', priority: 1, required: true }
      ],
      conversionPath: {
primary: ad.ctaSignals?.[0] || 'Apply Now',
        secondary: 'Explore'
      },
      confidence: 0.85
    };
  }
  
  // Merchant/B2B → product-benefit with social proof
  if (audience === 'merchant' || audience === 'b2b') {
    return {
      narrativeStyle: 'product-benefit',
      layoutMode: 'split-hero',
      sectionPlan: [
        { type: 'hero', priority: 10, required: true },
        { type: 'stats-bar', priority: 8, required: true },
        { type: 'benefits', priority: 9, required: true },
        { type: 'feature-mosaic', priority: 7, required: true },
        { type: 'testimonial', priority: 7, required: true },
        { type: 'pricing', priority: 6, required: false },
        { type: 'faq', priority: 5, required: false },
        { type: 'cta', priority: 10, required: true },
        { type: 'footer', priority: 1, required: true }
      ],
      conversionPath: {
        primary: ad.ctaSignals?.[0] || 'Start Free Trial',
        secondary: 'Schedule Demo'
      },
      confidence: 0.85
    };
  }
  
  // Food/restaurant → campaign-first
  if (category === 'Food & Dining') {
    return {
      narrativeStyle: 'campaign-first',
      layoutMode: 'campaign',
      sectionPlan: [
        { type: 'hero', priority: 10, required: true },
        { type: 'offer-banner', priority: 9, required: true },
        { type: 'menu-highlight', priority: 8, required: false },
        { type: 'benefits', priority: 7, required: true },
        { type: 'testimonial', priority: 6, required: true },
        { type: 'cta', priority: 10, required: true },
        { type: 'footer', priority: 1, required: true }
      ],
      conversionPath: {
        primary: ad.ctaSignals?.[0] || 'Order Now',
        secondary: 'View Menu'
      },
      confidence: 0.8
    };
  }
  
  // Has offer/discount → campaign style
  if (offerSignals.includes('discount') || offerSignals.includes('cashback')) {
    return {
      narrativeStyle: 'campaign-first',
      layoutMode: 'campaign',
      sectionPlan: [
        { type: 'hero', priority: 10, required: true },
        { type: 'offer-banner', priority: 10, required: true },
        { type: 'benefits', priority: 8, required: true },
        { type: 'testimonial', priority: 6, required: true },
        { type: 'faq', priority: 5, required: false },
        { type: 'cta', priority: 10, required: true },
        { type: 'footer', priority: 1, required: true }
      ],
      conversionPath: {
        primary: ad.ctaSignals?.[0] || 'Claim Offer',
        secondary: 'Learn More'
      },
      confidence: 0.8
    };
  }
  
  // Default → standard conversion
  return {
    narrativeStyle: 'product-benefit',
    layoutMode: 'hero-stats-features-cta',
    sectionPlan: [
      { type: 'hero', priority: 10, required: true },
      { type: 'stats-bar', priority: 7, required: false },
      { type: 'benefits', priority: 8, required: true },
      { type: 'testimonial', priority: 5, required: false },
      { type: 'faq', priority: 4, required: false },
      { type: 'cta', priority: 10, required: true },
      { type: 'footer', priority: 1, required: true }
    ],
    conversionPath: {
      primary: ad.ctaSignals?.[0] || 'Get Started',
      secondary: 'Learn More'
    },
    confidence: 0.7
  };
}