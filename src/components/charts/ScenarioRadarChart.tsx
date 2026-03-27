/**
 * ScenarioRadarChart - Multi-scenario comparison radar chart
 *
 * Displays performance metrics across different scenarios:
 * - Optimistic, Base, Pessimistic scenarios
 * - Custom scenarios
 * - IRR, NPV, Payback Period, LCOE metrics
 */

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ScenarioComparison } from '../../domain/services/ScenarioBuilder';
import { financialTheme, formatters, colors } from '../../lib/echarts-theme';

interface ScenarioRadarChartProps {
  scenarioComparison: ScenarioComparison;
  height?: number | string;
  showScenarios?: string[];
  className?: string;
}

export const ScenarioRadarChart: React.FC<ScenarioRadarChartProps> = ({
  scenarioComparison,
  height = 400,
  showScenarios,
  className = '',
}) => {
  const chartOption = useMemo(() => {
    const { scenarios, radarData } = scenarioComparison;

    // Filter scenarios if specified
    const filteredScenarios = showScenarios
      ? scenarios.filter((s) => showScenarios.includes(s.scenarioId))
      : scenarios;

    // Radar indicators (normalized to 0-100 scale)
    const indicators = [
      {
        name: 'IRR',
        max: 100,
        axisLabel: {
          formatter: (value: number) => `${value}%`,
        },
      },
      {
        name: 'NPV',
        max: 100,
        axisLabel: {
          formatter: (value: number) => {
            const maxNpv = Math.max(...scenarios.map((s) => s.metrics.npv));
            return formatters.shortCurrency((value / 100) * maxNpv);
          },
        },
      },
      {
        name: 'Payback Period',
        max: 100,
        inverse: true, // Lower is better
        axisLabel: {
          formatter: (value: number) => {
            const maxPayback = Math.max(...scenarios.map((s) => s.metrics.paybackPeriod));
            return `${((value / 100) * maxPayback).toFixed(1)}y`;
          },
        },
      },
      {
        name: 'LCOE',
        max: 100,
        inverse: true, // Lower is better
        axisLabel: {
          formatter: (value: number) => {
            const maxLcoe = Math.max(...scenarios.map((s) => s.metrics.lcoe || 0));
            return `¥${((value / 100) * maxLcoe).toFixed(2)}`;
          },
        },
      },
      {
        name: 'Revenue Stability',
        max: 100,
        axisLabel: {
          formatter: (value: number) => `${value}%`,
        },
      },
    ];

    // Series data for each scenario
    const seriesData = filteredScenarios.map((scenario) => {
      const { metrics } = scenario;

      // Normalize metrics to 0-100 scale
      const irrScore = Math.min(metrics.irr * 5, 100); // 20% IRR = 100 score
      const npvScore = Math.min((metrics.npv / 10000000) * 100, 100); // 10M NPV = 100 score
      const paybackScore = Math.max(100 - metrics.paybackPeriod * 10, 0); // 10y = 0 score, 0y = 100 score
      const lcoeScore = metrics.lcoe ? Math.max(100 - metrics.lcoe * 20, 0) : 50; // 0.5 = 100 score, 5 = 0 score
      const stabilityScore = 75; // Placeholder - would calculate based on revenue volatility

      return {
        value: [irrScore, npvScore, paybackScore, lcoeScore, stabilityScore],
        name: scenario.name,
      };
    });

    // Color scheme
    const scenarioColors = [
      colors.scenarios.base,
      colors.scenarios.optimistic,
      colors.scenarios.pessimistic,
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
    ];

    return {
      ...financialTheme,
      tooltip: {
        ...financialTheme.tooltip,
        trigger: 'item' as const,
        formatter: (params: any) => {
          const scenario = filteredScenarios[params.dataIndex];
          const metrics = scenario.metrics;

          return `
            <div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="margin-right: 16px;">IRR:</span>
              <span style="font-weight: 500;">${formatters.percentage(metrics.irr)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="margin-right: 16px;">NPV:</span>
              <span style="font-weight: 500;">${formatters.shortCurrency(metrics.npv)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="margin-right: 16px;">Payback:</span>
              <span style="font-weight: 500;">${formatters.duration(metrics.paybackPeriod)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="margin-right: 16px;">LCOE:</span>
              <span style="font-weight: 500;">¥${metrics.lcoe?.toFixed(2) || 'N/A'}/kWh</span>
            </div>
          `;
        },
      },
      legend: {
        ...financialTheme.legend,
        data: filteredScenarios.map((s) => s.name),
        top: 0,
      },
      radar: {
        indicator: indicators,
        center: ['50%', '55%'],
        radius: '65%',
        shape: 'polygon' as const,
        splitNumber: 5,
        axisName: {
          color: '#374151',
          fontWeight: 600,
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['#f9fafb', '#ffffff'],
          },
        },
        axisLine: {
          lineStyle: {
            color: '#d1d5db',
          },
        },
      },
      series: [
        {
          type: 'radar' as const,
          data: seriesData,
          symbolSize: 6,
          lineStyle: {
            width: 2,
          },
          areaStyle: {
            opacity: 0.15,
          },
          // Assign colors to each scenario
          itemStyle: {
            color: (params: any) => scenarioColors[params.dataIndex % scenarioColors.length],
          },
        },
      ],
    };
  }, [scenarioComparison, showScenarios]);

  return (
    <div className={`w-full ${className}`}>
      <ReactECharts option={chartOption} style={{ height }} opts={{ renderer: 'svg' }} />
    </div>
  );
};

export default ScenarioRadarChart;
