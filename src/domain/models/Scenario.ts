/**
 * Scenario Domain Model
 *
 * Represents what-if analysis scenarios for sensitivity testing.
 * Scenarios allow users to model different assumptions and compare outcomes.
 */

import type { ProjectInput } from '../schemas/ProjectSchema';
import type { CalculationResult } from './CalculationResult';

/**
 * Scenario variable type
 */
export type ScenarioVariable =
  | 'batteryCost'
  | 'pcsCost'
  | 'systemEfficiency'
  | 'peakPrice'
  | 'valleyPrice'
  | 'compensationRate'
  | 'cyclesPerDay'
  | 'degradationRate'
  | 'interestRate';

/**
 * Scenario input definition
 */
export interface ScenarioInput {
  variable: ScenarioVariable;
  change: number; // % change from base (e.g., 0.1 = +10%)
  label?: string; // Human-readable label
}

/**
 * Scenario definition
 */
export interface Scenario {
  id: string;
  name: string;
  description?: string;

  baseProjectId: string;

  // What parameters changed
  modifiedInputs: Array<ScenarioInput>;

  // Resulting calculation
  result: CalculationResult;

  // Comparison with base
  comparison: {
    irrChange: number; // percentage points
    irrChangePercent: number; // % change
    npvChange: number; // ¥
    npvChangePercent: number; // % change
    paybackPeriodChange: number; // years
  };

  // Metadata
  createdAt: Date;
  createdBy?: string;
  tags?: string[];
}

/**
 * One-way sensitivity analysis
 */
export interface OneWaySensitivity {
  variable: ScenarioVariable;
  baseValue: number;
  baseResult: {
    irr: number;
    npv: number;
  };

  scenarios: Array<{
    change: number; // % change
    value: number;
    irr: number;
    npv: number;
    irrChange: number; // percentage points
    npvChange: number; // ¥
  }>;

  // Sensitivity metrics
  sensitivity: {
    elasticityIRR: number; // % IRR change per 1% input change
    elasticityNPV: number; // % NPV change per 1% input change
    mostSensitive: boolean; // Is this the most sensitive variable?
  };
}

/**
 * Two-way sensitivity analysis (tornado chart data)
 */
export interface TwoWaySensitivity {
  primaryVariable: ScenarioVariable;
  secondaryVariable: ScenarioVariable;

  // Matrix of IRR values
  irrMatrix: Array<{
    primaryValue: number;
    secondaryValues: Array<{
      secondaryValue: number;
      irr: number;
    }>;
  }>;

  // Analysis
  analysis: {
    bestCase: { irr: number; primaryValue: number; secondaryValue: number };
    worstCase: { irr: number; primaryValue: number; secondaryValue: number };
    correlation: number; // Correlation coefficient
  };
}

/**
 * Scenario analysis result (complete sensitivity analysis)
 */
export interface ScenarioAnalysis {
  id: string;
  projectId: string;

  // Base case
  baseCase: CalculationResult;

  // One-way sensitivity for each variable
  oneWaySensitivity: OneWaySensitivity[];

  // Two-way sensitivity (top combinations)
  twoWaySensitivity: TwoWaySensitivity[];

  // Key insights
  insights: {
    mostSensitiveVariable: ScenarioVariable;
    leastSensitiveVariable: ScenarioVariable;
    criticalThresholds: Array<{
      variable: ScenarioVariable;
      threshold: number;
      impact: string;
    }>;
    recommendations: string[];
  };

  // Metadata
  generatedAt: Date;
  analysisVersion: string;
}
