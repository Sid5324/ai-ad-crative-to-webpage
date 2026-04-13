// packages/agents/base-agent.ts
import { AgentEnvelope, SharedEnvelope } from '../schemas/shared-envelope';
import { MemoryRouter } from '../memory/memory-router';
import { InMemoryStore } from '../memory/request-memory';
import { skillInjector, SkillContext } from '../orchestrator/skill-injection';
import { executionTracer } from '../orchestrator/execution-tracer';

export interface AgentConfig {
  name: string;
  version?: string;
  memoryPolicy: AgentEnvelope['memory_policy'];
  skills: {
    required: string[];
    optional?: string[];
  };
}

export interface ExecutionContext {
  requestId: string;
  runId: string;
  traceId: string;
  input: any;
  previousOutputs?: Map<string, any>;
}

export abstract class BaseAgent<TInput = any, TOutput = any> {
  protected config: AgentConfig;
  protected memoryRouter: MemoryRouter;
  protected skillContext?: SkillContext;

  constructor(config: AgentConfig, memoryStore = new InMemoryStore()) {
    this.config = config;
    this.memoryRouter = new MemoryRouter(memoryStore);
  }

  /**
   * Execute the agent with full lifecycle management
   */
  async execute(context: ExecutionContext): Promise<AgentEnvelope<TOutput>> {
    const spanId = executionTracer.startAgentSpan(
      context.traceId,
      this.config.name,
      context.runId,
      'start'
    );

    try {
      // Phase 1: Skill injection
      executionTracer.endAgentSpan(spanId, context.traceId, this.config.name, context.runId);
      const skillSpanId = executionTracer.startAgentSpan(
        context.traceId,
        this.config.name,
        context.runId,
        'skill-injection'
      );

      this.skillContext = await skillInjector.injectSkills(this.config.name, context.requestId);
      executionTracer.endAgentSpan(skillSpanId, context.traceId, this.config.name, context.runId);

      // Phase 2: Memory retrieval
      const memorySpanId = executionTracer.startAgentSpan(
        context.traceId,
        this.config.name,
        context.runId,
        'memory-read'
      );

      const relevantMemory = await this.memoryRouter.getRelevantMemory(
        this.config.name,
        context.requestId,
        this.config.memoryPolicy,
        { input: context.input, previousOutputs: context.previousOutputs }
      );

      executionTracer.traceMemoryOperation(
        context.traceId,
        this.config.name,
        context.runId,
        'read',
        relevantMemory.map(m => m.memory_id),
        'multiple'
      );

      executionTracer.endAgentSpan(memorySpanId, context.traceId, this.config.name, context.runId, {
        memory_count: relevantMemory.length
      });

      // Phase 3: Core execution
      const executionSpanId = executionTracer.startAgentSpan(
        context.traceId,
        this.config.name,
        context.runId,
        'execution'
      );

      const result = await this.executeCore({
        input: context.input,
        memory: relevantMemory,
        previousOutputs: context.previousOutputs || new Map()
      });

      executionTracer.endAgentSpan(executionSpanId, context.traceId, this.config.name, context.runId, {
        output_summary: this.summarizeOutput(result)
      });

      // Phase 4: Memory storage
      if (this.config.memoryPolicy.write_scopes.length > 0) {
        const memorySpanId = executionTracer.startAgentSpan(
          context.traceId,
          this.config.name,
          context.runId,
          'memory-write'
        );

        await this.storeExecutionMemory(context.requestId, result, context.input);
        executionTracer.endAgentSpan(memorySpanId, context.traceId, this.config.name, context.runId);
      }

      // Phase 5: Create and validate envelope
      const validationSpanId = executionTracer.startAgentSpan(
        context.traceId,
        this.config.name,
        context.runId,
        'validation'
      );

      const envelope = skillInjector.createEnvelopeWithSkillValidation({
        agent_name: this.config.name,
        agent_version: this.config.version || '1.0.0',
        request_id: context.requestId,
        run_id: context.runId,
        timestamp: new Date().toISOString(),
        status: 'success',
        skills_required: this.config.skills.required,
        memory_policy: this.config.memoryPolicy,
        memory_reads: relevantMemory.map(m => m.memory_id),
        memory_writes: [], // Will be populated by storeExecutionMemory
        input_refs: this.extractInputRefs(context.input),
        output: result,
        confidence: this.calculateConfidence(result)
      }, this.skillContext);

      const isValid = SharedEnvelope.hasRequiredSkills(envelope);
      executionTracer.traceEnvelopeValidation(
        context.traceId,
        this.config.name,
        context.runId,
        envelope,
        isValid
      );

      executionTracer.endAgentSpan(validationSpanId, context.traceId, this.config.name, context.runId, {
        envelope_valid: isValid,
        skills_used: envelope.skills_used.length
      });

      return envelope;

    } catch (error) {
      // Handle errors with proper tracing
      executionTracer.endAgentSpan(spanId, context.traceId, this.config.name, context.runId, undefined, error.message);

      const errorEnvelope = SharedEnvelope.create({
        agent_name: this.config.name,
        agent_version: this.config.version || '1.0.0',
        request_id: context.requestId,
        run_id: context.runId,
        skills_required: this.config.skills.required,
        memory_policy: this.config.memoryPolicy,
        output: { error: error.message, success: false },
        status: 'failed',
        warnings: [`Execution failed: ${error.message}`]
      });

      if (this.skillContext) {
        return skillInjector.createEnvelopeWithSkillValidation(errorEnvelope, this.skillContext);
      }

      return errorEnvelope;
    }
  }

