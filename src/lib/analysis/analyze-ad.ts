import { aiClient } from '@/lib/ai/client';
import { extractJson } from '@/lib/ai/json';
import { AD_ANALYZER_PROMPT } from '@/lib/ai/prompts';
import { AdAnalysisSchema, type AdAnalysis } from '@/lib/schemas/ad';

type AnalyzeAdInput = {
  adInputType: 'image_url' | 'copy';
  adInputValue: string;
  audienceOverride?: string;
  brandOverride?: string;
  urlContext?: {
    brandName?: string;
    audience?: string;
    heroHeadline?: string;
    ctas?: string[];
    tone?: string;
  };
};

export async function analyzeAd(input: AnalyzeAdInput): Promise<AdAnalysis> {
  const safePrompt = buildStringPrompt(input);

  try {
    const response = await aiClient.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama3-70b-8192',
      messages: [
        {
          role: 'user',
          content: safePrompt,
        },
      ],
      temperature: 0.2,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const parsed = AdAnalysisSchema.parse(extractJson(text));

    return normalizeAdAnalysis(parsed, input);
  } catch (error) {
    console.error('analyzeAd failed, using safe fallback:', error);
    return fallbackAdAnalysis(input);
  }
}

function buildStringPrompt(input: AnalyzeAdInput): string {
  const brand = input.brandOverride || input.urlContext?.brandName || 'Unknown';
  const audience = input.audienceOverride || input.urlContext?.audience || 'unknown';
  const ctas = input.urlContext?.ctas?.join(', ') || '';
  const hero = input.urlContext?.heroHeadline || '';
  const tone = input.urlContext?.tone || '';

  if (input.adInputType === 'copy') {
    return `
${AD_ANALYZER_PROMPT}

Analyze this advertisement copy and return JSON only.

Context:
- Brand hint: ${brand}
- Audience hint: ${audience}
- Website hero hint: ${hero}
- Website CTA hints: ${ctas}
- Tone hint: ${tone}

Ad copy:
${input.adInputValue}
`.trim();
  }

  return `
${AD_ANALYZER_PROMPT}

Analyze this advertisement from its image URL and surrounding context.
Important:
- You may NOT be able to inspect the image pixels directly.
- Infer only from the ad URL string, brand context, and website context.
- Do NOT invent specific visual claims unless strongly implied.
- Return JSON only.

Context:
- Brand hint: ${brand}
- Audience hint: ${audience}
- Website hero hint: ${hero}
- Website CTA hints: ${ctas}
- Tone hint: ${tone}

Ad image URL:
${input.adInputValue}
`.trim();
}

function normalizeAdAnalysis(parsed: AdAnalysis, input: AnalyzeAdInput): AdAnalysis {
  const brand = input.brandOverride || input.urlContext?.brandName || parsed.brand || 'Unknown';
  const audience =
    normalizeAudience(input.audienceOverride || input.urlContext?.audience || parsed.audience);

  return {
    ...parsed,
    brand,
    audience,
    adType: input.adInputType === 'image_url' ? 'image' : 'copy',
    primaryHook:
      parsed.primaryHook ||
      input.urlContext?.heroHeadline ||
      'Discover a better option tailored to your needs',
    primaryCTA:
      parsed.primaryCTA ||
      input.urlContext?.ctas?.[0] ||
      'Learn More',
    confidence: parsed.confidence ?? 0.6,
  };
}

function fallbackAdAnalysis(input: AnalyzeAdInput): AdAnalysis {
  const brand = input.brandOverride || input.urlContext?.brandName || 'Unknown';
  const audience = normalizeAudience(input.audienceOverride || input.urlContext?.audience || 'unknown');

  return {
    brand,
    audience,
    adType: input.adInputType === 'image_url' ? 'image' : 'copy',
    primaryHook:
      input.adInputType === 'copy'
        ? truncate(input.adInputValue, 120)
        : input.urlContext?.heroHeadline || `Explore ${brand}`,
    supportingLines: [],
    primaryCTA: input.urlContext?.ctas?.[0] || 'Learn More',
    offer: '',
    proofPoints: [],
    benefits: [],
    visualCues: input.adInputType === 'image_url' ? ['image-url-input'] : [],
    extractedText: input.adInputType === 'copy' ? [truncate(input.adInputValue, 240)] : [],
    riskReducers: [],
    confidence: 0.45,
  };
}

function normalizeAudience(value: string | undefined): AdAnalysis['audience'] {
  const val = (value || 'unknown').toLowerCase().trim();

  if (val.includes('merchant')) return 'merchant';
  if (val.includes('consumer')) return 'consumer';
  if (val.includes('b2b')) return 'b2b';
  if (val.includes('saas')) return 'saas';
  if (val.includes('local-business')) return 'local-business';

  return 'unknown';
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}