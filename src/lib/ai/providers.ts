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
  'llama-3.2-90b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
].filter(Boolean) as string[];

export const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
].filter(Boolean) as string[];