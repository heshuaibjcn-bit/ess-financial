/**
 * Data Integration Module - Real Data Sources
 *
 * Exports all data integration services and managers
 */

export {
  DataIntegration,
  DataIntegrationManager,
  getDataIntegrationManager,
  type DataSource,
  type IntegrationStatus,
  type UpdateResult,
  type DataIntegrationConfig
} from './DataIntegrationManager';

export {
  PolicyDataIntegration,
  setupPolicyDataIntegration
} from './PolicyDataIntegration';

export {
  TariffDataIntegration,
  setupTariffDataIntegration
} from './TariffDataIntegration';

export {
  CompanyDataIntegration,
  setupCompanyDataIntegration
} from './CompanyDataIntegration';

export {
  DataCache,
  CacheManager,
  getCacheManager,
  type CacheEntry,
  type CacheStats,
  type CacheOptions
} from './DataCache';

export {
  DataValidator,
  PolicyDataValidator,
  TariffDataValidator,
  CompanyDataValidator,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type QualityReport
} from './DataValidator';

// Re-export architecture document for reference
export { default as RealDataIntegrationArchitecture } from './RealDataIntegrationArchitecture';
