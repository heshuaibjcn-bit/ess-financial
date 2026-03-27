/**
 * CalculationEngine - End-to-end project analysis
 *
 * Integrates all calculation services:
 * - ProvinceDataRepository - Load province data
 * - RevenueCalculator - Calculate revenue streams
 * - CashFlowCalculator - Generate cash flows
 * - FinancialCalculator - Compute investment metrics
 */

import { provinceDataRepository } from '../repositories/ProvinceDataRepository';
import { RevenueCalculator } from './RevenueCalculator';
import { EnhancedCashFlowCalculator } from './EnhancedCashFlowCalculator';
import { FinancialCalculator } from './FinancialCalculator';
import type { ProvinceData } from '../schemas/ProvinceSchema';
import type { ProjectInput } from '../schemas/ProjectSchema';
import type { CalculationResult } from '../models/Project';

/**
 * Calculation engine options
 */
export interface CalculationOptions {
  discountRate?: number; // Default: 8%
  projectLifetime?: number; // Default: 10 years
  validateInputs?: boolean; // Default: true
}

/**
 * Calculation engine result with validation
 */
export interface EngineResult extends CalculationResult {
  validation: {
    valid: boolean;
    issues: string[];
  };
  metrics: {
    irr: number | null;
    npv: number;
    roi: number;
    lcoc: number;
    profitMargin: number;
  };
}

/**
 * Main calculation engine for energy storage project analysis
 */
export class CalculationEngine {
  private revenueCalculator: RevenueCalculator;
  private cashFlowCalculator: EnhancedCashFlowCalculator;
  private financialCalculator: FinancialCalculator;
  private cache: Map<string, EngineResult>;

  constructor() {
    this.revenueCalculator = new RevenueCalculator();
    this.cashFlowCalculator = new EnhancedCashFlowCalculator();
    this.financialCalculator = new FinancialCalculator();
    this.cache = new Map();
  }

  /**
   * Generate cache key from input parameters
   *
   * @param input - Project input
   * @param options - Calculation options
   * @returns Cache key
   */
  private generateCacheKey(input: ProjectInput, options: CalculationOptions): string {
    // Simple JSON stringify for now (can be improved with SHA-256)
    const key = JSON.stringify({
      input,
      options: {
        discountRate: options.discountRate ?? 0.08,
        projectLifetime: options.projectLifetime ?? 10,
      },
    });
    return key;
  }

