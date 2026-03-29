/**
 * Data Integration Manager - Real Data Integration Framework
 *
 * Manages integration with external data sources:
 * - Policy data from government sources
 * - Tariff data from energy providers
 * - Company information from business registries
 * - Automatic updates with error handling
 * - Data validation and quality monitoring
 */

export interface DataSource {
  name: string;
  type: 'policy' | 'tariff' | 'company' | 'financial';
  url?: string;
  enabled: boolean;
  lastUpdate?: Date;
  lastError?: string;
  updateCount: number;
  errorCount: number;
}

export interface IntegrationStatus {
  name: string;
  type: string;
  status: 'healthy' | 'error' | 'updating' | 'disabled';
  lastUpdate: string;
  updateCount: number;
  errorCount: number;
  successRate: number;
}

export interface UpdateResult {
  source: string;
  success: boolean;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  errors: string[];
  duration: number;
}

export interface DataIntegrationConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  enableCache?: boolean;
  cacheTTL?: number;
}

/**
 * Base Data Integration Interface
 */
export abstract class DataIntegration {
  abstract readonly name: string;
  abstract readonly type: 'policy' | 'tariff' | 'company' | 'financial';
  protected enabled: boolean = true;
  protected lastUpdate: Date | null = null;
  protected lastError: string | null = null;
  protected updateCount: number = 0;
  protected errorCount: number = 0;

  abstract fetch(): Promise<any[]>;
  abstract validate(data: any): boolean;
  abstract save(data: any[]): Promise<void>;

  async update(config: DataIntegrationConfig = {}): Promise<UpdateResult> {
    if (!this.enabled) {
      return {
        source: this.name,
        success: false,
        recordsProcessed: 0,
        recordsAdded: 0,
        recordsUpdated: 0,
        errors: ['Integration is disabled'],
        duration: 0
      };
    }

    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsAdded = 0;
    let recordsUpdated = 0;

    try {
      // Fetch data from source
      const rawData = await this.fetchWithRetry(config);
      recordsProcessed = rawData.length;

      // Validate data
      const validData = rawData.filter(item => {
        const isValid = this.validate(item);
        if (!isValid) {
          errors.push(`Invalid data: ${JSON.stringify(item).substring(0, 100)}`);
        }
        return isValid;
      });

      // Save valid data
      await this.save(validData);

      // Update metrics
      recordsAdded = validData.length;
      this.updateCount++;
      this.lastUpdate = new Date();
      this.lastError = null;

      return {
        source: this.name,
        success: true,
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        errors,
        duration: Date.now() - startTime
      };
    } catch (error) {
      this.errorCount++;
      this.lastError = error instanceof Error ? error.message : String(error);

      return {
        source: this.name,
        success: false,
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        errors: [this.lastError],
        duration: Date.now() - startTime
      };
    }
  }

