import { z } from 'zod';

// 🚨 BULLETPROOF ENUM NORMALIZATION
function normalizeAudienceEnum(val: any): string {
  const valStr = (val || '').toString().toLowerCase().trim();
  const options = ['merchant', 'consumer', 'b2b', 'saas', 'local-business', 'unknown'];
  return options.find(opt => valStr.includes(opt)) || 'consumer';
}

function normalizeSectionEnum(val: any): string {
  const valStr = (val || '').toString().toLowerCase().trim();
  const options = ['hero', 'stats', 'benefits', 'features', 'proof', 'how-it-works', 'faq', 'cta'];

  // Handle human-readable responses
  if (valStr.includes('hero')) return 'hero';
  if (valStr.includes('benefit')) return 'benefits';
  if (valStr.includes('feature')) return 'features';
  if (valStr.includes('proof')) return 'proof';
  if (valStr.includes('how') || valStr.includes('work')) return 'how-it-works';
  if (valStr.includes('faq') || valStr.includes('question')) return 'faq';
  if (valStr.includes('cta') || valStr.includes('action') || valStr.includes('call')) return 'cta';
  if (valStr.includes('stat')) return 'stats';

  return options.find(opt => valStr.includes(opt)) || 'benefits';
}

function normalizeModeEnum(val: any): string {
  const valStr = (val || '').toString().toLowerCase().trim();
  const options = ['brand-grounded', 'clean-b2b', 'editorial', 'performance-landing'];

  if (valStr.includes('luxury') || valStr.includes('premium') || valStr.includes('brand')) return 'brand-grounded';
  if (valStr.includes('b2b') || valStr.includes('business') || valStr.includes('clean')) return 'clean-b2b';
  if (valStr.includes('editorial') || valStr.includes('story')) return 'editorial';
  if (valStr.includes('performance') || valStr.includes('landing') || valStr.includes('conversion')) return 'performance-landing';

  return options.find(opt => valStr.includes(opt)) || 'performance-landing';
}

function normalizeLayoutEnum(val: any): string {
  const valStr = (val || '').toString().toLowerCase().trim();
  const options = ['left-copy-right-image', 'overlay-hero', 'split', 'centered'];

  if (valStr.includes('left') || valStr.includes('copy')) return 'left-copy-right-image';
  if (valStr.includes('overlay') || valStr.includes('hero')) return 'overlay-hero';
  if (valStr.includes('split')) return 'split';
  if (valStr.includes('center') || valStr.includes('middle')) return 'centered';

  return options.find(opt => valStr.includes(opt)) || 'centered';
}

function normalizeDensityEnum(val: any): string {
  const valStr = (val || '').toString().toLowerCase().trim();
  const options = ['compact', 'balanced', 'spacious'];

  if (valStr.includes('compact') || valStr.includes('dense')) return 'compact';
  if (valStr.includes('spacious') || valStr.includes('loose') || valStr.includes('wide')) return 'spacious';
  if (valStr.includes('balanced') || valStr.includes('normal')) return 'balanced';

  return options.find(opt => valStr.includes(opt)) || 'balanced';
}

export const MessagePlanSchema = z.object({
  resolvedAudience: z.union([
    z.enum(['merchant', 'consumer', 'b2b', 'saas', 'local-business', 'unknown']),
    z.string().transform(normalizeAudienceEnum)
  ]).default('consumer'),
  pageGoal: z.string(),
  adHookToPreserve: z.array(z.string()).default([]),
  siteFactsToUse: z.array(z.string()).default([]),
  allowedClaims: z.array(z.string()).default([]),
  forbiddenClaims: z.array(z.string()).default([]),
  ctaStrategy: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    reasoning: z.string(),
  }),
  sectionOrder: z.array(
    z.union([
      z.enum(['hero', 'stats', 'benefits', 'features', 'proof', 'how-it-works', 'faq', 'cta']),
      z.string().transform(normalizeSectionEnum)
    ])
  ),
  visualDirection: z.object({
    mode: z.union([
      z.enum(['brand-grounded', 'clean-b2b', 'editorial', 'performance-landing']),
      z.string().transform(normalizeModeEnum)
    ]),
    layout: z.union([
      z.enum(['left-copy-right-image', 'overlay-hero', 'split', 'centered']),
      z.string().transform(normalizeLayoutEnum)
    ]),
    paletteHint: z.array(z.string()).default([]),
    density: z.union([
      z.enum(['compact', 'balanced', 'spacious']),
      z.string().transform(normalizeDensityEnum)
    ]),
  }),
});

export type MessagePlan = z.infer<typeof MessagePlanSchema>;