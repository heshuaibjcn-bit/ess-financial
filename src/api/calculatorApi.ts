/**
 * Calculator API - Functional API layer for energy storage calculations
 *
 * Provides a clean, functional API for all calculation operations.
 * Designed to be easily migratable to REST API calls.
 */

import { calculationEngine } from '../domain/services/CalculationEngine';
import { provinceDataRepository } from '../domain/repositories/ProvinceDataRepository';
import { RevenueCalculator } from '../domain/services/RevenueCalculator';
import { CashFlowCalculator } from '../domain/services/CashFlowCalculator';
import { FinancialCalculator } from '../domain/services/FinancialCalculator';
import type { ProjectInput } from '../domain/schemas/ProjectSchema';
import type { ProvinceData } from '../domain/schemas/ProvinceSchema';
import type { EngineResult } from '../domain/services/CalculationEngine';
import type { RevenueResult } from '../domain/services/RevenueCalculator';
import type { CashFlowResult } from '../domain/services/CashFlowCalculator';
import type { FinancialMetrics } from '../domain/services/FinancialCalculator';
import { ProjectInputSchema } from '../domain/schemas/ProjectSchema';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class CalculationError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'CalculationError';
  }
}

export class ProvinceNotFoundError extends Error {
  constructor(public provinceSlug: string) {
    super(`Province not found: ${provinceSlug}`);
    this.name = 'ProvinceNotFoundError';
  }
}

/**
 * Main calculation function
 *
 * @param input - Project input parameters
 * @param options - Calculation options
 * @returns Complete calculation result
 */