  private async fetchWithRetry(config: DataIntegrationConfig): Promise<any[]> {
    const maxRetries = config.maxRetries || 3;
    const retryDelay = config.retryDelay || 1000;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetch();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          console.warn(
            `[${this.name}] Fetch attempt ${attempt + 1} failed, ` +
            `retrying in ${retryDelay * Math.pow(2, attempt)}ms`
          );
          await this.sleep(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus(): IntegrationStatus {
    const totalAttempts = this.updateCount + this.errorCount;
    const successRate = totalAttempts > 0 ? (this.updateCount / totalAttempts) * 100 : 100;

    return {
      name: this.name,
      type: this.type,
      status: this.enabled
        ? this.lastError
          ? 'error'
          : 'healthy'
        : 'disabled',
      lastUpdate: this.lastUpdate?.toISOString() || '',
      updateCount: this.updateCount,
      errorCount: this.errorCount,
      successRate
    };
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Data Integration Manager
 */
export class DataIntegrationManager {
  private integrations: Map<string, DataIntegration> = new Map();
  private updateSchedule: Map<string, number> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  register(integration: DataIntegration): void {
    this.integrations.set(integration.name, integration);
    console.log(`[DataIntegrationManager] Registered: ${integration.name}`);
  }

  unregister(name: string): void {
    const integration = this.integrations.get(name);
    if (integration) {
      this.stopScheduledUpdate(name);
      this.integrations.delete(name);
      console.log(`[DataIntegrationManager] Unregistered: ${name}`);
    }
  }

  async updateAll(config: DataIntegrationConfig = {}): Promise<UpdateResult[]> {
    console.log(`[DataIntegrationManager] Updating ${this.integrations.size} integrations`);

    const results = await Promise.all(
      Array.from(this.integrations.values()).map(integration =>
        integration.update(config)
      )
    );

    this.logResults(results);

    return results;
  }

  async updateByName(name: string, config: DataIntegrationConfig = {}): Promise<UpdateResult> {
    const integration = this.integrations.get(name);
    if (!integration) {
      throw new Error(`Integration not found: ${name}`);
    }

    return integration.update(config);
  }

  getStatus(): IntegrationStatus[] {
    return Array.from(this.integrations.values()).map(integration =>
      integration.getStatus()
    );
  }

  scheduleUpdate(name: string, intervalMs: number): void {
    const integration = this.integrations.get(name);
    if (!integration) {
      throw new Error(`Integration not found: ${name}`);
    }

    // Stop existing timer if any
    this.stopScheduledUpdate(name);

    // Schedule new updates
    const timer = setInterval(async () => {
      console.log(`[DataIntegrationManager] Scheduled update for ${name}`);
      await integration.update();
    }, intervalMs);

    this.timers.set(name, timer);
    this.updateSchedule.set(name, intervalMs);

    console.log(
      `[DataIntegrationManager] Scheduled ${name} to update every ${intervalMs}ms`
    );
  }

  stopScheduledUpdate(name: string): void {
    const timer = this.timers.get(name);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(name);
      this.updateSchedule.delete(name);
      console.log(`[DataIntegrationManager] Stopped scheduled updates for ${name}`);
    }
  }

  stopAllScheduledUpdates(): void {
    for (const name of this.timers.keys()) {
      this.stopScheduledUpdate(name);
    }
  }

  getSchedule(): Record<string, number> {
    return Object.fromEntries(this.updateSchedule);
  }

  enable(name: string): void {
    const integration = this.integrations.get(name);
    if (integration) {
      integration.enable();
    }
  }

  disable(name: string): void {
    const integration = this.integrations.get(name);
    if (integration) {
      integration.disable();
    }
  }

  private logResults(results: UpdateResult[]): void {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(
      `[DataIntegrationManager] Update complete: ` +
      `${successful.length} succeeded, ${failed.length} failed`
    );

    if (failed.length > 0) {
      console.warn('[DataIntegrationManager] Failed updates:', failed);
    }
  }

  getMetrics(): {
    totalIntegrations: number;
    enabledIntegrations: number;
    totalUpdates: number;
    totalErrors: number;
    averageSuccessRate: number;
  } {
    const statuses = this.getStatus();

    return {
      totalIntegrations: statuses.length,
      enabledIntegrations: statuses.filter(s => s.status !== 'disabled').length,
      totalUpdates: statuses.reduce((sum, s) => sum + s.updateCount, 0),
      totalErrors: statuses.reduce((sum, s) => sum + s.errorCount, 0),
      averageSuccessRate: statuses.length > 0
        ? statuses.reduce((sum, s) => sum + s.successRate, 0) / statuses.length
        : 0
    };
  }
}

// Singleton instance
let managerInstance: DataIntegrationManager | null = null;

export function getDataIntegrationManager(): DataIntegrationManager {
  if (!managerInstance) {
    managerInstance = new DataIntegrationManager();
  }
  return managerInstance;
}
