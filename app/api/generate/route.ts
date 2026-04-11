// src/app/api/generate/route.ts - 4-STAGE PRODUCTION PIPELINE
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize clients
const groq = process.env.GROQ_API_KEY ? new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
}) : null;

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const GROQ_MODELS = ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
const GEMINI_MODELS = ['gemini-1.5-flash-8b', 'gemini-1.5-flash'];

const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  console.log('🚀 4-STAGE PIPELINE START');
  
  const body = await req.json();
  const input = {
    adInputType: body.adInputType || 'copy',
    adInputValue: body.adInputValue || '',
    targetUrl: body.targetUrl,
    targetAudience: body.targetAudience || 'auto',
    designStyle: body.designStyle || 'auto',
  };

  try {
    // Extract brand from URL
    const brandName = extractBrand(input.targetUrl);
    const audience = detectAudience(input.targetUrl, input.targetAudience);
    
    console.log(`📋 Brand: "${brandName}", Audience: "${audience}"`);

    // STAGE 1: Analyze Ad
    console.log('🔍 STAGE 1: Analyzing ad...');
    const adSignals = await stage1AnalyzeAd(input.adInputValue, input.adInputType, brandName);
    console.log(`   → Hook: "${adSignals.hook}", Intent: "${adSignals.intent}", Tone: "${adSignals.audienceTone}"`);

    // STAGE 2: Analyze Page/Brand
    console.log('🔍 STAGE 2: Analyzing brand...');
    const pageSignals = await stage2AnalyzePage(input.targetUrl, brandName, audience);
    console.log(`   → Brand: "${pageSignals.brand}", Style: "${pageSignals.designStyle}"`);

    // STAGE 3: Create Strategy
    console.log('🔍 STAGE 3: Creating strategy...');
    const strategy = await stage3CreateStrategy(adSignals, pageSignals, brandName, audience);
    console.log(`   → Design: "${strategy.designDirection.colorPrimary}", Layout: "${strategy.designDirection.layout}"`);

    // STAGE 4: Generate Spec with Design Tokens
    console.log('🔍 STAGE 4: Generating spec...');
    const spec = stage4GenerateSpec(strategy, adSignals, pageSignals, brandName, audience);
    
    const previewId = nanoid(10);
    PREVIEWS[previewId] = { spec, adSignals, pageSignals, strategy };
    
    const qualityScore = calculateQuality(spec, adSignals, strategy);
    console.log(`✅ COMPLETE! ID: ${previewId}, Quality: ${qualityScore}`);

    return NextResponse.json({
      success: true,
      previewId,
      spec,
      qualityScore,
      engine: 'hybrid',
      debug: {
        brand: brandName,
        audience,
        adHook: adSignals.hook,
        design: strategy.designDirection.colorPrimary,
        hero: spec.hero.headline,
      },
    });

  } catch (error: any) {
    console.error('❌ PIPELINE ERROR:', error.message);
    
    // Intelligent fallback
    const brandName = extractBrand(body.targetUrl || 'https://example.com');
    const audience = detectAudience(body.targetUrl, body.targetAudience);
    const spec = generateIntelligentFallback(brandName, audience, body.adInputValue);
    
    return NextResponse.json({
      success: true,
      previewId: nanoid(10),
      spec,
      qualityScore: 70,
      engine: 'fallback',
      debug: { brand: brandName, fallback: true },
    });
  }
}

// ============ STAGE 1: AD ANALYZER ============
async function stage1AnalyzeAd(adContent: string, type: string, brandName: string) {
  if (!adContent || adContent.length < 10) {
    return {
      hook: `${brandName} - Premium Service`,
      intent: 'signup',
      audienceTone: 'professional',
      emotionalTrigger: 'trust',
      offerType: 'free_trial',
      visualStyle: 'modern',
    };
  }

  const prompt = `Analyze this ad and extract key signals. Return ONLY valid JSON:

AD: ${adContent}

{
  "hook": "main attention grabber from ad",
  "intent": "book|buy|signup|download|contact|learn",
  "audienceTone": "casual|professional|luxury|budget|urgent",
  "emotionalTrigger": "FOMO|trust|convenience|status|speed|savings",
  "offerType": "discount|free_trial|guarantee|exclusive|limited_time",
  "visualStyle": "minimal|bold|playful|corporate|premium",
  "benefit1": "key benefit from ad",
  "benefit2": "second benefit from ad",
  "socialProof": "any numbers or testimonials in ad"
}`;

  try {
    const result = await tryAI(prompt);
    const parsed = JSON.parse(extractJSON(result));
    return parsed;
  } catch {
    return extractFromAdManual(adContent, brandName);
  }
}

