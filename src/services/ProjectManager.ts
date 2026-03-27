/**
 * ProjectManager - Project CRUD operations
 *
 * Manages project lifecycle:
 * - Create, read, update, delete projects
 * - Project list with search, sort, filter
 * - localStorage persistence
 */

import { v4 as uuidv4 } from 'uuid';
import { ProjectInput, ProjectResult } from '../schemas';
import { calculateProject } from '../../api/calculatorApi';

// Project metadata
export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  province: string;
  systemSize: number; // MW
  irr?: number; // Cached IRR for quick display
  tags?: string[];
  isFavorite?: boolean;
}

// Stored project with metadata and data
export interface StoredProject extends ProjectMetadata {
  input: ProjectInput;
  result?: ProjectResult;
}

// Project list item (lightweight)
export interface ProjectListItem extends ProjectMetadata {
  hasResult: boolean;
}

// Project list filter options
export interface ProjectFilters {
  search?: string;
  province?: string;
  minIrr?: number;
  maxIrr?: number;
  tags?: string[];
  favorites?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Project list sort options
export type ProjectSortBy =
  | 'updatedAt'
  | 'createdAt'
  | 'name'
  | 'irr'
  | 'systemSize'
  | 'paybackPeriod';

export type SortOrder = 'asc' | 'desc';

export interface ProjectSortOptions {
  sortBy: ProjectSortBy;
  order: SortOrder;
}

// Project list result
export interface ProjectListResult {
  projects: ProjectListItem[];
  total: number;
  filtered: number;
}

const STORAGE_KEY = 'ess_financial_projects';
const STORAGE_VERSION = 1;

export class ProjectManager {
  private projects: Map<string, StoredProject> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Create a new project
   */
  async createProject(
    input: ProjectInput,
    name: string,
    description?: string,
    tags?: string[]
  ): Promise<StoredProject> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const metadata: ProjectMetadata = {
      id,
      name,
      description: description || '',
      createdAt: now,
      updatedAt: now,
      province: input.province,
      systemSize: input.systemSize.capacity,
      tags: tags || [],
      isFavorite: false,
    };

    // Calculate project to get initial results
    const result = await calculateProject(input);

    metadata.irr = result.financials.irr;

    const project: StoredProject = {
      ...metadata,
      input,
      result,
    };

    this.projects.set(id, project);
    this.saveToStorage();

    return project;
  }

  /**
   * Get project by ID
   */
  getProject(id: string): StoredProject | undefined {
    return this.projects.get(id);
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    updates: Partial<Pick<StoredProject, 'name' | 'description' | 'tags' | 'isFavorite'>>
  ): Promise<StoredProject | null> {
    const project = this.projects.get(id);
    if (!project) return null;

    const updated = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.projects.set(id, updated);
    this.saveToStorage();

    return updated;
  }

  /**
   * Update project input and recalculate
   */
  async updateProjectInput(id: string, input: ProjectInput): Promise<StoredProject | null> {
    const project = this.projects.get(id);
    if (!project) return null;

    // Recalculate with new input
    const result = await calculateProject(input);

    const updated: StoredProject = {
      ...project,
      input,
      result,
      province: input.province,
      systemSize: input.systemSize.capacity,
      irr: result.financials.irr,
      updatedAt: new Date().toISOString(),
    };

    this.projects.set(id, updated);
    this.saveToStorage();

    return updated;
  }