  /**
   * Calculate complete project analysis
   *
   * @param input - Project input parameters
   * @param options - Calculation options
   * @returns Complete calculation result
   */
  async calculateProject(
    input: ProjectInput,
    options: CalculationOptions = {}
  ): Promise<EngineResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(input, options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const discountRate = options.discountRate ?? 0.08;
    const projectLifetime = options.projectLifetime ?? 10;

    try {
      // Step 1: Load province data
      const provinceData = await provinceDataRepository.getProvince(input.province);
      if (!provinceData) {
        throw new Error(`Province data not found for: ${input.province}`);
      }

      // Convert units from schema to calculator format
      // Schema: capacity (MW), duration (hours)
      // Calculator: capacity (kWh), power (kW)
      const capacityKWh = input.systemSize.capacity * 1000; // MW to kWh
      const powerKw = capacityKWh / input.systemSize.duration; // kWh / hours = kW

      // Step 2: Calculate revenue
      const revenueResult = this.revenueCalculator.calculateLifetimeRevenue(
        provinceData,
        capacityKWh,
        powerKw,
        input.operatingParams.systemEfficiency,
        input.operatingParams.depthOfDischarge,
        input.operatingParams.cyclesPerDay,
        input.operatingParams.degradationRate,
        projectLifetime
      );

      // Step 3: Calculate cash flows with real business costs
      const cashFlowResult = this.cashFlowCalculator.calculateCashFlows(
        input,
        provinceData,
        projectLifetime
      );

      // Step 4: Calculate financial metrics
      const financialMetrics = this.financialCalculator.calculateAllMetrics(
        cashFlowResult,
        input.systemSize.capacity,
        input.operatingParams.depthOfDischarge,
        input.operatingParams.cyclesPerDay,
        discountRate
      );

      // Step 5: Validate results
      const validation = this.financialCalculator.validateMetrics(financialMetrics);

      // Step 6: Build result
      const result: EngineResult = {
        projectId: 'temp', // Will be set by caller
        irr: financialMetrics.irr ?? 0,
        npv: financialMetrics.npv,
        paybackPeriod: cashFlowResult.paybackPeriod,
        annualCashFlows: cashFlowResult.annualCashFlows,
        revenueBreakdown: {
          peakValleyArbitrage: revenueResult.firstYearBreakdown.peakValleyArbitrage,
          capacityCompensation: revenueResult.firstYearBreakdown.capacityCompensation,
          demandResponse: revenueResult.firstYearBreakdown.demandResponse,
          auxiliaryServices: revenueResult.firstYearBreakdown.auxiliaryServices,
        },
        costBreakdown: {
          initialInvestment: cashFlowResult.totalInvestment,
          annualOpeex: cashFlowResult.totalOpex / Math.max(1, projectLifetime - 1), // Average per year
          annualFinancing: cashFlowResult.totalFinancing / Math.max(1, projectLifetime - 1), // Average per year
        },
        totalInvestment: cashFlowResult.totalInvestment,
        levelizedCost: financialMetrics.lcoc,
        capacityFactor: (input.operatingParams.cyclesPerDay * 2 * 365) / (8760), // Approximate
        calculatedAt: new Date(),
        calculationVersion: '1.0.0',
        validation,
        metrics: {
          irr: financialMetrics.irr,
          npv: financialMetrics.npv,
          roi: financialMetrics.roi,
          lcoc: financialMetrics.lcoc,
          profitMargin: financialMetrics.profitMargin,
        },
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      // Return error result
      const errorResult: EngineResult = {
        projectId: 'error',
        irr: 0,
        npv: 0,
        paybackPeriod: -1,
        annualCashFlows: [],
        revenueBreakdown: {
          peakValleyArbitrage: 0,
          capacityCompensation: 0,
          demandResponse: 0,
          auxiliaryServices: 0,
        },
        costBreakdown: {
          initialInvestment: 0,
          annualOpeex: 0,
          annualFinancing: 0,
        },
        totalInvestment: 0,
        levelizedCost: 0,
        capacityFactor: 0,
        calculatedAt: new Date(),
        calculationVersion: '1.0.0',
        validation: {
          valid: false,
          issues: [error instanceof Error ? error.message : 'Unknown error'],
        },
        metrics: {
          irr: null,
          npv: 0,
          roi: 0,
          lcoc: 0,
          profitMargin: 0,
        },
      };

      return errorResult;
    }
  }

  /**
   * Calculate multiple projects in parallel
   *
   * @param inputs - Array of project inputs
   * @param options - Calculation options
   * @returns Array of calculation results
   */
  async calculateProjects(
    inputs: ProjectInput[],
    options: CalculationOptions = {}
  ): Promise<EngineResult[]> {
    const results = await Promise.all(
      inputs.map(input => this.calculateProject(input, options))
    );

    return results;
  }

  /**
   * Clear calculation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   *
   * @returns Number of cached results
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Preload provinces for better performance
   *
   * @param provinces - Array of province slugs to preload
   */
  async preloadProvinces(provinces: string[]): Promise<void> {
    await provinceDataRepository.preload(provinces);
  }

  /**
   * Validate project inputs before calculation
   *
   * @param input - Project input
   * @returns Validation result
   */
  validateInput(input: ProjectInput): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Validate system size
    if (input.systemSize.capacity <= 0) {
      issues.push('System capacity must be positive');
    }
    if (input.systemSize.duration <= 0) {
      issues.push('System duration must be positive');
    }

    // Validate operating parameters
    if (input.operatingParams.systemEfficiency <= 0 || input.operatingParams.systemEfficiency > 1) {
      issues.push('System efficiency must be between 0 and 1');
    }
    if (input.operatingParams.depthOfDischarge <= 0 || input.operatingParams.depthOfDischarge > 1) {
      issues.push('Depth of discharge must be between 0 and 1');
    }
    if (input.operatingParams.depthOfDischarge > input.operatingParams.systemEfficiency) {
      issues.push('Depth of discharge should not exceed system efficiency');
    }
    if (input.operatingParams.cyclesPerDay < 0.1 || input.operatingParams.cyclesPerDay > 4) {
      issues.push('Cycles per day should be between 0.1 and 4');
    }
    if (input.operatingParams.degradationRate < 0 || input.operatingParams.degradationRate > 0.1) {
      issues.push('Degradation rate seems unusual (should be 0-10%)');
    }
    if (input.operatingParams.availabilityPercent < 0 || input.operatingParams.availabilityPercent > 1) {
      issues.push('Availability must be between 0 and 1');
    }

    // Validate financing
    if (input.financing) {
      if (input.financing.loanRatio !== undefined && (input.financing.loanRatio < 0 || input.financing.loanRatio > 0.9)) {
        issues.push('Loan ratio should be between 0 and 90%');
      }
      if (input.financing.interestRate !== undefined && (input.financing.interestRate < 0 || input.financing.interestRate > 0.2)) {
        issues.push('Interest rate should be between 0 and 20%');
      }
      if (input.financing.loanTerm !== undefined && (input.financing.loanTerm < 1 || input.financing.loanTerm > 20)) {
        issues.push('Loan term should be between 1 and 20 years');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get investment recommendation based on metrics
   *
   * @param result - Calculation result
   * @returns Investment recommendation (1-5 scale)
   */
  getRecommendation(result: EngineResult): {
    rating: 1 | 2 | 3 | 4 | 5;
    label: string;
    description: string;
  } {
    const { irr, npv, paybackPeriod } = result;

    // Rating criteria
    if (!result.validation.valid) {
      return {
        rating: 1,
        label: '不推荐 (Not Recommended)',
        description: '计算结果存在异常，请检查输入参数',
      };
    }

    if (irr === null || irr < 0) {
      return {
        rating: 1,
        label: '不推荐 (Not Recommended)',
        description: '项目内部收益率为负，投资将亏损',
      };
    }

    if (irr < 6) {
      return {
        rating: 2,
        label: '较差 (Poor)',
        description: '内部收益率低于6%，投资回报较低',
      };
    }

    if (irr < 10) {
      return {
        rating: 3,
        label: '一般 (Fair)',
        description: '内部收益率6-10%，投资回报一般',
      };
    }

    if (irr < 15) {
      return {
        rating: 4,
        label: '良好 (Good)',
        description: '内部收益率10-15%，投资回报良好',
      };
    }

    return {
      rating: 5,
      label: '优秀 (Excellent)',
      description: '内部收益率超过15%，投资回报优秀',
    };
  }
}

// Singleton instance
export const calculationEngine = new CalculationEngine();
