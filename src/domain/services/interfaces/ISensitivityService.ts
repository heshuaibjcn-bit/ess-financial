/**
 * Sensitivity Analysis Service Interface
 *
 * Defines the contract for sensitivity and scenario analysis.
 */

import type { ProjectInput } from '../../schemas/ProjectSchema';
import type {
  Scenario,
  ScenarioAnalysis,
  OneWaySensitivity,
  TwoWaySensitivity,
} from '../../models/Scenario';
import type { CalculationResult } from '../../models/CalculationResult';

export interface ISensitivityService {
  /**
   * Perform one-way sensitivity analysis
   * @param baseProject - Base project input
   * @param variable - Variable to analyze
   * @param changes - Array of % changes to test (e.g., [-0.2, -0.1, 0, 0.1, 0.2])
   * @returns Promise<OneWaySensitivity>
   */
  analyzeOneWay(
    baseProject: ProjectInput,
    variable: string,
    changes?: number[]
  ): Promise<OneWaySensitivity>;

  /**
   * Perform two-way sensitivity analysis
   * @param baseProject - Base project input
   * @param primaryVariable - Primary variable
   * @param secondaryVariable - Secondary variable
   * @returns Promise<TwoWaySensitivity>
   */
  analyzeTwoWay(
    baseProject: ProjectInput,
    primaryVariable: string,
    secondaryVariable: string
  ): Promise<TwoWaySensitivity>;

  /**
   * Create a scenario with modified inputs
   * @param baseProjectId - Base project ID
   * @param modifiedInputs - Modified input parameters
   * @param scenarioName - Scenario name
   * @returns Promise<Scenario>
   */
  createScenario(
    baseProjectId: string,
    modifiedInputs: ProjectInput,
    scenarioName: string
  ): Promise<Scenario>;

  /**
   * Perform complete scenario analysis
   * @param projectId - Project ID
   * @param options - Analysis options
   * @returns Promise<ScenarioAnalysis>
   */
  analyzeScenarios(
    projectId: string,
    options?: {
      variables?: string[];
      includeTwoWay?: boolean;
      changePoints?: number[]; // % changes to test
    }
  ): Promise<ScenarioAnalysis>;

  /**
   * Compare multiple scenarios
   * @param scenarioIds - Scenario IDs to compare
   * @returns Promise<ScenarioComparison>
   */
  compareScenarios(scenarioIds: string[]): Promise<ScenarioComparison>;

  /**
   * Export scenario analysis to various formats
   * @param analysis - Scenario analysis result
   * @param format - Export format
   * @returns Promise<Blob | string>
   */
  exportAnalysis(
    analysis: ScenarioAnalysis,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<Blob | string>;
}

/**
 * Scenario comparison result
 */
export interface ScenarioComparison {
  scenarios: Scenario[];
  comparison: {
    bestIRR: { scenarioId: string; irr: number };
    worstIRR: { scenarioId: string; irr: number };
    highestNPV: { scenarioId: string; npv: number };
    lowestPayback: { scenarioId: string; period: number };
  };
  ranking: Array<{
    scenarioId: string;
    rank: number;
    score: number;
  }>;
}
