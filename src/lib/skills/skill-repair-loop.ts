// src/lib/skills/skill-repair-loop.ts - Repair Loop with Automatic Retry Logic
// Implements Agent #28 (repair-agent) with retry_logic skill

import { groqCall } from '../ai/providers';

// ========== CONFIGURATION ==========

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  confidenceThreshold: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  confidenceThreshold: 0.6
};

// ========== REPAIR CONTEXT ==========

export interface RepairContext {
  agentName: string;
  attempt: number;
  errors: string[];
  warnings: string[];
  previousOutput: any;
  qaScore?: number;
  qaIssues?: string[];
}

// ========== REPAIR SKILLS ==========

export const REPAIR_SKILLS = {
  // Fix undefined/null values in output
  fixUndefined: (output: any): any => {
    if (!output || typeof output !== 'object') return output;
    
    const fixed: any = {};
    
    for (const [key, value] of Object.entries(output)) {
      if (value === undefined) {
        fixed[key] = 'N/A';
      } else if (value === null) {
        fixed[key] = null;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        fixed[key] = REPAIR_SKILLS.fixUndefined(value);
      } else {
        fixed[key] = value;
      }
    }
    
    return fixed;
  },
  
  // Fix generic copy
  fixGenericCopy: (output: any, brandName: string): any => {
    const generic = ['get started', 'learn more', 'sign up', 'join now'];
    const fixed = { ...output };
    
    const fixField = (field: string, replacement: string) => {
      if (!fixed[field]) return;
      
      const lower = fixed[field].toLowerCase();
      for (const g of generic) {
        if (lower.includes(g)) {
          fixed[field] = replacement;
          break;
        }
      }
    };
    
    // Apply brand-specific fixes
    if (fixed.primaryCta) {
      const brandLower = brandName.toLowerCase();
      if (brandLower.includes('cred') || brandLower.includes('finance')) {
        fixField('primaryCta', 'Apply Now');
      } else if (brandLower.includes('door') || brandLower.includes('food')) {
        fixField('primaryCta', 'Order Now');
      } else if (brandLower.includes('uber')) {
        fixField('primaryCta', 'Get a Ride');
      } else if (brandLower.includes('airbnb')) {
        fixField('primaryCta', 'Explore Homes');
      }
    }
    
    return fixed;
  },
  
  // Fix HTML issues
  fixHtmlIssues: (html: string, issues: string[]): string => {
    let fixed = html;
    
    for (const issue of issues) {
      const lower = issue.toLowerCase();
      
      if (lower.includes('unclosed')) {
        // Try to fix unclosed tags
        const tags = ['<div>', '<span>', '<p>', '<section>'];
        for (const tag of tags) {
          const openCount = (fixed.match(new RegExp(`<${tag.replace('<', '')}`, 'g')) || []).length;
          const closeCount = (fixed.match(new RegExp(`</${tag.replace('<', '')}`, 'g')) || []).length;
          if (openCount > closeCount) {
            fixed += `</${tag.replace('<', '')}>`;
          }
        }
      }
      
      if (lower.includes('broken') && lower.includes('tag')) {
        // Remove likely broken tags
        fixed = fixed.replace(/<[^>]*$/gm, '').replace(/<[a-z]+$/gi, '');
      }
      
      if (lower.includes('missing') && lower.includes('doctype')) {
        fixed = '<!DOCTYPE html>\n' + fixed;
      }
    }
    
    return fixed;
  },
  
  // Fix JSON parsing issues
  fixJsonParsing: (raw: string): any => {
    try {
      return JSON.parse(raw);
    } catch {
      // Try to extract JSON from markdown
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch { /* ignore */ }
      }
      
      // Return null if all fails
      return null;
    }
  }
};

// ========== REPAIR AGENT ==========

