// src/lib/state-machine.ts - Production state machine with proper cancellation
import { Brand, AdVision, PageStrategy, VoiceCopy, DesignDirection, QA } from './schemas/skill-schemas';

// ========== STATE DEFINITIONS ==========

export enum PipelineState {
  PENDING = 'PENDING',
  BRAND_EXTRACTING = 'BRAND_EXTRACTING',
  BRAND_OK = 'BRAND_OK',
  BRAND_FAILED = 'BRAND_FAILED',
  VISION_ANALYZING = 'VISION_ANALYZING',
  VISION_OK = 'VISION_OK',
  VISION_FAILED = 'VISION_FAILED',
  STRATEGY_BUILDING = 'STRATEGY_BUILDING',
  STRATEGY_OK = 'STRATEGY_OK',
  COPY_WRITING = 'COPY_WRITING',
  COPY_OK = 'COPY_OK',
  COPY_FAILED = 'COPY_FAILED',
  DESIGN_CREATING = 'DESIGN_CREATING',
  DESIGN_OK = 'DESIGN_OK',
  DESIGN_FAILED = 'DESIGN_FAILED',
  QA_CHECKING = 'QA_CHECKING',
  QA_PASSED = 'QA_PASSED',
  QA_BLOCKED = 'QA_BLOCKED',
  RENDERING = 'RENDERING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',    // Invalid output (validation failure)
  FAILED = 'FAILED'        // Runtime error
}

// ========== EXECUTION RESULT ==========

export type ExecutionResult<T> = 
  | { ok: true; state: PipelineState; data: T }
  | { ok: false; state: PipelineState; error: ExecutionError };

export interface ExecutionError {
  code: string;
  message: string;
  previousState: PipelineState;
  retryable: boolean;
}

// ========== CANCELLATION TOKEN ==========

export class CancellationToken {
  private _cancelled = false;
  private _reason?: string;

  get isCancelled(): boolean {
    return this._cancelled;
  }

  get reason(): string | undefined {
    return this._reason;
  }

  cancel(reason: string): void {
    this._cancelled = true;
    this._reason = reason;
  }

  check(currentStep: PipelineState): void {
    if (this._cancelled) {
      throw new Error(`CANCELLED at ${currentStep}: ${this._reason}`);
    }
  }
}

// ========== STATE MACHINE ==========

export class LandingPageStateMachine {
  private state: PipelineState = PipelineState.PENDING;
  private token: CancellationToken;
  private history: Array<{ state: PipelineState; time: number }> = [];
  private errors: ExecutionError[] = [];

  constructor() {
    this.token = new CancellationToken();
    this.recordState(PipelineState.PENDING);
  }

  get currentState(): PipelineState {
    return this.state;
  }

  get isRunning(): boolean {
    return this.state === PipelineState.PENDING ||
           this.state === PipelineState.BRAND_EXTRACTING ||
           this.state === PipelineState.VISION_ANALYZING ||
           this.state === PipelineState.STRATEGY_BUILDING ||
           this.state === PipelineState.COPY_WRITING ||
           this.state === PipelineState.DESIGN_CREATING ||
           this.state === PipelineState.QA_CHECKING ||
           this.state === PipelineState.RENDERING;
  }

  get isTerminated(): boolean {
    return !this.isRunning;
  }

  get executionErrors(): ExecutionError[] {
    return [...this.errors];
  }

  // State transitions with cancellation check
  transition(nextState: PipelineState): void {
    this.token.check(nextState);
    this.recordState(nextState);
    this.state = nextState;
  }

  // Fatal error - pipeline cannot continue
  fail(code: string, message: string, retryable = false): void {
    const error: ExecutionError = {
      code,
      message,
      previousState: this.state,
      retryable
    };
    this.errors.push(error);
    this.state = PipelineState.FAILED;
    this.recordState(PipelineState.FAILED);
    this.token.cancel(message);
  }

  // Invalid output detected - pipeline stops but differently than FAILED
  reject(code: string, message: string): void {
    const error: ExecutionError = {
      code,
      message,
      previousState: this.state,
      retryable: false
    };
    this.errors.push(error);
    this.state = PipelineState.REJECTED;
    this.recordState(PipelineState.REJECTED);
    this.token.cancel(message);
  }

  // QA gate blocked - specific rejection type
  qaBlocked(issues: string[]): void {
    const error: ExecutionError = {
      code: 'QA_BLOCKED',
      message: issues.join('; '),
      previousState: this.state,
      retryable: false
    };
    this.errors.push(error);
    this.state = PipelineState.QA_BLOCKED;
    this.recordState(PipelineState.QA_BLOCKED);
    this.token.cancel(`QA blocked: ${issues.join(', ')}`);
  }

  complete(): void {
    this.transition(PipelineState.COMPLETED);
  }

  private recordState(state: PipelineState): void {
    this.history.push({ state, time: Date.now() });
  }

  getHistory(): Array<{ state: PipelineState; time: number }> {
    return [...this.history];
  }
}

// ========== STEP RUNNER WITH STATE MACHINE ==========

export interface Step<T> {
  name: PipelineState;
  execute: () => Promise<T>;
  onSuccess: (data: T) => void;
  onError: (error: Error) => void;
}

export async function runStep<T>(
  sm: LandingPageStateMachine,
  step: PipelineState,
  execute: () => Promise<T>
): Promise<ExecutionResult<T>> {
  try {
    sm.transition(step);
    const data = await execute();
    return { ok: true, state: sm.currentState, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    
    // Determine error type
    if (message.includes('CANCELLED')) {
      return { 
        ok: false, 
        state: sm.currentState, 
        error: { code: 'CANCELLED', message, previousState: sm.currentState, retryable: false } 
      };
    }
    
    sm.fail('RUNTIME_ERROR', message, true);
    return { 
      ok: false, 
      state: sm.currentState, 
      error: { code: 'RUNTIME_ERROR', message, previousState: sm.currentState, retryable: true } 
    };
  }
}

// ========== FACTORY ==========

export function createStateMachine(): LandingPageStateMachine {
  return new LandingPageStateMachine();
}