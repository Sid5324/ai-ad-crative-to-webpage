// packages/orchestrator/state-store.ts - Request state and execution management
import { nanoid } from 'nanoid';

export interface JobState {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  request: any;
  results: Map<string, any>;
  agentRuns: Map<string, any>;
  startTime: string;
  endTime?: string;
  error?: string;
  metadata: {
    qualityScore?: number;
    agentCount: number;
    totalTokens?: number;
  };
}

export class StateStore {
  private jobs = new Map<string, JobState>();

  /**
   * Create new job state
   */
  createJob(request: any): string {
    const jobId = nanoid();
    const jobState: JobState = {
      jobId,
      status: 'queued',
      request,
      results: new Map(),
      agentRuns: new Map(),
      startTime: new Date().toISOString(),
      metadata: {
        agentCount: 0
      }
    };

    this.jobs.set(jobId, jobState);
    return jobId;
  }

  /**
   * Update job status
   */
  updateJobStatus(jobId: string, status: JobState['status'], error?: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = status;
    if (error) job.error = error;
    if (status === 'completed' || status === 'failed') {
      job.endTime = new Date().toISOString();
    }
  }

  /**
   * Store agent result
   */
  storeAgentResult(jobId: string, agentName: string, result: any, envelope: any) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.results.set(agentName, result);
    job.agentRuns.set(agentName, envelope);
    job.metadata.agentCount = job.agentRuns.size;
  }

  /**
   * Get job state
   */
  getJob(jobId: string): JobState | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs (for monitoring)
   */
  getAllJobs(): JobState[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobState['status']): JobState[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  /**
   * Update job metadata
   */
  updateJobMetadata(jobId: string, metadata: Partial<JobState['metadata']>) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.metadata = { ...job.metadata, ...metadata };
  }

  /**
   * Cleanup old jobs (keep last 1000, or jobs younger than 24h)
   */
  cleanup(): number {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cleaned = 0;

    for (const [jobId, job] of Array.from(this.jobs.entries())) {
      const shouldKeep = job.status === 'running' ||
                        new Date(job.startTime) > cutoff ||
                        this.jobs.size - cleaned <= 1000;

      if (!shouldKeep) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get execution trace for a job
   */
  getExecutionTrace(jobId: string): any[] {
    const job = this.jobs.get(jobId);
    if (!job) return [];

    const trace = [];
    for (const [agentName, envelope] of Array.from(job.agentRuns.entries())) {
      trace.push({
        agent: agentName,
        status: envelope.status,
        skills_used: envelope.skills_used,
        confidence: envelope.confidence,
        warnings: envelope.warnings,
        timestamp: envelope.timestamp
      });
    }

    return trace.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}

// Export singleton instance
export const stateStore = new StateStore();