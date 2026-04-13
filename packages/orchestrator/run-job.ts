// packages/orchestrator/run-job.ts - Main orchestration logic
import { nanoid } from 'nanoid';
import { MemoryRouter } from '../memory/memory-router';
import { skillRegistry } from './skill-registry';
import { AgentEnvelope } from '../schemas/shared-envelope';
import { inMemoryStore } from '../memory/request-memory';
import { skillInjector } from './skill-injection';
import { executionTracer } from './execution-tracer';
import { stateStore } from './state-store';
import { AgentFactory } from '../agents/agent-factory';
import { PublishGate } from './publish-gate';

export interface JobRequest {
  adInputType: 'image_url' | 'copy';
  adInputValue: string;
  targetUrl: string;
  audienceOverride?: string;
  userGoal?: string;
}

export interface JobResult {
  success: boolean;
  spec?: any;
  validation?: any;
  qualityScore?: number;
  debug?: any;
  error?: string;
  status?: string;
  gateStatus?: 'passed' | 'blocked' | 'warning';
  blockedSkills?: string[];
  publishable?: boolean;
  runMode?: string;
  message?: string;
  fallbackCount?: number;
}

export class JobOrchestrator {
  private memoryRouter: MemoryRouter;
  private currentRequestId: string = '';
  private previousOutputs: Map<string, any> = new Map();
  private publishGate: PublishGate;

  constructor() {
    this.memoryRouter = new MemoryRouter(inMemoryStore);
    this.publishGate = new PublishGate();
  }

