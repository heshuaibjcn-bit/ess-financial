/**
 * Benchmark Domain Model
 *
 * Represents industry benchmarking data and comparison results.
 * Enables users to compare their projects against similar projects in the market.
 */

/**
 * Benchmark project (from industry database)
 */
export interface BenchmarkProject {
  id: string;
  source: string; // Where data came from (e.g., "CNESA", "news report")
  sourceUrl?: string;
  confidence: 'high' | 'medium' | 'low'; // Data reliability

  // Project characteristics
  province: string;
  capacity: number; // MW
  duration: number; // hours
  technology: string; // lithium-ion, lead-acid, etc.
  applicationType: string; // industrial, commercial, etc.

  // Financial metrics
  irr: number; // %
  totalInvestment: number; // ¥
  investmentPerKw: number; // ¥/kW
  paybackPeriod: number; // years

  // Operating metrics
  annualRevenue: number; // ¥
  annualCapacityCompensation: number; // ¥
  utilizationRate: number; // %

  // Metadata
  commissionDate?: string; // When project came online
  lastUpdated: string;
  dataVersion: string;
}

/**
 * Filter criteria for finding comparable projects
 */
export interface BenchmarkFilter {
  province: string;
  capacityRange: { min: number; max: number }; // MW
  technology?: string;
  applicationType?: string;
  dateRange?: {
    start: string; // ISO date
    end: string;
  };
}

/**
 * Percentile statistics
 */
export interface PercentileStats {
  p10: number;
  p25: number;
  p50: number; // median
  p75: number;
  p90: number;
  mean: number;
  stdDev: number;
  sampleSize: number;
}

/**
 * Distribution data (for histogram)
 */
export interface DistributionData {
  min: number;
  max: number;
  bins: Array<{
    range: { min: number; max: number };
    count: number;
    percentage: number;
  }>;
}

/**
 * Benchmark comparison result
 */
export interface BenchmarkComparison {
  id: string;
  projectId: string;

  // Filter used to find comparables
  filter: BenchmarkFilter;

  // Comparables found
  comparables: BenchmarkProject[];
  comparablesCount: number;

  // Percentile rankings for project's IRR
  percentileIRR: number; // 0-100
  percentileRankings: {
    irr: number; // 0-100
    npv: number; // 0-100
    paybackPeriod: number; // 0-100
    investmentPerKw: number; // 0-100
  };

  // Percentile statistics
  irrStats: PercentileStats;
  npvStats: PercentileStats;
  paybackStats: PercentileStats;

  // Distribution data (for visualization)
  irrDistribution: DistributionData;

  // Key performance drivers (what makes this project different)
  keyDrivers: Array<{
    variable: string;
    projectValue: number;
    benchmarkMedian: number;
    difference: number; // % difference
    impact: number; // Estimated impact on IRR (%)
    rating: 'above-average' | 'average' | 'below-average';
  }>;

  // Overall rating
  overallRating: {
    letter: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    label: string;
    color: string;
    description: string;
  };

  // Recommendations
  recommendations: string[];

  // Metadata
  generatedAt: Date;
  benchmarkVersion: string;
}

/**
 * Benchmark database summary
 */
export interface BenchmarkDatabaseSummary {
  totalProjects: number;
  provinces: Array<{
    province: string;
    count: number;
  }>;
  technologies: Array<{
    technology: string;
    count: number;
  }>;
  dateRange: {
    earliest: string;
    latest: string;
  };
  lastUpdated: string;
  version: string;
}

/**
 * Benchmark quality metrics
 */
export interface BenchmarkQuality {
  dataCompleteness: number; // % of projects with all required fields
  sourceReliability: number; // Weighted average of source confidence
  recency: number; // Average age of data (years)
  sampleSizeAdequacy: boolean; // Whether sample size is statistically significant
  confidenceLevel: number; // Statistical confidence level (e.g., 95%)
  marginOfError: number; // ±% for key metrics
}
