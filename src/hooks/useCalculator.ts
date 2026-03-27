/**
 * useCalculator - React hook for calculator functionality
 *
 * Provides easy access to calculation operations with auto-loading/error handling
 */

import { useCallback, useEffect } from 'react';
import { useCalculationStore } from '@/stores/calculationStore';
import { useProjectStore } from '@/stores/projectStore';
import { calculateProject, clearCache } from '@/api/calculatorApi';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import type { EngineResult } from '@/domain/services/CalculationEngine';

/**
 * Hook for calculator functionality
 *
 * @param options - Configuration options
 * @returns Calculator state and actions
 */
export function useCalculator(options?: {
  autoCalculate?: boolean;
  debounceMs?: number;
}) {
  const {
    result,
    loading,
    error,
    calculate: storeCalculate,
    clearResult,
    clearError,
  } = useCalculationStore();

  const { currentProject } = useProjectStore();

  const autoCalculate = options?.autoCalculate ?? true;
  const debounceMs = options?.debounceMs ?? 300;

  /**
   * Trigger calculation
   */
  const triggerCalculation = useCallback(async (input?: ProjectInput) => {
    const projectToCalculate = input || currentProject;

    if (!projectToCalculate) {
      console.warn('No project to calculate');
      return;
    }

    try {
      console.log('🧮 Starting calculation with:', projectToCalculate);
      const result = await storeCalculate(projectToCalculate);
      console.log('✅ Calculation result:', result);
      return result;
    } catch (err) {
      // Error is stored in the store
      console.error('❌ Calculation failed:', err);
      throw err;
    }
  }, [currentProject, storeCalculate]);

  /**
   * Retry last calculation
   */
  const retry = useCallback(async () => {
    clearError();
    await triggerCalculation();
  }, [clearError, triggerCalculation]);

  /**
   * Clear cache and result
   */
  const reset = useCallback(() => {
    clearResult();
    clearCache();
  }, [clearResult]);

  /**
   * Auto-calculate when project changes (debounced)
   */
  useEffect(() => {
    if (!autoCalculate || !currentProject) {
      return;
    }

    const timeoutId = setTimeout(() => {
      triggerCalculation();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [autoCalculate, currentProject, debounceMs, triggerCalculation]);

  return {
    // State
    result,
    loading,
    error,

    // Computed
    isValid: result?.validation.valid ?? false,
    hasResult: result !== null,
    isCalculating: loading,

    // Actions
    triggerCalculation,
    retry,
    reset,
    clearError,
  };
}

/**
 * Hook for calculation result with type safety
 */
export function useCalculationResult(): EngineResult | null {
  return useCalculationStore((state) => state.result);
}

/**
 * Hook for loading state
 */
export function useCalculationLoading(): boolean {
  return useCalculationStore((state) => state.loading);
}

/**
 * Hook for error state
 */
export function useCalculationError(): string | null {
  return useCalculationStore((state) => state.error);
}
