// src/lib/skills/skill-ad-vision.ts - Ad Vision Analysis Skill
import { AdVision } from '../schemas/skill-schemas';
import { geminiCall } from '../ai/providers';

// Analyze ad image or text input
export async function runAdVisionSkill(
  adInput: string, 
  brandCategory?: string
): Promise<AdVision> {
  console.log('[AdVision] Analyzing input:', adInput.substring(0, 50));
  
  // If input is text/copy (not URL), parse it
  if (adInput.length > 10 && !adInput.startsWith('http')) {
    return parseAdText(adInput, brandCategory);
  }
  
  // Try image analysis
  try {
    const result = await analyzeImage(adInput);
    if (result.status === 'ok') {
      return result;
    }
  } catch (e) {
    console.log('[AdVision] Image analysis failed:', e);
  }
  
  // Return unavailable but with category-based defaults
  return createCategoryDefaults(brandCategory);
}

async function analyzeImage(imageUrl: string): Promise<AdVision> {
  console.log('[AdVision] Running Gemini Vision...');

  const imageRes = await fetch(imageUrl, {
    signal: AbortSignal.timeout(15000)
  });

  if (!imageRes.ok) {
    throw new Error(`Image fetch failed: ${imageRes.status}`);
  }

  const buffer = await imageRes.arrayBuffer();
  const mime = imageRes.headers.get('content-type') || 'image/jpeg';

  const prompt = `Analyze this ad image. Return JSON with exact fields:
{
  "status": "ok",
  "visualMood": ["mood1", "mood2"],
  "imageryType": "product|lifestyle|abstract|text-led|mixed",
  "offerSignals": ["offer1", "offer2"],
  "audienceSignals": ["audience1"],
  "ctaSignals": ["CTA text"],
  "claimSignals": ["any numbers/claims"],
  "confidence": 0.0-1.0
}

Focus on: offer, CTA, target audience, emotional appeal.`;

  const text = await geminiCall('gemini-2.0-flash', prompt, {
    images: [{ data: Buffer.from(buffer), mimeType: mime }]
  });

  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      status: parsed.status || 'ok',
      visualMood: parsed.visualMood || [],
      imageryType: parsed.imageryType,
      offerSignals: parsed.offerSignals || [],
      audienceSignals: parsed.audienceSignals || [],
      ctaSignals: parsed.ctaSignals || [],
      claimSignals: parsed.claimSignals || [],
      confidence: parsed.confidence || 0.7
    };
  } catch (e) {
    console.log('[AdVision] Parse failed:', e);
    return { status: 'unavailable', confidence: 0 };
  }
}

function parseAdText(text: string, category?: string): AdVision {
  const lower = text.toLowerCase();
  
  // Default CTA based on category (bank-friendly, not banned)
  let ctaSignal = category === 'Finance' ? 'Apply Now' : 'Get Started';
  const ctaPatterns: [RegExp, string][] = [
    [/sign\s*up/i, 'Sign Up'],
    [/order\s*now/i, 'Order Now'],
    [/shop\s*now/i, 'Shop Now'],
    [/get\s*started/i, 'Get Started'],
    [/learn\s*more/i, 'Learn More'],
    [/apply\s*now/i, 'Apply Now'],
    [/start\s*free/i, 'Start Free'],
    [/book\s*now/i, 'Book Now'],
    [/claim\s*now/i, 'Claim Now'],
    [/download/i, 'Download']
  ];
  
  for (const [pattern, value] of ctaPatterns) {
    if (pattern.test(text)) {
      ctaSignal = value;
      break;
    }
  }
  
  // Extract offer signals
  const offers: string[] = [];
  if (lower.includes('cashback')) offers.push('cashback');
  if (lower.includes('free') && lower.includes('delivery')) offers.push('free delivery');
  if (lower.includes('% off') || lower.includes('discount')) offers.push('discount');
  if (lower.includes('save')) offers.push('saving');
  if (lower.includes('reward')) offers.push('rewards');
  if (lower.includes('exclusive')) offers.push('exclusive');
  if (lower.includes('vip') || lower.includes('premium')) offers.push('premium');
  
  // Extract audience signals
  const audiences: string[] = [];
  if (lower.includes('restaurant') || lower.includes('merchant')) audiences.push('merchant');
  if (lower.includes('doctor') || lower.includes('patient')) audiences.push('patient');
  if (lower.includes('business') || lower.includes('enterprise')) audiences.push('business');
  
  // Visual mood
  const moods: string[] = [];
  if (lower.includes('premium') || lower.includes('luxury')) moods.push('premium');
  if (lower.includes('fun') || lower.includes('colorful')) moods.push('playful');
  if (lower.includes('trust') || lower.includes('secure')) moods.push('trustworthy');
  if (lower.includes('urgent') || lower.includes('today')) moods.push('urgent');
  
  // Detect imagery type
  let imageryType: AdVision['imageryType'] = 'mixed';
  if (lower.includes('people') || lower.includes('person')) imageryType = 'lifestyle';
  else if (lower.includes('product') || lower.includes('item')) imageryType = 'product';
  else if (lower.split(' ').length < 10) imageryType = 'text-led';
  
  return {
    status: offers.length > 0 || ctaSignal ? 'ok' : 'unavailable',
    visualMood: moods.length ? moods : ['modern'],
    imageryType,
    offerSignals: offers,
    audienceSignals: audiences.length ? audiences : ['consumer'],
    ctaSignals: [ctaSignal],
    claimSignals: [],
    confidence: offers.length > 0 ? 0.75 : 0.5
  };
}

function createCategoryDefaults(category?: string): AdVision {
  const defaults: Record<string, Partial<AdVision>> = {
    'Finance': {
      visualMood: ['trust', 'premium'],
      ctaSignals: ['Apply Now'],
      offerSignals: ['cashback', 'rewards']
    },
    'Food & Dining': {
      visualMood: ['appetizing', 'friendly'],
      ctaSignals: ['Order Now'],
      offerSignals: ['discount', 'delivery']
    },
    'E-commerce': {
      visualMood: ['shopping', 'modern'],
      ctaSignals: ['Shop Now'],
      offerSignals: ['sale']
    },
    'SaaS': {
      visualMood: ['professional', 'modern'],
      ctaSignals: ['Start Free'],
      offerSignals: ['trial']
    }
  };
  
  const def = defaults[category || 'default'] || {
    visualMood: ['modern'],
    ctaSignals: ['Get Started'],
    offerSignals: []
  };
  
  return {
    status: 'unavailable',
    visualMood: def.visualMood || ['modern'],
    imageryType: 'mixed',
    offerSignals: def.offerSignals || [],
    audienceSignals: ['consumer'],
    ctaSignals: def.ctaSignals || ['Get Started'],
    claimSignals: [],
    confidence: 0.4
  };
}