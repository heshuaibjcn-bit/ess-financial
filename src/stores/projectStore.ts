/**
 * projectStore - Manages project input state
 *
 * Handles:
 * - Current project being edited
 * - Saved projects list
 * - CRUD operations for projects
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import { ProjectInputSchema } from '@/domain/schemas/ProjectSchema';
import type { UserProject } from '@/domain/models/Project';

/**
 * Generate unique ID for projects
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Project store state
 */
interface ProjectState {
  // Current project being edited
  currentProject: ProjectInput | null;

  // Saved projects
  savedProjects: UserProject[];

  // Currently selected project ID
  selectedProjectId: string | null;

  // Validation state
  validationErrors: string[];

  // Auto-save state
  isSaving: boolean;
  lastSaved: Date | null;

  // Actions
  setCurrentProject: (project: ProjectInput) => void;
  updateProjectField: <K extends keyof ProjectInput>(field: K, value: ProjectInput[K]) => void;
  clearCurrentProject: () => void;

  saveProject: (name?: string, description?: string) => Promise<string>;
  loadProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<string>;

  selectProject: (id: string | null) => void;
  updateSelectedProject: (updates: Partial<ProjectInput>) => Promise<void>;

  validateCurrentProject: () => boolean;
  clearValidationErrors: () => void;
}

/**
 * Project store with localStorage persistence
 */
