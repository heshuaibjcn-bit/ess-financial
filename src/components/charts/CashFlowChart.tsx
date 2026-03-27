/**
 * CashFlowChart - Cumulative cash flow visualization
 *
 * Displays:
 * - Cumulative cash flow over project lifetime (line chart)
 * - Annual revenue breakdown (stacked bar chart)
 * - Payback period marker
 */

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { EngineResult } from '../../domain/schemas';
import { financialTheme, formatters, colors, getFontSize } from '../../lib/echarts-theme';

interface CashFlowChartProps {
  result: EngineResult;
  height?: number | string;
  showCumulative?: boolean;
  showAnnualBreakdown?: boolean;
  className?: string;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  result,
  height = 400,
  showCumulative = true,
  showAnnualBreakdown = true,
  className = '',
}) => {
  const chartOption = useMemo(() => {
    const years = result.cashFlow.years;
    const cashFlows = result.cashFlow.annualCashFlows;
    const cumulative = result.cashFlow.cumulativeCashFlow;
    const revenues = result.revenue;
    const paybackPeriod = result.financials.paybackPeriod;

    const xAxisData = years.map((y) => `Year ${y}`);

    const series: EChartsOption['series'] = [];
    const legendData: string[] = [];

    if (showAnnualBreakdown) {
      // Annual revenue breakdown
      legendData.push(
        'Arbitrage Revenue',
        'Capacity Compensation',
        'Demand Response',
        'Auxiliary Services',
        'O&M Costs',
        'Loan Repayment'
      );

      // Arbitrage revenue
      series.push({
        name: 'Arbitrage Revenue',
        type: 'bar',
        stack: 'revenue',
        data: years.map((year) => revenues.arbitrage.revenue * Math.pow(1 - result.degradationRate, year - 1)),
        itemStyle: { color: colors.revenue.arbitrage },
      });

      // Capacity compensation
      series.push({
        name: 'Capacity Compensation',
        type: 'bar',
        stack: 'revenue',
        data: years.map((year) =>
          revenues.capacityCompensation.available ? revenues.capacityCompensation.revenue : 0
        ),
        itemStyle: { color: colors.revenue.capacity },
      });

      // Demand response
      series.push({
        name: 'Demand Response',
        type: 'bar',
        stack: 'revenue',
        data: years.map((year) =>
          revenues.demandResponse.available ? revenues.demandResponse.annualRevenue : 0
        ),
        itemStyle: { color: colors.revenue.demandResponse },
      });

      // Auxiliary services
      series.push({
        name: 'Auxiliary Services',
        type: 'bar',
        stack: 'revenue',
        data: years.map((year) =>
          revenues.auxiliaryServices.available ? revenues.auxiliaryServices.annualRevenue : 0
        ),
        itemStyle: { color: colors.revenue.auxiliary },
      });

      // O&M costs (negative)
      series.push({
        name: 'O&M Costs',
        type: 'bar',
        stack: 'costs',
        data: years.map(() => result.cashFlow.omCost),
        itemStyle: { color: colors.financial.negative },
      });

      // Loan repayment (negative)
      series.push({
        name: 'Loan Repayment',
        type: 'bar',
        stack: 'costs',
        data: years.map((_, i) => (result.financing?.hasLoan ? result.cashFlow.loanPayments[i] || 0 : 0)),
        itemStyle: { color: colors.financial.neutral },
      });
    }

    if (showCumulative) {
      legendData.push('Cumulative Cash Flow', 'Payback Period');

      // Cumulative cash flow line
      series.push({
        name: 'Cumulative Cash Flow',
        type: 'line',
        data: cumulative,
        yAxisIndex: showAnnualBreakdown ? 1 : 0,
        smooth: true,
        lineStyle: {
          width: 3,
          color: colors.financial.positive,
        },
        itemStyle: {
          color: colors.financial.positive,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            type: 'dashed',
            color: colors.financial.negative,
            width: 2,
          },
          label: {
            show: true,
            position: 'end',
            formatter: `Payback: ${formatters.duration(paybackPeriod)}`,
            color: colors.financial.negative,
            fontWeight: 'bold',
          },
          data: [
            {
              xAxis: Math.floor(paybackPeriod),
            },
          ],
        },
      });
    }

    const yAxes = [
      {
        type: 'value' as const,
        name: 'Annual Cash Flow (¥)',
        axisLabel: {
          formatter: (value: number) => formatters.shortCurrency(value),
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
          },
        },
      },
    ];

    if (showCumulative && showAnnualBreakdown) {
      yAxes.push({
        type: 'value' as const,
        name: 'Cumulative (¥)',
        axisLabel: {
          formatter: (value: number) => formatters.shortCurrency(value),
        },
        splitLine: {
          show: false,
        },
      });
    }

    return {
      ...financialTheme,
      tooltip: {
        ...financialTheme.tooltip,
        trigger: 'axis' as const,
        axisPointer: {
          type: 'cross' as const,
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const year = params[0].axisValue;
          let tooltip = `<div style="font-weight: 600; margin-bottom: 8px;">${year}</div>`;

          params.forEach((param: any) => {
            const value = param.value;
            const formattedValue =
              param.seriesName === 'Cumulative Cash Flow'
                ? formatters.currency(value)
                : formatters.shortCurrency(value);
            tooltip += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="margin-right: 16px;">${param.marker} ${param.seriesName}:</span>
              <span style="font-weight: 500;">${formattedValue}</span>
            </div>`;
          });

          return tooltip;
        },
      },
      legend: {
        ...financialTheme.legend,
        data: legendData,
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: showAnnualBreakdown ? '15%' : '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisLabel: {
          color: '#6b7280',
        },
      },
      yAxis: yAxes,
      series,
    };
  }, [result, showCumulative, showAnnualBreakdown]);

  return (
    <div className={`w-full ${className}`}>
      <ReactECharts option={chartOption} style={{ height }} opts={{ renderer: 'svg' }} />
    </div>
  );
};

export default CashFlowChart;
