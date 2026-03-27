/**
 * Enhanced CashFlowCalculator - Calculate project cash flows with real business costs
 *
 * This service generates annual cash flow projections including:
 * - Revenue from energy storage operations
 * - Initial investment costs
 * - Real operating costs (personnel, office, maintenance, insurance)
 * - Taxes (VAT, surtax, corporate income tax)
 * - Financing costs (if applicable)
 */

import type { ProvinceData } from '../schemas/ProvinceSchema';
import type { ProjectInput } from '../schemas/ProjectSchema';
import { RevenueCalculator, type RevenueResult } from './RevenueCalculator';

/**
 * Cost breakdown for a single year
 */
export interface YearlyCosts {
  initialInvestment: number; // Only in year 0 (¥)
  annualOpex: number; // Annual operating cost (¥/year)
  financing: number; // Annual loan payment (¥/year)
  taxes: number; // Annual taxes (VAT, surtax, corporate tax)
  total: number; // Total cost for the year (¥)
}

/**
 * Cash flow breakdown for a single year
 */
export interface YearlyCashFlow {
  year: number;
  revenue: number; // Total revenue (¥/year)
  costs: YearlyCosts; // Cost breakdown
  netCashFlow: number; // Revenue - Costs (¥/year)
  cumulativeCashFlow: number; // Running total (¥)
  taxableProfit: number; // Profit before corporate tax
}

/**
 * Cash flow calculation result
 */
export interface CashFlowResult {
  yearlyCashFlows: YearlyCashFlow[]; // Year-by-year breakdown
  annualCashFlows: number[]; // Simple array for IRR calculation
  totalInvestment: number; // Initial investment (¥)
  totalRevenue: number; // Total lifetime revenue (¥)
  totalOpex: number; // Total lifetime OPEX (¥)
  totalFinancing: number; // Total lifetime financing cost (¥)
  totalTaxes: number; // Total lifetime taxes (¥)
  paybackPeriod: number; // Years to recover investment (or -1 if never)
}

/**
 * Enhanced calculator for project cash flows with real business costs
 */
export class EnhancedCashFlowCalculator {
  private revenueCalculator: RevenueCalculator;

  constructor() {
    this.revenueCalculator = new RevenueCalculator();
  }

  /**
   * Calculate initial investment from project input
   */
  calculateInitialInvestment(input: ProjectInput): number {
    const { systemSize, costs } = input;

    // System capacity in kWh (capacity is in MW)
    const capacityKwh = systemSize.capacity * 1000;

    // System power in kW (capacity / duration)
    const powerKw = capacityKwh / systemSize.duration;

    // Calculate total investment
    // Battery cost: ¥/kWh * kWh
    const batteryCost = costs.batteryCostPerKwh * capacityKwh;

    // PCS cost: ¥/kW * kW
    const pcsCost = costs.pcsCostPerKw * powerKw;

    // EMS cost: flat ¥
    const emsCost = costs.emsCost;

    // Installation cost: ¥/kW * kW
    const installationCost = costs.installationCostPerKw * powerKw;

    // Grid connection cost: flat ¥
    const gridConnectionCost = costs.gridConnectionCost;

    // Land cost: flat ¥
    const landCost = costs.landCost;

    // Development cost: flat ¥
    const developmentCost = costs.developmentCost;

    // Permitting cost: flat ¥
    const permittingCost = costs.permittingCost;

    // Base investment
    const baseInvestment =
      batteryCost +
      pcsCost +
      emsCost +
      installationCost +
      gridConnectionCost +
      landCost +
      developmentCost +
      permittingCost;

    // Apply contingency
    return baseInvestment * (1 + costs.contingencyPercent);
  }

  /**
   * Calculate annual operating costs with real business expenses
   */
  calculateAnnualOpex(input: ProjectInput, initialInvestment: number): number {
    // If operatingCosts are provided, use them
    if (input.operatingCosts && Object.keys(input.operatingCosts).length > 0) {
      const oc = input.operatingCosts;

      return (
        // 人力成本
        oc.operationsStaffCost +
        oc.managementCost +
        oc.technicalSupportCost +
        // 办公成本
        oc.officeRent +
        oc.officeExpenses +
        // 维护成本
        oc.regularMaintenanceCost +
        oc.preventiveMaintenanceCost +
        // 保险费用
        oc.equipmentInsurance +
        oc.liabilityInsurance +
        oc.propertyInsurance +
        // 其他费用
        oc.licenseFee +
        oc.regulatoryFee +
        oc.trainingCost +
        oc.utilitiesCost +
        oc.landLeaseCost +
        // 销售费用
        (oc.salesExpenses || 0)
      );
    }

    // Fallback: 2% of initial investment
    return initialInvestment * 0.02;
  }

  /**
   * Calculate taxes for a given year (China tax system)
   *
   * Includes:
   * 1. 增值税 (VAT): 6% for modern services
   * 2. 城建税及教育费附加: 12% of VAT
   * 3. 企业所得税: 25% of taxable profit
   *
   * Tax holiday: VAT/surcharges may not apply in early years
   */
  calculateTaxes(
    input: ProjectInput,
    revenue: number,
    costs: number,
    year: number
  ): number {
    if (!input.operatingCosts) {
      // No taxes if operating costs not specified
      return 0;
    }

    const oc = input.operatingCosts;
    const taxHolidayYears = input.financing?.taxHolidayYears ?? 0;

    // Check if tax holiday applies to VAT/surcharges
    const isTaxHoliday = year <= taxHolidayYears;

    // 1. 增值税 - only after tax holiday
    const vat = isTaxHoliday ? 0 : revenue * oc.vatRate;

    // 2. 城建税及教育费附加 - only after tax holiday
    const surtax = isTaxHoliday ? 0 : vat * oc.surtaxRate;

    // 3. 企业所得税 - applies every year
    // Taxable profit = Revenue - VAT - Costs - Surtax
    const taxableProfit = Math.max(0, revenue - costs - vat - surtax);
    const corporateTax = taxableProfit * oc.corporateTaxRate;

    return vat + surtax + corporateTax;
  }

