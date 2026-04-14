import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const groqClient = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

export const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export const GROQ_MODELS = [
  process.env.GROQ_MODEL,
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
].filter(Boolean) as string[];

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

export async function geminiCall(model: string, prompt: string) {
  if (!geminiClient) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const geminiModel = geminiClient.getGenerativeModel({ model });

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No content in GEMINI response');
    }

    return text;
  } catch (error: any) {
    console.error('GEMINI API Error:', error.message);
    throw new Error(`GEMINI call failed: ${error.message}`);
  }
}

export const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
].filter(Boolean) as string[];