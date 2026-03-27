/**
 * SensitivityTornadoChart - Tornado chart for sensitivity analysis
 *
 * Displays the impact of parameter variations on IRR:
 * - Horizontal bars showing IRR range for each parameter
 * - Sorted by impact magnitude (tornado shape)
 * - Base case IRR marked
 */

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { SensitivityResult } from '../../domain/services/SensitivityAnalyzer';
import { financialTheme, formatters, colors } from '../../lib/echarts-theme';

interface SensitivityTornadoChartProps {
  sensitivityResult: SensitivityResult;
  height?: number | string;
  className?: string;
}

export const SensitivityTornadoChart: React.FC<SensitivityTornadoChartProps> = ({
  sensitivityResult,
  height = 400,
  className = '',
}) => {
  const chartOption = useMemo(() => {
    const { baseIrr, parameterImpacts } = sensitivityResult;

    // Sort parameters by impact (largest range first)
    const sortedImpacts = [...parameterImpacts].sort((a, b) => {
      const rangeA = Math.max(...a.variations.map((v) => v.irr)) - Math.min(...a.variations.map((v) => v.irr));
      const rangeB = Math.max(...b.variations.map((v) => v.irr)) - Math.min(...b.variations.map((v) => v.irr));
      return rangeB - rangeA; // Descending order
    });

    const yAxisData = sortedImpacts.map((impact) => {
      // Convert parameter name to display format
      const nameMap: Record<string, string> = {
        batteryCost: 'Battery Cost',
        systemSize: 'System Size',
        systemEfficiency: 'System Efficiency',
        cyclesPerDay: 'Cycles Per Day',
        depthOfDischarge: 'Depth of Discharge',
        degradationRate: 'Degradation Rate',
        peakPrice: 'Peak Price',
        valleyPrice: 'Valley Price',
      };
      return nameMap[impact.parameter] || impact.parameter;
    });

    // Calculate ranges
    const seriesData: {
      name: string;
      value: [number, number];
      itemStyle: { color: string };
    }[] = [];

    sortedImpacts.forEach((impact) => {
      const irrValues = impact.variations.map((v) => v.irr);
      const minIrr = Math.min(...irrValues);
      const maxIrr = Math.max(...irrValues);

      seriesData.push({
        name: yAxisData[sortedImpacts.indexOf(impact)],
        value: [minIrr, maxIrr],
        itemStyle: {
          color: (params: any) => {
            const value = params.value;
            const base = baseIrr;
            if (value[1] < base) return colors.financial.negative; // All below base
            if (value[0] > base) return colors.financial.positive; // All above base
            return colors.financial.neutral; // Straddles base
          },
        },
      });
    });

    return {
      ...financialTheme,
      tooltip: {
        ...financialTheme.tooltip,
        trigger: 'axis' as const,
        axisPointer: {
          type: 'shadow' as const,
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const param = params[0];
          const impact = sortedImpacts[param.dataIndex];
          const variationLabels = impact.variations.map((v) => {
            const pct = (v.variation * 100).toFixed(0);
            return `${pct}%`;
          });

          let tooltip = `<div style="font-weight: 600; margin-bottom: 8px;">${param.name}</div>`;
          tooltip += `<div style="margin-bottom: 8px;">`;
          tooltip += `<span style="margin-right: 16px;">IRR Range:</span>`;
          tooltip += `<span style="font-weight: 500;">${formatters.percentage(param.value[0])} - ${formatters.percentage(param.value[1])}</span>`;
          tooltip += `</div>`;

          // Show IRR for each variation level
          tooltip += `<div style="font-size: 11px; color: #9ca3af;">`;
          impact.variations.forEach((v, i) => {
            const variation = (v.variation * 100).toFixed(0);
            const sign = v.variation > 0 ? '+' : '';
            tooltip += `<div>${sign}${variation}%: ${formatters.percentage(v.irr)}</div>`;
          });
          tooltip += `</div>`;

          return tooltip;
        },
      },
      grid: {
        left: '25%',
        right: '8%',
        top: '5%',
        bottom: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: 'IRR (%)',
        nameLocation: 'middle' as const,
        nameGap: 30,
        nameTextStyle: {
          fontWeight: 600,
        },
        axisLabel: {
          formatter: (value: number) => formatters.percentage(value),
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
          },
        },
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          fontSize: 12,
          fontWeight: 500,
        },
      },
      series: [
        {
          type: 'bar' as const,
          data: seriesData,
          barWidth: '60%',
          label: {
            show: true,
            position: 'inside' as const,
            formatter: (params: any) => {
              const range = params.value[1] - params.value[0];
              return `±${(range / 2).toFixed(1)}%`;
            },
            color: '#ffffff',
            fontSize: 11,
            fontWeight: 'bold',
          },
          markLine: {
            silent: false,
            symbol: 'none',
            lineStyle: {
              type: 'solid' as const,
              color: colors.financial.neutral,
              width: 2,
            },
            label: {
              show: true,
              position: 'end' as const,
              formatter: `Base: ${formatters.percentage(baseIrr)}`,
              color: colors.financial.neutral,
              fontWeight: 'bold',
              fontSize: 11,
            },
            data: [
              {
                xAxis: baseIrr,
              },
            ],
          },
        },
      ],
    };
  }, [sensitivityResult]);

  return (
    <div className={`w-full ${className}`}>
      <ReactECharts option={chartOption} style={{ height }} opts={{ renderer: 'svg' }} />
    </div>
  );
};

export default SensitivityTornadoChart;