function extractFromAdManual(adContent: string, brandName: string): any {
  const lower = adContent.toLowerCase();
  return {
    hook: adContent.substring(0, 60),
    intent: lower.includes('buy') || lower.includes('order') ? 'buy' : 
           lower.includes('signup') || lower.includes('join') ? 'signup' : 'learn',
    audienceTone: lower.includes('$') || lower.includes('save') ? 'budget' : 'professional',
    emotionalTrigger: lower.includes('fast') || lower.includes('quick') ? 'speed' : 'trust',
    offerType: lower.includes('free') ? 'free_trial' : 
            lower.includes('%') || lower.includes('off') ? 'discount' : 'value',
    visualStyle: 'modern',
    benefit1: 'Premium service',
    benefit2: 'Fast delivery',
    socialProof: 'Thousands of customers',
  };
}

// ============ STAGE 2: PAGE ANALYZER ============
async function stage2AnalyzePage(url: string, brandName: string, audience: string) {
  const prompt = `Analyze this brand/URL and return ONLY valid JSON:

URL: ${url}
Brand: ${brandName}

{
  "brand": "exact brand name",
  "currentHero": "existing positioning if known",
  "existingCTAs": ["main CTAs from brand"],
  "trustSignals": ["any known trust signals"],
  "pageTone": "salesy|informational|corporate|friendly",
  "designStyle": "modern|classic|minimal|busy|luxury",
  "primaryColor": "#hex or brand color if known",
  "industry": "food|transport|software|retail|service"
}`;

  try {
    const result = await tryAI(prompt);
    const parsed = JSON.parse(extractJSON(result));
    return { ...parsed, brand: brandName };
  } catch {
    return {
      brand: brandName,
      currentHero: '',
      existingCTAs: ['Learn More', 'Get Started'],
      trustSignals: ['Rated 5 stars'],
      pageTone: audience === 'merchant' ? 'corporate' : 'friendly',
      designStyle: 'modern',
      primaryColor: '#000000',
      industry: inferIndustry(url),
    };
  }
}

function inferIndustry(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('food') || lower.includes('eat') || lower.includes('restaurant')) return 'food';
  if (lower.includes('taxi') || lower.includes('ride') || lower.includes('uber')) return 'transport';
  if (lower.includes('shop') || lower.includes('store')) return 'retail';
  if (lower.includes('software') || lower.includes('app')) return 'software';
  return 'service';
}

