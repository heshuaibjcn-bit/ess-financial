/**
 * ContextBuilder - Build analysis context from project data
 *
 * Extracts and formats project data for AI analysis
 */

import type { ProjectAnalysisContext } from '@/types/ai';
import type { EngineResult } from '@/domain/services/CalculationEngine';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

/**
 * Build analysis context from project input and calculation result
 */
export function buildProjectContext(
  projectInput: ProjectInput,
  result: EngineResult,
  benchmarkComparison?: {
    percentileIRR?: number;
    percentileNPV?: number;
    rating?: string;
  }
): ProjectAnalysisContext {
  // Calculate total revenue
  const totalRevenue =
    (result.revenueBreakdown?.peakValleyArbitrage || 0) +
    (result.revenueBreakdown?.capacityCompensation || 0) +
    (result.revenueBreakdown?.demandResponse || 0) +
    (result.revenueBreakdown?.auxiliaryServices || 0);

  return {
    project: {
      id: result.projectId || undefined,
      province: projectInput.province,
      systemSize: {
        capacity: projectInput.systemSize.capacity,
        power: projectInput.systemSize.capacity / projectInput.systemSize.duration,
        duration: projectInput.systemSize.duration,
      },
    },
    financials: {
      irr: result.metrics?.irr ?? result.irr ?? null,
      npv: result.npv ?? 0,
      paybackPeriod: result.paybackPeriod ?? -1,
      lcoe: result.levelizedCost ?? 0,
      roi: result.metrics?.roi ?? 0,
      profitMargin: result.metrics?.profitMargin ?? 0,
    },
    revenue: {
      peakValleyArbitrage: result.revenueBreakdown?.peakValleyArbitrage || 0,
      capacityCompensation: result.revenueBreakdown?.capacityCompensation || 0,
      demandResponse: result.revenueBreakdown?.demandResponse || 0,
      auxiliaryServices: result.revenueBreakdown?.auxiliaryServices || 0,
      totalRevenue,
    },
    costs: {
      initialInvestment: result.costBreakdown?.initialInvestment || result.totalInvestment || 0,
      annualOpex: result.costBreakdown?.annualOpeex || 0,
      annualFinancing: result.costBreakdown?.annualFinancing || 0,
    },
    validation: {
      valid: result.validation?.valid ?? false,
      issues: result.validation?.issues ?? [],
    },
    benchmarkComparison,
  };
}

/**
 * Format context as readable text for AI prompt
 */
