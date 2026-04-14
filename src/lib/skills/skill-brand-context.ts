// src/lib/skills/skill-brand-context.ts - Brand Context Enrichment System
// Ensures all content generation is deeply brand-aware

import { getBrandPrompt, generateBrandInstructions } from './skill-brand-prompts';
import { inferCategory, getCategoryNarrative, getCategoryColors } from './skill-category-inference';

export interface BrandContext {
  // Brand Identity
  name: string;
  voice: string;
  personality: string[];
  values: string[];
  audience: string;

  // Visual Identity
  colors: { primary: string; accent: string; light: string; dark: string };
  category: string;
  positioning: string;

  // Content Guidelines
  tone: string;
  forbiddenWords: string[];
  requiredPhrases: string[];
  ctaStyle: string;

  // Industry Context
  competitors: string[];
  industryTrends: string[];
  painPoints: string[];
  solutions: string[];
}

// Generate comprehensive brand context
export const generateBrandContext = (brandName: string, url: string): BrandContext => {
  const category = inferCategory(url);
  const brandPrompt = getBrandPrompt(brandName, category.category);
  const categoryInfo = getCategoryNarrative(category.category);
  const colors = getCategoryColors(category.category, brandName);

  // Brand personality based on category
  const personalities: Record<string, string[]> = {
    'fintech': ['trustworthy', 'secure', 'innovative', 'professional', 'exclusive'],
    'food_delivery': ['convenient', 'appetizing', 'fast', 'local', 'varied'],
    'transportation': ['reliable', 'luxurious', 'safe', 'professional', 'punctual'],
    'travel': ['adventurous', 'luxurious', 'memorable', 'personalized', 'exclusive'],
    'saas': ['efficient', 'innovative', 'scalable', 'user-friendly', 'powerful'],
    'ecommerce': ['accessible', 'varied', 'value-driven', 'convenient', 'modern']
  };

  // Brand values based on category
  const values: Record<string, string[]> = {
    'fintech': ['security', 'innovation', 'transparency', 'excellence', 'trust'],
    'food_delivery': ['convenience', 'quality', 'variety', 'speed', 'freshness'],
    'transportation': ['safety', 'reliability', 'comfort', 'professionalism', 'punctuality'],
    'travel': ['exploration', 'luxury', 'memories', 'personalization', 'excellence'],
    'saas': ['efficiency', 'innovation', 'scalability', 'user-experience', 'reliability'],
    'ecommerce': ['accessibility', 'choice', 'value', 'convenience', 'innovation']
  };

  // Industry-specific pain points and solutions
  const industryContext: Record<string, { painPoints: string[], solutions: string[], competitors: string[] }> = {
    'fintech': {
      painPoints: ['financial insecurity', 'complex banking', 'high fees', 'poor customer service'],
      solutions: ['secure investments', 'simple interfaces', 'low fees', '24/7 support'],
      competitors: ['traditional banks', 'other fintech apps', 'investment firms']
    },
    'food_delivery': {
      painPoints: ['limited food options', 'long wait times', 'cold food', 'delivery fees'],
      solutions: ['wide restaurant selection', 'fast delivery', 'hot fresh food', 'free delivery'],
      competitors: ['other delivery apps', 'restaurant delivery', 'fast food chains']
    },
    'transportation': {
      painPoints: ['unreliable rides', 'safety concerns', 'high costs', 'poor driver experience'],
      solutions: ['reliable service', 'verified drivers', 'competitive pricing', 'premium vehicles'],
      competitors: ['taxis', 'other ride apps', 'public transport', 'car rentals']
    }
  };

  const context = industryContext[category.category] || industryContext.other || {
    painPoints: ['common industry problems'],
    solutions: ['effective solutions'],
    competitors: ['market competitors']
  };

  return {
    name: brandName,
    voice: brandPrompt.brandVoice,
    personality: personalities[category.category] || ['professional', 'reliable', 'innovative'],
    values: values[category.category] || ['quality', 'service', 'innovation'],
    audience: categoryInfo?.conversionPath?.primary || 'general consumers',

    colors,
    category: category.category,
    positioning: categoryInfo?.narrativeStyle || 'professional',

    tone: brandPrompt.requiredTone,
    forbiddenWords: brandPrompt.forbiddenPhrases,
    requiredPhrases: [brandPrompt.primaryCta, brandPrompt.secondaryCta],
    ctaStyle: brandPrompt.primaryCta.includes('Book') ? 'action-oriented' : 'premium',

    competitors: context.competitors,
    industryTrends: ['digital transformation', 'personalization', 'mobile-first', 'AI integration'],
    painPoints: context.painPoints,
    solutions: context.solutions
  };
};