export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      savedProjects: [],
      selectedProjectId: null,
      validationErrors: [],
      isSaving: false,
      lastSaved: null,

      // Set current project
      setCurrentProject: (project) => {
        set({ currentProject: project });
        get().validateCurrentProject();
      },

      // Update a single field in current project
      updateProjectField: (field, value) => {
        const currentProject = get().currentProject;
        if (!currentProject) {
          // Create new project with defaults if none exists
          const defaultProject: ProjectInput = {
            province: 'guangdong',
            systemSize: { capacity: 2000, power: 500 },
            costs: {
              battery: 0.5,
              pcs: 0.15,
              bms: 0.05,
              ems: 0.03,
              thermalManagement: 0.04,
              fireProtection: 0.02,
              container: 0.03,
              installation: 0.08,
              other: 0.02,
            },
            operatingParams: {
              systemEfficiency: 0.90,
              dod: 0.85,
              cyclesPerDay: 2,
              degradationRate: 0.02,
            },
            financing: {
              loanRatio: 0.6,
              interestRate: 0.045,
              term: 10,
            },
          };
          set({ currentProject: { ...defaultProject, [field]: value } });
        } else {
          set({ currentProject: { ...currentProject, [field]: value } });
        }
        get().validateCurrentProject();
      },

      // Clear current project
      clearCurrentProject: () => {
        set({
          currentProject: null,
          validationErrors: [],
          lastSaved: null,
        });
      },

      // Save current project
      saveProject: async (name, description) => {
        const currentProject = get().currentProject;
        if (!currentProject) {
          throw new Error('No project to save');
        }

        set({ isSaving: true });

        try {
          const savedProjects = get().savedProjects;
          const now = new Date();

          // Check if updating existing project or creating new one
          const selectedId = get().selectedProjectId;
          const existingIndex = selectedId
            ? savedProjects.findIndex(p => p.id === selectedId)
            : -1;

          const userProject: UserProject = {
            ...currentProject,
            id: existingIndex >= 0 ? savedProjects[existingIndex].id : generateId(),
            projectName: name || savedProjects[existingIndex]?.projectName || `项目 ${savedProjects.length + 1}`,
            description: description || savedProjects[existingIndex]?.description,
            createdAt: existingIndex >= 0 ? savedProjects[existingIndex].createdAt : now,
            updatedAt: now,
            version: existingIndex >= 0 ? savedProjects[existingIndex].version + 1 : 1,
            isShared: false,
          };

          let newSavedProjects: UserProject[];
          let newProjectId: string;

          if (existingIndex >= 0) {
            // Update existing project
            newSavedProjects = [...savedProjects];
            newSavedProjects[existingIndex] = userProject;
            newProjectId = userProject.id;
          } else {
            // Add new project
            newSavedProjects = [...savedProjects, userProject];
            newProjectId = userProject.id;
          }

          set({
            savedProjects: newSavedProjects,
            selectedProjectId: newProjectId,
            lastSaved: now,
            isSaving: false,
          });

          return newProjectId;
        } catch (error) {
          set({ isSaving: false });
          throw error;
        }
      },

      // Load a project
      loadProject: async (id) => {
        const savedProjects = get().savedProjects;
        const project = savedProjects.find(p => p.id === id);

        if (!project) {
          throw new Error(`Project not found: ${id}`);
        }

        // Extract project input fields
        const { projectName, description, createdAt, updatedAt, version, isShared, shareToken, shareExpiresAt, ...projectInput } = project;

        set({
          currentProject: projectInput,
          selectedProjectId: id,
          validationErrors: [],
        });
      },

      // Delete a project
      deleteProject: async (id) => {
        const savedProjects = get().savedProjects;
        const newSavedProjects = savedProjects.filter(p => p.id !== id);

        set({ savedProjects: newSavedProjects });

        // Clear current project if it was the deleted one
        if (get().selectedProjectId === id) {
          set({
            selectedProjectId: null,
            currentProject: null,
          });
        }
      },

      // Duplicate a project
      duplicateProject: async (id) => {
        const savedProjects = get().savedProjects;
        const project = savedProjects.find(p => p.id === id);

        if (!project) {
          throw new Error(`Project not found: ${id}`);
        }

        const { projectName, description, createdAt, updatedAt, version, isShared, id: _, shareToken, shareExpiresAt, ...projectInput } = project;

        const duplicatedProject: UserProject = {
          ...projectInput,
          id: generateId(),
          projectName: `${projectName} (副本)`,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          isShared: false,
        };

        set({
          savedProjects: [...savedProjects, duplicatedProject],
        });

        return duplicatedProject.id;
      },

      // Select a project (without loading it into editor)
      selectProject: (id) => {
        set({ selectedProjectId: id });
      },

      // Update selected project
      updateSelectedProject: async (updates) => {
        const selectedId = get().selectedProjectId;
        if (!selectedId) {
          throw new Error('No project selected');
        }

        const savedProjects = get().savedProjects;
        const index = savedProjects.findIndex(p => p.id === selectedId);

        if (index < 0) {
          throw new Error('Selected project not found');
        }

        const updatedProject = {
          ...savedProjects[index],
          ...updates,
          updatedAt: new Date(),
          version: savedProjects[index].version + 1,
        };

        const newSavedProjects = [...savedProjects];
        newSavedProjects[index] = updatedProject;

        set({ savedProjects: newSavedProjects });
      },

      // Validate current project
      validateCurrentProject: () => {
        const currentProject = get().currentProject;

        if (!currentProject) {
          set({ validationErrors: [] });
          return false;
        }

        const result = ProjectInputSchema.safeParse(currentProject);

        if (!result.success) {
          const errors = result.error.issues.map(issue => issue.message);
          set({ validationErrors: errors });
          return false;
        }

        set({ validationErrors: [] });
        return true;
      },

      // Clear validation errors
      clearValidationErrors: () => {
        set({ validationErrors: [] });
      },
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedProjects: state.savedProjects,
        selectedProjectId: state.selectedProjectId,
      }),
    }
  )
);

/**
 * Selector hooks for common use cases
 */
export const useCurrentProject = () => useProjectStore((state) => state.currentProject);
export const useSavedProjects = () => useProjectStore((state) => state.savedProjects);
export const useSelectedProjectId = () => useProjectStore((state) => state.selectedProjectId);
export const useValidationErrors = () => useProjectStore((state) => state.validationErrors);
export const useIsSaving = () => useProjectStore((state) => state.isSaving);
