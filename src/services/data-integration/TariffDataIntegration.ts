/**
 * Tariff Data Integration - Electricity Tariff Data Sources
 *
 * Integrates with tariff data sources:
 * - Third-party APIs (EnergyData, ChinaPower)
 * - Utility company data
 * - Government published tariffs
 * - Automatic rate detection
 */

import { DataIntegration, UpdateResult } from './DataIntegrationManager';
import { DataCache, getCacheManager } from './DataCache';
import { TariffDataValidator } from './DataValidator';
import { getTariffService } from '../tariffDataService';

/**
 * Third-party API Client Interface
 */
interface TariffAPIClient {
  name: string;
  getProvincialTariff(province: string): Promise<any>;
  getHourlyPrices(province: string, date: Date): Promise<number[]>;
  subscribeToUpdates(callback: (data: any) => void): void;
}

/**
 * EnergyData API Client (Mock)
 */
class EnergyDataAPIClient implements TariffAPIClient {
  readonly name = 'EnergyData';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ENERGY_DATA_API_KEY || '';
  }

  async getProvincialTariff(province: string): Promise<any> {
    // In production, call actual API
    // const response = await fetch(`https://api.energydata.com/tariff/${province}`, {
    //   headers: { 'Authorization': `Bearer ${this.apiKey}` }
    // });
    // return response.json();

    // Mock implementation
    return this.getMockTariff(province);
  }

  async getHourlyPrices(province: string, date: Date): Promise<number[]> {
    // Mock 24-hour prices
    const basePrice = this.getBasePrice(province);
    const prices: number[] = [];

    for (let hour = 0; hour < 24; hour++) {
      let multiplier = 1;

      // Peak hours (8-12, 14-18, 19-21)
      if ((hour >= 8 && hour < 12) || (hour >= 14 && hour < 18) || (hour >= 19 && hour < 21)) {
        multiplier = 1.5;
      }
      // Valley hours (23-7)
      else if (hour >= 23 || hour < 7) {
        multiplier = 0.5;
      }

      prices.push(basePrice * multiplier);
    }

    return prices;
  }

  subscribeToUpdates(callback: (data: any) => void): void {
    // In production, set up WebSocket or webhook
    console.log('[EnergyData] Subscribing to updates');
  }

  private getBasePrice(province: string): number {
    const basePrices: Record<string, number> = {
      '广东': 0.68,
      '浙江': 0.65,
      '江苏': 0.64,
      '上海': 0.67,
      '北京': 0.70,
      'guangdong': 0.68,
      'zhejiang': 0.65,
      'jiangsu': 0.64,
      'shanghai': 0.67,
      'beijing': 0.70
    };

    return basePrices[province] || 0.60;
  }

  private getMockTariff(province: string): any {
    const basePrice = this.getBasePrice(province);

    return {
      province,
      effectiveDate: new Date().toISOString().split('T')[0],
      prices: {
        peak: basePrice * 1.5,
        flat: basePrice,
        valley: basePrice * 0.5
      },
      hourlyPrices: Array.from({ length: 24 }, (_, i) => {
        let multiplier = 1;
        if ((i >= 8 && i < 12) || (i >= 14 && i < 18) || (i >= 19 && i < 21)) {
          multiplier = 1.5;
        } else if (i >= 23 || i < 7) {
          multiplier = 0.5;
        }
        return {
          hour: i,
          price: basePrice * multiplier,
          type: multiplier > 1 ? 'peak' : multiplier < 1 ? 'valley' : 'flat'
        };
      })
    };
  }
}

/**
 * Tariff Data Integration
 */
export class TariffDataIntegration extends DataIntegration {
  readonly name = 'tariff-data';
  readonly type = 'tariff' as const;

  private apiClients: TariffAPIClient[] = [];
  private cache: DataCache;
  private validator = new TariffDataValidator();
  private tariffService = getTariffService();

  constructor() {
    super();

    // Initialize cache
    const cacheManager = getCacheManager();
    this.cache = cacheManager.getCache('tariff')!;

    // Initialize API clients
    this.apiClients = [
      new EnergyDataAPIClient()
      // Add more API clients as needed
    ];
  }

