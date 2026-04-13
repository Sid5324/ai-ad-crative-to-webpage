// packages/orchestrator/skill-injection.ts
import { skillRegistry } from './skill-registry';
import { AgentEnvelope } from '../schemas/shared-envelope';

export interface ToolInstance {
  name: string;
  execute: (params: any) => Promise<any>;
  description: string;
}

export interface SkillContext {
  agentName: string;
  skillsUsed: string[];
  tools: Map<string, ToolInstance>;
}

export class SkillInjectionSystem {
  private toolProviders: Map<string, () => ToolInstance> = new Map();

  /**
   * Register a tool provider for a skill
   */
  registerTool(skillName: string, toolProvider: () => ToolInstance): void {
    this.toolProviders.set(skillName, toolProvider);
  }

  /**
   * Inject skills into agent execution context
   */
  async injectSkills(agentName: string, requestId: string): Promise<SkillContext> {
    const agentSkills = skillRegistry.getAgentSkills(agentName);
    if (!agentSkills) {
      throw new SkillInjectionError(`No skills registered for agent: ${agentName}`);
    }

    const context: SkillContext = {
      agentName,
      skillsUsed: [],
      tools: new Map()
    };

    // Inject all mandatory and optional skills
    const allSkills = [...agentSkills.mandatory_skills, ...agentSkills.optional_skills];

    for (const skillName of allSkills) {
      const toolProvider = this.toolProviders.get(skillName);
      if (!toolProvider) {
        console.warn(`No tool provider registered for skill: ${skillName}`);
        continue;
      }

      try {
        const tool = toolProvider();
        context.tools.set(skillName, tool);
      } catch (error) {
        console.error(`Failed to create tool for skill ${skillName}:`, error);
        // Continue with other skills, but log the issue
      }
    }

    return context;
  }

  /**
   * Track skill usage during execution
   */
  trackSkillUsage(context: SkillContext, skillName: string): void {
    if (!context.skillsUsed.includes(skillName)) {
      context.skillsUsed.push(skillName);
    }
  }

  /**
   * Validate skill usage against requirements
   */
  validateSkillUsage(context: SkillContext): {
    valid: boolean;
    missingMandatory: string[];
    warnings: string[];
  } {
    const agentSkills = skillRegistry.getAgentSkills(context.agentName);
    if (!agentSkills) {
      return {
        valid: false,
        missingMandatory: [],
        warnings: [`No skills registered for agent: ${context.agentName}`]
      };
    }

    const missingMandatory = agentSkills.mandatory_skills.filter(
      skill => !context.skillsUsed.includes(skill)
    );

    const warnings: string[] = [];

    // Check if any optional skills were used that aren't registered
    const allowedSkills = new Set([...agentSkills.mandatory_skills, ...agentSkills.optional_skills]);
    const unregisteredUsed = context.skillsUsed.filter(skill => !allowedSkills.has(skill));
    if (unregisteredUsed.length > 0) {
      warnings.push(`Agent used unregistered skills: ${unregisteredUsed.join(', ')}`);
    }

    return {
      valid: missingMandatory.length === 0,
      missingMandatory,
      warnings
    };
  }

  /**
   * Execute a skill with tracking
   */
  async executeSkill(
    context: SkillContext,
    skillName: string,
    params: any
  ): Promise<any> {
    const tool = context.tools.get(skillName);
    if (!tool) {
      throw new SkillInjectionError(`Tool not available for skill: ${skillName}`);
    }

    try {
      this.trackSkillUsage(context, skillName);
      const result = await tool.execute(params);
      return result;
    } catch (error) {
      console.error(`Skill execution failed for ${skillName}:`, error);
      throw error;
    }
  }

  /**
   * Get available tools for an agent
   */
  getAvailableTools(agentName: string): string[] {
    const agentSkills = skillRegistry.getAgentSkills(agentName);
    if (!agentSkills) return [];

    return [...agentSkills.mandatory_skills, ...agentSkills.optional_skills].filter(skill =>
      this.toolProviders.has(skill)
    );
  }

  /**
   * Create envelope with skill validation results
   */
  createEnvelopeWithSkillValidation<TOutput>(
    baseEnvelope: Omit<AgentEnvelope<TOutput>, 'skills_used' | 'warnings'>,
    context: SkillContext
  ): AgentEnvelope<TOutput> {
    const validation = this.validateSkillUsage(context);

    const warnings: string[] = [];
    if (validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }

    if (validation.missingMandatory.length > 0) {
      warnings.push(`Missing mandatory skills: ${validation.missingMandatory.join(', ')}`);
    }

    return {
      ...baseEnvelope,
      skills_used: context.skillsUsed,
      warnings,
      status: validation.valid ? baseEnvelope.status : 'failed'
    };
  }
}

export class SkillInjectionError extends Error {
  constructor(message: string, public skillName?: string) {
    super(message);
    this.name = 'SkillInjectionError';
  }
}

// Import comprehensive skill providers
import { registerAllSkillProviders } from './skill-providers';

