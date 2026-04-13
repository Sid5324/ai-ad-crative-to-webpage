// packages/orchestrator/execution-tracer.ts
import { AgentEnvelope } from '../schemas/shared-envelope';
import { stateStore } from './state-store';

export interface TraceEntry {
  traceId: string;
  jobId: string;
  agentName: string;
  runId: string;
  phase: 'start' | 'skill-injection' | 'memory-read' | 'execution' | 'memory-write' | 'validation' | 'complete' | 'error';
  timestamp: string;
  duration?: number;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionMetrics {
  totalDuration: number;
  agentCount: number;
  skillUsageCount: number;
  memoryOperations: number;
  errorCount: number;
  averageConfidence: number;
  slowestAgent: {
    name: string;
    duration: number;
  };
  mostUsedSkill: {
    skill: string;
    count: number;
  };
}

export class ExecutionTracer {
  private traces: Map<string, TraceEntry[]> = new Map();
  private activeSpans: Map<string, { startTime: number; phase: string }> = new Map();

  /**
   * Start tracing a job execution
   */
  startJobTrace(jobId: string, requestData: any): string {
    const traceId = `trace_${jobId}_${Date.now()}`;
    this.traces.set(traceId, []);

    this.addTraceEntry(traceId, {
      traceId,
      jobId,
      agentName: 'orchestrator',
      runId: `run_${jobId}_init`,
      phase: 'start',
      timestamp: new Date().toISOString(),
      data: { request_summary: this.summarizeRequest(requestData) },
      metadata: { job_type: 'landing_page_generation' }
    });

    return traceId;
  }

  /**
   * Start tracing an agent execution phase
   */
  startAgentSpan(traceId: string, agentName: string, runId: string, phase: TraceEntry['phase']): string {
    const spanId = `span_${agentName}_${runId}_${phase}_${Date.now()}`;

    this.activeSpans.set(spanId, {
      startTime: Date.now(),
      phase
    });

    this.addTraceEntry(traceId, {
      traceId,
      jobId: this.getJobIdFromTrace(traceId),
      agentName,
      runId,
      phase,
      timestamp: new Date().toISOString(),
      metadata: { span_id: spanId }
    });

    return spanId;
  }

  /**
   * End an agent execution span
   */
  endAgentSpan(spanId: string, traceId: string, agentName: string, runId: string, data?: any, error?: string) {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    const duration = Date.now() - span.startTime;

    this.addTraceEntry(traceId, {
      traceId,
      jobId: this.getJobIdFromTrace(traceId),
      agentName,
      runId,
      phase: span.phase as TraceEntry['phase'],
      timestamp: new Date().toISOString(),
      duration,
      data,
      error,
      metadata: { span_id: spanId, completed: true }
    });

    this.activeSpans.delete(spanId);
  }

  /**
   * Trace skill usage
   */
  traceSkillUsage(traceId: string, agentName: string, runId: string, skillName: string, params?: any, result?: any) {
    this.addTraceEntry(traceId, {
      traceId,
      jobId: this.getJobIdFromTrace(traceId),
      agentName,
      runId,
      phase: 'execution',
      timestamp: new Date().toISOString(),
      data: {
        skill: skillName,
        params_summary: this.summarizeData(params),
        result_summary: this.summarizeData(result)
      },
      metadata: { skill_execution: true }
    });
  }

  /**
   * Trace memory operations
   */
  traceMemoryOperation(
    traceId: string,
    agentName: string,
    runId: string,
    operation: 'read' | 'write',
    memoryKeys: string[],
    scope: string
  ) {
    this.addTraceEntry(traceId, {
      traceId,
      jobId: this.getJobIdFromTrace(traceId),
      agentName,
      runId,
      phase: operation === 'read' ? 'memory-read' : 'memory-write',
      timestamp: new Date().toISOString(),
      data: {
        operation,
        memory_keys: memoryKeys,
        scope,
        count: memoryKeys.length
      },
      metadata: { memory_operation: true }
    });
  }

  /**
   * Trace envelope validation
   */
  traceEnvelopeValidation(traceId: string, agentName: string, runId: string, envelope: AgentEnvelope, isValid: boolean) {
    this.addTraceEntry(traceId, {
      traceId,
      jobId: this.getJobIdFromTrace(traceId),
      agentName,
      runId,
      phase: 'validation',
      timestamp: new Date().toISOString(),
      data: {
        envelope_status: envelope.status,
        skills_used: envelope.skills_used,
        confidence: envelope.confidence,
        warnings_count: envelope.warnings?.length || 0,
        is_valid: isValid
      },
      metadata: { validation_result: isValid }
    });
  }

