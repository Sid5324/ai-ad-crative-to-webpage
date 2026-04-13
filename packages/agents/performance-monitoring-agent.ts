// packages/agents/performance-monitoring-agent.ts
import { BaseAgent } from './base-agent';

export interface PerformanceMonitoringAgentInput {
  deployment_config: any;
  application_structure: any;
  performance_requirements: any;
}

export interface PerformanceMonitoringAgentOutput {
  monitoring_setup: {
    core_web_vitals: {
      enabled: boolean;
      tracking_code: string;
      metrics: string[];
    };
    real_user_monitoring: {
      provider: string;
      configuration: any;
      dashboard_url: string;
    };
    synthetic_monitoring: {
      enabled: boolean;
      test_scenarios: any[];
      frequency: string;
    };
  };
  performance_optimizations: {
    recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      issue: string;
      solution: string;
      impact: string;
    }>;
    automated_fixes: Array<{
      file_path: string;
      change_type: string;
      code_change: string;
    }>;
  };
  alerting_rules: {
    performance_thresholds: any[];
    error_rates: any[];
    availability_checks: any[];
  };
}

export class PerformanceMonitoringAgent extends BaseAgent<PerformanceMonitoringAgentInput, PerformanceMonitoringAgentOutput> {
  constructor() {
    super({
      name: 'performance-monitoring-agent',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request'],
        write_scopes: ['request'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'performance-monitoring-setup',
          'core-web-vitals-tracking'
        ],
        optional: [
          'bundle-analysis',
          'performance-optimization-recommendations'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: PerformanceMonitoringAgentInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<PerformanceMonitoringAgentOutput> {
    const { input } = context;

    // Set up monitoring infrastructure
    const monitoringSetup = await this.setupMonitoring(input);

    // Generate performance optimization recommendations
    const performanceOpts = await this.generatePerformanceOptimizations(input);

    // Configure alerting rules
    const alertingRules = await this.configureAlerting(input);

    return {
      monitoring_setup: monitoringSetup,
      performance_optimizations: performanceOpts,
      alerting_rules: alertingRules
    };
  }

  private async setupMonitoring(input: PerformanceMonitoringAgentInput): Promise<any> {
    const monitoringSetup = await this.executeSkill('performance-monitoring-setup', {
      deployment_target: input.deployment_config?.deployment_target || 'vercel',
      application_structure: input.application_structure,
      monitoring_requirements: input.performance_requirements
    });

    // Set up Core Web Vitals tracking
    const coreWebVitals = await this.setupCoreWebVitals(input);

    // Configure Real User Monitoring
    const rumConfig = await this.setupRealUserMonitoring(input);

    // Set up synthetic monitoring
    const syntheticConfig = await this.setupSyntheticMonitoring(input);

    return {
      core_web_vitals: coreWebVitals,
      real_user_monitoring: rumConfig,
      synthetic_monitoring: syntheticConfig
    };
  }

  private async setupCoreWebVitals(input: PerformanceMonitoringAgentInput): Promise<any> {
    const vitalsSetup = await this.executeSkill('core-web-vitals-tracking', {
      framework: 'nextjs',
      deployment_target: input.deployment_config?.deployment_target || 'vercel',
      tracking_provider: 'web-vitals'
    });

    return {
      enabled: true,
      tracking_code: vitalsSetup.tracking_code || this.generateVitalsTrackingCode(),
      metrics: ['FCP', 'LCP', 'CLS', 'FID', 'TTFB']
    };
  }

  private async setupRealUserMonitoring(input: PerformanceMonitoringAgentInput): Promise<any> {
    // Configure based on deployment target
    const target = input.deployment_config?.deployment_target || 'vercel';

    let provider = 'vercel_analytics';
    let config = {};
    let dashboardUrl = '';

    switch (target) {
      case 'vercel':
        provider = 'vercel_analytics';
        config = { enableRealUserMonitoring: true };
        dashboardUrl = 'https://vercel.com/analytics';
        break;
      case 'netlify':
        provider = 'netlify_analytics';
        config = { netlifyAnalytics: true };
        dashboardUrl = 'https://app.netlify.com/sites/{site-id}/analytics';
        break;
      default:
        provider = 'custom_rum';
        config = { endpoint: '/api/analytics' };
        dashboardUrl = '/admin/analytics';
    }

    return {
      provider,
      configuration: config,
      dashboard_url: dashboardUrl
    };
  }

  private async setupSyntheticMonitoring(input: PerformanceMonitoringAgentInput): Promise<any> {
    return {
      enabled: true,
      test_scenarios: [
        {
          name: 'Homepage Load',
          url: '/',
          device: 'desktop',
          location: 'us-east-1'
        },
        {
          name: 'Mobile Homepage',
          url: '/',
          device: 'mobile',
          location: 'us-east-1'
        }
      ],
      frequency: 'every_15_minutes'
    };
  }

  private async generatePerformanceOptimizations(input: PerformanceMonitoringAgentInput): Promise<any> {
    const bundleAnalysis = await this.executeSkill('bundle-analysis', {
      application_structure: input.application_structure,
      deployment_config: input.deployment_config
    });

    const optimizationRecs = await this.executeSkill('performance-optimization-recommendations', {
      bundle_analysis: bundleAnalysis,
      performance_requirements: input.performance_requirements,
      current_metrics: {} // Would be populated from actual monitoring data
    });

    // Generate automated fixes for critical issues
    const automatedFixes = this.generateAutomatedFixes(optimizationRecs.recommendations || []);

    return {
      recommendations: optimizationRecs.recommendations || [],
      automated_fixes: automatedFixes
    };
  }

  private generateAutomatedFixes(recommendations: any[]): any[] {
    const fixes = [];

    for (const rec of recommendations) {
      if (rec.priority === 'high' && rec.category === 'bundle_size') {
        fixes.push({
          file_path: 'next.config.js',
          change_type: 'optimization',
          code_change: 'experimental: { optimizePackageImports: ["lucide-react"] }'
        });
      }

      if (rec.category === 'image_optimization') {
        fixes.push({
          file_path: 'next.config.js',
          change_type: 'image_config',
          code_change: 'images: { formats: ["image/webp", "image/avif"] }'
        });
      }
    }

    return fixes;
  }

  private async configureAlerting(input: PerformanceMonitoringAgentInput): Promise<any> {
    return {
      performance_thresholds: [
        {
          metric: 'LCP',
          threshold: 2500,
          severity: 'high',
          message: 'Largest Contentful Paint is too slow'
        },
        {
          metric: 'CLS',
          threshold: 0.1,
          severity: 'medium',
          message: 'Cumulative Layout Shift is too high'
        },
        {
          metric: 'FCP',
          threshold: 1800,
          severity: 'high',
          message: 'First Contentful Paint is slow'
        }
      ],
      error_rates: [
        {
          threshold: 5,
          window: '5_minutes',
          severity: 'high',
          message: 'Error rate exceeded 5%'
        }
      ],
      availability_checks: [
        {
          url: '/',
          expected_status: 200,
          timeout: 10000,
          frequency: '1_minute'
        }
      ]
    };
  }

  private generateVitalsTrackingCode(): string {
    return `
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, value, id }) {
  // Send to analytics provider
  console.log(\`\${name}: \${delta}\`);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
`;
  }

  protected calculateConfidence(output: PerformanceMonitoringAgentOutput): number {
    let confidence = 0.9; // Base confidence

    if (output.monitoring_setup?.core_web_vitals?.enabled) confidence += 0.05;
    if (output.performance_optimizations?.recommendations?.length > 0) confidence += 0.05;
    if (output.alerting_rules?.performance_thresholds?.length > 0) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: PerformanceMonitoringAgentOutput): any {
    return {
      monitoring_providers: [
        output.monitoring_setup?.real_user_monitoring?.provider
      ].filter(Boolean),
      tracked_metrics: output.monitoring_setup?.core_web_vitals?.metrics || [],
      optimization_categories: output.performance_optimizations?.recommendations?.map(r => r.category) || [],
      alert_types: Object.keys(output.alerting_rules || {})
    };
  }
}