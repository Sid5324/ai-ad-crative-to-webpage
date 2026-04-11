import { aiClient } from '@/lib/ai/client';
import { extractJson } from '@/lib/ai/json';
import { PLANNER_PROMPT } from '@/lib/ai/prompts';
import { MessagePlanSchema, type MessagePlan } from '@/lib/schemas/plan';
import type { AdAnalysis } from '@/lib/schemas/ad';
import type { UrlAnalysis } from '@/lib/schemas/url';
import type { Claim } from '@/lib/schemas/claims';

export async function planPage(
  adAnalysis: AdAnalysis,
  urlAnalysis: UrlAnalysis,
  claims: Claim[]
): Promise<MessagePlan> {
  const response = await aiClient.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'user',
        content: `${PLANNER_PROMPT}
Ad Analysis:
${JSON.stringify(adAnalysis, null, 2)}

URL Analysis:
${JSON.stringify(urlAnalysis, null, 2)}

Claims:
${JSON.stringify(claims, null, 2)}
`,
      },
    ],
    temperature: 0.2,
  });

  const text = response.choices[0]?.message?.content || '{}';
  return MessagePlanSchema.parse(extractJson(text));
}