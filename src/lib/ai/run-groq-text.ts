import { groqClient, GROQ_MODELS } from './providers';

export async function runGroqText(prompt: string) {
  if (!groqClient) {
    throw new Error('Groq API key missing');
  }

  let lastError: unknown;

  for (const model of GROQ_MODELS) {
    try {
      const res = await groqClient.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const text = res.choices[0]?.message?.content;
      if (!text) {
        throw new Error(`Groq model ${model} returned empty content`);
      }

      return { text, model };
    } catch (error) {
      lastError = error;
      console.log(`Groq model failed: ${model} - ${error.message}`);
    }
  }

  throw new Error(`All Groq models failed: ${String(lastError)}`);
}