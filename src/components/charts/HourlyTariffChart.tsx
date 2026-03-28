/**
 * HourlyTariffChart - 24-hour price distribution visualization
 *
 * Displays:
 * - 24-hour price distribution using AreaChart
 * - Background color regions for peak/valley/flat periods
 * - Period labels on the chart
 * - Interactive tooltips
 * - Responsive design
 */

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { type HourlyPrice } from '../../domain/schemas/ProjectSchema';

interface HourlyTariffChartProps {
  hourlyPrices: HourlyPrice[];
  height?: number;
  className?: string;
}

export const HourlyTariffChart: React.FC<HourlyTariffChartProps> = ({
  hourlyPrices,
  height = 350,
  className = '',
}) => {
  // Prepare data for the chart
  const chartData = useMemo(() => {
    return hourlyPrices.map((item) => ({
      hour: `${item.hour}:00`,
      hourNum: item.hour,
      price: item.price,
      period: item.period,
    }));
  }, [hourlyPrices]);

  // Group consecutive hours by period to create background regions
  const periodRegions = useMemo(() => {
    const regions: Array<{ start: number; end: number; period: string }> = [];
    let currentRegion: { start: number; end: number; period: string } | null = null;

    for (let i = 0; i < hourlyPrices.length; i++) {
      const hour = hourlyPrices[i].hour;
      const period = hourlyPrices[i].period;

      if (!currentRegion) {
        currentRegion = { start: hour, end: hour, period };
      } else if (period === currentRegion.period) {
        currentRegion.end = hour;
      } else {
        regions.push(currentRegion);
        currentRegion = { start: hour, end: hour, period };
      }
    }

    if (currentRegion) {
      regions.push(currentRegion);
    }

    return regions;
  }, [hourlyPrices]);

  // Get background color for each period
  const getPeriodBackgroundColor = (period: string) => {
    switch (period) {
      case 'peak':
        return 'rgba(239, 68, 68, 0.08)'; // red with low opacity
      case 'valley':
        return 'rgba(34, 197, 94, 0.08)'; // green with low opacity
      case 'flat':
      default:
        return 'rgba(234, 179, 8, 0.08)'; // yellow with low opacity
    }
  };

  // Get period label color
  const getPeriodLabelColor = (period: string) => {
    switch (period) {
      case 'peak':
        return '#ef4444';
      case 'valley':
        return '#22c55e';
      case 'flat':
      default:
        return '#eab308';
    }
  };

  // Get period name in Chinese
  const getPeriodName = (period: string) => {
    switch (period) {
      case 'peak':
        return '峰时';
      case 'valley':
        return '谷时';
      case 'flat':
      default:
        return '平时';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const periodName = getPeriodName(data.period);
      const periodColor = getPeriodLabelColor(data.period);

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium" style={{ color: periodColor }}>
            {periodName}电价
          </p>
          <p className="text-lg font-bold text-gray-900">
            ¥{data.price.toFixed(3)}/kWh
          </p>
          <p className="text-xs text-gray-500">{data.hour}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const prices = hourlyPrices.map((h) => h.price);
    return {
      max: Math.max(...prices),
      min: Math.min(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      spread: Math.max(...prices) - Math.min(...prices),
    };
  }, [hourlyPrices]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="hour"
              interval={2}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#d1d5db' }}
              label={{ value: '时间', position: 'insideBottom', offset: -15, fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={(value) => `¥${value.toFixed(2)}`}
              label={{ value: '电价 (¥/kWh)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Background regions for each period */}
            {periodRegions.map((region, index) => (
              <ReferenceArea
                key={index}
                x1={region.start}
                x2={region.end + 1}
                fill={getPeriodBackgroundColor(region.period)}
                stroke="none"
              />
            ))}

            {/* Period labels at the top */}
            {periodRegions.map((region, index) => {
              const midHour = (region.start + region.end) / 2;
              const periodName = getPeriodName(region.period);
              const periodColor = getPeriodLabelColor(region.period);

              return (
                <ReferenceLine
                  key={`label-${index}`}
                  x={midHour}
                  stroke="none"
                  label={{
                    value: periodName,
                    position: 'top',
                    fill: periodColor,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              );
            })}

            {/* Vertical lines separating periods */}
            {periodRegions.slice(1).map((region, index) => (
              <ReferenceLine
                key={`separator-${index}`}
                x={region.start}
                stroke="#9ca3af"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
            ))}

            {/* Price area */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#colorPrice)"
              fillOpacity={0.4}
            />

            {/* Reference lines for peak and valley prices */}
            <ReferenceLine
              y={stats.max}
              stroke="#ef4444"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: `峰: ¥${stats.max.toFixed(3)}`,
                position: 'left',
                fill: '#ef4444',
                fontSize: 11,
                offset: 5,
              }}
            />
            <ReferenceLine
              y={stats.min}
              stroke="#22c55e"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: `谷: ¥${stats.min.toFixed(3)}`,
                position: 'left',
                fill: '#22c55e',
                fontSize: 11,
                offset: 5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced Legend */}
      <div className="space-y-3">
        {/* Period color explanation */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-gray-700 font-medium">峰时</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-gray-700 font-medium">平时</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-gray-700 font-medium">谷时</span>
          </div>
        </div>

        {/* Period time ranges */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          {periodRegions.map((region, index) => {
            const periodName = getPeriodName(region.period);
            const periodColor = getPeriodLabelColor(region.period);
            const timeRange = region.start === region.end
              ? `${region.start}:00`
              : `${region.start}:00 - ${region.end}:00`;

            return (
              <div key={index} className="text-center p-2 rounded-lg border" style={{ borderColor: periodColor, backgroundColor: getPeriodBackgroundColor(region.period) }}>
                <div className="font-semibold mb-1" style={{ color: periodColor }}>
                  {periodName}
                </div>
                <div className="text-gray-600">
                  {timeRange}
                </div>
                <div className="text-gray-500 mt-1">
                  {region.end - region.start + 1}小时
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HourlyTariffChart;
