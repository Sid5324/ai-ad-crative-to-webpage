// packages/agents/scaling-agent.ts
import { BaseAgent } from './base-agent';

export interface ScalingAgentInput {
  performance_metrics: any;
  usage_patterns: any;
  deployment_config: any;
  infrastructure_limits: any;
}

export interface ScalingAgentOutput {
  capacity_planning: {
    current_capacity: any;
    projected_growth: any;
    scaling_triggers: any[];
    resource_allocation: any;
  };
  auto_scaling_config: {
    horizontal_scaling: any;
    vertical_scaling: any;
    scaling_policies: any[];
    cooldown_periods: any;
  };
  load_balancing: {
    algorithm: string;
    health_checks: any[];
    session_persistence: any;
    geo_distribution: any;
  };
  resource_optimization: {
    cost_optimization: any;
    performance_optimization: any;
    sustainability_metrics: any;
  };
}

export class ScalingAgent extends BaseAgent<ScalingAgentInput, ScalingAgentOutput> {
  constructor() {
    super({
      name: 'scaling-agent',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request'],
        write_scopes: ['request'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'capacity-planning',
          'auto-scaling-configuration'
        ],
        optional: [
          'resource-optimization',
          'load-balancing-setup'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: ScalingAgentInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<ScalingAgentOutput> {
    const { input } = context;

    // Plan capacity requirements
    const capacityPlanning = await this.planCapacity(input);

    // Configure auto-scaling
    const autoScalingConfig = await this.configureAutoScaling(input);

    // Set up load balancing
    const loadBalancing = await this.setupLoadBalancing(input);

    // Optimize resource usage
    const resourceOptimization = await this.optimizeResources(input);

    return {
      capacity_planning: capacityPlanning,
      auto_scaling_config: autoScalingConfig,
      load_balancing: loadBalancing,
      resource_optimization: resourceOptimization
    };
  }

  private async planCapacity(input: ScalingAgentInput): Promise<any> {
    const capacityPlanning = await this.executeSkill('capacity-planning', {
      performance_metrics: input.performance_metrics,
      usage_patterns: input.usage_patterns,
      deployment_config: input.deployment_config,
      growth_projections: {
        monthly_growth: this.calculateGrowthRate(input.usage_patterns),
        projected_6_months: this.projectCapacity(6, input.usage_patterns),
        projected_12_months: this.projectCapacity(12, input.usage_patterns)
      }
    });

    // Analyze current capacity
    const currentCapacity = {
      concurrent_users_supported: this.calculateCurrentCapacity(input.performance_metrics),
      peak_load_handled: input.performance_metrics?.peak_concurrent_users || 1000,
      average_response_time: input.performance_metrics?.avg_response_time || 245,
      resource_utilization: {
        cpu: input.performance_metrics?.cpu_utilization || 65,
        memory: input.performance_metrics?.memory_utilization || 72,
        bandwidth: input.performance_metrics?.bandwidth_utilization || 58
      },
      bottleneck_identification: this.identifyBottlenecks(input.performance_metrics)
    };

    // Project future growth
    const projectedGrowth = {
      monthly_growth_rate: this.calculateGrowthRate(input.usage_patterns),
      projected_6_months: this.projectCapacity(6, input.usage_patterns),
      projected_12_months: this.projectCapacity(12, input.usage_patterns),
      projected_24_months: this.projectCapacity(24, input.usage_patterns),
      seasonal_patterns: this.analyzeSeasonalPatterns(input.usage_patterns),
      viral_coefficient: input.usage_patterns?.viral_coefficient || 1.0
    };

    // Define scaling triggers
    const scalingTriggers = [
      {
        metric: 'cpu_utilization',
        threshold: 75,
        action: 'scale_up',
        cooldown_minutes: 5,
        priority: 'high'
      },
      {
        metric: 'memory_utilization',
        threshold: 80,
        action: 'scale_up',
        cooldown_minutes: 3,
        priority: 'high'
      },
      {
        metric: 'response_time_p95',
        threshold: 1000,
        action: 'scale_up',
        cooldown_minutes: 2,
        priority: 'critical'
      },
      {
        metric: 'error_rate',
        threshold: 5,
        action: 'scale_up',
        cooldown_minutes: 1,
        priority: 'critical'
      },
      {
        metric: 'concurrent_connections',
        threshold: 80, // 80% of capacity
        action: 'scale_up',
        cooldown_minutes: 5,
        priority: 'medium'
      }
    ];

    // Resource allocation strategy
    const resourceAllocation = {
      primary_resources: {
        cpu_cores: Math.ceil(currentCapacity.concurrent_users_supported / 100),
        memory_gb: Math.ceil(currentCapacity.concurrent_users_supported / 50),
        bandwidth_mbps: Math.ceil(currentCapacity.concurrent_users_supported / 10)
      },
      backup_resources: {
        cpu_cores: Math.ceil(currentCapacity.concurrent_users_supported / 200),
        memory_gb: Math.ceil(currentCapacity.concurrent_users_supported / 100),
        bandwidth_mbps: Math.ceil(currentCapacity.concurrent_users_supported / 20)
      },
      scaling_increment: {
        min_instances: 1,
        max_instances: 10,
        instance_increment: 1
      },
      cost_optimization: {
        reserved_instances_percentage: 60,
        spot_instances_percentage: 20,
        on_demand_percentage: 20
      }
    };

    return {
      current_capacity: currentCapacity,
      projected_growth: projectedGrowth,
      scaling_triggers: scalingTriggers,
      resource_allocation: resourceAllocation
    };
  }

  private async configureAutoScaling(input: ScalingAgentInput): Promise<any> {
    const autoScalingConfig = await this.executeSkill('auto-scaling-configuration', {
      deployment_target: input.deployment_config?.deployment_target,
      performance_metrics: input.performance_metrics,
      infrastructure_limits: input.infrastructure_limits
    });

    // Horizontal scaling configuration
    const horizontalScaling = {
      enabled: true,
      min_instances: 1,
      max_instances: 10,
      target_cpu_utilization: 70,
      target_memory_utilization: 75,
      cooldown_period_seconds: 300,
      health_check_grace_period: 300,
      instance_warmup_time: 180
    };

    // Vertical scaling configuration
    const verticalScaling = {
      enabled: true,
      cpu_scaling: {
        enabled: true,
        min_cores: 1,
        max_cores: 8,
        target_utilization: 80
      },
      memory_scaling: {
        enabled: true,
        min_memory_gb: 2,
        max_memory_gb: 32,
        target_utilization: 85
      },
      scaling_cooldown_minutes: 10
    };

    // Scaling policies
    const scalingPolicies = [
      {
        name: 'cpu_based_scaling',
        type: 'target_tracking',
        metric: 'cpu_utilization',
        target_value: 70,
        cooldown: 300
      },
      {
        name: 'memory_based_scaling',
        type: 'target_tracking',
        metric: 'memory_utilization',
        target_value: 75,
        cooldown: 300
      },
      {
        name: 'request_based_scaling',
        type: 'step_scaling',
        metric: 'request_count_per_target',
        thresholds: [
          { lower_bound: 0, upper_bound: 1000, adjustment: 1 },
          { lower_bound: 1000, upper_bound: 2000, adjustment: 2 },
          { lower_bound: 2000, adjustment: 3 }
        ],
        cooldown: 60
      },
      {
        name: 'latency_based_scaling',
        type: 'step_scaling',
        metric: 'target_response_time',
        thresholds: [
          { lower_bound: 0, upper_bound: 0.5, adjustment: -1 },
          { lower_bound: 0.5, upper_bound: 1.0, adjustment: 0 },
          { lower_bound: 1.0, adjustment: 2 }
        ],
        cooldown: 120
      }
    ];

    // Cooldown periods
    const cooldownPeriods = {
      scale_up_cooldown: 300, // 5 minutes
      scale_down_cooldown: 600, // 10 minutes
      instance_warmup: 180, // 3 minutes
      health_check_grace: 300 // 5 minutes
    };

    return {
      horizontal_scaling: horizontalScaling,
      vertical_scaling: verticalScaling,
      scaling_policies: scalingPolicies,
      cooldown_periods: cooldownPeriods
    };
  }

  private async setupLoadBalancing(input: ScalingAgentInput): Promise<any> {
    const loadBalancingSetup = await this.executeSkill('load-balancing-setup', {
      deployment_target: input.deployment_config?.deployment_target,
      performance_requirements: input.performance_metrics,
      scaling_config: input.infrastructure_limits
    });

    // Load balancing algorithm
    const algorithm = input.deployment_config?.deployment_target === 'vercel' ?
      'geographic_routing' : 'least_connections';

    // Health check configuration
    const healthChecks = [
      {
        protocol: 'HTTP',
        port: 80,
        path: '/api/health',
        interval: 30,
        timeout: 5,
        healthy_threshold: 2,
        unhealthy_threshold: 2,
        success_codes: '200-299'
      },
      {
        protocol: 'HTTPS',
        port: 443,
        path: '/api/health',
        interval: 30,
        timeout: 5,
        healthy_threshold: 2,
        unhealthy_threshold: 2,
        success_codes: '200-299'
      },
      {
        protocol: 'TCP',
        port: 80,
        interval: 30,
        timeout: 5,
        healthy_threshold: 2,
        unhealthy_threshold: 2
      }
    ];

    // Session persistence
    const sessionPersistence = {
      enabled: false, // Usually not needed for landing pages
      type: 'none',
      cookie_name: 'session_id',
      cookie_duration: 3600
    };

    // Geographic distribution
    const geoDistribution = {
      enabled: true,
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
      routing_policy: 'latency_based',
      failover_regions: ['us-east-1', 'eu-west-1'],
      dns_based_routing: true
    };

    return {
      algorithm,
      health_checks: healthChecks,
      session_persistence: sessionPersistence,
      geo_distribution: geoDistribution
    };
  }

  private async optimizeResources(input: ScalingAgentInput): Promise<any> {
    // Cost optimization strategies
    const costOptimization = {
      reserved_instances: {
        percentage: 60,
        term: '1_year',
        payment_option: 'partial_upfront',
        estimated_savings: '35%'
      },
      spot_instances: {
        percentage: 20,
        fallback_strategy: 'on_demand',
        interruption_tolerance: 'medium',
        estimated_savings: '70%'
      },
      auto_shutdown: {
        enabled: true,
        timezone: 'UTC',
        business_hours_only: true,
        non_business_hour_shutdown: true
      },
      rightsizing: {
        enabled: true,
        monitoring_period_days: 30,
        downsize_threshold: 0.3, // 30% utilization
        rightsizing_frequency: 'weekly'
      }
    };

    // Performance optimization
    const performanceOptimization = {
      connection_pooling: {
        enabled: true,
        max_connections: 100,
        connection_timeout: 30,
        idle_timeout: 300
      },
      caching_layers: {
        cdn_enabled: true,
        application_cache: true,
        database_cache: true,
        api_cache: true
      },
      resource_limits: {
        max_memory_per_instance: '4GB',
        max_cpu_per_instance: '2_cores',
        max_connections_per_instance: 1000,
        rate_limiting: {
          requests_per_minute: 1000,
          burst_limit: 2000
        }
      }
    };

    // Sustainability metrics
    const sustainabilityMetrics = {
      carbon_footprint_tracking: true,
      energy_efficiency_score: 85,
      renewable_energy_percentage: 75,
      server_utilization_efficiency: 92,
      recommendations: [
        'Use spot instances for non-critical workloads',
        'Implement auto-shutdown during off-hours',
        'Optimize for edge computing to reduce latency',
        'Use energy-efficient instance types'
      ]
    };

    return {
      cost_optimization: costOptimization,
      performance_optimization: performanceOptimization,
      sustainability_metrics: sustainabilityMetrics
    };
  }

  private calculateCurrentCapacity(performanceMetrics: any): number {
    const avgResponseTime = performanceMetrics?.avg_response_time || 245;
    const cpuUtilization = performanceMetrics?.cpu_utilization || 65;
    const memoryUtilization = performanceMetrics?.memory_utilization || 72;

    // Estimate capacity based on performance metrics
    const responseTimeCapacity = Math.floor(1000 / avgResponseTime) * 100; // Rough estimate
    const cpuCapacity = Math.floor(100 / cpuUtilization) * 100;
    const memoryCapacity = Math.floor(100 / memoryUtilization) * 100;

    return Math.min(responseTimeCapacity, cpuCapacity, memoryCapacity);
  }

  private calculateGrowthRate(usagePatterns: any): number {
    // Calculate monthly growth rate from usage patterns
    const recentUsage = usagePatterns?.monthly_active_users || [1000, 1100, 1200, 1350, 1500];
    if (recentUsage.length < 2) return 0.1; // 10% default

    const recent = recentUsage[recentUsage.length - 1];
    const previous = recentUsage[recentUsage.length - 2];
    return (recent - previous) / previous;
  }

  private projectCapacity(months: number, usagePatterns: any): any {
    const currentUsers = usagePatterns?.current_active_users || 10000;
    const growthRate = this.calculateGrowthRate(usagePatterns);
    const projectedUsers = Math.floor(currentUsers * Math.pow(1 + growthRate, months));

    return {
      users: projectedUsers,
      required_capacity: Math.ceil(projectedUsers / 100), // Rough capacity calculation
      infrastructure_cost: Math.ceil(projectedUsers / 100) * 50, // Rough cost estimate
      timeline_months: months
    };
  }

  private analyzeSeasonalPatterns(usagePatterns: any): any {
    // Analyze seasonal usage patterns
    return {
      peak_months: ['November', 'December'], // Holiday season
      low_months: ['January', 'February'],
      seasonal_multiplier: 1.5, // 50% increase during peak
      planning_recommendations: [
        'Increase capacity during peak months',
        'Implement predictive scaling',
        'Use reserved instances for base load'
      ]
    };
  }

  private identifyBottlenecks(performanceMetrics: any): any[] {
    const bottlenecks = [];

    if (performanceMetrics?.cpu_utilization > 80) {
      bottlenecks.push({
        type: 'cpu',
        severity: 'high',
        description: 'CPU utilization is high',
        recommendation: 'Consider vertical scaling or optimization'
      });
    }

    if (performanceMetrics?.memory_utilization > 85) {
      bottlenecks.push({
        type: 'memory',
        severity: 'high',
        description: 'Memory utilization is high',
        recommendation: 'Implement memory optimization or increase instance size'
      });
    }

    if (performanceMetrics?.avg_response_time > 1000) {
      bottlenecks.push({
        type: 'latency',
        severity: 'critical',
        description: 'Response time is too high',
        recommendation: 'Immediate scaling required'
      });
    }

    return bottlenecks;
  }

  protected calculateConfidence(output: ScalingAgentOutput): number {
    let confidence = 0.8; // Base confidence

    if (output.capacity_planning?.scaling_triggers?.length > 0) confidence += 0.05;
    if (output.auto_scaling_config?.scaling_policies?.length > 0) confidence += 0.05;
    if (output.load_balancing?.health_checks?.length > 0) confidence += 0.05;
    if (output.resource_optimization?.cost_optimization) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: ScalingAgentOutput): any {
    return {
      scaling_triggers: output.capacity_planning?.scaling_triggers?.length || 0,
      scaling_policies: output.auto_scaling_config?.scaling_policies?.length || 0,
      load_balancing_algorithm: output.load_balancing?.algorithm,
      resource_optimization_areas: Object.keys(output.resource_optimization || {}),
      bottleneck_types: output.capacity_planning?.current_capacity?.bottleneck_identification?.map(b => b.type) || []
    };
  }
}