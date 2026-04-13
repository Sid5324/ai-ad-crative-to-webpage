// packages/orchestrator/job-runner.ts - Strict job runner with validation gates
import { tryParseCopySpec } from './copy-contract';
import { validatePipelineOutputs, hasTemplateLeak, cleanLLMOutput } from './validator';

// ============== Types ==============

export type JobStatus = 
  | 'SUCCEEDED'
  | 'FAILED_VALIDATION' 
  | 'FAILED_AGENT'
  | 'FAILED_RENDERER';

export interface JobResult {
  status: JobStatus;
  spec?: any;
  html?: string;
  errors: string[];
  failedAt?: string;
  qualityScore: number;
}

// ============== Helper Functions ==============

function summarizeErrors(errors: Array<{ code: string; message: string; field?: string }>): string[] {
  return errors.map(e => e.field ? `${e.field}: ${e.message}` : e.message);
}

// ============== Copy Validation with Retry Logic ==============

function validateCopyOutput(raw: unknown): { 
  ok: boolean; 
  data?: any; 
  errors: string[] 
} {
  // Handle string output (could be JSON or markdown-wrapped)
  let parsed = raw;
  let cleaned = false;
  
  if (typeof raw === 'string') {
    const cleanedStr = cleanLLMOutput(raw);
    cleaned = cleanedStr !== raw;
    try {
      parsed = JSON.parse(cleanedStr);
    } catch {
      return { 
        ok: false, 
        errors: ['Could not parse copy as JSON after cleanup'] 
      };
    }
  }

  // Try parse with schema
  const result = tryParseCopySpec(parsed);
  if (result.success) {
    // Additional semantic checks
    const errors: string[] = [];
    
    // Check headline length
    if (result.data?.hero?.headline?.length < 10) {
      errors.push('Hero headline too short');
    }
    
    // Check benefits count
    if (!result.data?.benefits || result.data.benefits.length < 3) {
      errors.push('Too few benefits (need 3+)');
    }
    
    // Check stats count
    if (!result.data?.stats || result.data.stats.length < 3) {
      errors.push('Too few stats (need 3+)');
    }
    
    return { 
      ok: errors.length === 0, 
      data: result.data,
      errors 
    };
  }

  return { 
    ok: false, 
    errors: [result.error || 'Schema validation failed'].concat(cleaned ? ['Cleaned first but failed'] : []) 
  };
}

// ============== Main Job Runner ==============

export async function runLandingPageJob(input: {
  imageUrl: string;
  targetUrl: string;
}, agents: {
  adAnalyzer: () => Promise<any>;
  urlBrandAnalyzer: () => Promise<any>;
  pageStrategy: () => Promise<any>;
  copyGenerator: () => Promise<any>;
  designTokenAgent: () => Promise<any>;
  componentRenderer: (spec: any) => Promise<string>;
}): Promise<JobResult> {
  const errors: string[] = [];

  // Phase 1: Run analysis agents
  console.log('🔄 [Job] Running ad-analyzer...');
  const adRaw = await agents.adAnalyzer();
  if (!adRaw || typeof adRaw !== 'object') {
    return { status: 'FAILED_AGENT', errors: ['ad-analyzer returned invalid payload'], qualityScore: 0 };
  }

  console.log('🔄 [Job] Running url-brand-analyzer...');
  const brandRaw = await agents.urlBrandAnalyzer();
  if (!brandRaw || typeof brandRaw !== 'object') {
    return { status: 'FAILED_AGENT', errors: ['url-brand-analyzer returned invalid payload'], qualityScore: 0 };
  }

  // Check brand for template leaks early
  const brandName = (brandRaw as any)?.name || (brandRaw as any)?.brand_name;
  if (hasTemplateLeak(brandName)) {
    return { 
      status: 'FAILED_VALIDATION', 
      errors: [`Brand name is template: "${brandName}"`],
      failedAt: 'url-brand-analyzer',
      qualityScore: 0 
    };
  }

  console.log('🔄 [Job] Running page-strategy...');
  const strategyRaw = await agents.pageStrategy();
  if (!strategyRaw || typeof strategyRaw !== 'object') {
    return { status: 'FAILED_AGENT', errors: ['page-strategy returned invalid payload'], qualityScore: 0 };
  }

  // Phase 2: Run copy generator with validation
  console.log('🔄 [Job] Running copy-generator...');
  const copyRaw = await agents.copyGenerator();
  
  // Validate copy output - first attempt
  let copyResult = validateCopyOutput(copyRaw);
  
  // If first validation failed, try once more with same pipeline but different approach
  if (!copyResult.ok) {
    console.log('🔄 [Job] Copy validation failed, attempting recovery...');
    // Try one more time - in real system this would use stricter prompt
    const copyRetry = await agents.copyGenerator();
    copyResult = validateCopyOutput(copyRetry);
    
    if (!copyResult.ok) {
      return { 
        status: 'FAILED_VALIDATION', 
        errors: copyResult.errors,
        failedAt: 'copy-generator',
        qualityScore: 20 
      };
    }
  }

  // Phase 3: Run design token agent
  console.log('🔄 [Job] Running design-token-agent...');
  const designRaw = await agents.designTokenAgent();
  if (!designRaw || typeof designRaw !== 'object') {
    return { status: 'FAILED_AGENT', errors: ['design-token-agent returned invalid payload'], qualityScore: 0 };
  }

  // Phase 4: Assemble final spec
  const finalSpec = {
    brand: brandRaw,
    hero: copyResult.data?.hero,
    benefits: copyResult.data?.benefits,
    stats: copyResult.data?.stats,
    faq: copyResult.data?.faq,
    design: designRaw,
  };

  // Phase 5: Validate final spec
  const pipelineValidation = validatePipelineOutputs({
    brand: brandRaw,
    copy: copyResult.data,
    design: designRaw,
  });

  if (!pipelineValidation.ok || pipelineValidation.isFatal) {
    return {
      status: 'FAILED_VALIDATION',
      errors: pipelineValidation.issues.map(i => i.message),
      failedAt: 'final-spec',
      qualityScore: 10
    };
  }

  // Phase 6: Only render if validation passed
  console.log('🔄 [Job] Validation passed, rendering...');
  
  try {
    const html = await agents.componentRenderer(finalSpec);
    
    return {
      status: 'SUCCEEDED',
      spec: finalSpec,
      html,
      errors: pipelineValidation.issues.map(i => i.message),
      qualityScore: 85
    };
  } catch (err) {
    return {
      status: 'FAILED_RENDERER',
      errors: [String(err)],
      failedAt: 'component-renderer',
      qualityScore: 0
    };
  }
}