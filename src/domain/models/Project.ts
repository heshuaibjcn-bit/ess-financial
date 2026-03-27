import type { ProjectInput } from '../schemas/ProjectSchema';

/**
 * Project model representing a user's energy storage investment analysis
 */
export interface Project {
  id: string;
  userId?: string;
  projectName?: string;
  description?: string;

  // Input parameters
  province: string;
  systemSize: {
    capacity: number; // kWh
    power: number; // kW
  };
  costs: {
    battery: number; // ¥/Wh
    pcs: number; // ¥/W
    bms: number; // ¥/Wh
    ems: number; // ¥/Wh
    thermalManagement: number; // ¥/Wh
    fireProtection: number; // ¥/Wh
    container: number; // ¥/Wh
    installation: number; // ¥/Wh
    other: number; // ¥/Wh
  };
  financing: {
    loanRatio?: number;
    interestRate?: number;
    term?: number;
  };
  operatingParams: {
    systemEfficiency: number; // 0-1
    dod: number; // 0-1
    cyclesPerDay: number;
    degradationRate: number; // per year
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Calculation result output
 */
export interface CalculationResult {
  projectId: string;

  // Key metrics
  irr: number; // Internal Rate of Return (%)
  npv: number; // Net Present Value (¥)
  paybackPeriod: number; // years

  // Annual cash flows
  annualCashFlows: number[]; // 10 or 20 years

  // Revenue breakdown
  revenueBreakdown: {
    peakValleyArbitrage: number; // ¥/year
    capacityCompensation: number; // ¥/year
    demandResponse: number; // ¥/year
    auxiliaryServices: number; // ¥/year
  };

  // Cost breakdown
  costBreakdown: {
    initialInvestment: number; // ¥
    annualOpeex: number; // ¥/year
    annualFinancing: number; // ¥/year
  };

  // Performance metrics
  totalInvestment: number; // ¥
  levelizedCost: number; // ¥/kWh
  capacityFactor: number; // %

  // Metadata
  calculatedAt: Date;
  calculationVersion: string;
}

/**
 * Scenario result (what-if analysis)
 */
export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  baseProjectId: string;

  // Modified inputs
  modifiedInputs: Partial<ProjectInput>;

  // Resulting metrics
  irr: number;
  irrChange: number; // percentage points change
  npv: number;
  npvChange: number; // ¥

  calculatedAt: Date;
}

/**
 * Benchmark comparison result
 */
export interface BenchmarkComparison {
  projectId: string;

  // Comparables
  comparablesCount: number;
  filter: {
    province: string;
    sizeRange: { min: number; max: number };
    technology: string;
    applicationType: string;
  };

  // Percentile rankings
  percentileIRR: number; // 0-100
  medianIRR: number;
  p25IRR: number;
  p75IRR: number;
  meanIRR: number;

  // Key drivers
  keyDrivers: Array<{
    variable: string;
    impact: number; // ±% impact on IRR
  }>;

  generatedAt: Date;
}

/**
 * User project (saved in database/localStorage)
 */
export interface UserProject extends Project {
  isShared: boolean;
  shareToken?: string;
  shareExpiresAt?: Date;
}