  /**
   * Execute the complete landing page generation workflow
   */
  async executeJob(request: JobRequest): Promise<JobResult> {
    const requestId = nanoid();
    const runId = nanoid();

    console.log(`🚀 [${requestId}] Starting landing page generation job`);
    console.log(`📝 Input: ${request.adInputType} - ${request.targetUrl}`);

    // Start execution tracing
    const traceId = executionTracer.startJobTrace(requestId, request);

    // Create job state
    const jobId = stateStore.createJob(request);

    try {
      // Phase 1: Initialize job state
      await this.initializeJobState(requestId, request);

      // Phase 2: Execute agent pipeline
      const result = await this.executeAgentPipeline(requestId, runId, traceId, request);

      // Apply publish gate validation
      const gatedResult = this.publishGate.applyPublishGate(result);

      // Complete tracing
      executionTracer.completeJobTrace(traceId, gatedResult.spec ? { output: gatedResult.spec } as any : undefined);

      // Update job status
      const finalStatus = gatedResult.publishable && gatedResult.success ? 'completed' : 'failed';
      stateStore.updateJobStatus(jobId, finalStatus, gatedResult.message);

      if (finalStatus === 'completed') {
        console.log(`✅ [${requestId}] Job completed - ${gatedResult.gateStatus}`);
      } else {
        console.log(`❌ [${requestId}] Job failed - gate blocked`);
      }
      return gatedResult;

    } catch (error) {
      console.error(`❌ [${requestId}] Job failed:`, error);

      // Complete tracing with error
      executionTracer.completeJobTrace(traceId);

      // Update job status
      stateStore.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        gateStatus: 'blocked',
        blockedSkills: ['system_error'],
        publishable: false,
        fallbackCount: 0
      };
    }
  }

  /**
   * Initialize job state in memory
   */
  private async initializeJobState(requestId: string, request: JobRequest) {
    await this.memoryRouter.storeMemory(
      'orchestrator',
      { type: 'request', request: requestId },
      {
        request,
        status: 'initializing',
        startTime: new Date().toISOString()
      },
      `Job ${requestId} initialized`,
      ['job-init', 'request'],
      1.0
    );
  }

  /**
   * Execute the complete agent pipeline
   */
  private async executeAgentPipeline(
    requestId: string,
    runId: string,
    traceId: string,
    request: JobRequest
  ): Promise<JobResult> {
    // Set instance variables for agent execution
    this.currentRequestId = requestId;
    this.previousOutputs = new Map();

    // Simplified pipeline - just 5 core agents for landing page generation
    const pipeline = [
      { name: 'ad-analyzer', depends: [] },
      { name: 'url-brand-analyzer', depends: [] },
      { name: 'page-strategy', depends: ['ad-analyzer', 'url-brand-analyzer'] },
      { name: 'copy-generator', depends: ['page-strategy', 'url-brand-analyzer'] },
      { name: 'design-token-agent', depends: ['url-brand-analyzer'] },
      { name: 'component-renderer', depends: ['copy-generator', 'design-token-agent', 'url-brand-analyzer'] }
    ];

    const results: Map<string, any> = new Map();
    const agentRuns: Map<string, AgentEnvelope> = new Map();

    // Execute pipeline steps
    for (const step of pipeline) {
      try {
        // Check dependencies
        const depsMet = step.depends.every(dep => results.has(dep));
        if (!depsMet) {
          throw new Error(`Dependencies not met for ${step.name}: ${step.depends.join(', ')}`);
        }

        console.log(`🔄 [${requestId}] Executing ${step.name}`);

        // Execute agent
        const result = await this.executeAgent(
          step.name,
          requestId,
          runId,
          traceId,
          request,
          results
        );

        // 🔒 HARD GATE: Validate brand immediately after url-brand-analyzer completes
        if (step.name === 'url-brand-analyzer') {
          const brandName = result.output?.brand_name || result.output?.name || '';
          const blocked = ['business name', 'brand name', 'company name', ''];
          if (blocked.includes(brandName.toLowerCase().trim()) || !brandName) {
            throw new Error(`Brand validation FAILED: placeholder brand "${brandName || '(empty)'}" - aborting pipeline`);
          }
          console.log(`✅ [${requestId}] Brand validated: ${brandName}`);
        }

        results.set(step.name, result.output);
        agentRuns.set(step.name, result);

        // Store in previous outputs for dependent agents
        this.previousOutputs.set(step.name, result.output);

        // Store agent result in memory
        await this.memoryRouter.storeMemory(
          'orchestrator',
          { type: 'request', request: requestId },
          { agent: step.name, result: result.output },
          `${step.name} completed`,
          ['agent-result', step.name],
          result.confidence
        );

      } catch (error) {
        console.error(`❌ [${requestId}] Agent ${step.name} failed:`, error);

        // If critical agent fails, abort
        throw error;
      }
    }

    // Compile final result
    const spec = this.compileFinalSpec(results);
    const validation = results.get('qa-validator');

    // 🔒 VALIDATION GATE: Check spec for template leaks BEFORE returning
    const validationResult = this.validateCompiledSpec(spec);
    
    console.log(`🔍 [${requestId}] Spec validation:`, validationResult.isValid ? 'PASSED' : 'FAILED');
    
    if (validationResult.isFatal) {
      console.error(`❌ [${requestId}] FATAL validation errors:`, validationResult.errors.join('; '));
      // Return failure instead of success
      return {
        success: false,
        spec,
        error: `Validation failed: ${validationResult.errors.join('; ')}`,
        validation: { issues: validationResult.errors.map(e => ({ code: 'VALIDATION_ERROR', message: e, severity: 'fatal' })) },
        qualityScore: 0,
        debug: {
          requestId,
          agentRuns: Object.fromEntries(agentRuns),
          pipeline: pipeline.map(s => s.name),
          validationErrors: validationResult.errors
        }
      };
    }

    return {
      success: validationResult.isValid, // Force failure if validation has warnings
      spec,
      validation: { issues: validationResult.errors.map(e => ({ code: 'VALIDATION_WARNING', message: e, severity: 'warning' })) },
      qualityScore: validationResult.isValid ? 85 : 50,
      debug: {
        requestId,
        agentRuns: Object.fromEntries(agentRuns),
        pipeline: pipeline.map(s => s.name)
      }
    };
  }

  /**
   * Execute individual agent
   */
  private async executeAgent(
    agentName: string,
    requestId: string,
    runId: string,
    traceId: string,
    request: JobRequest,
    previousResults: Map<string, any>
  ): Promise<AgentEnvelope> {

    const agentSpanId = executionTracer.startAgentSpan(traceId, agentName, runId, 'start');

    try {
      // Get agent skills and memory policy
      const agentSkills = skillRegistry.getAgentSkills(agentName);
      if (!agentSkills) {
        throw new Error(`No skill registry found for agent: ${agentName}`);
      }

      // Inject skills for the agent
      executionTracer.endAgentSpan(agentSpanId, traceId, agentName, runId);
      const skillSpanId = executionTracer.startAgentSpan(traceId, agentName, runId, 'skill-injection');

      const skillContext = await skillInjector.injectSkills(agentName, requestId);
      executionTracer.endAgentSpan(skillSpanId, traceId, agentName, runId, {
        skills_injected: skillContext.tools.size
      });

      // Get relevant memory
      const memorySpanId = executionTracer.startAgentSpan(traceId, agentName, runId, 'memory-read');
      const memoryItems = await this.memoryRouter.getRelevantMemory(
        agentName,
        requestId,
        {
          read_scopes: agentSkills.mandatory_skills.map(() => 'request'), // Simplified
          write_scopes: ['request'],
          retrieval_mode: 'selective'
        }
      );
      executionTracer.traceMemoryOperation(traceId, agentName, runId, 'read', memoryItems.map(m => m.memory_id), 'request');
      executionTracer.endAgentSpan(memorySpanId, traceId, agentName, runId, {
        memory_items: memoryItems.length
      });

      // Prepare agent input
      const agentInput = this.prepareAgentInput(agentName, request, previousResults);

      // Execute agent using factory
      const executionSpanId = executionTracer.startAgentSpan(traceId, agentName, runId, 'execution');
      const agent = AgentFactory.getAgent(agentName);
      if (!agent) {
        throw new Error(`Agent ${agentName} not found in factory`);
      }

      const executionContext = {
        requestId: this.currentRequestId,
        runId,
        traceId,
        input: agentInput,
        previousOutputs: this.previousOutputs
      };

      const agentEnvelope = await agent.execute(executionContext);
      const result = {
        success: agentEnvelope.status !== 'failed',
        confidence: agentEnvelope.confidence || 0.8,
        skills_used: agentEnvelope.skills_used,
        output: agentEnvelope.output
      };
      executionTracer.endAgentSpan(executionSpanId, traceId, agentName, runId);

      // Validate and create envelope
      const validatedEnvelope = skillInjector.createEnvelopeWithSkillValidation({
        agent_name: agentName,
        agent_version: '1.0.0',
        request_id: requestId,
        run_id: runId,
        timestamp: new Date().toISOString(),
        status: 'success',
        skills_required: agentSkills.mandatory_skills,
        memory_policy: {
          read_scopes: ['request'],
          write_scopes: ['request'],
          retrieval_mode: 'selective'
        },
        memory_reads: memoryItems.map(m => m.memory_id),
        memory_writes: [],
        input_refs: [],
        output: result.output || result
      }, skillContext);

      // Trace envelope validation
      executionTracer.traceEnvelopeValidation(traceId, agentName, runId, validatedEnvelope, validatedEnvelope.status !== 'failed');

      return validatedEnvelope;

    } catch (error) {
      executionTracer.endAgentSpan(agentSpanId, traceId, agentName, runId, undefined, error.message);
      throw error;
    }
  }

  /**
   * Prepare input for specific agent
   */
  private prepareAgentInput(agentName: string, request: JobRequest, previousResults: Map<string, any>) {
    switch (agentName) {
      case 'ad-analyzer':
        return {
          adInputType: request.adInputType,
          adInputValue: request.adInputValue,
          audienceOverride: request.audienceOverride
        };

      case 'url-brand-analyzer':
        return {
          url: request.targetUrl
        };

      case 'audience-intent':
        return {
          adAnalysis: previousResults.get('ad-analyzer'),
          urlAnalysis: previousResults.get('url-brand-analyzer')
        };

      case 'page-strategy':
        return {
          adAnalysis: previousResults.get('ad-analyzer'),
          urlAnalysis: previousResults.get('url-brand-analyzer'),
          audienceAnalysis: previousResults.get('audience-intent')
        };

      case 'copy-generator':
        return {
          strategy: previousResults.get('page-strategy'),
          sourceFacts: previousResults.get('url-brand-analyzer')
        };

      case 'offer-proof-guard':
        return {
          copy: previousResults.get('copy-generator'),
          sourceFacts: previousResults.get('url-brand-analyzer')
        };

      case 'design-token-agent':
        return {
          brandData: previousResults.get('url-brand-analyzer')
        };

      case 'component-plan-agent':
        return {
          strategy: previousResults.get('page-strategy'),
          copy: previousResults.get('copy-generator'),
          tokens: previousResults.get('design-token-agent')
        };

      case 'qa-validator':
        return {
          spec: previousResults.get('component-plan-agent'),
          adAnalysis: previousResults.get('ad-analyzer'),
          urlAnalysis: previousResults.get('url-brand-analyzer')
        };

      case 'repair-agent':
        return {
          qa_results: previousResults.get('qa-validator'),
          original_spec: previousResults.get('component-plan-agent'),
          source_data: {
            ad_analysis: previousResults.get('ad-analyzer'),
            brand_analysis: previousResults.get('url-brand-analyzer'),
            audience_analysis: previousResults.get('audience-intent'),
            strategy: previousResults.get('page-strategy'),
            copy: previousResults.get('copy-generator')
          }
        };

      case 'component-renderer':
        return {
          component_plan: {
            copy: previousResults.get('copy-generator'),
            components: ['hero', 'services', 'booking', 'cta']
          },
          design_tokens: previousResults.get('design-token-agent'),
          brand_data: previousResults.get('url-brand-analyzer')
        };

      case 'integration-agent':
        return {
          rendered_components: previousResults.get('component-renderer'),
          page_layout: previousResults.get('component-renderer')?.page_layout,
          metadata: previousResults.get('component-renderer')?.metadata,
          project_structure: {} // Would be populated with actual project structure
        };

      case 'deployment-prep-agent':
        return {
          integration_result: previousResults.get('integration-agent'),
          performance_requirements: {
            lighthouse_score: 90,
            core_web_vitals: true,
            accessibility_score: 85
          },
          deployment_target: 'vercel'
        };

      case 'performance-monitoring-agent':
        return {
          deployment_config: previousResults.get('deployment-prep-agent')?.deployment_config,
          application_structure: previousResults.get('integration-agent')?.files_created,
          performance_requirements: {
            lighthouse_score: 90,
            core_web_vitals: true,
            real_user_monitoring: true
          }
        };

      case 'error-tracking-agent':
        return {
          deployment_config: previousResults.get('deployment-prep-agent')?.deployment_config,
          application_structure: previousResults.get('integration-agent')?.files_created,
          error_handling_requirements: {
            error_tracking: true,
            alerting: true,
            logging: true
          }
        };

      case 'analytics-integration-agent':
        return {
          deployment_config: previousResults.get('deployment-prep-agent')?.deployment_config,
          application_structure: previousResults.get('integration-agent')?.files_created,
          conversion_goals: previousResults.get('page-strategy')?.must_include || [],
          audience_segments: previousResults.get('audience-intent')?.primary_persona ? [previousResults.get('audience-intent').primary_persona] : []
        };

      case 'health-check-agent':
        return {
          deployment_config: previousResults.get('deployment-prep-agent')?.deployment_config,
          application_structure: previousResults.get('integration-agent')?.files_created,
          monitoring_requirements: {
            uptime_monitoring: true,
            health_checks: true,
            automated_reporting: true
          }
        };

      case 'end-to-end-testing-agent':
        return {
          pipeline_results: this.previousOutputs,
          deployment_info: previousResults.get('deployment-prep-agent'),
          test_requirements: {
            coverage_threshold: 95,
            performance_baseline: 90,
            accessibility_standard: 'WCAG_AA'
          }
        };

      case 'performance-testing-agent':
        return {
          application_url: 'https://generated-app.vercel.app', // Would be actual deployed URL
          deployment_info: previousResults.get('deployment-prep-agent')?.deployment_config,
          performance_requirements: {
            lighthouse_score: 90,
            core_web_vitals: true,
            concurrent_users: 1000
          },
          test_scenarios: [
            { name: 'light_load', users: 10, duration: 60 },
            { name: 'medium_load', users: 50, duration: 120 },
            { name: 'heavy_load', users: 200, duration: 180 }
          ]
        };

      case 'accessibility-testing-agent':
        return {
          application_url: 'https://generated-app.vercel.app',
          component_structure: previousResults.get('component-plan-agent'),
          accessibility_requirements: {
            wcag_level: 'AA',
            automated_testing: true,
            manual_review_required: false
          }
        };

      case 'integration-testing-agent':
        return {
          application_structure: previousResults.get('integration-agent')?.files_created,
          external_dependencies: [
            { name: 'vercel', type: 'hosting', required: true },
            { name: 'analytics', type: 'external_service', required: false }
          ],
          api_endpoints: [
            { url: '/api/health', method: 'GET', required: true },
            { url: '/api/analytics', method: 'POST', required: false }
          ],
          data_flow_requirements: {
            input_validation: true,
            output_transformation: true,
            error_handling: true
          }
        };

      case 'ab-testing-agent':
        return {
          application_structure: previousResults.get('integration-agent')?.files_created,
          conversion_goals: previousResults.get('page-strategy')?.must_include || [],
          audience_segments: previousResults.get('audience-intent')?.primary_persona ? [previousResults.get('audience-intent').primary_persona] : [],
          performance_baseline: previousResults.get('performance-monitoring-agent')?.monitoring_setup || {}
        };

      case 'performance-optimization-agent':
        return {
          application_structure: previousResults.get('integration-agent')?.files_created,
          performance_metrics: previousResults.get('performance-testing-agent')?.load_test_results || {},
          deployment_config: previousResults.get('deployment-prep-agent')?.deployment_config,
          optimization_requirements: {
            lighthouse_score_target: 90,
            core_web_vitals_compliance: true,
            bundle_size_limit_kb: 500
          }
        };

      case 'scaling-agent':
        return {
          performance_metrics: previousResults.get('performance-testing-agent')?.load_test_results || {},
          usage_patterns: previousResults.get('analytics-integration-agent')?.conversion_tracking || {},
          deployment_config: previousResults.get('deployment-prep-agent')?.deployment_config,
          infrastructure_limits: {
            max_instances: 10,
            max_memory_gb: 32,
            max_cpu_cores: 8
          }
        };

      case 'feature-flag-agent':
        return {
          application_structure: previousResults.get('integration-agent')?.files_created,
          user_segments: previousResults.get('audience-intent')?.primary_persona ? [previousResults.get('audience-intent').primary_persona] : [],
          rollout_requirements: {
            gradual_rollout: true,
            risk_mitigation: true,
            monitoring_required: true
          },
          risk_assessment: {
            business_impact: 'medium',
            technical_complexity: 'low',
            rollback_difficulty: 'easy'
          }
        };

      case 'production-deployment-agent':
        return {
          deployment_config: previousResults.get('deployment-prep-agent')?.deployment_config,
          integration_result: previousResults.get('integration-agent'),
          testing_results: {
            end_to_end: previousResults.get('end-to-end-testing-agent'),
            performance: previousResults.get('performance-testing-agent'),
            accessibility: previousResults.get('accessibility-testing-agent'),
            integration: previousResults.get('integration-testing-agent')
          },
          optimization_results: {
            ab_testing: previousResults.get('ab-testing-agent'),
            performance: previousResults.get('performance-optimization-agent'),
            scaling: previousResults.get('scaling-agent'),
            feature_flags: previousResults.get('feature-flag-agent')
          },
          environment_requirements: {
            security_level: 'enterprise',
            compliance_requirements: ['gdpr', 'soc2'],
            performance_targets: { lighthouse: 90, uptime: 99.9 }
          }
        };

      case 'operations-management-agent':
        return {
          deployment_result: previousResults.get('production-deployment-agent')?.deployment_execution,
          monitoring_setup: previousResults.get('performance-monitoring-agent')?.monitoring_setup,
          performance_baselines: previousResults.get('performance-optimization-agent')?.performance_optimizations,
          operational_requirements: {
            support_hours: '24_7',
            incident_response_time: '15_minutes',
            maintenance_windows: 'scheduled'
          }
        };

      case 'documentation-generation-agent':
        return {
          project_structure: previousResults.get('integration-agent')?.files_created,
          agent_outputs: this.previousOutputs, // All previous agent results
          deployment_result: previousResults.get('production-deployment-agent'),
          operational_setup: previousResults.get('operations-management-agent')
        };

      case 'handover-preparation-agent':
        return {
          project_details: {
            name: 'AI-Powered Landing Page Generation System',
            version: '1.0.0',
            scope: 'Complete landing page generation and optimization platform'
          },
          team_structure: {
            engineering: 5,
            devops: 2,
            product: 2,
            qa: 2,
            total_team_size: 11
          },
          access_requirements: {
            admin_access: ['engineering_lead', 'devops_lead'],
            read_access: ['all_team_members'],
            emergency_access: ['on_call_engineer']
          },
          timeline_constraints: {
            handover_duration: '8_weeks',
            knowledge_transfer_sessions: 12,
            go_live_date: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        };

      default:
        return {};
    }
  }



  /**
   * Calculate quality score based on validation results
   */
  private calculateQualityScore(validation: any): number {
    let score = 100;

    if (validation?.issues) {
      validation.issues.forEach((issue: any) => {
        switch (issue.severity) {
          case 'high': score -= 15; break;
          case 'medium': score -= 8; break;
          case 'low': score -= 3; break;
        }
      });
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Compile final landing page spec
   */
  private compileFinalSpec(results: Map<string, any>): any {
    const copy = results.get('copy-generator');
    const tokens = results.get('design-token-agent');
    const plan = results.get('component-plan-agent');

    return {
      brand: results.get('url-brand-analyzer')?.brand_name || 'Brand',
      audience: results.get('audience-intent')?.primary_persona || 'consumer',
      hero: copy?.hero,
      stats: copy?.stats,
      benefits: copy?.benefits,
      testimonials: [], // Will be added
      faq: copy?.faq,
      designTokens: tokens,
      componentPlan: plan
    };
  }

  /**
   * Validate compiled spec for template leaks and quality issues
   */
  private validateCompiledSpec(spec: any): { 
    isValid: boolean; 
    isFatal: boolean;
    errors: string[];
  } {
    // Import validation functions
    const { scanForLeaks, hasTemplateLeak } = require('./validator');
    
    const errors: string[] = [];
    
    // Check brand name
    if (!spec?.brand || typeof spec.brand !== 'string') {
      errors.push('Missing brand name');
    } else if (hasTemplateLeak(spec.brand)) {
      errors.push(`Brand name is template placeholder: "${spec.brand}"`);
    }
    
    // Check hero
    if (spec?.hero) {
      if (hasTemplateLeak(spec.hero.headline)) {
        errors.push(`Hero headline is template: "${spec.hero.headline?.substring(0, 30)}"`);
      }
      if (spec.hero.subheadline?.includes('```')) {
        errors.push('Hero subheadline contains code fence');
      }
    }
    
    // Check benefits
    if (!spec?.benefits || spec.benefits.length < 2) {
      errors.push('Too few benefits (need at least 2)');
    }
    
    // Check for any leaks in the entire spec
    const leakIssues = scanForLeaks(spec, 'spec');
    for (const issue of leakIssues) {
      if (issue.severity === 'fatal') {
        errors.push(issue.message);
      }
    }
    
    const hasFatal = errors.some(e => 
      e.includes('template') || 
      e.includes('code fence') ||
      e.includes('placeholder')
    );
    
    return {
      isValid: errors.length === 0,
      isFatal: hasFatal,
      errors,
    };
  }


}

// Export singleton instance
export const jobOrchestrator = new JobOrchestrator();