export async function calculateProject(
  input: ProjectInput,
  options?: {
    discountRate?: number;
    projectLifetime?: number;
    validateInputs?: boolean;
  }
): Promise<EngineResult> {
  // Validate inputs if requested
  if (options?.validateInputs !== false) {
    const validation = validateInput(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
  }

  try {
    return await calculationEngine.calculateProject(input, options);
  } catch (error) {
    if (error instanceof Error) {
      throw new CalculationError(
        `Calculation failed: ${error.message}`,
        error
      );
    }
    throw new CalculationError('Unknown calculation error', error);
  }
}

/**
 * Validate project input
 *
 * @param input - Project input to validate
 * @returns Validation result
 */
export function validateInput(input: ProjectInput): ValidationResult {
  const result = ProjectInputSchema.safeParse(input);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });

    return {
      valid: false,
      errors,
    };
  }

  // Additional business logic validation
  const warnings: string[] = [];
  const { systemSize, operatingParams } = input;

  // Check power vs capacity ratio
  const powerToCapacityRatio = systemSize.power / systemSize.capacity;
  if (powerToCapacityRatio > 0.5) {
    warnings.push('功率与容量比率较高，可能导致充放电时间过短');
  }

  // Check degradation rate
  if (operatingParams.degradationRate > 0.03) {
    warnings.push('衰减率较高，可能影响项目长期收益');
  }

  // Check cycles per day
  if (operatingParams.cyclesPerDay > 2) {
    warnings.push('日循环次数较多，可能影响电池寿命');
  }

  return {
    valid: true,
    errors: [],
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Calculate revenue breakdown only
 *
 * @param input - Project input
 * @param province - Province data (will be loaded if not provided)
 * @returns Revenue calculation result
 */
export async function calculateRevenue(
  input: ProjectInput,
  province?: ProvinceData
): Promise<RevenueResult> {
  const provinceData = province ?? await loadProvince(input.province);

  if (!provinceData) {
    throw new ProvinceNotFoundError(input.province);
  }

  const revenueCalculator = new RevenueCalculator();

  return revenueCalculator.calculateLifetimeRevenue(
    provinceData,
    input.systemSize.capacity,
    input.systemSize.power,
    input.operatingParams.systemEfficiency,
    input.operatingParams.dod,
    input.operatingParams.cyclesPerDay,
    input.operatingParams.degradationRate
  );
}

/**
 * Calculate cash flows only
 *
 * @param input - Project input
 * @param province - Province data (will be loaded if not provided)
 * @returns Cash flow result
 */
export async function calculateCashFlow(
  input: ProjectInput,
  province?: ProvinceData
): Promise<CashFlowResult> {
  const provinceData = province ?? await loadProvince(input.province);

  if (!provinceData) {
    throw new ProvinceNotFoundError(input.province);
  }

  const cashFlowCalculator = new CashFlowCalculator();

  return cashFlowCalculator.calculateCashFlows(input, provinceData);
}

/**
 * Calculate financial metrics only
 *
 * @param input - Project input
 * @param cashFlowResult - Cash flow result (optional, will be calculated if not provided)
 * @param discountRate - Discount rate (default: 8%)
 * @returns Financial metrics
 */
export async function calculateMetrics(
  input: ProjectInput,
  cashFlowResult?: CashFlowResult,
  discountRate?: number
): Promise<FinancialMetrics> {
  const financialCalculator = new FinancialCalculator();

  // If cash flow not provided, calculate it first
  const cfResult = cashFlowResult ?? await calculateCashFlow(input);

  return financialCalculator.calculateAllMetrics(
    cfResult,
    input.systemSize.capacity,
    input.operatingParams.dod,
    input.operatingParams.cyclesPerDay,
    discountRate ?? 0.08
  );
}

/**
 * Load province data
 *
 * @param slug - Province slug (e.g., 'guangdong')
 * @returns Province data
 */
export async function loadProvince(slug: string): Promise<ProvinceData | null> {
  return provinceDataRepository.getProvince(slug);
}

/**
 * Load multiple provinces at once
 *
 * @param slugs - Array of province slugs
 * @returns Map of province slug to data
 */
export async function loadProvinces(
  slugs: string[]
): Promise<Map<string, ProvinceData>> {
  return provinceDataRepository.getProvinces(slugs);
}

/**
 * Get list of supported provinces
 *
 * @returns Array of province slugs
 */
export function getSupportedProvinces(): string[] {
  return provinceDataRepository.getSupportedProvinces();
}

/**
 * Preload provinces for better performance
 *
 * @param provinces - Array of province slugs to preload
 */
export async function preloadProvinces(provinces: string[]): Promise<void> {
  await provinceDataRepository.preload(provinces);
}

/**
 * Batch calculate multiple projects
 *
 * @param inputs - Array of project inputs
 * @param options - Calculation options
 * @returns Array of calculation results
 */
export async function calculateProjects(
  inputs: ProjectInput[],
  options?: {
    discountRate?: number;
    projectLifetime?: number;
    validateInputs?: boolean;
  }
): Promise<EngineResult[]> {
  return Promise.all(
    inputs.map((input) => calculateProject(input, options))
  );
}

/**
 * Export calculation results for sharing
 *
 * @param result - Calculation result
 * @param input - Project input
 * @returns Shareable URL or encoded data
 */
export function exportForSharing(
  result: EngineResult,
  input: ProjectInput
): string {
  // Encode input parameters into a shareable string
  const encoded = btoa(JSON.stringify(input));

  // Return a shareable URL
  return `${window.location.origin}?project=${encoded}`;
}

/**
 * Import shared project from URL
 *
 * @param searchParams - URL search params
 * @returns Project input or null
 */
export function importFromSharing(
  searchParams: URLSearchParams
): ProjectInput | null {
  const projectParam = searchParams.get('project');

  if (!projectParam) {
    return null;
  }

  try {
    const decoded = atob(projectParam);
    const input = JSON.parse(decoded) as ProjectInput;

    // Validate the imported input
    const validation = validateInput(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }

    return input;
  } catch (error) {
    console.error('Failed to import shared project:', error);
    return null;
  }
}

/**
 * Clear calculation cache
 */
export function clearCache(): void {
  calculationEngine.clearCache();
}

/**
 * Get cache size (number of cached results)
 */
export function getCacheSize(): number {
  return calculationEngine.getCacheSize();
}

/**
 * Get investment recommendation
 *
 * @param result - Calculation result
 * @returns Recommendation object
 */
export function getRecommendation(result: EngineResult): {
  rating: 1 | 2 | 3 | 4 | 5;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
} {
  const recommendation = calculationEngine.getRecommendation(result);

  return {
    rating: recommendation.rating,
    label: recommendation.label,
    labelEn: {
      1: 'Not Recommended',
      2: 'Poor',
      3: 'Fair',
      4: 'Good',
      5: 'Excellent',
    }[recommendation.rating],
    description: recommendation.description,
    descriptionEn: {
      1: 'Calculation results have anomalies, please verify input parameters',
      2: 'IRR is negative, investment will result in loss',
      3: 'IRR is below 6%, investment return is low',
      4: 'IRR is 10-15%, investment return is good',
      5: 'IRR exceeds 15%, investment return is excellent',
    }[recommendation.rating],
  };
}

/**
 * Check if province is supported
 *
 * @param slug - Province slug
 * @returns True if supported
 */
export function isProvinceSupported(slug: string): boolean {
  return provinceDataRepository.isSupported(slug);
}
