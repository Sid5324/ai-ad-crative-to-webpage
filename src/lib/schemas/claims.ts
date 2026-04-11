import { z } from 'zod';

export const ClaimSchema = z.object({
  text: z.string(),
  source: z.enum(['ad', 'url', 'derived']),
  evidence: z.string().default(''),
  numeric: z.boolean().default(false),
  allowed: z.boolean().default(true),
});

export type Claim = z.infer<typeof ClaimSchema>;