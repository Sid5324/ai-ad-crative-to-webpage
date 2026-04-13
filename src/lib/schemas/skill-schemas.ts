// src/lib/schemas/skill-schemas.ts - Zod schemas for all 9 skills
import { z } from 'zod';

// ============================================================================
// SKILL 1: BRAND NORMALIZER
// ============================================================================

export const BrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  tagline: z.string().optional().default(''),
  category: z.string().min(2, 'Category must be specified'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  audience: z.enum(['consumer', 'merchant', 'b2b']).default('consumer'),
  tone: z.array(z.string()).min(1).max(3),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    light: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    dark: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
  }),
  confidence: z.number().min(0).max(1)
});

export type Brand = z.infer<typeof BrandSchema>;

// ============================================================================
// SKILL 2: AD VISION READER
// ============================================================================

export const AdVisionSchema = z.object({
  status: z.enum(['ok', 'unavailable']),
  visualMood: z.array(z.string()).default([]),
  imageryType: z.enum(['product', 'lifestyle', 'abstract', 'text-led', 'mixed']).optional(),
  offerSignals: z.array(z.string()).default([]),
  audienceSignals: z.array(z.string()).default([]),
  ctaSignals: z.array(z.string()).default([]),
  claimSignals: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1)
});

export type AdVision = z.infer<typeof AdVisionSchema>;

// ============================================================================
// SKILL 3: PAGE STRATEGIST
// ============================================================================

export const PageStrategySchema = z.object({
  narrativeStyle: z.enum([
    'editorial-premium',
    'product-benefit',
    'trust-heavy-fintech',
    'campaign-first',
    'invite-only-scarcity',
    'social-proof'
  ]),
  layoutMode: z.enum([
    'hero-stats-features-cta',
    'split-hero',
    'centered-hero',
    'asymmetric',
    'dark-premium',
    'campaign'
  ]),
  sectionPlan: z.array(z.object({
    type: z.string(),
    priority: z.number().min(1).max(10),
    required: z.boolean().default(false)
  })).min(3),
  conversionPath: z.object({
    primary: z.string(),
    secondary: z.string().optional()
  }),
  confidence: z.number().min(0).max(1)
});

export type PageStrategy = z.infer<typeof PageStrategySchema>;

// ============================================================================
// SKILL 4: VOICE COPYWRITER
// ============================================================================

export const VoiceCopySchema = z.object({
  hero: z.object({
    eyebrow: z.string().min(1).max(50),
    headline: z.string().min(10).max(120),
    subheadline: z.string().min(20).max(200),
    primaryCta: z.string().min(2).max(30),
    secondaryCta: z.string().optional()
  }),
  proofBar: z.array(z.string()).length(3),
  benefits: z.array(z.object({
    title: z.string().min(3).max(60),
    description: z.string().min(20).max(150)
  })).min(3).max(4),
  trustSection: z.object({
    headline: z.string().min(10).max(80),
    points: z.array(z.string()).min(3).max(4)
  }).optional(),
  faq: z.array(z.object({
    question: z.string().min(10).max(100),
    answer: z.string().min(20).max(200)
  })).default([]),
  finalCta: z.object({
    headline: z.string().min(10).max(80),
    subheadline: z.string().min(10).max(100),
    button: z.string().min(2).max(30)
  }),
  voice: z.string(),
  locale: z.string().default('en-IN')
});

export type VoiceCopy = z.infer<typeof VoiceCopySchema>;

// ============================================================================
// SKILL 5: DESIGN DIRECTOR
// ============================================================================

export const DesignDirectionSchema = z.object({
  artDirection: z.enum([
    'minimal-luxury',
    'editorial-premium',
    'fintech-dark-elegant',
    'fintech-premium',
    'cred-bold',
    'high-contrast-campaign',
    'playful-modern',
    'clean-saas'
  ]),
  palette: z.object({
    bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
  }),
  typography: z.object({
    display: z.string(),
    body: z.string(),
    scale: z.enum(['compact', 'balanced', 'dramatic'])
  }),
  layout: z.object({
    heroStyle: z.enum(['split', 'centered', 'asymmetric']),
    sectionSpacing: z.enum(['tight', 'balanced', 'airy']),
    cardStyle: z.enum(['flat', 'soft', 'glass', 'outlined'])
  }),
  motion: z.object({
    intensity: z.enum(['none', 'subtle', 'premium']),
    style: z.enum(['fade', 'slide', 'parallax', 'micro'])
  }),
  density: z.enum(['compact', 'comfortable', 'spacious'])
});

