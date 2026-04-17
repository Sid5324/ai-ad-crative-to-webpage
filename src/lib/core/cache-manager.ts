// src/lib/core/cache-manager.ts - Intelligent Caching System
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
  strategy: 'lru' | 'lfu' | 'fifo';
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private options: CacheOptions;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      strategy: 'lru',
      ...options
    };
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // Evict if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      hits: 0,
      lastAccessed: Date.now()
    });
  }

  async invalidate(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidate by pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; hitRate: number; entries: any[] } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalAccesses = entries.length;

    return {
      size: this.cache.size,
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      entries: entries.map(entry => ({
        age: Date.now() - entry.timestamp,
        hits: entry.hits,
        ttl: entry.ttl
      }))
    };
  }

  private evict(): void {
    if (this.options.strategy === 'lru') {
      this.evictLRU();
    } else if (this.options.strategy === 'lfu') {
      this.evictLFU();
    } else {
      this.evictFIFO();
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictLFU(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private evictFIFO(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }
}

// Specialized caches for different operations
export class VisionAnalysisCache extends CacheManager {
  constructor() {
    super({ ttl: 10 * 60 * 1000, maxSize: 50 }); // 10 minutes for vision analysis
  }

  async getVisionResult(imageUrl: string): Promise<any> {
    return this.get(`vision:${imageUrl}`);
  }

  async setVisionResult(imageUrl: string, result: any): Promise<void> {
    return this.set(`vision:${imageUrl}`, result);
  }
}

export class BrandExtractionCache extends CacheManager {
  constructor() {
    super({ ttl: 30 * 60 * 1000, maxSize: 200 }); // 30 minutes for brand data
  }

  async getBrandData(domain: string): Promise<any> {
    return this.get(`brand:${domain}`);
  }

  async setBrandData(domain: string, data: any): Promise<void> {
    return this.set(`brand:${domain}`, data);
  }
}

export class ContentGenerationCache extends CacheManager {
  constructor() {
    super({ ttl: 15 * 60 * 1000, maxSize: 100 }); // 15 minutes for generated content
  }

  createKey(input: any, personality: any): string {
    // Create deterministic key from input and personality
    const inputHash = JSON.stringify(input).slice(0, 100);
    const personalityHash = JSON.stringify(personality).slice(0, 50);
    return `content:${inputHash}:${personalityHash}`;
  }

  async getContent(input: any, personality: any): Promise<any> {
    const key = this.createKey(input, personality);
    return this.get(key);
  }

  async setContent(input: any, personality: any, content: any): Promise<void> {
    const key = this.createKey(input, personality);
    return this.set(key, content);
  }
}

// Global cache instances
export const visionCache = new VisionAnalysisCache();
export const brandCache = new BrandExtractionCache();
export const contentCache = new ContentGenerationCache();