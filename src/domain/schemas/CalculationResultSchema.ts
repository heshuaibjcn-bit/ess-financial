import { z } from 'zod';

/**
 * Annual Cash Flow Schema
 */
export const AnnualCashFlowSchema = z.object({
  year: z.number().int().min(1).max(20),
  revenue: z.number().nonnegative(),
  operatingCost: z.number().nonnegative(),
  financingCost: z.number().nonnegative(),
  tax: z.number(),
  netCashFlow: z.number(),
  cumulativeCashFlow: z.number(),
});

export type AnnualCashFlow = z.infer<typeof AnnualCashFlowSchema>;

/**
 * Revenue Breakdown Schema
 */
export const RevenueBreakdownSchema = z.object({
  peakValleyArbitrage: z.number().nonnegative(),
  capacityCompensation: z.number().nonnegative(),
  demandResponse: z.number().nonnegative(),
  auxiliaryServices: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export type RevenueBreakdown = z.infer<typeof RevenueBreakdownSchema>;

/**
 * Cost Breakdown Schema
 */
export const CostBreakdownSchema = z.object({
  initialInvestment: z.number().positive(),
  annualOperatingCost: z.number().nonnegative(),
  annualFinancingCost: z.number().nonnegative(),
  totalAnnualCost: z.number().nonnegative(),
});

export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;

/**
 * Performance Metrics Schema
 */
export const PerformanceMetricsSchema = z.object({
  totalInvestment: z.number().positive(),
  levelizedCost: z.number().nonnegative(),
  capacityFactor: z.number().min(0).max(100),
  totalEnergyThroughput: z.number().nonnegative(),
  averageRoundTripEfficiency: z.number().min(0).max(100),
  availableHours: z.number().min(0).max(8760),
});

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;

/**
 * Financial Metrics Schema
 */
export const FinancialMetricsSchema = z.object({
  irr: z.number()
    .min(-100, 'IRR cannot be less than -100%')
    .max(100, 'IRR cannot exceed 100%'),
  npv: z.number(),
  paybackPeriod: z.number().nonnegative().max(20),
  roi: z.number(),
  profitIndex: z.number(),
  grossMargin: z.number().min(0).max(1),
  netMargin: z.number(),
});

export type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>;

/**
 * Calculation Result Schema
 */
export const CalculationResultSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),

  financialMetrics: FinancialMetricsSchema,

  annualCashFlows: z.array(AnnualCashFlowSchema)
    .min(1, 'At least one year of cash flows required')
    .max(20, 'Cannot exceed 20 years'),

  revenueBreakdown: RevenueBreakdownSchema,

  costBreakdown: CostBreakdownSchema,

  performanceMetrics: PerformanceMetricsSchema,

  calculatedAt: z.string().or(z.date()),
  calculationVersion: z.string().min(1),
  calculationParams: z.object({
    discountRate: z.number().min(0).max(1),
    projectLifetime: z.number().int().min(1).max(20),
    inflationRate: z.number().min(0).max(0.2),
  }),
});

export type CalculationResult = z.infer<typeof CalculationResultSchema>;

/**
 * Calculation Result Summary Schema (for UI display)
 */
export const CalculationResultSummarySchema = z.object({
  irr: z.number(),
  npv: z.number(),
  paybackPeriod: z.number(),
  totalInvestment: z.number(),
  annualRevenue: z.number(),
  roi: z.number(),
});

export type CalculationResultSummary = z.infer<typeof CalculationResultSummarySchema>;

/**
 * Cross-field validation for calculation results
 */
export const CalculationResultSchemaRefined = CalculationResultSchema.refine((data) => {
  // Validate that total initial investment matches cost breakdown
  if (data.costBreakdown.initialInvestment !== data.performanceMetrics.totalInvestment) {
    return false;
  }

  // Validate that revenue total matches sum of components
  const revenueSum =
    data.revenueBreakdown.peakValleyArbitrage +
    data.revenueBreakdown.capacityCompensation +
    data.revenueBreakdown.demandResponse +
    data.revenueBreakdown.auxiliaryServices;

  if (Math.abs(revenueSum - data.revenueBreakdown.total) > 0.01) {
    return false;
  }

  // Validate IRR vs NPV relationship (for positive NPV, IRR should be > discount rate)
  if (data.financialMetrics.npv > 0 && data.financialMetrics.irr < data.calculationParams.discountRate * 100) {
    return false;
  }

  // Validate cash flows array length matches project lifetime
  if (data.annualCashFlows.length !== data.calculationParams.projectLifetime) {
    return false;
  }

  return true;
}, {
  message: 'Calculation result validation failed: inconsistent data',
  path: ['financialMetrics'],
});

export type CalculationResultRefined = z.infer<typeof CalculationResultSchemaRefined>;

/**
 * Calculation Validation Schema
 */
export const CalculationValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    severity: z.enum(['error', 'warning']),
  })),
  warnings: z.array(z.string()),
});

export type CalculationValidation = z.infer<typeof CalculationValidationSchema>;
