// src/app/api/generate/route.ts - MULTI-STEP AI PIPELINE
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { runGroqText } from '@/lib/ai/run-groq-text';
import { runGeminiText } from '@/lib/ai/run-gemini-text';

const PREVIEWS: Record<string, any> = {};

// Example output that shows the quality we want
const EXAMPLE_MERCHANT_SPEC = {
  brand: 'DoorDash',
  audience: 'merchant',
  pageGoal: 'Restaurant signups',
  hero: {
    headline: 'Increase Your Restaurant Reach',
    subheadline: 'Join 500,000+ restaurants growing their business with DoorDash\'s delivery platform. Connect with millions of customers and boost your revenue.',
    primaryCTA: { label: 'Get Started Free', href: '#signup' },
    secondaryCTA: { label: 'Schedule Demo', href: '#demo' },
  },
  stats: [
    { value: '500K+', label: 'Active Merchants' },
    { value: '300%', label: 'Average Revenue Increase' },
    { value: '99.9%', label: 'Platform Uptime' },
  ],
  sections: [
    {
      type: 'benefits',
      title: 'Grow Your Restaurant Business',
      items: [
        { title: 'Expand Customer Reach', body: 'Access millions of new customers through our delivery network and increase your restaurant\'s visibility in the market.' },
        { title: 'Streamline Operations', body: 'Automate order management, reduce phone calls, and focus on what you do best - creating great food.' },
        { title: 'Boost Revenue', body: 'Increase off-premise sales and grow your business with our proven platform that delivers real results.' },
        { title: 'Professional Support', body: 'Get dedicated merchant support and powerful tools to optimize your restaurant\'s performance and growth.' },
      ],
    },
    {
      type: 'testimonials',
      title: 'Join Thousands of Successful Restaurants',
      items: [
        { title: 'Maria Rodriguez, Taco Bell Franchise', body: 'DoorDash increased our off-premise sales by 250%. The platform is reliable and the support team is excellent.' },
        { title: 'James Chen, Local Asian Fusion', body: 'We\'ve reached customers we never could before. Our revenue has doubled since joining DoorDash.' },
      ],
    },
    {
      type: 'faq',
      title: 'Merchant Questions',
      items: [
        { title: 'How do I get started?', body: 'Sign up online in minutes. Our dedicated merchant success team will help you integrate your menu and optimize performance.' },
        { title: 'What are the costs?', body: 'No setup fees, no monthly fees. You only pay a commission on successfully delivered orders. Transparent pricing.' },
        { title: 'What support do you provide?', body: '24/7 technical support, dedicated account management, marketing assistance, and performance optimization tools.' },
      ],
    },
  ],
  closingCTA: {
    headline: 'Ready to Grow Your Restaurant?',
    body: 'Join the DoorDash merchant network and start increasing your revenue today. No setup fees, dedicated support, and proven results.',
    primaryCTA: { label: 'Get Started Free', href: '#signup' },
  },
};

const EXAMPLE_CONSUMER_SPEC = {
  brand: 'DoorDash',
  audience: 'consumer',
  pageGoal: 'Food delivery signups',
  hero: {
    headline: 'Your Favorite Restaurants, Delivered',
    subheadline: 'Get food delivery from thousands of restaurants in your area. Order now and get it delivered to your door.',
    primaryCTA: { label: 'Order Now', href: '#order' },
    secondaryCTA: { label: 'Explore Restaurants', href: '#restaurants' },
  },
  stats: [
    { value: '50K+', label: 'Restaurant Partners' },
    { value: '25M+', label: 'Orders Delivered' },
    { value: '30min', label: 'Average Delivery' },
  ],
  sections: [
    {
      type: 'benefits',
      title: 'Why Choose DoorDash',
      items: [
        { title: 'Huge Selection', body: 'Access thousands of local restaurants and national chains all in one app.' },
        { title: 'Fast Delivery', body: 'Get your food delivered hot and fresh in 30 minutes or less.' },
        { title: 'Easy Tracking', body: 'Track your order in real-time from kitchen to your door.' },
        { title: 'Great Deals', body: 'Discover exclusive deals and promotions from your favorite restaurants.' },
      ],
    },
  ],
  closingCTA: {
    headline: 'Hungry? Order Now',
    body: 'Download the DoorDash app and get $0 delivery fee on your first order.',
    primaryCTA: { label: 'Order Now', href: '#download' },
  },
};