// ============ STAGE 3: STRATEGIST ============
async function stage3CreateStrategy(adSignals: any, pageSignals: any, brandName: string, audience: string) {
  // Map design tokens based on analysis
  const colorMap: Record<string, string> = {
    uber: '#FF6B35',
    doordash: '#FF3008',
    lyft: '#FF00BF',
   amazon: '#FF9900',
   starbucks: '#00704A',
    default: '#2563eb',
  };
  
  const industryColors: Record<string, string> = {
    food: '#ea580c',
    transport: '#7c3aed',
    retail: '#059669',
    software: '#0284c7',
    service: '#6366f1',
  };

  const colorPrimary = colorMap[brandName.toLowerCase().slice(0,6)] || 
                      industryColors[pageSignals.industry] || 
                      '#2563eb';

  const layoutMap: Record<string, string> = {
    urgent: 'hero-heavy',
    budget: 'value-focused',
    luxury: 'asymmetric',
    professional: 'clean',
    casual: 'friendly',
  };

  return {
    brand: brandName,
    audienceSegment: adSignals.audienceTone === 'budget' ? 'price-conscious buyers' :
                  adSignals.audienceTone === 'luxury' ? 'premium customers' :
                  audience === 'merchant' ? 'business owners' : 'general consumers',
    primaryHook: adSignals.hook || `${brandName} - Better Way`,
    audienceTone: adSignals.audienceTone || pageSignals.pageTone,
    designDirection: {
      colorPrimary,
      colorAccent: adjustColor(colorPrimary, 20),
      gradient: `linear-gradient(135deg, ${colorPrimary}, ${adjustColor(colorPrimary, 30)})`,
      typography: getTypography(adSignals.visualStyle, pageSignals.designStyle),
      layout: layoutMap[adSignals.audienceTone] || 'clean',
      visualDensity: adSignals.visualStyle === 'minimal' ? 'minimal' : 'rich',
    },
    sectionPriority: adSignals.intent === 'buy' ? ['hero', 'social_proof', 'benefits', 'cta'] :
                   ['hero', 'benefits', 'social_proof', 'cta'],
    ctaLanguage: getCTAStyle(adSignals.intent),
    benefits: [adSignals.benefit1, adSignals.benefit2, 'Premium Quality'],
    socialProof: adSignals.socialProof || 'Thousands of satisfied customers',
  };
}

function getTypography(adStyle: string, pageStyle: string): string {
  if (adStyle === 'premium' || pageStyle === 'luxury') return 'serif';
  if (adStyle === 'playful') return 'rounded';
  return 'sans';
}

function getCTAStyle(intent: string): string {
  const ctaMap: Record<string, string> = {
    buy: 'urgent',
    signup: 'trust_building',
    download: 'benefit_focused',
    contact: 'friendly',
  };
  return ctaMap[intent] || 'professional';
}

function adjustColor(hex: string, percent: number): string {
  // Simple lighten/darken
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// ============ STAGE 4: SPEC GENERATOR ============
function stage4GenerateSpec(strategy: any, adSignals: any, pageSignals: any, brandName: string, audience: string) {
  const isMerchant = audience === 'merchant' || audience === 'b2b';
  const design = strategy.designDirection;
  
  return {
    brand: brandName,
    audience: audience,
    pageGoal: isMerchant ? 'Get more signups' : 'Drive conversions',
    designTokens: design,
    hero: {
      headline: strategy.primaryHook,
      subheadline: `${strategy.audienceSegment} - ${adSignals.emotionalTrigger} with ${brandName}. ${strategy.benefits[0]}.`,
      primaryCTA: { label: getPrimaryCTA(strategy.ctaLanguage), href: '#action' },
      secondaryCTA: { label: 'Learn More', href: '#learn' },
    },
    stats: generateStats(brandName, isMerchant),
    sections: [
      {
        type: 'benefits',
        title: isMerchant ? `Why ${brandName}?` : `Choose ${brandName}`,
        items: strategy.benefits.map((b: string, i: number) => ({
          title: b,
          body: isMerchant ? `Grow your business with ${brandName}'s proven platform.` : `Experience the difference with ${brandName}.`,
        })),
      },
      {
        type: 'testimonials',
        title: `${strategy.socialProof}`,
        items: [
          { title: 'Happy Customer', body: `"${brandName} changed everything for us."` },
          { title: 'Business Owner', body: `"Best investment we've made."` },
        ],
      },
      {
        type: 'faq',
        title: isMerchant ? 'Merchant Questions' : 'Common Questions',
        items: [
          { title: 'How do I start?', body: `Sign up today - it only takes minutes.` },
          { title: 'What if I need help?', body: 'Our support team is here 24/7.' },
        ],
      },
    ],
    closingCTA: {
      headline: isMerchant ? `Grow with ${brandName}` : `Ready to get started?`,
      body: `Join ${strategy.socialProof.toLowerCase()}.`,
      primaryCTA: { label: getPrimaryCTA(strategy.ctaLanguage), href: '#signup' },
    },
  };
}

function getPrimaryCTA(style: string): string {
  const ctas: Record<string, string> = {
    urgent: 'Order Now',
    trust_building: 'Get Started Free',
    benefit_focused: 'Claim Your Offer',
    friendly: 'Join Us',
  };
  return ctas[style] || 'Get Started';
}

function generateStats(brandName: string, isMerchant: boolean) {
  if (brandName.toLowerCase().includes('uber') || brandName.toLowerCase().includes('dash')) {
    return [
      { value: '10M+', label: isMerchant ? 'Restaurant Partners' : 'Orders Delivered' },
      { value: '30min', label: 'Average Delivery' },
      { value: '4.9★', label: 'App Rating' },
    ];
  }
  if (isMerchant) {
    return [
      { value: '500K+', label: 'Active Merchants' },
      { value: '300%', label: 'Avg Revenue Increase' },
      { value: '99.9%', label: 'Platform Uptime' },
    ];
  }
  return [
    { value: '50K+', label: 'Happy Customers' },
    { value: '24/7', label: 'Support' },
    { value: '4.9★', label: 'Rating' },
  ];
}

// ============ AI UTILITIES ============
async function tryAI(prompt: string): Promise<string> {
  // Try Groq models
  if (groq) {
    for (const model of GROQ_MODELS) {
      try {
        const res = await groq.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 800,
        });
        const text = res.choices[0]?.message?.content;
        if (text) return text;
      } catch (e: any) {
        console.log(`   Model ${model} failed: ${e.message}`);
      }
    }
  }

  // Try Gemini
  if (gemini) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = gemini.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) return text;
      } catch (e: any) {
        console.log(`   Gemini ${modelName} failed: ${e.message}`);
      }
    }
  }

  throw new Error('All models failed');
}

