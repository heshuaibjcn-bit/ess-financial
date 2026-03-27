/**
 * Tests for CashFlowCalculator
 */

import { describe, it, expect } from 'vitest';
import { CashFlowCalculator } from '@/domain/services/CashFlowCalculator';
import type { ProvinceData } from '@/domain/schemas/ProvinceSchema';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

describe('CashFlowCalculator', () => {
  let calculator: CashFlowCalculator;

  beforeEach(() => {
    calculator = new CashFlowCalculator();
  });

  // Mock province data
  const guangdongProvince: ProvinceData = {
    code: 'GD',
    name: '广东省',
    nameEn: 'Guangdong',
    pricing: {
      peakPrice: 1.15,
      valleyPrice: 0.35,
      flatPrice: 0.75,
      peakHours: ['10:00-12:00', '14:00-19:00'],
      valleyHours: ['00:00-08:00', '12:00-14:00'],
      peakMonths: [1, 2, 6, 7, 8, 9, 12],
      spread: 0.8,
    },
    capacityCompensation: {
      available: true,
      type: 'none',
      policyName: '广东省暂无容量补偿政策',
      effectiveDate: '2026-01-01',
    },
    demandResponse: {
      available: true,
      peakCompensation: 4.0,
      valleyCompensation: 1.5,
      minResponseSize: 0.5,
      maxAnnualCalls: 50,
    },
    auxiliaryServices: {
      available: false,
    },
    lastUpdated: '2026-03-27',
    dataVersion: '2026-Q1',
    dataSource: '广东省发改委 2026年第一季度政策',
  };

  // Standard project input (using new schema structure)
  const standardInput: ProjectInput = {
    province: 'guangdong',
    systemSize: {
      capacity: 2.0, // MW
      duration: 2, // hours
    },
    costs: {
      batteryCostPerKwh: 500, // ¥/kWh (converted from 0.5 ¥/Wh)
      pcsCostPerKw: 150, // ¥/kW (converted from 0.15 ¥/W)
      emsCost: 30000,
      installationCostPerKw: 80, // ¥/kW (converted from 0.08 ¥/Wh)
      gridConnectionCost: 0,
      landCost: 0,
      developmentCost: 0,
      permittingCost: 0,
      contingencyPercent: 0,
    },
    operatingParams: {
      systemEfficiency: 0.88,
      depthOfDischarge: 0.9,
      cyclesPerDay: 2,
      degradationRate: 0.02,
      availabilityPercent: 0.97,
    },
  };

  describe('calculateInitialInvestment', () => {
    it('should calculate total investment correctly', () => {
      const investment = calculator.calculateInitialInvestment(standardInput);

      // New schema calculation:
      // capacity: 2.0 MW = 2000 kWh
      // duration: 2 hours
      // powerKw = 2000 / 2 = 1000 kW
      // batteryCostPerKwh: 500 ¥/kWh
      // pcsCostPerKw: 150 ¥/kW
      // emsCost: 30000 ¥
      // investment = 500 * 2000 + 150 * 1000 + 30000 = 1,180,000 ¥

      expect(investment).toBeCloseTo(1180000, 0);
    });

    it('should handle different cost structures', () => {
      const lowCostInput: ProjectInput = {
        ...standardInput,
        costs: {
          batteryCostPerKwh: 300,
          pcsCostPerKw: 100,
          emsCost: 20000,
          installationCostPerKw: 50,
          gridConnectionCost: 0,
          landCost: 0,
          developmentCost: 0,
          permittingCost: 0,
          contingencyPercent: 0,
        },
      };

      const investment = calculator.calculateInitialInvestment(lowCostInput);

      // Should be lower than standard input
      const standardInvestment = calculator.calculateInitialInvestment(standardInput);
      expect(investment).toBeLessThan(standardInvestment);
    });
  });

  describe('calculateAnnualOpex', () => {
    it('should calculate OPEX as 2% of initial investment when no operating costs provided', () => {
      const investment = calculator.calculateInitialInvestment(standardInput);
      const opex = calculator.calculateAnnualOpex(standardInput, investment);

      // 2% of investment
      expect(opex).toBeCloseTo(investment * 0.02);
    });

    it('should handle different investment amounts', () => {
      const input1M: ProjectInput = {
        ...standardInput,
        systemSize: { capacity: 1.0, duration: 2 },
      };
      const investment1M = calculator.calculateInitialInvestment(input1M);
      expect(calculator.calculateAnnualOpex(input1M, investment1M)).toBeCloseTo(investment1M * 0.02);
    });
  });

  describe('calculateAnnualLoanPayment', () => {
    it('should calculate equal principal and interest payment', () => {
      // Principal: 1,000,000 ¥, Rate: 4.5%, Term: 10 years
      const payment = calculator.calculateAnnualLoanPayment(1000000, 0.045, 10);

      // Using PMT formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
      // Monthly rate = 0.045 / 12 = 0.00375
      // Number of months = 120
      // Monthly payment ≈ 10,363.84 ¥
      // Annual payment ≈ 124,366.08 ¥

      expect(payment).toBeCloseTo(124366, 0);
    });

    it('should return 0 for zero principal', () => {
      const payment = calculator.calculateAnnualLoanPayment(0, 0.045, 10);
      expect(payment).toBe(0);
    });

    it('should return 0 for zero interest rate', () => {
      const payment = calculator.calculateAnnualLoanPayment(1000000, 0, 10);
      expect(payment).toBe(0);
    });

    it('should return 0 for zero term', () => {
      const payment = calculator.calculateAnnualLoanPayment(1000000, 0.045, 0);
      expect(payment).toBe(0);
    });

    it('should handle higher interest rates', () => {
      const lowRatePayment = calculator.calculateAnnualLoanPayment(1000000, 0.045, 10);
      const highRatePayment = calculator.calculateAnnualLoanPayment(1000000, 0.08, 10);

      expect(highRatePayment).toBeGreaterThan(lowRatePayment);
    });

    it('should handle different loan terms', () => {
      const shortTerm = calculator.calculateAnnualLoanPayment(1000000, 0.045, 5);
      const longTerm = calculator.calculateAnnualLoanPayment(1000000, 0.045, 15);

      // Shorter term = higher annual payment
      expect(shortTerm).toBeGreaterThan(longTerm);
    });
  });

  describe('calculateYearlyCosts', () => {
    it('should include initial investment in year 0', () => {
      const initialInvestment = 1180000;
      const costs = calculator.calculateYearlyCosts(standardInput, initialInvestment, 0);

      expect(costs.initialInvestment).toBeCloseTo(1180000, 0);
      expect(costs.annualOpex).toBeCloseTo(23600, 0);
      expect(costs.financing).toBe(0); // Year 0 has no financing

      // Year 0 total should be initial + OPEX
      expect(costs.total).toBeCloseTo(1203600, 0);
    });

    it('should not include initial investment after year 0', () => {
      const initialInvestment = 1180000;
      const costs = calculator.calculateYearlyCosts(standardInput, initialInvestment, 1);

      expect(costs.initialInvestment).toBe(0);
      expect(costs.annualOpex).toBeCloseTo(23600, 0);
    });

    it('should include financing when configured', () => {
      const inputWithFinancing: ProjectInput = {
        ...standardInput,
        financing: {
          loanRatio: 0.6,
          interestRate: 0.045,
          term: 10,
        },
      };

      const initialInvestment = calculator.calculateInitialInvestment(inputWithFinancing);
      const costs = calculator.calculateYearlyCosts(inputWithFinancing, initialInvestment, 1);

      // Loan amount = 1180000 * 0.6 = 708000
      // Annual payment calculated by the formula
      // Using PMT: r(1+r)^n / [(1+r)^n - 1] * P
      // The calculator returns the exact value

      expect(costs.financing).toBeCloseTo(88051, 0);
      expect(costs.total).toBeCloseTo(23600 + 88051, 0);
    });

    it('should not include financing after loan term', () => {
      const inputWithFinancing: ProjectInput = {
        ...standardInput,
        financing: {
          loanRatio: 0.6,
          interestRate: 0.045,
          term: 10,
        },
      };

      const initialInvestment = calculator.calculateInitialInvestment(inputWithFinancing);
      // Year 10 is the last year of the 10-year loan term
      const costsYear10 = calculator.calculateYearlyCosts(inputWithFinancing, initialInvestment, 10);
      const costsYear11 = calculator.calculateYearlyCosts(inputWithFinancing, initialInvestment, 11);

      expect(costsYear10.financing).toBeGreaterThan(0);
      expect(costsYear11.financing).toBe(0);
    });

    it('should not include financing when loanRatio is 0', () => {
      const inputNoFinancing: ProjectInput = {
        ...standardInput,
        financing: {
          loanRatio: 0,
          interestRate: 0.045,
          term: 10,
        },
      };

      const initialInvestment = calculator.calculateInitialInvestment(inputNoFinancing);
      const costs = calculator.calculateYearlyCosts(inputNoFinancing, initialInvestment, 1);

      expect(costs.financing).toBe(0);
    });
  });

  describe('calculateCashFlows', () => {
    it('should generate 10-year cash flow projection', () => {
      const result = calculator.calculateCashFlows(standardInput, guangdongProvince, 10);

      expect(result.yearlyCashFlows.length).toBe(10);
      expect(result.annualCashFlows.length).toBe(10);
    });

    it('should have negative cash flow in year 0', () => {
      const result = calculator.calculateCashFlows(standardInput, guangdongProvince, 10);

      // Year 0 cash flow should be negative (initial investment)
      expect(result.annualCashFlows[0]).toBeLessThan(0);
      expect(result.yearlyCashFlows[0].netCashFlow).toBeLessThan(0);
    });

    it('should calculate payback period', () => {
      const result = calculator.calculateCashFlows(standardInput, guangdongProvince, 10);

      // Payback period is either:
      // -1: project never pays back within the timeframe
      // 0+: years to payback (including fractional year)
      // Just check it's a valid number
      expect(result.paybackPeriod).toBeDefined();
      expect(typeof result.paybackPeriod).toBe('number');
      // It should be either -1 (never) or positive (some payback period)
      expect(result.paybackPeriod === -1 || result.paybackPeriod > 0).toBe(true);
    });

    it('should accumulate totals correctly', () => {
      const result = calculator.calculateCashFlows(standardInput, guangdongProvince, 10);

      expect(result.totalInvestment).toBeCloseTo(1180000, 0);
      expect(result.totalRevenue).toBeGreaterThan(0);
      // OPEX for 9 operating years (years 1-9, since year 0 is investment/construction)
      expect(result.totalOpex).toBeCloseTo(23600 * 9, 0);
    });

    it('should calculate cumulative cash flow', () => {
      const result = calculator.calculateCashFlows(standardInput, guangdongProvince, 10);

      // Year 0 should be negative (investment)
      expect(result.yearlyCashFlows[0].cumulativeCashFlow).toBeCloseTo(-1180000, 0);

      // Last year should be positive (profitable)
      expect(result.yearlyCashFlows[9].cumulativeCashFlow).toBeGreaterThan(
        result.yearlyCashFlows[0].cumulativeCashFlow
      );

      // Cumulative should be monotonically increasing after year 0
      for (let i = 2; i < 10; i++) {
        expect(result.yearlyCashFlows[i].cumulativeCashFlow).toBeGreaterThanOrEqual(
          result.yearlyCashFlows[i - 1].cumulativeCashFlow
        );
      }
    });

    it('should include financing costs when configured', () => {
      const inputWithFinancing: ProjectInput = {
        ...standardInput,
        financing: {
          loanRatio: 0.6,
          interestRate: 0.045,
          term: 10,
        },
      };

      const result = calculator.calculateCashFlows(inputWithFinancing, guangdongProvince, 10);

      // Total financing should be > 0
      expect(result.totalFinancing).toBeGreaterThan(0);

      // Years 1-9 should have financing cost (index 1-9 in the array)
      for (let i = 1; i < 10; i++) {
        expect(result.yearlyCashFlows[i].costs.financing).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateAnnualCashFlows', () => {
    it('should return simple cash flow array', () => {
      const cashFlows = calculator.calculateAnnualCashFlows(standardInput, guangdongProvince, 10);

      expect(cashFlows.length).toBe(10);
      expect(cashFlows[0]).toBeLessThan(0); // Initial investment
    });

    it('should match calculateCashFlows result', () => {
      const fullResult = calculator.calculateCashFlows(standardInput, guangdongProvince, 10);
      const simpleArray = calculator.calculateAnnualCashFlows(standardInput, guangdongProvince, 10);

      expect(simpleArray).toEqual(fullResult.annualCashFlows);
    });
  });

  describe('project comparison', () => {
    it('should show profitability with good parameters', () => {
      const result = calculator.calculateCashFlows(standardInput, guangdongProvince, 10);

      // Final cumulative cash flow should be positive (profitable project)
      expect(result.yearlyCashFlows[9].cumulativeCashFlow).toBeGreaterThan(0);
    });

    it('should handle different project sizes', () => {
      const smallProject: ProjectInput = {
        ...standardInput,
        systemSize: { capacity: 0.5, duration: 4 }, // 0.5 MW, 4 hours = 2000 kWh / 4 = 500 kW
      };

      const largeProject: ProjectInput = {
        ...standardInput,
        systemSize: { capacity: 5, duration: 4 }, // 5 MW, 4 hours = 20000 kWh / 4 = 5000 kW
      };

      const smallResult = calculator.calculateCashFlows(smallProject, guangdongProvince, 10);
      const largeResult = calculator.calculateCashFlows(largeProject, guangdongProvince, 10);

      // Large project should have higher investment and revenue
      expect(largeResult.totalInvestment).toBeGreaterThan(smallResult.totalInvestment);
      expect(largeResult.totalRevenue).toBeGreaterThan(smallResult.totalRevenue);

      // Both should be profitable
      expect(smallResult.yearlyCashFlows[9].cumulativeCashFlow).toBeGreaterThan(0);
      expect(largeResult.yearlyCashFlows[9].cumulativeCashFlow).toBeGreaterThan(0);
    });
  });
});
