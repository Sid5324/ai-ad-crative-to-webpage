// src/app/api/generate/route.ts - DUAL ENGINE: Groq → Gemini Fallback
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { runGroqText } from '@/lib/ai/run-groq-text';
import { runGeminiText } from '@/lib/ai/run-gemini-text';

const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  console.log('🚀 DUAL ENGINE START: Groq → Gemini Fallback');

  let body: any = {};
  try {
    body = await req.json();
    const input = {
      adInputType: body.adInputType || 'copy',
      adInputValue: body.adInputValue || '',
      targetUrl: body.targetUrl,
    };

    // Extract brand first (no AI needed)
    const brandName = extractBrand(input.targetUrl);
    const audience = detectAudience(input.targetUrl);

    console.log(`✅ Brand: "${brandName}", Audience: "${audience}"`);

    const prompt = buildPrompt(input, brandName, audience);
    let result: any;
    let engine = 'groq';
    let modelUsed = '';

    // 🚀 ENGINE 1: TRY GROQ FIRST (fastest)
    try {
      console.log('🔄 Trying Groq model list...');
      const groqResult = await runGroqText(prompt);
      console.log(`✅ Groq success: ${groqResult.model}`);
      result = safeParseSpec(groqResult.text, brandName, audience);
      modelUsed = groqResult.model;
    } catch (groqError) {
      console.log('❌ Groq failed, switching to Gemini...');
      console.log(groqError);

      // 🚀 ENGINE 2: GEMINI FALLBACK (reliable)
      try {
        engine = 'gemini';
        console.log('🔄 Trying Gemini model list...');
        const geminiResult = await runGeminiText(prompt);
        console.log(`✅ Gemini success: ${geminiResult.model}`);
        result = safeParseSpec(geminiResult.text, brandName, audience);
        modelUsed = geminiResult.model;
      } catch (geminiError) {
        console.log('❌ Gemini failed, using deterministic fallback...');
        console.log(geminiError);
        result = {
          spec: generateFallbackSpec(brandName),
          report: { valid: true },
          qualityScore: 60,
        };
        engine = 'fallback';
        modelUsed = 'deterministic';
      }
    }

    // Save and return
    const previewId = nanoid(10);
    PREVIEWS[previewId] = result;

    console.log(`✅ COMPLETE! ID: ${previewId} (${engine}:${modelUsed})`);

    return NextResponse.json({
      success: true,
      previewId,
      spec: result.spec,
      report: result.report,
      qualityScore: result.qualityScore,
      engine,
      model: modelUsed,
      debug: {
        brand: brandName,
        audience,
        hero: result.spec.hero?.headline,
        sections: result.spec.sections?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR:', error.message);

    // Direct fallback - always works
    const targetUrl = body?.targetUrl || 'https://example.com';
    const brandName = extractBrand(targetUrl);
    const spec = generateFallbackSpec(brandName);
    const previewId = nanoid(10);

    console.log(`✅ FALLBACK COMPLETE: ID ${previewId}, Brand: ${brandName}`);

    return NextResponse.json({
      success: true,
      previewId,
      spec,
      report: { valid: true },
      qualityScore: 60,
      engine: 'fallback',
      model: 'error-fallback',
      debug: {
        brand: brandName,
        audience: 'consumer',
        hero: spec.hero.headline,
        sections: spec.sections.length,
        status: 'error-fallback'
      },
    });
  }
}

// 🚀 PROMPT BUILDER
function buildPrompt(input: any, brandName: string, audience: string) {
  return `Generate landing page JSON for brand "${brandName}".

Website: ${input.targetUrl}
Audience: ${audience}
Ad Type: ${input.adInputType}
Ad Content: ${input.adInputValue}

Return only valid JSON with this structure:
{
  "brand": "${brandName}",
  "audience": "${audience}",
  "hero": {"headline": "string", "subheadline": "string", "primaryCTA": {"label": "string", "href": "/"}},
  "stats": [{"value": "string", "label": "string"}],
  "sections": [{"type": "benefits", "title": "string", "items": [{"title": "string", "body": "string"}]}],
  "closingCTA": {"headline": "string", "primaryCTA": {"label": "string", "href": "/"}}
}`;
}

// 🚀 SAFE SPEC PARSER
function safeParseSpec(text: string, brandName: string, audience: string) {
  try {
    const rawSpec = JSON.parse(text);
    return {
      spec: normalizeSpec(rawSpec, brandName),
      report: { valid: true, issues: [] },
      qualityScore: calculateQualityScore(normalizeSpec(rawSpec, brandName)),
    };
  } catch (error) {
    console.log('JSON parse failed, using fallback');
    return {
      spec: generateFallbackSpec(brandName),
      report: { valid: false, issues: ['JSON parse failed'] },
      qualityScore: 50,
    };
  }
}



// 🚀 SPEC NORMALIZATION
function normalizeSpec(rawSpec: any, brandName: string) {
  return {
    brand: brandName,
    audience: rawSpec.audience || 'consumer',
    pageGoal: rawSpec.pageGoal || 'Drive conversions',
    hero: {
      headline: rawSpec.hero?.headline || `${brandName} - Premium Service`,
      subheadline: rawSpec.hero?.subheadline || 'Discover premium services tailored for you',
      primaryCTA: rawSpec.hero?.primaryCTA || { label: 'Get Started', href: '/' },
      secondaryCTA: rawSpec.hero?.secondaryCTA || { label: 'Learn More', href: '/about' },
    },
    stats: Array.isArray(rawSpec.stats) ? rawSpec.stats.slice(0, 3) : [
      { value: '500+', label: 'Happy Customers' },
      { value: '24/7', label: 'Service' },
      { value: '5★', label: 'Reviews' },
    ],
    sections: Array.isArray(rawSpec.sections) ? rawSpec.sections.slice(0, 3) : [
      {
        type: 'benefits',
        title: 'Why Choose Us',
        items: [
          { title: 'Premium Service', body: 'We deliver exceptional quality' },
          { title: 'Expert Team', body: 'Professional experts ready to help' },
          { title: '24/7 Support', body: 'Always here when you need us' },
        ],
      },
    ],
    closingCTA: rawSpec.closingCTA || {
      headline: 'Ready to Get Started?',
      body: 'Join thousands of satisfied customers today',
      primaryCTA: { label: 'Get Started', href: '/' },
    },
  };
}

// 🚀 UTILITY FUNCTIONS
function extractBrand(url: string): string {
  try {
    const hostname = new URL(url).hostname
      .replace('www.', '')
      .replace('.com', '')
      .replace('.qa', '')
      .replace(/-/g, ' ')
      .trim();

    if (hostname.includes('limousine') || hostname.includes('astar')) {
      return 'A-Star Limousine';
    }
    if (hostname.includes('doordash')) {
      return 'DoorDash';
    }
    if (hostname.includes('uber')) {
      return 'Uber';
    }

    return hostname.charAt(0).toUpperCase() + hostname.slice(1) || 'Premium Service';
  } catch {
    return 'Premium Service';
  }
}

function detectAudience(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('shop') || hostname.includes('limousine')) return 'consumer';
  if (hostname.includes('business') || hostname.includes('enterprise')) return 'b2b';
  return 'consumer';
}

function calculateQualityScore(spec: any): number {
  let score = 50;

  if (spec.brand && spec.brand !== 'Unknown' && spec.brand !== 'Premium Service') {
    score += 20;
  }

  if (spec.hero?.headline && spec.hero.headline.includes(spec.brand || '')) {
    score += 15;
  }

  if (spec.hero?.primaryCTA?.label && spec.hero.primaryCTA.label.length > 3) {
    score += 10;
  }

  const sectionsScore = Math.min((spec.sections?.length || 0) * 5, 20);
  score += sectionsScore;

  return Math.min(score, 100);
}

function fallbackResponse(targetUrl: string) {
  const previewId = nanoid(10);
  PREVIEWS[previewId] = {
    spec: generateFallbackSpec(extractBrand(targetUrl)),
    report: { valid: true },
  };

  return NextResponse.json({
    success: true,
    previewId,
    spec: PREVIEWS[previewId].spec,
    report: { valid: true },
  });
}

function generateFallbackSpec(brandName: string) {
  return {
    brand: brandName,
    audience: 'consumer',
    pageGoal: 'Drive conversions',
    hero: {
      headline: `${brandName} - Premium Service`,
      subheadline: 'Discover premium services tailored for you',
      primaryCTA: { label: 'Get Started', href: '/' },
      secondaryCTA: { label: 'Learn More', href: '/about' },
    },
    stats: [
      { value: '500+', label: 'Happy Customers' },
      { value: '24/7', label: 'Service' },
      { value: '5★', label: 'Reviews' },
    ],
    sections: [
      {
        type: 'benefits',
        title: 'Why Choose Us',
        items: [
          { title: 'Premium Service', body: 'We deliver exceptional quality' },
          { title: 'Expert Team', body: 'Professional experts ready to help' },
          { title: '24/7 Support', body: 'Always here when you need us' },
        ],
      },
    ],
    closingCTA: {
      headline: 'Ready to Get Started?',
      body: 'Join thousands of satisfied customers today',
      primaryCTA: { label: 'Get Started', href: '/' },
    },
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || searchParams.get('preview');

  if (!id || !PREVIEWS[id]) {
    return NextResponse.json({ error: 'Preview expired' }, { status: 404 });
  }

  return NextResponse.json(PREVIEWS[id]);
}