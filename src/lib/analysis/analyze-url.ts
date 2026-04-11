import { aiClient } from '@/lib/ai/client';
import { extractJson } from '@/lib/ai/json';
import { URL_ANALYZER_PROMPT } from '@/lib/ai/prompts';
import { UrlAnalysisSchema, type UrlAnalysis } from '@/lib/schemas/url';
import { fetchReadableUrlContent } from '@/lib/utils/http';

export async function analyzeUrl(targetUrl: string): Promise<UrlAnalysis> {
  const content = await fetchReadableUrlContent(targetUrl);

  const response = await aiClient.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'user',
        content: `${URL_ANALYZER_PROMPT}\nURL: ${targetUrl}\nContent:\n${content.slice(0, 12000)}`,
      },
    ],
    temperature: 0.2,
  });

  const text = response.choices[0]?.message?.content || '{}';
  return UrlAnalysisSchema.parse(extractJson(text));
}