export function formatContextAsText(context: ProjectAnalysisContext, language: 'zh' | 'en' = 'zh'): string {
  const isZh = language === 'zh';

  let text = '';

  // Project info
  text += isZh ? '## 项目信息\n' : '## Project Information\n';
  text += isZh
    ? `- 省份: ${context.project.province}\n`
    : `- Province: ${context.project.province}\n`;
  text += isZh
    ? `- 系统容量: ${context.project.systemSize.capacity} MW\n`
    : `- System Capacity: ${context.project.systemSize.capacity} MW\n`;
  text += isZh
    ? `- 系统功率: ${context.project.systemSize.power.toFixed(1)} kW\n`
    : `- System Power: ${context.project.systemSize.power.toFixed(1)} kW\n`;
  text += isZh
    ? `- 放电时长: ${context.project.systemSize.duration} 小时\n\n`
    : `- Duration: ${context.project.systemSize.duration} hours\n\n`;

  // Financial metrics
  text += isZh ? '## 财务指标\n' : '## Financial Metrics\n';
  text += isZh
    ? `- 内部收益率(IRR): ${context.financials.irr !== null ? context.financials.irr.toFixed(2) + '%' : 'N/A'}\n`
    : `- IRR: ${context.financials.irr !== null ? context.financials.irr.toFixed(2) + '%' : 'N/A'}\n`;
  text += isZh
    ? `- 净现值(NPV): ¥${(context.financials.npv / 10000).toFixed(1)}万\n`
    : `- NPV: ¥${(context.financials.npv / 10000).toFixed(1)}万\n`;
  text += isZh
    ? `- 投资回收期: ${context.financials.paybackPeriod >= 0 && context.financials.paybackPeriod < 100 ? context.financials.paybackPeriod.toFixed(1) + '年' : '无法回收'}\n`
    : `- Payback Period: ${context.financials.paybackPeriod >= 0 && context.financials.paybackPeriod < 100 ? context.financials.paybackPeriod.toFixed(1) + ' years' : 'N/A'}\n`;
  text += isZh
    ? `- 平准化成本(LCOE): ¥${context.financials.lcoe.toFixed(2)}/kWh\n`
    : `- LCOE: ¥${context.financials.lcoe.toFixed(2)}/kWh\n`;
  text += isZh
    ? `- 投资回报率(ROI): ${context.financials.roi.toFixed(2)}%\n\n`
    : `- ROI: ${context.financials.roi.toFixed(2)}%\n\n`;

  // Revenue breakdown
  text += isZh ? '## 收入构成\n' : '## Revenue Breakdown\n';
  text += isZh
    ? `- 峰谷价差套利: ¥${(context.revenue.peakValleyArbitrage / 10000).toFixed(1)}万\n`
    : `- Peak-Valley Arbitrage: ¥${(context.revenue.peakValleyArbitrage / 10000).toFixed(1)}万\n`;
  if (context.revenue.capacityCompensation > 0) {
    text += isZh
      ? `- 容量补偿: ¥${(context.revenue.capacityCompensation / 10000).toFixed(1)}万\n`
      : `- Capacity Compensation: ¥${(context.revenue.capacityCompensation / 10000).toFixed(1)}万\n`;
  }
  if (context.revenue.demandResponse > 0) {
    text += isZh
      ? `- 需求响应: ¥${(context.revenue.demandResponse / 10000).toFixed(1)}万\n`
      : `- Demand Response: ¥${(context.revenue.demandResponse / 10000).toFixed(1)}万\n`;
  }
  if (context.revenue.auxiliaryServices > 0) {
    text += isZh
      ? `- 辅助服务: ¥${(context.revenue.auxiliaryServices / 10000).toFixed(1)}万\n`
      : `- Auxiliary Services: ¥${(context.revenue.auxiliaryServices / 10000).toFixed(1)}万\n`;
  }
  text += isZh
    ? `- 年总收入: ¥${(context.revenue.totalRevenue / 10000).toFixed(1)}万\n\n`
    : `- Total Annual Revenue: ¥${(context.revenue.totalRevenue / 10000).toFixed(1)}万\n\n`;

  // Cost breakdown
  text += isZh ? '## 成本构成\n' : '## Cost Breakdown\n';
  text += isZh
    ? `- 初始投资: ¥${(context.costs.initialInvestment / 10000).toFixed(1)}万\n`
    : `- Initial Investment: ¥${(context.costs.initialInvestment / 10000).toFixed(1)}万\n`;
  text += isZh
    ? `- 年运营成本: ¥${(context.costs.annualOpex / 10000).toFixed(1)}万\n`
    : `- Annual OpEx: ¥${(context.costs.annualOpex / 10000).toFixed(1)}万\n`;
  text += isZh
    ? `- 年财务成本: ¥${(context.costs.annualFinancing / 10000).toFixed(1)}万\n\n`
    : `- Annual Financing Cost: ¥${(context.costs.annualFinancing / 10000).toFixed(1)}万\n\n`;

  // Validation status
  if (context.validation.issues.length > 0) {
    text += isZh ? '## 验证问题\n' : '## Validation Issues\n';
    context.validation.issues.forEach((issue) => {
      text += `- ${issue}\n`;
    });
    text += '\n';
  }

  // Benchmark comparison
  if (context.benchmarkComparison) {
    text += isZh ? '## 行业对比\n' : '## Benchmark Comparison\n';
    if (context.benchmarkComparison.percentileIRR !== undefined) {
      text += isZh
        ? `- IRR百分位: 前${100 - context.benchmarkComparison.percentileIRR}%\n`
        : `- IRR Percentile: Top ${100 - context.benchmarkComparison.percentileIRR}%\n`;
    }
    if (context.benchmarkComparison.percentileNPV !== undefined) {
      text += isZh
        ? `- NPV百分位: 前${100 - context.benchmarkComparison.percentileNPV}%\n`
        : `- NPV Percentile: Top ${100 - context.benchmarkComparison.percentileNPV}%\n`;
    }
    if (context.benchmarkComparison.rating) {
      text += isZh
        ? `- 综合评级: ${context.benchmarkComparison.rating}\n\n`
        : `- Overall Rating: ${context.benchmarkComparison.rating}\n\n`;
    }
  }

  return text;
}
