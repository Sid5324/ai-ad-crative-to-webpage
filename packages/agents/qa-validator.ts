// packages/agents/qa-validator.ts
import { BaseAgent } from './base-agent';
import { QAValidatorOutput } from '../schemas/types';

export interface QAValidatorInput {
  spec: any;
  adAnalysis: any;
  urlAnalysis: any;
}

export class QAValidatorAgent extends BaseAgent<QAValidatorInput, QAValidatorOutput> {
  constructor() {
    super({
      name: 'qa-validator',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request', 'qa'],
        write_scopes: ['request', 'qa'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'schema-validation',
          'CTA-consistency-checking',
          'content-completeness-checking',
          'alignment-checking',
          'issue-classification'
        ],
        optional: [
          'accessibility-linting',
          'readability-analysis'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: QAValidatorInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<QAValidatorOutput> {
    const { input } = context;

    // Validate component spec schema
    const schemaValidation = await this.validateSchema(input.spec);

    // Check CTA consistency
    const ctaValidation = await this.validateCTAConsistency(input);

    // Check content completeness
    const completenessValidation = await this.validateContentCompleteness(input);

    // Check alignment with original requirements
    const alignmentValidation = await this.validateAlignment(input);

    // Classify all issues
    const allIssues = [
      ...schemaValidation.issues,
      ...ctaValidation.issues,
      ...completenessValidation.issues,
      ...alignmentValidation.issues
    ];

    const classifiedIssues = await this.classifyIssues(allIssues);

    // Determine overall status
    const status = this.determineOverallStatus(classifiedIssues);

    return {
      status,
      issues: classifiedIssues
    };
  }

  private async validateSchema(spec: any): Promise<any> {
    const schemaValidation = await this.executeSkill('schema-validation', {
      data: spec,
      schema: this.getLandingPageSchema()
    });

    return {
      valid: schemaValidation.valid,
      issues: schemaValidation.errors?.map((error: any) => ({
        severity: 'high',
        type: 'schema_validation',
        message: error.message || 'Schema validation error',
        location: error.instancePath || 'root',
        suggested_fix: 'Fix data structure to match schema'
      })) || []
    };
  }

  private async validateCTAConsistency(input: QAValidatorInput): Promise<any> {
    const ctaValidation = await this.executeSkill('CTA-consistency-checking', {
      spec: input.spec,
      original_cta: input.adAnalysis?.cta,
      brand_voice: input.urlAnalysis?.brand_voice
    });

    return {
      consistent: ctaValidation.consistent,
      issues: ctaValidation.issues?.map((issue: any) => ({
        severity: issue.severity || 'medium',
        type: 'cta_consistency',
        message: issue.message || 'CTA consistency issue',
        location: issue.location || 'cta_section',
        suggested_fix: issue.fix || 'Align CTA with brand voice and original intent'
      })) || []
    };
  }

  private async validateContentCompleteness(input: QAValidatorInput): Promise<any> {
    const completenessValidation = await this.executeSkill('content-completeness-checking', {
      spec: input.spec,
      required_elements: this.getRequiredElements(input),
      audience: input.adAnalysis?.audience_segments
    });

    return {
      complete: completenessValidation.complete,
      issues: completenessValidation.missing_elements?.map((element: string) => ({
        severity: 'high',
        type: 'content_completeness',
        message: `Missing required content: ${element}`,
        location: 'content_structure',
        suggested_fix: `Add ${element} section to landing page`
      })) || []
    };
  }

  private async validateAlignment(input: QAValidatorInput): Promise<any> {
    const alignmentValidation = await this.executeSkill('alignment-checking', {
      spec: input.spec,
      ad_analysis: input.adAnalysis,
      brand_analysis: input.urlAnalysis,
      requirements: this.extractRequirements(input)
    });

    return {
      aligned: alignmentValidation.aligned,
      issues: alignmentValidation.issues?.map((issue: any) => ({
        severity: issue.severity || 'medium',
        type: 'alignment_issue',
        message: issue.message || 'Content not aligned with requirements',
        location: issue.location || 'general',
        suggested_fix: issue.fix || 'Adjust content to better match original requirements'
      })) || []
    };
  }

  private async classifyIssues(issues: any[]): Promise<any[]> {
    const classifiedIssues = [];

    for (const issue of issues) {
      const classification = await this.executeSkill('issue-classification', {
        issue: issue,
        context: 'landing_page_qa'
      });

      classifiedIssues.push({
        ...issue,
        severity: classification.severity || issue.severity,
        type: classification.type || issue.type
      });
    }

    return classifiedIssues;
  }

  private getLandingPageSchema(): any {
    return {
      type: 'object',
      required: ['page_id', 'components'],
      properties: {
        page_id: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            required: ['component_type', 'variant'],
            properties: {
              component_type: { type: 'string' },
              variant: { type: 'string' },
              slot_map: { type: 'object' },
              visibility_rules: { type: 'array' }
            }
          }
        }
      }
    };
  }

  private getRequiredElements(input: QAValidatorInput): string[] {
    const required = ['hero_section'];

    // Add based on ad analysis
    if (input.adAnalysis?.audience_segments?.includes('business_professionals')) {
      required.push('benefit_list', 'social_proof');
    }

    // Add based on brand analysis
    if (input.urlAnalysis?.services?.length > 0) {
      required.push('solution_showcase');
    }

    return required;
  }

  private extractRequirements(input: QAValidatorInput): any {
    return {
      primary_goal: input.adAnalysis?.cta || 'generate_leads',
      brand_voice: input.urlAnalysis?.brand_voice || [],
      audience_segments: input.adAnalysis?.audience_segments || [],
      industry: input.urlAnalysis?.industry || 'general'
    };
  }

  private determineOverallStatus(issues: any[]): 'pass' | 'fail' {
    const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
    const mediumSeverityIssues = issues.filter(issue => issue.severity === 'medium');

    if (highSeverityIssues.length > 0) {
      return 'fail';
    }

    if (mediumSeverityIssues.length > 3) {
      return 'fail';
    }

    return 'pass';
  }

  protected calculateConfidence(output: QAValidatorOutput): number {
    let confidence = 0.95; // Base confidence for validation

    if (output.status === 'pass') confidence += 0.05;
    if (output.issues && output.issues.length === 0) confidence += 0.05;
    if (output.issues && output.issues.every(issue => issue.severity !== 'high')) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: QAValidatorOutput): any {
    return {
      validation_status: output.status,
      issue_types: output.issues?.map(issue => issue.type) || [],
      severity_distribution: {
        high: output.issues?.filter(i => i.severity === 'high').length || 0,
        medium: output.issues?.filter(i => i.severity === 'medium').length || 0,
        low: output.issues?.filter(i => i.severity === 'low').length || 0
      }
    };
  }
}