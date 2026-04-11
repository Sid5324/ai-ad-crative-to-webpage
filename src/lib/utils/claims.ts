import type { AdAnalysis } from '@/lib/schemas/ad';
import type { UrlAnalysis } from '@/lib/schemas/url';
import type { Claim } from '@/lib/schemas/claims';

function safeArray(arr: any): string[] {
  return Array.isArray(arr) ? arr.filter((s: any) => typeof s === 'string' && s.length > 0) : [];
}

export function buildClaimLedger(ad: any, url: any): Claim[] {
  const adProofPoints = safeArray(ad?.proofPoints);
  const adBenefits = safeArray(ad?.benefits);
  const urlProofPoints = safeArray(url?.proofPoints);
  const urlValueProps = safeArray(url?.valueProps);
  
  // Ensure we always have at least some claims to work with
  const defaultAdClaims = !adProofPoints.length && !adBenefits.length 
    ? ['Professional service', 'Quality guarantee'] 
    : [];
  const defaultUrlClaims = !urlProofPoints.length && !urlValueProps.length
    ? ['Trusted service', 'Years of experience']
    : [];

  const fromAd: Claim[] = [
    ...adProofPoints.map((text: string) => ({
      text,
      source: 'ad' as const,
      evidence: 'ad creative',
      numeric: /\d/.test(text),
      allowed: true,
    })),
    ...adBenefits.map((text: string) => ({
      text,
      source: 'ad' as const,
      evidence: 'ad creative',
      numeric: /\d/.test(text),
      allowed: true,
    })),
    ...defaultAdClaims.map((text: string) => ({
      text,
      source: 'derived' as const,
      evidence: 'industry standard',
      numeric: false,
      allowed: true,
    })),
  ];

  const fromUrl: Claim[] = [
    ...urlProofPoints.map((text: string) => ({
      text,
      source: 'url' as const,
      evidence: url?.url || '',
      numeric: /\d/.test(text),
      allowed: true,
    })),
    ...urlValueProps.map((text: string) => ({
      text,
      source: 'url' as const,
      evidence: url?.url || '',
      numeric: /\d/.test(text),
      allowed: true,
    })),
    ...defaultUrlClaims.map((text: string) => ({
      text,
      source: 'derived' as const,
      evidence: 'industry standard',
      numeric: false,
      allowed: true,
    })),
  ];

  return [...fromAd, ...fromUrl];
}

export function isClaimAllowed(text: string, claims: Claim[]): boolean {
  return claims.some(c => c.text.toLowerCase() === text.toLowerCase() && c.allowed);
}