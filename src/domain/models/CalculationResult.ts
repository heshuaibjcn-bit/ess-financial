/**
 * Calculation Result Domain Model
 *
 * Represents the complete output of a financial calculation for an energy storage project.
 * This is the core value object produced by the calculation engine.
 */

/**
 * Annual cash flow breakdown
 */
export interface AnnualCashFlow {
  year: number; // 1-20
  revenue: number; // ¥
  operatingCost: number; // ¥
  financingCost: number; // ¥
  tax: number; // ¥
  netCashFlow: number; // ¥
  cumulativeCashFlow: number; // ¥
}

/**
 * Revenue breakdown by source
 */
export interface RevenueBreakdown {
  peakValleyArbitrage: number; // ¥/year
  capacityCompensation: number; // ¥/year
  demandResponse: number; // ¥/year
  auxiliaryServices: number; // ¥/year
  total: number; // ¥/year
}

/**
 * Cost breakdown
 */
export interface CostBreakdown {
  initialInvestment: number; // ¥
  annualOperatingCost: number; // ¥/year
  annualFinancingCost: number; // ¥/year
  totalAnnualCost: number; // ¥/year
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  totalInvestment: number; // ¥
  levelizedCost: number; // ¥/kWh
  capacityFactor: number; // %
  totalEnergyThroughput: number; // kWh/year
  averageRoundTripEfficiency: number; // %
  availableHours: number; // hours/year
}

/**
 * Key financial metrics
 */
export interface FinancialMetrics {
  irr: number; // Internal Rate of Return (%)
  npv: number; // Net Present Value (¥)
  paybackPeriod: number; // years
  roi: number; // Return on Investment (%)
  profitIndex: number; // Profitability Index
  grossMargin: number; // %
  netMargin: number; // %
}

/**
 * Sensitivity analysis data
 */
export interface SensitivityData {
  variable: string;
  baseValue: number;
  scenarios: Array<{
    change: number; // % change
    value: number;
    irr: number;
    npv: number;
  }>;
}

/**
 * Complete calculation result
 */
export interface CalculationResult {
  id: string;
  projectId: string;

  // Financial metrics (key outputs)
  financialMetrics: FinancialMetrics;

  // Cash flows over project lifetime
  annualCashFlows: AnnualCashFlow[];

  // Revenue breakdown
  revenueBreakdown: RevenueBreakdown;

  // Cost breakdown
  costBreakdown: CostBreakdown;

  // Performance metrics
  performanceMetrics: PerformanceMetrics;

  // Sensitivity analysis (optional)
  sensitivityData?: SensitivityData[];

  // Metadata
  calculatedAt: Date;
  calculationVersion: string;
  calculationParams: {
    discountRate: number;
    projectLifetime: number;
    inflationRate: number;
  };
}

/**
 * Calculation result summary for UI display
 */
export interface CalculationResultSummary {
  irr: number;
  npv: number;
  paybackPeriod: number;
  totalInvestment: number;
  annualRevenue: number;
  roi: number;
}

/**
 * Validation result for calculation
 */
export interface CalculationValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
}
