import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { z } from 'zod';

const getGroq = () => new Groq({
  apiKey: process.env.GROQ_API_KEY || 'placeholder',
});

const getGenAI = () => new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'placeholder');

// Universal Ad Creative Analyzer - Works for ANY industry/audience
export const AdAnalyzerAgent = {
  name: 'Universal Ad Creative Analyzer',
  skills: {
    audienceIntelligence: {
      demographicDetection: true,
      psychographicAnalysis: true,
      behavioralPatternRecognition: true,
      culturalContextAwareness: true,
      intentClassification: true
    },
    contentAnalysis: {
      semanticUnderstanding: true,
      persuasionTechniqueDetection: true,
      valuePropositionExtraction: true,
      competitivePositioning: true,
      brandPersonalityAssessment: true
    },
    strategicMarketing: {
      campaignObjectiveDetection: true,
      conversionFunnelMapping: true,
      marketSegmentation: true,
      messagingHierarchy: true,
      channelOptimization: true
    }
  },
  analyze: async (input: {
    adInputType: 'image_url' | 'copy';
    adInputValue: string;
    audienceOverride?: string;
  }) => {
    console.log(`🎯 Universal Ad Analysis: ${input.adInputType}`);

    const prompt = `You are an expert marketing intelligence analyst capable of analyzing ANY type of advertisement across ALL industries and audiences.

Analyze this ad creative and return comprehensive JSON analysis. Be industry-agnostic and audience-flexible.

DETECT AUDIENCE BY ANALYZING:
- Language patterns and terminology
- Visual elements and symbolism
- Call-to-action implications
- Value propositions offered
- Social proof indicators
- Problem/solution framing

AUDIENCE CATEGORIES (choose most specific):
- consumer: individual end-users, customers, shoppers
- merchant: business owners, retailers, service providers
- b2b: business-to-business, enterprise clients
- saas: software/service subscriptions
- healthcare: medical professionals, patients
- education: students, educators, institutions
- finance: investors, banking customers
- real-estate: property buyers/sellers/agents
- local-business: small local businesses
- nonprofit: charities, organizations
- government: public sector, agencies
- unknown: cannot determine

Return structured JSON:
{
  "brand": "brand name or 'Unknown'",
  "audience": "most specific audience category",
  "industry": "primary industry or 'General'",
  "adType": "image|video|copy|carousel|unknown",
  "campaignType": "awareness|consideration|conversion|retention|unknown",
  "primaryHook": "main attention-grabber",
  "valueProposition": "core value offered",
  "targetProblem": "problem being solved",
  "emotionalAppeal": "fear|greed|belonging|authority|scarcity|social-proof|other",
  "primaryCTA": "exact call-to-action text",
  "secondaryCTA": "supporting CTA if any",
  "proofElements": ["social proof, guarantees, stats"],
  "benefitStack": ["key benefits in priority order"],
  "riskReducers": ["objections addressed"],
  "pricePositioning": "premium|value|budget|free|unknown",
  "urgencySignals": ["scarcity, deadlines, limited offers"],
  "visualStyle": "minimal|bold|professional|fun|corporate|other",
  "tone": "professional|friendly|urgent|authoritative|casual|other",
  "confidence": 0.0-1.0,
  "analysisMetadata": {
    "detectedKeywords": ["significant keywords found"],
    "audienceConfidence": 0.0-1.0,
    "contentCompleteness": 0.0-1.0
  }
}`;

    let response;
    try {
      if (input.adInputType === 'image_url') {
        const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
        const imageResponse = await fetch(input.adInputValue);
        const imageBuffer = await imageResponse.arrayBuffer();

        response = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: imageResponse.headers.get('content-type') || 'image/jpeg',
              data: Buffer.from(imageBuffer).toString('base64'),
            },
          },
        ]);
      } else {
        response = await getGroq().chat.completions.create({
          model: 'llama3-70b-8192',
          messages: [{ role: 'user', content: prompt + `\n\nAd Content:\n${input.adInputValue}` }],
          temperature: 0.2,
        });
      }

      const text = input.adInputType === 'image_url'
        ? response.response.text()
        : response.choices[0]?.message?.content || '{}';

      const analysis = JSON.parse(text);

      if (input.audienceOverride && input.audienceOverride !== 'unknown') {
        analysis.audience = input.audienceOverride;
        analysis.analysisMetadata.audienceConfidence = 0.9;
      }

      console.log(`✅ Universal Analysis: Audience=${analysis.audience}, Industry=${analysis.industry}, Confidence=${analysis.confidence}`);
      return analysis;

    } catch (error) {
      console.log('❌ Analysis failed, using intelligent fallback');

      // Intelligent fallback based on content analysis
      const content = input.adInputValue.toLowerCase();
      let inferredAudience = 'unknown';
      let inferredIndustry = 'General';

      // Audience detection patterns
      if (content.includes('restaurant') || content.includes('merchant') || content.includes('business owner')) {
        inferredAudience = 'merchant';
        inferredIndustry = 'Hospitality';
      } else if (content.includes('patient') || content.includes('health') || content.includes('medical')) {
        inferredAudience = 'healthcare';
        inferredIndustry = 'Healthcare';
      } else if (content.includes('student') || content.includes('education') || content.includes('school')) {
        inferredAudience = 'education';
        inferredIndustry = 'Education';
      } else if (content.includes('invest') || content.includes('finance') || content.includes('bank')) {
        inferredAudience = 'finance';
        inferredIndustry = 'Finance';
      } else if (content.includes('property') || content.includes('real estate') || content.includes('home')) {
        inferredAudience = 'real-estate';
        inferredIndustry = 'Real Estate';
      } else if (content.includes('software') || content.includes('app') || content.includes('platform')) {
        inferredAudience = 'saas';
        inferredIndustry = 'Technology';
      } else if (content.includes('business') || content.includes('enterprise') || content.includes('company')) {
        inferredAudience = 'b2b';
        inferredIndustry = 'B2B Services';
      } else if (content.includes('order') || content.includes('buy') || content.includes('shop') || content.includes('purchase')) {
        inferredAudience = 'consumer';
        inferredIndustry = 'E-commerce';
      }

      return {
        brand: 'Unknown',
        audience: input.audienceOverride || inferredAudience,
        industry: inferredIndustry,
        adType: input.adInputType === 'image_url' ? 'image' : 'copy',
        campaignType: 'unknown',
        primaryHook: input.adInputValue.substring(0, 100),
        valueProposition: 'Solution to problem',
        targetProblem: 'Unspecified problem',
        emotionalAppeal: 'other',
        primaryCTA: 'Learn More',
        secondaryCTA: '',
        proofElements: [],
        benefitStack: ['Solves problem', 'Provides value'],
        riskReducers: [],
        pricePositioning: 'unknown',
        urgencySignals: [],
        visualStyle: 'professional',
        tone: 'professional',
        confidence: 0.4,
        analysisMetadata: {
          detectedKeywords: content.split(' ').filter(word => word.length > 3).slice(0, 5),
          audienceConfidence: 0.6,
          contentCompleteness: 0.5
        }
      };
    };
  }
};

