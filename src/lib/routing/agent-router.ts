// src/lib/routing/agent-router.ts
// Agent Routing System for the 26-Agent Architecture

import { AgentFamily, AgentResult } from '../agent-contracts/agent-result';

// ============================================================================
// ROUTING TYPES
// ============================================================================

export interface TaskRequest {
  id: string;
  type: TaskType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data: any;
  context?: {
    userId?: string;
    sessionId?: string;
    previousTasks?: string[];
    constraints?: string[];
  };
  deadline?: Date;
  requiredCapabilities?: string[];
  preferredAgents?: string[];
  excludedAgents?: string[];
}

export interface RoutingDecision {
  taskId: string;
  selectedFamily: AgentFamily;
  selectedAgent: string;
  reasoning: string;
  confidence: number;
  alternatives: Array<{
    family: AgentFamily;
    agent: string;
    score: number;
    reason: string;
  }>;
  routingMetadata: {
    decisionTime: number;
    rulesApplied: string[];
    contextFactors: string[];
  };
}

export interface TaskType {
  primary: 'search' | 'analyze' | 'create' | 'execute' | 'review' | 'maintain';
  secondary?: string[];
  complexity: 'simple' | 'medium' | 'complex';
  requires: string[];
}

// ============================================================================
// ROUTING RULES
// ============================================================================

interface RoutingRule {
  name: string;
  condition: (task: TaskRequest) => boolean;
  family: AgentFamily;
  priority: number;
  reason: string;
  confidence: number;
}

const ROUTING_RULES: RoutingRule[] = [
  // Research routing
  {
    name: 'web_search',
    condition: (task) => task.type.primary === 'search' && task.data?.query,
    family: 'research',
    priority: 10,
    reason: 'Task involves searching and gathering information',
    confidence: 0.9
  },
  {
    name: 'data_analysis',
    condition: (task) => task.type.primary === 'analyze' && task.data?.dataset,
    family: 'research',
    priority: 8,
    reason: 'Task requires data analysis and insights',
    confidence: 0.8
  },
  {
    name: 'competitive_intel',
    condition: (task) => task.data?.competitors || task.data?.market,
    family: 'research',
    priority: 9,
    reason: 'Market or competitive analysis required',
    confidence: 0.85
  },

  // Knowledge routing
  {
    name: 'qa_task',
    condition: (task) => task.type.primary === 'analyze' && task.data?.question,
    family: 'knowledge',
    priority: 9,
    reason: 'Question-answering task',
    confidence: 0.9
  },
  {
    name: 'document_processing',
    condition: (task) => task.data?.documents || task.data?.content,
    family: 'knowledge',
    priority: 8,
    reason: 'Document or content processing',
    confidence: 0.8
  },
  {
    name: 'entity_extraction',
    condition: (task) => task.type.secondary?.includes('extraction'),
    family: 'knowledge',
    priority: 7,
    reason: 'Entity or information extraction',
    confidence: 0.75
  },

  // Content routing
  {
    name: 'content_creation',
    condition: (task) => task.type.primary === 'create' && task.data?.contentType,
    family: 'content',
    priority: 10,
    reason: 'Content creation or generation task',
    confidence: 0.9
  },
  {
    name: 'seo_optimization',
    condition: (task) => task.data?.seo || task.data?.keywords,
    family: 'content',
    priority: 8,
    reason: 'SEO or content optimization',
    confidence: 0.8
  },
  {
    name: 'social_media',
    condition: (task) => task.data?.platform && ['twitter', 'linkedin', 'facebook'].includes(task.data.platform),
    family: 'content',
    priority: 7,
    reason: 'Social media content creation',
    confidence: 0.7
  },

  // Automation routing
  {
    name: 'api_integration',
    condition: (task) => task.type.primary === 'execute' && task.data?.api,
    family: 'automation',
    priority: 10,
    reason: 'API integration or automation',
    confidence: 0.9
  },
  {
    name: 'web_automation',
    condition: (task) => task.data?.url && task.type.primary === 'execute',
    family: 'automation',
    priority: 9,
    reason: 'Web automation task',
    confidence: 0.85
  },
  {
    name: 'data_processing',
    condition: (task) => task.type.primary === 'execute' && task.data?.transform,
    family: 'automation',
    priority: 8,
    reason: 'Data processing or transformation',
    confidence: 0.8
  },

  // Engineering routing
  {
    name: 'code_generation',
    condition: (task) => task.data?.code || task.type.secondary?.includes('programming'),
    family: 'engineering',
    priority: 10,
    reason: 'Code generation or programming task',
    confidence: 0.9
  },
  {
    name: 'debugging',
    condition: (task) => task.data?.error || task.data?.bug,
    family: 'engineering',
    priority: 9,
    reason: 'Debugging or error analysis',
    confidence: 0.85
  },
  {
    name: 'documentation',
    condition: (task) => task.data?.docs || task.type.secondary?.includes('documentation'),
    family: 'engineering',
    priority: 7,
    reason: 'Documentation generation',
    confidence: 0.7
  },

  // Governance routing
  {
    name: 'quality_review',
    condition: (task) => task.type.primary === 'review' || task.data?.review,
    family: 'governance',
    priority: 10,
    reason: 'Quality review or validation',
    confidence: 0.9
  },
  {
    name: 'policy_check',
    condition: (task) => task.data?.policy || task.data?.compliance,
    family: 'governance',
    priority: 9,
    reason: 'Policy or compliance check',
    confidence: 0.85
  },
  {
    name: 'approval_workflow',
    condition: (task) => task.data?.approval || task.type.secondary?.includes('approval'),
    family: 'governance',
    priority: 8,
    reason: 'Approval or authorization workflow',
    confidence: 0.8
  }
];