function extractJSON(text: string): string {
  // Remove markdown
  text = text.replace(/```json/g, '').replace(/```/g, '');
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text;
}

// ============ FALLBACK ============
function generateIntelligentFallback(brandName: string, audience: string, adContent: string): any {
  const isMerchant = audience === 'merchant';
  const hook = adContent?.length > 20 ? adContent.substring(0, 60) : `${brandName} - Better Way`;
  
  return {
    brand: brandName,
    audience,
    designTokens: { colorPrimary: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)' },
    hero: {
      headline: hook,
      subheadline: `Join thousands using ${brandName}. Get started today.`,
      primaryCTA: { label: 'Get Started', href: '#signup' },
      secondaryCTA: { label: 'Learn More', href: '#learn' },
    },
    stats: generateStats(brandName, isMerchant),
    sections: [
      { type: 'benefits', title: `Why ${brandName}?`, items: [{ title: 'Premium Service', body: 'Quality you can trust' }, { title: 'Easy to Use', body: 'Simple and intuitive' }, { title: '24/7 Support', body: 'We are here to help' }] },
    ],
    closingCTA: { headline: `Ready to start?`, body: `Join ${brandName} today.`, primaryCTA: { label: 'Get Started', href: '#signup' } },
  };
}

// ============ UTILITIES ============
function extractBrand(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '').split('.')[0];
    const brands: Record<string, string> = { uber: 'Uber', doordash: 'DoorDash', amazon: 'Amazon', lyft: 'Lyft' };
    return brands[hostname] || hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return 'Your Brand';
  }
}

function detectAudience(url: string, explicit?: string): string {
  if (explicit && explicit !== 'auto') return explicit;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('business') || hostname.includes('merchant') || hostname.includes('partner')) return 'merchant';
    return 'consumer';
  } catch {
    return 'consumer';
  }
}

function calculateQuality(spec: any, adSignals: any, strategy: any): number {
  let score = 70;
  if (spec.hero?.headline?.length > 20) score += 10;
  if (spec.sections?.length >= 2) score += 10;
  if (spec.designTokens?.colorPrimary) score += 10;
  return Math.min(score, 100);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id || !PREVIEWS[id]) {
    return NextResponse.json({ error: 'Preview expired' }, { status: 404 });
  }
  return NextResponse.json(PREVIEWS[id]);
}