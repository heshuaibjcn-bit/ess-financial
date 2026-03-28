/**
 * PolicyPoolWidget - Reusable Policy Pool Component
 *
 * Displays energy storage policies in a compact widget:
 * - Latest policies ticker
 * - Category filtering
 * - Search functionality
 * - Notification badges
 * - Expandable details
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bookmark,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { getPolicyPool } from '../services/policy/PolicyPoolService';
import type {
  PolicyDocument,
  PolicyCategory,
  PolicyPoolStats,
} from '../domain/schemas/PolicySchema';

interface PolicyPoolWidgetProps {
  className?: string;
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  defaultCategory?: PolicyCategory;
  defaultProvince?: string;
  onPolicyClick?: (policy: PolicyDocument) => void;
}

export const PolicyPoolWidget: React.FC<PolicyPoolWidgetProps> = ({
  className = '',
  maxItems = 5,
  autoRefresh = true,
  refreshInterval = 60 * 60 * 1000, // 1 hour
  defaultCategory,
  defaultProvince,
  onPolicyClick,
}) => {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [stats, setStats] = useState<PolicyPoolStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | undefined>(defaultCategory);
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const policyPool = getPolicyPool();

  // Load policies
  useEffect(() => {
    loadPolicies();

    if (autoRefresh) {
      const interval = setInterval(loadPolicies, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedCategory, defaultProvince, autoRefresh, refreshInterval]);

  const loadPolicies = () => {
    let filteredPolicies: PolicyDocument[];

    if (selectedCategory) {
      filteredPolicies = policyPool.getPoliciesByCategory(selectedCategory);
    } else if (defaultProvince) {
      filteredPolicies = policyPool.getPoliciesByProvince(defaultProvince);
    } else {
      filteredPolicies = policyPool.getLatestPolicies(30);
    }

    // Apply search filter
    if (searchQuery) {
      filteredPolicies = filteredPolicies.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setPolicies(filteredPolicies.slice(0, maxItems));
    setStats(policyPool.getStatistics());

    // Calculate unread count
    const notifications = policyPool.getNotifications();
    setUnreadCount(notifications.filter((n: { read: boolean }) => !n.read).length);

    setLastUpdate(new Date());
  };

  const getCategoryColor = (category: PolicyCategory): string => {
    const colors: Record<PolicyCategory, string> = {
      tariff: 'bg-blue-100 text-blue-700',
      subsidy: 'bg-green-100 text-green-700',
      technical: 'bg-purple-100 text-purple-700',
      market: 'bg-orange-100 text-orange-700',
      grid: 'bg-pink-100 text-pink-700',
      planning: 'bg-indigo-100 text-indigo-700',
      tax: 'bg-yellow-100 text-yellow-700',
    };
    return colors[category];
  };

  const getCategoryName = (category: PolicyCategory): string => {
    const names: Record<PolicyCategory, string> = {
      tariff: '电价政策',
      subsidy: '补贴政策',
      technical: '技术标准',
      market: '市场政策',
      grid: '并网政策',
      planning: '规划政策',
      tax: '税收政策',
    };
    return names[category];
  };

  const getLevelName = (level: string): string => {
    const names: Record<string, string> = {
      national: '国家级',
      provincial: '省级',
      municipal: '市级',
      regional: '区域级',
    };
    return names[level] || level;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}周前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const handlePolicyClick = (policy: PolicyDocument) => {
    setExpandedPolicyId(expandedPolicyId === policy.id ? null : policy.id);
    if (onPolicyClick) {
      onPolicyClick(policy);
    }
  };

  return (
    <div className={`policy-pool-widget ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">储能政策池</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount} 新
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="筛选"
          >
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={loadPolicies}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="刷新"
          >
            <Clock className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索政策..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              全部
            </button>
            {(['tariff', 'subsidy', 'technical', 'market', 'grid', 'planning', 'tax'] as PolicyCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {getCategoryName(category)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">政策总数</span>
            <span className="font-semibold text-blue-600">{stats.totalPolicies} 条</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">本周新增</span>
            <span className="font-semibold text-green-600">{stats.newThisWeek} 条</span>
          </div>
          {lastUpdate && (
            <div className="text-xs text-gray-500 mt-2">
              更新于 {lastUpdate.toLocaleTimeString('zh-CN')}
            </div>
          )}
        </div>
      )}

      {/* Policy List */}
      <div className="space-y-3">
        {policies.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            暂无相关政策
          </div>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handlePolicyClick(policy)}
            >
              {/* Policy Header */}
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Category and Level Badges */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(policy.category)}`}>
                        {getCategoryName(policy.category)}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {getLevelName(policy.level)}
                      </span>
                      {policy.timeline.publishDate && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(policy.timeline.publishDate)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                      {policy.title}
                    </h4>

                    {/* Summary */}
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {policy.summary.summary}
                    </p>
                  </div>

                  {/* Expand/Collapse Icon */}
                  <button className="ml-2 p-1">
                    {expandedPolicyId === policy.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Tags */}
                {policy.summary.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {policy.summary.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {expandedPolicyId === policy.id && (
                <div className="px-3 pb-3 border-t border-gray-100 mt-2 pt-3">
                  {/* Key Points */}
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-gray-900 mb-2">关键要点</h5>
                    <ul className="space-y-1">
                      {policy.summary.keyPoints.slice(0, 3).map((point, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact */}
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-gray-900 mb-1">影响分析</h5>
                    <p className="text-xs text-gray-600">{policy.summary.impact}</p>
                  </div>

                  {/* Recommendation */}
                  {policy.summary.recommendation && (
                    <div className="p-2 bg-blue-50 rounded mb-3">
                      <h5 className="text-xs font-semibold text-blue-900 mb-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        投资建议
                      </h5>
                      <p className="text-xs text-blue-800">{policy.summary.recommendation}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {policy.sourceAgency}
                    </div>
                    <div className="flex items-center gap-2">
                      {policy.source && (
                        <a
                          href={policy.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          查看原文
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      <button
                        className="text-xs text-gray-600 hover:text-gray-900 flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Bookmark className="w-3 h-3 mr-1" />
                        收藏
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* View More Link */}
      {policies.length > 0 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700">
            查看全部政策 →
          </button>
        </div>
      )}
    </div>
  );
};

export default PolicyPoolWidget;
