// src/lib/ai/models.ts
export const useModel = (type: 'analysis' | 'classification' | 'vision' | 'generation'): string => {
  switch (type) {
    case 'analysis':
      return process.env.GROQ_MODEL || 'llama3-70b-8192';
    case 'classification':
      return process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    case 'vision':
      // Use available Gemini 2.0 flash model for vision
      return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    case 'generation':
      return process.env.GROQ_MODEL || 'llama3-70b-8192';
    default:
      return process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  }
};

// Check if Gemini is available (for vision)
export const isGeminiAvailable = (): boolean => {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
};