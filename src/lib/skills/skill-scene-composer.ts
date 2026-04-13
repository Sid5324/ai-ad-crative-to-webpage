// src/lib/skills/skill-scene-composer.ts - Scene-Based Page Composer
// Composes pages as scenes, not generic sections
import { Brand, VoiceCopy, DesignDirection } from '../schemas/skill-schemas';
import type { BrandVisualDNA } from './skill-brand-art-director';

interface SectionBlueprint {
  id: string;
  composition: string;
  interactionHint: string;
  visualMood: string;
  priority: number;
}

interface PageBlueprint {
  hero: SectionBlueprint;
  sections: SectionBlueprint[];
  cta: SectionBlueprint;
}

// Generate CRED-specific page blueprint (from live site analysis)
function getCredBlueprint(): PageBlueprint {
  return {
    hero: {
      id: 'hero',
      composition: 'asymmetric-pedestal',
      interactionHint: 'reflection-card',
      visualMood: 'dramatic-exclusive',
      priority: 10
    },
    sections: [
      {
        id: 'exclusivity-strip',
        composition: 'spotlight-frame',
        interactionHint: 'score visualization',
        visualMood: 'cold-trust',
        priority: 9
      },
      {
        id: 'rewards-spotlight',
        composition: 'dominant-payoff',
        interactionHint: 'rich-number-treatment',
        visualMood: 'warm-reward',
        priority: 8
      },
      {
        id: 'benefits-mosaic',
        composition: 'masonry-mixed',
        interactionHint: 'hover-lift',
        visualMood: 'editorial',
        priority: 7
      },
      {
        id: 'trust-quiet',
        composition: 'cold-data',
        interactionHint: 'minimal-reveal',
        visualMood: 'reserved',
        priority: 6
      }
    ],
    cta: {
      id: 'club-cta',
      composition: 'strong-frame',
      interactionHint: 'pulse-button',
      visualMood: 'exclusive-urgency',
      priority: 10
    }
  };
}

function getPremiumBlueprint(): PageBlueprint {
  return {
    hero: {
      id: 'hero',
      composition: 'split-center',
      interactionHint: 'depth-reveal',
      visualMood: 'premium',
      priority: 10
    },
    sections: [
      {
        id: 'trust-bar',
        composition: 'pill-row',
        interactionHint: 'fade-in',
        visualMood: 'trust',
        priority: 8
      },
      {
        id: 'features',
        composition: 'card-grid',
        interactionHint: 'hover-lift',
        visualMood: 'clean',
        priority: 7
      },
      {
        id: 'social-proof',
        composition: 'carousel',
        interactionHint: 'slide',
        visualMood: 'social',
        priority: 6
      }
    ],
    cta: {
      id: 'cta',
      composition: 'centered',
      interactionHint: 'pulse',
      visualMood: 'direct',
      priority: 10
    }
  };
}

function getEcommerceBlueprint(): PageBlueprint {
  return {
    hero: {
      id: 'hero',
      composition: 'full-width',
      interactionHint: 'parallax',
      visualMood: 'vibrant',
      priority: 10
    },
    sections: [
      {
        id: 'products',
        composition: 'masonry',
        interactionHint: 'quick-view',
        visualMood: 'shopping',
        priority: 9
      },
      {
        id: 'promo',
        composition: 'banner',
        interactionHint: 'countdown',
        visualMood: 'urgent',
        priority: 8
      },
      {
        id: 'testimonials',
        composition: 'scroll',
        interactionHint: 'auto-play',
        visualMood: 'social',
        priority: 5
      }
    ],
    cta: {
      id: 'cta',
      composition: 'floating',
      interactionHint: 'reveal-on-scroll',
      visualMood: 'shopping',
      priority: 10
    }
  };
}

export function runSceneComposer(
  brand: Brand,
  copy: VoiceCopy,
  design: DesignDirection,
  dna: BrandVisualDNA
): PageBlueprint {
  console.log('[SceneComposer] Composing page blueprint...');
  
  const brandName = brand.name.toLowerCase();
  const category = brand.category;
  
  // CRED gets special scene composition
  if (brandName.includes('cred') || category === 'Finance') {
    return getCredBlueprint();
  }
  
  // Premium brands
  if (dna.artDirection?.layoutStyle === 'product-premium') {
    return getPremiumBlueprint();
  }
  
  // Default
  return getPremiumBlueprint();
}

// Generate refined copy based on blueprint
export function refineCopyForBlueprint(
  copy: VoiceCopy,
  blueprint: PageBlueprint,
  dna: BrandVisualDNA
): VoiceCopy {
  let refined = { ...copy };
  
  // CRED-specific copy overrides
  if (blueprint.hero.id === 'hero' && blueprint.hero.composition === 'asymmetric-pedestal') {
    // Replace hero headline if too generic
    if (refined.hero?.headline?.includes('Pay on Time')) {
      refined.hero = {
        ...refined.hero,
        eyebrow: 'Exclusive Membership',
        headline: 'crafted for the creditworthy',
        subheadline: 'not everyone gets it. unlock members-only rewards.'
      };
    }
    
    // Replace generic benefits section title
    if (refined.benefits?.[0]?.title?.includes('Choose')) {
      refined.benefits = refined.benefits.map(b => ({
        title: b.title,
        description: b.description
      }));
      // Add CRED-specific first benefit
      if (refined.benefits.length > 0) {
        refined.benefits[0].title = 'unlock cashback';
        refined.benefits[0].description = 'Earn real cashback on every transaction, credited monthly to your account.';
      }
    }
    
    // Replace CTA section title
    if (refined.finalCta?.headline?.includes('Ready')) {
      refined.finalCta = {
        headline: 'make it to the club',
        subheadline: 'join India\'s most exclusive rewards club.',
        button: 'Apply Now'
      };
    }
  }
  
  return refined;
}

export type { PageBlueprint, SectionBlueprint };