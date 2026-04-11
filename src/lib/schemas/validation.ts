import { z } from 'zod';

export const ValidationIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  message: z.string(),
  fix: z.string(),
});

export const ValidationReportSchema = z.object({
  valid: z.boolean(),
  audienceMatch: z.boolean(),
  ctaMatch: z.boolean(),
  claimSafety: z.boolean(),
  brandFit: z.boolean(),
  issues: z.array(ValidationIssueSchema).default([]),
});

export type ValidationReport = z.infer<typeof ValidationReportSchema>;