import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const groqClient = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

export const geminiClient = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)
  : null;

// Vision model fallback chain - ordered by preference
// Key 2 quota: gemini-2.0-flash = 0, gemini-2.0-flash-lite = 0, others working
const VISION_MODEL_FALLBACK_CHAIN = [
  'gemini-2.0-flash',           // Best quality (but may be quota exceeded)
  'gemini-2.5-flash',           // Alternative high quality
  'gemini-2.5-flash-lite',      // Most reliable - works on Key 2
  'gemini-flash-latest'         // Fallback
];

// Text model fallback chain
const TEXT_MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest'
];

export const GROQ_MODELS = [
  process.env.GROQ_MODEL,
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
].filter(Boolean) as string[];

// Get fallback chain based on model type
export const getModelFallbackChain = (model: string, isVision: boolean = false): string[] => {
  if (isVision) {
    return VISION_MODEL_FALLBACK_CHAIN;
  }
  return TEXT_MODEL_FALLBACK_CHAIN;
};

// ========== PRODUCTION CALL FUNCTIONS ==========
export async function groqCall(model: string, prompt: string, responseFormat?: any) {
  if (!groqClient) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    // Include "json" in prompt when response_format is json_object (required by Groq API)
    const promptWithJson = (responseFormat?.type === 'json_object' && !prompt.toLowerCase().includes('json'))
      ? prompt + '\n\nRespond in JSON format.'
      : prompt;

    const completion = await groqClient.chat.completions.create({
      model,
      messages: [{ role: 'user', content: promptWithJson }],
      temperature: 0.7,
      max_tokens: 2000,
      ...(responseFormat && { response_format: responseFormat })
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in GROQ response');
    }

    return content;
  } catch (error: any) {
    console.error('GROQ API Error:', error.message);
    throw new Error(`GROQ call failed: ${error.message}`);
  }
}

export async function geminiCallWithFallback(
  model: string,
  prompt: string,
  options?: { images?: { data: Buffer; mimeType?: string }[] },
  isVision: boolean = false
): Promise<string> {
  if (!geminiClient) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const fallbackChain = getModelFallbackChain(model, isVision);
  let lastError: Error | null = null;

  for (const modelToTry of fallbackChain) {
    try {
      console.log(`[GEMINI] Trying model: ${modelToTry} (fallback chain)`);

      const geminiModel = geminiClient.getGenerativeModel({ model: modelToTry });

      let content: any[] = [{ text: prompt }];

       // Add images if provided
       if (options?.images) {
         for (const image of options.images) {
           content.push({
             inlineData: {
               mimeType: image.mimeType || 'image/png',
               data: image.data.toString('base64')
             }
           });
         }
       }

      const result = await geminiModel.generateContent({ contents: [{ role: 'user', parts: content }] });
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No content in GEMINI response');
      }

      console.log(`[GEMINI] Success with model: ${modelToTry}`);
      return text;

    } catch (error: any) {
      const errorMsg = error.message || '';

      // Check if it's a quota error
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        console.log(`[GEMINI] Model ${modelToTry} quota exceeded, trying next...`);
        lastError = error;
        continue; // Try next model in chain
      }

      // Check if model not found or service unavailable (high demand)
      if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('503')) {
        console.log(`[GEMINI] Model ${modelToTry} unavailable (${errorMsg.includes('503') ? 'high demand' : 'not found'}), trying next...`);
        lastError = error;
        continue;
      }

      // Check for JSON parse errors
      if (errorMsg.includes('Unexpected token') || errorMsg.includes('JSON')) {
        console.log(`[GEMINI] Model ${modelToTry} returned invalid JSON, trying next...`);
        lastError = error;
        continue;
      }

      // Other error - try next model instead of throwing
      console.log(`[GEMINI] Model ${modelToTry} failed: ${errorMsg.substring(0, 50)}, trying next...`);
      lastError = error;
      continue;
    }
  }

  // All models in chain failed
  throw new Error(`All Gemini fallback models failed. Last error: ${lastError?.message}`);
}

// Legacy function - now uses fallback
export async function geminiCall(model: string, prompt: string, options?: { images?: { data: Buffer; mimeType?: string }[] }) {
  const isVision = !!options?.images;
  return geminiCallWithFallback(model, prompt, options, isVision);
}

export const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-flash-latest',
].filter(Boolean) as string[];