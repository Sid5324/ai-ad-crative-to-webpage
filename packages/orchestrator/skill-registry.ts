// packages/orchestrator/skill-registry.ts
import { SkillRegistry } from '../schemas/types';

export class SkillRegistryManager {
  private registry: Map<string, SkillRegistry> = new Map();

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Get skills for an agent
   */
  getAgentSkills(agentName: string): SkillRegistry | null {
    return this.registry.get(agentName) || null;
  }

  /**
   * Validate that agent used required skills
   */
  validateSkillUsage(agentName: string, skillsUsed: string[]): {
    valid: boolean;
    missing: string[];
    extra: string[];
  } {
    const agentSkills = this.getAgentSkills(agentName);
    if (!agentSkills) {
      return { valid: false, missing: [], extra: skillsUsed };
    }

    const required = new Set(agentSkills.mandatory_skills);
    const allowed = new Set([...agentSkills.mandatory_skills, ...agentSkills.optional_skills]);

    const missing = agentSkills.mandatory_skills.filter(skill => !skillsUsed.includes(skill));
    const extra = skillsUsed.filter(skill => !allowed.has(skill));

    return {
      valid: missing.length === 0,
      missing,
      extra
    };
  }

  /**
   * Get tool bindings for skills
   */
  getToolBindings(agentName: string): Array<{ skill: string; tool: string }> {
    const agentSkills = this.getAgentSkills(agentName);
    return agentSkills?.tool_bindings || [];
  }

