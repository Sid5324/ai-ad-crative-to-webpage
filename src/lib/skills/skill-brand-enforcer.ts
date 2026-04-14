// src/lib/skills/skill-brand-enforcer.ts - Enforce Brand Colors and Proper HTML
// Skills: enforce_colors, fix_html_structure, validate_cta

import { getCategoryColors } from './skill-category-inference';

// Extract brand name from URL
export const extractBrandFromUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const domain = hostname.split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1).replace(/[^a-zA-Z]/g, '');
  } catch {
    return 'Brand';
  }
};

// Get brand colors
export const getBrandColors = (url: string): {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  dark: string;
} => {
  const brandName = extractBrandFromUrl(url);
  const category = inferCategory(url);
  return getCategoryColors(category, brandName);
};

// Infer category from URL
export const inferCategory = (url: string): string => {
  const hostname = url.toLowerCase();
  if (hostname.includes('cred')) return 'fintech';
  if (hostname.includes('doordash') || hostname.includes('ubereats')) return 'food_delivery';
  if (hostname.includes('uber')) return 'transportation';
  if (hostname.includes('stripe') || hostname.includes('paypal')) return 'fintech';
  if (hostname.includes('airbnb')) return 'travel';
  if (hostname.includes('netflix') || hostname.includes('spotify')) return 'streaming';
  if (hostname.includes('shop') || hostname.includes('store')) return 'ecommerce';
  if (hostname.includes('app') || hostname.includes('cloud')) return 'saas';
  return 'other';
};

// ENFORCE BRAND COLORS - Replace generic colors with brand colors
export const enforceBrandColors = (html: string, url: string): string => {
  const brandName = extractBrandFromUrl(url);
  const colors = getBrandColors(url);
  
  let fixed = html;
  
  // Replace generic Tailwind colors with brand colors
  // bg-primary -> brand primary
  fixed = fixed.replace(/bg-\[#[0-9a-fA-F]{6}\]/g, `bg-[${colors.primary}]`);
  fixed = fixed.replace(/bg-blue-/g, `bg-[${colors.primary}]`);
  
  // Replace text colors
  fixed = fixed.replace(/text-gray-500/g, `text-[${colors.light}]`);
  fixed = fixed.replace(/text-gray-600/g, `text-[#9ca3af]`);
  
  // Replace background colors
  fixed = fixed.replace(/bg-light/g, `bg-[${colors.light}]`);
  fixed = fixed.replace(/bg-white/g, `bg-[${colors.secondary}]`);
  
  // Replace dark backgrounds
  fixed = fixed.replace(/bg-dark/g, `bg-[${colors.dark}]`);
  fixed = fixed.replace(/bg-\[#2c3e50\]/g, `bg-[${colors.dark}]`);
  
  return fixed;
};

// FIX HTML STRUCTURE - Ensure proper HTML
export const fixHtmlStructure = (html: string): string => {
  let fixed = html;
  
  // Fix unclosed <style> tag
  if (html.includes('<style>') && !html.includes('</style>')) {
    fixed = fixed.replace('<style>', '<style>').replace(/(<style>)(?!\s*<\/style>)/g, '</style>');
  }
  
  // Fix broken meta tags
  fixed = fixed.replace(/<link (.+)>/g, '<link $1 />');
  
  // Ensure DOCTYPE is present
  if (!html.toLowerCase().includes('<!doctype html>')) {
    fixed = '<!DOCTYPE html>\n' + fixed;
  }
  
  // Fix missing closing tags
  const requiredTags = ['</html>', '</head>', '</body>'];
  requiredTags.forEach(tag => {
    if (!fixed.toLowerCase().includes(tag.toLowerCase())) {
      fixed += '\n' + tag;
    }
  });
  
  return fixed;
};

// VALIDATE CTA - Ensure brand-appropriate CTAs
export const validateCta = (html: string, brandName: string): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  const htmlLower = html.toLowerCase();
  
  // Generic CTAs to avoid
  const genericCtas = ['get started', 'sign up', 'join now', 'learn more'];
  const brand = brandName.toLowerCase();
  
  // Brand-appropriate CTA mapping
  const brandCtas: Record<string, string[]> = {
    'cred': ['apply now', 'request access', 'unlock benefits'],
    'doordash': ['order now', 'start order'],
    'uber': ['get a ride', 'set pickup'],
    'airbnb': ['explore homes', 'find your stay'],
    'netflix': ['watch now', 'start watching'],
    'stripe': ['start building', 'view docs']
  };
  
  // Check for generic CTAs
  for (const cta of genericCtas) {
    if (htmlLower.includes(cta)) {
      issues.push(`Generic CTA found: "${cta}"`);
    }
  }
  
  // Check for missing brand-specific CTAs
  const expectedCtas = brandCtas[brand] || [];
  if (expectedCtas.length > 0) {
    const hasBrandCta = expectedCtas.some(cta => htmlLower.includes(cta));
    if (!hasBrandCta) {
      issues.push(`Missing brand-specific CTAs: ${expectedCtas.join(', ')}`);
    }
  }
  
  return { valid: issues.length === 0, issues };
};

// ENFORCE PROPER CSS - Use proper Tailwind with CDN
export const enforceProperCss = (html: string): string => {
  let fixed = html;
  
  // Use latest Tailwind CDN
  fixed = fixed.replace(
    /cdn\.jsdelivr\.net\/npm\/tailwindcss@[0-9.]+/g,
    'cdn.jsdelivr.net/npm/tailwindcss@3'
  );
  
  // Fix broken style tag
  fixed = fixed.replace(/<style>/g, '<style>');
  fixed = fixed.replace(/(<style>)(?!\s*<\/style>)/g, '</style>');
  
  return fixed;
};

// COMPREHENSIVE FIX - Apply all fixes
export const fixHtml = (html: string, url: string): string => {
  let fixed = html;
  
  // 1. Fix structure first
  fixed = fixHtmlStructure(fixed);
  
  // 2. Enforce brand colors
  fixed = enforceBrandColors(fixed, url);
  
  // 3. Ensure proper CSS
  fixed = enforceProperCss(fixed);
  
  return fixed;
};

// Validate HTML quality
export const validateHtml = (html: string, url: string): {
  score: number;
  issues: string[];
} => {
  const issues: string[] = [];
  let score = 70;
  
  // Check structure
  if (!html.includes('<!DOCTYPE html>')) {
    issues.push('Missing DOCTYPE');
    score -= 10;
  }
  
  if (!html.includes('<meta name="description"')) {
    issues.push('Missing meta description');
    score -= 5;
  }
  
  if (html.includes('<style>') && !html.includes('</style>')) {
    issues.push('Unclosed style tag');
    score -= 10;
  }
  
  // Check CTA
  const brandName = extractBrandFromUrl(url);
  const ctaResult = validateCta(html, brandName);
  issues.push(...ctaResult.issues);
  score -= ctaResult.issues.length * 10;
  
  // Check length
  if (html.length < 1000) {
    issues.push('HTML too short');
    score -= 15;
  }
  
  return { score: Math.max(0, Math.min(100, score)), issues };
};

export default {
  extractBrandFromUrl,
  getBrandColors,
  enforceBrandColors,
  fixHtmlStructure,
  validateCta,
  enforceProperCss,
  fixHtml,
  validateHtml
};