// ============================================================================
// AGENT ROUTER CLASS
// ============================================================================

export class AgentRouter {
  private static instance: AgentRouter;
  private agentAvailability = new Map<string, boolean>();

  static getInstance(): AgentRouter {
    if (!AgentRouter.instance) {
      AgentRouter.instance = new AgentRouter();
    }
    return AgentRouter.instance;
  }

  // Route task to appropriate agent family
  async routeTask(task: TaskRequest): Promise<RoutingDecision> {
    const startTime = Date.now();

    // Apply routing rules
    const matchingRules = ROUTING_RULES
      .filter(rule => rule.condition(task))
      .sort((a, b) => b.priority - a.priority);

    if (matchingRules.length === 0) {
      // Default routing based on primary task type
      return this.defaultRouting(task, startTime);
    }

    // Select best rule
    const bestRule = matchingRules[0];
    const selectedAgent = await this.selectSpecificAgent(bestRule.family, task);

    // Generate alternatives
    const alternatives = matchingRules.slice(1, 4).map(rule => ({
      family: rule.family,
      agent: 'auto-selected',
      score: rule.priority / 10,
      reason: rule.reason
    }));

    return {
      taskId: task.id,
      selectedFamily: bestRule.family,
      selectedAgent,
      reasoning: bestRule.reason,
      confidence: bestRule.confidence,
      alternatives,
      routingMetadata: {
        decisionTime: Date.now() - startTime,
        rulesApplied: matchingRules.map(r => r.name),
        contextFactors: this.extractContextFactors(task)
      }
    };
  }

  // Default routing when no rules match
  private async defaultRouting(task: TaskRequest, startTime: number): Promise<RoutingDecision> {
    const familyMap: Record<string, AgentFamily> = {
      'search': 'research',
      'analyze': 'knowledge',
      'create': 'content',
      'execute': 'automation',
      'review': 'governance',
      'maintain': 'engineering'
    };

    const family = familyMap[task.type.primary] || 'content';
    const selectedAgent = await this.selectSpecificAgent(family, task);

    return {
      taskId: task.id,
      selectedFamily: family,
      selectedAgent,
      reasoning: `Default routing for ${task.type.primary} task`,
      confidence: 0.5,
      alternatives: [],
      routingMetadata: {
        decisionTime: Date.now() - startTime,
        rulesApplied: ['default_routing'],
        contextFactors: this.extractContextFactors(task)
      }
    };
  }

