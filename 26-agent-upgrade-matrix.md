# 26-Agent Stack Upgrade Matrix
## Rolled Back with Improved Skills Architecture

### Agent Family Classification

| Family | Mission | Key Characteristics | Agents in Family |
|--------|---------|-------------------|------------------|
| **Research** | Find, verify, structure information | Web search, content analysis, evidence-based | 1-5 (Research agents) |
| **Knowledge** | RAG, retrieval, document understanding | Entity extraction, classification, Q&A | 6-10 (Analysis agents) |
| **Content** | Draft, rewrite, SEO, educational content | Tone adaptation, copy generation, personalization | 11-16 (Content agents) |
| **Automation** | Execute workflows across browser/API/files | Tool execution, integration, task automation | 17-21 (Action agents) |
| **Engineering** | Code, docs, repo support, dev workflows | Code generation, debugging, documentation | 22-24 (Code agents) |
| **Governance** | Validate, score, repair, approve, trace | Quality control, policy enforcement, oversight | 25-26 (Review agents) |

### 26-Agent Upgrade Matrix

| # | Agent Name | Family | Current Skills | Keep/Remove/Merge | New Skills Architecture | Upgrade Priority | Implementation Notes |
|---|------------|--------|----------------|-------------------|------------------------|------------------|---------------------|
| 1 | Web Researcher | Research | search, crawl, summarize | **Keep** | search_web, crawl_page, summarize_grounded, generate_citations | High | Add source ranking + citation schema |
| 2 | Deep Research Agent | Research | multi-step planning, synthesis | **Keep** | multi_step_planning, evidence_synthesis, confidence_calibration | High | Add task budget and stop criteria |
| 3 | URL Brand Analyzer | Research | scrape, metadata extract | **Keep** | scrape_url, extract_metadata, classify_content, validate_sources | High | Add browser snapshot + confidence scoring |
| 4 | Competitive Intel Agent | Research | compare pages, summarize | **Keep** | compare_sources, gap_analysis, competitive_matrix | Medium | Add evidence table output |
| 5 | Trend Scanner | Research | topic cluster, timeline | **Merge → Deep Research** | trend_clustering, timeline_analysis | Low | Skill only, no separate agent |
| 6 | Document RAG Agent | Knowledge | retrieve, chunk, answer | **Keep** | retrieve_chunks, rerank_chunks, answer_grounded | High | Add retrieval diagnostics |
| 7 | Contract Review Agent | Knowledge | clause extraction, risk flags | **Keep** | extract_clauses, risk_assessment, policy_validation | High | Add human review workflow |
| 8 | FAQ Extractor | Knowledge | extract Q/A, dedupe | **Merge → Document RAG** | faq_extraction, deduplication | Low | Skill only |
| 9 | Content Intelligence Agent | Knowledge | entity extraction, taxonomy | **Keep** | entity_extraction, taxonomy_classification, content_scoring | Medium | Add structured scoring schema |
| 10 | SQL/DB Agent | Knowledge | query generation, validate | **Keep** | sql_generation, query_validation, safe_execution | High | Add sandbox environment |
| 11 | SEO Writer | Content | keyword map, outline, rewrite | **Keep** | keyword_research, content_outlining, seo_optimization | High | Add factual grounding checks |
| 12 | Social Copy Agent | Content | hooks, short copy, variants | **Keep** | hook_generation, copy_variants, platform_adaptation | Medium | Add brand tone constraints |
| 13 | Landing Page Copy Agent | Content | hero, sections, CTA blocks | **Keep** | hero_generation, section_copy, cta_optimization | High | Add placeholder validation |
| 14 | Tutor Agent | Content | explain, quiz, personalize | **Keep** | concept_explanation, quiz_generation, learning_personalization | Medium | Add curriculum state memory |
| 15 | Email/Support Writer | Content | summarize, draft reply | **Keep** | case_summarization, response_drafting, intent_classification | Medium | Add approval gate before send |
| 16 | Ad Copy Agent | Content | ad angles, offer positioning | **Merge → Campaign Copy** | ad_angle_generation, offer_positioning | Low | Skill in Social + Landing agents |
| 17 | Browser Automation Agent | Automation | navigate, click, capture | **Keep** | browser_navigation, element_interaction, screenshot_capture | High | Add permissions + replay logs |
| 18 | API Workflow Agent | Automation | call APIs, transform payloads | **Keep** | api_integration, payload_transformation, workflow_orchestration | High | Add schema contracts + retry logic |
| 19 | File Processing Agent | Automation | read, transform, extract | **Keep** | file_parsing, data_transformation, export_formatting | Medium | Add file type validators |
| 20 | Email Action Agent | Automation | draft/send mail, ticket updates | **Merge → API Workflow** | email_dispatch, ticket_integration | Low | Workflow skill in API agent |
| 21 | Slack / Messaging Agent | Automation | post updates, alerts | **Merge → API Workflow** | message_dispatch, notification_routing | Low | Notification skill in API agent |
| 22 | Code Assistant Agent | Engineering | codegen, explain, refactor | **Keep** | code_generation, code_explanation, code_refactoring | High | Add repo-aware context |
| 23 | Repo Docs Agent | Engineering | docs summarize, changelogs | **Merge → Code Assistant** | documentation_generation, changelog_analysis | Low | Documentation skill in code agent |
| 24 | Bug Triage Agent | Engineering | classify bug, repro steps | **Keep** | bug_classification, reproduction_steps, priority_assessment | Medium | Add issue template enforcement |
| 25 | Validator / Repair Agent | Governance | schema validation, clean parse | **Keep** | schema_validation, output_repair, retry_logic | Critical | Make mandatory in every agent |
| 26 | Evaluator / Approval Agent | Governance | quality score, policy check | **Keep** | quality_scoring, policy_enforcement, approval_routing | Critical | Separate from generator agents |

