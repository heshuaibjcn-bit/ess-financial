/**
 * RevenueSourcesPieChart - Revenue source breakdown
 *
 * Displays the proportion of revenue from each source:
 * - Peak-valley arbitrage
 * - Capacity compensation
 * - Demand response
 * - Auxiliary services
 */

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { EngineResult } from '../../domain/schemas';
import { financialTheme, formatters, colors } from '../../lib/echarts-theme';

interface RevenueSourcesPieChartProps {
  result: EngineResult;
  height?: number | string;
  showLabel?: boolean;
  className?: string;
}

export const RevenueSourcesPieChart: React.FC<RevenueSourcesPieChartProps> = ({
  result,
  height = 350,
  showLabel = true,
  className = '',
}) => {
  const chartOption = useMemo(() => {
    const revenues = result.revenue;
    const totalRevenue = result.cashFlow.annualRevenue;

    const data: { name: string; value: number; itemStyle: { color: string } }[] = [];

    // Arbitrage revenue
    data.push({
      name: 'Peak-Valley Arbitrage',
      value: revenues.arbitrage.revenue,
      itemStyle: { color: colors.revenue.arbitrage },
    });

    // Capacity compensation
    if (revenues.capacityCompensation.available) {
      data.push({
        name: 'Capacity Compensation',
        value: revenues.capacityCompensation.revenue,
        itemStyle: { color: colors.revenue.capacity },
      });
    }

    // Demand response
    if (revenues.demandResponse.available) {
      data.push({
        name: 'Demand Response',
        value: revenues.demandResponse.annualRevenue,
        itemStyle: { color: colors.revenue.demandResponse },
      });
    }

    // Auxiliary services
    if (revenues.auxiliaryServices.available) {
      data.push({
        name: 'Auxiliary Services',
        value: revenues.auxiliaryServices.annualRevenue,
        itemStyle: { color: colors.revenue.auxiliary },
      });
    }

    return {
      ...financialTheme,
      tooltip: {
        ...financialTheme.tooltip,
        trigger: 'item' as const,
        formatter: (params: any) => {
          const percentage = ((params.value / totalRevenue) * 100).toFixed(1);
          return `
            <div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="margin-right: 16px;">${params.marker} Annual Revenue:</span>
              <span style="font-weight: 500;">${formatters.currency(params.value)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="margin-right: 16px;">Share:</span>
              <span style="font-weight: 500;">${percentage}%</span>
            </div>
          `;
        },
      },
      legend: {
        ...financialTheme.legend,
        orient: 'vertical' as const,
        right: '5%',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          type: 'pie' as const,
          radius: ['45%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderWidth: 2,
            borderColor: '#ffffff',
          },
          label: {
            show: showLabel,
            formatter: (params: any) => {
              const percentage = ((params.value / totalRevenue) * 100).toFixed(1);
              return `${params.name}\n${percentage}%`;
            },
            color: '#374151',
            fontSize: 11,
            fontWeight: 500,
          },
          labelLine: {
            lineStyle: {
              color: '#9ca3af',
            },
            smooth: 0.2,
            length: 10,
            length2: 20,
          },
          data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
            },
          },
        },
      ],
    };
  }, [result, showLabel]);

  return (
    <div className={`w-full ${className}`}>
      <ReactECharts option={chartOption} style={{ height }} opts={{ renderer: 'svg' }} />
    </div>
  );
};

export default RevenueSourcesPieChart;