  /**
   * Complete job trace
   */
  completeJobTrace(traceId: string, finalEnvelope?: AgentEnvelope) {
    this.addTraceEntry(traceId, {
      traceId,
      jobId: this.getJobIdFromTrace(traceId),
      agentName: 'orchestrator',
      runId: `run_${this.getJobIdFromTrace(traceId)}_complete`,
      phase: 'complete',
      timestamp: new Date().toISOString(),
      data: finalEnvelope ? {
        final_status: finalEnvelope.status,
        total_agents: finalEnvelope.output?.agent_count || 0
      } : undefined,
      metadata: { job_completed: true }
    });
  }

  /**
   * Get execution metrics for a job
   */
  getExecutionMetrics(traceId: string): ExecutionMetrics {
    const traces = this.traces.get(traceId);
    if (!traces) {
      throw new Error(`No traces found for traceId: ${traceId}`);
    }

    const agentTraces = traces.filter(t => t.agentName !== 'orchestrator');
    const startTime = Math.min(...traces.map(t => new Date(t.timestamp).getTime()));
    const endTime = Math.max(...traces.map(t => new Date(t.timestamp).getTime()));

    const totalDuration = endTime - startTime;
    const agentCount = new Set(agentTraces.map(t => t.agentName)).size;

    // Count skill usage
    const skillUsage = agentTraces
      .filter(t => t.data?.skill)
      .map(t => t.data.skill);

    const skillCounts = skillUsage.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedSkill = (Object.entries(skillCounts) as [string, number][])
      .sort(([,a], [,b]) => b - a)[0] || ['', 0];

    // Count memory operations
    const memoryOperations = traces.filter(t =>
      t.phase === 'memory-read' || t.phase === 'memory-write'
    ).length;

    // Count errors
    const errorCount = traces.filter(t => t.error).length;

    // Calculate average confidence
    const confidenceValues = agentTraces
      .filter(t => t.data?.confidence !== undefined)
      .map(t => t.data.confidence);

    const averageConfidence = confidenceValues.length > 0
      ? (confidenceValues as number[]).reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0;

    // Find slowest agent
    const agentDurations = agentTraces
      .filter(t => t.duration !== undefined)
      .reduce((acc, trace) => {
        const existing = acc.get(trace.agentName) || 0;
        acc.set(trace.agentName, existing + (trace.duration || 0));
        return acc;
      }, new Map<string, number>());

    const slowestAgent = (Array.from(agentDurations.entries()) as [string, number][])
      .sort(([,a], [,b]) => b - a)[0] || ['', 0];

    return {
      totalDuration,
      agentCount,
      skillUsageCount: skillUsage.length,
      memoryOperations,
      errorCount,
      averageConfidence,
      slowestAgent: {
        name: slowestAgent[0],
        duration: slowestAgent[1] as number
      },
      mostUsedSkill: {
        skill: mostUsedSkill[0],
        count: mostUsedSkill[1]
      }
    };
  }

  /**
   * Get trace entries for debugging
   */
  getTraceEntries(traceId: string): TraceEntry[] {
    return this.traces.get(traceId) || [];
  }

  /**
   * Export traces for external analysis
   */
  exportTraces(traceId: string): string {
    const traces = this.getTraceEntries(traceId);
    return JSON.stringify({
      traceId,
      exported_at: new Date().toISOString(),
      entries: traces
    }, null, 2);
  }

  /**
   * Cleanup old traces (keep last 24 hours)
   */
  cleanup(): number {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [traceId, traces] of Array.from(this.traces.entries())) {
      const latestTrace = traces[traces.length - 1];
      if (latestTrace && new Date(latestTrace.timestamp) < cutoff) {
        this.traces.delete(traceId);
        cleaned++;
      }
    }

    return cleaned;
  }

  private addTraceEntry(traceId: string, entry: TraceEntry): void {
    const traces = this.traces.get(traceId) || [];
    traces.push(entry);
    this.traces.set(traceId, traces);
  }

  private getJobIdFromTrace(traceId: string): string {
    return traceId.split('_')[1]; // trace_{jobId}_{timestamp}
  }

  private summarizeRequest(request: any): string {
    if (!request) return 'empty';

    // Extract key fields without sensitive data
    const summary = {
      has_ad_content: !!request.adContent,
      has_url: !!request.url,
      content_length: request.adContent?.length || 0,
      url_length: request.url?.length || 0
    };

    return JSON.stringify(summary);
  }

  private summarizeData(data: any): string {
    if (!data) return 'empty';

    if (typeof data === 'string') {
      return data.length > 100 ? `${data.substring(0, 100)}...` : data;
    }

    if (typeof data === 'object') {
      const summary: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' && value.length > 50) {
          summary[key] = `${value.substring(0, 50)}...`;
        } else if (Array.isArray(value)) {
          summary[key] = `array[${value.length}]`;
        } else {
          summary[key] = value;
        }
      }
      return JSON.stringify(summary);
    }

    return String(data);
  }
}

// Global execution tracer instance
export const executionTracer = new ExecutionTracer();