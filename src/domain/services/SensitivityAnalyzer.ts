/**
 * SensitivityAnalyzer - Single-factor sensitivity analysis
 *
 * Analyzes how changes in individual parameters affect project IRR.
 */

import type { ProvinceData } from '../schemas/ProvinceSchema';
import type { ProjectInput } from '../schemas/ProjectSchema';
import { calculationEngine } from './CalculationEngine';

/**
 * Sensitivity analysis result for a single parameter
 */
export interface ParameterSensitivity {
  parameter: string;
  parameterName: string;
  parameterNameEn: string;

  // Values at different variation levels
  baselineValue: number; // Baseline parameter value
  baselineIRR: number; // Baseline IRR (%)

  variations: {
    level: string; // e.g., '-30%', '-15%', '0%', '+15%', '+30%'
    value: number; // Parameter value at this level
    irr: number; // IRR at this level (%)
    irrChange: number; // IRR change from baseline (percentage points)
  }[];
}

/**
 * Complete sensitivity analysis result
 */
export interface SensitivityResult {
  projectId: string;

  // Sensitivity for each parameter
  sensitivities: ParameterSensitivity[];

  // Most sensitive parameter
  mostSensitiveParameter: string;
  mostSensitiveImpact: number; // Max IRR change (percentage points)

  // Tornado chart data (sorted by impact)
  tornadoData: TornadoChartDatum[];

  // Summary
  baselineIRR: number;
  minIRR: number;
  maxIRR: number;
  irrRange: number; // maxIRR - minIRR
}

/**
 * Tornado chart data point
 */
export interface TornadoChartDatum {
  parameter: string;
  parameterName: string;
  parameterNameEn: string;
  baselineIRR: number;
  minIRR: number; // IRR at -30%
  maxIRR: number; // IRR at +30%
  irrRange: number; // Absolute range
  impact: number; // Max absolute change from baseline
}

/**
 * Sensitivity analyzer class
 */
export class SensitivityAnalyzer {
  /**
   * Analyze sensitivity for a single parameter
   *
   * @param input - Base project input
   * @param province - Province data
   * @param parameter - Parameter to analyze
   * @param variationLevels - Array of variation percentages (e.g., [-0.3, -0.15, 0, 0.15, 0.3])
   * @returns Sensitivity result for the parameter
   */
  private async analyzeParameter(
    input: ProjectInput,
    province: ProvinceData,
    parameter: keyof ProjectInput,
    variationLevels: number[]
  ): Promise<ParameterSensitivity> {
    // Calculate baseline
    const baselineResult = await calculationEngine.calculateProject(input, {});
    const baselineIRR = baselineResult.irr || 0;
    const baselineValue = this.getParameterValue(input, parameter);

    // Get parameter name
    const paramName = this.getParameterName(parameter);
    const paramNameEn = this.getParameterNameEn(parameter);

    const variations = await Promise.all(
      variationLevels.map(async (level) => {
        // Create modified input
        const modifiedInput = this.applyVariation(input, parameter, level);

        // Calculate IRR at this variation
        const result = await calculationEngine.calculateProject(modifiedInput, {});
        const irr = result.irr || 0;
        const irrChange = irr - baselineIRR;

        return {
          level: `${level * 100 > 0 ? '+' : ''}${level * 100}%`,
          value: this.getParameterValue(modifiedInput, parameter),
          irr,
          irrChange,
        };
      })
    );

    return {
      parameter,
      parameterName: paramName,
      parameterNameEn: paramNameEn,
      baselineValue,
      baselineIRR,
      variations,
    };
  }

  /**
   * Get value of a parameter from input
   */
  private getParameterValue(input: ProjectInput, parameter: keyof ProjectInput): number {
    const value = input[parameter];

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      // Handle nested objects
      if ('capacity' in value && 'power' in value) {
        // SystemSize - use capacity for sensitivity
        return (value as { capacity: number }).capacity;
      }
      if ('battery' in value) {
        // Costs - use battery cost as main cost driver
        return (value as { battery: number }).battery;
      }
      if ('systemEfficiency' in value) {
        return (value as { systemEfficiency: number }).systemEfficiency;
      }
      if ('dod' in value) {
        return (value as { dod: number }).dod;
      }
      if ('cyclesPerDay' in value) {
        return (value as { cyclesPerDay: number }).cyclesPerDay;
      }
      if ('degradationRate' in value) {
        return (value as { degradationRate: number }).degradationRate;
      }
    }