export class RepairAgent {
  private config: RetryConfig;
  
  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }
  
  // Execute function with retry logic
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: RepairContext
  ): Promise<{ success: boolean; data?: T; error?: string; attempts: number }> {
    let attempt = 0;
    let lastError: string = '';
    let lastData: T | undefined;
    
    while (attempt < this.config.maxAttempts) {
      attempt++;
      console.log(`[Repair] Attempt ${attempt}/${this.config.maxAttempts} for ${context.agentName}`);
      
      try {
        const data = await fn();
        
        // Validate confidence
        if (data && typeof data === 'object' && 'confidence' in data) {
          const confidence = (data as any).confidence;
          if (confidence < this.config.confidenceThreshold) {
            console.log(`[Repair] Low confidence (${confidence}), retrying...`);
            continue;
          }
        }
        
        // Check for errors in output
        if (data && typeof data === 'object' && 'issues' in data) {
          const issues = (data as any).issues;
          if (issues?.length > 0) {
            console.log(`[Repair] Found issues: ${issues.join(', ')}, retrying...`);
            continue;
          }
        }
        
        // Success!
        console.log(`[Repair] ✅ Success on attempt ${attempt}`);
        return { success: true, data, attempts: attempt };
        
      } catch (error) {
        lastError = String(error);
        console.log(`[Repair] ❌ Attempt ${attempt} failed: ${lastError}`);
        
        // Don't retry on certain errors
        if (lastError.includes('API key') || lastError.includes('Rate limit')) {
          return { success: false, error: lastError, attempts: attempt };
        }
        
        // Wait before retry with exponential backoff
        if (attempt < this.config.maxAttempts) {
          const delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
          console.log(`[Repair] Waiting ${delay}ms before retry...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
      
      lastData = undefined;
    }
    
    console.log(`[Repair] ❌ All ${attempt} attempts exhausted`);
    return { success: false, error: lastError, attempts: attempt };
  }
  
  // Repair output from QA feedback
  async repairFromQa(
    output: any,
    qaIssues: string[],
    context: { brandName?: string; html?: string }
  ): Promise<any> {
    console.log(`[Repair] Starting repair from ${qaIssues.length} QA issues`);
    
    let result = { ...output };
    
    for (const issue of qaIssues) {
      const lower = issue.toLowerCase();
      
      // Undefined values
      if (lower.includes('undefined') || lower.includes('null')) {
        result = REPAIR_SKILLS.fixUndefined(result);
      }
      
      // Generic copy
      if (lower.includes('generic') || lower.includes('not brand-specific')) {
        result = REPAIR_SKILLS.fixGenericCopy(result, context.brandName || 'Brand');
      }
      
      // HTML issues
      if (lower.includes('html') || lower.includes('tag')) {
        if (context.html) {
          const fixedHtml = REPAIR_SKILLS.fixHtmlIssues(context.html, qaIssues);
          result = { ...result, html: fixedHtml };
        }
      }
    }
    
    return result;
  }
}

// ========== QA VALIDATOR ==========

export class QaValidator {
  // Validate with quality scoring
  async validate(
    html: string,
    spec: any,
    context: { brandName: string }
  ): Promise<{
    isValid: boolean;
    issues: string[];
    score: number;
    confidence: number;
  }> {
    const issues: string[] = [];
    let score = 70; // Base score
    
    // Check HTML validity
    if (!html || html.length < 500) {
      issues.push('HTML too short');
      score -= 20;
    }
    
    if (!html.includes('<!DOCTYPE')) {
      issues.push('Missing DOCTYPE');
      score -= 5;
    }
    
    // Check for brand-specific copy
    if (spec?.copy?.primaryCta) {
      const cta = spec.copy.primaryCta.toLowerCase();
      const generic = ['get started', 'sign up', 'join now'];
      
      for (const g of generic) {
        if (cta.includes(g)) {
          issues.push('Generic CTA found');
          score -= 10;
        }
      }
    }
    
    // Check for undefined values
    if (spec?.copy?.headline === 'N/A') {
      issues.push('Undefined headline');
      score -= 15;
    }
    
    // Check colors
    if (spec?.designTokens?.palette) {
      score += 5;
    } else {
      issues.push('Missing design tokens');
      score -= 10;
    }
    
    // Ensure score is in range
    score = Math.max(0, Math.min(100, score));
    
    return {
      isValid: score >= 60 && issues.length <= 2,
      issues,
      score,
      confidence: score / 100
    };
  }
}

// ========== HELPER FUNCTIONS ==========

export const createRepairAgent = (config?: Partial<RetryConfig>) => new RepairAgent(config);
export const createQaValidator = () => new QaValidator();

// Retry with exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> => {
  let attempt = 0;
  let lastError: Error;
  
  while (attempt < config.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      attempt++;
      
      if (attempt < config.maxAttempts) {
        const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError!;
};

export default {
  RepairAgent,
  QaValidator,
  REPAIR_SKILLS,
  createRepairAgent,
  createQaValidator,
  withRetry,
  DEFAULT_RETRY_CONFIG
};