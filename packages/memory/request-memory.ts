// packages/memory/request-memory.ts - In-memory store for Phase 1
import { MemoryItem, MemoryStore, MemoryQuery } from './memory-types';

export class InMemoryStore implements MemoryStore {
  private memoryStore = new Map<string, MemoryItem>();
  private idCounter = 0;

  async store(memory: Omit<MemoryItem, 'memory_id' | 'created_at' | 'updated_at'>): Promise<MemoryItem> {
    const memoryId = `mem_${++this.idCounter}`;
    const now = new Date().toISOString();

    const fullMemory: MemoryItem = {
      ...memory,
      memory_id: memoryId,
      created_at: now,
      updated_at: now
    };

    this.memoryStore.set(memoryId, fullMemory);
    return fullMemory;
  }

  async retrieve(query: MemoryQuery): Promise<MemoryItem[]> {
    const results = Array.from(this.memoryStore.values());

    // Filter by scope
    let filtered = results.filter(item => {
      if (query.scope.type !== item.memory_type) return false;

      switch (query.scope.type) {
        case 'request':
          return item.scope === query.scope.request;
        case 'session':
          return item.scope === query.scope.session;
        case 'brand':
          return item.memory_type === 'brand';
        case 'agent':
          return item.agent_owner === query.scope.agent;
        default:
          return true;
      }
    });

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter(item =>
        query.tags!.some(tag => item.tags.includes(tag))
      );
    }

    // Filter by agent owner
    if (query.agent_owner) {
      filtered = filtered.filter(item => item.agent_owner === query.agent_owner);
    }

    // Sort and limit
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'desc';

    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof MemoryItem];
      const bVal = b[sortBy as keyof MemoryItem];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        const aTime = new Date(aVal as string).getTime();
        const bTime = new Date(bVal as string).getTime();
        return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      }

      return 0;
    });

    const limit = query.limit || 50;
    return filtered.slice(0, limit);
  }

  async update(memoryId: string, updates: Partial<MemoryItem>): Promise<MemoryItem | null> {
    const existing = this.memoryStore.get(memoryId);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.memoryStore.set(memoryId, updated);
    return updated;
  }

  async delete(memoryId: string): Promise<boolean> {
    return this.memoryStore.delete(memoryId);
  }

  async cleanup(): Promise<number> {
    const now = new Date().getTime();
    let cleaned = 0;

    for (const [id, memory] of Array.from(this.memoryStore.entries())) {
      const ttl = this.parseTTL(memory.ttl);
      if (ttl > 0) {
        const created = new Date(memory.created_at).getTime();
        if (now - created > ttl) {
          this.memoryStore.delete(id);
          cleaned++;
        }
      }
    }

    return cleaned;
  }

  private parseTTL(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 0;

    const [, num, unit] = match;
    const value = parseInt(num);

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  }
}

// Export singleton instance
export const inMemoryStore = new InMemoryStore();