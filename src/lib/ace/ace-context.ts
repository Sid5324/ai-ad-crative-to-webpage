// src/lib/ace/ace-context.ts - ACE (Agentic Context Enrichment) Framework
// Replace prompt engineering with structured context engineering

import { inferCategory, getCategoryColors } from '../skills/skill-category-inference';
import { getBrandPrompt, generateBrandInstructions } from '../skills/skill-brand-prompts';

// ACE Context Builder - Creates enriched context for each agent
export interface ACEContext {
  // WHO: Agent identity
  agentRole: string;
  agentSkills: string[];
  
  // WHAT: Task context
  task: string;
  input: any;
  constraints: string[];
  
  // HOW: Execution guide
  format: string;
  examples: any[];
  
  // WHY: Quality criteria
  successCriteria: string[];
  failureModes: string[];
}

// Build ACE context for copy generation
function buildCopyACEContext(spec: {
  brandName: string;
  brandVoice: string;
  category: string;
  audience: string;
  adHook: string;
  strategy: string;
}): ACEContext {
  const brandPrompt = getBrandPrompt(spec.brandName, spec.category);
  
  return {
    agentRole: 'copy-generator',
    agentSkills: ['content-generation', 'brand-voice-inheritance'],
    
    task: `Generate landing page copy for ${spec.brandName}`,
    input: {
      brand: spec.brandName,
      voice: spec.brandVoice,
      category: spec.category,
      audience: spec.audience,
      hook: spec.adHook,
      style: spec.strategy
    },
    constraints: [
      `NEVER use generic phrases: ${brandPrompt.forbiddenPhrases.join(', ')}`,
      `Must use brand voice: ${brandPrompt.brandVoice}`,
      `Tone: ${brandPrompt.requiredTone}`
    ],
    
    format: JSON.stringify({
      eyebrow: 'string',
      headline: 'string (compelling, specific to brand)',
      subheadline: 'string',
      primaryCta: brandPrompt.primaryCta,
      secondaryCta: brandPrompt.secondaryCta,
      benefits: [{ title: 'string', description: 'string' }],
      stats: [{ label: 'string', value: 'string' }],
      trustSignals: ['string']
    }, null, 2),
    
    examples: brandPrompt.examples.map(h => ({
      eyebrow: `Welcome to ${spec.brandName}`,
      headline: h,
      primaryCta: brandPrompt.primaryCta
    })),
    
    successCriteria: [
      'Uses brand-specific CTAs (not generic)',
      'Matches brand voice',
      'Compelling headline',
      'All fields populated'
    ],
    failureModes: [
      'Using "Get Started" or "Learn More"',
      'Generic copy without brand context',
      'Undefined or null values'
    ]
  };
}