export async function POST(req: Request) {
  console.log('🚀 MULTI-STEP PIPELINE START');

  let body: any = {};
  try {
    body = await req.json();
    const input = {
      adInputType: body.adInputType || 'copy',
      adInputValue: body.adInputValue || '',
      targetUrl: body.targetUrl,
      targetAudience: body.targetAudience || 'auto',
      designStyle: body.designStyle || 'auto',
    };

    // Extract brand first (no AI needed)
    const brandName = extractBrand(input.targetUrl);
    const audience = detectAudience(input.targetUrl, input.targetAudience);
    const isMerchant = audience === 'merchant' || audience === 'b2b';

    console.log(`✅ Brand: "${brandName}", Audience: "${audience}"`);

    // Build multi-step analysis prompt
    const prompt = buildAnalysisPrompt(input, brandName, audience);
    let result: any;
    let engine = 'groq';
    let modelUsed = '';
    let analysisSteps = 0;

    // 🚀 ENGINE 1: TRY GROQ FIRST
    try {
      console.log('🔄 Trying Groq...');
      const groqResult = await runGroqText(prompt, {});
      console.log(`✅ Groq success: ${groqResult.model}`);
      result = safeParseSpec(groqResult.text, brandName, audience, isMerchant);
      modelUsed = groqResult.model;
      analysisSteps = 1;
    } catch (groqError) {
      console.log('❌ Groq failed, trying Gemini...');

      // 🚀 ENGINE 2: GEMINI
      try {
        engine = 'gemini';
        console.log('🔄 Trying Gemini...');
        const geminiResult = await runGeminiText(prompt);
        console.log(`✅ Gemini success: ${geminiResult.model}`);
        result = safeParseSpec(geminiResult.text, brandName, audience, isMerchant);
        modelUsed = geminiResult.model;
        analysisSteps = 1;
      } catch (geminiError) {
        console.log('❌ Both AI failed, generating custom fallback...');
        
        // Generate brand-specific fallback based on ad content
        result = {
          spec: generateSmartFallback(brandName, audience, input.adInputValue, isMerchant),
          report: { valid: true, issues: ['AI generation failed, using smart fallback'] },
          qualityScore: 75,
        };
        engine = 'fallback';
        modelUsed = 'smart-fallback';
        analysisSteps = 0;
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
        steps: analysisSteps,
      },
    });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR:', error.message);

    const targetUrl = body?.targetUrl || 'https://example.com';
    const brandName = extractBrand(targetUrl);
    const audience = detectAudience(targetUrl, body?.targetAudience);
    const isMerchant = audience === 'merchant' || audience === 'b2b';
    
    const spec = generateSmartFallback(brandName, audience, body?.adInputValue || '', isMerchant);
    const previewId = nanoid(10);

    return NextResponse.json({
      success: true,
      previewId,
      spec,
      report: { valid: true },
      qualityScore: 70,
      engine: 'fallback',
      model: 'error-recovery',
      debug: {
        brand: brandName,
        audience,
        hero: spec.hero.headline,
        sections: spec.sections.length,
        status: 'error-recovery'
      },
    });
  }
}

// 🚀 MULTI-STEP ANALYSIS PROMPT BUILDER
function buildAnalysisPrompt(input: any, brandName: string, audience: string) {
  const isMerchant = audience === 'merchant' || audience === 'b2b';
  const example = isMerchant ? EXAMPLE_MERCHANT_SPEC : EXAMPLE_CONSUMER_SPEC;
  
  return `You are an expert landing page strategist. Generate a high-converting landing page spec for ${brandName}.

CONTEXT:
- Target URL: ${input.targetUrl}
- Detected Audience: ${audience} (${isMerchant ? 'business/merchant' : 'consumer'})
- Ad Input Type: ${input.adInputType}
- Ad Content: ${input.adInputValue || 'Not provided'}

INSTRUCTIONS:
1. Analyze the ad content to extract: primary hook, user pain points, key benefits, trust signals
2. Create a landing page spec that matches the ${audience} audience
3. Use the example below as a quality reference - match this depth and professionalism

EXAMPLE OUTPUT (${audience}):
${JSON.stringify(example, null, 2)}

REQUIRED OUTPUT:
Return ONLY valid JSON matching this structure:
{
  "brand": "string - brand name",
  "audience": "string - merchant|consumer|b2b",
  "pageGoal": "string - conversion goal",
  "hero": {
    "headline": "string - compelling headline",
    "subheadline": "string - supporting description",
    "primaryCTA": {"label": "string", "href": "#action"},
    "secondaryCTA": {"label": "string", "href": "#action2"}
  },
  "stats": [{"value": "string", "label": "string"}],
  "sections": [
    {
      "type": "benefits|testimonials|faq|features",
      "title": "string",
      "items": [{"title": "string", "body": "string"}]
    }
  ],
  "closingCTA": {
    "headline": "string",
    "body": "string", 
    "primaryCTA": {"label": "string", "href": "#action"}
  }
}

CRITICAL: Return ONLY valid JSON - no markdown fences, no extra text.`;
}