  /**
   * Execute skill with tracing
   */
  protected async executeSkill(skillName: string, params: any, traceId?: string, runId?: string): Promise<any> {
    if (!this.skillContext) {
      throw new Error('Skill context not initialized');
    }

    const result = await skillInjector.executeSkill(this.skillContext, skillName, params);

    if (traceId && runId && this.skillContext.agentName) {
      executionTracer.traceSkillUsage(
        traceId,
        this.skillContext.agentName,
        runId,
        skillName,
        params,
        result
      );
    }

    return result;
  }

  /**
   * Store execution results in memory
   */
  protected async storeExecutionMemory(requestId: string, result: TOutput, input: TInput): Promise<void> {
    const memoryWrites: string[] = [];

    // Store agent-specific learning
    if (this.config.memoryPolicy.write_scopes.includes('agent')) {
      const agentMemory = await this.memoryRouter.storeMemory(
        this.config.name,
        { type: 'agent', agent: this.config.name },
        {
          execution_result: result,
          input_summary: this.summarizeInput(input),
          patterns_learned: this.extractPatterns(result)
        },
        `Agent ${this.config.name} execution result`,
        ['execution', 'learning'],
        this.calculateConfidence(result)
      );
      memoryWrites.push(agentMemory.memory_id);
    }

    // Store request-specific context
    if (this.config.memoryPolicy.write_scopes.includes('request')) {
      const requestMemory = await this.memoryRouter.storeMemory(
        this.config.name,
        { type: 'request', request: requestId },
        {
          agent_output: result,
          agent_name: this.config.name
        },
        `Agent ${this.config.name} contribution to request ${requestId}`,
        ['request', this.config.name],
        this.calculateConfidence(result)
      );
      memoryWrites.push(requestMemory.memory_id);
    }

    // Update envelope with memory writes
    if (this.skillContext) {
      this.skillContext.skillsUsed.push(...memoryWrites); // Track as "skills" for now
    }
  }

  /**
   * Abstract method for core agent logic
   */
  protected abstract executeCore(context: {
    input: TInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<TOutput>;

  /**
   * Extract input references for envelope
   */
  protected extractInputRefs(input: TInput): string[] {
    // Default implementation - override in subclasses for specific logic
    if (typeof input === 'object' && input !== null) {
      return Object.keys(input);
    }
    return [];
  }

  /**
   * Calculate confidence score for output
   */
  protected calculateConfidence(output: TOutput): number {
    // Default implementation - override in subclasses
    return 0.8;
  }

  /**
   * Summarize input for memory storage
   */
  protected summarizeInput(input: TInput): string {
    if (typeof input === 'string') {
      return input.length > 200 ? `${input.substring(0, 200)}...` : input;
    }
    return JSON.stringify(input).substring(0, 200);
  }

  /**
   * Summarize output for tracing
   */
  protected summarizeOutput(output: TOutput): string {
    if (typeof output === 'string') {
      return output.length > 100 ? `${output.substring(0, 100)}...` : output;
    }
    if (typeof output === 'object' && output !== null) {
      return `object with ${Object.keys(output).length} keys`;
    }
    return String(output);
  }

  /**
   * Extract patterns for learning
   */
  protected extractPatterns(output: TOutput): any {
    // Default implementation - override in subclasses for specific pattern extraction
    return {};
  }

  /**
   * Get available skills for this agent
   */
  public getAvailableSkills(): string[] {
    return skillInjector.getAvailableTools(this.config.name);
  }
}