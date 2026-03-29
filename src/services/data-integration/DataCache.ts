/**
 * Data Cache - Intelligent Caching Layer for Data Integration
 *
 * Features:
 * - TTL-based expiration
 * - Pattern-based invalidation
 * - Cache warming strategies
 * - Memory management
 * - Cache statistics
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  totalEntries: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  metadata?: Record<string, any>;
}

/**
 * Data Cache Class
 */
export class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  private defaultTTL: number;
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(defaultTTL: number = 3600000, maxSize: number = 1000) {
    this.defaultTTL = defaultTTL; // 1 hour default
    this.maxSize = maxSize;

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;

    // Check if we need to evict entries
    this.evictIfNeeded();

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      metadata: options.metadata
    };

    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.stats.hits++;

    return entry.value as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return !this.isExpired(entry);
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidate(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string'
      ? new RegExp(pattern)
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      evictions: this.stats.evictions,
      totalEntries: this.cache.size
    };
  }

  /**
   * Warm the cache with pre-loaded data
   */
  async warmup<T>(
    keys: string[],
    loader: (key: string) => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    console.log(`[DataCache] Warming up ${keys.length} cache entries`);

    // Load in parallel with concurrency limit
    const concurrency = 10;
    for (let i = 0; i < keys.length; i += concurrency) {
      const batch = keys.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (key) => {
          try {
            const value = await loader(key);
            this.set(key, value, options);
          } catch (error) {
            console.error(`[DataCache] Failed to warm up key ${key}:`, error);
          }
        })
      );
    }

    console.log(`[DataCache] Cache warmup complete`);
  }

  /**
   * Get cache entries for inspection
   */
  getEntries(filter?: (key: string, entry: CacheEntry<any>) => boolean): Array<{
    key: string;
    entry: CacheEntry<any>;
  }> {
    const entries: Array<{ key: string; entry: CacheEntry<any> }> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!filter || filter(key, entry)) {
        entries.push({ key, entry });
      }
    }

    return entries;
  }

  /**
   * Export cache data for backup/migration
   */
  export(): Record<string, { value: any; ttl: number; metadata?: any }> {
    const exportData: Record<string, any> = {};

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        exportData[key] = {
          value: entry.value,
          ttl: entry.ttl,
          metadata: entry.metadata
        };
      }
    }

    return exportData;
  }

  /**
   * Import cache data from backup/migration
   */
  import(data: Record<string, { value: any; ttl: number; metadata?: any }>): void {
    for (const [key, item] of Object.entries(data)) {
      const entry: CacheEntry<any> = {
        value: item.value,
        timestamp: Date.now(),
        ttl: item.ttl,
        hits: 0,
        metadata: item.metadata
      };
      this.cache.set(key, entry);
    }
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    return age > entry.ttl;
  }

  /**
   * Evict entries if cache is full
   */
  private evictIfNeeded(): void {
    if (this.cache.size >= this.maxSize) {
      // Evict least recently used entries (based on hits)
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].hits - b[1].hits);

      // Evict 10% of entries
      const evictCount = Math.ceil(this.maxSize * 0.1);
      for (let i = 0; i < evictCount && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
        this.stats.evictions++;
      }

      console.log(`[DataCache] Evicted ${evictCount} entries`);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (this.isExpired(entry)) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[DataCache] Cleaned up ${cleaned} expired entries`);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Cache Manager - Manages multiple cache instances
 */
export class CacheManager {
  private caches: Map<string, DataCache> = new Map();

  createCache(name: string, defaultTTL?: number, maxSize?: number): DataCache {
    const cache = new DataCache(defaultTTL, maxSize);
    this.caches.set(name, cache);
    console.log(`[CacheManager] Created cache: ${name}`);
    return cache;
  }

  getCache(name: string): DataCache | undefined {
    return this.caches.get(name);
  }

  deleteCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.destroy();
      return this.caches.delete(name);
    }
    return false;
  }

  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};

    for (const [name, cache] of this.caches) {
      stats[name] = cache.getStats();
    }

    return stats;
  }

  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  destroyAll(): void {
    for (const cache of this.caches.values()) {
      cache.destroy();
    }
    this.caches.clear();
  }
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();

    // Create default caches
    cacheManagerInstance.createCache('policy', 3600000, 500); // 1 hour, 500 entries
    cacheManagerInstance.createCache('tariff', 86400000, 100); // 24 hours, 100 entries
    cacheManagerInstance.createCache('company', 7200000, 1000); // 2 hours, 1000 entries
  }

  return cacheManagerInstance;
}
