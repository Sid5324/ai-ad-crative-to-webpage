// packages/schemas/shared-envelope.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Initialize AJV with date-time format support
const ajv = new Ajv();
addFormats(ajv);

// Import the schema
const envelopeSchema = require('./shared-envelope.schema.json');

// Compile the validation function
const validateEnvelope = ajv.compile(envelopeSchema);

export interface AgentEnvelope<TOutput = any> {
  agent_name: string;
  agent_version?: string;
  request_id: string;
  run_id: string;
  timestamp: string; // ISO date-time string
  status: 'success' | 'partial' | 'failed';
  skills_required: string[];
  skills_used: string[];
  memory_policy: {
    read_scopes: string[];
    write_scopes: string[];
    retrieval_mode: 'none' | 'selective' | 'required';
  };
  memory_reads: string[]; // Memory keys that were read
  memory_writes: string[]; // Memory keys that were written
  input_refs: string[]; // References to inputs used
  warnings?: string[];
  confidence?: number; // 0-1 confidence score
  output: TOutput;
}

export interface MemoryItem {
  memory_id: string;
  memory_type: 'request' | 'session' | 'brand' | 'agent' | 'qa' | 'trace';
  scope: string;
  agent_owner: string;
  content: any;
  summary: string;
  source_refs: string[];
  confidence: number;
  created_at: string;
  updated_at: string;
  ttl: string;
  tags: string[];
  permissions: {
    readable_by: string[];
    writable_by: string[];
  };
}

export class EnvelopeError extends Error {
  constructor(message: string, public envelope?: Partial<AgentEnvelope>) {
    super(message);
    this.name = 'EnvelopeError';
  }
}

export class SharedEnvelope {
  /**
   * Validate an envelope against the schema
   */
  static validate(envelope: any): { valid: boolean; errors?: any[] } {
    const valid = validateEnvelope(envelope);
    return {
      valid,
      errors: valid ? undefined : validateEnvelope.errors
    };
  }

  /**
   * Create a new envelope with defaults
   */
  static create(params: {
    agent_name: string;
    agent_version?: string;
    request_id: string;
    run_id: string;
    skills_required: string[];
    memory_policy: AgentEnvelope['memory_policy'];
    output: Record<string, any>;
    status?: AgentEnvelope['status'];
    confidence?: number;
    warnings?: string[];
  }): AgentEnvelope {
    const envelope: AgentEnvelope = {
      agent_name: params.agent_name,
      agent_version: params.agent_version || '1.0.0',
      request_id: params.request_id,
      run_id: params.run_id,
      timestamp: new Date().toISOString(),
      status: params.status || 'success',
      skills_required: params.skills_required,
      skills_used: [], // Will be populated during execution
      memory_policy: params.memory_policy,
      memory_reads: [], // Will be populated during execution
      memory_writes: [], // Will be populated during execution
      input_refs: [], // Will be populated during execution
      output: params.output,
      ...(params.confidence !== undefined && { confidence: params.confidence }),
      ...(params.warnings && { warnings: params.warnings })
    };

    // Validate the created envelope
    const validation = this.validate(envelope);
    if (!validation.valid) {
      throw new EnvelopeError(
        `Invalid envelope: ${JSON.stringify(validation.errors)}`,
        envelope
      );
    }

    return envelope;
  }

  /**
   * Update an envelope with execution results
   */
  static updateExecutionResults(
    envelope: AgentEnvelope,
    updates: {
      skills_used?: string[];
      memory_reads?: string[];
      memory_writes?: string[];
      input_refs?: string[];
      status?: AgentEnvelope['status'];
      confidence?: number;
      warnings?: string[];
    }
  ): AgentEnvelope {
    const updated = {
      ...envelope,
      ...updates,
      timestamp: new Date().toISOString() // Update timestamp on modification
    };

    const validation = this.validate(updated);
    if (!validation.valid) {
      throw new EnvelopeError(
        `Invalid envelope update: ${JSON.stringify(validation.errors)}`,
        updated
      );
    }

    return updated;
  }

  /**
   * Check if envelope has required skills used
   */
  static hasRequiredSkills(envelope: AgentEnvelope): boolean {
    return envelope.skills_required.every(skill =>
      envelope.skills_used.includes(skill)
    );
  }

  /**
   * Get envelope summary for logging
   */
  static getSummary(envelope: AgentEnvelope): string {
    return `${envelope.agent_name} v${envelope.agent_version} - ${envelope.status} (${envelope.confidence || 'N/A'})`;
  }

  /**
   * Serialize envelope for storage/transmission
   */
  static serialize(envelope: AgentEnvelope): string {
    return JSON.stringify(envelope, null, 2);
  }

  /**
   * Deserialize and validate envelope
   */
  static deserialize(json: string): AgentEnvelope {
    try {
      const parsed = JSON.parse(json);
      const validation = this.validate(parsed);
      if (!validation.valid) {
        throw new EnvelopeError(
          `Invalid envelope data: ${JSON.stringify(validation.errors)}`,
          parsed
        );
      }
      return parsed as AgentEnvelope;
    } catch (error) {
      if (error instanceof EnvelopeError) throw error;
      throw new EnvelopeError(`Failed to deserialize envelope: ${error.message}`);
    }
  }
}

export default SharedEnvelope;