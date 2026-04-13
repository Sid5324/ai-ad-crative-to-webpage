// src/lib/skills-registry/shared-skills-registry.ts
// Shared Skills Registry - Versioned, typed skills for all agents

import { z } from 'zod';

// ============================================================================
// SKILL METADATA TYPES
// ============================================================================

export interface SkillMetadata {
  name: string;
  version: string;
  description: string;
  category: 'discovery' | 'understanding' | 'creation' | 'action' | 'control' | 'memory' | 'observability';
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  costEstimate: 'low' | 'medium' | 'high';
  requiresPermissions?: string[];
  deprecated?: boolean;
  replacement?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  exponential: boolean;
  retryableErrors: string[];
}

export interface SkillExecutionContext {
  agentId: string;
  requestId: string;
  traceId: string;
  input: any;
  previousOutputs?: Map<string, any>;
}

export interface SkillResult<T = any> {
  skill: string;
  version: string;
  success: boolean;
  data: T | null;
  confidence: number;
  latencyMs: number;
  errors?: string[];
  traceId: string;
}

// ============================================================================
// SHARED SKILLS REGISTRY
// ============================================================================

class SharedSkillsRegistry {
  private skills = new Map<string, SkillMetadata>();

  constructor() {
    this.registerAllSkills();
  }

  // Register a skill with metadata
  register(skill: SkillMetadata): void {
    const key = `${skill.name}@${skill.version}`;
    if (this.skills.has(key)) {
      throw new Error(`Skill ${key} already registered`);
    }
    this.skills.set(key, skill);
  }

  // Get skill by name and version
  get(name: string, version: string = 'latest'): SkillMetadata | null {
    const key = version === 'latest' ? this.getLatestVersion(name) : `${name}@${version}`;
    return this.skills.get(key) || null;
  }

  // Get latest version of a skill
  getLatestVersion(name: string): string | null {
    const versions = Array.from(this.skills.keys())
      .filter(key => key.startsWith(`${name}@`))
      .map(key => key.split('@')[1])
      .sort((a, b) => this.compareVersions(b, a)); // descending

    return versions[0] ? `${name}@${versions[0]}` : null;
  }

  // List all skills
  list(): SkillMetadata[] {
    return Array.from(this.skills.values());
  }

  // List skills by category
  listByCategory(category: SkillMetadata['category']): SkillMetadata[] {
    return this.list().filter(skill => skill.category === category);
  }

