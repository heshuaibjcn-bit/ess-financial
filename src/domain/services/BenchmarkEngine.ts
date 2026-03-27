/**
 * BenchmarkEngine - Industry comparison and percentile analysis
 *
 * Provides benchmarking capabilities for energy storage projects by:
 * - Filtering comparable projects (same province ±50% system size)
 * - Calculating percentile rankings
 * - Analyzing key performance drivers
 */

import { EngineResult, ProjectInput } from '../schemas';
import { ProvinceDataRepository } from '../repositories/ProvinceDataRepository';

// Benchmark project data structure
export interface BenchmarkProject {
  id: string;
  name: string;
  province: string;
  systemSize: number; // MW
  technology: string;
  irr: number; // %
  npv: number; // CNY
  paybackPeriod: number; // years
  batteryCost: number; // CNY/kWh
  systemEfficiency: number; // %
  cyclesPerDay: number;
  peakPrice: number; // CNY/kWh
  valleyPrice: number; // CNY/kWh
  completionDate: string;
  developer: string;
  operator: string;
}

// Benchmark comparison result
export interface BenchmarkComparison {
  // Input project metrics
  projectMetrics: {
    irr: number;
    npv: number;
    paybackPeriod: number;
    lcoe: number;
  };

  // Comparable projects
  comparableProjects: {
    count: number;
    projects: BenchmarkProject[];
  };

  // Percentile rankings (0-100)
  percentiles: {
    irr: number;
    npv: number;
    paybackPeriod: number;
    lcoe?: number;
  };

  // Distribution statistics
  distribution: {
    irr: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      mean: number;
      stdDev: number;
    };
    npv: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      mean: number;
    };
    paybackPeriod: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      mean: number;
    };
  };

  // Performance rating
  rating: {
    overall: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
    irr: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
    npv: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
    paybackPeriod: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
  };

  // Key performance drivers
  drivers: {
    factor: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }[];
}

export class BenchmarkEngine {
  private benchmarkData: BenchmarkProject[] = [];
  private repository: ProvinceDataRepository;

  constructor(repository?: ProvinceDataRepository) {
    this.repository = repository || new ProvinceDataRepository();
  }

  /**
   * Load benchmark data from JSON file
   */
  async loadBenchmarkData(): Promise<void> {
    try {
      const response = await fetch('/data/benchmark/projects.json');
      if (!response.ok) {
        throw new Error(`Failed to load benchmark data: ${response.statusText}`);
      }
      this.benchmarkData = await response.json();
    } catch (error) {
      console.error('Error loading benchmark data:', error);
      this.benchmarkData = [];
      throw error;
    }
  }

  /**
   * Compare project against industry benchmarks
   */
  async compare(
    input: ProjectInput,
    result: EngineResult
  ): Promise<BenchmarkComparison> {
    // Ensure benchmark data is loaded
    if (this.benchmarkData.length === 0) {
      await this.loadBenchmarkData();
    }

    // Filter comparable projects
    const comparableProjects = this.filterComparableProjects(input);

    // Calculate project metrics
    const projectMetrics = {
      irr: result.financials.irr || 0,
      npv: result.financials.npv,
      paybackPeriod: result.financials.paybackPeriod,
      lcoe: result.financials.lcoe,
    };

    // Calculate percentile rankings
    const percentiles = this.calculatePercentiles(projectMetrics, comparableProjects);

    // Calculate distribution statistics
    const distribution = this.calculateDistribution(comparableProjects);

    // Calculate performance rating
    const rating = this.calculateRating(percentiles);

    // Analyze key drivers
    const drivers = await this.analyzeDrivers(input, result, comparableProjects);

    return {
      projectMetrics,
      comparableProjects: {
        count: comparableProjects.length,
        projects: comparableProjects,
      },
      percentiles,
      distribution,
      rating,
      drivers,
    };
  }

  /**
   * Filter projects comparable to the input project
   * - Same province
   * - System size within ±50%
   */
  private filterComparableProjects(input: ProjectInput): BenchmarkProject[] {
    const provinceCode = input.province;
    const systemSize = input.systemSize.capacity;

    return this.benchmarkData.filter((project) => {
      // Same province
      if (project.province !== provinceCode) return false;

      // System size within ±50%
      const sizeRatio = project.systemSize / systemSize;
      if (sizeRatio < 0.5 || sizeRatio > 1.5) return false;

      return true;
    });
  }

