/**
 * Benchmark Repository Interface
 *
 * Defines the contract for benchmark project data access.
 */

import type {
  BenchmarkProject,
  BenchmarkFilter,
  BenchmarkDatabaseSummary,
} from '../../models/Benchmark';

export interface IBenchmarkRepository {
  /**
   * Find comparable projects based on filter
   */
  findComparables(filter: BenchmarkFilter): Promise<BenchmarkProject[]>;

  /**
   * Get benchmark project by ID
   */
  findById(id: string): Promise<BenchmarkProject | null>;

  /**
   * Get all benchmark projects
   */
  findAll(): Promise<BenchmarkProject[]>;

  /**
   * Add a benchmark project
   */
  add(project: BenchmarkProject): Promise<BenchmarkProject>;

  /**
   * Batch import benchmark projects
   */
  importMany(projects: BenchmarkProject[]): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }>;

  /**
   * Get database summary
   */
  getSummary(): Promise<BenchmarkDatabaseSummary>;

  /**
   * Get percentiles for a metric
   */
  getPercentiles(
    metric: 'irr' | 'npv' | 'paybackPeriod',
    filter?: BenchmarkFilter
  ): Promise<{
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    mean: number;
    stdDev: number;
  }>;

  /**
   * Get distribution data for visualization
   */
  getDistribution(
    metric: 'irr' | 'npv',
    filter?: BenchmarkFilter,
    bins?: number
  ): Promise<{
    min: number;
    max: number;
    bins: Array<{
      range: { min: number; max: number };
      count: number;
    }>;
  }>;

  /**
   * Update benchmark project
   */
  update(id: string, updates: Partial<BenchmarkProject>): Promise<BenchmarkProject>;

  /**
   * Delete benchmark project
   */
  delete(id: string): Promise<boolean>;

  /**
   * Get data version
   */
  getDataVersion(): Promise<string>;

  /**
   * Refresh benchmark data from source
   */
  refresh(): Promise<void>;
}