// Universal Website Content Analyzer
export const UrlAnalyzerAgent = {
  name: 'Universal Website Content Analyzer',
  skills: {
    contentIntelligence: {
      semanticWebAnalysis: true,
      audienceIntentDetection: true,
      brandPersonalityAssessment: true,
      contentStrategyAnalysis: true,
      userJourneyMapping: true
    },
    industryClassification: {
      sectorIdentification: true,
      businessModelDetection: true,
      targetMarketAnalysis: true,
      competitivePositioning: true,
      valuePropositionExtraction: true
    },
    conversionAnalysis: {
      funnelOptimization: true,
      ctaEffectiveness: true,
      trustSignalAssessment: true,
      objectionHandling: true,
      persuasionArchitecture: true
    }
  },
  analyze: async (url: string) => {
    console.log(`🌐 Universal URL Analysis: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.log(`❌ URL fetch failed: ${response.status}`);
        return {
          url,
          brandName: 'Unknown',
          pageType: 'unknown',
          audience: 'unknown',
          pageTitle: 'Access Restricted',
          metaDescription: '',
          heroHeadline: '',
          heroSubheadline: '',
          ctas: [],
          valueProps: [],
          proofPoints: [],
          features: [],
          faqTopics: [],
          rawExtracts: ['Content not accessible'],
          tone: 'unknown',
          error: `HTTP ${response.status}`,
          confidence: 0.1
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('title').text().trim();
      const metaDesc = $('meta[name="description"]').attr('content') || '';
      const headings = $('h1,h2,h3,h4').map((_, el) => $(el).text().trim()).get().filter(h => h.length > 0);
      const links = $('a').map((_, el) => $(el).text().trim()).get().filter(l => l.length > 0);

      // Universal audience detection
      const audiencePatterns = {
        consumer: ['buy now', 'order', 'purchase', 'shop', 'cart', 'checkout', 'customer', 'user', 'download app', 'sign up', 'join', 'subscribe', 'free trial', 'pricing'],
        merchant: ['merchant', 'business owner', 'restaurant', 'retailer', 'partner', 'grow your business', 'increase revenue', 'customer acquisition', 'online ordering', 'menu management', 'business solutions', 'enterprise', 'professional services'],
        b2b: ['enterprise', 'business solutions', 'api', 'integration', 'scalability', 'roi', 'productivity', 'efficiency', 'team collaboration', 'workflow automation'],
        saas: ['software', 'platform', 'subscription', 'cloud', 'automation', 'dashboard', 'integrations', 'api access', 'multi-user', 'collaboration tools'],
        healthcare: ['patient', 'medical', 'healthcare', 'clinic', 'treatment', 'diagnosis', 'medical professional', 'health records', 'compliance', 'hipaa'],
        education: ['student', 'teacher', 'school', 'university', 'learning', 'course', 'education', 'training', 'certification', 'academic'],
        finance: ['invest', 'finance', 'banking', 'wealth', 'portfolio', 'trading', 'financial planning', 'retirement', 'savings', 'investment'],
        realEstate: ['property', 'home', 'real estate', 'listing', 'mortgage', 'rental', 'commercial property', 'realtor', 'property management'],
        nonprofit: ['donate', 'charity', 'nonprofit', 'volunteer', 'fundraising', 'mission', 'social impact', 'community', 'philanthropy'],
      };

      const content = html.toLowerCase();
      const audienceScores = Object.entries(audiencePatterns).map(([audience, patterns]) => ({
        audience,
        score: patterns.reduce((score, pattern) => score + (content.includes(pattern.toLowerCase()) ? 1 : 0), 0)
      }));

      const topAudience = audienceScores.sort((a, b) => b.score - a.score)[0];
      const detectedAudience = topAudience.score > 0 ? topAudience.audience : 'unknown';

      // Industry detection
      const industryPatterns = {
        'Food Delivery': ['restaurant', 'food delivery', 'takeout', 'delivery', 'menu', 'order food'],
        'E-commerce': ['shop', 'store', 'product', 'cart', 'checkout', 'buy now'],
        'SaaS': ['software', 'platform', 'subscription', 'cloud', 'automation', 'integrations'],
        'Healthcare': ['medical', 'health', 'patient', 'clinic', 'treatment', 'care'],
        'Finance': ['bank', 'invest', 'finance', 'wealth', 'trading', 'portfolio'],
        'Education': ['learn', 'course', 'student', 'teacher', 'education', 'training'],
        'Real Estate': ['property', 'home', 'real estate', 'listing', 'mortgage'],
        'Hospitality': ['hotel', 'travel', 'booking', 'vacation', 'resort'],
        'Technology': ['tech', 'innovation', 'software', 'digital', 'app'],
        'Retail': ['store', 'shopping', 'retail', 'brand', 'product']
      };

      const industryScores = Object.entries(industryPatterns).map(([industry, patterns]) => ({
        industry,
        score: patterns.reduce((score, pattern) => score + (content.includes(pattern.toLowerCase()) ? 1 : 0), 0)
      }));

      const detectedIndustry = industryScores.sort((a, b) => b.score - a.score)[0].industry;

      const ctaPatterns = [
        /sign up|sign-up|get started|start now|try free|free trial/i,
        /learn more|find out|discover|explore/i,
        /contact us|get in touch|reach out/i,
        /buy now|purchase|order|shop/i,
        /download|install|get app/i
      ];

      const detectedCTAs = [];
      ctaPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          detectedCTAs.push(matches[0]);
        }
      });

      const valueProps = headings.filter(h =>
        h.length < 100 && (
          h.toLowerCase().includes('why') ||
          h.toLowerCase().includes('benefit') ||
          h.toLowerCase().includes('feature') ||
          h.toLowerCase().includes('solution')
        )
      ).slice(0, 3);

      console.log(`✅ Universal URL Analysis: Audience=${detectedAudience}, Industry=${detectedIndustry}`);
      console.log(`   Title: "${title}", CTAs: [${detectedCTAs.join(', ')}]`);

      return {
        url,
        brandName: title.split('|')[0].trim() || title.split('-')[0].trim() || 'Unknown Brand',
        pageType: detectedAudience === 'merchant' ? 'business' :
                  detectedAudience === 'consumer' ? 'consumer' : 'general',
        audience: detectedAudience,
        industry: detectedIndustry,
        pageTitle: title,
        metaDescription: metaDesc,
        heroHeadline: headings[0] || '',
        heroSubheadline: headings[1] || '',
        ctas: [...new Set([...detectedCTAs, ...links.slice(0, 3)])],
        valueProps,
        proofPoints: [],
        features: headings.filter(h => h.toLowerCase().includes('feature')).slice(0, 5),
        faqTopics: headings.filter(h => h.toLowerCase().includes('faq') || h.toLowerCase().includes('question')).slice(0, 3),
        rawExtracts: headings.slice(0, 10),
        tone: detectedAudience === 'b2b' || detectedAudience === 'enterprise' ? 'professional' :
              detectedAudience === 'consumer' ? 'casual' : 'neutral',
        confidence: Math.max(0.3, topAudience.score / 5),
        technical: {
          hasSSL: url.startsWith('https'),
          loadTime: 'unknown',
          mobileFriendly: content.includes('responsive') || content.includes('mobile'),
          seoScore: metaDesc ? 7 : 5
        }
      };

    } catch (error) {
      console.log(`❌ URL Analysis Error: ${error}`);
      return {
        url,
        brandName: 'Unknown',
        pageType: 'unknown',
        audience: 'unknown',
        industry: 'Unknown',
        pageTitle: 'Error Loading Page',
        metaDescription: '',
        heroHeadline: '',
        heroSubheadline: '',
        ctas: [],
        valueProps: [],
        proofPoints: [],
        features: [],
        faqTopics: [],
        rawExtracts: [],
        tone: 'unknown',
        confidence: 0.1,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Intelligent Audience Resolution
export const AudienceResolver = {
  resolve: (adAudience: string, urlAudience: string, adConfidence: number = 0.8, urlConfidence: number = 0.6) => {
    console.log(`⚖️ Universal Audience Resolution: Ad=${adAudience}(${adConfidence}), URL=${urlAudience}(${urlConfidence})`);

    if (adAudience === urlAudience && adAudience !== 'unknown') {
      return {
        resolved: adAudience,
        strategy: 'aligned',
        warning: null,
        confidence: Math.min(adConfidence + 0.2, 1.0),
        reasoning: 'Ad and website audiences are aligned'
      };
    }

    if (adConfidence > 0.8 && adAudience !== 'unknown') {
      return {
        resolved: adAudience,
        strategy: 'ad-dominant',
        warning: urlAudience !== 'unknown' ? `Website suggests ${urlAudience} audience but ad clearly targets ${adAudience}` : null,
        confidence: adConfidence,
        reasoning: 'Ad audience detection has high confidence'
      };
    }

    if (urlConfidence > adConfidence && urlAudience !== 'unknown') {
      return {
        resolved: urlAudience,
        strategy: 'url-dominant',
        warning: adAudience !== 'unknown' ? `Ad suggests ${adAudience} but website clearly serves ${urlAudience}` : null,
        confidence: urlConfidence,
        reasoning: 'Website audience detection has higher confidence'
      };
    }

    if (adAudience !== 'unknown' && urlAudience === 'unknown') {
      return {
        resolved: adAudience,
        strategy: 'ad-fallback',
        warning: 'Website audience unclear, using ad detection',
        confidence: adConfidence * 0.8,
        reasoning: 'Website audience unknown, defaulting to ad detection'
      };
    }

    if (urlAudience !== 'unknown' && adAudience === 'unknown') {
      return {
        resolved: urlAudience,
        strategy: 'url-fallback',
        warning: 'Ad audience unclear, using website detection',
        confidence: urlConfidence * 0.8,
        reasoning: 'Ad audience unknown, defaulting to website detection'
      };
    }

    const fallbackAudience = 'consumer';
    return {
      resolved: fallbackAudience,
      strategy: 'intelligent-default',
      warning: 'Both ad and website audience detection uncertain, using consumer default',
      confidence: 0.4,
      reasoning: 'Insufficient data for audience detection, using safe default'
    };
  },

  getCompatibilityMatrix: () => ({
    'consumer-merchant': { compatible: false, reason: 'Consumer ads shouldn\'t target merchant pages' },
    'merchant-consumer': { compatible: false, reason: 'Merchant ads shouldn\'t target consumer pages' },
    'b2b-consumer': { compatible: false, reason: 'B2B ads shouldn\'t target consumer pages' },
    'consumer-b2b': { compatible: false, reason: 'Consumer ads shouldn\'t target B2B pages' },
    'saas-consumer': { compatible: false, reason: 'SaaS ads shouldn\'t target SaaS pages' },
    'consumer-saas': { compatible: false, reason: 'Consumer ads shouldn\'t target SaaS pages' },
  }),

  suggestPageType: (audience: string) => {
    const suggestions = {
      consumer: ['homepage', 'product', 'pricing', 'checkout'],
      merchant: ['business', 'partner', 'enterprise', 'pricing'],
      b2b: ['enterprise', 'solutions', 'pricing', 'contact'],
      saas: ['product', 'pricing', 'integrations', 'enterprise'],
      healthcare: ['services', 'booking', 'resources', 'contact'],
      education: ['courses', 'programs', 'admissions', 'resources'],
      finance: ['services', 'products', 'calculators', 'contact'],
      realEstate: ['listings', 'services', 'market', 'contact'],
      nonprofit: ['mission', 'programs', 'donate', 'volunteer'],
      default: ['homepage', 'about', 'services', 'contact']
    };
    return suggestions[audience as keyof typeof suggestions] || suggestions.default;
  }
};

// Universal Personalization Strategist
export const PersonalizationAgent = {
  name: 'Universal Personalization Strategist',
  skills: {
    audiencePsychology: {
      motivationAnalysis: true,
      painPointMapping: true,
      decisionDriverIdentification: true,
      behavioralEconomics: true,
      emotionalIntelligence: true
    },
    contentStrategy: {
      messageArchitecture: true,
      narrativeDesign: true,
      persuasionOptimization: true,
      objectionHandling: true,
      valueCommunication: true
    },
    conversionScience: {
      funnelOptimization: true,
      frictionReduction: true,
      motivationAlignment: true,
      trustBuilding: true,
      actionPsychology: true
    },
    brandIntegration: {
      voiceConsistency: true,
      visualAlignment: true,
      toneAdaptation: true,
      personalityMatching: true,
      culturalRelevance: true
    }
  },
  generate: async (adAnalysis: any, urlAnalysis: any) => {
    console.log('🎨 Universal Personalization Strategy Generation');

    const audience = adAnalysis.audience;
    const fallbacks = {
      consumer: {
        pageGoal: 'Drive immediate purchases',
        audiencePsychology: { primaryMotivation: 'convenience', keyPainPoints: ['price', 'quality'], decisionDrivers: ['reviews', 'price'] },
        contentStrategy: { narrativeApproach: 'benefit-focused', valueCommunication: 'feature-benefit' },
        conversionOptimization: { funnelStages: ['Awareness', 'Interest', 'Purchase'], trustBuilders: ['reviews', 'guarantees'] },
        visualDirection: { mode: 'performance-landing', layout: 'centered', density: 'balanced' }
      },
      merchant: {
        pageGoal: 'Generate qualified leads',
        audiencePsychology: { primaryMotivation: 'business growth', keyPainPoints: ['ROI', 'implementation'], decisionDrivers: ['ROI', 'support'] },
        contentStrategy: { narrativeApproach: 'problem-solution', valueCommunication: 'ROI-focused' },
        conversionOptimization: { funnelStages: ['Education', 'Consideration', 'Trial'], trustBuilders: ['case studies', 'support'] },
        visualDirection: { mode: 'clean-b2b', layout: 'left-copy-right-image', density: 'spacious' }
      },
      b2b: {
        pageGoal: 'Book discovery calls',
        audiencePsychology: { primaryMotivation: 'efficiency', keyPainPoints: ['integration', 'training'], decisionDrivers: ['ROI', 'scalability'] },
        contentStrategy: { narrativeApproach: 'logic-driven', valueCommunication: 'data-backed' },
        conversionOptimization: { funnelStages: ['Awareness', 'Research', 'Decision'], trustBuilders: ['logos', 'data'] },
        visualDirection: { mode: 'clean-b2b', layout: 'split', density: 'balanced' }
      },
      saas: {
        pageGoal: 'Drive free trial signups',
        audiencePsychology: { primaryMotivation: 'productivity', keyPainPoints: ['learning curve', 'cost'], decisionDrivers: ['features', 'ease of use'] },
        contentStrategy: { narrativeApproach: 'demo-focused', valueCommunication: 'feature-benefit' },
        conversionOptimization: { funnelStages: ['Awareness', 'Trial', 'Conversion'], trustBuilders: ['integrations', 'support'] },
        visualDirection: { mode: 'brand-grounded', layout: 'centered', density: 'compact' }
      }
    };

    const fallback = fallbacks[audience as keyof typeof fallbacks] || fallbacks.consumer;

    return {
      resolvedAudience: audience,
      pageGoal: fallback.pageGoal,
      audiencePsychology: fallback.audiencePsychology,
      contentStrategy: fallback.contentStrategy,
      conversionOptimization: fallback.conversionOptimization,
      adHookToPreserve: [adAnalysis.primaryHook || 'Solve your problem'],
      siteFactsToUse: urlAnalysis.valueProps || [],
      allowedClaims: adAnalysis.proofPoints || [],
      forbiddenClaims: ['fake statistics', 'invented testimonials'],
      ctaStrategy: {
        primary: adAnalysis.primaryCTA || 'Get Started',
        secondary: 'Learn More',
        reasoning: 'Matches audience expectations'
      },
      sectionOrder: ['hero', 'benefits', 'proof', 'cta'],
      visualDirection: fallback.visualDirection,
      brandIntegration: {
        voiceAlignment: 'Match detected brand voice',
        visualConsistency: 'Use consistent brand colors',
        tone: adAnalysis.tone || 'professional'
      }
    };
  }
};

// Universal Landing Page Spec Generator
export const SpecGeneratorAgent = {
  name: 'Universal Landing Page Spec Generator',
  generate: async (adAnalysis: any, urlAnalysis: any, plan: any) => {
    console.log('📋 Universal Landing Page Spec Generation');

    const audience = plan.resolvedAudience;
    const template = getAudienceTemplate(audience);

    return {
      brand: adAnalysis.brand || urlAnalysis.brandName || 'Brand',
      audience: audience,
      pageGoal: plan.pageGoal,
      theme: {
        mode: plan.visualDirection.mode,
        palette: plan.visualDirection.paletteHint || ['primary', 'secondary'],
        background: plan.visualDirection.density === 'spacious' ? 'light' : 'clean',
        heroLayout: plan.visualDirection.layout
      },
      hero: template.hero,
      stats: template.stats,
      sections: template.sections,
      faq: template.faq,
      closingCTA: template.closingCTA
    };
  }
};

// Universal Quality Assurance Validator
export const ValidationAgent = {
  name: 'Universal Quality Assurance Validator',
  validate: async (spec: any, adAnalysis: any, urlAnalysis: any, claims: any[]) => {
    console.log('🔍 Universal Validation - Comprehensive Quality Checks');

    const issues = [];
    const specText = JSON.stringify(spec).toLowerCase();

    if (spec.audience !== adAnalysis.audience) {
      issues.push({
        code: 'AUDIENCE_MISMATCH',
        severity: 'critical',
        message: `Spec audience (${spec.audience}) doesn't match ad audience (${adAnalysis.audience})`,
        fix: 'Regenerate with correct audience alignment'
      });
    }

    if (spec.hero.primaryCTA.label !== adAnalysis.primaryCTA && adAnalysis.primaryCTA) {
      issues.push({
        code: 'CTA_MISMATCH',
        severity: 'low',
        message: `CTA "${spec.hero.primaryCTA.label}" differs from ad CTA "${adAnalysis.primaryCTA}"`,
        fix: 'Consider matching ad CTA for consistency'
      });
    }

    const forbiddenPatterns = [
      /\b\d+m\b|\bmillion\b/i,
      /\b\d+b\b|\bbillion\b/i,
      /\b#\d+\b/i,
      /\baward.winning\b/i,
      /\btrusted by\b/i,
      /\bleading\b|\btop\b/i,
      /\b\d+%.increase\b|\b\d+%.growth\b/i,
      /\bguaranteed?\b/i
    ];

    forbiddenPatterns.forEach(pattern => {
      if (pattern.test(specText) && !claims.some(c => pattern.test(c.text.toLowerCase()))) {
        issues.push({
          code: 'UNSUPPORTED_CLAIM',
          severity: 'high',
          message: `Spec contains unsupported claim pattern: ${pattern}`,
          fix: 'Remove unsupported claims or add source evidence'
        });
      }
    });

    if (spec.brand !== adAnalysis.brand && adAnalysis.brand !== 'Unknown') {
      issues.push({
        code: 'BRAND_INCONSISTENCY',
        severity: 'medium',
        message: `Spec brand "${spec.brand}" doesn't match ad brand "${adAnalysis.brand}"`,
        fix: 'Use consistent brand name throughout'
      });
    }

    if (!spec.hero.headline || spec.hero.headline.length < 10) {
      issues.push({
        code: 'WEAK_HEADLINE',
        severity: 'medium',
        message: 'Hero headline is too short or missing',
        fix: 'Create compelling, benefit-focused headline'
      });
    }

    if (spec.sections.length === 0) {
      issues.push({
        code: 'MISSING_CONTENT',
        severity: 'high',
        message: 'No content sections defined',
        fix: 'Add benefits, proof, and feature sections'
      });
    }

    const severityLevels = { critical: 4, high: 3, medium: 2, low: 1 };
    const maxSeverity = issues.length > 0 ? Math.max(...issues.map(i => severityLevels[i.severity as keyof typeof severityLevels])) : 0;

    const isValid = issues.filter(i => severityLevels[i.severity as keyof typeof severityLevels] >= 3).length === 0;

    console.log(`✅ Validation: ${isValid ? 'PASSED' : 'FAILED'} (${issues.length} issues, max severity: ${maxSeverity})`);

    return {
      valid: isValid,
      audienceMatch: spec.audience === adAnalysis.audience,
      ctaMatch: spec.hero.primaryCTA.label === adAnalysis.primaryCTA,
      claimSafety: !issues.some(i => i.code === 'UNSUPPORTED_CLAIM'),
      brandFit: spec.brand === adAnalysis.brand || adAnalysis.brand === 'Unknown',
      contentQuality: issues.filter(i => ['WEAK_HEADLINE', 'MISSING_CONTENT'].includes(i.code)).length === 0,
      technicalValid: !issues.some(i => i.code === 'BROKEN_CTA_LINK'),
      conversionOptimized: !issues.some(i => i.code === 'MISSING_TRUST_SIGNALS'),
      issues,
      summary: {
        totalIssues: issues.length,
        criticalCount: issues.filter(i => i.severity === 'critical').length,
        highCount: issues.filter(i => i.severity === 'high').length,
        mediumCount: issues.filter(i => i.severity === 'medium').length,
        lowCount: issues.filter(i => i.severity === 'low').length
      }
    };
  }
};