  /**
   * Calculate percentile rankings for project metrics
   * Returns 0-100 percentile (higher is better for IRR/NPV, lower is better for payback)
   */
  private calculatePercentiles(
    metrics: BenchmarkComparison['projectMetrics'],
    projects: BenchmarkProject[]
  ): BenchmarkComparison['percentiles'] {
    if (projects.length === 0) {
      return { irr: 50, npv: 50, paybackPeriod: 50 };
    }

    const irrValues = projects.map((p) => p.irr).sort((a, b) => a - b);
    const npvValues = projects.map((p) => p.npv).sort((a, b) => a - b);
    const paybackValues = projects.map((p) => p.paybackPeriod).sort((a, b) => a - b);

    return {
      irr: this.getPercentile(metrics.irr, irrValues, 'higher-better'),
      npv: this.getPercentile(metrics.npv, npvValues, 'higher-better'),
      paybackPeriod: this.getPercentile(metrics.paybackPeriod, paybackValues, 'lower-better'),
    };
  }

  /**
   * Calculate percentile for a value in a distribution
   */
  private getPercentile(
    value: number,
    sortedValues: number[],
    direction: 'higher-better' | 'lower-better'
  ): number {
    if (sortedValues.length === 0) return 50;

    // Find the position of value in the sorted array
    let percentile: number;
    if (direction === 'higher-better') {
      // Count values less than or equal to value
      const count = sortedValues.filter((v) => v <= value).length;
      percentile = (count / sortedValues.length) * 100;
    } else {
      // Count values greater than or equal to value (for payback period, lower is better)
      const count = sortedValues.filter((v) => v >= value).length;
      percentile = (count / sortedValues.length) * 100;
    }

    return Math.round(percentile);
  }

  /**
   * Calculate distribution statistics (p10, p25, p50, p75, p90, mean, stdDev)
   */
  private calculateDistribution(
    projects: BenchmarkProject[]
  ): BenchmarkComparison['distribution'] {
    if (projects.length === 0) {
      return {
        irr: this.getEmptyDistribution(),
        npv: this.getEmptyDistribution(),
        paybackPeriod: this.getEmptyDistribution(),
      };
    }

    const irrValues = projects.map((p) => p.irr).sort((a, b) => a - b);
    const npvValues = projects.map((p) => p.npv).sort((a, b) => a - b);
    const paybackValues = projects.map((p) => p.paybackPeriod).sort((a, b) => a - b);

    return {
      irr: this.getStatistics(irrValues),
      npv: this.getStatistics(npvValues),
      paybackPeriod: this.getStatistics(paybackValues),
    };
  }

  /**
   * Calculate statistics for a sorted array of values
   */
  private getStatistics(
    sortedValues: number[]
  ): {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    mean: number;
    stdDev?: number;
  } {
    const len = sortedValues.length;

    const getPercentile = (p: number): number => {
      const index = Math.ceil((p / 100) * len) - 1;
      return sortedValues[Math.max(0, Math.min(index, len - 1))];
    };

    const mean = sortedValues.reduce((sum, v) => sum + v, 0) / len;
    const variance =
      sortedValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / len;
    const stdDev = Math.sqrt(variance);

    return {
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      mean,
      stdDev,
    };
  }

  /**
   * Get empty distribution for no comparable projects
   */
  private getEmptyDistribution() {
    return {
      p10: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      mean: 0,
      stdDev: 0,
    };
  }

  /**
   * Calculate performance rating based on percentiles
   */
  private calculateRating(
    percentiles: BenchmarkComparison['percentiles']
  ): BenchmarkComparison['rating'] {
    const getRating = (p: number): 'excellent' | 'good' | 'average' | 'below-average' | 'poor' => {
      if (p >= 90) return 'excellent';
      if (p >= 75) return 'good';
      if (p >= 50) return 'average';
      if (p >= 25) return 'below-average';
      return 'poor';
    };

    const irrRating = getRating(percentiles.irr);
    const npvRating = getRating(percentiles.npv);
    const paybackRating = getRating(percentiles.paybackPeriod);

    // Overall rating: weighted average of component ratings
    const ratings = { excellent: 5, good: 4, average: 3, 'below-average': 2, poor: 1 };
    const avgRating = (ratings[irrRating] + ratings[npvRating] + ratings[paybackRating]) / 3;

    const getOverallRating = (r: number): 'excellent' | 'good' | 'average' | 'below-average' | 'poor' => {
      if (r >= 4.5) return 'excellent';
      if (r >= 3.5) return 'good';
      if (r >= 2.5) return 'average';
      if (r >= 1.5) return 'below-average';
      return 'poor';
    };

    return {
      overall: getOverallRating(avgRating),
      irr: irrRating,
      npv: npvRating,
      paybackPeriod: paybackRating,
    };
  }

