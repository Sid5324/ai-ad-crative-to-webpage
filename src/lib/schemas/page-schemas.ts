// src/lib/schemas/page-schemas.ts - Strict schemas for landing page generation
import { z } from 'zod';

// ========== SAFE STRING VALIDATORS ==========
const NonEmptyString = z.string().min(1).max(100);
const SafeString = z.string().min(1).max(200).refine((s) => {
  const lower = s.toLowerCase();
  return ![
    'business name', 'company name', 'brand name', 'get started',
    'learn more', 'join us', 'premium service', 'trusted by thousands',
    'industry-leading', 'bank-grade'
  ].includes(lower);
});

// ========== CONTROLLED TAXONOMY ==========
const CategoryEnum = z.enum([
  'fintech', 'food_delivery', 'transportation', 'saas', 'ecommerce',
  'healthcare', 'education', 'travel', 'real_estate', 'media',
  'hospitality', 'legal', 'beauty', 'fitness', 'automotive',
  'insurance', 'logistics', 'marketplace', 'professional_services', 'other'
]);

// ========== BRAND IDENTITY ==========
export const BrandIdentitySchema = z.object({
  canonicalName: SafeString,
  shortName: z.string().min(1).max(30),
  domain: z.string().url(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()).min(1)
});

// ========== CATEGORY CLASSIFICATION ==========
export const CategoryResultSchema = z.object({
  primary: CategoryEnum,
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()).min(1)
});

// ========== PAGE SPECIFICATION ==========
export const PageSpecSchema = z.object({
  brand: BrandIdentitySchema,
  category: CategoryResultSchema,
  hero: z.object({
    eyebrow: SafeString,
    headline: SafeString,
    subheadline: SafeString,
    primaryCta: SafeString,
    secondaryCta: z.string().optional()
  }),
  stats: z.array(z.object({
    label: SafeString,
    value: SafeString
  })).min(2).max(6),
  benefits: z.array(z.object({
    title: SafeString,
    description: SafeString
  })).min(3),
  trustSignals: z.array(SafeString).optional(),
  designTokens: z.object({
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    surfaceColor: z.string().regex(/^#[0-9a-fA-F]{6}$/)
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