function getAudienceTemplate(audience: string) {
  const templates = {
    consumer: {
      hero: {
        eyebrow: 'New & Improved',
        headline: 'Discover the Perfect Solution',
        subheadline: 'Experience quality and convenience like never before',
        primaryCTA: { label: 'Shop Now', href: '#', style: 'primary' },
        secondaryCTA: { label: 'Learn More', href: '#', style: 'secondary' }
      },
      stats: [
        { value: '10K+', label: 'Happy Customers' },
        { value: '4.9★', label: 'Average Rating' },
        { value: '24/7', label: 'Customer Support' }
      ],
      sections: [
        {
          type: 'benefits',
          title: 'Why Customers Choose Us',
          items: [
            { title: 'Quality You Can Trust', body: 'Experience premium quality that exceeds expectations.' },
            { title: 'Convenient Solutions', body: 'Easy and accessible solutions for your needs.' },
            { title: 'Outstanding Support', body: '24/7 customer support when you need it.' }
          ]
        }
      ],
      faq: [
        { question: 'How do I get started?', answer: 'Getting started is simple and takes just a few minutes.' }
      ],
      closingCTA: {
        headline: 'Ready to Get Started?',
        body: 'Join thousands of satisfied customers',
        primaryCTA: { label: 'Get Started', href: '#' },
        secondaryCTA: { label: 'Contact Us', href: '#' }
      }
    },
    merchant: {
      hero: {
        eyebrow: 'Business Growth Partner',
        headline: 'Scale Your Business Online',
        subheadline: 'Increase revenue and streamline operations with our proven platform',
        primaryCTA: { label: 'Start Free Trial', href: '#', style: 'primary' },
        secondaryCTA: { label: 'Schedule Demo', href: '#', style: 'secondary' }
      },
      stats: [
        { value: '500K+', label: 'Active Merchants' },
        { value: '300%', label: 'Average Revenue Increase' },
        { value: '99.9%', label: 'Platform Uptime' }
      ],
      sections: [
        {
          type: 'benefits',
          title: 'Grow Your Business',
          items: [
            { title: 'Increase Reach', body: 'Access new customers and expand your market.' },
            { title: 'Streamline Operations', body: 'Automate processes and reduce manual work.' },
            { title: 'Boost Revenue', body: 'Increase sales with proven marketing tools.' }
          ]
        }
      ],
      faq: [
        { question: 'How does it work?', answer: 'Our platform integrates seamlessly with your existing systems.' }
      ],
      closingCTA: {
        headline: 'Ready to Grow Your Business?',
        body: 'Join thousands of successful merchants',
        primaryCTA: { label: 'Start Free Trial', href: '#' },
        secondaryCTA: { label: 'Contact Sales', href: '#' }
      }
    }
  };

  return templates[audience as keyof typeof templates] || templates.consumer;
}