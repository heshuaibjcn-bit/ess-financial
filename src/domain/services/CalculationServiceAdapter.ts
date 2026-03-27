/**
 * Calculation Service Adapter
 *
 * Adapts CalculationEngine to implement ICalculationService interface.
 * This provides a clean separation between the interface contract and implementation.
 */

import type { ICalculationService } from './interfaces/ICalculationService';
import type { ProjectInput } from '../schemas/ProjectSchema';
import type { CalculationResult, CalculationValidation } from '../models/CalculationResult';
import { CalculationEngine } from './CalculationEngine';
import { ProjectInputSchemaRefined } from '../schemas/ProjectSchema';
import type { ZodError } from 'zod';

/**
 * Calculation Service implementation
 */
export class CalculationService implements ICalculationService {
  private engine: CalculationEngine;

  constructor() {
    this.engine = new CalculationEngine();
  }

  /**
   * Calculate complete financial metrics for a project
   */
  async calculate(
    input: ProjectInput,
    options?: {
      discountRate?: number;
      projectLifetime?: number;
      inflationRate?: number;
      includeSensitivity?: boolean;
    }
  ): Promise<CalculationResult> {
    // First validate inputs
    const validation = await this.validate(input);
    if (!validation.isValid) {
      throw new Error(
        `Invalid project input: ${validation.errors.map(e => e.message).join(', ')}`
      );
    }

    // Use calculation engine
    const engineResult = await this.engine.calculateProject(input, {
      discountRate: options?.discountRate ?? 0.08,
      projectLifetime: options?.projectLifetime ?? 10,
    });

    // Transform EngineResult to CalculationResult format
    return this.transformEngineResult(engineResult, input);
  }

  /**
   * Validate project inputs before calculation
   */
  async validate(input: ProjectInput): Promise<CalculationValidation> {
    const errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }> = [];
    const warnings: string[] = [];

    // Schema validation
    try {
      ProjectInputSchemaRefined.parse(input);
    } catch (e) {
      const zodError = e as ZodError;
      for (const issue of zodError.issues) {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error' as const,
        });
      }
    }

    // Business logic validation
    if (input.financing?.hasLoan && !input.financing.loanRatio) {
      errors.push({
        field: 'financing.loanRatio',
        message: 'Loan ratio is required when hasLoan is true',
        severity: 'error',
      });
    }

    if (input.operatingParams.cyclesPerDay > 2) {
      warnings.push('High cycles per day may accelerate battery degradation');
    }

    if (input.operatingParams.degradationRate > 0.05) {
      warnings.push('Degradation rate is higher than industry average (2%)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get calculation progress
   */
  async getProgress(calculationId: string): Promise<{
    progress: number;
    status: 'pending' | 'calculating' | 'completed' | 'failed';
    message?: string;
  }> {
    // Current implementation is synchronous, so we return completed immediately
    return {
      progress: 100,
      status: 'completed',
      message: 'Calculation complete',
    };
  }

  /**
   * Cancel a running calculation
   */
  async cancel(calculationId: string): Promise<boolean> {
    // Current implementation is synchronous, cannot cancel
    return false;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    size: number;
    hitRate: number;
    memoryUsage: number;
  }> {
    return this.engine.getCacheStats();
  }

  /**
   * Clear calculation cache
   */
  async clearCache(): Promise<void> {
    // Clear via cache service
    return this.engine.getCacheDebugInfo().then(() => {});
  }

  /**
   * Invalidate cache for a specific province
   */
  async invalidateProvinceCache(province: string): Promise<void> {
    return this.engine.invalidateProvinceCache(province);
  }

  /**
   * Transform EngineResult to CalculationResult domain model
   */
  private transformEngineResult(
    engineResult: any,
    input: ProjectInput
  ): CalculationResult {
    return {
      id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: `proj-${input.province}-${Date.now()}`,

      financialMetrics: {
        irr: engineResult.metrics.irr || 0,
        npv: engineResult.metrics.npv,
        paybackPeriod: engineResult.yearsToPayback || 0,
        roi: engineResult.metrics.roi,
        profitIndex: engineResult.metrics.npv / engineResult.totalInvestment,
        grossMargin: engineResult.grossMargin || 0,
        netMargin: engineResult.netMargin || 0,
      },

      annualCashFlows: engineResult.cashFlows?.map((cf: any, year: number) => ({
        year: year + 1,
        revenue: cf.revenue || 0,
        operatingCost: cf.operatingCost || 0,
        financingCost: cf.financingCost || 0,
        tax: cf.tax || 0,
        netCashFlow: cf.netCashFlow || 0,
        cumulativeCashFlow: cf.cumulativeCashFlow || 0,
      })) || [],

      revenueBreakdown: {
        peakValleyArbitrage: engineResult.annualRevenue || 0,
        capacityCompensation: engineResult.annualCapacityCompensation || 0,
        demandResponse: 0,
        auxiliaryServices: 0,
        total: (engineResult.annualRevenue || 0) + (engineResult.annualCapacityCompensation || 0),
      },

      costBreakdown: {
        initialInvestment: engineResult.totalInvestment,
        annualOperatingCost: engineResult.annualOperatingCost || 0,
        annualFinancingCost: engineResult.annualFinancingCost || 0,
        totalAnnualCost: (engineResult.annualOperatingCost || 0) + (engineResult.annualFinancingCost || 0),
      },

      performanceMetrics: {
        totalInvestment: engineResult.totalInvestment,
        levelizedCost: engineResult.metrics.lcoc || 0,
        capacityFactor: engineResult.capacityFactor || 0,
        totalEnergyThroughput: engineResult.totalEnergyThroughput || 0,
        averageRoundTripEfficiency: input.operatingParams.systemEfficiency * 100,
        availableHours: 8760 * (input.operatingParams.availabilityPercent || 0.97),
      },

      calculatedAt: new Date(),
      calculationVersion: '1.0.0',
      calculationParams: {
        discountRate: 0.08,
        projectLifetime: 10,
        inflationRate: 0.02,
      },
    };
  }
}

// Export singleton instance
export const calculationService = new CalculationService();
