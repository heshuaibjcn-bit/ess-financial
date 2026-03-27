/**
 * Hooks index - Export all hooks
 */

export { useCalculator, useCalculationResult as useCalcResult, useCalculationLoading as useCalcLoading, useCalculationError as useCalcError } from './useCalculator';
export { useProject, useCurrentProject as useCurrentProjectInput, useSavedProjects as useSavedProjectsList, useValidationErrors as useProjectValidationErrors } from './useProject';
export { useProvince, useProvinces, useSupportedProvinces, usePreloadProvinces, useIsProvinceSupported, useProvinceNames, useProvinceOptions } from './useProvince';