  async fetch(): Promise<any[]> {
    const allTariffs: any[] = [];
    const provinces = ['广东', '浙江', '江苏', '上海', '北京'];

    for (const province of provinces) {
      for (const client of this.apiClients) {
        try {
          console.log(`[TariffDataIntegration] Fetching ${province} tariff from ${client.name}`);

          const tariff = await client.getProvincialTariff(province);

          // Transform to standard format
          const standardized = this.standardizeTariff(tariff, province);
          allTariffs.push(standardized);

          // Cache the result
          this.cache.set(`tariff:${province}`, standardized, {
            ttl: 86400000, // 24 hours
            metadata: { source: client.name }
          });

          break; // Use first successful source
        } catch (error) {
          console.error(`[TariffDataIntegration] Failed to fetch from ${client.name}:`, error);
        }
      }
    }

    return allTariffs;
  }

  validate(data: any): boolean {
    const result = this.validator.validate(data);
    return result.valid;
  }

  async save(data: any[]): Promise<void> {
    for (const tariffData of data) {
      try {
        // Update tariff service
        await this.tariffService.updateTariff(
          tariffData.province,
          tariffData.priceType,
          {
            price: tariffData.price,
            effectiveDate: tariffData.effectiveDate,
            hourlyPrices: tariffData.hourlyPrices
          }
        );
      } catch (error) {
        console.error(`[TariffDataIntegration] Failed to save tariff:`, error);
      }
    }
  }

  /**
   * Get tariff data with cache fallback
   */
  async getTariff(province: string): Promise<any> {
    // Try cache first
    const cached = this.cache.get(`tariff:${province}`);
    if (cached) {
      console.log(`[TariffDataIntegration] Cache hit for ${province}`);
      return cached;
    }

    // Fetch from API
    console.log(`[TariffDataIntegration] Cache miss for ${province}, fetching...`);

    for (const client of this.apiClients) {
      try {
        const tariff = await client.getProvincialTariff(province);
        const standardized = this.standardizeTariff(tariff, province);

        // Cache the result
        this.cache.set(`tariff:${province}`, standardized, {
          ttl: 86400000,
          metadata: { source: client.name }
        });

        return standardized;
      } catch (error) {
        console.error(`[TariffDataIntegration] Failed to fetch ${province}:`, error);
      }
    }

    throw new Error(`Failed to fetch tariff data for ${province}`);
  }

  /**
   * Get hourly prices for a province
   */
  async getHourlyPrices(province: string, date: Date = new Date()): Promise<number[]> {
    const cacheKey = `hourly:${province}:${date.toISOString().split('T')[0]}`;

    // Try cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    for (const client of this.apiClients) {
      try {
        const prices = await client.getHourlyPrices(province, date);

        // Cache for shorter duration
        this.cache.set(cacheKey, prices, {
          ttl: 3600000, // 1 hour
          metadata: { source: client.name }
        });

        return prices;
      } catch (error) {
        console.error(`[TariffDataIntegration] Failed to fetch hourly prices:`, error);
      }
    }

    throw new Error(`Failed to fetch hourly prices for ${province}`);
  }

  /**
   * Standardize tariff data format
   */
  private standardizeTariff(rawTariff: any, province: string): any {
    return {
      province,
      priceType: 'all',
      voltageLevel: '1-10kV',
      peakPrice: rawTariff.prices?.peak || rawTariff.peak,
      flatPrice: rawTariff.prices?.flat || rawTariff.flat,
      valleyPrice: rawTariff.prices?.valley || rawTariff.valley,
      effectiveDate: rawTariff.effectiveDate,
      hourlyPrices: rawTariff.hourlyPrices || rawTariff.prices?.hourly,
      source: rawTariff.source || 'API'
    };
  }

  /**
   * Get integration statistics
   */
  getStatistics(): {
    totalClients: number;
    activeClients: number;
    lastUpdate: Date | null;
    cacheStats: any;
  } {
    const cacheManager = getCacheManager();
    const cacheStats = cacheManager.getAllStats();

    return {
      totalClients: this.apiClients.length,
      activeClients: this.apiClients.length,
      lastUpdate: this.lastUpdate,
      cacheStats: cacheStats.tariff
    };
  }
}

/**
 * Factory function to create and register tariff data integration
 */
export function setupTariffDataIntegration(): TariffDataIntegration {
  const manager = getDataIntegrationManager();

  const integration = new TariffDataIntegration();
  manager.register(integration);

  // Schedule daily updates
  manager.scheduleUpdate('tariff-data', 86400000); // 24 hours

  return integration;
}
