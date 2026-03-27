/**
 * Project Repository Interface
 *
 * Defines the contract for project data persistence and retrieval.
 * Implementations can use localStorage, IndexedDB, or a backend API.
 */

import type { Project, UserProject } from '../../models';

export interface IProjectRepository {
  /**
   * Save a project (create or update)
   */
  save(project: Project): Promise<Project>;

  /**
   * Find a project by ID
   */
  findById(id: string): Promise<Project | null>;

  /**
   * Find all projects for a user
   */
  findByUserId(userId: string): Promise<Project[]>;

  /**
   * Delete a project
   */
  delete(id: string): Promise<boolean>;

  /**
   * List all projects (with pagination)
   */
  list(options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'projectName';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Project[]>;

  /**
   * Find a shared project by token
   */
  findByShareToken(token: string): Promise<UserProject | null>;

  /**
   * Generate a share token for a project
   */
  generateShareToken(
    projectId: string,
    expiresIn?: number // seconds
  ): Promise<string>;

  /**
   * Revoke a share token
   */
  revokeShareToken(projectId: string): Promise<boolean>;

  /**
   * Search projects by name
   */
  searchByName(
    userId: string,
    query: string
  ): Promise<Project[]>;
}