### Shared Skills Registry

All agents inherit these foundational skills:

#### Discovery Skills
- `input_preflight`: Sanitize inputs, validate schemas, extract metadata
- `search_web`: Multi-engine search with deduplication
- `crawl_page`: Safe page crawling with rate limiting
- `extract_metadata`: Structured metadata extraction

#### Understanding Skills  
- `summarize_grounded`: Evidence-based summarization
- `extract_structured`: Schema-guided extraction
- `classify_content`: Taxonomy and intent classification
- `compare_sources`: Source comparison and gap analysis

#### Creation Skills
- `outline_generate`: Content structure planning
- `rewrite_with_constraints`: Tone and style adaptation
- `personalize_content`: Audience-tailored messaging
- `generate_variants`: Multiple option generation

#### Action Skills
- `browser_control`: Safe browser automation
- `api_call`: Typed API interactions
- `file_operations`: Secure file I/O
- `message_dispatch`: Cross-platform messaging

#### Control Skills
- `schema_validate`: Input/output validation
- `business_rule_check`: Domain-specific rules
- `repair_output`: Automatic error correction
- `human_escalation`: Low-confidence task routing

#### Memory Skills
- `memory_recall`: Context retrieval
- `entity_tracking`: Named entity persistence
- `preference_learning`: User pattern recognition
- `cache_management`: Intelligent result caching

#### Observability Skills
- `trace_log`: Structured event logging
- `performance_monitor`: Latency and cost tracking
- `confidence_score`: Calibrated uncertainty measurement
- `audit_trail`: Compliance and debugging logs

