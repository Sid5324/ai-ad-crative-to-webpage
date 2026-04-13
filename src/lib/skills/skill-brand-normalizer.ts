// src/lib/skills/skill-brand-normalizer.ts - Brand Normalization Skill
import * as cheerio from 'cheerio';
import { Brand } from '../schemas/skill-schemas';

interface ScrapeResult {
  title: string;
  metaDesc: string;
  ogSiteName: string;
  content: string;
}

// Extract brand identity from URL
export async function extractBrandFromUrl(url: string): Promise<Brand> {
  console.log('[Brand] Extracting brand from URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const scrapeResult = parseHtml(html);
    
    return normalizeBrandIdentity(scrapeResult, url);
  } catch (e) {
    console.log('[Brand] Extraction failed, using fallback:', e);
    return createFallbackBrand(url);
  }
}

function parseHtml(html: string): ScrapeResult {
  const $ = cheerio.load(html);
  
  return {
    title: $('title').text().trim(),
    metaDesc: $('meta[name="description"]').attr('content') || '',
    ogSiteName: $('meta[property="og:site_name"]').attr('content') || '',
    content: $('body').text().toLowerCase()
  };
}

function normalizeBrandIdentity(scrape: ScrapeResult, url: string): Brand {
  const { title, metaDesc, content } = scrape;
  
  // Clean name - remove slogans, pipes, dashes
  let name = title.split('|')[0].split('-')[0].trim();
  let tagline = '';
  
  // Extract tagline patterns and clean name
  const taglinePatterns = [
    { pattern: /not everyone gets it/i, value: 'not everyone gets it.' },
    { pattern: /not just/i, value: '' },
    { pattern: /the best/i, value: 'the best' },
    { pattern: /world'?s /i, value: '' },
    { pattern: /only /i, value: '' }
  ];
  
  for (const tp of taglinePatterns) {
    if (tp.pattern.test(name)) {
      tagline = tp.value;
      name = name.replace(tp.pattern, '').replace(/[-|]/g, ' ').trim();
      break;
    }
  }
  
// Additional cleaning
  name = name.replace(/^(the|my|our|a|an)\s+/i, '').trim();

  // Aggressive cleanup: remove ALL trailing dots/punctuation, multiple periods, extra space
  name = name.replace(/\.{2,}/g, '.').replace(/^\.|\.+$/g, '').replace(/\s+/g, ' ').trim();
  
  // Handle edge case: "CRED. " (brand with trailing dot)
  if (name.endsWith('.') || name.endsWith(' ')) {
    name = name.slice(0, -1).trim();
  }
  
  // Final safety check - if still has dots, split and take first part
  if (name.includes('.')) {
    name = name.split('.')[0].trim();
  }
  
  // Fallback to domain name if too short
  if (name.length < 2) {
    const urlObj = new URL(url);
    name = urlObj.hostname.replace('www.', '').split('.')[0];
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // Detect category from content
  const category = detectCategory(content);
  
  // Detect tone
  const tone = detectTone(content);
  
  // Detect audience
  const audience = detectAudience(content);
  
  // Generate description if missing
  const description = metaDesc || `${name} - Professional ${category} services`;
  
  return {
    name,
    tagline,
    category,
    description,
    audience,
    tone,
    colors: detectColors(content, url, category, tone),
    confidence: 0.85
  };
}

function detectCategory(content: string): string {
  // More comprehensive categories including Transportation and Luxury Services
  const categories: Record<string, string[]> = {
    'Finance': ['credit', 'card', 'bank', 'investment', 'wealth', 'loan', 'insurance', 'fintech', 'payment', 'credit card', 'loan', 'mutual fund'],
    'Food & Dining': ['restaurant', 'food', 'delivery', 'order', 'menu', 'cuisine', 'cafe', 'coffee', 'pizza', 'burger', 'dining', 'kitchen'],
    'E-commerce': ['shop', 'store', 'buy', 'product', 'cart', 'shopping', 'amazon', 'flipkart', 'sale'],
    'SaaS': ['software', 'platform', 'app', 'cloud', 'subscription', 'tool', 'saas', 'dashboard'],
    'Healthcare': ['medical', 'health', 'doctor', 'clinic', 'patient', 'hospital', 'pharmacy', 'medicine', 'care'],
    'Travel': ['hotel', 'travel', 'flight', 'booking', 'vacation', 'tourism', 'airbnb', 'oyo', 'booking'],
    'Education': ['course', 'learn', 'student', 'training', 'school', 'education', 'tutor', 'coaching'],
    'Real Estate': ['property', 'home', 'apartment', 'rent', 'housing', 'real estate', 'builder'],
    'Automotive': ['car', 'auto', 'vehicle', 'drive', 'transport', 'motor', 'insurance'],
    'Transportation': ['chauffeur', 'limousine', 'taxi', 'cab', 'uber', 'driver', 'transfer', 'rental', 'fleet', 'luxury car'],
    'Luxury': ['luxury', 'premium', 'exclusive', 'vip', 'concierge', 'bespoke', 'high-end'],
    'Business Services': ['consulting', 'agency', 'service', 'solution', 'corporate', 'enterprise', 'b2b']
  };
  
  // Find the best matching category (first match wins, but prefer more specific)
  let bestMatch = 'Business';
  let bestScore = 0;
  
  for (const [cat, keywords] of Object.entries(categories)) {
    const matches = keywords.filter(k => content.includes(k)).length;
    if (matches > bestScore) {
      bestScore = matches;
      bestMatch = cat;
    }
  }
  
  // Special case: if content has "luxury" + any transport-related word, use Transportation
  if (content.includes('luxury') && content.includes('limousine')) {
    return 'Transportation';
  }
  
  return bestMatch;
}

function detectTone(content: string): string[] {
  if (content.includes('premium') || content.includes('exclusive') || content.includes('luxury')) {
    return ['Premium', 'Exclusive', 'Sophisticated'];
  }
  if (content.includes('friendly') || content.includes('easy') || content.includes('simple')) {
    return ['Friendly', 'Approachable'];
  }
  if (content.includes('trusted') || content.includes('reliable') || content.includes('secure')) {
    return ['Trustworthy', 'Professional'];
  }
  return ['Professional', 'Modern'];
}

function detectAudience(content: string): 'consumer' | 'merchant' | 'b2b' {
  if (content.includes('business owner') || content.includes('merchant') || content.includes('partner')) {
    return 'merchant';
  }
  if (content.includes('enterprise') || content.includes('business solution') || content.includes('company')) {
    return 'b2b';
  }
  return 'consumer';
}

// Known brand colors - extracted from actual brand guidelines
const KNOWN_BRANDS: Record<string, Partial<Brand>> = {
  'cred': {
    name: 'CRED',
    tagline: 'not everyone gets it.',
    description: 'financial & lifestyle experiences crafted for the creditworthy.',
    colors: {
      primary: '#E24B26',
      accent: '#E24B26',
      light: '#FFF5F2',
      dark: '#1A0F0A'
    },
    tone: ['Bold', 'Irreverent', 'Premium']
  },
  'doordash': {
    name: 'DoorDash',
    tagline: 'The best local restaurants delivered',
    description: 'Restaurant delivery service',
    colors: {
      primary: '#FF3008',
      accent: '#00CCBC',
      light: '#FFF8F5',
      dark: '#1A0D0A'
    },
    tone: ['Reliable', 'Convenient', 'Fast']
  },
  'razorpay': {
    name: 'Razorpay',
    tagline: 'Payments Gateway',
    description: 'India\'s largest payments solution company',
    colors: {
      primary: '#3399FE',
      accent: '#1A1A1A',
      light: '#F5F8FF',
      dark: '#0D1B2A'
    },
    tone: ['Professional', 'Trustworthy', 'Modern']
  },
  'groww': {
    name: 'Groww',
    tagline: 'Invest in Your Dreams',
    description: 'Simple, smart, and secure investment platform',
    colors: {
      primary: '#1E3A5F',
      accent: '#00D09C',
      light: '#E8F5E9',
      dark: '#0A1929'
    },
    tone: ['Friendly', 'Approachable', 'Modern']
  },
  'phonepe': {
    name: 'PhonePe',
    tagline: 'Make Big Dreams Happen',
    description: 'India\'s leading digital payment platform',
    colors: {
      primary: '#6739B7',
      accent: '#FF9F43',
      light: '#F5F0FF',
      dark: '#1A1433'
    },
    tone: ['Energetic', 'Trustworthy', 'Modern']
  },
  'upstox': {
    name: 'Upstox',
    tagline: 'Invest Wisely',
    description: 'Zero brokerage trading platform',
    colors: {
      primary: '#0057E7',
      accent: '#00C853',
      light: '#E3F2FD',
      dark: '#0D2137'
    },
    tone: ['Professional', 'Modern', 'Accessible']
  },
  'stripe': {
    name: 'Stripe',
    tagline: 'Financial Infrastructure',
    description: 'Economic infrastructure for the internet',
    colors: {
      primary: '#635BFF',
      accent: '#0A2540',
      light: '#F6F9FC',
      dark: '#0A2540'
    },
    tone: ['Professional', 'Technical', 'Premium']
  },
  'airbnb': {
    name: 'Airbnb',
    tagline: 'Belong Anywhere',
    description: 'Book unique homes and experiences',
    colors: {
      primary: '#FF5A5F',
      accent: '#FF385C',
      light: '#F7F7F7',
      dark: '#222222'
    },
    tone: ['Warm', 'Human', 'Premium']
  }
};

function detectColors(content: string, url: string, category: string, tone: string[]): Brand['colors'] {
  const urlLower = url.toLowerCase();
  
  // Check for known brands first
  for (const [brandKey, brandData] of Object.entries(KNOWN_BRANDS)) {
    if (urlLower.includes(brandKey)) {
      console.log('[Brand] Detected known brand:', brandKey);
      return brandData.colors!;
    }
  }
  
  // Extract colors from content/CSS
  const extractedColors = extractColorsFromContent(content);
  if (extractedColors) {
    return extractedColors;
  }
  
  // Category-based defaults
  if (category === 'Finance') {
    return {
      primary: '#1e293b',
      accent: '#10b981',
      light: '#f8fafc',
      dark: '#0f172a'
    };
  }
  
  if (category === 'Food & Dining') {
    return {
      primary: '#ea580c',
      accent: '#f97316',
      light: '#fff7ed',
      dark: '#1c1917'
    };
  }
  
  // Default
  return {
    primary: '#1e293b',
    accent: '#3b82f6',
    light: '#f8fafc',
    dark: '#0f172a'
  };
}

function extractColorsFromContent(content: string): Brand['colors'] | null {
  // Try to find brand colors in the content
  const colorPatterns = [
    /(?:brand|primary|accent|theme|color)[\s:]+(#[0-9a-fA-F]{3,6})/gi,
    /(?:background|bg)[\s:]+(#[0-9a-fA-F]{3,6})/gi
  ];
  
  const foundColors = new Set<string>();
  
  for (const pattern of colorPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const color = match[1]?.toLowerCase();
      if (color && color !== '#000' && color !== '#fff' && color !== '#ffffff' && color !== '#000000') {
        foundColors.add(color);
      }
    }
  }
  
  // If we found meaningful colors, use them
  const colors = Array.from(foundColors);
  if (colors.length >= 2) {
    return {
      primary: colors[0],
      accent: colors[1],
      light: '#f8fafc',
      dark: '#1e293b'
    };
  }
  
  return null;
}

// Preflight check - fail fast if brand cannot be identified
export function preflightBrandCheck(url: string): { valid: boolean; error?: string; brandHint?: string } {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Check known brands first
    for (const [key, data] of Object.entries(KNOWN_BRANDS)) {
      if (hostname.includes(key)) {
        return { valid: true, brandHint: data.name };
      }
    }
    
    // If not known, must be able to extract meaningful name
    const name = hostname.replace('www.', '').split('.')[0];
    if (name.length < 2) {
      return { valid: false, error: 'Cannot identify brand from URL' };
    }
    
    return { valid: true, brandHint: name.charAt(0).toUpperCase() + name.slice(1) };
  } catch {
    return { valid: false, error: 'Invalid URL' };
  }
}

function createFallbackBrand(url: string): Brand {
  // FIRST RUN PREFLIGHT
  const preflight = preflightBrandCheck(url);
  if (!preflight.valid) {
    throw new Error(`BRAND_VALIDATION_FAILED: ${preflight.error}`);
  }
  
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace('www.', '').toLowerCase();
  
  // Check for known brands - HIGH CONFIDENCE
  for (const [brandKey, brandData] of Object.entries(KNOWN_BRANDS)) {
    if (hostname.includes(brandKey)) {
      console.log('[Brand] Known brand detected:', brandKey);
      return {
        name: brandData.name!,
        tagline: brandData.tagline || '',
        description: brandData.description || `Website at ${urlObj.hostname}`,
        audience: 'consumer',
        tone: brandData.tone || ['Professional'],
        colors: brandData.colors!,
        confidence: 0.95  // HIGH confidence for known brands
      };
    }
  }
  
  // Unknown brand - LOW confidence - must scrape
  const name = hostname.split('.')[0];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  
  return {
    name: capitalized,
    tagline: '',
    category: 'Business',
    description: `Website at ${urlObj.hostname}`,
    audience: 'consumer',
    tone: ['Professional'],
    colors: detectColors('', url, 'Business', []),
    confidence: 0.3  // LOW confidence for unknown brands
  };
}

export { extractBrandFromUrl as runBrandSkill };