export type DesignDirection = z.infer<typeof DesignDirectionSchema>;

// ============================================================================
// SKILL 6: COMPONENT COMPOSER
// ============================================================================

export const ComponentSchema = z.object({
  id: z.string(),
  type: z.enum([
    'hero',
    'stats-bar',
    'benefits',
    'feature-mosaic',
    'testimonial',
    'faq',
    'cta',
    'footer',
    'trust-bar'
  ]),
  props: z.record(z.any()),
  children: z.array(z.string()).optional()
});

export const ComponentTreeSchema = z.object({
  root: z.string(),
  components: z.array(ComponentSchema),
  metadata: z.object({
    generated: z.string(),
    version: z.string(),
    designRef: z.string().optional()
  })
});

export type ComponentTree = z.infer<typeof ComponentTreeSchema>;

// ============================================================================
// SKILL 7: QUALITY CRITIC
// ============================================================================

export const QAIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'fatal']),
  message: z.string(),
  field: z.string().optional(),
 修复: z.enum([
    'rewrite-hero',
    'rewrite-cta',
    'normalize-brand',
    'regenerate-design',
    'remove-unsupported-proof',
    'tighten-copy',
    'fix-grammar',
    'add-accessibility'
  ]).optional()
});

export const QASchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(QAIssueSchema),
  passed: z.boolean(),
  fatalIssues: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([])
});

export type QA = z.infer<typeof QASchema>;

// ============================================================================
// SKILL 8: REPAIR EDITOR
// ============================================================================

export const RepairActionSchema = z.object({
  target: z.enum(['brand', 'hero', 'cta', 'benefits', 'stats', 'design', 'copy']),
  action: z.enum([
    'normalize-brand',
    'rewrite-hero',
    'rewrite-cta',
    'regenerate-benefit',
    'remove-proof',
    'apply-design',
    'tighten-copy'
  ]),
  original: z.string(),
  replacement: z.string(),
  reason: z.string()
});

export const RepairSchema = z.object({
  actions: z.array(RepairActionSchema),
  success: z.boolean(),
  finalScore: z.number().min(0).max(100),
  regeneratedFields: z.array(z.string()).default([])
});

export type Repair = z.infer<typeof RepairSchema>;

// ============================================================================
// SKILL 9: CONTENT VALIDATOR (for claims, offers)
// ============================================================================

export const ClaimSchema = z.object({
  claim: z.string(),
  supported: z.boolean(),
  source: z.string().optional(),
  fallback: z.string().optional()
});

export const ValidationResultSchema = z.object({
  claims: z.array(ClaimSchema),
  hasUnsupportedClaims: z.boolean(),
  cleanedClaims: z.array(z.string())
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// ============================================================================
// COMBINED OUTPUT
// ============================================================================

export const LandingPageOutputSchema = z.object({
  success: z.boolean(),
  html: z.string().min(100),
  spec: z.object({
    brand: BrandSchema,
    ad: AdVisionSchema.optional(),
    strategy: PageStrategySchema.optional(),
    copy: VoiceCopySchema,
    design: DesignDirectionSchema
  }),
  quality: z.object({
    score: z.number().min(0).max(100),
    passed: z.boolean(),
    issues: z.array(z.object({
      code: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'fatal']),
      message: z.string()
    }))
  }),
  metadata: z.object({
    generated: z.string(),
    duration: z.number(),
    skillsUsed: z.array(z.string()),
    version: z.string()
  })
});

export type LandingPageOutput = z.infer<typeof LandingPageOutputSchema>;

// ============================================================================
// BANNED PHRASES - For QA
// ============================================================================

export const BANNED_PHRASES = [
  'premium service',
  'trusted by thousands',
  'learn more',
  'get started',
  'join today',
  'amazing experience',
  'world-class',
  'best in class',
  'top rated',
  'leading provider'
] as const;

export const BANNED_CTAS = [
  'get started',
  'learn more',
  'sign up now',
  'join now'
] as const;