/**
 * Policy Schema - Energy Storage Policy Data Structure
 *
 * Defines the structure for energy storage policies including:
 * - Tariff policies (time-of-use pricing, basic fees)
 * - Subsidy policies (investment subsidies, feed-in tariffs)
 * - Technical standards (battery requirements, safety)
 * - Market policies (spot market, ancillary services)
 */

import { z } from 'zod';

/**
 * Policy category types
 */
export const PolicyCategoryEnum = z.enum([
  'tariff',           // 电价政策（峰谷电价、容量电价等）
  'subsidy',          // 补贴政策（投资补贴、度电补贴等）
  'technical',        // 技术标准（电池要求、安全规范等）
  'market',           // 市场政策（现货市场、辅助服务等）
  'grid',             // 并网政策（接入要求、流程等）
  'planning',         // 规划政策（发展规划、目标等）
  'tax',              // 税收政策（税收优惠、减免等）
]);

export type PolicyCategory = z.infer<typeof PolicyCategoryEnum>;

/**
 * Policy target audience
 */
export const PolicyTargetEnum = z.enum([
  'industrial',       // 工业用户
  'commercial',       // 商业用户
  'agricultural',     // 农业用户
  'residential',      // 居民用户
  'utility',          // 电网公司
  'operator',         // 储能运营商
  'all',             // 所有类型
]);

export type PolicyTarget = z.infer<typeof PolicyTargetEnum>;

/**
 * Policy level
 */
export const PolicyLevelEnum = z.enum([
  'national',         // 国家级
  'provincial',       // 省级
  'municipal',        // 市级
  'regional',        // 区域级
]);

export type PolicyLevel = z.infer<typeof PolicyLevelEnum>;

/**
 * Policy status
 */
export const PolicyStatusEnum = z.enum([
  'draft',           // 草案
  'public',          // 公开征求意见
  'effective',       // 有效
  'expired',         // 已失效
  'suspended',       // 暂停
]);

export type PolicyStatus = z.infer<typeof PolicyStatusEnum>;

/**
 * Geographic scope
 */
export const GeographicScopeSchema = z.object({
  provinces: z.array(z.string()).default([]),  // 适用的省份
  cities: z.array(z.string()).default([]),      // 适用的城市
  regions: z.array(z.string()).default([]),     // 适用的区域（如华东、华南）
});

/**
 * Policy timeline
 */
export const PolicyTimelineSchema = z.object({
  publishDate: z.string().datetime().optional(),     // 发布日期
  effectiveDate: z.string().datetime().optional(),   // 生效日期
  expiryDate: z.string().datetime().optional(),     // 失效日期
  commentDeadline: z.string().datetime().optional(), // 意见反馈截止日期
});

/**
 * Policy content summary (AI-generated)
 */
export const PolicySummarySchema = z.object({
  title: z.string().describe('政策标题'),
  summary: z.string().describe('AI生成的政策摘要，100-200字'),
  keyPoints: z.array(z.string()).describe('关键要点列表，3-5条'),
  impact: z.string().describe('对储能项目的影响分析'),
  recommendation: z.string().describe('给投资者的建议'),
  tags: z.array(z.string()).describe('自动生成的标签'),
  confidence: z.number().min(0).max(1).describe('AI分析置信度'),
});

/**
 * Full policy document
 */
export const PolicyDocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: PolicyCategoryEnum,
  level: PolicyLevelEnum,
  status: PolicyStatusEnum,
  target: PolicyTargetEnum,

  // Metadata
  source: z.string().describe('政策来源URL或机构'),
  sourceAgency: z.string().describe('发布机构'),
  documentNumber: z.string().optional().describe('文号'),
  geographicScope: GeographicScopeSchema,

  // Timeline
  timeline: PolicyTimelineSchema,

  // Content
  summary: PolicySummarySchema,
  fullText: z.string().optional().describe('政策全文'),
  relatedDocuments: z.array(z.string()).describe('相关文档链接'),

  // Crawl metadata
  crawledAt: z.string().datetime().describe('抓取时间'),
  updatedAt: z.string().datetime().describe('更新时间'),
  version: z.string().default('1.0').describe('版本号'),

  // Analytics
  viewCount: z.number().default(0),
  bookmarkCount: z.number().default(0),
  relevanceScore: z.number().min(0).max(1).optional().describe('相关性评分'),
});

export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;

/**
 * Policy filter criteria
 */
export const PolicyFilterSchema = z.object({
  category: PolicyCategoryEnum.optional(),
  level: PolicyLevelEnum.optional(),
  status: PolicyStatusEnum.optional(),
  target: PolicyTargetEnum.optional(),
  provinces: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  keyword: z.string().optional(),
});

export type PolicyFilter = z.infer<typeof PolicyFilterSchema>;

/**
 * Policy update notification
 */
export const PolicyNotificationSchema = z.object({
  id: z.string().uuid(),
  policyId: z.string(),
  type: z.enum(['new', 'updated', 'expired', 'expiring_soon']),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'urgent']),
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export type PolicyNotification = z.infer<typeof PolicyNotificationSchema>;

/**
 * Policy pool statistics
 */
export const PolicyPoolStatsSchema = z.object({
  totalPolicies: z.number(),
  newThisWeek: z.number(),
  newThisMonth: z.number(),
  byCategory: z.record(z.number()),
  byProvince: z.record(z.number()),
  lastUpdate: z.string().datetime(),
  nextUpdate: z.string().datetime(),
});

export type PolicyPoolStats = z.infer<typeof PolicyPoolStatsSchema>;

// Export schemas
export const PolicySchemas = {
  PolicyCategory: PolicyCategoryEnum,
  PolicyTarget: PolicyTargetEnum,
  PolicyLevel: PolicyLevelEnum,
  PolicyStatus: PolicyStatusEnum,
  GeographicScope: GeographicScopeSchema,
  PolicyTimeline: PolicyTimelineSchema,
  PolicySummary: PolicySummarySchema,
  PolicyDocument: PolicyDocumentSchema,
  PolicyFilter: PolicyFilterSchema,
  PolicyNotification: PolicyNotificationSchema,
  PolicyPoolStats: PolicyPoolStatsSchema,
};
