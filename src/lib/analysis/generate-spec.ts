import { aiClient } from '@/lib/ai/client';
import { extractJson } from '@/lib/ai/json';
import { SPEC_GENERATOR_PROMPT } from '@/lib/ai/prompts';
import { LandingPageSpecSchema, type LandingPageSpec } from '@/lib/schemas/spec';
import type { AdAnalysis } from '@/lib/schemas/ad';
import type { UrlAnalysis } from '@/lib/schemas/url';
import type { MessagePlan } from '@/lib/schemas/plan';

export async function generateSpec(
  adAnalysis: AdAnalysis,
  urlAnalysis: UrlAnalysis,
  plan: MessagePlan
): Promise<LandingPageSpec> {
  // Use the brand from adAnalysis (now properly set in route.ts)
  const brandName = adAnalysis.brand || 'Your Business';

  const prompt = SPEC_GENERATOR_PROMPT(brandName, urlAnalysis, adAnalysis);

  const response = await aiClient.chat.completions.create({
    model: 'llama-3.1-70b-versatile', // Better model
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.1, // Lower for more consistent results
    max_tokens: 2000, // Allow more content
  });

  const text = response.choices[0]?.message?.content || '{}';
  console.log('🤖 Spec generation response:', text.substring(0, 200) + '...');

  const parsed = LandingPageSpecSchema.parse(extractJson(text));

  // Force brand into the result
  parsed.brand = brandName;
  parsed.audience = urlAnalysis.audience as any;

  return parsed;
}