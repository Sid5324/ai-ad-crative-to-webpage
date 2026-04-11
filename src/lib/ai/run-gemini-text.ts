import { geminiClient, GEMINI_MODELS } from './providers';

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
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text) {
        throw new Error(`Gemini model ${modelName} returned empty content`);
      }

      return { text, model: modelName };
    } catch (error) {
      lastError = error;
      console.log(`Gemini model failed: ${modelName} - ${error.message}`);
    }
  }

  throw new Error(`All Gemini models failed: ${String(lastError)}`);
}