// Generate brand-aware headlines
export const generateBrandHeadline = (brandContext: BrandContext, type: 'hero' | 'benefit' | 'social-proof'): string => {
  const { name, personality, category, values, painPoints, solutions } = brandContext;

  const templates = {
    hero: {
      fintech: [`${name} - Your Financial Future, Secured`, `Experience ${name}: Wealth Building, Simplified`, `${name}: Premium Banking for the Modern Age`],
      food_delivery: [`${name} - What You Crave, Delivered`, `Discover Local Flavors with ${name}`, `${name}: Fresh Food, Fast Delivery`],
      transportation: [`${name} - Your Journey, Perfected`, `Luxury Transportation with ${name}`, `${name}: Safe, Reliable, Premium Rides`],
      travel: [`${name} - Elevate Your Adventures`, `Luxury Travel Experiences with ${name}`, `${name}: Where Luxury Meets Exploration`],
      default: [`Experience ${name} - Excellence Redefined`, `${name}: Premium ${category.replace('_', ' ')} Services`]
    },
    benefit: {
      fintech: ['Secure Investments, Lasting Wealth', 'Expert Financial Guidance, Personalized', 'Advanced Security, Peace of Mind'],
      food_delivery: ['Fresh Ingredients, Culinary Excellence', 'Local Restaurants, Global Flavors', 'Fast Delivery, Hot Food Guarantee'],
      transportation: ['Professional Chauffeurs, Luxury Vehicles', 'Safe Journeys, Reliable Service', 'Premium Comfort, Exceptional Care'],
      default: ['Premium Quality, Exceptional Service', 'Expert Craftsmanship, Unmatched Results', 'Innovation Meets Excellence']
    },
    social_proof: {
      fintech: ['Trusted by 10,000+ Investors', '4.9★ Rating from Financial Experts', 'Secure Platform, Happy Customers'],
      food_delivery: ['Serving 500+ Cities, Millions of Meals', '5-Star Rated by Food Lovers', 'Your Favorite Restaurants, Delivered'],
      transportation: ['Trusted by VIP Clients Worldwide', '5-Star Safety Rating, Every Trip', 'Luxury Transportation, Satisfied Customers'],
      default: ['Trusted by Thousands, Rated 5-Stars', 'Industry Leaders Choose Us', 'Satisfied Customers, Proven Results']
    }
  };

  const categoryTemplates = templates[type][category] || templates[type].default;
  return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
};

// Generate brand-aware benefits
export const generateBrandBenefits = (brandContext: BrandContext): Array<{title: string, description: string}> => {
  const { category, personality, values, solutions } = brandContext;

  const benefitTemplates: Record<string, Array<{title: string, description: string}>> = {
    fintech: [
      { title: 'Secure & Compliant', description: 'Bank-grade security with full regulatory compliance ensures your financial data is always protected.' },
      { title: 'Expert Financial Guidance', description: 'Access to certified financial advisors who provide personalized investment strategies.' },
      { title: '24/7 Premium Support', description: 'Round-the-clock customer service from financial experts, not automated systems.' },
      { title: 'Exclusive Investment Opportunities', description: 'Access premium investment opportunities typically reserved for high-net-worth individuals.' }
    ],
    food_delivery: [
      { title: 'Lightning-Fast Delivery', description: 'Hot, fresh food delivered in under 30 minutes from your favorite local restaurants.' },
      { title: 'Diverse Restaurant Selection', description: 'Choose from thousands of restaurants offering cuisines from around the world.' },
      { title: 'Real-Time Order Tracking', description: 'Track your order from restaurant to doorstep with live GPS updates.' },
      { title: 'Contactless Delivery', description: 'Safe, hygienic delivery with no-contact options and sanitization protocols.' }
    ],
    transportation: [
      { title: 'Professional Chauffeur Service', description: 'Licensed, uniformed chauffeurs with extensive experience and impeccable service standards.' },
      { title: 'Luxury Vehicle Fleet', description: 'Premium vehicles including sedans, SUVs, and limousines for every occasion.' },
      { title: 'GPS-Tracked Safety', description: 'Real-time vehicle tracking and emergency response systems for maximum safety.' },
      { title: 'Flexible Booking Options', description: 'Book by the hour, day, or custom packages with instant confirmation.' }
    ],
    default: [
      { title: 'Premium Quality Service', description: 'Experience excellence in every interaction with our professional team.' },
      { title: 'Personalized Solutions', description: 'Tailored services designed specifically for your unique needs and preferences.' },
      { title: 'Reliable & Trustworthy', description: 'Count on consistent, dependable service you can rely on every time.' },
      { title: 'Innovation & Excellence', description: 'Cutting-edge solutions combined with time-tested expertise.' }
    ]
  };

  return benefitTemplates[category] || benefitTemplates.default;
};

// Generate brand-aware stats
export const generateBrandStats = (brandContext: BrandContext): Array<{label: string, value: string}> => {
  const { category } = brandContext;

  const statTemplates: Record<string, Array<{label: string, value: string}>> = {
    fintech: [
      { label: 'Active Investors', value: '50,000+' },
      { label: 'Assets Under Management', value: '$2B+' },
      { label: 'Customer Satisfaction', value: '4.9★' },
      { label: 'Years of Excellence', value: '10+' }
    ],
    food_delivery: [
      { label: 'Daily Orders Delivered', value: '100,000+' },
      { label: 'Partner Restaurants', value: '10,000+' },
      { label: 'Cities Served', value: '500+' },
      { label: 'Average Delivery Time', value: '< 30 min' }
    ],
    transportation: [
      { label: 'Vehicles in Fleet', value: '500+' },
      { label: 'Licensed Drivers', value: '1,000+' },
      { label: 'Miles Driven Safely', value: '10M+' },
      { label: 'Customer Rating', value: '4.9★' }
    ],
    default: [
      { label: 'Happy Customers', value: '10,000+' },
      { label: 'Years of Service', value: '15+' },
      { label: 'Service Coverage', value: '50+ Cities' },
      { label: 'Customer Satisfaction', value: '4.9★' }
    ]
  };

  return statTemplates[category] || statTemplates.default;
};

export default {
  generateBrandContext,
  generateBrandHeadline,
  generateBrandBenefits,
  generateBrandStats
};