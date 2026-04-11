import { groqClient, GROQ_MODELS } from './providers';

export async function runGroqText(prompt: string, schema?: object) {
  if (!groqClient) {
    throw new Error('Groq API key missing');
  }

  let lastError: unknown;

  for (const model of GROQ_MODELS) {
    try {
      const options: any = {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      };

      // Use schema for structured output if provided
      if (schema) {
        options.response_format = { type: 'json_object' };
      }

      const res = await groqClient.chat.completions.create(options);

      let text = res.choices[0]?.message?.content;
      if (!text) {
        throw new Error(`Groq model ${model} returned empty content`);
      }

      // Clean up markdown fences
      text = extractJsonFromText(text);
      
      // Validate is valid JSON
      try {
        JSON.parse(text);
      } catch {
        throw new Error(`Model returned invalid JSON`);
      }

      return { text, model };
    } catch (error) {
      lastError = error;
      console.log(`Groq model failed: ${model} - ${error.message}`);
    }
  }

  throw new Error(`All Groq models failed: ${String(lastError)}`);
}

// Extract JSON from markdown-wrapped response
function extractJsonFromText(text: string): string {
  // Remove markdown code fences
  const fences = [/^```json\s*/i, /^```\s*/, /```$/gm];
  for (const fence of fences) {
    text = text.replace(fence, '');
  }
  
  // Find first { and last } to extract JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  
  // Try array
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return text.substring(firstBracket, lastBracket + 1);
  }
  
  return text.trim();
}