// packages/agents/documentation-generation-agent.ts
import { BaseAgent } from './base-agent';

export interface DocumentationGenerationAgentInput {
  project_structure: any;
  agent_outputs: any;
  deployment_result: any;
  operational_setup: any;
}

export interface DocumentationGenerationAgentOutput {
  technical_documentation: {
    api_documentation: any;
    architecture_diagrams: any;
    deployment_guides: any;
    maintenance_manuals: any;
  };
  user_documentation: {
    user_guides: any[];
    faq_documents: any[];
    video_tutorials: any[];
    troubleshooting_guides: any[];
  };
  operational_documentation: {
    runbooks: any[];
    incident_response: any[];
    monitoring_guides: any[];
    compliance_documents: any[];
  };
  developer_documentation: {
    codebase_overview: any;
    development_setup: any;
    testing_guides: any;
    contribution_guidelines: any;
  };
}

export class DocumentationGenerationAgent extends BaseAgent<DocumentationGenerationAgentInput, DocumentationGenerationAgentOutput> {
  constructor() {
    super({
      name: 'documentation-generation-agent',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request'],
        write_scopes: ['request'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'technical-writing',
          'documentation-automation'
        ],
        optional: [
          'diagram-generation',
          'content-organization'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: DocumentationGenerationAgentInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<DocumentationGenerationAgentOutput> {
    const { input } = context;

    // Generate technical documentation
    const technicalDocumentation = await this.generateTechnicalDocumentation(input);

    // Create user documentation
    const userDocumentation = await this.generateUserDocumentation(input);

    // Produce operational documentation
    const operationalDocumentation = await this.generateOperationalDocumentation(input);

    // Develop developer documentation
    const developerDocumentation = await this.generateDeveloperDocumentation(input);

    return {
      technical_documentation: technicalDocumentation,
      user_documentation: userDocumentation,
      operational_documentation: operationalDocumentation,
      developer_documentation: developerDocumentation
    };
  }

  private async generateTechnicalDocumentation(input: DocumentationGenerationAgentInput): Promise<any> {
    const technicalWriting = await this.executeSkill('technical-writing', {
      content_type: 'technical_documentation',
      audience: 'technical_users',
      scope: 'comprehensive_system_documentation'
    });

    const apiDocumentation = {
      openapi_spec: {
        version: '3.0.0',
        title: 'Landing Page API',
        description: 'RESTful API for landing page functionality',
        endpoints: [
          {
            path: '/api/health',
            method: 'GET',
            description: 'Health check endpoint',
            responses: {
              '200': { description: 'Service is healthy' },
              '500': { description: 'Service is unhealthy' }
            }
          },
          {
            path: '/api/contact',
            method: 'POST',
            description: 'Submit contact form',
            request_body: {
              name: 'string',
              email: 'string',
              message: 'string'
            },
            responses: {
              '200': { description: 'Contact form submitted successfully' },
              '400': { description: 'Invalid request data' }
            }
          }
        ]
      },
      authentication: {
        type: 'API Key',
        header: 'X-API-Key',
        description: 'API key authentication for protected endpoints'
      },
      rate_limiting: {
        requests_per_minute: 100,
        burst_limit: 200,
        headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
      },
      error_codes: [
        { code: '400', description: 'Bad Request', resolution: 'Check request format' },
        { code: '401', description: 'Unauthorized', resolution: 'Verify API key' },
        { code: '429', description: 'Rate Limited', resolution: 'Reduce request frequency' },
        { code: '500', description: 'Internal Server Error', resolution: 'Contact support' }
      ]
    };

    const architectureDiagrams = {
      system_architecture: {
        format: 'mermaid',
        content: `
        graph TB
            A[User] --> B[Next.js App]
            B --> C[API Routes]
            B --> D[Static Assets]
            C --> E[Database]
            C --> F[External APIs]
            D --> G[CDN]
            E --> H[Backup Storage]
            F --> I[Third-party Services]
        `,
        description: 'High-level system architecture diagram'
      },
      data_flow: {
        format: 'mermaid',
        content: `
        sequenceDiagram
            participant U as User
            participant F as Frontend
            participant A as API
            participant D as Database
            participant C as Cache

            U->>F: Request Page
            F->>C: Check Cache
            C-->>F: Cache Hit
            F-->>U: Return Page

            F->>A: API Request
            A->>C: Check Cache
            C-->>A: Cache Miss
            A->>D: Query Database
            D-->>A: Return Data
            A->>C: Store in Cache
            A-->>F: Return Data
            F-->>U: Render Page
        `,
        description: 'Data flow through the application'
      },
      deployment_architecture: {
        format: 'mermaid',
        content: `
        graph TB
            subgraph "Production Environment"
                LB[Load Balancer]
                APP1[App Server 1]
                APP2[App Server 2]
                DB[(Database)]
                CACHE[(Redis Cache)]
            end

            subgraph "CDN"
                CF[CloudFront]
            end

            subgraph "Monitoring"
                MON[Monitoring Stack]
            end

            CF --> LB
            LB --> APP1
            LB --> APP2
            APP1 --> DB
            APP2 --> DB
            APP1 --> CACHE
            APP2 --> CACHE
            APP1 --> MON
            APP2 --> MON
            DB --> MON
        `,
        description: 'Production deployment architecture'
      }
    };

    const deploymentGuides = {
      local_development: {
        title: 'Local Development Setup',
        prerequisites: ['Node.js 18+', 'npm or yarn', 'Git'],
        steps: [
          'Clone the repository',
          'Install dependencies with npm install',
          'Copy .env.example to .env.local',
          'Configure environment variables',
          'Run the development server with npm run dev',
          'Access the application at http://localhost:3000'
        ],
        troubleshooting: [
          {
            issue: 'Port 3000 already in use',
            solution: 'Change the port in package.json or kill the process using the port'
          },
          {
            issue: 'Environment variables not loaded',
            solution: 'Ensure .env.local file exists and restart the development server'
          }
        ]
      },
      production_deployment: {
        title: 'Production Deployment Guide',
        prerequisites: ['AWS CLI configured', 'Docker installed', 'CI/CD pipeline access'],
        steps: [
          'Ensure all tests pass in CI/CD',
          'Build production artifacts',
          'Deploy to staging environment',
          'Run integration tests on staging',
          'Deploy to production with canary strategy',
          'Monitor deployment metrics',
          'Complete deployment or rollback if needed'
        ],
        rollback_procedures: [
          'Identify the issue causing rollback',
          'Stop the canary deployment',
          'Switch traffic back to previous version',
          'Monitor system stability',
          'Schedule permanent fix deployment'
        ]
      },
      environment_configuration: {
        title: 'Environment Configuration',
        environments: {
          development: {
            database_url: 'postgresql://localhost:5432/app_dev',
            redis_url: 'redis://localhost:6379',
            api_base_url: 'http://localhost:3000'
          },
          staging: {
            database_url: 'postgresql://staging-db:5432/app_staging',
            redis_url: 'redis://staging-redis:6379',
            api_base_url: 'https://staging.app.com'
          },
          production: {
            database_url: 'postgresql://prod-db:5432/app_prod',
            redis_url: 'redis://prod-redis:6379',
            api_base_url: 'https://app.com'
          }
        },
        secrets_management: {
          provider: 'AWS Secrets Manager',
          rotation_policy: '30_days',
          access_control: 'IAM roles only'
        }
      }
    };

    const maintenanceManuals = {
      database_maintenance: {
        title: 'Database Maintenance Guide',
        regular_tasks: [
          {
            task: 'Daily backup verification',
            frequency: 'daily',
            procedure: 'Check backup completion logs and test restore capability',
            responsible: 'DevOps Team'
          },
          {
            task: 'Index optimization',
            frequency: 'weekly',
            procedure: 'Analyze slow queries and optimize indexes',
            responsible: 'Database Administrator'
          }
        ],
        emergency_procedures: [
          {
            scenario: 'Database corruption',
            steps: [
              'Stop application traffic',
              'Restore from latest backup',
              'Validate data integrity',
              'Resume traffic gradually'
            ],
            contact: 'Database Administrator + Engineering Lead'
          }
        ]
      },
      security_maintenance: {
        title: 'Security Maintenance Guide',
        vulnerability_scanning: {
          frequency: 'weekly',
          tools: ['OWASP ZAP', 'Snyk', 'Dependabot'],
          responsible: 'Security Team'
        },
        certificate_management: {
          renewal_process: 'Automated with 30-day notification',
          responsible: 'DevOps Team'
        },
        access_reviews: {
          frequency: 'quarterly',
          scope: 'All user accounts and API keys',
          responsible: 'Security Team'
        }
      },
      performance_maintenance: {
        title: 'Performance Maintenance Guide',
        monitoring_tasks: [
          {
            task: 'Response time monitoring',
            frequency: 'continuous',
            thresholds: 'P95 < 1000ms',
            responsible: 'SRE Team'
          },
          {
            task: 'Resource utilization review',
            frequency: 'weekly',
            action: 'Optimize if >80% sustained usage',
            responsible: 'DevOps Team'
          }
        ],
        optimization_procedures: [
          {
            trigger: 'Performance degradation detected',
            steps: [
              'Identify bottleneck using monitoring data',
              'Implement temporary fix (caching, scaling)',
              'Develop permanent solution',
              'Deploy and validate improvement'
            ]
          }
        ]
      }
    };

    return {
      api_documentation: apiDocumentation,
      architecture_diagrams: architectureDiagrams,
      deployment_guides: deploymentGuides,
      maintenance_manuals: maintenanceManuals
    };
  }

  private async generateUserDocumentation(input: DocumentationGenerationAgentInput): Promise<any> {
    const contentOrganization = await this.executeSkill('content-organization', {
      content_type: 'user_documentation',
      audience: 'end_users',
      structure: 'hierarchical'
    });

    const userGuides = [
      {
        title: 'Getting Started Guide',
        audience: 'new_users',
        content: {
          overview: 'Welcome to our platform. This guide will help you get started quickly.',
          sections: [
            {
              title: 'Creating Your Account',
              steps: [
                'Click "Sign Up" on the homepage',
                'Enter your email and create a password',
                'Verify your email address',
                'Complete your profile setup'
              ]
            },
            {
              title: 'Navigating the Dashboard',
              content: 'Learn about the main dashboard features and how to use them effectively.'
            },
            {
              title: 'Your First Project',
              steps: [
                'Click "Create New Project"',
                'Choose a template or start from scratch',
                'Add your content and customize',
                'Publish your project'
              ]
            }
          ]
        },
        format: 'web_page',
        estimated_read_time: '10_minutes'
      },
      {
        title: 'Advanced Features Guide',
        audience: 'experienced_users',
        content: {
          overview: 'Unlock the full potential of our platform with advanced features.',
          sections: [
            {
              title: 'Custom Integrations',
              content: 'Learn how to integrate with external services and APIs.'
            },
            {
              title: 'Automation Workflows',
              content: 'Set up automated processes to streamline your workflow.'
            },
            {
              title: 'Analytics and Reporting',
              content: 'Understand your performance with detailed analytics.'
            }
          ]
        },
        format: 'web_page',
        estimated_read_time: '20_minutes'
      }
    ];

    const faqDocuments = [
      {
        category: 'Account Management',
        questions: [
          {
            question: 'How do I reset my password?',
            answer: 'Click "Forgot Password" on the login page and follow the email instructions.',
            tags: ['password', 'login', 'security']
          },
          {
            question: 'How do I update my billing information?',
            answer: 'Go to Settings > Billing and update your payment method.',
            tags: ['billing', 'payment', 'settings']
          }
        ]
      },
      {
        category: 'Technical Issues',
        questions: [
          {
            question: 'The page is loading slowly. What can I do?',
            answer: 'Try clearing your browser cache, check your internet connection, or try a different browser.',
            tags: ['performance', 'loading', 'browser']
          },
          {
            question: 'I\'m getting an error message. What should I do?',
            answer: 'Take a screenshot of the error and contact our support team with details about what you were doing.',
            tags: ['error', 'support', 'troubleshooting']
          }
        ]
      },
      {
        category: 'Features & Functionality',
        questions: [
          {
            question: 'Can I export my data?',
            answer: 'Yes, go to Settings > Data Export and choose your preferred format.',
            tags: ['export', 'data', 'settings']
          },
          {
            question: 'How do I invite team members?',
            answer: 'Go to Team Settings and enter their email addresses to send invitations.',
            tags: ['team', 'collaboration', 'invitations']
          }
        ]
      }
    ];

    const videoTutorials = [
      {
        title: 'Platform Overview (2:30)',
        description: 'A quick introduction to the platform and its main features.',
        duration: '2:30',
        thumbnail: '/videos/platform-overview.jpg',
        transcript: 'Welcome to our platform overview video...',
        tags: ['introduction', 'overview', 'getting-started']
      },
      {
        title: 'Creating Your First Project (4:15)',
        description: 'Step-by-step guide to creating and publishing your first project.',
        duration: '4:15',
        thumbnail: '/videos/first-project.jpg',
        transcript: 'Let\'s walk through creating your first project...',
        tags: ['tutorial', 'project-creation', 'beginner']
      },
      {
        title: 'Advanced Customization (6:45)',
        description: 'Learn advanced customization techniques and best practices.',
        duration: '6:45',
        thumbnail: '/videos/advanced-customization.jpg',
        transcript: 'In this advanced tutorial, we\'ll cover...',
        tags: ['advanced', 'customization', 'tutorial']
      }
    ];

    const troubleshootingGuides = [
      {
        issue: 'Login Problems',
        symptoms: ['Cannot access account', 'Password not working', 'Two-factor authentication issues'],
        solutions: [
          {
            problem: 'Forgot password',
            steps: [
              'Click "Forgot Password" on login page',
              'Enter your email address',
              'Check email for reset link',
              'Follow link to create new password'
            ]
          },
          {
            problem: 'Account locked',
            steps: [
              'Wait 30 minutes for automatic unlock',
              'Contact support if issue persists',
              'Verify account security settings'
            ]
          }
        ],
        prevention: 'Use a strong password and enable two-factor authentication'
      },
      {
        issue: 'Performance Issues',
        symptoms: ['Slow page loading', 'Features not responding', 'High memory usage'],
        solutions: [
          {
            problem: 'Browser cache issues',
            steps: [
              'Clear browser cache and cookies',
              'Try incognito/private browsing mode',
              'Update browser to latest version'
            ]
          },
          {
            problem: 'Network connectivity',
            steps: [
              'Check internet connection speed',
              'Try different network (WiFi vs mobile data)',
              'Contact ISP if network issues persist'
            ]
          }
        ],
        prevention: 'Keep browser updated and clear cache regularly'
      },
      {
        issue: 'Feature Not Working',
        symptoms: ['Button not responding', 'Form not submitting', 'Feature unavailable'],
        solutions: [
          {
            problem: 'Browser compatibility',
            steps: [
              'Try different browser (Chrome, Firefox, Safari)',
              'Update browser to latest version',
              'Disable browser extensions temporarily'
            ]
          },
          {
            problem: 'JavaScript disabled',
            steps: [
              'Enable JavaScript in browser settings',
              'Clear browser cache',
              'Try refreshing the page'
            ]
          }
        ],
        prevention: 'Keep browser updated and JavaScript enabled'
      }
    ];

    return {
      user_guides: userGuides,
      faq_documents: faqDocuments,
      video_tutorials: videoTutorials,
      troubleshooting_guides: troubleshootingGuides
    };
  }

  private async generateOperationalDocumentation(input: DocumentationGenerationAgentInput): Promise<any> {
    const runbooks = [
      {
        title: 'Application Deployment Runbook',
        scope: 'deployment',
        trigger: 'New release deployment',
        responsible_team: 'DevOps',
        estimated_duration: '45 minutes',
        prerequisites: [
          'All tests passing',
          'Security scan completed',
          'Stakeholder approval obtained'
        ],
        steps: [
          {
            phase: 'Preparation',
            steps: [
              'Verify deployment pipeline status',
              'Check infrastructure capacity',
              'Notify stakeholders of deployment window'
            ]
          },
          {
            phase: 'Execution',
            steps: [
              'Deploy to staging environment',
              'Run smoke tests on staging',
              'Deploy to production (canary)',
              'Monitor canary metrics for 30 minutes'
            ]
          },
          {
            phase: 'Verification',
            steps: [
              'Run health checks',
              'Validate core functionality',
              'Check monitoring dashboards',
              'Obtain stakeholder sign-off'
            ]
          },
          {
            phase: 'Completion',
            steps: [
              'Update deployment records',
              'Send completion notifications',
              'Schedule post-deployment review'
            ]
          }
        ],
        success_criteria: [
          'Zero critical errors in first hour',
          'Response time within SLA (< 1000ms P95)',
          'All core features functional',
          'Monitoring systems operational'
        ],
        rollback_procedure: 'Immediate rollback to previous version with traffic switching'
      },
      {
        title: 'Incident Response Runbook',
        scope: 'incident_management',
        trigger: 'System alerts or user reports',
        responsible_team: 'SRE/On-call Engineer',
        estimated_duration: 'Variable (15 min - 4 hours)',
        prerequisites: [
          'Access to monitoring tools',
          'Knowledge of system architecture',
          'Communication with stakeholders'
        ],
        steps: [
          {
            phase: 'Detection & Acknowledgment',
            steps: [
              'Receive alert notification',
              'Acknowledge alert in monitoring system',
              'Assess initial impact and severity',
              'Notify incident response team'
            ]
          },
          {
            phase: 'Investigation',
            steps: [
              'Gather relevant logs and metrics',
              'Reproduce issue if possible',
              'Identify root cause',
              'Assess impact on users and business'
            ]
          },
          {
            phase: 'Containment',
            steps: [
              'Implement temporary workaround',
              'Scale resources if needed',
              'Communicate with affected users'
            ]
          },
          {
            phase: 'Resolution',
            steps: [
              'Develop and test permanent fix',
              'Deploy fix following deployment runbook',
              'Monitor system stability post-fix'
            ]
          },
          {
            phase: 'Post-incident',
            steps: [
              'Document incident details',
              'Conduct post-mortem meeting',
              'Implement preventive measures',
              'Update runbooks and procedures'
            ]
          }
        ]
      }
    ];

    const incidentResponse = [
      {
        incident_type: 'Application Down',
        severity: 'Critical',
        response_time: '5 minutes',
        communication: {
          internal: 'Slack incident channel',
          external: 'Status page and email alerts',
          stakeholders: 'All customers and executives'
        },
        escalation: 'Immediate to engineering director',
        resolution_target: '1 hour'
      },
      {
        incident_type: 'Performance Degradation',
        severity: 'High',
        response_time: '15 minutes',
        communication: {
          internal: 'Engineering Slack channel',
          external: 'Status page',
          stakeholders: 'Product and engineering teams'
        },
        escalation: 'After 30 minutes without resolution',
        resolution_target: '2 hours'
      },
      {
        incident_type: 'Feature Not Working',
        severity: 'Medium',
        response_time: '30 minutes',
        communication: {
          internal: 'Engineering Slack channel',
          external: 'Support ticket response',
          stakeholders: 'Affected users and product team'
        },
        escalation: 'After 2 hours without resolution',
        resolution_target: '4 hours'
      }
    ];

    const monitoringGuides = [
      {
        title: 'Application Monitoring Guide',
        audience: 'engineering_team',
        sections: [
          {
            title: 'Key Metrics to Monitor',
            content: 'Response time, error rate, throughput, resource utilization'
          },
          {
            title: 'Alert Configuration',
            content: 'Setting up alerts for critical metrics and thresholds'
          },
          {
            title: 'Dashboard Navigation',
            content: 'How to use monitoring dashboards for troubleshooting'
          }
        ]
      },
      {
        title: 'Business Metrics Monitoring',
        audience: 'product_team',
        sections: [
          {
            title: 'Conversion Funnel Tracking',
            content: 'Monitoring user journey and conversion rates'
          },
          {
            title: 'A/B Test Monitoring',
            content: 'Tracking experiment performance and statistical significance'
          },
          {
            title: 'User Engagement Metrics',
            content: 'Session duration, page views, feature usage'
          }
        ]
      }
    ];

    const complianceDocuments = [
      {
        title: 'GDPR Compliance Guide',
        scope: 'data_protection',
        requirements: [
          'Data processing consent requirements',
          'User data access and deletion rights',
          'Data retention policies',
          'Privacy policy requirements'
        ],
        implementation: [
          'Consent management system',
          'Data anonymization procedures',
          'Audit logging for data access',
          'Regular compliance reviews'
        ]
      },
      {
        title: 'Security Compliance Framework',
        scope: 'information_security',
        standards: ['SOC 2', 'ISO 27001'],
        controls: [
          'Access control and authentication',
          'Encryption of sensitive data',
          'Regular security assessments',
          'Incident response procedures'
        ]
      }
    ];

    return {
      runbooks: runbooks,
      incident_response: incidentResponse,
      monitoring_guides: monitoringGuides,
      compliance_documents: complianceDocuments
    };
  }

  private async generateDeveloperDocumentation(input: DocumentationGenerationAgentInput): Promise<any> {
    const diagramGeneration = await this.executeSkill('diagram-generation', {
      diagram_type: 'architecture',
      content: input.project_structure,
      format: 'mermaid'
    });

    const codebaseOverview = {
      architecture: {
        pattern: 'Component-based architecture',
        framework: 'Next.js 13+ with App Router',
        styling: 'Tailwind CSS',
        state_management: 'React hooks and context',
        data_fetching: 'Server components and API routes'
      },
      directory_structure: {
        'app/': 'Next.js app router pages and layouts',
        'components/': 'Reusable React components',
        'lib/': 'Utility functions and configurations',
        'styles/': 'Global styles and Tailwind config',
        'public/': 'Static assets',
        'packages/': 'Monorepo packages and agents'
      },
      key_components: [
        {
          name: 'Agent System',
          purpose: 'AI-powered content and optimization agents',
          location: 'packages/agents/',
          technologies: ['TypeScript', 'AI/ML integrations']
        },
        {
          name: 'Orchestrator',
          purpose: 'Coordinates agent execution and pipeline management',
          location: 'packages/orchestrator/',
          technologies: ['TypeScript', 'Workflow management']
        },
        {
          name: 'Shared Schema',
          purpose: 'Common data structures and validation',
          location: 'packages/schemas/',
          technologies: ['JSON Schema', 'TypeScript interfaces']
        }
      ],
      data_flow: {
        description: 'Request flows from user through agents to final output',
        diagram: diagramGeneration.content
      }
    };

    const developmentSetup = {
      prerequisites: [
        'Node.js 18.0 or higher',
        'npm or yarn package manager',
        'Git version control',
        'Code editor (VS Code recommended)'
      ],
      installation: [
        'Clone the repository: git clone <repo-url>',
        'Install dependencies: npm install',
        'Set up environment: cp .env.example .env.local',
        'Start development server: npm run dev'
      ],
      development_workflow: {
        branching_strategy: 'Git Flow with feature branches',
        code_review: 'Pull request required for all changes',
        testing: 'Unit tests required, integration tests recommended',
        deployment: 'Automated CI/CD with staging and production'
      },
      local_development: {
        scripts: {
          'npm run dev': 'Start development server',
          'npm run build': 'Build for production',
          'npm run test': 'Run test suite',
          'npm run lint': 'Code linting and formatting'
        },
        debugging: {
          browser_dev_tools: 'React DevTools for component debugging',
          server_logs: 'Check terminal for server-side logs',
          network_tab: 'Monitor API calls and responses'
        }
      }
    };

    const testingGuides = [
      {
        title: 'Unit Testing Guide',
        scope: 'individual_functions_components',
        framework: 'Jest + React Testing Library',
        coverage_target: '80%',
        setup: [
          'Test files alongside source files with .test.ts extension',
          'Use describe() blocks to group related tests',
          'Use it() or test() for individual test cases',
          'Mock external dependencies and API calls'
        ],
        best_practices: [
          'Test component behavior, not implementation details',
          'Use meaningful test descriptions',
          'Keep tests fast and isolated',
          'Test error conditions and edge cases'
        ]
      },
      {
        title: 'Integration Testing Guide',
        scope: 'component_interactions_api_calls',
        framework: 'Playwright for E2E, Jest for API tests',
        coverage_target: '70%',
        setup: [
          'E2E tests in e2e/ directory',
          'API tests in __tests__/api/ directory',
          'Use test data factories for consistent test data',
          'Set up test database for integration tests'
        ],
        best_practices: [
          'Test user journeys, not just individual components',
          'Use realistic test data and scenarios',
          'Test both success and failure paths',
          'Monitor test performance and fix slow tests'
        ]
      },
      {
        title: 'Performance Testing Guide',
        scope: 'application_performance_scalability',
        tools: ['Lighthouse', 'WebPageTest', 'k6'],
        metrics: ['First Contentful Paint', 'Largest Contentful Paint', 'Cumulative Layout Shift'],
        setup: [
          'Run Lighthouse audits on each PR',
          'Set up performance budgets',
          'Monitor Core Web Vitals',
          'Regular performance regression testing'
        ]
      }
    ];

    const contributionGuidelines = {
      code_style: {
        typescript: 'Strict TypeScript with no any types',
        formatting: 'Prettier with consistent rules',
        linting: 'ESLint with React and TypeScript rules',
        imports: 'Absolute imports with path mapping'
      },
      commit_conventions: {
        format: 'type(scope): description',
        types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
        examples: [
          'feat(auth): add OAuth login support',
          'fix(api): resolve memory leak in user endpoint',
          'docs(readme): update installation instructions'
        ]
      },
      pull_request_process: {
        template: 'Use PR template with description, testing, and screenshots',
        reviewers: 'At least 2 approvals required for production code',
        checks: 'All CI checks must pass',
        merge_strategy: 'Squash and merge for feature branches'
      },
      release_process: {
        versioning: 'Semantic versioning (MAJOR.MINOR.PATCH)',
        changelog: 'Automatically generated from commit messages',
        deployment: 'Automated deployment to staging, manual to production',
        rollback: 'Feature flags and immediate rollback capability'
      }
    };

    return {
      codebase_overview: codebaseOverview,
      development_setup: developmentSetup,
      testing_guides: testingGuides,
      contribution_guidelines: contributionGuidelines
    };
  }

  protected calculateConfidence(output: DocumentationGenerationAgentOutput): number {
    let confidence = 0.85; // Base confidence

    if (output.technical_documentation?.api_documentation) confidence += 0.05;
    if (output.user_documentation?.user_guides?.length > 0) confidence += 0.05;
    if (output.operational_documentation?.runbooks?.length > 0) confidence += 0.05;
    if (output.developer_documentation?.codebase_overview) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: DocumentationGenerationAgentOutput): any {
    return {
      technical_docs_sections: Object.keys(output.technical_documentation || {}),
      user_docs_count: (output.user_documentation?.user_guides?.length || 0) +
                      (output.user_documentation?.faq_documents?.length || 0) +
                      (output.user_documentation?.video_tutorials?.length || 0),
      operational_docs_count: (output.operational_documentation?.runbooks?.length || 0) +
                             (output.operational_documentation?.incident_response?.length || 0) +
                             (output.operational_documentation?.monitoring_guides?.length || 0),
      developer_docs_sections: Object.keys(output.developer_documentation || {})
    };
  }
}