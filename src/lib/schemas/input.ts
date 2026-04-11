import { z } from 'zod';

export const GenerateInputSchema = z.object({
  adInputType: z.enum(['image_url', 'copy']),
  adInputValue: z.string().min(1),
  targetUrl: z.string().url(),
  audienceOverride: z.string().optional(),
  toneOverride: z.string().optional(),
});

export type GenerateInput = z.infer<typeof GenerateInputSchema>;