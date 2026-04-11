import { z } from 'zod';

export const AdAnalysisSchema = z.object({
  brand: z.string().default(''),
  audience: z.enum(['merchant', 'consumer', 'b2b', 'saas', 'local-business', 'unknown']),
  adType: z.enum(['image', 'video', 'copy', 'unknown']).default('unknown'),
  primaryHook: z.string().default(''),
  supportingLines: z.array(z.string()).default([]),
  primaryCTA: z.string().default(''),
  offer: z.string().default(''),
  proofPoints: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  visualCues: z.array(z.string()).default([]),
  extractedText: z.array(z.string()).default([]),
  riskReducers: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type AdAnalysis = z.infer<typeof AdAnalysisSchema>;