  /**
   * Analyze key performance drivers
   * Compares project parameters with benchmark averages
   */
  private async analyzeDrivers(
    input: ProjectInput,
    result: EngineResult,
    projects: BenchmarkProject[]
  ): BenchmarkComparison['drivers'] {
    const drivers: BenchmarkComparison['drivers'] = [];

    if (projects.length === 0) {
      return drivers;
    }

    // Calculate benchmark averages
    const avgBatteryCost = projects.reduce((sum, p) => sum + p.batteryCost, 0) / projects.length;
    const avgEfficiency = projects.reduce((sum, p) => sum + p.systemEfficiency, 0) / projects.length;
    const avgCycles = projects.reduce((sum, p) => sum + p.cyclesPerDay, 0) / projects.length;

    // Battery cost
    const batteryCost = input.costs.batteryCostPerKwh;
    if (batteryCost < avgBatteryCost * 0.9) {
      drivers.push({
        factor: 'batteryCost',
        impact: 'high',
        description: `Battery cost (¥${batteryCost}/kWh) is ${Math.round((1 - batteryCost / avgBatteryCost) * 100)}% below market average, significantly improving IRR`,
      });
    } else if (batteryCost > avgBatteryCost * 1.1) {
      drivers.push({
        factor: 'batteryCost',
        impact: 'high',
        description: `Battery cost (¥${batteryCost}/kWh) is ${Math.round((batteryCost / avgBatteryCost - 1) * 100)}% above market average, reducing IRR`,
      });
    }

    // System efficiency
    const efficiency = input.operatingParams.systemEfficiency;
    if (efficiency > avgEfficiency * 1.05) {
      drivers.push({
        factor: 'systemEfficiency',
        impact: 'medium',
        description: `System efficiency (${(efficiency * 100).toFixed(1)}%) is above average, improving revenue capture`,
      });
    } else if (efficiency < avgEfficiency * 0.95) {
      drivers.push({
        factor: 'systemEfficiency',
        impact: 'medium',
        description: `System efficiency (${(efficiency * 100).toFixed(1)}%) is below average, reducing revenue capture`,
      });
    }

    // Cycles per day
    const cycles = input.operatingParams.cyclesPerDay;
    if (cycles > avgCycles * 1.1) {
      drivers.push({
        factor: 'cyclesPerDay',
        impact: 'high',
        description: `Daily cycles (${cycles}) is ${Math.round((cycles / avgCycles - 1) * 100)}% above average, significantly increasing revenue`,
      });
    } else if (cycles < avgCycles * 0.9) {
      drivers.push({
        factor: 'cyclesPerDay',
        impact: 'high',
        description: `Daily cycles (${cycles}) is ${Math.round((1 - cycles / avgCycles) * 100)}% below average, limiting revenue potential`,
      });
    }

    // Province pricing
    const province = await this.repository.findByCode(input.province);
    if (province) {
      const spread = province.pricing.spread;
      const avgSpread = projects.reduce((sum, p) => sum + (p.peakPrice - p.valleyPrice), 0) / projects.length;

      if (spread > avgSpread * 1.1) {
        drivers.push({
          factor: 'priceSpread',
          impact: 'high',
          description: `${province.name} price spread (¥${spread.toFixed(2)}/kWh) is above average, enhancing arbitrage revenue`,
        });
      } else if (spread < avgSpread * 0.9) {
        drivers.push({
          factor: 'priceSpread',
          impact: 'high',
          description: `${province.name} price spread (¥${spread.toFixed(2)}/kWh) is below average, limiting arbitrage revenue`,
        });
      }

      // Capacity compensation
      if (province.capacityCompensation.available && province.capacityCompensation.type === 'capacity-based') {
        drivers.push({
          factor: 'capacityCompensation',
          impact: 'medium',
          description: `${province.name} offers capacity-based compensation (¥${province.capacityCompensation.rate}/kW/year), adding stable revenue`,
        });
      }
    }

    // Sort by impact priority
    const impactOrder = { high: 0, medium: 1, low: 2 };
    drivers.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

    return drivers.slice(0, 5); // Max 5 drivers
  }

  /**
   * Get benchmark projects by province
   */
  getProjectsByProvince(provinceCode: string): BenchmarkProject[] {
    return this.benchmarkData.filter((p) => p.province === provinceCode);
  }

  /**
   * Get all benchmark projects
   */
  getAllProjects(): BenchmarkProject[] {
    return this.benchmarkData;
  }

  /**
   * Get summary statistics for all projects
   */
  getSummaryStats(): {
    totalProjects: number;
    provinces: { code: string; count: number }[];
    averageIrr: number;
    averagePayback: number;
    irrRange: { min: number; max: number };
  } {
    const provinces: { [code: string]: number } = {};

    this.benchmarkData.forEach((project) => {
      provinces[project.province] = (provinces[project.province] || 0) + 1;
    });

    const irrValues = this.benchmarkData.map((p) => p.irr);
    const paybackValues = this.benchmarkData.map((p) => p.paybackPeriod);

    return {
      totalProjects: this.benchmarkData.length,
      provinces: Object.entries(provinces)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count),
      averageIrr: irrValues.reduce((sum, v) => sum + v, 0) / irrValues.length,
      averagePayback: paybackValues.reduce((sum, v) => sum + v, 0) / paybackValues.length,
      irrRange: {
        min: Math.min(...irrValues),
        max: Math.max(...irrValues),
      },
    };
  }
}
