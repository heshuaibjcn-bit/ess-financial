/**
 * ECharts Theme Configuration
 *
 * Professional financial theme optimized for C&I energy storage analytics
 */

import type { EChartsOption } from 'echarts';

export const financialTheme = {
  // Color palette - professional financial colors
  color: [
    '#3b82f6', // Primary blue
    '#10b981', // Success green
    '#f59e0b', // Warning amber
    '#ef4444', // Danger red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
  ],

  // Background
  backgroundColor: '#ffffff',
  bgColor: '#ffffff',

  // Text styles
  textStyle: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 12,
    color: '#374151',
  },

  title: {
    textStyle: {
      color: '#111827',
      fontWeight: 600,
      fontSize: 16,
    },
    subtextStyle: {
      color: '#6b7280',
      fontSize: 12,
    },
  },

  // Legend
  legend: {
    textStyle: {
      color: '#374151',
    },
    inactiveColor: '#9ca3af',
  },

  // Tooltip
  tooltip: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderWidth: 0,
    textStyle: {
      color: '#ffffff',
      fontSize: 13,
    },
    padding: [12, 16],
    extraCssText: 'border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
  },

  // Grid
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '10%',
    containLabel: true,
  },

  // Category axis
  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: '#e5e7eb',
      },
    },
    axisTick: {
      lineStyle: {
        color: '#e5e7eb',
      },
    },
    axisLabel: {
      color: '#6b7280',
      fontSize: 11,
    },
    splitLine: {
      lineStyle: {
        color: '#f3f4f6',
      },
    },
  },

  // Value axis
  valueAxis: {
    axisLine: {
      lineStyle: {
        color: '#e5e7eb',
      },
    },
    axisTick: {
      lineStyle: {
        color: '#e5e7eb',
      },
    },
    axisLabel: {
      color: '#6b7280',
      fontSize: 11,
    },
    splitLine: {
      lineStyle: {
        color: '#f3f4f6',
        type: 'dashed',
      },
    },
  },

  // Line series
  line: {
    smooth: false,
    symbolSize: 6,
    lineStyle: {
      width: 2.5,
    },
    itemStyle: {
      borderWidth: 2,
      borderColor: '#ffffff',
    },
  },

  // Bar series
  bar: {
    barMaxWidth: 50,
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
    },
  },

  // Pie series
  pie: {
    radius: ['40%', '70%'],
    avoidLabelOverlap: true,
    itemStyle: {
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    label: {
      show: true,
      formatter: '{b}: {d}%',
      color: '#374151',
    },
    labelLine: {
      lineStyle: {
        color: '#9ca3af',
      },
    },
  },
};

/**
 * Chart common options
 */
export const commonOptions = {
  // Animation
  animation: true,
  animationDuration: 750,
  animationEasing: 'cubicOut',

  // Responsive
  responsive: true,
  maintainAspectRatio: false,

  // Rendering
  renderer: 'canvas' as const,
};

/**
 * Chart default font sizes for different container sizes
 */
export const fontSizes = {
  small: {
    title: 14,
    axis: 10,
    legend: 11,
    tooltip: 12,
  },
  medium: {
    title: 16,
    axis: 11,
    legend: 12,
    tooltip: 13,
  },
  large: {
    title: 18,
    axis: 12,
    legend: 13,
    tooltip: 14,
  },
};

/**
 * Format utilities for chart labels
 */
export const formatters = {
  // Currency: ¥1,234.56
  currency: (value: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },

  // Short currency: ¥1.2M
  shortCurrency: (value: number): string => {
    if (Math.abs(value) >= 1e6) {
      return `¥${(value / 1e6).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1e4) {
      return `¥${(value / 1e4).toFixed(1)}K`;
    }
    return `¥${value.toFixed(0)}`;
  },

  // Percentage: 8.14%
  percentage: (value: number): string => {
    return `${value.toFixed(2)}%`;
  },

  // Years: Year 1, Year 2
  year: (value: number): string => {
    return `Year ${value}`;
  },

  // Number with comma: 1,234.56
  number: (value: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  },

  // Duration: 5.2 years
  duration: (value: number): string => {
    return `${value.toFixed(1)} years`;
  },
};

/**
 * Color utilities
 */
export const colors = {
  // Revenue sources
  revenue: {
    arbitrage: '#3b82f6', // Blue
    capacity: '#10b981', // Green
    demandResponse: '#f59e0b', // Amber
    auxiliary: '#8b5cf6', // Purple
  },

  // Financial indicators
  financial: {
    positive: '#10b981', // Green
    neutral: '#6b7280', // Gray
    negative: '#ef4444', // Red
  },

  // Sensitivity
  sensitivity: {
    positive: '#10b981', // Green
    negative: '#ef4444', // Red
    neutral: '#f59e0b', // Amber
  },

  // Scenarios
  scenarios: {
    optimistic: '#10b981', // Green
    base: '#3b82f6', // Blue
    pessimistic: '#ef4444', // Red
  },
};

/**
 * Chart export options
 */
export const exportOptions = {
  type: 'png' as const,
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  excludeComponents: ['toolbox' as const],
};

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  small: 640, // < 640px
  medium: 768, // 640px - 768px
  large: 1024, // 768px - 1024px
  xlarge: 1280, // > 1024px
};

/**
 * Get font size based on container width
 */
export function getFontSize(containerWidth: number): typeof fontSizes.medium {
  if (containerWidth < breakpoints.medium) return fontSizes.small;
  if (containerWidth < breakpoints.large) return fontSizes.medium;
  return fontSizes.large;
}

/**
 * Create chart option with defaults
 */
export function createChartOption(customOptions: EChartsOption): EChartsOption {
  return {
    ...commonOptions,
    ...customOptions,
  };
}
