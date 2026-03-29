/**
 * Policy Data Integration - Government Policy Sources
 *
 * Integrates with government policy sources:
 * - National Development and Reform Commission (NDRC)
 * - National Energy Administration (NEA)
 * - Provincial development and reform commissions
 * - RSS feeds and web scraping
 */

import { DataIntegration, UpdateResult } from './DataIntegrationManager';
import type { PolicyDocument } from '../../domain/schemas/PolicySchema';
import { getPolicyPool } from '../policy/PolicyPoolService';

/**
 * RSS Feed Parser
 */
class RSSFeedParser {
  async parseFeed(url: string): Promise<any[]> {
    try {
      const response = await fetch(url);
      const text = await response.text();

      // Simple XML parser (in production, use a proper XML library)
      const items = this.extractRSSItems(text);

      return items.map(item => ({
        title: this.extractText(item, 'title'),
        link: this.extractText(item, 'link'),
        description: this.extractText(item, 'description'),
        pubDate: this.extractText(item, 'pubDate'),
        source: url
      }));
    } catch (error) {
      throw new Error(`Failed to parse RSS feed ${url}: ${error}`);
    }
  }

  private extractRSSItems(xmlText: string): string[] {
    // Extract items between <item> tags
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items: string[] = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      items.push(match[1]);
    }

    return items;
  }

  private extractText(item: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
    const match = item.match(regex);
    return match ? match[1].trim() : '';
  }
}

/**
 * Government Policy Source
 */
class GovernmentPolicySource {
  constructor(
    public readonly name: string,
    public readonly url: string,
    public readonly type: 'rss' | 'html'
  ) {}

  async fetch(): Promise<any[]> {
    if (this.type === 'rss') {
      const parser = new RSSFeedParser();
      return await parser.parseFeed(this.url);
    } else {
      // HTML scraping would go here
      throw new Error('HTML scraping not implemented yet');
    }
  }
}

/**
 * Policy Data Integration
 */
export class PolicyDataIntegration extends DataIntegration {
  readonly name = 'policy-data';
  readonly type = 'policy' as const;

  private sources: GovernmentPolicySource[] = [];
  private policyPool = getPolicyPool();

  constructor() {
    super();

    // Initialize policy sources
    this.sources = [
      // National sources
      new GovernmentPolicySource(
        'NDRC',
        'https://www.ndrc.gov.cn/rss/zcfb.xml',
        'rss'
      ),
      new GovernmentPolicySource(
        'NEA',
        'https://www.nea.gov.cn/rss/news.xml',
        'rss'
      ),

      // Provincial sources (add RSS feeds when available)
      // new GovernmentPolicySource('Guangdong-DRC', '...', 'rss'),
      // new GovernmentPolicySource('Zhejiang-DRC', '...', 'rss'),
    ];

    // Filter out sources that don't have actual URLs (for demo purposes)
    this.sources = this.sources.filter(s => s.url && !s.url.includes('...'));
  }

  async fetch(): Promise<any[]> {
    const allPolicies: any[] = [];

    for (const source of this.sources) {
      try {
        console.log(`[PolicyDataIntegration] Fetching from ${source.name}`);

        const items = await source.fetch();

        // Transform RSS items to policy documents
        const policies = items.map(item => this.transformToPolicy(item, source.name));

        allPolicies.push(...policies);
      } catch (error) {
        console.error(`[PolicyDataIntegration] Failed to fetch from ${source.name}:`, error);
        // Continue with other sources
      }
    }

    return allPolicies;
  }

  validate(data: any): boolean {
    // Check required fields
    if (!data.title || typeof data.title !== 'string') {
      return false;
    }

    if (!data.publishDate) {
      return false;
    }

    // Validate date format
    const date = new Date(data.publishDate);
    if (isNaN(date.getTime())) {
      return false;
    }

    return true;
  }

  async save(data: any[]): Promise<void> {
    for (const policyData of data) {
      try {
        // Check if policy already exists
        const existing = this.findExistingPolicy(policyData);

        if (existing) {
          // Update existing policy
          await this.policyPool.updatePolicy(existing.id, policyData);
        } else {
          // Add new policy
          await this.policyPool.addPolicy(policyData);
        }
      } catch (error) {
        console.error(`[PolicyDataIntegration] Failed to save policy:`, error);
      }
    }
  }

