// packages/orchestrator/schemas.ts - Strict TypeScript schema layer with Zod
import { z } from 'zod';

// ============== Helper Schemas ==============

const TEMPLATE_LEAK_PATTERNS = [
  /^business\s+name$/i,
  /^company\s+name$/i,
  /^brand\s+name$/i,
  /^get\s+started$/i,
  /^learn\s+more$/i,
  /^start\s+free\s+trial$/i,
  /^grow\s+your\s+business$/i,
  /^premium\s+service$/i,
  /^join\s+[\d,]+(\+|plus)\s+(happy\s+)?customers$/i,
];

const CODE_FENCE_PATTERN = /```(?:json|markdown|txt)?|```/;

export const HexColor = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color');

export const NonTemplateString = z.string().min(1).refine((value) => {
  const v = value.trim();
  // Check for code fences
  if (CODE_FENCE_PATTERN.test(v)) return false;
  // Check for template leaks
  if (TEMPLATE_LEAK_PATTERNS.some(p => p.test(v))) return false;
  // Check for obvious JSON leaks like ```json
  if (v.startsWith('```json') || v.startsWith('```')) return false;
  return true;
}, { message: 'Template leak or code fence detected' });

// ============== Agent Result Types ==============

export const AgentMetaSchema = z.object({
  agent: z.string(),
  model: z.string().optional(),
  latencyMs: z.number().optional(),
  fallbackUsed: z.boolean().optional(),
  retries: z.number().optional(),
  confidence: z.number().optional(),
});

export const ValidationIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().optional(),
  severity: z.enum(['info', 'warning', 'fatal']),
});

export const AgentResultSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  ok: z.boolean(),
  data: dataSchema.nullable(),
  issues: z.array(ValidationIssueSchema),
  meta: AgentMetaSchema,
  raw: z.unknown().optional(),
});

// ============== Core Domain Schemas ==============

export const BrandAnalysisSchema = z.object({
  name: NonTemplateString,
  category: z.string().min(1),
  summary: z.string().min(1),
  tone: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  url: z.string().url(),
  services: z.array(z.string()).default([]),
  target_audience: z.string().optional(),
  business_type: z.string().optional(),
});

export const AdAnalysisSchema = z.object({
  angle: NonTemplateString,
  audience: z.array(NonTemplateString).min(1),
  offer: z.string().optional(),
  visualCues: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
});

export const PageStrategySchema = z.object({
  pageType: z.enum(['landing', 'service', 'leadgen', 'campaign']),
  audience: NonTemplateString,
  desiredAction: NonTemplateString,
  narrative_angle: z.string().optional(),
  sectionPlan: z.array(z.object({
    id: z.string(),
    goal: z.string(),
    priority: z.number().min(1).max(10),
  })).min(3),
});

// ============== Design Schemas ==============

export const DesignTokensSchema = z.object({
  theme_name: NonTemplateString,
  colors: z.object({
    primary: HexColor,
    secondary: HexColor,
    background: HexColor,
    surface: HexColor,
    text: HexColor,
  }),
  typography: z.object({
    display_font: z.string().min(1),
    body_font: z.string().min(1),
  }),
  cta: z.object({
    primary_label: z.string().optional(),
  }).optional(),
});

// ============== Copy Schemas ==============

export const HeroSchema = z.object({
  eyebrow: z.string().min(1),
  headline: NonTemplateString,
  subheadline: NonTemplateString,
  primary_cta: NonTemplateString,
  secondary_cta: z.string().min(1).optional(),
});

export const BenefitSchema = z.object({
  title: NonTemplateString,
  description: NonTemplateString,
  icon: z.string().optional(),
});

export const StatSchema = z.object({
  label: NonTemplateString,
  value: z.string().min(1),
});

export const FAQSchema = z.object({
  question: NonTemplateString,
  answer: z.string().min(1),
});

export const CopySpecSchema = z.object({
  hero: HeroSchema,
  benefits: z.array(BenefitSchema).min(1),
  stats: z.array(StatSchema).min(1),
  faq: z.array(FAQSchema).default([]),
});

// ============== Final Page Spec ==============

export const FinalPageSpecSchema = z.object({
  brand: BrandAnalysisSchema,
  hero: HeroSchema,
  benefits: z.array(BenefitSchema).min(1),
  stats: z.array(StatSchema).min(1),
  faq: z.array(FAQSchema).default([]),
  design: DesignTokensSchema,
});

// ============== Type Exports ==============

export type BrandAnalysis = z.infer<typeof BrandAnalysisSchema>;
export type AdAnalysis = z.infer<typeof AdAnalysisSchema>;
export type PageStrategy = z.infer<typeof PageStrategySchema>;
export type DesignTokens = z.infer<typeof DesignTokensSchema>;
export type CopySpec = z.infer<typeof CopySpecSchema>;
export type FinalPageSpec = z.infer<typeof FinalPageSpecSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

// ============== Safe Parse Functions ==============

export function parseBrandAnalysis(input: unknown): BrandAnalysis {
  return BrandAnalysisSchema.parse(input);
}

export function parseAdAnalysis(input: unknown): AdAnalysis {
  return AdAnalysisSchema.parse(input);
}

export function parsePageStrategy(input: unknown): PageStrategy {
  return PageStrategySchema.parse(input);
}

export function parseDesignTokens(input: unknown): DesignTokens {
  return DesignTokensSchema.parse(input);
}

export function parseCopySpec(input: unknown): CopySpec {
  return CopySpecSchema.parse(input);
}

export function parseFinalPageSpec(input: unknown): FinalPageSpec {
  return FinalPageSpecSchema.parse(input);
}

// ============== Soft Try Parse (doesn't throw) ==============

export function tryParseBrandAnalysis(input: unknown): { success: boolean; data?: BrandAnalysis; error?: string } {
  try { return { success: true, data: BrandAnalysisSchema.parse(input) }; 
  } catch (e) { return { success: false, error: String(e) }; }
}

export function tryParseCopySpec(input: unknown): { success: boolean; data?: CopySpec; error?: string } {
  try { return { success: true, data: CopySpecSchema.parse(input) }; 
  } catch (e) { return { success: false, error: String(e) }; }
}

export function tryParseDesignTokens(input: unknown): { success: boolean; data?: DesignTokens; error?: string } {
  try { return { success: true, data: DesignTokensSchema.parse(input) }; 
  } catch (e) { return { success: false, error: String(e) }; }
}