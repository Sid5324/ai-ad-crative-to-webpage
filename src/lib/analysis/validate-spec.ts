import { aiClient } from '@/lib/ai/client';
import { extractJson } from '@/lib/ai/json';
import { VALIDATOR_PROMPT } from '@/lib/ai/prompts';
import { ValidationReportSchema, type ValidationReport } from '@/lib/schemas/validation';
import type { LandingPageSpec } from '@/lib/schemas/spec';
import type { AdAnalysis } from '@/lib/schemas/ad';
import type { UrlAnalysis } from '@/lib/schemas/url';
import type { Claim } from '@/lib/schemas/claims';

export async function validateSpec(
  spec: LandingPageSpec,
  adAnalysis: AdAnalysis,
  urlAnalysis: UrlAnalysis,
  claims: Claim[]
): Promise<ValidationReport> {
  const response = await aiClient.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'user',
        content: `${VALIDATOR_PROMPT}
Spec:
${JSON.stringify(spec, null, 2)}

Ad Analysis:
${JSON.stringify(adAnalysis, null, 2)}

URL Analysis:
${JSON.stringify(urlAnalysis, null, 2)}

Claims:
${JSON.stringify(claims, null, 2)}
`,
      },
    ],
    temperature: 0.1,
  });

  const text = response.choices[0]?.message?.content || '{}';
  return ValidationReportSchema.parse(extractJson(text));
}