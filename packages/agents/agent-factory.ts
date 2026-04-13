// packages/agents/agent-factory.ts
import { BaseAgent } from './base-agent';
import { AdAnalyzerAgent, AdAnalyzerInput } from './ad-analyzer';
import { UrlBrandAnalyzerAgent, UrlBrandAnalyzerInput } from './url-brand-analyzer';
import { AudienceIntentAgent, AudienceIntentInput } from './audience-intent';

import { PageStrategyAgent, PageStrategyInput } from './page-strategy';
import { CopyGeneratorAgent, CopyGeneratorInput } from './copy-generator';
import { OfferProofGuardAgent, OfferProofGuardInput } from './offer-proof-guard';
import { DesignTokenAgent, DesignTokenInput } from './design-token-agent';
import { ComponentPlanAgent, ComponentPlanInput } from './component-plan-agent';
import { QAValidatorAgent, QAValidatorInput } from './qa-validator';
import { RepairAgent, RepairAgentInput } from './repair-agent';
import { ComponentRendererAgent, ComponentRendererInput } from './component-renderer';
import { IntegrationAgent, IntegrationAgentInput } from './integration-agent';
import { DeploymentPrepAgent, DeploymentPrepAgentInput } from './deployment-prep-agent';
import { PerformanceMonitoringAgent, PerformanceMonitoringAgentInput } from './performance-monitoring-agent';
import { ErrorTrackingAgent, ErrorTrackingAgentInput } from './error-tracking-agent';
import { AnalyticsIntegrationAgent, AnalyticsIntegrationAgentInput } from './analytics-integration-agent';
import { HealthCheckAgent, HealthCheckAgentInput } from './health-check-agent';
import { EndToEndTestingAgent, EndToEndTestingAgentInput } from './end-to-end-testing-agent';
import { PerformanceTestingAgent, PerformanceTestingAgentInput } from './performance-testing-agent';
import { AccessibilityTestingAgent, AccessibilityTestingAgentInput } from './accessibility-testing-agent';
import { IntegrationTestingAgent, IntegrationTestingAgentInput } from './integration-testing-agent';
import { ABTestingAgent, ABTestingAgentInput } from './ab-testing-agent';
import { PerformanceOptimizationAgent, PerformanceOptimizationAgentInput } from './performance-optimization-agent';
import { ScalingAgent, ScalingAgentInput } from './scaling-agent';
import { FeatureFlagAgent, FeatureFlagAgentInput } from './feature-flag-agent';
import { ProductionDeploymentAgent, ProductionDeploymentAgentInput } from './production-deployment-agent';
import { OperationsManagementAgent, OperationsManagementAgentInput } from './operations-management-agent';
import { DocumentationGenerationAgent, DocumentationGenerationAgentInput } from './documentation-generation-agent';
import { HandoverPreparationAgent, HandoverPreparationAgentInput } from './handover-preparation-agent';

// Type definitions for agent inputs and outputs
export type AgentInput =
  | AdAnalyzerInput
  | UrlBrandAnalyzerInput
  | AudienceIntentInput
  | PageStrategyInput
  | CopyGeneratorInput
  | OfferProofGuardInput
  | DesignTokenInput
  | ComponentPlanInput
  | QAValidatorInput
  | RepairAgentInput
  | ComponentRendererInput
  | IntegrationAgentInput
  | DeploymentPrepAgentInput
  | PerformanceMonitoringAgentInput
  | ErrorTrackingAgentInput
  | AnalyticsIntegrationAgentInput
  | HealthCheckAgentInput
  | EndToEndTestingAgentInput
  | PerformanceTestingAgentInput
  | AccessibilityTestingAgentInput
  | IntegrationTestingAgentInput
  | ABTestingAgentInput
  | PerformanceOptimizationAgentInput
  | ScalingAgentInput
  | FeatureFlagAgentInput
  | ProductionDeploymentAgentInput
  | OperationsManagementAgentInput
  | DocumentationGenerationAgentInput
  | HandoverPreparationAgentInput;

