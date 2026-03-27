/**
 * CacheService - Advanced caching for calculation results
 *
 * Features:
 * - SHA-256 cache keys from input parameters
 * - In-memory cache with optional Redis persistence
 * - Cache statistics (hit rate, size, memory usage)
 * - TTL (time-to-live) support
 * - Cache invalidation on province data updates
 */

import { createHash } from 'crypto';
import type { ProjectInput } from '../schemas/ProjectSchema';
import type { EngineResult } from './CalculationEngine';

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number; // 0-1
  memoryEstimate: number; // bytes
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  result: EngineResult;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  keyHash: string; // SHA-256 hash for reference
  province: string; // For invalidation
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize?: number; // Maximum number of entries (default: 1000)
  ttl?: number; // Time-to-live in milliseconds (default: 1 hour)
  enableRedis?: boolean; // Enable Redis persistence (default: false)
  redisUrl?: string; // Redis connection URL
  redisKeyPrefix?: string; // Prefix for Redis keys (default: 'ess:calc:')
}

/**
 * Service for caching calculation results
 */
export class CacheService {
  private cache: Map<string, CacheEntry>;
  private stats: CacheStats;
  private config: Required<CacheConfig>;
  private redisClient: any | null; // Redis client (lazy loaded)

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.config = {
      maxSize: config.maxSize ?? 1000,
      ttl: config.ttl ?? 60 * 60 * 1000, // 1 hour
      enableRedis: config.enableRedis ?? false,
      redisUrl: config.redisUrl ?? 'redis://localhost:6379',
      redisKeyPrefix: config.redisKeyPrefix ?? 'ess:calc:',
    };
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
      memoryEstimate: 0,
      oldestEntry: null,
      newestEntry: null,
    };
    this.redisClient = null;
  }

  /**
   * Generate SHA-256 hash for cache key
   *
   * @param input - Project input
   * @param options - Calculation options
   * @returns SHA-256 hash hex string
   */
  generateKey(input: ProjectInput, options: { discountRate?: number; projectLifetime?: number } = {}): string {
    // Create deterministic string representation
    const keyData = {
      province: input.province,
      capacity: input.systemSize.capacity,
      duration: input.systemSize.duration,
      costs: input.costs,
      financing: input.financing,
      operatingParams: input.operatingParams,
      operatingCosts: input.operatingCosts,
      discountRate: options.discountRate ?? 0.08,
      projectLifetime: options.projectLifetime ?? 10,
    };

    // Sort keys for deterministic output
    const sortedKey = JSON.stringify(keyData, Object.keys(keyData).sort());
    const hash = createHash('sha256').update(sortedKey).digest('hex');
    return hash;
  }

  /**
   * Get cached result
   *
   * @param key - Cache key
   * @returns Cached result or null
   */
  async get(key: string): Promise<EngineResult | null> {
    // Check memory cache first
    const entry = this.cache.get(key);

    if (entry) {
      // Check TTL
      const now = new Date();
      const age = now.getTime() - entry.createdAt.getTime();

      if (age > this.config.ttl) {
        // Expired
        this.cache.delete(key);
        this.stats.misses++;
        this.updateStats();
        return null;
      }

      // Update access metadata
      entry.lastAccessed = now;
      entry.accessCount++;
      this.stats.hits++;
      this.updateStats();
      return entry.result;
    }

    // Check Redis if enabled
    if (this.config.enableRedis) {
      try {
        await this.initRedis();

        if (this.redisClient) {
          const redisKey = this.config.redisKeyPrefix + key;
          const data = await this.redisClient.get(redisKey);

          if (data) {
            const parsed = JSON.parse(data);
            const entry: CacheEntry = {
              result: parsed.result,
              createdAt: new Date(parsed.createdAt),
              lastAccessed: new Date(),
              accessCount: 1,
              keyHash: key,
              province: parsed.province,
            };

            // Store in memory cache
            this.cache.set(key, entry);
            this.stats.hits++;
            this.updateStats();
            return entry.result;
          }
        }
      } catch (error) {
        console.error('Redis get error:', error);
        // Fall through to miss
      }
    }

    this.stats.misses++;
    this.updateStats();
    return null;
  }

  /**
   * Set cache entry
   *
   * @param key - Cache key
   * @param result - Calculation result
   * @param province - Province slug for invalidation
   */
  async set(key: string, result: EngineResult, province: string): Promise<void> {
    const now = new Date();
    const entry: CacheEntry = {
      result,
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      keyHash: key,
      province,
    };

    // Check max size and evict if necessary (LRU)
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    // Store in memory
    this.cache.set(key, entry);

    // Store in Redis if enabled
    if (this.config.enableRedis) {
      try {
        await this.initRedis();

        if (this.redisClient) {
          const redisKey = this.config.redisKeyPrefix + key;
          const data = JSON.stringify({
            result,
            createdAt: entry.createdAt,
            province,
          });
          await this.redisClient.set(redisKey, data, 'PX', this.config.ttl);
        }
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }

    this.updateStats();
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.oldestEntry = null;
    this.stats.newestEntry = null;
    this.updateStats();
  }

  /**
   * Invalidate cache for a specific province
   *
   * @param province - Province slug
   */
  invalidateProvince(province: string): number {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.province === province) {
        this.cache.delete(key);
        count++;
      }
    }

    this.updateStats();
    return count;
  }

  /**
   * Invalidate cache entries older than specified time
   *
   * @param maxAge - Maximum age in milliseconds
   */
  invalidateOlderThan(maxAge: number): number {
    const now = new Date();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now.getTime() - entry.createdAt.getTime();
      if (age > maxAge) {
        this.cache.delete(key);
        count++;
      }
    }

    this.updateStats();
    return count;
  }

  /**
   * Get cache statistics
   *
   * @returns Current cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.hitRate = 0;
    this.updateStats();
  }

  /**
   * Get detailed cache information for debugging
   */
  getDebugInfo(): {
    config: typeof this.config;
    stats: CacheStats;
    entries: Array<{
      key: string;
      province: string;
      createdAt: Date;
      lastAccessed: Date;
      accessCount: number;
      age: number;
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 16) + '...', // Truncate for readability
      province: entry.province,
      createdAt: entry.createdAt,
      lastAccessed: entry.lastAccessed,
      accessCount: entry.accessCount,
      age: Date.now() - entry.createdAt.getTime(),
    }));

    return {
      config: this.config,
      stats: this.getStats(),
      entries,
    };
  }

  /**
   * Initialize Redis connection (lazy loading)
   */
  private async initRedis(): Promise<void> {
    if (!this.config.enableRedis || this.redisClient !== null) {
      return;
    }

    try {
      // Use Function constructor to avoid build-time import resolution
      // This is a safe pattern for optional peer dependencies
      const importRedis = new Function('return import("redis")');
      const redisModule = await importRedis();
      const { createClient } = redisModule;

      this.redisClient = createClient({ url: this.config.redisUrl });
      await this.redisClient.connect();
      console.log('Redis cache initialized');
    } catch (error) {
      console.warn('Redis not available, using in-memory cache only:', error instanceof Error ? error.message : error);
      this.redisClient = null;
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.hitRate =
      this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0;

    // Estimate memory usage (rough approximation)
    let memoryEstimate = 0;
    let oldest: Date | null = null;
    let newest: Date | null = null;

    for (const entry of this.cache.values()) {
      // Rough estimate: 1KB per entry + result size
      memoryEstimate += 1024 + JSON.stringify(entry.result).length * 2; // 2 bytes per char

      if (!oldest || entry.createdAt < oldest) {
        oldest = entry.createdAt;
      }
      if (!newest || entry.createdAt > newest) {
        newest = entry.createdAt;
      }
    }

    this.stats.memoryEstimate = memoryEstimate;
    this.stats.oldestEntry = oldest;
    this.stats.newestEntry = newest;
  }
}

/**
 * Singleton instance with default configuration
 */
export const cacheService = new CacheService();

/**
 * Create a new cache service with custom configuration
 */
export function createCacheService(config: CacheConfig): CacheService {
  return new CacheService(config);
}
