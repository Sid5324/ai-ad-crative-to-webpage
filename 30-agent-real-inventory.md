# Actual Agent Inventory: 30 Agents

Based on the actual files in your `packages/agents/` directory, here are your **30 real agents**:

## Agent Inventory by Family

### 🔍 **Research Family (6 agents)**
1. `ad-analyzer` - Analyzes ad inputs (text/images)
2. `audience-intent` - Determines audience and intent
3. `url-brand-analyzer` - Analyzes target URLs and branding
4. `offer-proof-guard` - Validates offers and claims
5. `page-strategy` - Plans page structure and conversion
6. `component-plan-agent` - Plans component layout

### 📚 **Knowledge Family (4 agents)**
7. `copy-generator` - Generates landing page copy
8. `design-token-agent` - Generates design tokens
9. `component-renderer` - Renders components to HTML
10. `documentation-generation-agent` - Generates docs

### 🤖 **Automation Family (7 agents)**
11. `integration-agent` - Handles integrations
12. `integration-testing-agent` - Tests integrations
13. `end-to-end-testing-agent` - E2E testing
14. `performance-testing-agent` - Performance testing
15. `accessibility-testing-agent` - Accessibility testing
16. `health-check-agent` - System health monitoring
17. `deployment-prep-agent` - Prepares deployments

### 🛠️ **Engineering Family (5 agents)**
18. `performance-monitoring-agent` - Monitors performance
19. `performance-optimization-agent` - Optimizes performance
20. `error-tracking-agent` - Tracks errors
21. `analytics-integration-agent` - Integrates analytics
22. `feature-flag-agent` - Manages feature flags

### 📊 **Operations Family (4 agents)**
23. `production-deployment-agent` - Handles production deployment
24. `operations-management-agent` - Manages operations
25. `scaling-agent` - Handles scaling
26. `ab-testing-agent` - Manages A/B testing

### 🎯 **Governance Family (4 agents)**
27. `qa-validator` - Quality validation
28. `repair-agent` - Repairs issues
29. `handover-preparation-agent` - Prepares handovers
30. `agent-factory` - Creates agents (infrastructure)

## Real Upgrade Matrix

| # | Agent Name | Current Family | Primary Skills | Status | Upgrade Priority | Notes |
|---|------------|----------------|----------------|--------|------------------|--------|
| 1 | ad-analyzer | Research | ad analysis, image processing | ✅ Active | High | Needs vision integration |
| 2 | audience-intent | Research | audience analysis, intent detection | ✅ Active | Medium | Good foundation |
| 3 | url-brand-analyzer | Research | URL scraping, brand extraction | ✅ Active | High | Critical for personalization |
| 4 | offer-proof-guard | Research | claim validation, proof checking | ✅ Active | Medium | Important for trust |
| 5 | page-strategy | Research | strategy planning, layout decisions | ✅ Active | High | Core business logic |
| 6 | component-plan-agent | Research | component planning, layout | ✅ Active | Medium | Good for rendering |
| 7 | copy-generator | Knowledge | content generation, copywriting | ✅ Active | High | Main content engine |
| 8 | design-token-agent | Knowledge | design system, tokens | ✅ Active | High | Visual consistency |
| 9 | component-renderer | Knowledge | HTML rendering, templating | ✅ Active | High | Output generation |
| 10 | documentation-generation-agent | Knowledge | docs, API generation | ✅ Active | Low | Nice to have |
| 11 | integration-agent | Automation | API integration, workflows | ✅ Active | Medium | Cross-system work |
| 12 | integration-testing-agent | Automation | integration testing | ✅ Active | Low | Testing infra |
| 13 | end-to-end-testing-agent | Automation | E2E testing | ✅ Active | Low | Testing infra |
| 14 | performance-testing-agent | Automation | performance testing | ✅ Active | Low | Testing infra |
| 15 | accessibility-testing-agent | Automation | accessibility testing | ✅ Active | Low | Testing infra |
| 16 | health-check-agent | Automation | health monitoring | ✅ Active | Low | Ops monitoring |
| 17 | deployment-prep-agent | Automation | deployment prep | ✅ Active | Low | CI/CD helper |
| 18 | performance-monitoring-agent | Engineering | performance monitoring | ✅ Active | Medium | Real-time ops |
| 19 | performance-optimization-agent | Engineering | optimization | ✅ Active | Medium | Performance tuning |
| 20 | error-tracking-agent | Engineering | error tracking | ✅ Active | Medium | Debugging |
| 21 | analytics-integration-agent | Engineering | analytics | ✅ Active | Medium | Data collection |
| 22 | feature-flag-agent | Engineering | feature flags | ✅ Active | Low | Release management |
| 23 | production-deployment-agent | Operations | deployment | ✅ Active | Medium | Production ops |
| 24 | operations-management-agent | Operations | ops management | ✅ Active | Medium | Business ops |
| 25 | scaling-agent | Operations | scaling | ✅ Active | Low | Infrastructure |
| 26 | ab-testing-agent | Operations | A/B testing | ✅ Active | Medium | Experimentation |
| 27 | qa-validator | Governance | validation, QA | ✅ Active | Critical | Quality gate |
| 28 | repair-agent | Governance | error repair, fixes | ✅ Active | Critical | Recovery system |
| 29 | handover-preparation-agent | Governance | handover, docs | ✅ Active | Low | Team handoff |
| 30 | agent-factory | Governance | agent creation, management | ✅ Active | High | Agent lifecycle |

## Implementation Plan

### Phase 1: Foundation (✅ Complete)
- [x] Shared Skills Registry (30+ skills)
- [x] Agent Contracts (AgentResult<T>)
- [x] Schema Validation Layer
- [x] Routing System

### Phase 2: Core Research Agents (Priority: High)
1. **ad-analyzer** → Upgrade vision integration
2. **url-brand-analyzer** → Improve brand extraction  
3. **page-strategy** → Add strategy validation
4. **copy-generator** → Brand voice consistency
5. **component-renderer** → Better HTML generation

### Phase 3: Automation & Testing (Priority: Medium)
- Upgrade testing agents for better integration
- Improve monitoring and analytics agents
- Add proper error handling across automation

### Phase 4: Operations & Governance (Priority: Medium-High)
- Enhance QA and repair agents (critical)
- Improve deployment and operations agents
- Add proper handover and documentation

## Key Insights

1. **You have 30 real agents** (not 26 - I miscounted earlier)
2. **6 families** with good distribution across use cases
3. **Research & Knowledge agents** are your core business logic
4. **Governance agents** (QA, repair) are critical for quality
5. **Testing agents** are numerous but may be over-engineered

## Recommendation

Focus upgrade efforts on:
1. **Core 5 agents**: ad-analyzer, url-brand-analyzer, page-strategy, copy-generator, component-renderer
2. **Quality 2**: qa-validator, repair-agent
3. **Integration improvements** for the testing/monitoring agents

This gives you a production-ready system with the most impact for your landing page generation use case.

The foundation is solid - now let's upgrade the core agents with the new skills and contracts we built!