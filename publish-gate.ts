// publish-gate.ts - BLOCK BAD RUNS BEFORE THEY WASTE TIME
export const CRITICAL_SKILLS = [
  'DOM-content-extraction',
  'schema-validation', 
  'claim-verification', 
  'component-rendering'
] as const;

export const IMPORTANT_SKILLS = [
  'CTA-detection', 'audience-inference', 'message-hierarchy-analysis',
  'business-classification', 'trust-signal-detection', 
  'conversion-planning', 'narrative-structuring'
] as const;

export type GateStatus = 'BLOCKED' | 'DEGRADED' | 'WARNING' | 'PASS';

export function checkPublishGate(fallbacks: string[], missing: string[]): {
  status: GateStatus;
  score: number;
  blockedSkills: string[];
  publishable: boolean;
} {
  const allProblems = [...new Set([...fallbacks, ...missing])];
  
  // CRITICAL BLOCK - ANY of these = immediate fail
  const criticalFails = CRITICAL_SKILLS.filter(skill => allProblems.includes(skill));
  if (criticalFails.length > 0) {
    return {
      status: 'BLOCKED',
      score: 0,
      blockedSkills: criticalFails,
      publishable: false
    };
  }

  // DEGRADED - too many important fallbacks
  const importantFails = IMPORTANT_SKILLS.filter(skill => allProblems.includes(skill));
  const score = Math.max(0, 100 - (importantFails.length * 8) - (allProblems.length * 2));
  
  const status = score < 60 ? 'DEGRADED' : score < 85 ? 'WARNING' : 'PASS';
  const publishable = score >= 80;

  return { status, score, blockedSkills: [], publishable };
}