// 🚀 SMART SPEC PARSER
function safeParseSpec(text: string, brandName: string, audience: string, isMerchant: boolean) {
  try {
    const rawSpec = JSON.parse(text);
    
    // Validate has required fields
    if (!rawSpec.hero?.headline || !rawSpec.stats) {
      throw new Error('Missing required fields');
    }
    
    return {
      spec: normalizeSpec(rawSpec, brandName, isMerchant),
      report: { valid: true, issues: [] },
      qualityScore: calculateQualityScore(normalizeSpec(rawSpec, brandName, isMerchant)),
    };
  } catch (error) {
    console.log('JSON parse/validation failed:', error.message);
    return {
      spec: generateSmartFallback(brandName, audience, '', isMerchant),
      report: { valid: false, issues: [error.message] },
      qualityScore: 70,
    };
  }
}



// 🚀 SPEC NORMALIZATION
function normalizeSpec(rawSpec: any, brandName: string, isMerchant: boolean) {
  return {
    brand: rawSpec.brand || brandName,
    audience: rawSpec.audience || (isMerchant ? 'merchant' : 'consumer'),
    pageGoal: rawSpec.pageGoal || 'Drive conversions',
    hero: {
      headline: rawSpec.hero?.headline || `${brandName} - ${isMerchant ? 'Grow Your Business' : 'Premium Service'}`,
      subheadline: rawSpec.hero?.subheadline || `Discover ${brandName} services tailored for your ${isMerchant ? 'business' : 'needs'}`,
      primaryCTA: rawSpec.hero?.primaryCTA || { label: 'Get Started', href: '#signup' },
      secondaryCTA: rawSpec.hero?.secondaryCTA || { label: 'Learn More', href: '#learn' },
    },
    stats: Array.isArray(rawSpec.stats) ? rawSpec.stats.slice(0, 3) : (isMerchant 
      ? [
          { value: '500K+', label: 'Active Merchants' },
          { value: '300%', label: 'Revenue Increase' },
          { value: '99.9%', label: 'Platform Uptime' },
        ]
      : [
          { value: '50K+', label: 'Partners' },
          { value: '25M+', label: 'Orders' },
          { value: '30min', label: 'Avg Delivery' },
        ]
    ),
    sections: Array.isArray(rawSpec.sections) ? rawSpec.sections.slice(0, 4) : generateDefaultSections(isMerchant),
    closingCTA: rawSpec.closingCTA || {
      headline: isMerchant ? 'Ready to Grow Your Business?' : 'Ready to Get Started?',
      body: isMerchant 
        ? 'Join thousands of businesses already growing with us.'
        : 'Join millions of satisfied customers today.',
      primaryCTA: { label: 'Get Started', href: '#signup' },
    },
  };
}

function generateDefaultSections(isMerchant: boolean) {
  if (isMerchant) {
    return [
      {
        type: 'benefits',
        title: 'Grow Your Business',
        items: [
          { title: 'Expand Reach', body: 'Access millions of new customers through our platform.' },
          { title: 'Boost Revenue', body: 'Increase sales with proven tools and strategies.' },
          { title: 'Expert Support', body: 'Get dedicated support from our merchant success team.' },
        ],
      },
    ];
  }
  return [
    {
      type: 'benefits',
      title: 'Why Choose Us',
      items: [
        { title: 'Quality Service', body: 'We deliver exceptional results.' },
        { title: 'Easy to Use', body: 'Simple, intuitive experience.' },
        { title: '24/7 Support', body: 'Always here when you need us.' },
      ],
    },
  ];
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

function detectAudience(url: string, targetAudience?: string): string {
  // Use explicit audience if provided
  if (targetAudience && targetAudience !== 'auto') {
    return targetAudience;
  }
  
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('shop') || hostname.includes('store') || hostname.includes('retail')) return 'consumer';
    if (hostname.includes('business') || hostname.includes('enterprise') || hostname.includes('merchant') || hostname.includes('partner')) return 'merchant';
    if (hostname.includes('b2b') || hostname.includes('pro')) return 'b2b';
    return 'consumer';
  } catch {
    return 'consumer';
  }
}

function calculateQualityScore(spec: any): number {
  let score = 60;

  if (spec.brand && spec.brand !== 'Unknown' && spec.brand !== 'Premium Service') {
    score += 15;
  }

  if (spec.hero?.headline && spec.hero.headline.length > 10) {
    score += 10;
  }

  if (spec.hero?.primaryCTA?.label && spec.hero.primaryCTA.label.length > 3) {
    score += 5;
  }

  if (spec.stats?.length >= 3) {
    score += 5;
  }

  const sectionsScore = Math.min((spec.sections?.length || 0) * 5, 20);
  score += sectionsScore;

  return Math.min(score, 100);
}