  private initializeRegistry() {
    // Orchestrator Agent
    this.registry.set('orchestrator', {
      agent_name: 'orchestrator',
      mandatory_skills: [
        'workflow-planning',
        'task-routing',
        'schema-validation',
        'retry-policy',
        'observability'
      ],
      optional_skills: [
        'error-recovery',
        'performance-monitoring'
      ],
      tool_bindings: [
        { skill: 'workflow-planning', tool: 'orchestrator-planner' },
        { skill: 'task-routing', tool: 'agent-dispatcher' },
        { skill: 'schema-validation', tool: 'json-validator' },
        { skill: 'retry-policy', tool: 'retry-manager' },
        { skill: 'observability', tool: 'trace-logger' }
      ]
    });

    // Ad Analyzer Agent
    this.registry.set('ad-analyzer', {
      agent_name: 'ad-analyzer',
      mandatory_skills: [
        'multimodal-ad-reading',
        'OCR-text-extraction',
        'message-hierarchy-analysis',
        'CTA-detection',
        'audience-inference'
      ],
      optional_skills: [
        'video-frame-summary',
        'emotion-tone-analysis'
      ],
      tool_bindings: [
        { skill: 'multimodal-ad-reading', tool: 'vision-api' },
        { skill: 'OCR-text-extraction', tool: 'text-recognition' },
        { skill: 'message-hierarchy-analysis', tool: 'content-analyzer' },
        { skill: 'CTA-detection', tool: 'button-detector' },
        { skill: 'audience-inference', tool: 'demographic-classifier' }
      ]
    });

    // URL/Brand Analyzer Agent
    this.registry.set('url-brand-analyzer', {
      agent_name: 'url-brand-analyzer',
      mandatory_skills: [
        'DOM-content-extraction',
        'business-classification',
        'trust-signal-detection',
        'brand-style-detection'
      ],
      optional_skills: [
        'sitemap-understanding',
        'metadata-extraction',
        'color-logo-extraction'
      ],
      tool_bindings: [
        { skill: 'DOM-content-extraction', tool: 'html-parser' },
        { skill: 'business-classification', tool: 'industry-classifier' },
        { skill: 'trust-signal-detection', tool: 'trust-analyzer' },
        { skill: 'brand-style-detection', tool: 'style-extractor' }
      ]
    });

    // Audience Intent Agent
    this.registry.set('audience-intent', {
      agent_name: 'audience-intent',
      mandatory_skills: [
        'persona-mapping',
        'funnel-stage-inference',
        'objection-detection',
        'pain-point-clustering'
      ],
      optional_skills: [
        'psychographic-analysis',
        'behavioral-pattern-recognition'
      ],
      tool_bindings: [
        { skill: 'persona-mapping', tool: 'user-segmenter' },
        { skill: 'funnel-stage-inference', tool: 'intent-classifier' },
        { skill: 'objection-detection', tool: 'barrier-identifier' },
        { skill: 'pain-point-clustering', tool: 'problem-analyzer' }
      ]
    });

    // Page Strategy Agent
    this.registry.set('page-strategy', {
      agent_name: 'page-strategy',
      mandatory_skills: [
        'conversion-planning',
        'narrative-structuring',
        'section-prioritization',
        'persuasion-logic',
        'component-selection'
      ],
      optional_skills: [
        'A/B-variant-planning',
        'CRO-heuristics'
      ],
      tool_bindings: [
        { skill: 'conversion-planning', tool: 'conversion-optimizer' },
        { skill: 'narrative-structuring', tool: 'story-builder' },
        { skill: 'section-prioritization', tool: 'layout-planner' },
        { skill: 'persuasion-logic', tool: 'influence-engine' },
        { skill: 'component-selection', tool: 'component-matcher' }
      ]
    });

    // Copy Generator Agent
    this.registry.set('copy-generator', {
      agent_name: 'copy-generator',
      mandatory_skills: [
        'conversion-copywriting',
        'brand-voice-control',
        'CTA-writing',
        'benefit-framing',
        'FAQ-generation'
      ],
      optional_skills: [
        'localization',
        'tone-adaptation',
        'headline-ideation'
      ],
      tool_bindings: [
        { skill: 'conversion-copywriting', tool: 'copy-writer' },
        { skill: 'brand-voice-control', tool: 'voice-aligner' },
        { skill: 'CTA-writing', tool: 'cta-generator' },
        { skill: 'benefit-framing', tool: 'benefit-formatter' },
        { skill: 'FAQ-generation', tool: 'faq-builder' }
      ]
    });

    // Offer/Proof Guard Agent
    this.registry.set('offer-proof-guard', {
      agent_name: 'offer-proof-guard',
      mandatory_skills: [
        'claim-verification',
        'fact-grounding',
        'rewrite-safety',
        'legal-risk-flagging'
      ],
      optional_skills: [
        'regulatory-compliance-checking'
      ],
      tool_bindings: [
        { skill: 'claim-verification', tool: 'fact-checker' },
        { skill: 'fact-grounding', tool: 'source-validator' },
        { skill: 'rewrite-safety', tool: 'content-sanitizer' },
        { skill: 'legal-risk-flagging', tool: 'compliance-checker' }
      ]
    });

    // Design Token Agent
    this.registry.set('design-token-agent', {
      agent_name: 'design-token-agent',
      mandatory_skills: [
        'brand-token-extraction',
        'typography-pairing',
        'color-system-mapping',
        'visual-tone-classification'
      ],
      optional_skills: [
        'accessibility-aware-token-adjustment',
        'dark-light-adaptation'
      ],
      tool_bindings: [
        { skill: 'brand-token-extraction', tool: 'color-analyzer' },
        { skill: 'typography-pairing', tool: 'font-matcher' },
        { skill: 'color-system-mapping', tool: 'palette-generator' },
        { skill: 'visual-tone-classification', tool: 'style-classifier' }
      ]
    });

    // Component Plan Agent
    this.registry.set('component-plan-agent', {
      agent_name: 'component-plan-agent',
      mandatory_skills: [
        'component-matching',
        'slot-mapping',
        'layout-logic',
        'responsive-planning'
      ],
      optional_skills: [
        'accessibility-layout-checking'
      ],
      tool_bindings: [
        { skill: 'component-matching', tool: 'component-selector' },
        { skill: 'slot-mapping', tool: 'content-mapper' },
        { skill: 'layout-logic', tool: 'layout-engine' },
        { skill: 'responsive-planning', tool: 'responsive-designer' }
      ]
    });

    // QA Validator Agent
    this.registry.set('qa-validator', {
      agent_name: 'qa-validator',
      mandatory_skills: [
        'schema-validation',
        'CTA-consistency-checking',
        'content-completeness-checking',
        'alignment-checking',
        'issue-classification'
      ],
      optional_skills: [
        'accessibility-linting',
        'readability-analysis'
      ],
      tool_bindings: [
        { skill: 'schema-validation', tool: 'json-validator' },
        { skill: 'CTA-consistency-checking', tool: 'cta-verifier' },
        { skill: 'content-completeness-checking', tool: 'completeness-checker' },
        { skill: 'alignment-checking', tool: 'alignment-verifier' },
        { skill: 'issue-classification', tool: 'severity-classifier' }
      ]
    });

    // Repair Agent
    this.registry.set('repair-agent', {
      agent_name: 'repair-agent',
      mandatory_skills: [
        'targeted-rewriting',
        'component-patching',
        'claim-safe-replacement',
        'minimal-diff-repair'
      ],
      optional_skills: [
        'auto-regression-testing'
      ],
      tool_bindings: [
        { skill: 'targeted-rewriting', tool: 'content-rewriter' },
        { skill: 'component-patching', tool: 'component-fixer' },
        { skill: 'claim-safe-replacement', tool: 'safe-replacer' },
        { skill: 'minimal-diff-repair', tool: 'diff-minimizer' }
      ]
    });

    // Component Renderer Agent
    this.registry.set('component-renderer', {
      agent_name: 'component-renderer',
      mandatory_skills: [
        'component-rendering',
        'HTML-generation',
        'CSS-styling',
        'responsive-rendering'
      ],
      optional_skills: [
        'animation-integration',
        'interactive-component-rendering'
      ],
      tool_bindings: [
        { skill: 'component-rendering', tool: 'html-generator' },
        { skill: 'HTML-generation', tool: 'markup-builder' },
        { skill: 'CSS-styling', tool: 'style-applier' },
        { skill: 'responsive-rendering', tool: 'responsive-renderer' }
      ]
    });

    // Integration Agent
    this.registry.set('integration-agent', {
      agent_name: 'integration-agent',
      mandatory_skills: [
        'code-integration',
        'dependency-management',
        'build-optimization',
        'asset-bundling'
      ],
      optional_skills: [
        'code-splitting',
        'lazy-loading'
      ],
      tool_bindings: [
        { skill: 'code-integration', tool: 'code-merger' },
        { skill: 'dependency-management', tool: 'dependency-resolver' },
        { skill: 'build-optimization', tool: 'build-optimizer' },
        { skill: 'asset-bundling', tool: 'bundle-generator' }
      ]
    });

    // Deployment Prep Agent
    this.registry.set('deployment-prep-agent', {
      agent_name: 'deployment-prep-agent',
      mandatory_skills: [
        'environment-configuration',
        'deployment-scripting',
        'CDN-optimization',
        'security-headers-setup'
      ],
      optional_skills: [
        'performance-budgeting',
        'monitoring-setup'
      ],
      tool_bindings: [
        { skill: 'environment-configuration', tool: 'env-configurator' },
        { skill: 'deployment-scripting', tool: 'deploy-script-generator' },
        { skill: 'CDN-optimization', tool: 'cdn-optimizer' },
        { skill: 'security-headers-setup', tool: 'security-configurator' }
      ]
    });

    // Performance Monitoring Agent
    this.registry.set('performance-monitoring-agent', {
      agent_name: 'performance-monitoring-agent',
      mandatory_skills: [
        'metrics-collection',
        'performance-baselining',
        'real-user-monitoring',
        'alert-threshold-setting'
      ],
      optional_skills: [
        'custom-dashboard-creation'
      ],
      tool_bindings: [
        { skill: 'metrics-collection', tool: 'metrics-collector' },
        { skill: 'performance-baselining', tool: 'baseline-setter' },
        { skill: 'real-user-monitoring', tool: 'rum-configurator' },
        { skill: 'alert-threshold-setting', tool: 'alert-configurator' }
      ]
    });

    // Error Tracking Agent
    this.registry.set('error-tracking-agent', {
      agent_name: 'error-tracking-agent',
      mandatory_skills: [
        'error-boundary-setup',
        'error-reporting-integration',
        'error-aggregation',
        'error-alerting'
      ],
      optional_skills: [
        'error-replay-setup'
      ],
      tool_bindings: [
        { skill: 'error-boundary-setup', tool: 'error-boundary-generator' },
        { skill: 'error-reporting-integration', tool: 'error-reporter' },
        { skill: 'error-aggregation', tool: 'error-aggregator' },
        { skill: 'error-alerting', tool: 'error-alerter' }
      ]
    });

    // Analytics Integration Agent
    this.registry.set('analytics-integration-agent', {
      agent_name: 'analytics-integration-agent',
      mandatory_skills: [
        'tracking-code-integration',
        'conversion-goal-setup',
        'event-tracking-configuration',
        'privacy-compliance-setup'
      ],
      optional_skills: [
        'custom-event-tracking'
      ],
      tool_bindings: [
        { skill: 'tracking-code-integration', tool: 'analytics-integrator' },
        { skill: 'conversion-goal-setup', tool: 'goal-configurator' },
        { skill: 'event-tracking-configuration', tool: 'event-tracker' },
        { skill: 'privacy-compliance-setup', tool: 'privacy-configurator' }
      ]
    });

    // Health Check Agent
    this.registry.set('health-check-agent', {
      agent_name: 'health-check-agent',
      mandatory_skills: [
        'health-endpoint-creation',
        'uptime-monitoring-setup',
        'automated-health-testing',
        'performance-health-metrics'
      ],
      optional_skills: [
        'synthetic-monitoring'
      ],
      tool_bindings: [
        { skill: 'health-endpoint-creation', tool: 'health-endpoint-generator' },
        { skill: 'uptime-monitoring-setup', tool: 'uptime-monitor' },
        { skill: 'automated-health-testing', tool: 'health-tester' },
        { skill: 'performance-health-metrics', tool: 'performance-health-monitor' }
      ]
    });

    // End-to-End Testing Agent
    this.registry.set('end-to-end-testing-agent', {
      agent_name: 'end-to-end-testing-agent',
      mandatory_skills: [
        'test-case-generation',
        'test-execution-orchestration',
        'result-analysis',
        'regression-detection'
      ],
      optional_skills: [
        'visual-regression-testing'
      ],
      tool_bindings: [
        { skill: 'test-case-generation', tool: 'test-generator' },
        { skill: 'test-execution-orchestration', tool: 'test-orchestrator' },
        { skill: 'result-analysis', tool: 'result-analyzer' },
        { skill: 'regression-detection', tool: 'regression-detector' }
      ]
    });

    // Performance Testing Agent
    this.registry.set('performance-testing-agent', {
      agent_name: 'performance-testing-agent',
      mandatory_skills: [
        'load-testing-scripting',
        'stress-testing-setup',
        'performance-metrics-collection',
        'bottleneck-identification'
      ],
      optional_skills: [
        'distributed-testing'
      ],
      tool_bindings: [
        { skill: 'load-testing-scripting', tool: 'load-tester' },
        { skill: 'stress-testing-setup', tool: 'stress-tester' },
        { skill: 'performance-metrics-collection', tool: 'metrics-collector' },
        { skill: 'bottleneck-identification', tool: 'bottleneck-analyzer' }
      ]
    });

    // Accessibility Testing Agent
    this.registry.set('accessibility-testing-agent', {
      agent_name: 'accessibility-testing-agent',
      mandatory_skills: [
        'WCAG-compliance-checking',
        'screen-reader-testing',
        'keyboard-navigation-testing',
        'color-contrast-analysis'
      ],
      optional_skills: [
        'automated-accessibility-scanning'
      ],
      tool_bindings: [
        { skill: 'WCAG-compliance-checking', tool: 'wcag-checker' },
        { skill: 'screen-reader-testing', tool: 'screen-reader-tester' },
        { skill: 'keyboard-navigation-testing', tool: 'keyboard-navigator' },
        { skill: 'color-contrast-analysis', tool: 'contrast-analyzer' }
      ]
    });

    // Integration Testing Agent
    this.registry.set('integration-testing-agent', {
      agent_name: 'integration-testing-agent',
      mandatory_skills: [
        'API-endpoint-testing',
        'third-party-integration-testing',
        'data-flow-validation',
        'error-handling-testing'
      ],
      optional_skills: [
        'contract-testing'
      ],
      tool_bindings: [
        { skill: 'API-endpoint-testing', tool: 'api-tester' },
        { skill: 'third-party-integration-testing', tool: 'integration-tester' },
        { skill: 'data-flow-validation', tool: 'data-flow-validator' },
        { skill: 'error-handling-testing', tool: 'error-handler-tester' }
      ]
    });

    // A/B Testing Agent
    this.registry.set('ab-testing-agent', {
      agent_name: 'ab-testing-agent',
      mandatory_skills: [
        'variant-creation',
        'traffic-splitting-setup',
        'statistical-significance-analysis',
        'winner-determination'
      ],
      optional_skills: [
        'multi-armed-bandit-optimization'
      ],
      tool_bindings: [
        { skill: 'variant-creation', tool: 'variant-generator' },
        { skill: 'traffic-splitting-setup', tool: 'traffic-splitter' },
        { skill: 'statistical-significance-analysis', tool: 'stats-analyzer' },
        { skill: 'winner-determination', tool: 'winner-selector' }
      ]
    });

    // Performance Optimization Agent
    this.registry.set('performance-optimization-agent', {
      agent_name: 'performance-optimization-agent',
      mandatory_skills: [
        'code-minification',
        'image-optimization',
        'caching-strategy-implementation',
        'CDN-configuration'
      ],
      optional_skills: [
        'critical-path-optimization'
      ],
      tool_bindings: [
        { skill: 'code-minification', tool: 'code-minifier' },
        { skill: 'image-optimization', tool: 'image-optimizer' },
        { skill: 'caching-strategy-implementation', tool: 'cache-configurator' },
        { skill: 'CDN-configuration', tool: 'cdn-configurator' }
      ]
    });

    // Scaling Agent
    this.registry.set('scaling-agent', {
      agent_name: 'scaling-agent',
      mandatory_skills: [
        'auto-scaling-configuration',
        'load-balancing-setup',
        'database-scaling',
        'CDN-scaling'
      ],
      optional_skills: [
        'global-distribution-setup'
      ],
      tool_bindings: [
        { skill: 'auto-scaling-configuration', tool: 'auto-scaler' },
        { skill: 'load-balancing-setup', tool: 'load-balancer' },
        { skill: 'database-scaling', tool: 'db-scaler' },
        { skill: 'CDN-scaling', tool: 'cdn-scaler' }
      ]
    });

    // Feature Flag Agent
    this.registry.set('feature-flag-agent', {
      agent_name: 'feature-flag-agent',
      mandatory_skills: [
        'feature-flag-creation',
        'rollout-percentage-setting',
        'user-segmentation',
        'flag-management'
      ],
      optional_skills: [
        'canary-deployment-setup'
      ],
      tool_bindings: [
        { skill: 'feature-flag-creation', tool: 'flag-creator' },
        { skill: 'rollout-percentage-setting', tool: 'rollout-manager' },
        { skill: 'user-segmentation', tool: 'user-segmenter' },
        { skill: 'flag-management', tool: 'flag-manager' }
      ]
    });

    // Production Deployment Agent
    this.registry.set('production-deployment-agent', {
      agent_name: 'production-deployment-agent',
      mandatory_skills: [
        'production-deployment',
        'rollback-preparation',
        'blue-green-deployment',
        'monitoring-verification'
      ],
      optional_skills: [
        'zero-downtime-deployment'
      ],
      tool_bindings: [
        { skill: 'production-deployment', tool: 'production-deployer' },
        { skill: 'rollback-preparation', tool: 'rollback-preparer' },
        { skill: 'blue-green-deployment', tool: 'blue-green-deployer' },
        { skill: 'monitoring-verification', tool: 'monitor-verifier' }
      ]
    });

    // Operations Management Agent
    this.registry.set('operations-management-agent', {
      agent_name: 'operations-management-agent',
      mandatory_skills: [
        'incident-response-setup',
        'backup-strategy-implementation',
        'disaster-recovery-planning',
        'compliance-monitoring'
      ],
      optional_skills: [
        'cost-optimization'
      ],
      tool_bindings: [
        { skill: 'incident-response-setup', tool: 'incident-responder' },
        { skill: 'backup-strategy-implementation', tool: 'backup-strategist' },
        { skill: 'disaster-recovery-planning', tool: 'disaster-planner' },
        { skill: 'compliance-monitoring', tool: 'compliance-monitor' }
      ]
    });

    // Documentation Generation Agent
    this.registry.set('documentation-generation-agent', {
      agent_name: 'documentation-generation-agent',
      mandatory_skills: [
        'API-documentation-generation',
        'user-guide-creation',
        'deployment-documentation',
        'maintenance-manual-creation'
      ],
      optional_skills: [
        'video-tutorial-creation'
      ],
      tool_bindings: [
        { skill: 'API-documentation-generation', tool: 'api-doc-generator' },
        { skill: 'user-guide-creation', tool: 'user-guide-creator' },
        { skill: 'deployment-documentation', tool: 'deploy-doc-generator' },
        { skill: 'maintenance-manual-creation', tool: 'maintenance-manual-creator' }
      ]
    });

    // Handover Preparation Agent
    this.registry.set('handover-preparation-agent', {
      agent_name: 'handover-preparation-agent',
      mandatory_skills: [
        'knowledge-transfer-documentation',
        'access-rights-setup',
        'training-materials-creation',
        'transition-planning'
      ],
      optional_skills: [
        'mentorship-program-setup'
      ],
      tool_bindings: [
        { skill: 'knowledge-transfer-documentation', tool: 'knowledge-transfer-doc' },
        { skill: 'access-rights-setup', tool: 'access-rights-manager' },
        { skill: 'training-materials-creation', tool: 'training-material-creator' },
        { skill: 'transition-planning', tool: 'transition-planner' }
      ]
    });
  }
}

// Global skill registry instance
export const skillRegistry = new SkillRegistryManager();