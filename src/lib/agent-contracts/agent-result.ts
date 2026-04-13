// src/lib/agent-contracts/agent-result.ts
// Standardized Agent Result Contracts for the 26-Agent System

import { z } from 'zod';

// ============================================================================
// AGENT STATUS TYPES
// ============================================================================

export type AgentStatus =
  | "idle"
  | "running"
  | "retrying"
  | "validated"
  | "repairing"
  | "blocked"
  | "failed"
  | "completed";

export type AgentFamily =
  | "research"
  | "knowledge"
  | "content"
  | "automation"
  | "engineering"
  | "governance";

export type SkillRef = {
  name: string;
  version: string;
};

// ============================================================================
// VALIDATION ISSUE SCHEMA
// ============================================================================

export const ValidationIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.enum(["info", "warning", "fatal"]),
  field: z.string().optional(),
  suggestion: z.string().optional(),
  data: z.any().optional()
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

// ============================================================================
// AGENT RESULT CONTRACT
// ============================================================================

export const AgentResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  // Agent Identity
  agent: z.string(),
  family: z.enum(["research", "knowledge", "content", "automation", "engineering", "governance"]),
  version: z.string().default("1.0.0"),

  // Execution Status
  status: z.enum(["idle", "running", "retrying", "validated", "repairing", "blocked", "failed", "completed"]),
  ok: z.boolean(),

  // Core Data
  confidence: z.number().min(0).max(1),
  data: dataSchema.nullable(),

  // Skills Used
  skillsUsed: z.array(z.object({
    name: z.string(),
    version: z.string()
  })).default([]),

  // Issues & Errors
  issues: z.array(ValidationIssueSchema).default([]),

  // Observability
  traceId: z.string(),
  latencyMs: z.number(),
  retries: z.number().default(0),
  timestamp: z.string().default(() => new Date().toISOString()),

  // Context
  requestId: z.string().optional(),
  runId: z.string().optional(),
  previousOutputs: z.record(z.any()).optional(),

  // Metadata
  costEstimate: z.enum(["low", "medium", "high"]).optional(),
  permissions: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional()
});

export type AgentResult<T = any> = {
  agent: string;
  family: AgentFamily;
  version: string;
  status: AgentStatus;
  ok: boolean;
  confidence: number;
  data: T | null;
  skillsUsed: SkillRef[];
  issues: ValidationIssue[];
  traceId: string;
  latencyMs: number;
  retries: number;
  timestamp: string;
  requestId?: string;
  runId?: string;
  previousOutputs?: Record<string, any>;
  costEstimate?: "low" | "medium" | "high";
  permissions?: string[];
  warnings?: string[];
};

// ============================================================================
// SPECIALIZED AGENT RESULT TYPES
// ============================================================================

// Research Agent Results
export const ResearchResultSchema = AgentResultSchema(z.object({
  findings: z.array(z.object({
    topic: z.string(),
    content: z.string(),
    sources: z.array(z.string()),
    confidence: z.number()
  })),
  searchQueries: z.array(z.string()),
  totalSources: z.number(),
  synthesis: z.string()
}));

export type ResearchResult = z.infer<typeof ResearchResultSchema>;

// Knowledge Agent Results
export const KnowledgeResultSchema = AgentResultSchema(z.object({
  answer: z.string(),
  citations: z.array(z.object({
    text: z.string(),
    source: z.string(),
    relevance: z.number()
  })),
  relatedTopics: z.array(z.string())
}));

export type KnowledgeResult = z.infer<typeof KnowledgeResultSchema>;

// Content Agent Results
export const ContentResultSchema = AgentResultSchema(z.object({
  content: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    wordCount: z.number()
  })),
  tone: z.array(z.string()),
  seoScore: z.number().optional(),
  readabilityScore: z.number().optional()
}));

export type ContentResult = z.infer<typeof ContentResultSchema>;

// Automation Agent Results
export const AutomationResultSchema = AgentResultSchema(z.object({
  action: z.string(),
  success: z.boolean(),
  result: z.any(),
  logs: z.array(z.string()),
  duration: z.number(),
  rollbackAvailable: z.boolean()
}));

export type AutomationResult = z.infer<typeof AutomationResultSchema>;

// Engineering Agent Results
export const EngineeringResultSchema = AgentResultSchema(z.object({
  code: z.string().optional(),
  explanation: z.string(),
  changes: z.array(z.object({
    file: z.string(),
    type: z.enum(["create", "modify", "delete"]),
    description: z.string()
  })),
  tests: z.array(z.string()).optional(),
  buildStatus: z.enum(["pending", "passed", "failed"]).optional()
}));

export type EngineeringResult = z.infer<typeof EngineeringResultSchema>;