  // Select specific agent within family
  private async selectSpecificAgent(family: AgentFamily, task: TaskRequest): Promise<string> {
    // Check preferred agents first
    if (task.preferredAgents?.length) {
      for (const agent of task.preferredAgents) {
        if (await this.isAgentAvailable(agent)) {
          return agent;
        }
      }
    }

    // Check excluded agents
    const excluded = new Set(task.excludedAgents || []);

    // Family-based selection (simplified - in real implementation would query agent registry)
    const familyAgents: Record<AgentFamily, string[]> = {
      research: ['web-researcher', 'deep-research-agent', 'url-brand-analyzer'],
      knowledge: ['document-rag-agent', 'contract-review-agent', 'content-intelligence-agent'],
      content: ['seo-writer', 'social-copy-agent', 'landing-page-copy-agent'],
      automation: ['browser-automation-agent', 'api-workflow-agent', 'file-processing-agent'],
      engineering: ['code-assistant-agent', 'bug-triage-agent'],
      governance: ['validator-repair-agent', 'evaluator-approval-agent']
    };

    const candidates = familyAgents[family] || [];

    // Select based on task requirements
    for (const agent of candidates) {
      if (!excluded.has(agent) && await this.isAgentAvailable(agent)) {
        return agent;
      }
    }

    // Fallback
    return `${family}-agent-1`;
  }

  // Check agent availability (would integrate with agent health monitoring)
  private async isAgentAvailable(agentName: string): Promise<boolean> {
    // Mock availability check - in real implementation would check agent status
    return Math.random() > 0.1; // 90% availability
  }

  // Extract context factors for routing decision
  private extractContextFactors(task: TaskRequest): string[] {
    const factors: string[] = [];

    if (task.context?.userId) factors.push('user_context');
    if (task.deadline) factors.push('deadline_constraint');
    if (task.requiredCapabilities?.length) factors.push('capability_requirements');
    if (task.priority !== 'normal') factors.push(`priority_${task.priority}`);
    if (task.data?.complexity) factors.push(`complexity_${task.data.complexity}`);

    return factors;
  }

  // Update agent availability
  updateAgentAvailability(agentName: string, available: boolean): void {
    this.agentAvailability.set(agentName, available);
  }

  // Get routing statistics
  getRoutingStats(): {
    totalRoutes: number;
    familyDistribution: Record<AgentFamily, number>;
    averageConfidence: number;
  } {
    // Mock stats - would track real metrics
    return {
      totalRoutes: 0,
      familyDistribution: {
        research: 0,
        knowledge: 0,
        content: 0,
        automation: 0,
        engineering: 0,
        governance: 0
      },
      averageConfidence: 0.8
    };
  }

  // Add custom routing rule
  addRoutingRule(rule: RoutingRule): void {
    ROUTING_RULES.push(rule);
    ROUTING_RULES.sort((a, b) => b.priority - a.priority);
  }

  // Remove routing rule
  removeRoutingRule(ruleName: string): void {
    const index = ROUTING_RULES.findIndex(r => r.name === ruleName);
    if (index >= 0) {
      ROUTING_RULES.splice(index, 1);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createTaskRequest(
  type: TaskType,
  data: any,
  options?: Partial<Omit<TaskRequest, 'id' | 'type' | 'data'>>
): TaskRequest {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    priority: 'normal',
    data,
    ...options
  };
}

export function validateRoutingDecision(decision: RoutingDecision): boolean {
  // Basic validation
  if (!decision.selectedFamily || !decision.selectedAgent) return false;
  if (decision.confidence < 0 || decision.confidence > 1) return false;
  if (!decision.reasoning) return false;

  return true;
}

// Export singleton
export const agentRouter = AgentRouter.getInstance();