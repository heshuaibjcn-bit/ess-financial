/**
 * Policy Pool Service - Energy Storage Policy Management
 *
 * Core service for managing energy storage policies:
 * - Policy database with CRUD operations
 * - Automatic hourly updates
 * - Policy filtering and search
 * - Notification system for new policies
 * - Statistics and analytics
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  PolicyDocument,
  PolicyFilter,
  PolicyNotification,
  PolicyPoolStats,
  PolicyCategory,
} from '../domain/schemas/PolicySchema';

export interface PolicySource {
  name: string;
  url: string;
  agency: string;
  updateFrequency: number; // in hours
  category: PolicyCategory[];
  level: ('national' | 'provincial' | 'municipal')[];
}

/**
 * Policy data sources (government websites)
 */
export const POLICY_SOURCES: PolicySource[] = [
  // National level
  {
    name: '国家发改委',
    url: 'https://www.ndrc.gov.cn/xxgk/zcfb/tz',
    agency: '国家发展和改革委员会',
    updateFrequency: 24,
    category: ['tariff', 'subsidy', 'planning', 'market'],
    level: ['national'],
  },
  {
    name: '国家能源局',
    url: 'https://www.nea.gov.cn/',
    agency: '国家能源局',
    updateFrequency: 24,
    category: ['technical', 'grid', 'market'],
    level: ['national'],
  },
  // Provincial sources (examples)
  {
    name: '广东省发改委',
    url: 'http://drc.gd.gov.cn/',
    agency: '广东省发展和改革委员会',
    updateFrequency: 12,
    category: ['tariff', 'subsidy'],
    level: ['provincial'],
  },
  {
    name: '浙江省发改委',
    url: 'http://fzggw.zj.gov.cn/',
    agency: '浙江省发展和改革委员会',
    updateFrequency: 12,
    category: ['tariff', 'subsidy'],
    level: ['provincial'],
  },
  {
    name: '江苏省发改委',
    url: 'http://fzggw.jiangsu.gov.cn/',
    agency: '江苏省发展和改革委员会',
    updateFrequency: 12,
    category: ['tariff', 'subsidy'],
    level: ['provincial'],
  },
];

/**
 * Policy Pool Service Class
 */