// Governance Agent Results
export const GovernanceResultSchema = AgentResultSchema(z.object({
  decision: z.enum(["approve", "reject", "escalate", "repair"]),
  reasons: z.array(z.string()),
  score: z.number().min(0).max(100),
  rulesViolated: z.array(z.string()),
  recommendations: z.array(z.string()),
  escalatedTo: z.string().optional()
}));

export type GovernanceResult = z.infer<typeof GovernanceResultSchema>;

// ============================================================================
// AGENT EXECUTION CONTEXT
// ============================================================================

export interface AgentExecutionContext {
  requestId: string;
  runId: string;
  traceId: string;
  input: any;
  previousOutputs?: Map<string, AgentResult<any>>;
  timeout?: number;
  retries?: number;
}

// ============================================================================
// AGENT CONTRACT INTERFACE
// ============================================================================

export interface AgentContract<T = any> {
  name: string;
  family: AgentFamily;
  version: string;

  // Skills this agent uses
  skills: SkillRef[];

  // Schema definitions
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema<T>;

  // Execution contract
  execute(context: AgentExecutionContext): Promise<AgentResult<T>>;

  // Metadata
  description?: string;
  timeoutMs?: number;
  costEstimate?: "low" | "medium" | "high";
  permissions?: string[];
}

// ============================================================================
// AGENT FACTORY CONTRACT
// ============================================================================

export interface AgentFactoryContract {
  createAgent<T>(
    name: string,
    family: AgentFamily,
    skills: SkillRef[],
    implementation: (context: AgentExecutionContext) => Promise<T>
  ): AgentContract<T>;

  getAgent<T>(name: string): AgentContract<T> | null;

  listAgents(): Array<{ name: string; family: AgentFamily; version: string }>;

  validateAgent(name: string): Promise<{ valid: boolean; issues: string[] }>;
}

// ============================================================================
// AGENT REGISTRY
// ============================================================================

class AgentRegistry {
  private agents = new Map<string, AgentContract<any>>();

  register<T>(contract: AgentContract<T>): void {
    const key = `${contract.family}:${contract.name}@${contract.version}`;
    if (this.agents.has(key)) {
      throw new Error(`Agent ${key} already registered`);
    }
    this.agents.set(key, contract);
  }

  get<T>(family: AgentFamily, name: string, version: string = 'latest'): AgentContract<T> | null {
    const key = version === 'latest'
      ? this.getLatestVersion(family, name)
      : `${family}:${name}@${version}`;

    return this.agents.get(key) || null;
  }

  private getLatestVersion(family: AgentFamily, name: string): string | null {
    const prefix = `${family}:${name}@`;
    const versions = Array.from(this.agents.keys())
      .filter(key => key.startsWith(prefix))
      .map(key => key.split('@')[1])
      .sort((a, b) => this.compareVersions(b, a)); // descending

    return versions[0] ? `${family}:${name}@${versions[0]}` : null;
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;

      if (partA > partB) return 1;
      if (partA < partB) return -1;
    }

    return 0;
  }

  list(): Array<{ name: string; family: AgentFamily; version: string }> {
    return Array.from(this.agents.values()).map(agent => ({
      name: agent.name,
      family: agent.family,
      version: agent.version
    }));
  }

  listByFamily(family: AgentFamily): AgentContract<any>[] {
    return Array.from(this.agents.values()).filter(agent => agent.family === family);
  }
}

// Export singleton
export const agentRegistry = new AgentRegistry();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createAgentResult<T>(
  agent: string,
  family: AgentFamily,
  data: T,
  confidence: number = 0.8,
  options?: {
    skillsUsed?: SkillRef[];
    issues?: ValidationIssue[];
    traceId?: string;
    latencyMs?: number;
    status?: AgentStatus;
  }
): AgentResult<T> {
  return {
    agent,
    family,
    version: '1.0.0',
    status: options?.status || 'completed',
    ok: true,
    confidence,
    data,
    skillsUsed: options?.skillsUsed || [],
    issues: options?.issues || [],
    traceId: options?.traceId || 'unknown',
    latencyMs: options?.latencyMs || 0,
    retries: 0,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResult<T>(
  agent: string,
  family: AgentFamily,
  error: string,
  options?: {
    traceId?: string;
    issues?: ValidationIssue[];
  }
): AgentResult<T> {
  return {
    agent,
    family,
    version: '1.0.0',
    status: 'failed',
    ok: false,
    confidence: 0,
    data: null,
    skillsUsed: [],
    issues: options?.issues || [{
      code: 'EXECUTION_ERROR',
      message: error,
      severity: 'fatal'
    }],
    traceId: options?.traceId || 'unknown',
    latencyMs: 0,
    retries: 0,
    timestamp: new Date().toISOString()
  };
}