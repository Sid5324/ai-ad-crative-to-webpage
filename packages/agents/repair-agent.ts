// packages/agents/repair-agent.ts
import { BaseAgent } from './base-agent';
import { RepairAgentOutput } from '../schemas/types';

export interface RepairAgentInput {
  qa_results: any;
  original_spec: any;
  source_data: any;
}

export class RepairAgent extends BaseAgent<RepairAgentInput, RepairAgentOutput> {
  constructor() {
    super({
      name: 'repair-agent',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request', 'qa'],
        write_scopes: ['request', 'qa'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'targeted-rewriting',
          'component-patching',
          'claim-safe-replacement',
          'minimal-diff-repair'
        ],
        optional: [
          'auto-regression-testing'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: RepairAgentInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<RepairAgentOutput> {
    const { input } = context;

    if (input.qa_results.status === 'pass') {
      return { patches: [] };
    }

    // Prioritize issues by severity
    const prioritizedIssues = this.prioritizeIssues(input.qa_results.issues);

    // Generate repair patches
    const patches = await this.generateRepairPatches(prioritizedIssues, input);

    // Apply minimal diff repair to avoid over-correction
    const optimizedPatches = await this.optimizePatches(patches, input.original_spec);

    return {
      patches: optimizedPatches
    };
  }

  private prioritizeIssues(issues: any[]): any[] {
    const severityOrder = { high: 3, medium: 2, low: 1 };

    return issues.sort((a, b) =>
      (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
    );
  }

  private async generateRepairPatches(issues: any[], input: RepairAgentInput): Promise<any[]> {
    const patches = [];

    for (const issue of issues) {
      const patch = await this.generatePatchForIssue(issue, input);
      if (patch) {
        patches.push(patch);
      }
    }

    return patches;
  }

  private async generatePatchForIssue(issue: any, input: RepairAgentInput): Promise<any | null> {
    switch (issue.type) {
      case 'schema_validation':
        return this.generateSchemaFix(issue, input);

      case 'cta_consistency':
        return await this.generateCTAConsistencyFix(issue, input);

      case 'content_completeness':
        return await this.generateContentCompletenessFix(issue, input);

      case 'alignment_issue':
        return await this.generateAlignmentFix(issue, input);

      default:
        return null;
    }
  }

  private generateSchemaFix(issue: any, input: RepairAgentInput): any {
    // Fix schema validation issues
    if (issue.message.includes('required') && issue.message.includes('page_id')) {
      return {
        target_component: 'root',
        field: 'page_id',
        old_value: undefined,
        new_value: `page_repaired_${Date.now()}`,
        reason: 'Missing required page_id field'
      };
    }

    if (issue.message.includes('component_type')) {
      return {
        target_component: issue.location || 'unknown',
        field: 'component_type',
        old_value: null,
        new_value: 'content_section',
        reason: 'Missing component_type field'
      };
    }

    return null;
  }

  private async generateCTAConsistencyFix(issue: any, input: RepairAgentInput): Promise<any> {
    const ctaRewrite = await this.executeSkill('targeted-rewriting', {
      original_content: this.findCTAContent(input.original_spec),
      issue_description: issue.message,
      target_audience: input.source_data?.audience_segments,
      brand_voice: input.source_data?.brand_voice
    });

    return {
      target_component: 'cta_section',
      field: 'cta_text',
      old_value: this.findCTAContent(input.original_spec),
      new_value: ctaRewrite.rewritten_content,
      reason: 'CTA consistency issue fix'
    };
  }

  private async generateContentCompletenessFix(issue: any, input: RepairAgentInput): Promise<any> {
    const missingElement = issue.message.match(/Missing required content: (\w+)/)?.[1];

    if (!missingElement) return null;

    const componentPatch = await this.executeSkill('component-patching', {
      missing_element: missingElement,
      available_content: input.source_data,
      spec_structure: input.original_spec
    });

    return {
      target_component: 'page_structure',
      field: 'components',
      old_value: input.original_spec.components,
      new_value: [...input.original_spec.components, componentPatch.new_component],
      reason: `Added missing ${missingElement} component`
    };
  }

  private async generateAlignmentFix(issue: any, input: RepairAgentInput): Promise<any> {
    const alignmentFix = await this.executeSkill('claim-safe-replacement', {
      original_claim: this.findContentByLocation(issue.location, input.original_spec),
      issue: issue.message,
      source_facts: input.source_data?.facts || []
    });

    return {
      target_component: issue.location,
      field: 'content',
      old_value: this.findContentByLocation(issue.location, input.original_spec),
      new_value: alignmentFix.safe_replacement,
      reason: 'Alignment issue fix'
    };
  }

  private async optimizePatches(patches: any[], originalSpec: any): Promise<any[]> {
    const optimization = await this.executeSkill('minimal-diff-repair', {
      patches: patches,
      original_spec: originalSpec,
      repair_goals: ['maintain_structure', 'preserve_intent', 'ensure_validity']
    });

    return optimization.optimized_patches || patches;
  }

  private findCTAContent(spec: any): string {
    // Find CTA content in the spec
    const ctaComponent = spec.components?.find((c: any) =>
      c.component_type?.includes('cta') || c.component_type?.includes('call_to_action')
    );

    if (ctaComponent?.slot_map?.cta_text) {
      return ctaComponent.slot_map.cta_text;
    }

    // Fallback to search in all components
    for (const component of spec.components || []) {
      const slotMap = component.slot_map || {};
      for (const [key, value] of Object.entries(slotMap)) {
        if (key.includes('cta') && typeof value === 'string') {
          return value as string;
        }
      }
    }

    return 'Click Here';
  }

  private findContentByLocation(location: string, spec: any): string {
    // Find content at the specified location
    if (location === 'general' || !location) {
      return spec.page_id || 'general content';
    }

    const component = spec.components?.find((c: any) =>
      c.component_type === location ||
      c.variant === location ||
      `${c.component_type}_${c.variant}` === location
    );

    if (component) {
      const slotMap = component.slot_map || {};
      const contentValues = Object.values(slotMap).filter(v => typeof v === 'string');
      return contentValues.join(' ') || component.component_type;
    }

    return location;
  }

  protected calculateConfidence(output: RepairAgentOutput): number {
    let confidence = 0.9; // Base confidence for repair operations

    if (output.patches && output.patches.length === 0) confidence += 0.1; // No repairs needed
    if (output.patches && output.patches.length > 0) confidence -= 0.1; // Repairs applied, slightly lower confidence

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: RepairAgentOutput): any {
    return {
      repair_operations: output.patches?.map(p => p.target_component) || [],
      repair_types: output.patches?.map(p => p.field) || [],
      repair_count: output.patches?.length || 0
    };
  }
}