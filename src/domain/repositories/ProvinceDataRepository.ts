/**
 * ProvinceDataRepository - Repository for loading and managing province policy data
 *
 * This repository handles:
 * - Loading province data from JSON files
 * - Caching province data in memory
 * - Querying provinces by code
 * - Data validation using schemas
 */

import type { ProvinceData } from '../schemas/ProvinceSchema';
import { ProvinceDataSchema } from '../schemas/ProvinceSchema';

// Mapping of province slugs to file codes
const PROVINCE_CODE_MAP: Record<string, string> = {
  guangdong: 'GD',
  shandong: 'SD',
  zhejiang: 'ZJ',
  jiangsu: 'JS',
  shanghai: 'SH',
  anhui: 'AH',
  hunan: 'HN',
  hubei: 'HB',
  henan: 'HA',
  jiangxi: 'JX',
  beijing: 'BJ',
  tianjin: 'TJ',
  hebei: 'HE',
  shanxi: 'SX',
  neimenggu: 'NM',
  liaoning: 'LN',
  jilin: 'JL',
  heilongjiang: 'HL',
  shaanxi: 'SN',
  gansu: 'GS',
  qinghai: 'QH',
  ningxia: 'NX',
  xinjiang: 'XJ',
  sichuan: 'SC',
  chongqing: 'CQ',
  yunnan: 'YN',
  guizhou: 'GZ',
  xizang: 'XZ',
  guangxi: 'GX',
  hainan: 'HI',
  fujian: 'FJ',
};

/**
 * Repository class for managing province data
 */
export class ProvinceDataRepository {
  private cache: Map<string, ProvinceData> = new Map();
  private dataVersion: string | null = null;

  /**
   * Load province data from JSON file
   * @param provinceSlug - Province slug (e.g., 'guangdong', 'shandong')
   * @returns Promise<ProvinceData | null> - Province data or null if not found
   */
  async loadProvince(provinceSlug: string): Promise<ProvinceData | null> {
    // Check cache first
    if (this.cache.has(provinceSlug)) {
      return this.cache.get(provinceSlug)!;
    }

    // Get province code
    const code = PROVINCE_CODE_MAP[provinceSlug];
    if (!code) {
      console.warn(`Unknown province slug: ${provinceSlug}`);
      return null;
    }

    try {
      // Load JSON file from public directory
      const response = await fetch(`/data/provinces/${provinceSlug}.json`);
      if (!response.ok) {
        console.warn(`Failed to load province data: ${provinceSlug}`);
        return null;
      }

      const rawData = await response.json();

      // Validate data against schema
      const validatedData = ProvinceDataSchema.parse(rawData);

      // Cache the validated data
      this.cache.set(provinceSlug, validatedData);

      return validatedData;
    } catch (error) {
      console.error(`Error loading province data for ${provinceSlug}:`, error);
      return null;
    }
  }

  /**
   * Get province data by slug (with cache)
   * @param provinceSlug - Province slug
   * @returns Promise<ProvinceData | null> - Province data or null if not found
   */
  async getProvince(provinceSlug: string): Promise<ProvinceData | null> {
    return this.loadProvince(provinceSlug);
  }

  /**
   * Get multiple provinces at once
   * @param provinceSlugs - Array of province slugs
   * @returns Promise<Map<string, ProvinceData>> - Map of province slug to data
   */
  async getProvinces(provinceSlugs: string[]): Promise<Map<string, ProvinceData>> {
    const results = new Map<string, ProvinceData>();

    await Promise.all(
      provinceSlugs.map(async (slug) => {
        const data = await this.getProvince(slug);
        if (data) {
          results.set(slug, data);
        }
      })
    );

    return results;
  }

  /**
   * Get all cached provinces
   * @returns Map<string, ProvinceData> - All cached province data
   */
  getAllCached(): Map<string, ProvinceData> {
    return new Map(this.cache);
  }

  /**
   * Clear cache (useful for testing or data updates)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Preload provinces for better performance
   * @param provinceSlugs - Array of province slugs to preload
   */
  async preload(provinceSlugs: string[]): Promise<void> {
    await Promise.all(
      provinceSlugs.map((slug) => this.getProvince(slug))
    );
  }

  /**
   * Check if a province is supported
   * @param provinceSlug - Province slug to check
   * @returns boolean - True if province is supported
   */
  isSupported(provinceSlug: string): boolean {
    return provinceSlug in PROVINCE_CODE_MAP;
  }

  /**
   * Get list of all supported province slugs
   * @returns string[] - Array of province slugs
   */
  getSupportedProvinces(): string[] {
    return Object.keys(PROVINCE_CODE_MAP);
  }

  /**
   * Get province code from slug
   * @param provinceSlug - Province slug
   * @returns string | undefined - Province code or undefined
   */
  getCode(provinceSlug: string): string | undefined {
    return PROVINCE_CODE_MAP[provinceSlug];
  }
}

// Singleton instance
export const provinceDataRepository = new ProvinceDataRepository();

// Convenience functions
export const getProvince = (slug: string) => provinceDataRepository.getProvince(slug);
export const getProvinces = (slugs: string[]) => provinceDataRepository.getProvinces(slugs);
export const isProvinceSupported = (slug: string) => provinceDataRepository.isSupported(slug);
export const getSupportedProvinces = () => provinceDataRepository.getSupportedProvinces();
