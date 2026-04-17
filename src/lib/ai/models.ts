// src/lib/ai/models.ts

// Vision model fallback chain - ordered by preference
// Key 2 quota limits: gemini-2.0-flash, gemini-2.0-flash-lite = 0, others working
const VISION_MODEL_CHAIN = [
  'gemini-2.0-flash',           // Best quality, but quota may be exceeded
  'gemini-2.5-flash',           // Alternative high quality
  'gemini-2.5-flash-lite',      // Most reliable - works on Key 2
  'gemini-flash-latest'         // Fallback
];

export const useModel = (type: 'analysis' | 'classification' | 'vision' | 'generation'): string => {
  switch (type) {
    case 'analysis':
      return process.env.GROQ_MODEL || 'llama3-70b-8192';
    case 'classification':
      return process.env.GROQ_MODEL || 'llama3-1-8b-instant';
    case 'vision':
      // Use fallback chain for vision - gemini-2.5-flash-lite as default (works with Key 2)
      return process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    case 'generation':
      return process.env.GROQ_MODEL || 'llama3-70b-8192';
    default:
      return process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  }
};

// Get all available vision models for fallback chain
export const getVisionModelChain = (): string[] => {
  return VISION_MODEL_CHAIN;
};

// Check if Gemini is available (for vision)
export const isGeminiAvailable = (): boolean => {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
};