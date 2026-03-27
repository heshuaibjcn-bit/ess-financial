/**
 * Tests for Calculation Result Schema
 *
 * Tests cover:
 * - Basic schema validation
 * - Financial metrics validation
 * - Cash flow validation
 * - Cross-field validation
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import {
  CalculationResultSchema,
  CalculationResultSchemaRefined,
  CalculationResultSummarySchema,
  FinancialMetricsSchema,
  RevenueBreakdownSchema,
  CostBreakdownSchema,
} from '@/domain/schemas/CalculationResultSchema';

describe('CalculationResultSchema', () => {
  const validCalculationResult = {
    id: 'calc-123',
    projectId: 'proj-456',
    financialMetrics: {
      irr: 15.5,
      npv: 1000000,
      paybackPeriod: 6.5,
      roi: 120,
      profitIndex: 1.5,
      grossMargin: 0.35,
      netMargin: 0.22,
    },
    annualCashFlows: Array.from({ length: 10 }, (_, i) => ({
      year: i + 1,
      revenue: 2000000,
      operatingCost: 500000,
      financingCost: 300000,
      tax: 200000,
      netCashFlow: 1000000,
      cumulativeCashFlow: (i + 1) * 1000000,
    })),
    revenueBreakdown: {
      peakValleyArbitrage: 1500000,
      capacityCompensation: 400000,
      demandResponse: 50000,
      auxiliaryServices: 50000,
      total: 2000000,
    },
    costBreakdown: {
      initialInvestment: 10000000,
      annualOperatingCost: 500000,
      annualFinancingCost: 300000,
      totalAnnualCost: 800000,
    },
    performanceMetrics: {
      totalInvestment: 10000000,
      levelizedCost: 0.8,
      capacityFactor: 45,
      totalEnergyThroughput: 3500000,
      averageRoundTripEfficiency: 88,
      availableHours: 8500,
    },
    calculatedAt: new Date().toISOString(),
    calculationVersion: '1.0.0',
    calculationParams: {
      discountRate: 0.08,
      projectLifetime: 10,
      inflationRate: 0.02,
    },
  };

  it('should validate a correct calculation result', () => {
    const result = CalculationResultSchema.safeParse(validCalculationResult);
    expect(result.success).toBe(true);
  });

  it('should reject invalid IRR values', () => {
    const invalidIRR = {
      ...validCalculationResult,
      financialMetrics: {
        ...validCalculationResult.financialMetrics,
        irr: 150, // Too high
      },
    };

    const result = CalculationResultSchema.safeParse(invalidIRR);
    expect(result.success).toBe(false);
  });

  it('should reject negative payback period', () => {
    const invalidPayback = {
      ...validCalculationResult,
      financialMetrics: {
        ...validCalculationResult.financialMetrics,
        paybackPeriod: -1,
      },
    };

    const result = CalculationResultSchema.safeParse(invalidPayback);
    expect(result.success).toBe(false);
  });

  it('should reject empty cash flows array', () => {
    const invalidCashFlows = {
      ...validCalculationResult,
      annualCashFlows: [],
    };

    const result = CalculationResultSchema.safeParse(invalidCashFlows);
    expect(result.success).toBe(false);
  });

  it('should reject cash flows array longer than 20 years', () => {
    const invalidCashFlows = {
      ...validCalculationResult,
      annualCashFlows: Array.from({ length: 25 }, (_, i) => ({
        year: i + 1,
        revenue: 2000000,
        operatingCost: 500000,
        financingCost: 300000,
        tax: 200000,
        netCashFlow: 1000000,
        cumulativeCashFlow: (i + 1) * 1000000,
      })),
    };

    const result = CalculationResultSchema.safeParse(invalidCashFlows);
    expect(result.success).toBe(false);
  });

  it('should reject revenue total that does not match sum of components', () => {
    const invalidRevenue = {
      ...validCalculationResult,
      revenueBreakdown: {
        peakValleyArbitrage: 1500000,
        capacityCompensation: 400000,
        demandResponse: 50000,
        auxiliaryServices: 50000,
        total: 3000000, // Wrong total
      },
    };

    const result = CalculationResultSchemaRefined.safeParse(invalidRevenue);
    expect(result.success).toBe(false);
  });

  it('should validate revenue total matches sum of components', () => {
    const validRevenue = {
      ...validCalculationResult,
      revenueBreakdown: {
        peakValleyArbitrage: 1500000,
        capacityCompensation: 400000,
        demandResponse: 50000,
        auxiliaryServices: 50000,
        total: 2000000, // Correct total
      },
    };

    const result = CalculationResultSchemaRefined.safeParse(validRevenue);
    expect(result.success).toBe(true);
  });

  it('should require cash flows array length to match project lifetime', () => {
    const invalidMatch = {
      ...validCalculationResult,
      annualCashFlows: Array.from({ length: 15 }, (_, i) => ({
        year: i + 1,
        revenue: 2000000,
        operatingCost: 500000,
        financingCost: 300000,
        tax: 200000,
        netCashFlow: 1000000,
        cumulativeCashFlow: (i + 1) * 1000000,
      })),
      calculationParams: {
        discountRate: 0.08,
        projectLifetime: 10, // Mismatch
        inflationRate: 0.02,
      },
    };

    const result = CalculationResultSchemaRefined.safeParse(invalidMatch);
    expect(result.success).toBe(false);
  });

  it('should validate IRR vs discount rate relationship for positive NPV', () => {
    const invalidRelationship = {
      ...validCalculationResult,
      financialMetrics: {
        ...validCalculationResult.financialMetrics,
        irr: 5, // Lower than discount rate
        npv: 1000000, // But positive NPV
      },
      calculationParams: {
        discountRate: 0.08, // 8%
        projectLifetime: 10,
        inflationRate: 0.02,
      },
    };

    const result = CalculationResultSchemaRefined.safeParse(invalidRelationship);
    expect(result.success).toBe(false);
  });
});

describe('FinancialMetricsSchema', () => {
  it('should validate correct financial metrics', () => {
    const metrics = {
      irr: 15.5,
      npv: 1000000,
      paybackPeriod: 6.5,
      roi: 120,
      profitIndex: 1.5,
      grossMargin: 0.35,
      netMargin: 0.22,
    };

    const result = FinancialMetricsSchema.safeParse(metrics);
    expect(result.success).toBe(true);
  });

  it('should reject IRR < -100%', () => {
    const metrics = {
      irr: -150,
      npv: -1000000,
      paybackPeriod: 15,
      roi: -50,
      profitIndex: 0.5,
      grossMargin: 0,
      netMargin: -0.1,
    };

    const result = FinancialMetricsSchema.safeParse(metrics);
    expect(result.success).toBe(false);
  });

  it('should reject payback period > 20 years', () => {
    const metrics = {
      irr: 5,
      npv: 100000,
      paybackPeriod: 25, // Too long
      roi: 20,
      profitIndex: 1.1,
      grossMargin: 0.2,
      netMargin: 0.1,
    };

    const result = FinancialMetricsSchema.safeParse(metrics);
    expect(result.success).toBe(false);
  });
});

describe('RevenueBreakdownSchema', () => {
  it('should validate correct revenue breakdown', () => {
    const breakdown = {
      peakValleyArbitrage: 1500000,
      capacityCompensation: 400000,
      demandResponse: 50000,
      auxiliaryServices: 50000,
      total: 2000000,
    };

    const result = RevenueBreakdownSchema.safeParse(breakdown);
    expect(result.success).toBe(true);
  });

  it('should reject negative revenue values', () => {
    const breakdown = {
      peakValleyArbitrage: -100000, // Negative
      capacityCompensation: 400000,
      demandResponse: 50000,
      auxiliaryServices: 50000,
      total: 2000000,
    };

    const result = RevenueBreakdownSchema.safeParse(breakdown);
    expect(result.success).toBe(false);
  });
});

describe('CostBreakdownSchema', () => {
  it('should validate correct cost breakdown', () => {
    const breakdown = {
      initialInvestment: 10000000,
      annualOperatingCost: 500000,
      annualFinancingCost: 300000,
      totalAnnualCost: 800000,
    };

    const result = CostBreakdownSchema.safeParse(breakdown);
    expect(result.success).toBe(true);
  });

  it('should reject zero or negative initial investment', () => {
    const breakdown = {
      initialInvestment: 0, // Invalid
      annualOperatingCost: 500000,
      annualFinancingCost: 300000,
      totalAnnualCost: 800000,
    };

    const result = CostBreakdownSchema.safeParse(breakdown);
    expect(result.success).toBe(false);
  });
});
