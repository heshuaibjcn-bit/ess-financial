import { z } from 'zod';

/**
 * Benchmark Project Schema
 */
export const BenchmarkProjectSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  confidence: z.enum(['high', 'medium', 'low']),

  province: z.string(),
  capacity: z.number().positive().max(100), // MW
  duration: z.number().positive().max(8), // hours
  technology: z.string(),
  applicationType: z.string(),

  irr: z.number().min(-100).max(100),
  totalInvestment: z.number().positive(),
  investmentPerKw: z.number().positive(),
  paybackPeriod: z.number().nonnegative().max(20),

  annualRevenue: z.number().nonnegative(),
  annualCapacityCompensation: z.number().nonnegative(),
  utilizationRate: z.number().min(0).max(100),

  commissionDate: z.string().optional(),
  lastUpdated: z.string(),
  dataVersion: z.string(),
});

export type BenchmarkProject = z.infer<typeof BenchmarkProjectSchema>;

/**
 * Benchmark Filter Schema
 */
export const BenchmarkFilterSchema = z.object({
  province: z.string(),
  capacityRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().positive(),
  }),
  technology: z.string().optional(),
  applicationType: z.string().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

export type BenchmarkFilter = z.infer<typeof BenchmarkFilterSchema>;

/**
 * Percentile Stats Schema
 */
export const PercentileStatsSchema = z.object({
  p10: z.number(),
  p25: z.number(),
  p50: z.number(),
  p75: z.number(),
  p90: z.number(),
  mean: z.number(),
  stdDev: z.number().nonnegative(),
  sampleSize: z.number().int().positive(),
});

export type PercentileStats = z.infer<typeof PercentileStatsSchema>;

/**
 * Distribution Data Schema
 */
export const DistributionDataSchema = z.object({
  min: z.number(),
  max: z.number(),
  bins: z.array(z.object({
    range: z.object({
      min: z.number(),
      max: z.number(),
    }),
    count: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100),
  })),
});

export type DistributionData = z.infer<typeof DistributionDataSchema>;

/**
 * Benchmark Comparison Schema
 */
export const BenchmarkComparisonSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),

  filter: BenchmarkFilterSchema,

  comparables: z.array(BenchmarkProjectSchema),
  comparablesCount: z.number().int().nonnegative(),

  percentileIRR: z.number().min(0).max(100),
  percentileRankings: z.object({
    irr: z.number().min(0).max(100),
    npv: z.number().min(0).max(100),
    paybackPeriod: z.number().min(0).max(100),
    investmentPerKw: z.number().min(0).max(100),
  }),

  irrStats: PercentileStatsSchema,
  npvStats: PercentileStatsSchema,
  paybackStats: PercentileStatsSchema,

  irrDistribution: DistributionDataSchema,

  keyDrivers: z.array(z.object({
    variable: z.string(),
    projectValue: z.number(),
    benchmarkMedian: z.number(),
    difference: z.number(),
    impact: z.number(),
    rating: z.enum(['above-average', 'average', 'below-average']),
  })),

  overallRating: z.object({
    letter: z.enum(['A+', 'A', 'B', 'C', 'D', 'F']),
    label: z.string(),
    color: z.string(),
    description: z.string(),
  }),

  recommendations: z.array(z.string()),

  generatedAt: z.string().or(z.date()),
  benchmarkVersion: z.string().min(1),
});

export type BenchmarkComparison = z.infer<typeof BenchmarkComparisonSchema>;

/**
 * Benchmark Database Summary Schema
 */
export const BenchmarkDatabaseSummarySchema = z.object({
  totalProjects: z.number().int().nonnegative(),
  provinces: z.array(z.object({
    province: z.string(),
    count: z.number().int().nonnegative(),
  })),
  technologies: z.array(z.object({
    technology: z.string(),
    count: z.number().int().nonnegative(),
  })),
  dateRange: z.object({
    earliest: z.string(),
    latest: z.string(),
  }),
  lastUpdated: z.string(),
  version: z.string(),
});

export type BenchmarkDatabaseSummary = z.infer<typeof BenchmarkDatabaseSummarySchema>;

/**
 * Benchmark Quality Schema
 */
export const BenchmarkQualitySchema = z.object({
  dataCompleteness: z.number().min(0).max(100),
  sourceReliability: z.number().min(0).max(100),
  recency: z.number().nonnegative().max(10), // years
  sampleSizeAdequacy: z.boolean(),
  confidenceLevel: z.number().min(0).max(100),
  marginOfError: z.number().nonnegative().max(20), // ±%
});

export type BenchmarkQuality = z.infer<typeof BenchmarkQualitySchema>;

/**
 * Cross-field validation for benchmark projects
 */
export const BenchmarkProjectSchemaRefined = BenchmarkProjectSchema.refine((data) => {
  // Validate investment per kW calculation
  const calculatedInvestmentPerKw = data.totalInvestment / (data.capacity * 1000);
  if (Math.abs(calculatedInvestmentPerKw - data.investmentPerKw) > 100) {
    return false;
  }

  // Validate IRR vs payback period relationship
  // (High IRR should correlate with short payback period)
  if (data.irr > 20 && data.paybackPeriod > 8) {
    return false; // Suspicious: high IRR but long payback
  }

  if (data.irr < 5 && data.paybackPeriod < 3) {
    return false; // Suspicious: low IRR but short payback
  }

  // Validate utilization rate vs revenue
  if (data.utilizationRate > 80 && data.annualRevenue < data.totalInvestment * 0.05) {
    return false; // Low revenue despite high utilization
  }

  return true;
}, {
  message: 'Benchmark project data validation failed: inconsistent metrics',
  path: ['irr'],
});

export type BenchmarkProjectRefined = z.infer<typeof BenchmarkProjectSchemaRefined>;