// 🚀 SMART FALLBACK - generates content based on brand and ad input
function generateSmartFallback(brandName: string, audience: string, adContent: string, isMerchant: boolean) {
  // Extract key terms from ad content if provided
  const adTerms = adContent.toLowerCase();
  
  // Build custom content from ad if available
  const customHooks = extractHooksFromAd(adContent, brandName, isMerchant);
  
  return {
    brand: brandName,
    audience: isMerchant ? 'merchant' : 'consumer',
    pageGoal: isMerchant ? 'Get more restaurant signups' : 'Get more orders/signups',
    hero: {
      headline: customHooks.headline || (isMerchant ? `Grow Your Business with ${brandName}` : `${brandName} - Your Favorite, Delivered`),
      subheadline: customHooks.subheadline || `Join ${isMerchant ? 'thousands of businesses' : 'millions of customers'} already using ${brandName}.`,
      primaryCTA: { label: isMerchant ? 'Get Started Free' : 'Order Now', href: '#signup' },
      secondaryCTA: { label: isMerchant ? 'Schedule Demo' : 'Learn More', href: '#learn' },
    },
    stats: isMerchant 
      ? [
          { value: '500K+', label: 'Active Merchants' },
          { value: '300%', label: 'Avg Revenue Increase' },
          { value: '99.9%', label: 'Platform Uptime' },
        ]
      : [
          { value: '50K+', label: 'Restaurant Partners' },
          { value: '25M+', label: 'Orders Delivered' },
          { value: '30min', label: 'Avg Delivery Time' },
        ],
    sections: isMerchant 
      ? [
          {
            type: 'benefits',
            title: 'Grow Your Restaurant Business',
            items: [
              { title: 'Expand Customer Reach', body: 'Access millions of new customers through our delivery network.' },
              { title: 'Streamline Operations', body: 'Automate order management and focus on what you do best.' },
              { title: 'Boost Revenue', body: 'Increase off-premise sales with our proven platform.' },
              { title: 'Professional Support', body: 'Get dedicated support and powerful tools to optimize performance.' },
            ],
          },
          {
            type: 'testimonials', 
            title: 'Join Thousands of Successful Restaurants',
            items: [
              { title: 'Restaurant Owner', body: `Since joining ${brandName}, our sales have doubled. Great platform!` },
              { title: 'Business Owner', body: `The best decision we made. ${brandName} delivers real results.` },
            ],
          },
          {
            type: 'faq',
            title: isMerchant ? 'Merchant Questions' : 'Common Questions',
            items: [
              { title: 'How do I get started?', body: `Sign up online in minutes. Our team will help you get set up fast.` },
              { title: 'What are the costs?', body: 'Transparent pricing with no hidden fees.' },
              { title: 'What support do you provide?', body: '24/7 support, dedicated account management, and performance tools.' },
            ],
          },
        ]
      : [
          {
            type: 'benefits',
            title: `Why Choose ${brandName}`,
            items: [
              { title: 'Huge Selection', body: 'Access thousands of local restaurants all in one app.' },
              { title: 'Fast Delivery', body: 'Get your food delivered hot and fresh fast.' },
              { title: 'Easy Tracking', body: 'Track your order in real-time.' },
              { title: 'Great Deals', body: 'Discover exclusive deals and promotions.' },
            ],
          },
        ],
    closingCTA: {
      headline: isMerchant ? 'Ready to Grow Your Business?' : 'Ready to Get Started?',
      body: isMerchant 
        ? `Join the ${brandName} merchant network today.`
        : `Get started with ${brandName} today.`,
      primaryCTA: { label: isMerchant ? 'Get Started Free' : 'Order Now', href: '#signup' },
    },
  };
}

// Extract content hooks from ad input
function extractHooksFromAd(adContent: string, brandName: string, isMerchant: boolean): { headline?: string; subheadline?: string } {
  if (!adContent || adContent.length < 10) return {};
  
  // Extract key phrases from ad
  const words = adContent.split(/[\s,.!?]+/).filter(w => w.length > 4);
  const keyPhrases = words.slice(0, 5);
  
  // Try to create relevant headlines
  if (isMerchant) {
    return {
      headline: `Grow Your Business with ${brandName}`,
      subheadline: `${adContent.substring(0, 150)}...`,
    };
  }
  
  return {
    headline: `${brandName}: ${keyPhrases[0] || 'Premium Service'}`,
    subheadline: adContent.substring(0, 150),
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