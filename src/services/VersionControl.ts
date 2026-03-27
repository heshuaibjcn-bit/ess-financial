/**
 * VersionControl - Project version history
 *
 * Manages project versions:
 * - Auto-save versions on significant changes
 * - Manual version snapshots
 * - Version comparison (diff view)
 * - Version rollback
 * - Max 10 versions per project
 */

import { ProjectInput, ProjectResult } from '../schemas';

// Project version snapshot
export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  name: string;
  description?: string;
  createdAt: string;
  createdBy?: 'auto' | 'user';
  input: ProjectInput;
  result?: ProjectResult;
  tags?: string[];
}

// Version diff result
export interface VersionDiff {
  version1: ProjectVersion;
  version2: ProjectVersion;
  inputChanges: {
    parameter: string;
    oldValue: any;
    newValue: any;
    category: 'costs' | 'systemSize' | 'operatingParams' | 'financing';
  }[];
  resultChanges: {
    metric: string;
    oldValue: number;
    newValue: number;
    change: number;
    changePercent: number;
  }[];
}

const STORAGE_KEY = 'ess_financial_versions';
const STORAGE_VERSION = 1;
const MAX_VERSIONS = 10;

export class VersionControl {
  private versions: Map<string, ProjectVersion[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Create a new version snapshot
   */
  async createVersion(
    projectId: string,
    input: ProjectInput,
    result?: ProjectResult,
    name?: string,
    description?: string,
    createdBy: 'auto' | 'user' = 'user'
  ): Promise<ProjectVersion> {
    const projectVersions = this.versions.get(projectId) || [];

    // Generate version number
    const versionNumber = projectVersions.length + 1;

    const version: ProjectVersion = {
      id: `${projectId}-v${versionNumber}`,
      projectId,
      versionNumber,
      name: name || `Version ${versionNumber}`,
      description,
      createdAt: new Date().toISOString(),
      createdBy,
      input: JSON.parse(JSON.stringify(input)), // Deep clone
      result: result ? JSON.parse(JSON.stringify(result)) : undefined, // Deep clone
    };

    projectVersions.push(version);

    // Keep only MAX_VERSIONS
    if (projectVersions.length > MAX_VERSIONS) {
      projectVersions.shift(); // Remove oldest
    }

    this.versions.set(projectId, projectVersions);
    this.saveToStorage();

    return version;
  }

  /**
   * Get all versions for a project
   */
  getVersions(projectId: string): ProjectVersion[] {
    return this.versions.get(projectId) || [];
  }

  /**
   * Get a specific version
   */
  getVersion(projectId: string, versionId: string): ProjectVersion | undefined {
    const versions = this.versions.get(projectId);
    return versions?.find((v) => v.id === versionId);
  }

  /**
   * Get latest version
   */
  getLatestVersion(projectId: string): ProjectVersion | undefined {
    const versions = this.versions.get(projectId);
    return versions?.[versions.length - 1];
  }

  /**
   * Delete a version
   */
  deleteVersion(projectId: string, versionId: string): boolean {
    const versions = this.versions.get(projectId);
    if (!versions) return false;

    const index = versions.findIndex((v) => v.id === versionId);
    if (index === -1) return false;

    versions.splice(index, 1);
    this.versions.set(projectId, versions);
    this.saveToStorage();

    return true;
  }

  /**
   * Compare two versions
   */
  compareVersions(projectId: string, versionId1: string, versionId2: string): VersionDiff | null {
    const version1 = this.getVersion(projectId, versionId1);
    const version2 = this.getVersion(projectId, versionId2);

    if (!version1 || !version2) return null;

    const inputChanges = this.diffInput(version1.input, version2.input);
    const resultChanges = this.diffResult(version1.result, version2.result);

    return {
      version1,
      version2,
      inputChanges,
      resultChanges,
    };
  }

  /**
   * Diff project inputs
   */
  private diffInput(input1: ProjectInput, input2: ProjectInput): VersionDiff['inputChanges'] {
    const changes: VersionDiff['inputChanges'] = [];

    // Helper to compare nested objects
    const compareObjects = (
      obj1: any,
      obj2: any,
      category: VersionDiff['inputChanges'][0]['category'],
      prefix: string = ''
    ) => {
      const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

      allKeys.forEach((key) => {
        const value1 = obj1[key];
        const value2 = obj2[key];

        // Skip if values are equal
        if (JSON.stringify(value1) === JSON.stringify(value2)) return;

        // Handle nested objects
        if (typeof value1 === 'object' && typeof value2 === 'object' && value1 && value2) {
          compareObjects(value1, value2, category, `${prefix}${key}.`);
        } else {
          changes.push({
            parameter: `${prefix}${key}`,
            oldValue: value1,
            newValue: value2,
            category,
          });
        }
      });
    };

    // Compare each category
    compareObjects(input1.costs, input2.costs, 'costs');
    compareObjects(input1.systemSize, input2.systemSize, 'systemSize');
    compareObjects(input1.operatingParams, input2.operatingParams, 'operatingParams');

    if (input1.financing && input2.financing) {
      compareObjects(input1.financing, input2.financing, 'financing');
    }

    return changes;
  }

  /**
   * Diff project results
   */
  private diffResult(
    result1: ProjectResult | undefined,
    result2: ProjectResult | undefined
  ): VersionDiff['resultChanges'] {
    const changes: VersionDiff['resultChanges'] = [];

    if (!result1 || !result2) return changes;

    const metrics = [
      { key: 'irr', path: 'financials.irr' },
      { key: 'npv', path: 'financials.npv' },
      { key: 'paybackPeriod', path: 'financials.paybackPeriod' },
      { key: 'lcoe', path: 'financials.lcoe' },
      { key: 'totalRevenue', path: 'cashFlow.annualRevenue' },
    ];

    metrics.forEach(({ key, path }) => {
      const value1 = this.getNestedValue(result1, path);
      const value2 = this.getNestedValue(result2, path);

      if (value1 !== undefined && value2 !== undefined && value1 !== value2) {
        const change = value2 - value1;
        const changePercent = value1 !== 0 ? ((change / value1) * 100) : 0;

        changes.push({
          metric: key,
          oldValue: value1,
          newValue: value2,
          change,
          changePercent,
        });
      }
    });

    return changes;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    projectId: string,
    versionId: string,
    createBackup: boolean = true
  ): Promise<{ input: ProjectInput; backupVersion?: ProjectVersion } | null> {
    const version = this.getVersion(projectId, versionId);
    if (!version) return null;

    let backupVersion: ProjectVersion | undefined;

    // Create backup of current state if requested
    if (createBackup) {
      // Get current versions to find the latest
      const versions = this.versions.get(projectId);
      const latestVersion = versions?.[versions!.length - 1];

      if (latestVersion && latestVersion.id !== versionId) {
        backupVersion = await this.createVersion(
          projectId,
          latestVersion.input,
          latestVersion.result,
          `Pre-rollback backup`,
          `Auto-created before rollback to ${version.name}`,
          'auto'
        );
      }
    }

    return {
      input: JSON.parse(JSON.stringify(version.input)),
      backupVersion,
    };
  }

  /**
   * Auto-save version on significant change
   */
  async autoSaveVersion(
    projectId: string,
    input: ProjectInput,
    result?: ProjectResult
  ): Promise<ProjectVersion | null> {
    const versions = this.versions.get(projectId);
    const latestVersion = versions?.[versions!.length - 1];

    // Check if change is significant enough to warrant a new version
    if (latestVersion) {
      const changes = this.diffInput(latestVersion.input, input);
      const significantChanges = changes.filter((change) => {
        // Define what constitutes a significant change
        if (change.category === 'costs') {
          const percentChange =
            change.oldValue !== 0
              ? Math.abs((change.newValue - change.oldValue) / change.oldValue)
              : 0;
          return percentChange > 0.05; // 5% change in costs
        }
        if (change.category === 'systemSize') {
          return Math.abs(change.newValue - change.oldValue) > 0.1; // 0.1 MW change
        }
        if (change.category === 'operatingParams') {
          return Math.abs(change.newValue - change.oldValue) > 0.02; // 2% change
        }
        return false;
      });

      // Only auto-save if there are significant changes
      if (significantChanges.length === 0) {
        return null;
      }
    }

    return this.createVersion(
      projectId,
      input,
      result,
      `Auto-save ${new Date().toLocaleDateString()}`,
      undefined,
      'auto'
    );
  }

  /**
   * Get version history summary
   */
  getVersionSummary(projectId: string): {
    totalVersions: number;
    oldestVersion?: ProjectVersion;
    newestVersion?: ProjectVersion;
    autoSaveCount: number;
    userSaveCount: number;
  } {
    const versions = this.versions.get(projectId) || [];

    return {
      totalVersions: versions.length,
      oldestVersion: versions[0],
      newestVersion: versions[versions.length - 1],
      autoSaveCount: versions.filter((v) => v.createdBy === 'auto').length,
      userSaveCount: versions.filter((v) => v.createdBy === 'user').length,
    };
  }

  /**
   * Delete all versions for a project
   */
  deleteProjectVersions(projectId: string): number {
    const versions = this.versions.get(projectId);
    const count = versions?.length || 0;

    this.versions.delete(projectId);
    this.saveToStorage();

    return count;
  }

  /**
   * Get total storage size
   */
  getStorageSize(): number {
    const data = JSON.stringify(Array.from(this.versions.entries()));
    return new Blob([data]).size;
  }

  /**
   * Load versions from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);

      // Check version
      if (data.version !== STORAGE_VERSION) {
        console.warn('Version storage version mismatch, starting fresh');
        return;
      }

      // Restore versions
      if (data.versions && typeof data.versions === 'object') {
        this.versions = new Map(Object.entries(data.versions));
      }
    } catch (error) {
      console.error('Error loading versions from storage:', error);
      this.versions.clear();
    }
  }

  /**
   * Save versions to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        version: STORAGE_VERSION,
        versions: Object.fromEntries(this.versions),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving versions to storage:', error);

      // Check if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, old versions may be pruned');
      }
    }
  }

  /**
   * Clear all versions
   */
  clearAllVersions(): void {
    this.versions.clear();
    this.saveToStorage();
  }

  /**
   * Get total version count across all projects
   */
  getTotalVersionCount(): number {
    let total = 0;
    this.versions.forEach((versions) => {
      total += versions.length;
    });
    return total;
  }
}
