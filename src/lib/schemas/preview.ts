import { z } from 'zod';
import { AdAnalysisSchema } from './ad';
import { UrlAnalysisSchema } from './url';
import { MessagePlanSchema } from './plan';
import { LandingPageSpecSchema } from './spec';
import { ValidationReportSchema } from './validation';
import { ClaimSchema } from './claims';

export const PreviewRecordSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  adAnalysis: AdAnalysisSchema,
  urlAnalysis: UrlAnalysisSchema,
  claims: z.array(ClaimSchema),
  plan: MessagePlanSchema,
  spec: LandingPageSpecSchema,
  report: ValidationReportSchema,
});

export type PreviewRecord = z.infer<typeof PreviewRecordSchema>;

export const GenerateResponseSchema = z.object({
  success: z.boolean(),
  previewId: z.string().optional(),
  report: ValidationReportSchema.optional(),
  debug: z.any().optional(),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;