  /**
   * Calculate annual loan payment (等额本息)
   */
  calculateAnnualLoanPayment(
    principal: number,
    annualRate: number,
    years: number
  ): number {
    if (principal <= 0 || annualRate <= 0 || years <= 0) {
      return 0;
    }

    const monthlyRate = annualRate / 12;
    const numberOfMonths = years * 12;

    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) /
      (Math.pow(1 + monthlyRate, numberOfMonths) - 1);

    return monthlyPayment * 12;
  }

  /**
   * Calculate yearly costs breakdown with taxes
   */
  calculateYearlyCosts(
    input: ProjectInput,
    initialInvestment: number,
    year: number,
    revenue: number
  ): YearlyCosts {
    // Initial investment only in year 0
    const initialInvestmentCost = year === 0 ? initialInvestment : 0;

    // Annual OPEX with real business costs
    const annualOpex = this.calculateAnnualOpex(input, initialInvestment);

    // Financing cost
    let financing = 0;
    if (input.financing && input.financing.hasLoan && year > 0 && year <= (input.financing.loanTerm ?? 0)) {
      const loanAmount = initialInvestment * (input.financing.loanRatio ?? 0);
      financing = this.calculateAnnualLoanPayment(
        loanAmount,
        input.financing.interestRate ?? 0,
        input.financing.loanTerm ?? 0
      );
    }

    // Calculate taxes (with tax holiday support)
    const preTaxCosts = annualOpex + financing;
    const taxes = this.calculateTaxes(input, revenue, preTaxCosts, year);

    const total = initialInvestmentCost + annualOpex + financing + taxes;

    return {
      initialInvestment: initialInvestmentCost,
      annualOpex,
      financing,
      taxes,
      total,
    };
  }

  /**
   * Calculate complete cash flows for project lifetime
   */
  calculateCashFlows(
    input: ProjectInput,
    province: ProvinceData,
    years: number = 10
  ): CashFlowResult {
    // Calculate initial investment
    const initialInvestment = this.calculateInitialInvestment(input);

    // Calculate revenue for all years
    // Convert units: capacity (MW) -> kWh, calculate power from capacity/duration
    const capacityKwh = input.systemSize.capacity * 1000;
    const powerKw = capacityKwh / input.systemSize.duration;

    const revenueResult = this.revenueCalculator.calculateLifetimeRevenue(
      province,
      capacityKwh,
      powerKw,
      input.operatingParams.systemEfficiency,
      input.operatingParams.depthOfDischarge,
      input.operatingParams.cyclesPerDay,
      input.operatingParams.degradationRate,
      years
    );

    // Calculate yearly cash flows
    const yearlyCashFlows: YearlyCashFlow[] = [];
    const annualCashFlows: number[] = [];
    let cumulativeCashFlow = -initialInvestment;

    for (let year = 0; year <= years; year++) {
      const isInvestmentYear = year === 0;
      let revenue: number;

      // Year 0: initial investment year
      if (isInvestmentYear) {
        revenue = 0;
        const costs = this.calculateYearlyCosts(input, initialInvestment, year, revenue);

        yearlyCashFlows.push({
          year,
          revenue,
          costs,
          netCashFlow: revenue - costs.total,
          cumulativeCashFlow: cumulativeCashFlow,
          taxableProfit: 0,
        });
        annualCashFlows.push(-initialInvestment);
      } else {
        // Operating years (1-10)
        revenue = revenueResult.annualRevenues[year - 1] || 0;
        const costs = this.calculateYearlyCosts(input, initialInvestment, year, revenue);

        // Calculate taxable profit for corporate tax
        const vat = input.operatingCosts ? revenue * input.operatingCosts.vatRate : 0;
        const surtax = input.operatingCosts ? vat * input.operatingCosts.surtaxRate : 0;
        const preTaxProfit = Math.max(0, revenue - costs.total - vat - surtax);

        yearlyCashFlows.push({
          year,
          revenue,
          costs,
          netCashFlow: revenue - costs.total,
          cumulativeCashFlow: cumulativeCashFlow,
          taxableProfit: preTaxProfit,
        });
        annualCashFlows.push(revenue - costs.total);
      }

      cumulativeCashFlow += revenue - (yearlyCashFlows[yearlyCashFlows.length - 1]?.costs.total || 0);
    }

    // Calculate payback period
    let paybackPeriod = -1;
    for (let i = 0; i < yearlyCashFlows.length; i++) {
      if (yearlyCashFlows[i].cumulativeCashFlow >= 0) {
        paybackPeriod = yearlyCashFlows[i].year;
        break;
      }
    }

    // Calculate totals
    const totalRevenue = yearlyCashFlows.reduce((sum, ycf) => sum + ycf.revenue, 0);
    const totalOpex = yearlyCashFlows.reduce((sum, ycf) => sum + ycf.costs.annualOpex, 0);
    const totalFinancing = yearlyCashFlows.reduce((sum, ycf) => sum + ycf.costs.financing, 0);
    const totalTaxes = yearlyCashFlows.reduce((sum, ycf) => sum + ycf.costs.taxes, 0);

    return {
      yearlyCashFlows,
      annualCashFlows,
      totalInvestment: initialInvestment,
      totalRevenue,
      totalOpex,
      totalFinancing,
      totalTaxes,
      paybackPeriod,
    };
  }
}

export default EnhancedCashFlowCalculator;
