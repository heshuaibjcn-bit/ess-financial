import { z } from 'zod';

/**
 * Peak-valley pricing structure for a province
 */
export const PricingSchema = z.object({
  peakPrice: z.number().positive('Peak price must be positive (¥/kWh)'),
  valleyPrice: z.number().nonnegative('Valley price must be non-negative (¥/kWh)'),
  flatPrice: z.number().nonnegative().optional(),
  peakHours: z.array(z.string()).min(1, 'Peak hours must be specified'),
  valleyHours: z.array(z.string()).min(1, 'Valley hours must be specified'),
  peakMonths: z.array(z.number()).optional(), // Months when peak pricing applies
  spread: z.number().optional(), // Calculated peak - valley spread
});

export type Pricing = z.infer<typeof PricingSchema>;

/**
 * Capacity compensation policy
 */
export const CapacityCompensationSchema = z.object({
  available: z.boolean(),
  type: z.enum(['none', 'discharge-based', 'capacity-based']),
  rate: z.number().nonnegative().optional(), // ¥/kW/year or ¥/kWh
  requirements: z.object({
    minDischargeDuration: z.number().optional(), // hours
    availabilityThreshold: z.number().optional(), // % of time
  }).optional(),
  policyName: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

export type CapacityCompensation = z.infer<typeof CapacityCompensationSchema>;

/**
 * Demand response compensation
 */
export const DemandResponseSchema = z.object({
  available: z.boolean(),
  peakCompensation: z.number().nonnegative().optional(), // ¥/kWh
  valleyCompensation: z.number().nonnegative().optional(), // ¥/kWh
  minResponseSize: z.number().optional(), // MW
  maxAnnualCalls: z.number().optional(), // times per year
});

export type DemandResponse = z.infer<typeof DemandResponseSchema>;

/**
 * Auxiliary services (frequency regulation, peaking, etc.)
 */
export const AuxiliaryServicesSchema = z.object({
  available: z.boolean(),
  frequencyRegulation: z.object({
    price: z.number().nonnegative().optional(), // ¥/MW
    performanceScore: z.number().optional(), // K-value
  }).optional(),
  peaking: z.object({
    price: z.number().nonnegative().optional(), // ¥/kWh
    availableHours: z.number().optional(),
  }).optional(),
});

export type AuxiliaryServices = z.infer<typeof AuxiliaryServicesSchema>;

/**
 * Complete province policy data
 */
export const ProvinceDataSchema = z.object({
  code: z.string(), // Province code (e.g., 'GD', 'SD')
  name: z.string(), // Province name (e.g., '广东省', '山东省')
  nameEn: z.string().optional(), // English name (e.g., 'Guangdong', 'Shandong')

  // Pricing structure
  pricing: PricingSchema,

  // Compensation mechanisms
  capacityCompensation: CapacityCompensationSchema,
  demandResponse: DemandResponseSchema,
  auxiliaryServices: AuxiliaryServicesSchema,

  // Policy metadata
  lastUpdated: z.string().optional(), // ISO date string
  dataVersion: z.string().optional(), // For cache invalidation
  dataSource: z.string().optional(), // Where data came from (for validation)

  // Calculated fields (filled in at runtime)
  calculated: z.object({
    spread: z.number().optional(), // Peak - valley spread
    theoreticalMaxIRR: z.number().optional(), // Best case IRR for this province
  }).optional(),
});

export type ProvinceData = z.infer<typeof ProvinceDataSchema>;

/**
 * Schema for province data file validation
 */
export const ProvinceDataFileSchema = z.object({
  version: z.string(), // Data format version
  lastUpdated: z.string(), // ISO date string
  provinces: z.array(ProvinceDataSchema),
});

export type ProvinceDataFile = z.infer<typeof ProvinceDataFileSchema>;

/**
 * Benchmarking filter for finding comparable projects
 */
export const ComparableFilterSchema = z.object({
  province: z.enum(['same-only', 'any']),
  sizeTolerance: z.number()
    .positive('Size tolerance must be positive')
    .max(1, 'Size tolerance cannot exceed 100%')
    .default(0.5), // ±50% by default
  technology: z.enum(['same-only', 'any']),
  applicationType: z.enum(['same-only', 'any']),
});

export type ComparableFilter = z.infer<typeof ComparableFilterSchema>;

/**
 * Benchmark comparison result
 */
export const BenchmarkComparisonSchema = z.object({
  projectId: z.string().optional(),
  percentile: z.number()
    .min(0)
    .max(100),
  medianIRR: z.number(),
  meanIRR: z.number().optional(),
  p25: z.number().optional(),
  p75: z.number().optional(),
  comparablesCount: z.number().int().nonnegative(),
  keyDrivers: z.array(z.object({
    variable: z.string(),
    impact: z.number(), // How much this variable affects IRR (±%)
  })),
});

export type BenchmarkComparison = z.infer<typeof BenchmarkComparisonSchema>;