export class PolicyPoolService {
  private policies: Map<string, PolicyDocument> = new Map();
  private notifications: PolicyNotification[] = [];
  private lastUpdate: Date | null = null;
  private nextUpdate: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadPoliciesFromStorage();
    this.loadNotificationsFromStorage();
    this.setupAutoUpdate();
  }

  /**
   * Initialize policy pool with sample data
   */
  async initialize(): Promise<void> {
    // Load from localStorage or initialize with sample data
    if (this.policies.size === 0) {
      await this.loadSamplePolicies();
    }

    // Schedule hourly updates
    this.scheduleNextUpdate();
  }

  /**
   * Load sample policies for demonstration
   */
  private async loadSamplePolicies(): Promise<void> {
    const samplePolicies: Omit<PolicyDocument, 'id' | 'crawledAt' | 'updatedAt'>[] = [
      {
        title: '关于进一步完善分时电价机制的通知',
        category: 'tariff',
        level: 'national',
        status: 'effective',
        target: 'industrial',
        source: 'https://www.ndrc.gov.cn/xxgk/zcfb/tz/202112/t20211229_1307414.html',
        sourceAgency: '国家发展改革委',
        documentNumber: '发改价格〔2021〕1453号',
        geographicScope: {
          provinces: [], // National
          cities: [],
          regions: [],
        },
        timeline: {
          publishDate: '2021-12-29T00:00:00Z',
          effectiveDate: '2022-01-01T00:00:00Z',
        },
        summary: {
          title: '关于进一步完善分时电价机制的通知',
          summary: '进一步完善分时电价机制，优化峰谷时段划分，健全季节性电价机制，引导用户调整用电行为。要求各地合理确定峰谷电价价差，上年最大峰谷差超过40%的地区，峰谷电价价差原则上不低于4:1，其他地区原则上不低于3:1。',
          keyPoints: [
            '优化峰谷时段划分，将系统供需紧张或供需不平衡的时段明确为峰段',
            '健全季节性电价机制，合理设置季节性峰谷电价',
            '合理确定峰谷电价价差，原则上不低于3:1或4:1',
            '完善市场化电力用户执行方式，推动工商业用户进入市场',
            '鼓励工商业用户通过配置储能、开展综合能源服务等方式降低用电成本',
          ],
          impact: '有利于储能项目通过峰谷套利获得更高收益，4:1的峰谷价差为储能投资提供了良好回报基础。政策鼓励用户配置储能，将推动储能市场需求增长。',
          recommendation: '建议关注峰谷价差大的地区（如广东、浙江、江苏等）的储能投资机会。同时可探索"储能+综合能源服务"模式，提升项目收益。',
          tags: ['分时电价', '峰谷电价', '电价机制', '储能政策'],
          confidence: 0.95,
        },
        relatedDocuments: [],
        version: '1.0',
        viewCount: 0,
        bookmarkCount: 0,
        relevanceScore: 0.9,
      },
      {
        title: '广东省关于促进新型储能发展的若干措施',
        category: 'subsidy',
        level: 'provincial',
        status: 'effective',
        target: 'all',
        source: 'https://www.gd.gov.cn/zwgk/wjk/qbwj/yf/content/post_3985386.html',
        sourceAgency: '广东省人民政府',
        documentNumber: '粤府办〔2023〕15号',
        geographicScope: {
          provinces: ['guangdong'],
          cities: [],
          regions: [],
        },
        timeline: {
          publishDate: '2023-06-01T00:00:00Z',
          effectiveDate: '2023-06-01T00:00:00Z',
        },
        summary: {
          title: '广东省关于促进新型储能发展的若干措施',
          summary: '广东省出台15项措施促进新型储能发展，包括支持电源侧、电网侧、用户侧储能项目建设，完善市场价格机制，加大财政支持力度等。提出到2025年，全省新型储能装机规模达到300万千瓦以上。',
          keyPoints: [
            '到2025年，全省新型储能装机规模达到300万千瓦以上',
            '支持工商业用户、产业园区等配建新型储能电站',
            '完善储能参与电力市场的价格机制',
            '对新型储能项目给予财政补贴，具体标准由各地市制定',
            '支持储能项目参与辅助服务市场，获得辅助服务收益',
          ],
          impact: '明确装机目标和财政支持，将显著推动广东省储能市场发展。用户侧储能可直接获得补贴，项目经济性将大幅提升。',
          recommendation: '广东省储能项目前景良好，建议重点关注工业园区、大型商业综合体等用户侧储能机会。可结合当地补贴政策进行项目测算。',
          tags: ['储能补贴', '装机目标', '广东', '用户侧储能'],
          confidence: 0.92,
        },
        relatedDocuments: [],
        version: '1.0',
        viewCount: 0,
        bookmarkCount: 0,
        relevanceScore: 0.95,
      },
      {
        title: '北京市新型储能电站建设管理办法（试行）',
        category: 'technical',
        level: 'municipal',
        status: 'effective',
        target: 'operator',
        source: 'https://fgw.beijing.gov.cn/',
        sourceAgency: '北京市发展和改革委员会',
        documentNumber: '京发改规〔2023〕7号',
        geographicScope: {
          provinces: [],
          cities: ['beijing'],
          regions: [],
        },
        timeline: {
          publishDate: '2023-06-15T00:00:00Z',
          effectiveDate: '2023-07-01T00:00:00Z',
        },
        summary: {
          title: '北京市新型储能电站建设管理办法（试行）',
          summary: '规范北京市新型储能电站建设管理，明确储能电站的规划、建设、验收、运行等环节要求。规定储能电站应具备完善的安全设施，符合国家和行业相关技术标准。',
          keyPoints: [
            '新建储能电站应进行项目备案，取得相关审批手续',
            '储能电站应配置完善的安全监测系统',
            '电池系统应符合国家和行业安全技术标准',
            '储能电站应建立应急预案，定期开展安全演练',
            '储能电站应与电网企业签订并网调度协议',
          ],
          impact: '提高储能电站建设标准，增加了前期投入成本，但有助于提升项目安全性和运营稳定性。运营商需要加强安全管理，确保合规运营。',
          recommendation: '在北京投资储能项目时，应严格按照管理办法进行规划和建设，预留足够的安全设施投入。建议选择有经验的设备供应商和施工方。',
          tags: ['技术标准', '安全管理', '北京', '建设规范'],
          confidence: 0.88,
        },
        relatedDocuments: [],
        version: '1.0',
        viewCount: 0,
        bookmarkCount: 0,
        relevanceScore: 0.8,
      },
    ];

    // Add policies with generated IDs
    const now = new Date().toISOString();
    for (const policy of samplePolicies) {
      const fullPolicy: PolicyDocument = {
        ...policy,
        id: uuidv4(),
        crawledAt: now,
        updatedAt: now,
      };
      this.policies.set(fullPolicy.id, fullPolicy);
    }

    this.savePoliciesToStorage();
  }

  /**
   * Get all policies
   */
  getAllPolicies(): PolicyDocument[] {
    return Array.from(this.policies.values()).sort(
      (a, b) => new Date(b.timeline.publishDate || 0).getTime() - new Date(a.timeline.publishDate || 0).getTime()
    );
  }

  /**
   * Get policy by ID
   */
  getPolicyById(id: string): PolicyDocument | undefined {
    return this.policies.get(id);
  }

  /**
   * Filter policies
   */
  filterPolicies(filter: PolicyFilter): PolicyDocument[] {
    let policies = this.getAllPolicies();

    if (filter.category) {
      policies = policies.filter(p => p.category === filter.category);
    }

    if (filter.level) {
      policies = policies.filter(p => p.level === filter.level);
    }

    if (filter.status) {
      policies = policies.filter(p => p.status === filter.status);
    }

    if (filter.target) {
      policies = policies.filter(p => p.target === filter.target || p.target === 'all');
    }

    if (filter.provinces && filter.provinces.length > 0) {
      policies = policies.filter(p =>
        p.geographicScope.provinces.some(province => filter.provinces!.includes(province)) ||
        p.geographicScope.provinces.length === 0 // National policies
      );
    }

    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      policies = policies.filter(p =>
        p.title.toLowerCase().includes(keyword) ||
        p.summary.summary.toLowerCase().includes(keyword) ||
        p.summary.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
    }

    if (filter.dateFrom) {
      const fromDate = new Date(filter.dateFrom);
      policies = policies.filter(p => {
        const publishDate = new Date(p.timeline.publishDate || 0);
        return publishDate >= fromDate;
      });
    }

    if (filter.dateTo) {
      const toDate = new Date(filter.dateTo);
      policies = policies.filter(p => {
        const publishDate = new Date(p.timeline.publishDate || 0);
        return publishDate <= toDate;
      });
    }

    return policies;
  }

  /**
   * Get policies by category
   */
  getPoliciesByCategory(category: PolicyCategory): PolicyDocument[] {
    return this.filterPolicies({ category });
  }

  /**
   * Get latest policies (within last N days)
   */
  getLatestPolicies(days: number = 7): PolicyDocument[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.getAllPolicies().filter(p => {
      const publishDate = new Date(p.timeline.publishDate || 0);
      return publishDate >= cutoffDate;
    });
  }

  /**
   * Get policies by province
   */
  getPoliciesByProvince(province: string): PolicyDocument[] {
    return this.filterPolicies({ provinces: [province] });
  }

  /**
   * Search policies
   */
  searchPolicies(query: string): PolicyDocument[] {
    return this.filterPolicies({ keyword: query });
  }

  /**
   * Add or update a policy
   */
  async addPolicy(policy: Omit<PolicyDocument, 'id' | 'crawledAt' | 'updatedAt'>): Promise<PolicyDocument> {
    const now = new Date().toISOString();
    const newPolicy: PolicyDocument = {
      ...policy,
      id: uuidv4(),
      crawledAt: now,
      updatedAt: now,
    };

    this.policies.set(newPolicy.id, newPolicy);
    this.savePoliciesToStorage();

    // Create notification for new policy
    if (policy.status === 'effective') {
      this.createNotification({
        policyId: newPolicy.id,
        type: 'new',
        message: `新政策：${policy.title}`,
        severity: 'info',
      });
    }

    return newPolicy;
  }

  /**
   * Update a policy
   */
  async updatePolicy(id: string, updates: Partial<Omit<PolicyDocument, 'id' | 'crawledAt'>>): Promise<PolicyDocument | undefined> {
    const existing = this.policies.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: PolicyDocument = {
      ...existing,
      ...updates,
      id,
      crawledAt: existing.crawledAt,
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(id, updated);
    this.savePoliciesToStorage();

    // Create notification for updated policy
    this.createNotification({
      policyId: id,
      type: 'updated',
      message: `政策更新：${updates.title || existing.title}`,
      severity: 'warning',
    });

    return updated;
  }

  /**
   * Delete a policy
   */
  deletePolicy(id: string): boolean {
    const deleted = this.policies.delete(id);
    if (deleted) {
      this.savePoliciesToStorage();
    }
    return deleted;
  }

  /**
   * Get statistics
   */
  getStatistics(): PolicyPoolStats {
    const allPolicies = this.getAllPolicies();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const byCategory: Record<string, number> = {};
    const byProvince: Record<string, number> = {};

    allPolicies.forEach(policy => {
      // Count by category
      byCategory[policy.category] = (byCategory[policy.category] || 0) + 1;

      // Count by province
      policy.geographicScope.provinces.forEach(province => {
        byProvince[province] = (byProvince[province] || 0) + 1;
      });
    });

    return {
      totalPolicies: allPolicies.length,
      newThisWeek: allPolicies.filter(p => new Date(p.timeline.publishDate || 0) >= weekAgo).length,
      newThisMonth: allPolicies.filter(p => new Date(p.timeline.publishDate || 0) >= monthAgo).length,
      byCategory,
      byProvince,
      lastUpdate: this.lastUpdate?.toISOString() || '',
      nextUpdate: this.nextUpdate?.toISOString() || '',
    };
  }

  /**
   * Get notifications
   */
  getNotifications(): PolicyNotification[] {
    return [...this.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotificationsToStorage();
    }
  }

  /**
   * Create a notification
   */
  private createNotification(input: Omit<PolicyNotification, 'id' | 'createdAt' | 'read'>): void {
    const notification: PolicyNotification = {
      ...input,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    this.notifications.push(notification);
    this.saveNotificationsToStorage();
  }

  /**
   * Setup automatic hourly updates
   */
  private setupAutoUpdate(): void {
    // Update every hour
    this.updateInterval = setInterval(() => {
      this.updatePolicies();
    }, 60 * 60 * 1000); // 1 hour

    // Schedule next update
    this.scheduleNextUpdate();
  }

  /**
   * Schedule next update
   */
  private scheduleNextUpdate(): void {
    const nextUpdate = new Date();
    nextUpdate.setHours(nextUpdate.getHours() + 1, 0, 0, 0);
    this.nextUpdate = nextUpdate;
  }

  /**
   * Update policies from sources
   */
  private async updatePolicies(): Promise<void> {
    console.log('Starting policy update...');
    this.lastUpdate = new Date();

    // In a real implementation, this would:
    // 1. Crawl policy sources
    // 2. Extract policy data
    // 3. Use AI to analyze and summarize
    // 4. Update database

    // For now, just log
    console.log('Policy update completed');
    this.scheduleNextUpdate();
  }

  /**
   * Stop auto-update
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Save policies to localStorage
   */
  private savePoliciesToStorage(): void {
    try {
      const policiesArray = Array.from(this.policies.values());
      localStorage.setItem('policy_pool_policies', JSON.stringify(policiesArray));
    } catch (error) {
      console.error('Failed to save policies to localStorage:', error);
    }
  }

  /**
   * Load policies from localStorage
   */
  private loadPoliciesFromStorage(): void {
    try {
      const stored = localStorage.getItem('policy_pool_policies');
      if (stored) {
        const policiesArray = JSON.parse(stored) as PolicyDocument[];
        policiesArray.forEach(policy => {
          this.policies.set(policy.id, policy);
        });
      }
    } catch (error) {
      console.error('Failed to load policies from localStorage:', error);
    }
  }

  /**
   * Save notifications to localStorage
   */
  private saveNotificationsToStorage(): void {
    try {
      localStorage.setItem('policy_pool_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  }

  /**
   * Load notifications from localStorage
   */
  private loadNotificationsFromStorage(): void {
    try {
      const stored = localStorage.getItem('policy_pool_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored) as PolicyNotification[];
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
    }
  }
}

// Singleton instance
let policyPoolInstance: PolicyPoolService | null = null;

export function getPolicyPool(): PolicyPoolService {
  if (!policyPoolInstance) {
    policyPoolService = new PolicyPoolService();
  }
  return policyPoolService;
}
