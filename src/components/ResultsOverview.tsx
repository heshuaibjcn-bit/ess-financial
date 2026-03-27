/**
 * ResultsOverview - Display calculation results
 *
 * Shows:
 * - Key metrics (IRR, NPV, Payback Period, LCOE)
 * - Revenue breakdown
 * - Comparison with benchmark
 * - Investment rating
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { EngineResult } from '../domain/services/CalculationEngine';
import { BenchmarkComparison } from '../domain/services/BenchmarkEngine';

interface ResultsOverviewProps {
  result: EngineResult;
  benchmarkComparison?: BenchmarkComparison;
  loading?: boolean;
  className?: string;
}

export const ResultsOverview: React.FC<ResultsOverviewProps> = ({
  result,
  benchmarkComparison,
  loading = false,
  className = '',
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={`results-overview ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // Calculate rating
  const getRating = (irr: number) => {
    if (irr >= 12) return { label: t('results.rating.excellent'), color: 'text-green-600', bg: 'bg-green-50' };
    if (irr >= 10) return { label: t('results.rating.good'), color: 'text-blue-600', bg: 'bg-blue-50' };
    if (irr >= 8) return { label: t('results.rating.average'), color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (irr >= 6) return { label: t('results.rating.belowAverage'), color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: t('results.rating.poor'), color: 'text-red-600', bg: 'bg-red-50' };
  };

  const rating = getRating((result.metrics?.irr ?? result.irr) || 0);

  // Get percentile ranking for display
  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 90) return t('benchmark.percentiles.top10');
    if (percentile >= 75) return t('benchmark.percentiles.top25');
    if (percentile >= 50) return t('benchmark.percentiles.aboveAverage');
    return t('benchmark.percentiles.belowAverage');
  };

  return (
    <div className={`results-overview ${className}`}>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* IRR Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('results.financials.irr')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {((result.metrics?.irr ?? result.irr) || 0).toFixed(2)}%
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full ${rating.bg} flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${rating.color}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          {benchmarkComparison && (
            <p className="mt-2 text-xs text-gray-500">
              {t('benchmark.comparison.comparable')}: {getPercentileLabel(benchmarkComparison.percentiles.irr)}
            </p>
          )}
        </div>

        {/* NPV Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('results.financials.npv')}</p>
              <p className={`mt-2 text-3xl font-bold ${(result.npv || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ¥{((result.npv || 0) / 10000).toFixed(1)}万
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 002-2h-4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {benchmarkComparison && (
            <p className="mt-2 text-xs text-gray-500">
              {t('benchmark.comparison.comparable')}: {getPercentileLabel(benchmarkComparison.percentiles.npv)}
            </p>
          )}
        </div>

        {/* Payback Period Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('results.financials.paybackPeriod')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {result.paybackPeriod.toFixed(1)} {t('common.year')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {benchmarkComparison && (
            <p className="mt-2 text-xs text-gray-500">
              {t('benchmark.comparison.comparable')}: {getPercentileLabel(benchmarkComparison.percentiles.paybackPeriod)}
            </p>
          )}
        </div>

        {/* LCOE Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('results.financials.lcoe')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                ¥{result.levelizedCost.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 1.682-.948 2.286 1.56.38 1.56 2.6 0 2.98-.836A1.532 1.532 0 0115 5.627c1.372.836 2.942-.734 2.106-2.106-.54-.886.061-1.682.948-2.286zm-.672 4.672a3.001 3.001 0 00-2.636 0 3.001 3.001 0 000 5.292 3.001 3.001 0 002.636 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            / {t('common.kwh')}
          </p>
        </div>
      </div>

      {/* Investment Rating */}
      <div className={`${rating.bg} border border-gray-200 rounded-lg p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {t('results.rating.title')}
            </h3>
            <p className={`text-2xl font-bold ${rating.color}`}>
              {rating.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{t('benchmark.rating.title')}</p>
            {benchmarkComparison && (
              <p className={`text-lg font-bold ${rating.color}`}>
                {benchmarkComparison.rating.overall}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('results.revenue.title')}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
              <span className="text-sm text-gray-700">{t('results.revenue.arbitrage')}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              ¥{(result.revenueBreakdown?.peakValleyArbitrage || 0 / 10000).toFixed(1)}万
            </span>
          </div>

          {(result.revenueBreakdown?.capacityCompensation || 0) > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                <span className="text-sm text-gray-700">{t('results.revenue.capacity')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                ¥{(result.revenueBreakdown.capacityCompensation / 10000).toFixed(1)}万
              </span>
            </div>
          )}

          {(result.revenueBreakdown?.demandResponse || 0) > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                <span className="text-sm text-gray-700">{t('results.revenue.demandResponse')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                ¥{(result.revenueBreakdown.demandResponse / 10000).toFixed(1)}万
              </span>
            </div>
          )}

          {(result.revenueBreakdown?.auxiliaryServices || 0) > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                <span className="text-sm text-gray-700">{t('results.revenue.auxiliary')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                ¥{(result.revenueBreakdown.auxiliaryServices / 10000).toFixed(1)}万
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-2 bg-gray-50 rounded-md px-3">
            <span className="text-sm font-semibold text-gray-900">{t('results.revenue.totalRevenue')}</span>
            <span className="text-base font-bold text-blue-600">
              ¥{((result.revenueBreakdown?.peakValleyArbitrage || 0 +
                  result.revenueBreakdown?.capacityCompensation || 0 +
                  result.revenueBreakdown?.demandResponse || 0 +
                  result.revenueBreakdown?.auxiliaryServices || 0) / 10000).toFixed(1)}万
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
          {t('results.actions.save')}
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium">
          {t('results.actions.export')}
        </button>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium">
          {t('results.actions.share')}
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
          {t('results.actions.recalculate')}
        </button>
      </div>
    </div>
  );
};

export default ResultsOverview;
