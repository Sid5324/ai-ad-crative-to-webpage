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
  'llama-3.2-11b-ve',  
  'llama-3.1-70b-spe',
  'mixtral-8x7b-32768',
].filter(Boolean) as string[];

export const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
].filter(Boolean) as string[];