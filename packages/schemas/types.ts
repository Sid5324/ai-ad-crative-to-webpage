// packages/schemas/types.ts - TypeScript interfaces for all schemas
// Re-export from shared-envelope.ts for backward compatibility
export type { AgentEnvelope } from './shared-envelope';

export interface MemoryItem {
  memory_id: string;
  memory_type: 'request' | 'session' | 'brand' | 'agent' | 'qa' | 'trace';
  scope: string;
  agent_owner: string;
  content: any;
  summary: string;
  source_refs: string[];
  confidence: number;
  created_at: string;
  updated_at: string;
  ttl: string;
  tags: string[];
  permissions: {
    readable_by: string[];
    writable_by: string[];
  };
}

export interface SkillRegistry {
  agent_name: string;
  mandatory_skills: string[];
  optional_skills: string[];
  tool_bindings: Array<{
    skill: string;
    tool: string;
  }>;
}

// Agent-specific output types
export interface OrchestratorOutput {
  job_plan: string[];
  execution_graph: Array<{
    step: string;
    depends_on: string[];
  }>;
  retry_policy: {
    max_retries: number;
    repair_on_fail: boolean;
  };
}

export interface AdAnalyzerOutput {
  brand_name: string;
  ad_format: string;
  primary_hook: string;
  secondary_messages: string[];
  cta: string;
  audience_segments: string[];
  offer: string;
  tone: string[];
  visual_cues: string[];
}

export interface UrlBrandAnalyzerOutput {
  domain: string;
  brand_name?: string;
  industry: string;
  services: string[];
  facts: string[];
  trust_signals: string[];
  existing_sections: string[];
  brand_voice: string[];
  visual_identity: {
    primary_colors: string[];
    font_hints: string[];
    logo_style: string;
  };
}

export interface AudienceIntentOutput {
  primary_persona: string;
  funnel_stage: 'awareness' | 'consideration' | 'conversion';
  pain_points: string[];
  desired_outcomes: string[];
  objections: string[];
}

export interface PageStrategyOutput {
  page_goal: string;
  narrative_angle: string;
  section_order: string[];
  cta_strategy: string;
  must_include: string[];
  must_avoid: string[];
}

export interface CopyGeneratorOutput {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primary_cta: string;
    secondary_cta: string;
  };
  benefits: Array<{
    title: string;
    body: string;
    icon_hint: string;
  }>;
  stats: Array<{
    value: string;
    label: string;
    source_fact: string;
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
}

export interface OfferProofGuardOutput {
  approved_claims: string[];
  flagged_claims: Array<{
    claim: string;
    reason: string;
    action: 'remove' | 'rewrite' | 'needs_source';
  }>;
  safe_rewrites: Array<{
    original: string;
    rewrite: string;
  }>;
}

export interface DesignTokenOutput {
  theme_name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    display_font: string;
    body_font: string;
    tone: string;
  };
  radius_scale: 'tight' | 'balanced' | 'soft';
  shadow_style: 'minimal' | 'elevated' | 'dramatic';
}

export interface ComponentPlanOutput {
  page_id: string;
  components: Array<{
    component_type: string;
    variant: string;
    slot_map: any;
    visibility_rules: string[];
  }>;
}

export interface QAValidatorOutput {
  status: 'pass' | 'fail';
  issues: Array<{
    severity: 'low' | 'medium' | 'high';
    type: string;
    message: string;
    location: string;
    suggested_fix: string;
  }>;
}

export interface RepairAgentOutput {
  patches: Array<{
    target_component: string;
    field: string;
    old_value: string;
    new_value: string;
    reason: string;
  }>;
}