  /**
   * Delete project
   */
  deleteProject(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Duplicate project
   */
  async duplicateProject(id: string, newName?: string): Promise<StoredProject | null> {
    const original = this.projects.get(id);
    if (!original) return null;

    const newId = uuidv4();
    const now = new Date().toISOString();

    const duplicated: StoredProject = {
      ...original,
      id: newId,
      name: newName || `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    this.projects.set(newId, duplicated);
    this.saveToStorage();

    return duplicated;
  }

  /**
   * Get project list with filtering and sorting
   */
  getProjectList(filters?: ProjectFilters, sort?: ProjectSortOptions): ProjectListResult {
    let projects = Array.from(this.projects.values());

    // Apply filters
    if (filters) {
      projects = this.applyFilters(projects, filters);
    }

    // Apply sorting
    if (sort) {
      projects = this.applySorting(projects, sort);
    }

    // Convert to list items
    const listItems: ProjectListItem[] = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      province: p.province,
      systemSize: p.systemSize,
      irr: p.irr,
      tags: p.tags,
      isFavorite: p.isFavorite,
      hasResult: !!p.result,
    }));

    return {
      projects: listItems,
      total: this.projects.size,
      filtered: projects.length,
    };
  }

  /**
   * Apply filters to project list
   */
  private applyFilters(projects: StoredProject[], filters: ProjectFilters): StoredProject[] {
    let filtered = projects;

    // Search by name or description
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by province
    if (filters.province) {
      filtered = filtered.filter((p) => p.province === filters.province);
    }

    // Filter by IRR range
    if (filters.minIrr !== undefined) {
      filtered = filtered.filter((p) => (p.irr ?? -Infinity) >= filters.minIrr!);
    }
    if (filters.maxIrr !== undefined) {
      filtered = filtered.filter((p) => (p.irr ?? Infinity) <= filters.maxIrr!);
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((p) =>
        filters.tags!.some((tag) => p.tags?.includes(tag))
      );
    }

    // Filter by favorites
    if (filters.favorites) {
      filtered = filtered.filter((p) => p.isFavorite);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter((p) => p.createdAt >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((p) => p.createdAt <= filters.dateTo!);
    }

    return filtered;
  }

  /**
   * Apply sorting to project list
   */
  private applySorting(projects: StoredProject[], sort: ProjectSortOptions): StoredProject[] {
    const { sortBy, order } = sort;

    return [...projects].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'irr':
          comparison = (a.irr ?? -Infinity) - (b.irr ?? -Infinity);
          break;
        case 'systemSize':
          comparison = a.systemSize - b.systemSize;
          break;
        case 'paybackPeriod':
          const aPayback = a.result?.financials.paybackPeriod ?? Infinity;
          const bPayback = b.result?.financials.paybackPeriod ?? Infinity;
          comparison = aPayback - bPayback;
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Get all unique tags
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.projects.forEach((project) => {
      project.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Get province statistics
   */
  getProvinceStats(): { province: string; count: number }[] {
    const stats = new Map<string, number>();

    this.projects.forEach((project) => {
      const count = stats.get(project.province) || 0;
      stats.set(project.province, count + 1);
    });

    return Array.from(stats.entries())
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get IRR distribution
   */
  getIrrDistribution(): { min: number; max: number; avg: number; median: number } {
    const irrs = Array.from(this.projects.values())
      .map((p) => p.irr)
      .filter((irr): irr is number => irr !== undefined);

    if (irrs.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0 };
    }

    const min = Math.min(...irrs);
    const max = Math.max(...irrs);
    const avg = irrs.reduce((sum, irr) => sum + irr, 0) / irrs.length;

    const sorted = irrs.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    return { min, max, avg, median };
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(id: string): boolean {
    const project = this.projects.get(id);
    if (!project) return false;

    project.isFavorite = !project.isFavorite;
    project.updatedAt = new Date().toISOString();

    this.projects.set(id, project);
    this.saveToStorage();

    return project.isFavorite;
  }

  /**
   * Get total storage size
   */
  getStorageSize(): number {
    const data = JSON.stringify(Array.from(this.projects.entries()));
    return new Blob([data]).size;
  }

  /**
   * Load projects from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);

      // Check version
      if (data.version !== STORAGE_VERSION) {
        console.warn('Project storage version mismatch, starting fresh');
        return;
      }

      // Restore projects
      if (data.projects && Array.isArray(data.projects)) {
        this.projects = new Map(data.projects);
      }
    } catch (error) {
      console.error('Error loading projects from storage:', error);
      this.projects.clear();
    }
  }

  /**
   * Save projects to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        version: STORAGE_VERSION,
        projects: Array.from(this.projects.entries()),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving projects to storage:', error);

      // Check if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, consider exporting old projects');
      }
    }
  }

  /**
   * Export all projects as JSON
   */
  exportProjects(): string {
    const data = {
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      projects: Array.from(this.projects.values()),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import projects from JSON
   */
  async importProjects(json: string, merge: boolean = false): Promise<number> {
    const data = JSON.parse(json);

    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('Invalid import data format');
    }

    let imported = 0;

    for (const project of data.projects) {
      try {
        // Validate project structure
        if (!project.id || !project.input || !project.name) {
          console.warn('Skipping invalid project:', project.id);
          continue;
        }

        // Check for duplicate IDs
        const newId = merge && this.projects.has(project.id) ? uuidv4() : project.id;

        this.projects.set(newId, {
          ...project,
          id: newId,
        });

        imported++;
      } catch (error) {
        console.error('Error importing project:', error);
      }
    }

    if (imported > 0) {
      this.saveToStorage();
    }

    return imported;
  }

  /**
   * Clear all projects
   */
  clearAllProjects(): void {
    this.projects.clear();
    this.saveToStorage();
  }

  /**
   * Get project count
   */
  getProjectCount(): number {
    return this.projects.size;
  }
}
