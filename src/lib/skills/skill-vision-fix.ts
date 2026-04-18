// src/lib/skills/skill-vision-fix.ts - Vision with proper fallback
import { AdVision } from '../schemas/skill-schemas';
import { geminiCall } from '../ai/providers';

export async function analyzeImageWithFallback(
  imageUrl: string | undefined,
  adText: string | undefined,
  category: string
): Promise<AdVision> {
  console.log('[Vision] Analyzing...');

  // Case 1: Has image URL - try to analyze
  if (imageUrl && imageUrl.startsWith('http')) {
    try {
      const result = await analyzeWithGemini(imageUrl);
      if (result.status === 'ok' && result.confidence > 0.5) {
        console.log('[Vision] Success from image');
        return result;
      }
    } catch (e) {
      console.log('[Vision] Image failed:', e.message);
    }
  }

  // Case 2: Has ad text - parse it
  if (adText && adText.length > 3) {
    const fromText = parseAdText(adText, category);
    console.log('[Vision] Parsed from text:', fromText.ctaSignals?.[0]);
    return fromText;
  }

  // Case 3: Category-based default with brand colors
  const fallback = getCategoryFallback(category);
  console.log('[Vision] Using fallback:', fallback.ctaSignals?.[0]);
  return fallback;
}

async function analyzeWithGemini(url: string): Promise<AdVision> {
  const imageRes = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!imageRes.ok) throw new Error(`Image fetch failed: ${imageRes.status}`);

  const buffer = await imageRes.arrayBuffer();
  const mime = imageRes.headers.get('content-type') || 'image/jpeg';

  const prompt = `Extract JSON: {"cta":"apply now","colors":["#hex"],"mood":"premium","offer":"cashback"}`;

  const text = await geminiCall('gemini-2.0-flash', prompt, {
    images: [{ data: Buffer.from(buffer), mimeType: mime }]
  });

  const cleaned = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    status: 'ok',
    visualMood: [parsed.mood || 'premium'],
    imageryType: 'mixed',
    offerSignals: [parsed.offer].filter(Boolean),
    audienceSignals: ['consumer'],
    ctaSignals: [parsed.cta || 'Apply Now'],
    claimSignals: [],
    confidence: 0.8
  };
}

function parseAdText(text: string, category: string): AdVision {
  const lower = text.toLowerCase();

  // Extract CTA
  let cta = 'Apply Now';
  if (lower.includes('order')) cta = 'Order Now';
  else if (lower.includes('shop')) cta = 'Shop Now';
  else if (lower.includes('book')) cta = 'Book Now';
  else if (lower.includes('start')) cta = 'Start Free';
  else if (lower.includes('claim')) cta = 'Claim Now';

  // Extract offers
  const offers: string[] = [];
  if (lower.includes('cashback')) offers.push('cashback');
  if (lower.includes('reward')) offers.push('rewards');
  if (lower.includes('discount') || lower.includes('%')) offers.push('discount');
  if (lower.includes('free')) offers.push('free');

  // Extract mood
  let mood = 'premium';
  if (lower.includes('exclusive') || lower.includes('vip')) mood = 'exclusive';
  if (lower.includes('fun') || lower.includes('play')) mood = 'playful';
  if (lower.includes('urgent') || lower.includes('now')) mood = 'urgent';

  return {
    status: offers.length > 0 ? 'ok' : 'unavailable',
    visualMood: [mood],
    imageryType: offers.length > 0 ? 'text-led' : 'text-led',
    offerSignals: offers,
    audienceSignals: ['consumer'],
    ctaSignals: [cta],
    claimSignals: [],
    confidence: offers.length > 0 ? 0.8 : 0.5
  };
}

function getCategoryFallback(category: string): AdVision {
  const defaults: Record<string, AdVision> = {
    'Finance': {
      status: 'unavailable',
      visualMood: ['premium'],
      imageryType: 'text-led',
      offerSignals: ['cashback', 'rewards'],
      audienceSignals: ['consumer'],
      ctaSignals: ['Get Started'],
      claimSignals: [],
      confidence: 0.5
    },
    'Food & Dining': {
      status: 'unavailable',
      visualMood: ['appetizing'],
      imageryType: 'text-led',
      offerSignals: ['discount', 'free delivery'],
      audienceSignals: ['consumer'],
      ctaSignals: ['Order Now'],
      claimSignals: [],
      confidence: 0.5
    },
    'E-commerce': {
      status: 'unavailable',
      visualMood: ['shopping'],
      imageryType: 'text-led',
      offerSignals: ['sale', 'limited offer'],
      audienceSignals: ['consumer'],
      ctaSignals: ['Shop Now'],
      claimSignals: [],
      confidence: 0.5
    },
    'SaaS': {
      status: 'unavailable',
      visualMood: ['professional'],
      imageryType: 'text-led',
      offerSignals: ['free trial'],
      audienceSignals: ['business'],
      ctaSignals: ['Start Free Trial'],
      claimSignals: [],
      confidence: 0.5
    },
    'Healthcare': {
      status: 'unavailable',
      visualMood: ['trustworthy'],
      imageryType: 'text-led',
      offerSignals: ['consultation'],
      audienceSignals: ['consumer'],
      ctaSignals: ['Book Now'],
      claimSignals: [],
      confidence: 0.5
    },
    'Travel': {
      status: 'unavailable',
      visualMood: ['adventurous'],
      imageryType: 'text-led',
      offerSignals: ['discount', 'offer'],
      audienceSignals: ['consumer'],
      ctaSignals: ['Book Now'],
      claimSignals: [],
      confidence: 0.5
    }
  };

  return defaults[category] || defaults['Finance'];
}
