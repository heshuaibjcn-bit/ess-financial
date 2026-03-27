/**
 * Calculation Service Interface
 *
 * Defines the contract for financial calculations.
 * This is the core service that produces IRR, NPV, and cash flow projections.
 */

import type { ProjectInput } from '../../schemas/ProjectSchema';
import type { CalculationResult, CalculationValidation } from '../../models/CalculationResult';

export interface ICalculationService {
  /**
   * Calculate complete financial metrics for a project
   * @param input - Project input parameters
   * @param options - Calculation options
   * @returns Promise<CalculationResult>
   */
  calculate(
    input: ProjectInput,
    options?: {
      discountRate?: number;
      projectLifetime?: number;
      inflationRate?: number;
      includeSensitivity?: boolean;
    }
  ): Promise<CalculationResult>;

  /**
   * Validate project inputs before calculation
   * @param input - Project input parameters
   * @returns Promise<CalculationValidation>
   */
  validate(input: ProjectInput): Promise<CalculationValidation>;

  /**
   * Get calculation progress (for long-running calculations)
   * @param calculationId - Calculation identifier
   * @returns Promise<{ progress: number; status: string }>
   */
  getProgress(calculationId: string): Promise<{
    progress: number; // 0-100
    status: 'pending' | 'calculating' | 'completed' | 'failed';
    message?: string;
  }>;

  /**
   * Cancel a running calculation
   * @param calculationId - Calculation identifier
   * @returns Promise<boolean>
   */
  cancel(calculationId: string): Promise<boolean>;

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<{
    size: number;
    hitRate: number;
    memoryUsage: number;
  }>;

  /**
   * Clear calculation cache
   */
  clearCache(): Promise<void>;

  /**
   * Invalidate cache for a specific province
   * @param province - Province code
   */
  invalidateProvinceCache(province: string): Promise<void>;
}
