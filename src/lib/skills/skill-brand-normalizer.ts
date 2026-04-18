// src/lib/skills/skill-brand-normalizer.ts - Evidence-Based Brand Extraction (NO HARDCODING)
import * as cheerio from 'cheerio';
import { Brand } from '../schemas/skill-schemas';
import { groqCall } from '../ai/providers';

interface ScrapeResult {
  title: string;
  metaDesc: string;
  ogSiteName: string;
  jsonLd: any[];
  content: string;
}

// Extract brand identity from URL - evidence-based only
export async function extractBrandFromUrl(url: string): Promise<Brand> {
  console.log('[Brand] Extracting brand from URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const scrapeResult = parseHtml(html);

    return await extractBrandIdentity(scrapeResult, url);
  } catch (e) {
    console.log('[Brand] Extraction failed, using hostname fallback:', e);
    return createFallbackBrand(url);
  }
}

// Parse HTML for evidence
function parseHtml(html: string): ScrapeResult {
  const $ = cheerio.load(html);

  return {
    title: $('title').text().trim(),
    metaDesc: $('meta[name="description"]').attr('content') || '',
    ogSiteName: $('meta[property="og:site_name"]').attr('content') || '',
    jsonLd: parseJsonLd($),
    content: $('body').text().toLowerCase().substring(0, 5000)
  };
}

// Extract JSON-LD structured data
function parseJsonLd($: any): any[] {
  const jsonLd: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      jsonLd.push(data);
    } catch {}
  });
  return jsonLd;
}

// Evidence-based brand extraction using LLM
async function extractBrandIdentity(scrape: ScrapeResult, url: string): Promise<Brand> {
  const prompt = `
Extract brand identity from this website evidence:

URL: ${url}
Title: "${scrape.title}"
Meta Description: "${scrape.metaDesc}"
OG Site Name: "${scrape.ogSiteName}"
JSON-LD: ${JSON.stringify(scrape.jsonLd)}
Content Sample: "${scrape.content.substring(0, 1000)}"

Instructions:
1. Find the canonical brand/company name (not tagline, not slogan)
2. Look for: JSON-LD Organization.name, OG site_name, title prefix, logo alt, footer legal
3. REJECT taglines, slogans, "Welcome to...", location-based names
4. Determine category from business activities described
5. Extract or infer appropriate colors from content/context
6. Assess confidence based on evidence strength

Return JSON: {
  "name": "canonical brand name only",
  "tagline": "actual tagline if found",
  "description": "brief business description",
  "category": "specific category",
  "confidence": 0.8,
  "colors": {"primary": "#hex", "accent": "#hex", "light": "#hex", "dark": "#hex"},
  "tone": ["tone1", "tone2"]
}
`;

  try {
    const raw = await groqCall('llama-3.3-70b-versatile', prompt, { type: 'json_object' });
    const brand = raw as any;

    // Validate extracted brand
    if (!brand.name || brand.name.length > 50) {
      throw new Error('Invalid brand name extracted');
    }

    return normalizeBrandOutput(brand, url);
  } catch (error) {
    console.warn('[Brand] LLM extraction failed:', error);
    return createFallbackBrand(url);
  }
}

// Normalize brand output with validation
function normalizeBrandOutput(extracted: any, url: string): Brand {
  // Ensure colors are valid hex codes
  const colors = extracted.colors || {};
  const validatedColors = {
    primary: validateHexColor(colors.primary) || '#1e293b',
    accent: validateHexColor(colors.accent) || '#3b82f6',
    light: validateHexColor(colors.light) || '#f8fafc',
    dark: validateHexColor(colors.dark) || '#0f172a'
  };

  // Validate category
  const category = normalizeCategory(extracted.category);

  return {
    name: extracted.name,
    tagline: extracted.tagline || '',
    description: extracted.description || '',
    category,
    confidence: Math.max(0.1, Math.min(1.0, extracted.confidence || 0.5)),
    colors: validatedColors,
    tone: Array.isArray(extracted.tone) ? extracted.tone.slice(0, 3) : ['Professional']
  };
}

// Validate hex color
function validateHexColor(color: any): string | null {
  if (typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }
  return null;
}

// Normalize category to known values
function normalizeCategory(category: string): string {
  const lower = category?.toLowerCase() || '';

  if (lower.includes('fintech') || lower.includes('finance') || lower.includes('credit')) {
    return 'Finance';
  }
  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('delivery')) {
    return 'Food & Dining';
  }
  if (lower.includes('transport') || lower.includes('limousine') || lower.includes('car')) {
    return 'Transportation';
  }

  // Default fallback
  return 'Business';
}

// Create fallback brand from hostname only
function createFallbackBrand(url: string): Brand {
  try {
    const hostname = new URL(url).hostname;
    const domain = hostname.replace(/^www\./, '').split('.')[0];

    // Clean and capitalize
    const brandName = domain
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return {
      name: brandName,
      tagline: '',
      description: '',
      category: 'Business',
       confidence: 0.5, // Moderate confidence for educated fallback
      colors: {
        primary: '#1e293b',
        accent: '#3b82f6',
        light: '#f8fafc',
        dark: '#0f172a'
      },
      tone: ['Professional']
    };
  } catch {
    return {
      name: 'Business Name',
      tagline: '',
      description: '',
      category: 'Business',
      confidence: 0.1,
      colors: {
        primary: '#1e293b',
        accent: '#3b82f6',
        light: '#f8fafc',
        dark: '#0f172a'
      },
      tone: ['Professional']
    };
  }
}