export type AgentOutput =
  | ReturnType<AdAnalyzerAgent['executeCore']>
  | ReturnType<UrlBrandAnalyzerAgent['executeCore']>
  | ReturnType<AudienceIntentAgent['executeCore']>
  | ReturnType<PageStrategyAgent['executeCore']>
  | ReturnType<CopyGeneratorAgent['executeCore']>
  | ReturnType<OfferProofGuardAgent['executeCore']>
  | ReturnType<DesignTokenAgent['executeCore']>
  | ReturnType<ComponentPlanAgent['executeCore']>
  | ReturnType<QAValidatorAgent['executeCore']>
  | ReturnType<RepairAgent['executeCore']>
  | ReturnType<ComponentRendererAgent['executeCore']>
  | ReturnType<IntegrationAgent['executeCore']>
  | ReturnType<DeploymentPrepAgent['executeCore']>
  | ReturnType<PerformanceMonitoringAgent['executeCore']>
  | ReturnType<ErrorTrackingAgent['executeCore']>
  | ReturnType<AnalyticsIntegrationAgent['executeCore']>
  | ReturnType<HealthCheckAgent['executeCore']>
  | ReturnType<EndToEndTestingAgent['executeCore']>
  | ReturnType<PerformanceTestingAgent['executeCore']>
  | ReturnType<AccessibilityTestingAgent['executeCore']>
  | ReturnType<IntegrationTestingAgent['executeCore']>
  | ReturnType<ABTestingAgent['executeCore']>
  | ReturnType<PerformanceOptimizationAgent['executeCore']>
  | ReturnType<ScalingAgent['executeCore']>
  | ReturnType<FeatureFlagAgent['executeCore']>
  | ReturnType<ProductionDeploymentAgent['executeCore']>
  | ReturnType<OperationsManagementAgent['executeCore']>
  | ReturnType<DocumentationGenerationAgent['executeCore']>
  | ReturnType<HandoverPreparationAgent['executeCore']>;

export class AgentFactory {
  private static agents = new Map<string, () => BaseAgent<any, any>>();

  static {
    // Register all available agents
    // Phase 3: Analysis Agents
    this.agents.set('ad-analyzer', () => new AdAnalyzerAgent());
    this.agents.set('url-brand-analyzer', () => new UrlBrandAnalyzerAgent());
    this.agents.set('audience-intent', () => new AudienceIntentAgent());

    // Phase 4: Strategy & Content Agents
    this.agents.set('page-strategy', () => new PageStrategyAgent());
    this.agents.set('copy-generator', () => new CopyGeneratorAgent());
    this.agents.set('offer-proof-guard', () => new OfferProofGuardAgent());

    // Phase 5: Design & QA Agents
    this.agents.set('design-token-agent', () => new DesignTokenAgent());
    this.agents.set('component-plan-agent', () => new ComponentPlanAgent());
    this.agents.set('qa-validator', () => new QAValidatorAgent());
    this.agents.set('repair-agent', () => new RepairAgent());

    // Phase 6: Rendering & Integration Agents
    this.agents.set('component-renderer', () => new ComponentRendererAgent());
    this.agents.set('integration-agent', () => new IntegrationAgent());
    this.agents.set('deployment-prep-agent', () => new DeploymentPrepAgent());

    // Phase 7: Observability & Production Polish Agents
    this.agents.set('performance-monitoring-agent', () => new PerformanceMonitoringAgent());
    this.agents.set('error-tracking-agent', () => new ErrorTrackingAgent());
    this.agents.set('analytics-integration-agent', () => new AnalyticsIntegrationAgent());
    this.agents.set('health-check-agent', () => new HealthCheckAgent());

    // Phase 8: Testing & Validation Agents
    this.agents.set('end-to-end-testing-agent', () => new EndToEndTestingAgent());
    this.agents.set('performance-testing-agent', () => new PerformanceTestingAgent());
    this.agents.set('accessibility-testing-agent', () => new AccessibilityTestingAgent());
    this.agents.set('integration-testing-agent', () => new IntegrationTestingAgent());

    // Phase 9: Optimization & Scaling Agents
    this.agents.set('ab-testing-agent', () => new ABTestingAgent());
    this.agents.set('performance-optimization-agent', () => new PerformanceOptimizationAgent());
    this.agents.set('scaling-agent', () => new ScalingAgent());
    this.agents.set('feature-flag-agent', () => new FeatureFlagAgent());

    // Phase 10: Production & Handover Agents
    this.agents.set('production-deployment-agent', () => new ProductionDeploymentAgent());
    this.agents.set('operations-management-agent', () => new OperationsManagementAgent());
    this.agents.set('documentation-generation-agent', () => new DocumentationGenerationAgent());
    this.agents.set('handover-preparation-agent', () => new HandoverPreparationAgent());
  }

  /**
   * Get an agent instance by name
   */
  static getAgent<TInput = any, TOutput = any>(name: string): BaseAgent<TInput, TOutput> | null {
    const factory = this.agents.get(name);
    return factory ? factory() : null;
  }

  /**
   * Check if an agent is available
   */
  static hasAgent(name: string): boolean {
    return this.agents.has(name);
  }

  /**
   * Get all available agent names
   */
  static getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}