### Final Improved Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Request  │────│   Orchestrator   │────│   Task Router   │
│                 │    │   + Preflight    │    │   + Families    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                    ┌────────────────────────────────────┼────────────────────────────────────┐
                    │                                    │                                    │
            ┌───────▼──────┐                     ┌───────▼──────┐                     ┌───────▼──────┐
            │ Research     │                     │ Knowledge     │                     │ Content       │
            │ Agents       │                     │ Agents        │                     │ Agents        │
            │ (1-5 agents) │                     │ (6-10 agents) │                     │ (11-16 agents)│
            └───────▲──────┘                     └───────▲──────┘                     └───────▲──────┘
                    │                                    │                                    │
                    └────────────────────────────────────┼────────────────────────────────────┘
                                                         │
            ┌───────▼──────┐                     ┌───────▼──────┐                     ┌───────▼──────┐
            │ Automation   │                     │ Engineering   │                     │ Governance    │
            │ Agents       │                     │ Agents        │                     │ Agents        │
            │ (17-21 agents)│                     │ (22-24 agents)│                     │ (25-26 agents)│
            └───────▲──────┘                     └───────▲──────┘                     └───────▲──────┘
                    │                                    │                                    │
                    └────────────────────────────────────┼────────────────────────────────────┘
                                                         │
                    ┌────────────────────────────────────▼────────────────────────────────────┐
                    │                                                                 │
                    │                    Shared Skills Registry                           │
                    │                    (30+ versioned skills)                          │
                    │                                                                 │
                    └────────────────────────────────────▲────────────────────────────────────┘
                                                         │
                    ┌────────────────────────────────────▼────────────────────────────────────┐
                    │                                                                 │
                    │              Validation & Quality Gates                          │
                    │              (Schema + Business Rules + Repair)                 │
                    │                                                                 │
                    └────────────────────────────────────▲────────────────────────────────────┘
                                                         │
                    ┌────────────────────────────────────▼────────────────────────────────────┐
                    │                                                                 │
                    │                   Final Output Renderer                          │
                    │                   (Validated + Publishable)                      │
                    │                                                                 │
                    └─────────────────────────────────────────────────────────────────────────┘
```

### Implementation Roadmap

#### Phase 1: Foundation (Week 1-2)
- [ ] Create shared skills registry
- [ ] Implement agent contracts (AgentResult<T>)
- [ ] Add schema validation layer
- [ ] Deploy basic routing system

#### Phase 2: Core Families (Week 3-6)  
- [ ] Upgrade Research family (5 agents)
- [ ] Upgrade Knowledge family (5 agents)
- [ ] Add skill inheritance system
- [ ] Implement confidence scoring

#### Phase 3: Content & Automation (Week 7-10)
- [ ] Upgrade Content family (6 agents)
- [ ] Upgrade Automation family (5 agents)
- [ ] Add repair and retry logic
- [ ] Implement approval gates

#### Phase 4: Engineering & Governance (Week 11-12)
- [ ] Upgrade Engineering family (3 agents)
- [ ] Upgrade Governance family (2 agents)
- [ ] Add evaluation and human escalation
- [ ] Implement comprehensive logging

#### Phase 5: Production Hardening (Week 13-14)
- [ ] Add circuit breakers and rate limiting
- [ ] Implement comprehensive testing
- [ ] Add performance monitoring
- [ ] Deploy with feature flags

### Key Success Metrics

| Metric | Target | Current | Notes |
|--------|--------|---------|--------|
| Agent Contract Compliance | 100% | 0% | All agents must use AgentResult<T> |
| Skill Reuse Rate | >70% | ~20% | Shared skills across families |
| Quality Gate Pass Rate | >85% | ~60% | Automated validation success |
| Human Escalation Rate | <5% | ~15% | Low-confidence task routing |
| Mean Time to Agent Recovery | <30s | ~5m | Automated repair + retry |
| Cross-Agent Trace Coverage | 100% | 0% | End-to-end observability |

This upgraded architecture transforms your 26-agent stack from a collection of demos into a production-grade multi-agent system with proper governance, validation, and maintainability.</content>
<parameter name="filePath">D:\ai\imp\ai ad crative to webpage\26-agent-upgrade-matrix.md