    return 0;
  }

  /**
   * Apply variation to input
   */
  private applyVariation(
    input: ProjectInput,
    parameter: keyof ProjectInput,
    variation: number
  ): ProjectInput {
    const modifiedInput = { ...input };

    if (parameter === 'systemSize') {
      const baseCapacity = input.systemSize.capacity;
      const basePower = input.systemSize.power;

      modifiedInput.systemSize = {
        capacity: baseCapacity * (1 + variation),
        power: basePower * (1 + variation),
      };
    } else if (parameter === 'costs') {
      const baseCosts = { ...input.costs };

      // Apply variation to all cost components
      Object.keys(baseCosts).forEach(key => {
        baseCosts[key as keyof typeof baseCosts] *= (1 + variation);
      });

      modifiedInput.costs = baseCosts;
    } else if (parameter === 'operatingParams') {
      const baseParams = { ...input.operatingParams };

      // Apply variation to relevant parameters
      if (baseParams.systemEfficiency !== undefined) {
        baseParams.systemEfficiency = Math.min(
          1,
          Math.max(0, baseParams.systemEfficiency * (1 + variation))
        );
      }

      modifiedInput.operatingParams = baseParams;
    }

    return modifiedInput;
  }

  /**
   * Get parameter Chinese name
   */
  private getParameterName(parameter: keyof ProjectInput): string {
    const names: Record<string, string> = {
      province: '省份',
      systemSize: '系统规模',
      costs: '成本',
      operatingParams: '运行参数',
      financing: '融资',
    };

    return names[parameter] || parameter;
  }

  /**
   * Get parameter English name
   */
  private getParameterNameEn(parameter: keyof ProjectInput): string {
    const names: Record<string, string> = {
      province: 'Province',
      systemSize: 'System Size',
      costs: 'Costs',
      operatingParams: 'Operating Parameters',
      financing: 'Financing',
    };

    return names[parameter] || parameter;
  }

  /**
   * Perform complete sensitivity analysis
   *
   * @param input - Project input
   * @param variationLevels - Variation levels to test (default: [-0.3, -0.15, 0, 0.15, 0.3])
   * @returns Complete sensitivity result
   */
  async analyzeSensitivity(
    input: ProjectInput,
    variationLevels: number[] = [-0.3, -0.15, 0, 0.15, 0.3]
  ): Promise<SensitivityResult> {
    // Load province data
    const province = await (await import('@/domain/repositories/ProvinceDataRepository')).provinceDataRepository.getProvince(input.province);

    if (!province) {
      throw new Error(`Province not found: ${input.province}`);
    }

    // Key parameters to analyze
    const parameters: Array<keyof ProjectInput> = [
      'costs', // Battery cost has biggest impact
      'systemSize',
      'operatingParams',
    ];

    // Analyze each parameter
    const sensitivities = await Promise.all(
      parameters.map(async (param) =>
        this.analyzeParameter(input, province, param, variationLevels)
      )
    );

    // Find most sensitive parameter
    let mostSensitiveParam = '';
    let maxImpact = 0;

    for (const sensitivity of sensitivities) {
      const maxChange = Math.max(
        ...sensitivity.variations.map(v => Math.abs(v.irrChange))
      );

      if (maxChange > maxImpact) {
        maxImpact = maxChange;
        mostSensitiveParam = sensitivity.parameter;
      }
    }

    // Generate tornado chart data
    const tornadoData: TornadoChartDatum[] = sensitivities.map((s) => {
      const minVariation = s.variations.find(v => v.level.includes('-30'));
      const maxVariation = s.variations.find(v => v.level.includes('+30'));

      return {
        parameter: s.parameter,
        parameterName: s.parameterName,
        parameterNameEn: s.parameterNameEn,
        baselineIRR: s.baselineIRR,
        minIRR: minVariation?.irr || s.baselineIRR,
        maxIRR: maxVariation?.irr || s.baselineIRR,
        irrRange: (maxVariation?.irr || s.baselineIRR) - (minVariation?.irr || s.baselineIRR),
        impact: Math.max(
          ...s.variations.map(v => Math.abs(v.irrChange))
        ),
      };
    });

    // Sort by impact (descending)
    tornadoData.sort((a, b) => b.impact - a.impact);

    // Calculate summary
    const baselineIRR = sensitivities[0]?.baselineIRR || 0;
    const allIRRs = sensitivities.flatMap(s => s.variations.map(v => v.irr));
    const minIRR = Math.min(...allIRRs);
    const maxIRR = Math.max(...allIRRs);

    return {
      projectId: 'sensitivity-analysis',
      sensitivities,
      mostSensitiveParameter: mostSensitiveParam,
      mostSensitiveImpact: maxImpact,
      tornadoData,
      baselineIRR,
      minIRR,
      maxIRR,
      irrRange: maxIRR - minIRR,
    };
  }

  /**
   * Get tornado chart data ready for visualization
   */
  getTornadoChartData(result: SensitivityResult): TornadoChartDatum[] {
    return result.tornadoData;
  }

  /**
   * Get the most sensitive parameter
   */
  getMostSensitiveParameter(result: SensitivityResult): string {
    return result.mostSensitiveParameter;
  }

  /**
   * Get sensitivity ranking by impact
   */
  getSensitivityRanking(result: SensitivityResult): Array<{
    parameter: string;
    parameterName: string;
    impact: number;
    rank: number;
  }> {
    return result.tornadoData.map((d, index) => ({
      parameter: d.parameter,
      parameterName: d.parameterName,
      impact: d.impact,
      rank: index + 1,
    }));
  }
}

// Singleton instance
export const sensitivityAnalyzer = new SensitivityAnalyzer();