  private transformToPolicy(rssItem: any, sourceName: string): Partial<PolicyDocument> {
    // Determine policy category from title
    const category = this.inferCategory(rssItem.title);

    // Determine policy level from source
    const level = this.inferLevel(sourceName);

    return {
      title: rssItem.title,
      category,
      level,
      status: 'effective' as const,
      target: 'all' as const,
      source: rssItem.link,
      sourceAgency: this.getAgencyName(sourceName),
      documentNumber: '',
      geographicScope: {
        provinces: level === 'national' ? [] : this.inferProvinces(sourceName),
        cities: [],
        regions: []
      },
      timeline: {
        publishDate: new Date(rssItem.pubDate).toISOString(),
        effectiveDate: new Date(rssItem.pubDate).toISOString()
      },
      summary: {
        title: rssItem.title,
        summary: rssItem.description || rssItem.title,
        keyPoints: [],
        impact: '',
        recommendation: '',
        tags: [],
        confidence: 0.5
      },
      relatedDocuments: [],
      version: '1.0',
      viewCount: 0,
      bookmarkCount: 0,
      relevanceScore: 0.5
    };
  }

  private inferCategory(title: string): PolicyDocument['category'] {
    const keywords: Record<string, PolicyDocument['category']> = {
      '电价': 'tariff',
      '补贴': 'subsidy',
      '技术': 'technical',
      '标准': 'technical',
      '市场': 'market',
      '电网': 'grid',
      '规划': 'planning',
      '发展': 'planning',
      '税收': 'tax',
      '财税': 'tax'
    };

    for (const [keyword, category] of Object.entries(keywords)) {
      if (title.includes(keyword)) {
        return category;
      }
    }

    return 'planning'; // Default category
  }

  private inferLevel(sourceName: string): PolicyDocument['level'] {
    if (sourceName === 'NDRC' || sourceName === 'NEA') {
      return 'national';
    }
    return 'provincial';
  }

  private inferProvinces(sourceName: string): string[] {
    const provinceMap: Record<string, string> = {
      'Guangdong-DRC': 'guangdong',
      'Zhejiang-DRC': 'zhejiang',
      'Jiangsu-DRC': 'jiangsu',
      'Shanghai-DRC': 'shanghai',
      'Beijing-DRC': 'beijing'
    };

    const province = provinceMap[sourceName];
    return province ? [province] : [];
  }

  private getAgencyName(sourceName: string): string {
    const agencyNames: Record<string, string> = {
      'NDRC': '国家发展和改革委员会',
      'NEA': '国家能源局',
      'Guangdong-DRC': '广东省发展和改革委员会',
      'Zhejiang-DRC': '浙江省发展和改革委员会',
      'Jiangsu-DRC': '江苏省发展和改革委员会',
      'Shanghai-DRC': '上海市发展和改革委员会',
      'Beijing-DRC': '北京市发展和改革委员会'
    };

    return agencyNames[sourceName] || sourceName;
  }

  private findExistingPolicy(policyData: any): PolicyDocument | undefined {
    const allPolicies = this.policyPool.getAllPolicies();

    return allPolicies.find(p =>
      p.title === policyData.title ||
      (p.source === policyData.source && p.sourceAgency === policyData.sourceAgency)
    );
  }

  /**
   * Get integration statistics
   */
  getStatistics(): {
    totalSources: number;
    activeSources: number;
    lastUpdate: Date | null;
  } {
    return {
      totalSources: this.sources.length,
      activeSources: this.sources.filter(s => s.url && !s.url.includes('...')).length,
      lastUpdate: this.lastUpdate
    };
  }
}

/**
 * Factory function to create and register policy data integration
 */
export function setupPolicyDataIntegration(): PolicyDataIntegration {
  const manager = getDataIntegrationManager();

  const integration = new PolicyDataIntegration();
  manager.register(integration);

  // Schedule hourly updates
  integration.scheduleUpdate(3600000); // 1 hour

  return integration;
}
