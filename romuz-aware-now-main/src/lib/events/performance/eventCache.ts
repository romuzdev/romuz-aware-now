/**
 * Event Caching System
 * 
 * Caches frequently accessed event data to reduce database queries
 */

import type { SystemEvent } from '../event.types';

interface CacheConfig {
  maxSize: number;
  ttlMs: number;
  enableCache: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

export class EventCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();

  private config: CacheConfig = {
    maxSize: 1000,
    ttlMs: 5 * 60 * 1000, // 5 minutes
    enableCache: true,
  };

  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    if (!this.config.enableCache) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.stats.hits++;

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T): void {
    if (!this.config.enableCache) {
      return;
    }

    // Check size limit
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    let leastHits = Infinity;

    // Find entry with oldest timestamp and least hits
    this.cache.forEach((entry, key) => {
      if (entry.hits < leastHits || (entry.hits === leastHits && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        leastHits = entry.hits;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.config.ttlMs) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Global event cache instance
 */
export const eventCache = new EventCache<SystemEvent>({
  maxSize: 1000,
  ttlMs: 5 * 60 * 1000,
});

/**
 * Cache key generators
 */
export const CacheKeys = {
  event: (eventId: string) => `event:${eventId}`,
  eventsByType: (eventType: string, limit: number) => `events:type:${eventType}:${limit}`,
  eventsByCategory: (category: string, limit: number) => `events:category:${category}:${limit}`,
  recentEvents: (limit: number) => `events:recent:${limit}`,
};
