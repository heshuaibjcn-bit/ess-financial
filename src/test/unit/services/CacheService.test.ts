/**
 * Tests for CacheService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService, createCacheService } from '@/domain/services/CacheService';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import type { EngineResult } from '@/domain/services/CalculationEngine';

// Mock project input for testing
const createMockInput = (province: string = 'guangdong'): ProjectInput => ({
  province,
  systemSize: {
    capacity: 2,
    duration: 2,
  },
  costs: {
    batteryCostPerKwh: 1200,
    pcsCostPerKw: 300,
    emsCost: 100000,
    installationCostPerKw: 150,
    gridConnectionCost: 200000,
    landCost: 0,
    developmentCost: 150000,
    permittingCost: 50000,
    contingencyPercent: 0.05,
  },
  operatingParams: {
    systemEfficiency: 0.88,
    depthOfDischarge: 0.9,
    cyclesPerDay: 1.5,
    degradationRate: 0.02,
    availabilityPercent: 0.97,
  },
});

// Mock engine result for testing
const createMockResult = (irr: number = 8.5): EngineResult => ({
  projectId: 'test-project',
  irr,
  npv: 1000000,
  paybackPeriod: 5,
  annualCashFlows: [-100000, 50000, 75000, 100000, 125000, 150000],
  revenueBreakdown: {
    peakValleyArbitrage: 500000,
    capacityCompensation: 200000,
    demandResponse: 100000,
    auxiliaryServices: 50000,
  },
  costBreakdown: {
    initialInvestment: 1000000,
    annualOpeex: 50000,
    annualFinancing: 0,
  },
  totalInvestment: 1000000,
  levelizedCost: 0.8,
  capacityFactor: 0.15,
  calculatedAt: new Date(),
  calculationVersion: '1.0.0',
  validation: {
    valid: true,
    issues: [],
  },
  metrics: {
    irr,
    npv: 1000000,
    roi: 25,
    lcoc: 0.8,
    profitMargin: 20,
  },
});

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    // Create fresh cache for each test
    cache = new CacheService({
      maxSize: 10,
      ttl: 1000, // 1 second for faster tests
      enableRedis: false,
    });
  });

  describe('generateKey', () => {
    it('should generate consistent keys for same input', () => {
      const input = createMockInput('guangdong');
      const key1 = cache.generateKey(input);
      const key2 = cache.generateKey(input);

      expect(key1).toBe(key2);
      expect(key1).toHaveLength(64); // SHA-256 hex string
    });

    it('should generate different keys for different provinces', () => {
      const input1 = createMockInput('guangdong');
      const input2 = createMockInput('shandong');

      const key1 = cache.generateKey(input1);
      const key2 = cache.generateKey(input2);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const input1 = createMockInput('guangdong');
      const input2 = createMockInput('guangdong');
      input2.systemSize.capacity = 3; // Different capacity

      const key1 = cache.generateKey(input1);
      const key2 = cache.generateKey(input2);

      expect(key1).not.toBe(key2);
    });

    it('should include calculation options in key', () => {
      const input = createMockInput();
      const key1 = cache.generateKey(input, { discountRate: 0.08 });
      const key2 = cache.generateKey(input, { discountRate: 0.10 });

      expect(key1).not.toBe(key2);
    });
  });

  describe('get and set', () => {
    it('should store and retrieve values', async () => {
      const key = 'test-key';
      const result = createMockResult();

      await cache.set(key, result, 'guangdong');
      const retrieved = await cache.get(key);

      expect(retrieved).toEqual(result);
    });

    it('should return null for non-existent keys', async () => {
      const retrieved = await cache.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should track cache hits and misses', async () => {
      const key = 'test-key';
      const result = createMockResult();

      // Miss
      await cache.get(key);
      expect(cache.getStats().misses).toBe(1);

      // Set
      await cache.set(key, result, 'guangdong');

      // Hit
      await cache.get(key);
      expect(cache.getStats().hits).toBe(1);
    });

    it('should calculate hit rate correctly', async () => {
      const key = 'test-key';
      const result = createMockResult();

      await cache.set(key, result, 'guangdong');

      // 3 hits, 1 miss
      await cache.get(key);
      await cache.get(key);
      await cache.get(key);
      await cache.get('other-key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.75);
    });
  });

  describe('TTL (time-to-live)', () => {
    it('should expire entries after TTL', async () => {
      const key = 'test-key';
      const result = createMockResult();

      await cache.set(key, result, 'guangdong');

      // Should exist immediately
      let retrieved = await cache.get(key);
      expect(retrieved).not.toBeNull();

      // Wait for TTL to expire (1 second + small buffer)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      retrieved = await cache.get(key);
      expect(retrieved).toBeNull();
    });

    it('should not expire entries before TTL', async () => {
      const key = 'test-key';
      const result = createMockResult();

      await cache.set(key, result, 'guangdong');

      // Wait 500ms (half of TTL)
      await new Promise(resolve => setTimeout(resolve, 500));

      const retrieved = await cache.get(key);
      expect(retrieved).not.toBeNull();
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when at max size', async () => {
      const maxSize = 3;
      const smallCache = new CacheService({ maxSize });

      // Fill cache
      for (let i = 0; i < maxSize; i++) {
        const key = `key-${i}`;
        await smallCache.set(key, createMockResult(i), 'guangdong');
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(smallCache.getStats().size).toBe(maxSize);

      // Access key-1 and key-2 to make key-0 the LRU
      await smallCache.get('key-1');
      await smallCache.get('key-2');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Add one more (should evict LRU which is key-0)
      await smallCache.set('key-new', createMockResult(99), 'guangdong');

      expect(smallCache.getStats().size).toBe(maxSize);

      // First key should be evicted (it was LRU)
      const evicted = await smallCache.get('key-0');
      expect(evicted).toBeNull();

      // Others should still exist
      const key1 = await smallCache.get('key-1');
      const key2 = await smallCache.get('key-2');
      const newKey = await smallCache.get('key-new');

      expect(key1).not.toBeNull();
      expect(key2).not.toBeNull();
      expect(newKey).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all entries', async () => {
      await cache.set('key1', createMockResult(), 'guangdong');
      await cache.set('key2', createMockResult(), 'shandong');

      expect(cache.getStats().size).toBe(2);

      cache.clear();

      expect(cache.getStats().size).toBe(0);
      const stats = cache.getStats();
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
    });
  });

  describe('invalidateProvince', () => {
    it('should invalidate entries for specific province', async () => {
      await cache.set('key1', createMockResult(), 'guangdong');
      await cache.set('key2', createMockResult(), 'guangdong');
      await cache.set('key3', createMockResult(), 'shandong');

      const count = cache.invalidateProvince('guangdong');

      expect(count).toBe(2);
      expect(cache.getStats().size).toBe(1);

      const guangdong1 = await cache.get('key1');
      const guangdong2 = await cache.get('key2');
      const shandong = await cache.get('key3');

      expect(guangdong1).toBeNull();
      expect(guangdong2).toBeNull();
      expect(shandong).not.toBeNull();
    });
  });

  describe('invalidateOlderThan', () => {
    it('should invalidate entries older than specified time', async () => {
      await cache.set('key1', createMockResult(), 'guangdong');
      await cache.set('key2', createMockResult(), 'shandong');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      await cache.set('key3', createMockResult(), 'zhejiang');

      // Invalidate entries older than 50ms
      const count = cache.invalidateOlderThan(50);

      expect(count).toBe(2); // key1 and key2
      expect(cache.getStats().size).toBe(1); // Only key3 remains

      const key1 = await cache.get('key1');
      const key3 = await cache.get('key3');

      expect(key1).toBeNull();
      expect(key3).not.toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      await cache.set('key1', createMockResult(), 'guangdong');
      await cache.set('key2', createMockResult(), 'shandong');

      await cache.get('key1'); // hit
      await cache.get('key1'); // hit
      await cache.get('key2'); // hit
      await cache.get('key3'); // miss

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.75, 1);
      expect(stats.memoryEstimate).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeInstanceOf(Date);
      expect(stats.newestEntry).toBeInstanceOf(Date);
    });
  });

  describe('resetStats', () => {
    it('should reset hit/miss counters while preserving cache', async () => {
      await cache.set('key1', createMockResult(), 'guangdong');
      await cache.get('key1'); // hit
      await cache.get('key2'); // miss

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.size).toBe(1); // Cache still has data
    });
  });

  describe('getDebugInfo', () => {
    it('should return detailed debug information', async () => {
      await cache.set('key1', createMockResult(), 'guangdong');

      const debugInfo = cache.getDebugInfo();

      expect(debugInfo.config).toBeDefined();
      expect(debugInfo.stats).toBeDefined();
      expect(debugInfo.entries).toBeInstanceOf(Array);
      expect(debugInfo.entries.length).toBe(1);

      const entry = debugInfo.entries[0];
      expect(entry.key).toBeDefined();
      expect(entry.province).toBe('guangdong');
      expect(entry.accessCount).toBe(1);
      expect(entry.age).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createCacheService factory', () => {
    it('should create cache with custom config', () => {
      const customCache = createCacheService({
        maxSize: 100,
        ttl: 5000,
        enableRedis: false,
      });

      const debugInfo = customCache.getDebugInfo();
      expect(debugInfo.config.maxSize).toBe(100);
      expect(debugInfo.config.ttl).toBe(5000);
    });
  });

  describe('performance', () => {
    it('should handle rapid get/set operations efficiently', async () => {
      const iterations = 100;

      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const key = `key-${i}`;
        await cache.set(key, createMockResult(i), 'guangdong');
      }

      const setTime = Date.now() - startTime;

      // All operations should complete quickly (< 100ms for 100 operations)
      expect(setTime).toBeLessThan(100);

      const getStartTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const key = `key-${i}`;
        await cache.get(key);
      }

      const getTime = Date.now() - getStartTime;

      // Get operations should be fast
      expect(getTime).toBeLessThan(50);
    });
  });
});
