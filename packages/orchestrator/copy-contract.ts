// packages/orchestrator/copy-contract.ts - Strict copy schema contract
import { z } from 'zod';

// ============== Helpers ==============

const NonEmpty = z.string().trim().min(1);

const TEMPLATE_PATTERNS = [
  'business name',
  'brand name', 
  'company name',
  'get started',
  'learn more',
  'start free trial',
  'grow your business',
  'premium service',
];

const NonGeneric = NonEmpty.refine((v) => {
  const x = v.toLowerCase();
  // Check for template leaks
  if (TEMPLATE_PATTERNS.some(p => x === p)) return false;
  // Check for code fences
  if (x.includes('```')) return false;
  return true;
}, { message: 'Generic placeholder or code fence detected' });

// ============== Copy Schema ==============

export const CopySchema = z.object({
  hero: z.object({
    eyebrow: z.string().trim().min(1).max(60),
    headline: z.string().trim().min(10).max(120),
    subheadline: z.string().trim().min(10).max(240),
    primary_cta: z.string().trim().min(2).max(40),
    secondary_cta: z.string().trim().min(2).max(40).optional()
  }),
  benefits: z.array(z.object({
    title: z.string().trim().min(3).max(60),
    description: z.string().trim().min(10).max(180),
    icon: z.string().max(40).optional()
  })).min(3).max(6),
  stats: z.array(z.object({
    label: z.string().trim().min(1).max(40),
    value: z.string().trim().min(1).max(30)
  })).min(3).max(6),
  faq: z.array(z.object({
    question: z.string().trim().min(10).max(120),
    answer: z.string().trim().min(10).max(240)
  })).min(2).max(6)
});

export type CopySpec = z.infer<typeof CopySchema>;

// ============== Parse Functions ==============

export function parseCopySpec(input: unknown): CopySpec {
  return CopySchema.parse(input);
}

export function tryParseCopySpec(input: unknown): { success: boolean; data?: CopySpec; error?: string } {
  try {
    return { success: true, data: CopySchema.parse(input) };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}