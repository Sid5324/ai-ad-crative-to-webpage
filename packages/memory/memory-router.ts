// packages/memory/memory-router.ts
import { MemoryItem, MemoryQuery, MemoryScope, MemoryStore, MemoryType } from './memory-types';
import { AgentEnvelope } from '../schemas/types';

export class MemoryRouter {
  constructor(private store: MemoryStore) {}

  /**
   * Get relevant memory for an agent based on its memory policy
   */
  async getRelevantMemory<T>(
    agentName: string,
    requestId: string,
    memoryPolicy: AgentEnvelope['memory_policy'],
    context?: any
  ): Promise<MemoryItem[]> {
    const { read_scopes, retrieval_mode } = memoryPolicy;

    if (retrieval_mode === 'none') {
      return [];
    }

    const queries: MemoryQuery[] = [];

    // Build queries based on read scopes
    for (const scope of read_scopes) {
      switch (scope) {
        case 'request':
          queries.push({
            scope: { type: 'request', request: requestId },
            limit: 50
          });
          break;

        case 'session':
          // Extract session from request context
          if (context?.sessionId) {
            queries.push({
              scope: { type: 'session', session: context.sessionId },
              limit: 20
            });
          }
          break;

        case 'brand':
          // Get brand-related memory
          queries.push({
            scope: { type: 'brand' },
            agent_owner: 'url-brand-analyzer', // Brand memory owned by URL analyzer
            limit: 30
          });
          break;

        case 'agent':
          // Agent-specific memory
          queries.push({
            scope: { type: 'agent', agent: agentName },
            limit: 10
          });
          break;

        case 'qa':
          // QA validation memory
          queries.push({
            scope: { type: 'qa' },
            limit: 15
          });
          break;

        default:
          // Custom scope
          queries.push({
            scope: { type: 'request', request: requestId },
            tags: [scope],
            limit: 20
          });
      }
    }

    // Execute queries and filter results
    const results: MemoryItem[] = [];
    for (const query of queries) {
      try {
        const items = await this.store.retrieve(query);
        // Filter by permissions
        const accessible = items.filter(item => canRead(item, agentName));
        results.push(...accessible);
      } catch (error) {
        console.warn(`Memory query failed for ${agentName}:`, error);
      }
    }

    // If selective mode, prioritize by relevance and recency
    if (retrieval_mode === 'selective') {
      return this.rankAndLimit(results, 20, context);
    }

    return results.slice(0, 50); // Hard limit for required mode
  }

  /**
   * Store memory with proper permissions
   */
  async storeMemory(
    agentName: string,
    scope: MemoryScope,
    content: any,
    summary: string,
    tags: string[] = [],
    confidence: number = 0.8
  ): Promise<MemoryItem> {
    const memory = await this.store.store({
      memory_type: scope.type,
      scope: scope.agent || scope.request || 'global',
      agent_owner: agentName,
      content,
      summary,
      source_refs: [],
      confidence,
      ttl: this.getTTL(scope.type),
      tags,
      permissions: this.getPermissions(scope.type, agentName)
    });

    return memory;
  }

  /**
   * Update memory item
   */
  async updateMemory(memoryId: string, updates: Partial<MemoryItem>): Promise<MemoryItem | null> {
    return this.store.update(memoryId, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Rank and limit memory results by relevance
   */
  private rankAndLimit(items: MemoryItem[], limit: number, context?: any): MemoryItem[] {
    // Simple ranking: confidence * recency score
    const now = new Date().getTime();

    const ranked = items.map(item => {
      const ageMs = now - new Date(item.created_at).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - (ageDays / 30)); // Decay over 30 days

      return {
        item,
        score: item.confidence * recencyScore
      };
    });

    return ranked
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.item);
  }

  /**
   * Get TTL for different memory types
   */
  private getTTL(memoryType: MemoryType): string {
    switch (memoryType) {
      case 'request': return '1h';    // Short-lived request context
      case 'session': return '24h';   // Session duration
      case 'brand': return '168h';    // 1 week for brand knowledge
      case 'agent': return '720h';    // 30 days for agent learning
      case 'qa': return '48h';        // 2 days for QA patterns
      case 'trace': return '336h';    // 2 weeks for execution traces
      default: return '24h';
    }
  }

  /**
   * Get permissions for different memory types
   */
  private getPermissions(memoryType: MemoryType, agentName: string): MemoryItem['permissions'] {
    const basePermissions = {
      readable_by: [agentName],
      writable_by: [agentName]
    };

    switch (memoryType) {
      case 'request':
        return {
          readable_by: ['*'], // All agents can read request context
          writable_by: [agentName, 'orchestrator']
        };

      case 'session':
        return {
          readable_by: ['orchestrator', 'page-strategy', 'qa-validator', 'repair-agent'],
          writable_by: ['orchestrator']
        };

      case 'brand':
        return {
          readable_by: ['url-brand-analyzer', 'copy-generator', 'design-token-agent', 'audience-intent', 'page-strategy'],
          writable_by: ['url-brand-analyzer']
        };

      case 'agent':
        return basePermissions; // Private to agent

      case 'qa':
        return {
          readable_by: ['qa-validator', 'repair-agent', 'orchestrator'],
          writable_by: ['qa-validator', 'repair-agent']
        };

      case 'trace':
        return {
          readable_by: ['orchestrator'],
          writable_by: ['orchestrator']
        };

      default:
        return basePermissions;
    }
  }
}

// Helper function for permission checking (imported from memory-types)
function canRead(memory: MemoryItem, agentName: string): boolean {
  return memory.permissions.readable_by.includes(agentName) ||
         memory.permissions.readable_by.includes('*');
}