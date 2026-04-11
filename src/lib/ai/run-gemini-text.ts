import { geminiClient, GEMINI_MODELS } from './providers';

// Schema for Gemini - passed as object for configuration, not JSON schema validation
const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    brand: { type: 'string' },
    audience: { type: 'string' },
    hero: { type: 'object' },
    stats: { type: 'array' },
    sections: { type: 'array' },
  },
  required: ['brand', 'hero', 'stats'],
};

export async function runGeminiText(prompt: string) {
  if (!geminiClient) {
    throw new Error('Gemini API key missing');
  }

  let lastError: unknown;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          // @ts-expect-error - Gemini supports responseSchema
          responseSchema: SPEC_SCHEMA,
        },
      });

      const result = await model.generateContent(prompt);
      let text = result.response.text();

      if (!text) {
        throw new Error(`Gemini model ${modelName} returned empty content`);
      }

      // Clean up markdown fences
      text = extractJsonFromText(text);

      // Validate is valid JSON
      try {
        JSON.parse(text);
      } catch {
        throw new Error(`Model returned invalid JSON`);
      }

      return { text, model: modelName };
    } catch (error) {
      lastError = error;
      console.log(`Gemini model failed: ${modelName} - ${error.message}`);
      
      // Try without schema if schema failed
      if (error.message.includes('responseSchema') || error.message.includes('Invalid')) {
        try {
          const model = geminiClient.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          });
          
          const result = await model.generateContent(prompt);
          let text = result.response.text();
          text = extractJsonFromText(text);
          JSON.parse(text);
          
          return { text, model: modelName };
        } catch {
          // Continue to next model
        }
      }
    }
  }

  throw new Error(`All Gemini models failed: ${String(lastError)}`);
}

// Extract JSON from markdown-wrapped response
function extractJsonFromText(text: string): string {
  const fences = [/^```json\s*/i, /^```\s*/, /```$/gm];
  for (const fence of fences) {
    text = text.replace(fence, '');
  }
  
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return text.substring(firstBracket, lastBracket + 1);
  }
  
  return text.trim();
}