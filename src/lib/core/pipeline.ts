// src/lib/core/pipeline.ts - Modern Pipeline Architecture
export interface PipelineStage<TInput, TOutput> {
  name: string;
  execute: (input: TInput, context: PipelineContext) => Promise<TOutput>;
  canSkip?: (context: PipelineContext) => boolean;
  timeout?: number;
}

export interface PipelineContext {
  traceId: string;
  startTime: number;
  metadata: Map<string, any>;
  errors: Error[];
  warnings: string[];
}

export interface PipelineResult<T> {
  success: boolean;
  data?: T;
  context: PipelineContext;
  duration: number;
}

export class AdCreativePipeline {
  private stages: PipelineStage<any, any>[] = [];

  addStage<TInput, TOutput>(stage: PipelineStage<TInput, TOutput>): this {
    this.stages.push(stage);
    return this;
  }

  async execute<TInput, TOutput>(
    input: TInput,
    initialContext?: Partial<PipelineContext>
  ): Promise<PipelineResult<TOutput>> {
    const context: PipelineContext = {
      traceId: initialContext?.traceId || Math.random().toString(36).substring(7),
      startTime: Date.now(),
      metadata: initialContext?.metadata || new Map(),
      errors: [],
      warnings: [],
      ...initialContext
    };

    let currentInput = input;
    let lastResult: any = null;

    try {
      for (const stage of this.stages) {
        if (stage.canSkip && stage.canSkip(context)) {
          console.log(`[${context.traceId}] ⏭️ Skipping stage: ${stage.name}`);
          continue;
        }

        console.log(`[${context.traceId}] ▶️ Executing stage: ${stage.name}`);

        const stagePromise = stage.execute(currentInput, context);
        const timeoutPromise = stage.timeout
          ? new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Stage ${stage.name} timed out`)), stage.timeout)
            )
          : null;

        const result = timeoutPromise
          ? await Promise.race([stagePromise, timeoutPromise])
          : await stagePromise;

        currentInput = result;
        lastResult = result;

        console.log(`[${context.traceId}] ✅ Stage ${stage.name} completed`);
      }

      return {
        success: true,
        data: lastResult,
        context,
        duration: Date.now() - context.startTime
      };

    } catch (error) {
      console.error(`[${context.traceId}] 💥 Pipeline failed at stage`, error);
      context.errors.push(error as Error);

      return {
        success: false,
        context,
        duration: Date.now() - context.startTime
      };
    }
  }
}

// Stage definitions for ad creative generation
export const createAdCreativeStages = (): PipelineStage<any, any>[] => [
  {
    name: 'input-validation',
    execute: async (input, context) => {
      if (!input.targetUrl) throw new Error('targetUrl is required');
      if (!input.adInputValue) throw new Error('adInputValue is required');
      return { ...input, validated: true };
    }
  },
  {
    name: 'vision-analysis',
    execute: async (input, context) => {
      // Vision analysis logic
      return input;
    },
    canSkip: (context) => context.metadata.get('skipVision') === true
  },
  {
    name: 'brand-extraction',
    execute: async (input, context) => {
      // Brand extraction logic
      return input;
    }
  },
  {
    name: 'content-generation',
    execute: async (input, context) => {
      // Content generation logic
      return input;
    }
  },
  {
    name: 'html-rendering',
    execute: async (input, context) => {
      // HTML rendering logic
      return input;
    }
  },
  {
    name: 'quality-validation',
    execute: async (input, context) => {
      // Quality validation logic
      return input;
    }
  }
];