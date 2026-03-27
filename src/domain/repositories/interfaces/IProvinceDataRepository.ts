/**
 * Province Data Repository Interface
 *
 * Defines the contract for province policy and pricing data access.
 */

import type { ProvinceData } from '../../schemas/ProvinceSchema';

export interface IProvinceDataRepository {
  /**
   * Get data for a specific province
   */
  findByProvince(province: string): Promise<ProvinceData | null>;

  /**
   * Get all provinces data
   */
  findAll(): Promise<ProvinceData[]>;

  /**
   * Get list of all province codes
   */
  getProvinceCodes(): Promise<string[]>;

  /**
   * Find provinces by criteria
   */
  findByCriteria(criteria: {
    hasCapacityCompensation?: boolean;
    hasDemandResponse?: boolean;
    minPeakValleySpread?: number; // ¥/kWh
  }): Promise<ProvinceData[]>;

  /**
   * Get province statistics
   */
  getStatistics(): Promise<{
    totalProvinces: number;
    provincesWithCapacityCompensation: number;
    provincesWithDemandResponse: number;
    averagePeakValleySpread: number;
  }>;

  /**
   * Validate province data completeness
   */
  validateData(): Promise<{
    isValid: boolean;
    missingFields: Array<{
      province: string;
      field: string;
    }>;
  }>;

  /**
   * Get data version (for cache invalidation)
   */
  getDataVersion(): Promise<string>;

  /**
   * Refresh data from source
   */
  refresh(): Promise<void>;
}
