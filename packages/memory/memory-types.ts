// packages/memory/memory-types.ts
import type { MemoryItem } from '../schemas/shared-envelope';
export type { MemoryItem };

export type MemoryType = 'request' | 'session' | 'brand' | 'agent' | 'qa' | 'trace';

export interface MemoryScope {
  type: MemoryType;
  agent?: string;
  request?: string;
  session?: string;
}

export interface MemoryQuery {
  scope: MemoryScope;
  tags?: string[];
  agent_owner?: string;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'confidence';
  sort_order?: 'asc' | 'desc';
}

export interface MemoryStore {
  store(memory: Omit<MemoryItem, 'memory_id' | 'created_at' | 'updated_at'>): Promise<MemoryItem>;
  retrieve(query: MemoryQuery): Promise<MemoryItem[]>;
  update(memoryId: string, updates: Partial<MemoryItem>): Promise<MemoryItem | null>;
  delete(memoryId: string): Promise<boolean>;
  cleanup(): Promise<number>; // Returns number of items cleaned up
}

// Memory permission helpers
export function canRead(memory: MemoryItem, agentName: string): boolean {
  return memory.permissions.readable_by.includes(agentName) ||
         memory.permissions.readable_by.includes('*');
}

export function canWrite(memory: MemoryItem, agentName: string): boolean {
  return memory.permissions.writable_by.includes(agentName) ||
         memory.permissions.writable_by.includes('*');
}

// Memory scope builders
export function requestScope(requestId: string): MemoryScope {
  return { type: 'request', request: requestId };
}

export function sessionScope(sessionId: string): MemoryScope {
  return { type: 'session', session: sessionId };
}

export function brandScope(brandId: string): MemoryScope {
  return { type: 'brand', agent: brandId };
}

export function agentScope(agentName: string): MemoryScope {
  return { type: 'agent', agent: agentName };
}