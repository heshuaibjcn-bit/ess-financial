/**
 * useProject - React hook for project management
 *
 * Provides CRUD operations for projects with automatic validation
 */

import { useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import type { UserProject } from '@/domain/models/Project';

/**
 * Hook for project management
 *
 * @returns Project state and actions
 */
export function useProject() {
  const {
    currentProject,
    savedProjects,
    selectedProjectId,
    validationErrors,
    isSaving,
    lastSaved,
    setCurrentProject,
    updateProjectField,
    clearCurrentProject,
    saveProject,
    loadProject,
    deleteProject,
    duplicateProject,
    selectProject,
    validateCurrentProject,
    clearValidationErrors,
  } = useProjectStore();

  /**
   * Get selected project
   */
  const selectedProject = savedProjects.find((p) => p.id === selectedProjectId) || null;

  /**
   * Update a field in current project
   */
  const updateField = useCallback(
    <K extends keyof ProjectInput>(field: K, value: ProjectInput[K]) => {
      updateProjectField(field, value);
    },
    [updateProjectField]
  );

  /**
   * Save current project
   */
  const save = useCallback(
    async (name?: string, description?: string) => {
      return await saveProject(name, description);
    },
    [saveProject]
  );

  /**
   * Load project by ID
   */
  const load = useCallback(
    async (id: string) => {
      await loadProject(id);
    },
    [loadProject]
  );

  /**
   * Delete project by ID
   */
  const remove = useCallback(
    async (id: string) => {
      await deleteProject(id);
    },
    [deleteProject]
  );

  /**
   * Duplicate project
   */
  const duplicate = useCallback(
    async (id: string) => {
      return await duplicateProject(id);
    },
    [duplicateProject]
  );

  /**
   * Check if current project has unsaved changes
   */
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!currentProject) return false;
    if (!selectedProjectId) return true;

    const selectedProject = savedProjects.find((p) => p.id === selectedProjectId);
    if (!selectedProject) return true;

    // Compare current project with saved project
    const savedProjectInput: ProjectInput = {
      province: selectedProject.province,
      systemSize: selectedProject.systemSize,
      costs: selectedProject.costs,
      operatingParams: selectedProject.operatingParams,
      financing: selectedProject.financing,
      projectName: selectedProject.projectName,
      description: selectedProject.description,
    };

    return JSON.stringify(currentProject) !== JSON.stringify(savedProjectInput);
  }, [currentProject, savedProjects, selectedProjectId]);

  /**
   * Validate current project
   */
  const validate = useCallback((): boolean => {
    return validateCurrentProject();
  }, [validateCurrentProject]);

  /**
   * Check if current project is valid
   */
  const isValid = validationErrors.length === 0;

  return {
    // State
    currentProject,
    savedProjects,
    selectedProject,
    validationErrors,
    isSaving,
    lastSaved,
    isValid,
    hasUnsavedChanges: hasUnsavedChanges(),

    // Actions
    setCurrentProject,
    updateField,
    clearCurrentProject,
    save,
    load,
    remove,
    duplicate,
    selectProject,
    validate,
    clearValidationErrors,
  };
}

/**
 * Hook for current project only
 */
export function useCurrentProject(): ProjectInput | null {
  return useProjectStore((state) => state.currentProject);
}

/**
 * Hook for saved projects list
 */
export function useSavedProjects(): UserProject[] {
  return useProjectStore((state) => state.savedProjects);
}

/**
 * Hook for validation errors
 */
export function useValidationErrors(): string[] {
  return useProjectStore((state) => state.validationErrors);
}