// Build ACE context for HTML generation
function buildHtmlACEContext(spec: {
  brandName: string;
  brandColors: { primary: string; accent: string; light: string; dark: string };
  copy: any;
  category: string;
}): ACEContext {
  const category = spec.category;
  const colors = spec.brandColors;
  
  return {
    agentRole: 'component-renderer',
    agentSkills: ['html-generation', 'tailwind-rendering'],
    
    task: `Render complete HTML landing page for ${spec.brandName}`,
    input: spec.copy,
    constraints: [
      'Use Tailwind CSS v3: https://cdn.jsdelivr.net/npm/tailwindcss@3.4.17/dist/tailwind.min.css',
      `Body background: bg-gray-50 (never use brand primary color)`,
      `Primary color: ${colors.primary} (for header/hero accents)`,
      `Accent color: ${colors.accent} (for CTAs)`,
      'NO broken images - never use image1.jpg, image*.jpg, or any relative image paths',
      'ALWAYS include <footer> with copyright',
      'Use brand-specific CTAs from input'
    ],
    
    format: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="...">
  <title>{brand}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.17/dist/tailwind.min.css">
</head>
<body class="bg-gray-50 text-gray-900">
  <header>...</header>
  <main>
    <section id="hero">...</section>
    <section class="stats">...</section>
    <section class="cta">...</section>
  </main>
  <footer>...</footer>
</body>
</html>`,
    
    examples: [
      {
        template: 'Simple hero with brand colors',
        bodyBackground: 'bg-gray-50',
        ctaBackground: `bg-[${colors.accent}]`
      }
    ],
    
    successCriteria: [
      'Valid HTML structure with DOCTYPE',
      'Body uses neutral background (not brand color)',
      'No broken image references',
      'Footer present',
      'Meta description present',
      'Brand-specific CTAs'
    ],
    failureModes: [
      'Body background is brand color (e.g., bg-[#FF3008])',
      'Contains <img src="image*.jpg">',
      'Missing <footer>',
      'Generic CTAs like "Get Started"'
    ]
  };
}

// Build ACE context for brand analysis
function buildBrandACEContext(url: string, siteContent?: string): ACEContext {
  const category = inferCategory(url);
  const colors = getCategoryColors(category.category);
  
  return {
    agentRole: 'url-brand-analyzer',
    agentSkills: ['brand-extraction', 'voice-detection'],
    
    task: `Extract brand information from URL: ${url}`,
    input: { url, content: siteContent?.substring(0, 1000) },
    constraints: [
      'If site fetch fails, extract from hostname',
      'Use category inference for fallback'
    ],
    
    format: JSON.stringify({
      brandName: 'string',
      brandVoice: 'string',
      category: category.category,
      evidence: ['string'],
      confidence: 0.8
    }, null, 2),
    
    examples: [
      { url: 'https://cred.club', brandName: 'CRED', category: 'fintech' },
      { url: 'https://doordash.com', brandName: 'DoorDash', category: 'food_delivery' },
      { url: 'https://uber.com', brandName: 'Uber', category: 'transportation' }
    ],
    
    successCriteria: [
      'Brand name extracted',
      'Category inferred correctly',
      'Evidence provided'
    ],
    failureModes: [
      'Generic brand name like "Brand"',
      'Missing category',
      'Low confidence score'
    ]
  };
}

// Format ACE context as prompt
function formatACEContext(context: ACEContext): string {
  let prompt = `# ROLE\nYou are ${context.agentRole} with skills: ${context.agentSkills.join(', ')}\n\n`;
  
  prompt += `# TASK\n${context.task}\n`;
  prompt += `Input: ${JSON.stringify(context.input, null, 2)}\n\n`;
  
  prompt += `# CONSTRAINTS (MUST FOLLOW)\n`;
  context.constraints.forEach(c => {
    prompt += `- ${c}\n`;
  });
  prompt += '\n';
  
  prompt += `# OUTPUT FORMAT\n${context.format}\n\n`;
  
  if (context.examples.length > 0) {
    prompt += `# EXAMPLES\n`;
    context.examples.forEach(ex => {
      prompt += `- ${JSON.stringify(ex)}\n`;
    });
    prompt += '\n';
  }
  
  prompt += `# SUCCESS CRITERIA\n`;
  context.successCriteria.forEach(s => {
    prompt += `- ${s}\n`;
  });
  prompt += '\n';
  
  prompt += `# FAILURE MODES (AVOID)\n`;
  context.failureModes.forEach(f => {
    prompt += `- ${f}\n`;
  });
  
  return prompt;
}

// Execute with ACE context
async function executeWithACE(
  llmCall: (prompt: string, format?: any) => Promise<string>,
  context: ACEContext,
  outputFormat?: any
): Promise<any> {
  const prompt = formatACEContext(context);
  const result = await llmCall(prompt, outputFormat);
  return result;
}

export { buildCopyACEContext, buildHtmlACEContext, buildBrandACEContext, formatACEContext, executeWithACE };

// Re-export type separately
type ACEContextType = ACEContext;