  // Execute a skill with validation
  async execute<T>(
    name: string,
    version: string,
    context: SkillExecutionContext,
    implementation: (ctx: SkillExecutionContext) => Promise<any>
  ): Promise<SkillResult<T>> {
    const skill = this.get(name, version);
    if (!skill) {
      throw new Error(`Skill ${name}@${version} not found`);
    }

    const startTime = Date.now();
    const traceId = context.traceId;

    try {
      // Validate input
      const validatedInput = skill.inputSchema.parse(context.input);

      // Execute with retry logic
      let result = await this.executeWithRetry(
        () => implementation({ ...context, input: validatedInput }),
        skill.retryPolicy
      );

      // Validate output
      const validatedOutput = skill.outputSchema.parse(result);

      return {
        skill: name,
        version: skill.version,
        success: true,
        data: validatedOutput,
        confidence: 0.9, // Would be calculated based on implementation
        latencyMs: Date.now() - startTime,
        traceId
      };

    } catch (error: any) {
      return {
        skill: name,
        version: skill.version,
        success: false,
        data: null,
        confidence: 0,
        latencyMs: Date.now() - startTime,
        errors: [error.message],
        traceId
      };
    }
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    policy: RetryPolicy
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        if (!policy.retryableErrors.some(retryable =>
          error.message.includes(retryable)
        )) {
          throw error; // Don't retry this error
        }

        if (attempt < policy.maxRetries) {
          const delay = policy.exponential
            ? policy.backoffMs * Math.pow(2, attempt)
            : policy.backoffMs;

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
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

  // ============================================================================
  // REGISTER ALL SHARED SKILLS
  // ============================================================================

  private registerAllSkills(): void {
    // Discovery Skills
    this.registerInputPreflight();
    this.registerSearchWeb();
    this.registerCrawlPage();
    this.registerExtractMetadata();
    this.registerKeywordResearch();

    // Understanding Skills
    this.registerSummarizeGrounded();
    this.registerExtractStructured();
    this.registerClassifyContent();
    this.registerCompareSources();
    this.registerQueryValidation();

    // Creation Skills
    this.registerOutlineGenerate();
    this.registerContentOutlining();
    this.registerRewriteWithConstraints();
    this.registerPersonalizeContent();
    this.registerGenerateVariants();

    // Action Skills
    this.registerBrowserControl();
    this.registerApiCall();
    this.registerFileOperations();
    this.registerMessageDispatch();

    // Control Skills
    this.registerSchemaValidate();
    this.registerBusinessRuleCheck();
    this.registerRepairOutput();
    this.registerHumanEscalation();
    this.registerSEOOptimization();

    // Memory Skills
    this.registerMemoryRecall();
    this.registerEntityTracking();
    this.registerPreferenceLearning();
    this.registerCacheManagement();

    // Observability Skills
    this.registerTraceLog();
    this.registerPerformanceMonitor();
    this.registerConfidenceScore();
    this.registerAuditTrail();
  }

  // ============================================================================
  // DISCOVERY SKILLS
  // ============================================================================

  private registerInputPreflight(): void {
    this.register({
      name: 'input_preflight',
      version: '1.0.0',
      description: 'Sanitize and validate inputs, extract metadata',
      category: 'discovery',
      inputSchema: z.object({
        rawInput: z.any(),
        expectedType: z.string().optional()
      }),
      outputSchema: z.object({
        sanitized: z.any(),
        metadata: z.record(z.any()),
        warnings: z.array(z.string())
      }),
      timeoutMs: 5000,
      retryPolicy: {
        maxRetries: 0,
        backoffMs: 0,
        exponential: false,
        retryableErrors: []
      },
      costEstimate: 'low'
    });
  }

  private registerSearchWeb(): void {
    this.register({
      name: 'search_web',
      version: '1.0.0',
      description: 'Multi-engine web search with deduplication',
      category: 'discovery',
      inputSchema: z.object({
        query: z.string(),
        engines: z.array(z.string()).optional(),
        limit: z.number().optional()
      }),
      outputSchema: z.object({
        results: z.array(z.object({
          title: z.string(),
          url: z.string(),
          snippet: z.string(),
          source: z.string()
        })),
        totalFound: z.number(),
        deduplicated: z.boolean()
      }),
      timeoutMs: 30000,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        exponential: true,
        retryableErrors: ['timeout', 'network']
      },
      costEstimate: 'medium'
    });
  }

  private registerCrawlPage(): void {
    this.register({
      name: 'crawl_page',
      version: '1.0.0',
      description: 'Safe page crawling with rate limiting',
      category: 'discovery',
      inputSchema: z.object({
        url: z.string(),
        depth: z.number().optional(),
        selectors: z.array(z.string()).optional()
      }),
      outputSchema: z.object({
        content: z.string(),
        links: z.array(z.string()),
        metadata: z.record(z.any()),
        screenshots: z.array(z.string()).optional()
      }),
      timeoutMs: 45000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 2000,
        exponential: false,
        retryableErrors: ['timeout', 'blocked']
      },
      costEstimate: 'medium',
      requiresPermissions: ['web-access']
    });
  }