// Register minimal fallback providers for missing skills
function registerMinimalFallbacks() {
  const fallbackTools = [
    // Ad analysis fallbacks
    'CTA-detection', 'audience-inference', 'video-frame-summary', 'emotion-tone-analysis',
    'OCR-text-extraction', 'message-hierarchy-analysis',

    // Brand analysis fallbacks
    'sitemap-understanding', 'metadata-extraction', 'color-logo-extraction',
    'DOM-content-extraction', 'business-classification', 'trust-signal-detection',
    'brand-style-detection',

    // Audience fallbacks
    'objection-detection', 'pain-point-clustering', 'psychographic-analysis',
    'behavioral-pattern-recognition', 'persona-mapping', 'funnel-stage-inference',

    // Strategy fallbacks
    'section-prioritization', 'persuasion-logic', 'component-selection',
    'A/B-variant-planning', 'CRO-heuristics', 'conversion-planning',
    'narrative-structuring',

    // Copy fallbacks
    'benefit-framing', 'FAQ-generation', 'localization', 'tone-adaptation',
    'headline-ideation', 'claim-verification', 'fact-grounding',
    'rewrite-safety', 'legal-risk-flagging',

    // Design fallbacks
    'color-system-mapping', 'visual-tone-classification',
    'accessibility-aware-token-adjustment', 'dark-light-adaptation',
    'typography-pairing', 'brand-token-extraction',

    // Component fallbacks
    'layout-logic', 'responsive-planning', 'accessibility-layout-checking',
    'component-matching', 'slot-mapping',

    // Validation fallbacks
    'CTA-consistency-checking', 'content-completeness-checking',
    'alignment-checking', 'issue-classification', 'accessibility-linting',
    'readability-analysis', 'schema-validation',

    // Repair fallbacks
    'targeted-rewriting', 'component-patching', 'claim-safe-replacement',
    'minimal-diff-repair', 'auto-regression-testing',

    // Rendering fallbacks
    'component-rendering', 'HTML-generation', 'CSS-styling',
    'responsive-rendering', 'animation-integration', 'interactive-component-rendering',

    // Integration fallbacks
    'code-integration', 'dependency-management', 'build-optimization',
    'asset-bundling', 'code-splitting', 'lazy-loading',

    // Deployment fallbacks
    'environment-configuration', 'deployment-scripting', 'CDN-optimization',
    'security-headers-setup', 'performance-budgeting', 'monitoring-setup',

    // Testing fallbacks
    'test-case-generation', 'test-execution-orchestration', 'result-analysis',
    'regression-detection', 'visual-regression-testing', 'load-testing-scripting',
    'stress-testing-setup', 'performance-metrics-collection', 'bottleneck-identification',
    'distributed-testing', 'WCAG-compliance-checking', 'screen-reader-testing',
    'keyboard-navigation-testing', 'color-contrast-analysis', 'automated-accessibility-scanning',
    'API-endpoint-testing', 'third-party-integration-testing', 'data-flow-validation',
    'error-handling-testing', 'contract-testing',

    // Optimization fallbacks
    'variant-creation', 'traffic-splitting-setup', 'statistical-significance-analysis',
    'winner-determination', 'multi-armed-bandit-optimization', 'code-minification',
    'image-optimization', 'caching-strategy-implementation', 'CDN-configuration',
    'critical-path-optimization', 'auto-scaling-configuration', 'load-balancing-setup',
    'database-scaling', 'CDN-scaling',

    // Feature management fallbacks
    'feature-flag-creation', 'rollout-percentage-setting', 'user-segmentation',
    'flag-management', 'production-deployment', 'rollback-preparation',
    'blue-green-deployment', 'monitoring-verification',

    // Operations fallbacks
    'incident-response-setup', 'backup-strategy-implementation',
    'disaster-recovery-planning', 'compliance-monitoring',

    // Documentation fallbacks
    'API-documentation-generation', 'user-guide-creation', 'deployment-documentation',
    'maintenance-manual-creation', 'technical-writing',

    // Handover fallbacks
    'knowledge-transfer-documentation', 'access-rights-setup',
    'training-materials-creation', 'transition-planning',

    // Monitoring fallbacks
    'metrics-collection', 'performance-baselining', 'real-user-monitoring',
    'alert-threshold-setting', 'custom-dashboard-creation', 'error-boundary-setup',
    'error-reporting-integration', 'error-aggregation', 'error-alerting',
    'error-replay-setup', 'tracking-code-integration', 'conversion-goal-setup',
    'event-tracking-configuration', 'privacy-compliance-setup', 'custom-event-tracking',
    'health-endpoint-creation', 'uptime-monitoring-setup', 'automated-health-testing',
    'performance-health-metrics', 'synthetic-monitoring'
  ];

  fallbackTools.forEach(skillName => {
    try {
      skillInjector.registerTool(skillName, () => ({
        name: skillName,
        description: `Fallback provider for ${skillName}`,
        execute: async (params: any) => {
          console.log(`⚠️ Using fallback for skill: ${skillName}`);
          return { status: 'fallback', skill: skillName, params };
        }
      }));
    } catch (e) {
      // Tool already registered, skip
    }
  });

  console.log(`✅ Registered ${fallbackTools.length} fallback tool providers`);
}

// Global skill injection system instance
export const skillInjector = new SkillInjectionSystem();

// Register minimal fallbacks for missing skills FIRST
registerMinimalFallbacks();

// Register all comprehensive skill providers AFTER fallbacks to override them
registerAllSkillProviders(skillInjector);