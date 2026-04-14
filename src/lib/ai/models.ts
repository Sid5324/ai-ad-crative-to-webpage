// src/lib/ai/models.ts
export const useModel = (type: 'analysis' | 'classification' | 'vision' | 'generation'): string => {
  switch (type) {
    case 'analysis':
      return process.env.GROQ_MODEL || 'llama3-70b-8192';
    case 'classification':
      return process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    case 'vision':
      return process.env.GEMINI_MODEL || 'gemini-1.5-pro';
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