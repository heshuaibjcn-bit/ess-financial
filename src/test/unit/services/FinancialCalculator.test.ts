/**
 * Tests for FinancialCalculator
 */

import { describe, it, expect } from 'vitest';
import { FinancialCalculator } from '@/domain/services/FinancialCalculator';
import type { CashFlowResult, YearlyCashFlow } from '@/domain/services/CashFlowCalculator';

describe('FinancialCalculator', () => {
  let calculator: FinancialCalculator;

  beforeEach(() => {
    calculator = new FinancialCalculator();
  });

  describe('calculateIRR', () => {
    it('should calculate IRR for standard energy storage project', () => {
      // Standard project: -1M investment, 150k/year for 10 years
      const cashFlows = [-1000000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000];

      const irr = calculator.calculateIRR(cashFlows);

      expect(irr).not.toBeNull();
      expect(irr).toBeCloseTo(8.14, 1); // Should be around 8.14%
    });

    it('should return null for all negative cash flows', () => {
      const cashFlows = [-100000, -10000, -10000];

      const irr = calculator.calculateIRR(cashFlows);

      expect(irr).toBeNull();
    });

    it('should return null for zero initial investment', () => {
      const cashFlows = [0, 50000, 50000];

      const irr = calculator.calculateIRR(cashFlows);

      // May return null or handle infinite return
      expect(irr).toBeNull();
    });

    it('should calculate high IRR for very profitable project', () => {
      // Very profitable: -1M investment, 300k/year for 10 years
      const cashFlows = [-1000000, 300000, 300000, 300000, 300000, 300000, 300000, 300000, 300000, 300000, 300000];

      const irr = calculator.calculateIRR(cashFlows);

      expect(irr).not.toBeNull();
      expect(irr).toBeGreaterThan(25); // Should be >25%
    });

    it('should calculate low IRR for marginal project', () => {
      // Marginal: -1M investment, 120k/year for 10 years
      const cashFlows = [-1000000, 120000, 120000, 120000, 120000, 120000, 120000, 120000, 120000, 120000, 120000];

      const irr = calculator.calculateIRR(cashFlows);

      expect(irr).not.toBeNull();
      expect(irr).toBeGreaterThan(0);
      expect(irr).toBeLessThan(5); // Should be <5%
    });

    it('should handle empty cash flow array', () => {
      const irr = calculator.calculateIRR([]);

      expect(irr).toBeNull();
    });

    it('should handle single cash flow', () => {
      const irr = calculator.calculateIRR([-1000000]);

      expect(irr).toBeNull(); // No positive cash flows
    });
  });

  describe('calculateNPV', () => {
    it('should calculate NPV at 8% discount rate', () => {
      const cashFlows = [-1000000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000];

      const npv = calculator.calculateNPV(cashFlows, 0.08);

      // At 8% discount rate, this project should have slightly positive NPV
      // (since IRR is 8.14%, slightly above 8%)
      expect(npv).toBeCloseTo(6512, 0);
    });

    it('should calculate NPV at different discount rates', () => {
      const cashFlows = [-1000000, 200000, 200000, 200000, 200000, 200000];

      const npv5 = calculator.calculateNPV(cashFlows, 0.05);
      const npv10 = calculator.calculateNPV(cashFlows, 0.10);

      // Lower discount rate = higher NPV
      expect(npv5).toBeGreaterThan(npv10);
    });

    it('should return 0 for empty cash flow array', () => {
      const npv = calculator.calculateNPV([], 0.08);

      expect(npv).toBe(0);
    });

    it('should return negative NPV for unprofitable project', () => {
      const cashFlows = [-1000000, 100000, 100000, 100000, 100000, 100000];

      const npv = calculator.calculateNPV(cashFlows, 0.08);

      expect(npv).toBeLessThan(0);
    });
  });

  describe('calculateROI', () => {
    it('should calculate ROI for profitable project', () => {
      const totalRevenue = 2000000; // 2M
      const totalInvestment = 1000000; // 1M
      const totalOperatingCost = 300000; // 300k

      const roi = calculator.calculateROI(totalRevenue, totalInvestment, totalOperatingCost);

      // ROI = (2M - 1.3M) / 1.3M = 53.8%
      expect(roi).toBeCloseTo(53.8, 1);
    });

    it('should return 0 for zero total cost', () => {
      const roi = calculator.calculateROI(1000000, 0, 0);

      expect(roi).toBe(0);
    });

    it('should return negative ROI for loss-making project', () => {
      const totalRevenue = 1000000;
      const totalInvestment = 1500000;
      const totalOperatingCost = 300000;

      const roi = calculator.calculateROI(totalRevenue, totalInvestment, totalOperatingCost);

      expect(roi).toBeLessThan(0);
    });
  });

  describe('calculateLCOS', () => {
    it('should calculate levelized cost of storage', () => {
      // Create a simple cash flow result
      const yearlyCashFlows: YearlyCashFlow[] = [
        {
          revenue: 0,
          costs: {
            initialInvestment: 1500000,
            annualOpex: 0,
            financing: 0,
            total: 1500000,
          },
          netCashFlow: -1500000,
          cumulativeCashFlow: -1500000,
        },
        {
          revenue: 1000000,
          costs: {
            initialInvestment: 0,
            annualOpex: 30000,
            financing: 0,
            total: 30000,
          },
          netCashFlow: 970000,
          cumulativeCashFlow: -530000,
        },
      ];

      const cashFlowResult: CashFlowResult = {
        yearlyCashFlows,
        annualCashFlows: [-1500000, 970000],
        totalInvestment: 1500000,
        totalRevenue: 1000000,
        totalOpex: 30000,
        totalFinancing: 0,
        paybackPeriod: 1.55,
      };

      const lcoc = calculator.calculateLCOS(
        cashFlowResult,
        2000, // kWh
        0.9, // DOD
        2, // cycles/day
        0.08, // discount rate
        2 // years
      );

      // LCOS should be positive and reasonable
      expect(lcoc).toBeGreaterThan(0);
      expect(lcoc).toBeLessThan(2); // Should be less than 2 ¥/kWh
    });

    it('should return 0 for zero energy discharged', () => {
      const yearlyCashFlows: YearlyCashFlow[] = [
        {
          revenue: 0,
          costs: {
            initialInvestment: 1500000,
            annualOpex: 0,
            financing: 0,
            total: 1500000,
          },
          netCashFlow: -1500000,
          cumulativeCashFlow: -1500000,
        },
      ];

      const cashFlowResult: CashFlowResult = {
        yearlyCashFlows,
        annualCashFlows: [-1500000],
        totalInvestment: 1500000,
        totalRevenue: 0,
        totalOpex: 0,
        totalFinancing: 0,
        paybackPeriod: -1,
      };

      // 0 cycles per day means no energy discharged
      const lcoc = calculator.calculateLCOS(
        cashFlowResult,
        2000,
        0.9,
        0, // 0 cycles/day
        0.08,
        1
      );

      expect(lcoc).toBe(0);
    });
  });

  describe('calculateProfitMargin', () => {
    it('should calculate profit margin for profitable project', () => {
      const margin = calculator.calculateProfitMargin(2000000, 1500000);

      // (2M - 1.5M) / 2M = 25%
      expect(margin).toBeCloseTo(25, 1);
    });

    it('should return 0 for zero revenue', () => {
      const margin = calculator.calculateProfitMargin(0, 1500000);

      expect(margin).toBe(0);
    });

    it('should return negative margin for loss-making project', () => {
      const margin = calculator.calculateProfitMargin(1000000, 1500000);

      expect(margin).toBeLessThan(0);
    });
  });

  describe('calculateAllMetrics', () => {
    it('should calculate all metrics from cash flow result', () => {
      const yearlyCashFlows: YearlyCashFlow[] = [
        {
          revenue: 0,
          costs: {
            initialInvestment: 1000000,
            annualOpex: 0,
            financing: 0,
            total: 1000000,
          },
          netCashFlow: -1000000,
          cumulativeCashFlow: -1000000,
        },
        ...Array.from({ length: 9 }, (_, i) => ({
          revenue: 200000,
          costs: {
            initialInvestment: 0,
            annualOpex: 20000,
            financing: 0,
            total: 20000,
          },
          netCashFlow: 180000,
          cumulativeCashFlow: -1000000 + (i + 1) * 180000,
        })),
      ];

      const cashFlowResult: CashFlowResult = {
        yearlyCashFlows,
        annualCashFlows: [-1000000, ...Array(9).fill(180000)],
        totalInvestment: 1000000,
        totalRevenue: 1800000,
        totalOpex: 180000,
        totalFinancing: 0,
        paybackPeriod: 6.5,
      };

      const metrics = calculator.calculateAllMetrics(
        cashFlowResult,
        2000,
        0.9,
        2,
        0.08
      );

      expect(metrics.irr).not.toBeNull();
      expect(metrics.irr).toBeGreaterThan(0);
      expect(metrics.npv).toBeDefined();
      expect(metrics.roi).toBeDefined();
      expect(metrics.lcoc).toBeGreaterThan(0);
      expect(metrics.profitMargin).toBeDefined();
    });
  });

  describe('validateMetrics', () => {
    it('should pass validation for good project', () => {
      const metrics = {
        irr: 12.5,
        npv: 500000,
        roi: 45.2,
        lcoc: 0.65,
        profitMargin: 30.5,
      };

      const validation = calculator.validateMetrics(metrics);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should fail validation for negative IRR', () => {
      const metrics = {
        irr: -5.2,
        npv: -100000,
        roi: -10,
        lcoc: 1.2,
        profitMargin: -20,
      };

      const validation = calculator.validateMetrics(metrics);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues.some(issue => issue.includes('IRR'))).toBe(true);
    });

    it('should warn about unrealistically high IRR', () => {
      const metrics = {
        irr: 150,
        npv: 5000000,
        roi: 500,
        lcoc: 0.3,
        profitMargin: 85,
      };

      const validation = calculator.validateMetrics(metrics);

      expect(validation.valid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('unrealistically high'))).toBe(true);
    });

    it('should warn about null IRR', () => {
      const metrics = {
        irr: null,
        npv: -100000,
        roi: -10,
        lcoc: 1.2,
        profitMargin: -20,
      };

      const validation = calculator.validateMetrics(metrics);

      expect(validation.valid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('IRR could not be calculated'))).toBe(true);
    });

    it('should warn about high LCOS', () => {
      const metrics = {
        irr: 8,
        npv: 100000,
        roi: 15,
        lcoc: 2.5,
        profitMargin: 10,
      };

      const validation = calculator.validateMetrics(metrics);

      expect(validation.valid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('LCOS seems high'))).toBe(true);
    });
  });

  describe('NPV vs IRR relationship', () => {
    it('should have positive NPV when discount rate < IRR', () => {
      const cashFlows = [-1000000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000];

      const irr = calculator.calculateIRR(cashFlows);
      const npvAtLowerRate = calculator.calculateNPV(cashFlows, (irr! / 100) - 0.01);

      expect(npvAtLowerRate).toBeGreaterThan(0);
    });

    it('should have negative NPV when discount rate > IRR', () => {
      const cashFlows = [-1000000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000];

      const irr = calculator.calculateIRR(cashFlows);
      const npvAtHigherRate = calculator.calculateNPV(cashFlows, (irr! / 100) + 0.01);

      expect(npvAtHigherRate).toBeLessThan(0);
    });

    it('should have NPV ≈ 0 when discount rate = IRR', () => {
      const cashFlows = [-1000000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000];

      const irr = calculator.calculateIRR(cashFlows);
      const npvAtIRR = calculator.calculateNPV(cashFlows, irr! / 100);

      // NPV at IRR should be very close to 0
      expect(Math.abs(npvAtIRR)).toBeLessThan(1000); // Within 1000 ¥
    });
  });
});
