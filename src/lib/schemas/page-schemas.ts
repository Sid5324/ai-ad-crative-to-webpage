// src/lib/schemas/page-schemas.ts - Lenient schemas for landing page generation
import { z } from 'zod';

// ========== STRING VALIDATORS WITH DEFAULTS ==========
const SafeString = z.string().transform((s) => s || 'Value');
const NonEmptyString = z.string().min(1).max(100);

// ========== CONTROLLED TAXONOMY ==========
const CategoryEnum = z.enum([
  'fintech', 'food_delivery', 'transportation', 'saas', 'ecommerce',
  'healthcare', 'education', 'travel', 'real_estate', 'media',
  'hospitality', 'legal', 'beauty', 'fitness', 'automotive',
  'insurance', 'logistics', 'marketplace', 'professional_services', 'other'
]);

// ========== BRAND IDENTITY (LENIENT) ==========
export const BrandIdentitySchema = z.object({
  canonicalName: z.string().default('Brand'),
  shortName: z.string().default('Brand'),
  domain: z.string().default('https://example.com'),
  confidence: z.number().default(0.5),
  evidence: z.array(z.string()).default(['inferred'])
});

// ========== CATEGORY CLASSIFICATION (LENIENT) ==========
export const CategoryResultSchema = z.object({
  primary: CategoryEnum.default('other'),
  confidence: z.number().default(0.5),
  evidence: z.array(z.string()).default(['inferred'])
});

// ========== PAGE SPECIFICATION ==========
export const PageSpecSchema = z.object({
  brand: BrandIdentitySchema,
  category: CategoryResultSchema,
  hero: z.object({
    eyebrow: z.string().default('Welcome'),
    headline: z.string().default('Your Headline'),
    subheadline: z.string().default('Your subheadline here'),
    primaryCta: z.string().default('Get Started'),
    secondaryCta: z.string().optional()
  }),
  stats: z.array(z.object({
    label: z.string().default('Stat'),
    value: z.string().default('Value')
  })).default([
    { label: 'Customers', value: '10K+' },
    { label: 'Experience', value: '5+' },
    { label: 'Rating', value: '4.8★' }
  ]),
  benefits: z.array(z.object({
    title: z.string().default('Benefit'),
    description: z.string().default('Description')
  })).default([
    { title: 'Quality Service', description: 'We deliver exceptional quality.' },
    { title: 'Expert Team', description: 'Experienced professionals.' },
    { title: 'Customer First', description: 'Your satisfaction is priority.' }
  ]),
  trustSignals: z.array(z.string()).default(['Licensed', 'Insured']),
  designTokens: z.object({
    primaryColor: z.string().default('#1E293B'),
    backgroundColor: z.string().default('#FFFFFF'),
    surfaceColor: z.string().default('#F8FAFC')
  })
});

export type BrandIdentity = z.infer<typeof BrandIdentitySchema>;
export type CategoryResult = z.infer<typeof CategoryResultSchema>;
export type PageSpec = z.infer<typeof PageSpecSchema>;

// ========== UTILITY FUNCTIONS ==========
export function safeLower(v: unknown): string {
  return typeof v === 'string' ? v.toLowerCase() : '';
}

export function looksLikeTagline(name?: string): boolean {
  if (!name) return true;
  const n = name.trim();
  return (
    n.length > 45 ||
    / in [A-Z][a-z]+,/.test(n) ||
    /service|solutions|experience|welcome|official|professional/i.test(n)
  );
}