  private registerExtractMetadata(): void {
    this.register({
      name: 'extract_metadata',
      version: '1.0.0',
      description: 'Structured metadata extraction from content',
      category: 'discovery',
      inputSchema: z.object({
        content: z.string(),
        url: z.string().optional()
      }),
      outputSchema: z.object({
        title: z.string(),
        description: z.string(),
        keywords: z.array(z.string()),
        author: z.string().optional(),
        publishDate: z.string().optional(),
        language: z.string(),
        type: z.string()
      }),
      timeoutMs: 10000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 500,
        exponential: false,
        retryableErrors: ['parse-error']
      },
      costEstimate: 'low'
    });
  }

  private registerKeywordResearch(): void {
    this.register({
      name: 'keyword_research',
      version: '1.0.0',
      description: 'SEO keyword research and analysis',
      category: 'discovery',
      inputSchema: z.object({
        topic: z.string(),
        currentKeywords: z.array(z.string()).optional(),
        competition: z.enum(['low', 'medium', 'high']).optional(),
        searchVolume: z.enum(['low', 'medium', 'high']).optional()
      }),
      outputSchema: z.object({
        primaryKeywords: z.array(z.string()),
        secondaryKeywords: z.array(z.string()),
        longTailKeywords: z.array(z.string()),
        searchVolume: z.record(z.number()),
        competition: z.record(z.number()),
        recommendations: z.array(z.string())
      }),
      timeoutMs: 15000,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        exponential: true,
        retryableErrors: ['api-error', 'rate-limit']
      },
      costEstimate: 'medium'
    });
  }

  // ============================================================================
  // UNDERSTANDING SKILLS
  // ============================================================================

  private registerSummarizeGrounded(): void {
    this.register({
      name: 'summarize_grounded',
      version: '1.0.0',
      description: 'Evidence-based summarization with citations',
      category: 'understanding',
      inputSchema: z.object({
        content: z.string(),
        maxLength: z.number().optional(),
        style: z.enum(['concise', 'detailed', 'bullet']).optional()
      }),
      outputSchema: z.object({
        summary: z.string(),
        citations: z.array(z.object({
          text: z.string(),
          sourceIndex: z.number()
        })),
        confidence: z.number(),
        keyPoints: z.array(z.string())
      }),
      timeoutMs: 20000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 1000,
        exponential: false,
        retryableErrors: ['length-exceeded']
      },
      costEstimate: 'medium'
    });
  }

  private registerExtractStructured(): void {
    this.register({
      name: 'extract_structured',
      version: '1.0.0',
      description: 'Schema-guided structured data extraction',
      category: 'understanding',
      inputSchema: z.object({
        content: z.string(),
        schema: z.record(z.any()),
        examples: z.array(z.any()).optional()
      }),
      outputSchema: z.object({
        extracted: z.record(z.any()),
        confidence: z.number(),
        missingFields: z.array(z.string()),
        validationErrors: z.array(z.string())
      }),
      timeoutMs: 15000,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        exponential: true,
        retryableErrors: ['schema-mismatch']
      },
      costEstimate: 'medium'
    });
  }

  private registerClassifyContent(): void {
    this.register({
      name: 'classify_content',
      version: '1.0.0',
      description: 'Content classification and intent analysis',
      category: 'understanding',
      inputSchema: z.object({
        content: z.string(),
        taxonomy: z.array(z.string()).optional(),
        multiLabel: z.boolean().optional()
      }),
      outputSchema: z.object({
        categories: z.array(z.string()),
        confidence: z.number(),
        reasoning: z.string(),
        subcategories: z.array(z.string()).optional()
      }),
      timeoutMs: 8000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 500,
        exponential: false,
        retryableErrors: ['classification-failed']
      },
      costEstimate: 'low'
    });
  }

  private registerCompareSources(): void {
    this.register({
      name: 'compare_sources',
      version: '1.0.0',
      description: 'Source comparison and gap analysis',
      category: 'understanding',
      inputSchema: z.object({
        sources: z.array(z.object({
          content: z.string(),
          metadata: z.record(z.any()).optional()
        })),
        comparisonCriteria: z.array(z.string()).optional()
      }),
      outputSchema: z.object({
        similarities: z.array(z.object({
          sources: z.array(z.number()),
          description: z.string(),
          confidence: z.number()
        })),
        differences: z.array(z.object({
          sources: z.array(z.number()),
          description: z.string(),
          significance: z.number()
        })),
        gaps: z.array(z.string()),
        summary: z.string()
      }),
      timeoutMs: 25000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 2000,
        exponential: false,
        retryableErrors: ['comparison-failed']
      },
      costEstimate: 'high'
    });
  }

  private registerQueryValidation(): void {
    this.register({
      name: 'query_validation',
      version: '1.0.0',
      description: 'SQL query validation and optimization',
      category: 'understanding',
      inputSchema: z.object({
        sql: z.string(),
        schema: z.record(z.any()),
        operation: z.enum(['select', 'insert', 'update', 'delete']).optional()
      }),
      outputSchema: z.object({
        valid: z.boolean(),
        issues: z.array(z.object({
          type: z.string(),
          message: z.string(),
          severity: z.enum(['error', 'warning', 'info'])
        })),
        optimized: z.string(),
        performance: z.object({
          estimatedTime: z.string(),
          complexity: z.string(),
          recommendations: z.array(z.string())
        })
      }),
      timeoutMs: 8000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 500,
        exponential: false,
        retryableErrors: ['parse-error']
      },
      costEstimate: 'low'
    });
  }

  // ============================================================================
  // CREATION SKILLS
  // ============================================================================

  private registerOutlineGenerate(): void {
    this.register({
      name: 'outline_generate',
      version: '1.0.0',
      description: 'Content structure and outline planning',
      category: 'creation',
      inputSchema: z.object({
        topic: z.string(),
        audience: z.string().optional(),
        length: z.enum(['short', 'medium', 'long']).optional(),
        style: z.string().optional()
      }),
      outputSchema: z.object({
        sections: z.array(z.object({
          title: z.string(),
          description: z.string(),
          keyPoints: z.array(z.string()),
          estimatedWords: z.number()
        })),
        totalWordCount: z.number(),
        structure: z.string()
      }),
      timeoutMs: 12000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 1000,
        exponential: false,
        retryableErrors: ['outline-failed']
      },
      costEstimate: 'medium'
    });
  }

  private registerContentOutlining(): void {
    this.register({
      name: 'content_outlining',
      version: '1.0.0',
      description: 'Detailed content outlining for SEO and structure',
      category: 'creation',
      inputSchema: z.object({
        topic: z.string(),
        targetKeywords: z.array(z.string()),
        audience: z.string().optional(),
        contentType: z.string().optional()
      }),
      outputSchema: z.object({
        structure: z.object({
          introduction: z.object({
            title: z.string(),
            wordCount: z.number(),
            keywords: z.array(z.string())
          }),
          body: z.array(z.object({
            title: z.string(),
            wordCount: z.number(),
            keywords: z.array(z.string()),
            subsections: z.array(z.string()).optional()
          })),
          conclusion: z.object({
            title: z.string(),
            wordCount: z.number(),
            keywords: z.array(z.string())
          })
        }),
        totalWordCount: z.number(),
        keywordDistribution: z.record(z.number()),
        seoRecommendations: z.array(z.string())
      }),
      timeoutMs: 15000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 1000,
        exponential: false,
        retryableErrors: ['outlining-failed']
      },
      costEstimate: 'medium'
    });
  }

  private registerRewriteWithConstraints(): void {
    this.register({
      name: 'rewrite_with_constraints',
      version: '1.0.0',
      description: 'Content rewriting with tone and style constraints',
      category: 'creation',
      inputSchema: z.object({
        content: z.string(),
        constraints: z.object({
          tone: z.array(z.string()),
          style: z.string().optional(),
          length: z.enum(['shorter', 'same', 'longer']).optional(),
          bannedWords: z.array(z.string()).optional()
        })
      }),
      outputSchema: z.object({
        rewritten: z.string(),
        changes: z.array(z.object({
          type: z.string(),
          description: z.string(),
          impact: z.string()
        })),
        constraintCompliance: z.record(z.boolean()),
        qualityScore: z.number()
      }),
      timeoutMs: 18000,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1500,
        exponential: true,
        retryableErrors: ['rewrite-failed', 'constraint-violation']
      },
      costEstimate: 'medium'
    });
  }

  private registerPersonalizeContent(): void {
    this.register({
      name: 'personalize_content',
      version: '1.0.0',
      description: 'Audience-tailored content adaptation',
      category: 'creation',
      inputSchema: z.object({
        content: z.string(),
        audience: z.object({
          demographics: z.record(z.any()),
          preferences: z.array(z.string()),
          context: z.record(z.any())
        })
      }),
      outputSchema: z.object({
        personalized: z.string(),
        adaptations: z.array(z.object({
          type: z.string(),
          original: z.string(),
          modified: z.string(),
          reason: z.string()
        })),
        relevanceScore: z.number(),
        engagementPrediction: z.number()
      }),
      timeoutMs: 15000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 1000,
        exponential: false,
        retryableErrors: ['personalization-failed']
      },
      costEstimate: 'medium'
    });
  }

  private registerGenerateVariants(): void {
    this.register({
      name: 'generate_variants',
      version: '1.0.0',
      description: 'Generate multiple content variants',
      category: 'creation',
      inputSchema: z.object({
        baseContent: z.string(),
        count: z.number().min(1).max(5),
        variationType: z.enum(['tone', 'length', 'style', 'angle']),
        constraints: z.record(z.any()).optional()
      }),
      outputSchema: z.object({
        variants: z.array(z.object({
          content: z.string(),
          variation: z.string(),
          score: z.number(),
          differences: z.array(z.string())
        })),
        baseMetrics: z.record(z.number()),
        recommendations: z.array(z.string())
      }),
      timeoutMs: 25000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 2000,
        exponential: false,
        retryableErrors: ['generation-failed']
      },
      costEstimate: 'high'
    });
  }

  // ============================================================================
  // ACTION SKILLS
  // ============================================================================

  private registerBrowserControl(): void {
    this.register({
      name: 'browser_control',
      version: '1.0.0',
      description: 'Safe browser automation and interaction',
      category: 'action',
      inputSchema: z.object({
        actions: z.array(z.object({
          type: z.enum(['navigate', 'click', 'type', 'wait', 'screenshot']),
          selector: z.string().optional(),
          value: z.string().optional(),
          timeout: z.number().optional()
        })),
        url: z.string().optional()
      }),
      outputSchema: z.object({
        success: z.boolean(),
        results: z.array(z.any()),
        screenshots: z.array(z.string()).optional(),
        errors: z.array(z.string()),
        finalUrl: z.string()
      }),
      timeoutMs: 60000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 3000,
        exponential: false,
        retryableErrors: ['element-not-found', 'timeout']
      },
      costEstimate: 'high',
      requiresPermissions: ['browser-access']
    });
  }

  private registerApiCall(): void {
    this.register({
      name: 'api_call',
      version: '1.0.0',
      description: 'Typed API interactions with validation',
      category: 'action',
      inputSchema: z.object({
        endpoint: z.string(),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
        headers: z.record(z.string()).optional(),
        body: z.any().optional(),
        timeout: z.number().optional()
      }),
      outputSchema: z.object({
        status: z.number(),
        success: z.boolean(),
        data: z.any(),
        headers: z.record(z.string()),
        latency: z.number(),
        rateLimited: z.boolean()
      }),
      timeoutMs: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponential: true,
        retryableErrors: ['timeout', 'rate-limit', 'server-error']
      },
      costEstimate: 'medium'
    });
  }

  private registerFileOperations(): void {
    this.register({
      name: 'file_operations',
      version: '1.0.0',
      description: 'Secure file I/O operations',
      category: 'action',
      inputSchema: z.object({
        operation: z.enum(['read', 'write', 'transform', 'delete', 'list']),
        path: z.string(),
        content: z.any().optional(),
        encoding: z.string().optional(),
        transform: z.record(z.any()).optional()
      }),
      outputSchema: z.object({
        success: z.boolean(),
        data: z.any(),
        metadata: z.record(z.any()),
        errors: z.array(z.string()),
        bytesProcessed: z.number()
      }),
      timeoutMs: 20000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 1000,
        exponential: false,
        retryableErrors: ['permission-denied', 'file-not-found']
      },
      costEstimate: 'low',
      requiresPermissions: ['file-access']
    });
  }

  private registerMessageDispatch(): void {
    this.register({
      name: 'message_dispatch',
      version: '1.0.0',
      description: 'Cross-platform message and notification dispatch',
      category: 'action',
      inputSchema: z.object({
        platform: z.enum(['email', 'slack', 'webhook', 'sms']),
        recipients: z.array(z.string()),
        content: z.object({
          subject: z.string().optional(),
          body: z.string(),
          attachments: z.array(z.any()).optional()
        }),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
      }),
      outputSchema: z.object({
        success: z.boolean(),
        messageId: z.string().optional(),
        deliveryStatus: z.record(z.string()),
        errors: z.array(z.string()),
        retryCount: z.number()
      }),
      timeoutMs: 25000,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 2000,
        exponential: true,
        retryableErrors: ['delivery-failed', 'rate-limit']
      },
      costEstimate: 'medium',
      requiresPermissions: ['message-send']
    });
  }

  // ============================================================================
  // CONTROL SKILLS
  // ============================================================================

  private registerSchemaValidate(): void {
    this.register({
      name: 'schema_validate',
      version: '1.0.0',
      description: 'Schema validation for inputs and outputs',
      category: 'control',
      inputSchema: z.object({
        data: z.any(),
        schema: z.record(z.any()),
        strict: z.boolean().optional()
      }),
      outputSchema: z.object({
        valid: z.boolean(),
        errors: z.array(z.object({
          path: z.string(),
          message: z.string(),
          code: z.string()
        })),
        warnings: z.array(z.string()),
        sanitized: z.any().optional()
      }),
      timeoutMs: 5000,
      retryPolicy: {
        maxRetries: 0,
        backoffMs: 0,
        exponential: false,
        retryableErrors: []
      },
      costEstimate: 'low'
    });
  }

  private registerBusinessRuleCheck(): void {
    this.register({
      name: 'business_rule_check',
      version: '1.0.0',
      description: 'Domain-specific business rule validation',
      category: 'control',
      inputSchema: z.object({
        data: z.any(),
        rules: z.array(z.object({
          name: z.string(),
          condition: z.string(),
          severity: z.enum(['warning', 'error', 'fatal'])
        })),
        context: z.record(z.any()).optional()
      }),
      outputSchema: z.object({
        passed: z.boolean(),
        violations: z.array(z.object({
          rule: z.string(),
          severity: z.string(),
          message: z.string(),
          data: z.any()
        })),
        compliance: z.record(z.boolean()),
        recommendations: z.array(z.string())
      }),
      timeoutMs: 8000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 500,
        exponential: false,
        retryableErrors: ['rule-evaluation-error']
      },
      costEstimate: 'low'
    });
  }

  private registerRepairOutput(): void {
    this.register({
      name: 'repair_output',
      version: '1.0.0',
      description: 'Automatic error correction and output repair',
      category: 'control',
      inputSchema: z.object({
        original: z.any(),
        errors: z.array(z.object({
          type: z.string(),
          path: z.string(),
          message: z.string()
        })),
        repairStrategy: z.enum(['auto', 'conservative', 'aggressive']).optional()
      }),
      outputSchema: z.object({
        repaired: z.any(),
        repairs: z.array(z.object({
          path: z.string(),
          original: z.any(),
          fixed: z.any(),
          strategy: z.string()
        })),
        confidence: z.number(),
        unrepairable: z.array(z.object({
          path: z.string(),
          reason: z.string()
        }))
      }),
      timeoutMs: 12000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 1000,
        exponential: false,
        retryableErrors: ['repair-failed']
      },
      costEstimate: 'medium'
    });
  }

  private registerHumanEscalation(): void {
    this.register({
      name: 'human_escalation',
      version: '1.0.0',
      description: 'Human review routing for low-confidence tasks',
      category: 'control',
      inputSchema: z.object({
        task: z.object({
          id: z.string(),
          type: z.string(),
          data: z.any()
        }),
        confidence: z.number(),
        reason: z.string(),
        urgency: z.enum(['low', 'medium', 'high', 'critical']).optional()
      }),
      outputSchema: z.object({
        escalated: z.boolean(),
        escalationId: z.string().optional(),
        assignedTo: z.string().optional(),
        estimatedResponse: z.string().optional(),
        instructions: z.string(),
        fallbackAction: z.string().optional()
      }),
      timeoutMs: 10000,
      retryPolicy: {
        maxRetries: 0,
        backoffMs: 0,
        exponential: false,
        retryableErrors: []
      },
      costEstimate: 'low',
      requiresPermissions: ['human-escalation']
    });
  }

  private registerSEOOptimization(): void {
    this.register({
      name: 'seo_optimization',
      version: '1.0.0',
      description: 'SEO content optimization and analysis',
      category: 'control',
      inputSchema: z.object({
        content: z.string(),
        targetKeywords: z.array(z.string()),
        title: z.string().optional(),
        metaDescription: z.string().optional()
      }),
      outputSchema: z.object({
        keywordDensity: z.record(z.number()),
        issues: z.array(z.string()),
        suggestions: z.array(z.string()),
        score: z.number(),
        optimizations: z.object({
          titleOptimized: z.boolean(),
          headingsOptimized: z.boolean(),
          metaOptimized: z.boolean(),
          contentOptimized: z.boolean()
        })
      }),
      timeoutMs: 10000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 500,
        exponential: false,
        retryableErrors: ['analysis-failed']
      },
      costEstimate: 'low'
    });
  }

  // ============================================================================
  // MEMORY SKILLS
  // ============================================================================

  private registerMemoryRecall(): void {
    this.register({
      name: 'memory_recall',
      version: '1.0.0',
      description: 'Context and history retrieval',
      category: 'memory',
      inputSchema: z.object({
        query: z.string(),
        context: z.record(z.any()),
        limit: z.number().optional(),
        relevanceThreshold: z.number().optional()
      }),
      outputSchema: z.object({
        memories: z.array(z.object({
          id: z.string(),
          content: z.any(),
          relevance: z.number(),
          timestamp: z.string(),
          source: z.string()
        })),
        totalFound: z.number(),
        searchTime: z.number()
      }),
      timeoutMs: 8000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 500,
        exponential: false,
        retryableErrors: ['memory-access-error']
      },
      costEstimate: 'low'
    });
  }

  private registerEntityTracking(): void {
    this.register({
      name: 'entity_tracking',
      version: '1.0.0',
      description: 'Named entity persistence and relationship tracking',
      category: 'memory',
      inputSchema: z.object({
        entities: z.array(z.object({
          name: z.string(),
          type: z.string(),
          properties: z.record(z.any())
        })),
        operation: z.enum(['store', 'update', 'query', 'link'])
      }),
      outputSchema: z.object({
        success: z.boolean(),
        entities: z.array(z.object({
          id: z.string(),
          name: z.string(),
          relationships: z.array(z.string()),
          lastUpdated: z.string()
        })),
        conflicts: z.array(z.object({
          entity: z.string(),
          reason: z.string()
        }))
      }),
      timeoutMs: 10000,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        exponential: true,
        retryableErrors: ['entity-conflict']
      },
      costEstimate: 'medium'
    });
  }

  private registerPreferenceLearning(): void {
    this.register({
      name: 'preference_learning',
      version: '1.0.0',
      description: 'User pattern recognition and preference inference',
      category: 'memory',
      inputSchema: z.object({
        interactions: z.array(z.object({
          action: z.string(),
          context: z.record(z.any()),
          outcome: z.any(),
          timestamp: z.string()
        })),
        userId: z.string().optional()
      }),
      outputSchema: z.object({
        preferences: z.record(z.any()),
        patterns: z.array(z.object({
          pattern: z.string(),
          confidence: z.number(),
          examples: z.array(z.any())
        })),
        recommendations: z.array(z.string()),
        confidence: z.number()
      }),
      timeoutMs: 15000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 2000,
        exponential: false,
        retryableErrors: ['pattern-learning-failed']
      },
      costEstimate: 'medium'
    });
  }

  private registerCacheManagement(): void {
    this.register({
      name: 'cache_management',
      version: '1.0.0',
      description: 'Intelligent result caching and invalidation',
      category: 'memory',
      inputSchema: z.object({
        operation: z.enum(['store', 'retrieve', 'invalidate', 'clear']),
        key: z.string(),
        data: z.any().optional(),
        ttl: z.number().optional(),
        tags: z.array(z.string()).optional()
      }),
      outputSchema: z.object({
        success: z.boolean(),
        data: z.any(),
        metadata: z.object({
          hit: z.boolean(),
          age: z.number().optional(),
          expires: z.string().optional(),
          tags: z.array(z.string())
        }),
        cacheStats: z.record(z.number())
      }),
      timeoutMs: 5000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 200,
        exponential: false,
        retryableErrors: ['cache-error']
      },
      costEstimate: 'low'
    });
  }

  // ============================================================================
  // OBSERVABILITY SKILLS
  // ============================================================================

  private registerTraceLog(): void {
    this.register({
      name: 'trace_log',
      version: '1.0.0',
      description: 'Structured event logging and tracing',
      category: 'observability',
      inputSchema: z.object({
        event: z.object({
          type: z.string(),
          data: z.any(),
          level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
          tags: z.array(z.string()).optional()
        }),
        context: z.record(z.any())
      }),
      outputSchema: z.object({
        logged: z.boolean(),
        traceId: z.string(),
        correlationId: z.string(),
        timestamp: z.string(),
        searchable: z.boolean()
      }),
      timeoutMs: 3000,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 100,
        exponential: true,
        retryableErrors: ['logging-failed']
      },
      costEstimate: 'low'
    });
  }

  private registerPerformanceMonitor(): void {
    this.register({
      name: 'performance_monitor',
      version: '1.0.0',
      description: 'Latency, cost, and resource usage tracking',
      category: 'observability',
      inputSchema: z.object({
        operation: z.string(),
        startTime: z.string(),
        endTime: z.string().optional(),
        metrics: z.record(z.any()),
        thresholds: z.record(z.number()).optional()
      }),
      outputSchema: z.object({
        duration: z.number(),
        cost: z.number(),
        resources: z.record(z.number()),
        violations: z.array(z.object({
          metric: z.string(),
          threshold: z.number(),
          actual: z.number(),
          severity: z.string()
        })),
        recommendations: z.array(z.string())
      }),
      timeoutMs: 2000,
      retryPolicy: {
        maxRetries: 0,
        backoffMs: 0,
        exponential: false,
        retryableErrors: []
      },
      costEstimate: 'low'
    });
  }

  private registerConfidenceScore(): void {
    this.register({
      name: 'confidence_score',
      version: '1.0.0',
      description: 'Calibrated uncertainty measurement and thresholds',
      category: 'observability',
      inputSchema: z.object({
        result: z.any(),
        context: z.record(z.any()),
        calibrationData: z.array(z.object({
          input: z.any(),
          expected: z.any(),
          actual: z.any()
        })).optional()
      }),
      outputSchema: z.object({
        confidence: z.number(),
        factors: z.array(z.object({
          factor: z.string(),
          weight: z.number(),
          value: z.number()
        })),
        thresholds: z.object({
          low: z.number(),
          medium: z.number(),
          high: z.number()
        }),
        recommendations: z.array(z.string())
      }),
      timeoutMs: 8000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 500,
        exponential: false,
        retryableErrors: ['calibration-failed']
      },
      costEstimate: 'low'
    });
  }

  private registerAuditTrail(): void {
    this.register({
      name: 'audit_trail',
      version: '1.0.0',
      description: 'Compliance and debugging audit trails',
      category: 'observability',
      inputSchema: z.object({
        operation: z.string(),
        user: z.string().optional(),
        data: z.any(),
        compliance: z.array(z.string()).optional(),
        retention: z.string().optional()
      }),
      outputSchema: z.object({
        auditId: z.string(),
        recorded: z.boolean(),
        compliance: z.record(z.boolean()),
        retention: z.string(),
        searchable: z.boolean(),
        encrypted: z.boolean()
      }),
      timeoutMs: 5000,
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponential: true,
        retryableErrors: ['audit-failed', 'storage-error']
      },
      costEstimate: 'low',
      requiresPermissions: ['audit-write']
    });
  }
}

// Export singleton instance
export const sharedSkillsRegistry = new SharedSkillsRegistry();
export default sharedSkillsRegistry;