import { z } from 'zod';

// 🚨 BULLETPROOF AUDIENCE NORMALIZATION
function normalizeAudience(val: any): string {
  if (!val) return 'unknown';

  const str = val.toString().toLowerCase().trim();
  const valid = ['merchant', 'consumer', 'b2b', 'saas', 'local-business', 'unknown'];

  // Handle malformed responses like "consumer|merchant|b2b"
  if (str.includes('|')) {
    const first = str.split('|')[0].trim();
    return valid.includes(first) ? first : 'unknown';
  }

  // Find first valid match
  return valid.find(v => str.includes(v)) || 'unknown';
}

export const UrlAnalysisSchema = z.object({
  url: z.string().url(),
  brandName: z.string(),
  pageType: z.enum(['homepage', 'merchant', 'product', 'pricing', 'signup', 'blog', 'unknown']),
  audience: z.union([
    z.enum(['merchant', 'consumer', 'b2b', 'saas', 'local-business', 'unknown']),
    z.string().transform(normalizeAudience)
  ]).default('unknown'),
  pageTitle: z.string().default(''),
  metaDescription: z.string().default(''),
  heroHeadline: z.string().default(''),
  heroSubheadline: z.string().default(''),
  ctas: z.array(z.string()).default([]),
  valueProps: z.array(z.string()).default([]),
  proofPoints: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  faqTopics: z.array(z.string()).default([]),
  rawExtracts: z.array(z.string()).default([]),
  tone: z.string().default(''),
});

export type UrlAnalysis = z.infer<typeof UrlAnalysisSchema>;