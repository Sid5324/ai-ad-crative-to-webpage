import { z } from 'zod';

export const CTAItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  style: z.enum(['primary', 'secondary', 'ghost']).default('primary'),
});

export const SectionItemSchema = z.object({
  title: z.string(),
  body: z.string(),
  meta: z.string().optional(),
});

export const SectionSchema = z.object({
  type: z.enum(['hero', 'stats', 'benefits', 'features', 'proof', 'how-it-works', 'faq', 'cta']),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  items: z.array(SectionItemSchema).default([]),
});

export const LandingPageSpecSchema = z.object({
  brand: z.string(),
  audience: z.enum(['merchant', 'consumer', 'b2b', 'saas', 'local-business', 'unknown']),
  pageGoal: z.string(),
  theme: z.object({
    mode: z.enum(['brand-grounded', 'clean-b2b', 'editorial', 'performance-landing']),
    palette: z.array(z.string()).default([]),
    background: z.enum(['light', 'dark', 'brand']).default('light'),
    heroLayout: z.enum(['left-copy-right-image', 'overlay-hero', 'split', 'centered']),
  }),
  hero: z.object({
    eyebrow: z.string().optional(),
    headline: z.string(),
    subheadline: z.string(),
    primaryCTA: CTAItemSchema,
    secondaryCTA: CTAItemSchema.optional(),
  }),
  stats: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    })
  ).default([]),
  sections: z.array(SectionSchema).default([]),
  faq: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).default([]),
  closingCTA: z.object({
    headline: z.string(),
    body: z.string(),
    primaryCTA: CTAItemSchema,
    secondaryCTA: CTAItemSchema.optional(),
  }),
});

export type LandingPageSpec = z.infer<typeof LandingPageSpecSchema>;