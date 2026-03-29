/**
 * Company Data Integration - Business Registry Sources
 *
 * Integrates with company information sources:
 * - Tianyancha API (天眼查)
 * - QCC API (企查查)
 * - National Enterprise Credit Information System
 * - Credit scoring and financial data
 */

import { DataIntegration, UpdateResult } from './DataIntegrationManager';
import { DataCache, getCacheManager } from './DataCache';
import { CompanyDataValidator } from './DataValidator';

/**
 * Company Information Interface
 */
export interface CompanyInfo {
  name: string;
  creditCode: string; // 统一社会信用代码
  registrationDate: string;
  registeredCapital: number;
  legalRepresentative: string;
  businessStatus: string;
  address: string;
 经营范围?: string;
  industry?: string;
  creditScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

/**
 * Tianyancha API Client (Mock)
 */
class TianyanchaAPIClient {
  readonly name = 'Tianyancha';
  private apiKey: string;
  private baseURL = 'https://api.tianyancha.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TIANYANCHA_API_KEY || '';
  }

  async getCompanyInfo(name: string): Promise<CompanyInfo | null> {
    // In production, call actual API
    // const response = await fetch(`${this.baseURL}/company/search`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ name })
    // });
    // const data = await response.json();
    // return data.company;

    // Mock implementation
    return this.getMockCompanyInfo(name);
  }

  async getCreditScore(creditCode: string): Promise<number> {
    // Mock credit score (70-95 range)
    return Math.floor(Math.random() * 25) + 70;
  }

  async getFinancialStatements(creditCode: string): Promise<any> {
    // Mock financial data
    return {
      revenue: Math.floor(Math.random() * 100000000) + 10000000,
      profit: Math.floor(Math.random() * 10000000) + 1000000,
      assets: Math.floor(Math.random() * 50000000) + 5000000,
      liabilities: Math.floor(Math.random() * 30000000) + 3000000
    };
  }

  private getMockCompanyInfo(name: string): CompanyInfo {
    return {
      name,
      creditCode: this.generateCreditCode(),
      registrationDate: '2010-05-15',
      registeredCapital: 50000000,
      legalRepresentative: '张三',
      businessStatus: '在业',
      address: '广东省深圳市南山区科技园',
      businessScope: '技术开发、咨询服务',
      industry: '软件和信息技术服务业',
      creditScore: 85,
      riskLevel: 'low'
    };
  }

  private generateCreditCode(): string {
    // Generate 18-digit credit code
    return Math.random().toString(36).substring(2, 20).toUpperCase();
  }
}

/**
 * Company Data Integration
 */
export class CompanyDataIntegration extends DataIntegration {
  readonly name = 'company-data';
  readonly type = 'company' as const;

  private apiClient: TianyanchaAPIClient;
  private cache: DataCache;
  private validator = new CompanyDataValidator();

  constructor() {
    super();

    // Initialize cache
    const cacheManager = getCacheManager();
    this.cache = cacheManager.getCache('company')!;

    // Initialize API client
    this.apiClient = new TianyanchaAPIClient();
  }

  async fetch(companyName?: string): Promise<CompanyInfo[]> {
    if (!companyName) {
      return [];
    }

    console.log(`[CompanyDataIntegration] Fetching company info for: ${companyName}`);

    try {
      const companyInfo = await this.apiClient.getCompanyInfo(companyName);

      if (!companyInfo) {
        return [];
      }

      // Get additional data
      const creditScore = await this.apiClient.getCreditScore(companyInfo.creditCode);
      companyInfo.creditScore = creditScore;

      // Determine risk level based on credit score
      companyInfo.riskLevel = this.calculateRiskLevel(creditScore);

      // Cache the result
      this.cache.set(`company:${companyName}`, companyInfo, {
        ttl: 7200000, // 2 hours
        metadata: { source: this.apiClient.name }
      });

      return [companyInfo];
    } catch (error) {
      console.error(`[CompanyDataIntegration] Failed to fetch company info:`, error);
      return [];
    }
  }

  validate(data: any): boolean {
    const result = this.validator.validate(data);
    return result.valid;
  }

  async save(data: CompanyInfo[]): Promise<void> {
    // In production, save to database
    console.log(`[CompanyDataIntegration] Saving ${data.length} company records`);

    for (const company of data) {
      try {
        // Save to local storage or database
        const key = `company:${company.creditCode}`;
        localStorage.setItem(key, JSON.stringify(company));
      } catch (error) {
        console.error(`[CompanyDataIntegration] Failed to save company:`, error);
      }
    }
  }

  /**
   * Get company information with cache fallback
   */
  async getCompanyInfo(companyName: string): Promise<CompanyInfo | null> {
    // Try cache first
    const cached = this.cache.get(`company:${companyName}`);
    if (cached) {
      console.log(`[CompanyDataIntegration] Cache hit for ${companyName}`);
      return cached;
    }

    // Fetch from API
    console.log(`[CompanyDataIntegration] Cache miss for ${companyName}, fetching...`);

    const companies = await this.fetch(companyName);

    if (companies.length > 0) {
      return companies[0];
    }

    return null;
  }

  /**
   * Get credit score for a company
   */
  async getCreditScore(companyName: string): Promise<number | null> {
    try {
      const companyInfo = await this.getCompanyInfo(companyName);

      if (!companyInfo) {
        return null;
      }

      return companyInfo.creditScore || null;
    } catch (error) {
      console.error(`[CompanyDataIntegration] Failed to get credit score:`, error);
      return null;
    }
  }

  /**
   * Batch search multiple companies
   */
  async batchSearch(companyNames: string[]): Promise<CompanyInfo[]> {
    console.log(`[CompanyDataIntegration] Batch searching ${companyNames.length} companies`);

    const results: CompanyInfo[] = [];

    // Search in parallel with concurrency limit
    const concurrency = 5;
    for (let i = 0; i < companyNames.length; i += concurrency) {
      const batch = companyNames.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map(async (name) => {
          try {
            const info = await this.getCompanyInfo(name);
            return info;
          } catch (error) {
            console.error(`[CompanyDataIntegration] Failed to search ${name}:`, error);
            return null;
          }
        })
      );

      for (const info of batchResults) {
        if (info) {
          results.push(info);
        }
      }
    }

    return results;
  }

  /**
   * Calculate risk level from credit score
   */
  private calculateRiskLevel(creditScore: number): 'low' | 'medium' | 'high' {
    if (creditScore >= 80) {
      return 'low';
    } else if (creditScore >= 60) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Get integration statistics
   */
  getStatistics(): {
    lastUpdate: Date | null;
    cacheStats: any;
  } {
    const cacheManager = getCacheManager();
    const cacheStats = cacheManager.getAllStats();

    return {
      lastUpdate: this.lastUpdate,
      cacheStats: cacheStats.company
    };
  }
}

/**
 * Factory function to create and register company data integration
 */
export function setupCompanyDataIntegration(): CompanyDataIntegration {
  const manager = getDataIntegrationManager();

  const integration = new CompanyDataIntegration();
  manager.register(integration);

  // Company data is updated on-demand, no scheduled updates

  return integration;
}
