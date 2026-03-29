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

// Re-export architecture document for reference
export { default as RealDataIntegrationArchitecture } from './RealDataIntegrationArchitecture';
