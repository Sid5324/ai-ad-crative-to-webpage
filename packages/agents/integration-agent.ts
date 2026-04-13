// packages/agents/integration-agent.ts
import { BaseAgent } from './base-agent';

export interface IntegrationAgentInput {
  rendered_components: any;
  page_layout: any;
  metadata: any;
  project_structure: any;
}

export interface IntegrationAgentOutput {
  files_created: Array<{
    file_path: string;
    file_type: 'component' | 'page' | 'style' | 'config' | 'util';
    content: string;
    dependencies: string[];
  }>;
  project_updates: {
    package_json_updates: any;
    next_config_updates: any;
    tailwind_config_updates: any;
  };
  integration_summary: {
    total_files: number;
    components_integrated: number;
    pages_created: number;
    styles_generated: number;
    build_ready: boolean;
  };
}

export class IntegrationAgent extends BaseAgent<IntegrationAgentInput, IntegrationAgentOutput> {
  constructor() {
    super({
      name: 'integration-agent',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request'],
        write_scopes: ['request'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'nextjs-integration',
          'file-structure-optimization',
          'dependency-management'
        ],
        optional: [
          'build-configuration',
          'typescript-integration'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: IntegrationAgentInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<IntegrationAgentOutput> {
    const { input } = context;

    // Generate Next.js page structure
    const pageStructure = await this.generatePageStructure(input);

    // Create component files
    const componentFiles = await this.generateComponentFiles(input);

    // Generate global styles and configurations
    const styleFiles = await this.generateStyleFiles(input);

    // Create page files
    const pageFiles = await this.generatePageFiles(input, pageStructure);

    // Update project configuration
    const projectUpdates = await this.generateProjectUpdates(input);

    // Combine all files
    const allFiles = [...componentFiles, ...styleFiles, ...pageFiles];

    return {
      files_created: allFiles,
      project_updates: projectUpdates,
      integration_summary: {
        total_files: allFiles.length,
        components_integrated: componentFiles.length,
        pages_created: pageFiles.length,
        styles_generated: styleFiles.length,
        build_ready: this.isBuildReady(allFiles, projectUpdates)
      }
    };
  }

  private async generatePageStructure(input: IntegrationAgentInput): Promise<any> {
    const structureOptimization = await this.executeSkill('file-structure-optimization', {
      rendered_components: input.rendered_components,
      page_layout: input.page_layout,
      existing_structure: input.project_structure,
      framework: 'nextjs'
    });

    return {
      page_file: structureOptimization.page_file || 'app/page.tsx',
      component_directory: structureOptimization.component_directory || 'components/generated',
      styles_directory: structureOptimization.styles_directory || 'styles/generated',
      layout_structure: structureOptimization.layout_structure
    };
  }

  private async generateComponentFiles(input: IntegrationAgentInput): Promise<any[]> {
    const componentFiles = [];

    for (const component of input.rendered_components.components || []) {
      const componentIntegration = await this.executeSkill('nextjs-integration', {
        component_data: component,
        framework_version: '13+', // Next.js 13+
        typescript_enabled: true,
        styling_approach: 'tailwind'
      });

      componentFiles.push({
        file_path: `components/generated/${component.component_name}.tsx`,
        file_type: 'component',
        content: componentIntegration.component_code,
        dependencies: componentIntegration.dependencies || []
      });

      // Generate separate CSS file if needed
      if (component.code.css) {
        componentFiles.push({
          file_path: `styles/generated/${component.component_name}.module.css`,
          file_type: 'style',
          content: component.code.css,
          dependencies: []
        });
      }
    }

    return componentFiles;
  }

  private async generateStyleFiles(input: IntegrationAgentInput): Promise<any[]> {
    const styleFiles = [];

    // Generate global styles
    if (input.page_layout.global_styles) {
      styleFiles.push({
        file_path: 'styles/generated/globals.css',
        file_type: 'style',
        content: input.page_layout.global_styles,
        dependencies: []
      });
    }

    // Generate responsive utilities
    const responsiveStyles = await this.generateResponsiveStyles(input);
    if (responsiveStyles) {
      styleFiles.push({
        file_path: 'styles/generated/responsive.css',
        file_type: 'style',
        content: responsiveStyles,
        dependencies: []
      });
    }

    return styleFiles;
  }

  private async generatePageFiles(input: IntegrationAgentInput, pageStructure: any): Promise<any[]> {
    const pageFiles = [];

    // Generate main page file
    const pageContent = await this.generateMainPage(input, pageStructure);
    pageFiles.push({
      file_path: pageStructure.page_file,
      file_type: 'page',
      content: pageContent,
      dependencies: this.extractPageDependencies(input.rendered_components)
    });

    // Generate layout file if needed
    if (this.needsCustomLayout(input)) {
      const layoutContent = await this.generateLayoutFile(input);
      pageFiles.push({
        file_path: 'app/layout.tsx',
        file_type: 'config',
        content: layoutContent,
        dependencies: ['next/font', 'globals.css']
      });
    }

    return pageFiles;
  }

  private async generateProjectUpdates(input: IntegrationAgentInput): Promise<any> {
    const dependencyManagement = await this.executeSkill('dependency-management', {
      components: input.rendered_components.components || [],
      framework: 'nextjs',
      styling: 'tailwind',
      existing_dependencies: {} // Would be read from actual package.json
    });

    const buildConfiguration = await this.executeSkill('build-configuration', {
      component_count: input.rendered_components.components?.length || 0,
      framework: 'nextjs',
      optimization_level: 'production'
    });

    return {
      package_json_updates: dependencyManagement.package_json_updates || {},
      next_config_updates: buildConfiguration.next_config || {},
      tailwind_config_updates: buildConfiguration.tailwind_config || {}
    };
  }

  private async generateMainPage(input: IntegrationAgentInput, pageStructure: any): Promise<string> {
    const componentImports = input.rendered_components.components?.map(comp =>
      `import ${comp.component_name} from '../components/generated/${comp.component_name}';`
    ).join('\n') || '';

    const componentUsage = input.rendered_components.components?.map(comp =>
      `<${comp.component_name} key="${comp.component_id}" {...${comp.component_name.toLowerCase()}Props} />`
    ).join('\n      ') || '';

    return `'use client';

import { Metadata } from 'next';
${componentImports}

export const metadata: Metadata = {
  title: 'Generated Landing Page',
  description: 'AI-generated landing page',
};

export default function HomePage() {
  // Component props would be passed from previous pipeline steps
  const heroProps = {};
  const featuresProps = {};
  const testimonialsProps = {};

  return (
    <main className="min-h-screen">
      ${componentUsage}
    </main>
  );
}`;
  }

  private async generateLayoutFile(input: IntegrationAgentInput): Promise<string> {
    return `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Generated Landing Page',
  description: 'AI-generated landing page with optimized performance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}`;
  }

  private async generateResponsiveStyles(input: IntegrationAgentInput): Promise<string> {
    // Generate responsive utility classes based on the layout
    return `/* Responsive utilities for generated components */

@media (max-width: 768px) {
  .mobile-stack {
    flex-direction: column;
  }

  .mobile-center {
    text-align: center;
  }

  .mobile-hide {
    display: none;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .tablet-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .desktop-wide {
    max-width: 1200px;
    margin: 0 auto;
  }
}`;
  }

  private extractPageDependencies(renderedComponents: any): string[] {
    const dependencies = new Set<string>();

    // Add Next.js dependencies
    dependencies.add('next');
    dependencies.add('react');

    // Add component-specific dependencies
    renderedComponents.components?.forEach((comp: any) => {
      comp.dependencies?.forEach((dep: string) => dependencies.add(dep));
    });

    return Array.from(dependencies);
  }

  private needsCustomLayout(input: IntegrationAgentInput): boolean {
    // Check if we need a custom layout based on components and styling
    return true; // For now, always generate a layout for consistency
  }

  private isBuildReady(files: any[], projectUpdates: any): boolean {
    // Check if all necessary files are created and configurations are updated
    const hasPageFile = files.some(f => f.file_type === 'page');
    const hasComponents = files.some(f => f.file_type === 'component');
    const hasStyles = files.some(f => f.file_type === 'style');

    return hasPageFile && hasComponents && hasStyles;
  }

  protected calculateConfidence(output: IntegrationAgentOutput): number {
    let confidence = 0.8; // Base confidence

    if (output.files_created && output.files_created.length > 0) confidence += 0.1;
    if (output.integration_summary?.build_ready) confidence += 0.05;
    if (output.project_updates?.package_json_updates) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: IntegrationAgentOutput): any {
    return {
      file_types: output.files_created?.map(f => f.file_type) || [],
      dependencies: output.files_created?.flatMap(f => f.dependencies) || [],
      integration_metrics: {
        files_created: output.integration_summary?.total_files,
        build_ready: output.integration_summary?.build_ready
      }
    };
  }
}