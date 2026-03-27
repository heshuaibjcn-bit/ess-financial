/**
 * Benchmark Service Interface
 *
 * Defines the contract for benchmarking and comparison analysis.
 */

import type { ProjectInput } from '../../schemas/ProjectSchema';
import type {
  BenchmarkComparison,
  BenchmarkFilter,
  BenchmarkDatabaseSummary,
  BenchmarkQuality,
} from '../../models/Benchmark';
import type { CalculationResult } from '../../models/CalculationResult';

export interface IBenchmarkService {
  /**
   * Compare a project against industry benchmarks
   * @param projectInput - Project input parameters
   * @param calculationResult - Calculation result for the project
   * @param options - Comparison options
   * @returns Promise<BenchmarkComparison>
   */
  compare(
    projectInput: ProjectInput,
    calculationResult: CalculationResult,
    options?: {
      minSampleSize?: number;
      includeRecommendations?: boolean;
      filter?: Partial<BenchmarkFilter>;
    }
  ): Promise<BenchmarkComparison>;

  /**
   * Get comparable projects for a given filter
   * @param filter - Benchmark filter criteria
   * @returns Promise<BenchmarkProject[]>
   */
  getComparables(filter: BenchmarkFilter): Promise<{
    projects: Array<{
      id: string;
      province: string;
      capacity: number;
      irr: number;
      paybackPeriod: number;
      source: string;
    }>;
    total: number;
  }>;

  /**
   * Get percentile rankings for a project's metrics
   * @param projectInput - Project input parameters
   * @param calculationResult - Calculation result
   * @returns Promise<PercentileRankings>
   */
  getPercentileRankings(
    projectInput: ProjectInput,
    calculationResult: CalculationResult
  ): Promise<{
    irr: number; // 0-100
    npv: number;
    paybackPeriod: number;
    investmentPerKw: number;
  }>;

  /**
   * Identify key performance drivers
   * @param projectInput - Project input parameters
   * @param calculationResult - Calculation result
   * @returns Promise<PerformanceDrivers>
   */
  identifyDrivers(
    projectInput: ProjectInput,
    calculationResult: CalculationResult
  ): Promise<Array<{
    variable: string;
    projectValue: number;
    benchmarkMedian: number;
    difference: number; // %
    impact: number; // % impact on IRR
    rating: 'above-average' | 'average' | 'below-average';
  }>>;

  /**
   * Get benchmark database summary
   * @returns Promise<BenchmarkDatabaseSummary>
   */
  getDatabaseSummary(): Promise<BenchmarkDatabaseSummary>;

  /**
   * Get benchmark quality metrics
   * @returns Promise<BenchmarkQuality>
   */
  getQualityMetrics(): Promise<BenchmarkQuality>;

  /**
   * Add a benchmark project to database
   * @param project - Benchmark project data
   * @returns Promise<BenchmarkProject>
   */
  addBenchmarkProject(project: {
    province: string;
    capacity: number;
    irr: number;
    totalInvestment: number;
    source: string;
    [key: string]: any;
  }): Promise<{
    id: string;
    addedAt: Date;
  }>;

  /**
   * Export benchmark comparison
   * @param comparison - Benchmark comparison result
   * @param format - Export format
   * @returns Promise<Blob | string>
   */
  exportComparison(
    comparison: BenchmarkComparison,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<Blob | string>;
}
