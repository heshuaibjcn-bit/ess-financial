/**
 * Tests for RevenueCalculator
 */

import { describe, it, expect } from 'vitest';
import { RevenueCalculator } from '@/domain/services/RevenueCalculator';
import type { ProvinceData } from '@/domain/schemas/ProvinceSchema';

describe('RevenueCalculator', () => {
  let calculator: RevenueCalculator;

  beforeEach(() => {
    calculator = new RevenueCalculator();
  });

  // Mock province data for testing
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

  const shandongProvince: ProvinceData = {
    code: 'SD',
    name: '山东省',
    nameEn: 'Shandong',
    pricing: {
      peakPrice: 1.0,
      valleyPrice: 0.4,
      flatPrice: 0.65,
      peakHours: ['08:00-11:00', '16:00-21:00'],
      valleyHours: ['00:00-06:00', '11:00-14:00'],
      peakMonths: [1, 2, 7, 8, 12],
      spread: 0.6,
    },
    capacityCompensation: {
      available: true,
      type: 'capacity-based',
      rate: 100,
      requirements: {
        minDischargeDuration: 2,
        availabilityThreshold: 90,
      },
      policyName: '山东省容量补偿试点政策',
      effectiveDate: '2025-01-01',
    },
    demandResponse: {
      available: true,
      peakCompensation: 3.0,
      valleyCompensation: 1.0,
      minResponseSize: 0.5,
      maxAnnualCalls: 45,
    },
    auxiliaryServices: {
      available: true,
      peaking: {
        price: 0.6,
        availableHours: 800,
      },
    },
    lastUpdated: '2026-03-27',
    dataVersion: '2026-Q1',
    dataSource: '山东省发改委 2026年1月政策',
  };

  const zhejiangProvince: ProvinceData = {
    code: 'ZJ',
    name: '浙江省',
    nameEn: 'Zhejiang',
    pricing: {
      peakPrice: 1.2,
      valleyPrice: 0.35,
      flatPrice: 0.7,
      peakHours: ['08:00-11:00', '13:00-15:00', '18:00-21:00'],
      valleyHours: ['22:00-08:00'],
      peakMonths: [1, 2, 7, 8, 12],
      spread: 0.85,
    },
    capacityCompensation: {
      available: true,
      type: 'discharge-based',
      rate: 0.8,
      requirements: {
        minDischargeDuration: 1.5,
        availabilityThreshold: 85,
      },
      policyName: '浙江省放电量补偿政策',
      effectiveDate: '2025-06-01',
    },
    demandResponse: {
      available: true,
      peakCompensation: 3.5,
      valleyCompensation: 1.2,
      minResponseSize: 1,
      maxAnnualCalls: 60,
    },
    auxiliaryServices: {
      available: false,
    },
    lastUpdated: '2026-03-27',
    dataVersion: '2026-Q1',
    dataSource: '浙江省发改委 2026年第一季度政策',
  };

  // Standard test parameters
  const testParams = {
    capacity: 2000, // kWh
    power: 500, // kW
    efficiency: 0.88,
    dod: 0.9,
    cyclesPerDay: 2,
    degradationRate: 0.02,
  };

  describe('calculateArbitrage', () => {
    it('should calculate Guangdong arbitrage revenue correctly', () => {
      const revenue = calculator.calculateArbitrage(
        guangdongProvince,
        testParams.capacity,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay
      );

      // Manual calculation:
      // Spread = 1.15 - 0.35 = 0.8 ¥/kWh
      // Energy per cycle = 2000 * 0.9 * 0.88 = 1584 kWh
      // Daily revenue = 0.8 * 1584 * 2 = 2534.4 ¥/day
      // Annual revenue = 2534.4 * 365 = 925,056 ¥/year

      expect(revenue).toBeCloseTo(925056, 0);
    });

    it('should calculate Shandong arbitrage revenue correctly', () => {
      const revenue = calculator.calculateArbitrage(
        shandongProvince,
        testParams.capacity,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay
      );

      // Manual calculation:
      // Spread = 1.0 - 0.4 = 0.6 ¥/kWh
      // Energy per cycle = 2000 * 0.9 * 0.88 = 1584 kWh
      // Daily revenue = 0.6 * 1584 * 2 = 1900.8 ¥/day
      // Annual revenue = 1900.8 * 365 = 693,792 ¥/year

      expect(revenue).toBeCloseTo(693792, 0);
    });

    it('should calculate Zhejiang arbitrage revenue correctly', () => {
      const revenue = calculator.calculateArbitrage(
        zhejiangProvince,
        testParams.capacity,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay
      );

      // Manual calculation:
      // Spread = 1.2 - 0.35 = 0.85 ¥/kWh
      // Energy per cycle = 2000 * 0.9 * 0.88 = 1584 kWh
      // Daily revenue = 0.85 * 1584 * 2 = 2692.8 ¥/day
      // Annual revenue = 2692.8 * 365 = 982,872 ¥/year

      expect(revenue).toBeCloseTo(982872, 0);
    });
  });

  describe('calculateCapacityCompensation', () => {
    it('should return 0 for Guangdong (no compensation)', () => {
      const revenue = calculator.calculateCapacityCompensation(
        guangdongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay
      );

      expect(revenue).toBe(0);
    });

    it('should calculate Shandong capacity-based compensation', () => {
      const revenue = calculator.calculateCapacityCompensation(
        shandongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay
      );

      // Capacity-based: 500 kW * 100 ¥/kW/year = 50,000 ¥/year

      expect(revenue).toBeCloseTo(50000, 0);
    });

    it('should calculate Zhejiang discharge-based compensation', () => {
      const revenue = calculator.calculateCapacityCompensation(
        zhejiangProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay
      );

      // Discharge-based:
      // Annual discharge = 2000 * 0.9 * 2 * 365 = 1,314,000 kWh/year
      // Compensation = 1,314,000 * 0.8 = 1,051,200 ¥/year

      expect(revenue).toBeCloseTo(1051200, 0);
    });
  });

  describe('calculateDemandResponse', () => {
    it('should calculate Guangdong demand response revenue', () => {
      const revenue = calculator.calculateDemandResponse(
        guangdongProvince,
        testParams.power
      );

      // 4.0 ¥/kWh * 500 kW * 2 hours * 50 calls = 200,000 ¥/year

      expect(revenue).toBeCloseTo(200000, 0);
    });

    it('should calculate Shandong demand response revenue', () => {
      const revenue = calculator.calculateDemandResponse(
        shandongProvince,
        testParams.power
      );

      // 3.0 ¥/kWh * 500 kW * 2 hours * 45 calls = 135,000 ¥/year

      expect(revenue).toBeCloseTo(135000, 0);
    });

    it('should return 0 when demand response not available', () => {
      const province: ProvinceData = {
        ...guangdongProvince,
        demandResponse: {
          available: false,
        },
      };

      const revenue = calculator.calculateDemandResponse(province, testParams.power);

      expect(revenue).toBe(0);
    });
  });

  describe('calculateAuxiliaryServices', () => {
    it('should return 0 for Guangdong (no auxiliary services)', () => {
      const revenue = calculator.calculateAuxiliaryServices(
        guangdongProvince,
        testParams.power
      );

      expect(revenue).toBe(0);
    });

    it('should calculate Shandong peaking revenue', () => {
      const revenue = calculator.calculateAuxiliaryServices(
        shandongProvince,
        testParams.power
      );

      // 0.6 ¥/kWh * 500 kW * 800 hours = 240,000 ¥/year

      expect(revenue).toBeCloseTo(240000, 0);
    });

    it('should return 0 when auxiliary services not available', () => {
      const province: ProvinceData = {
        ...shandongProvince,
        auxiliaryServices: {
          available: false,
        },
      };

      const revenue = calculator.calculateAuxiliaryServices(province, testParams.power);

      expect(revenue).toBe(0);
    });
  });

  describe('calculateYearlyRevenue', () => {
    it('should calculate Guangdong first year revenue breakdown', () => {
      const breakdown = calculator.calculateYearlyRevenue(
        guangdongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay
      );

      // Arbitrage: 925,056 ¥/year
      // Capacity compensation: 0 ¥/year
      // Demand response: 200,000 ¥/year
      // Auxiliary services: 0 ¥/year
      // Total: 1,125,056 ¥/year

      expect(breakdown.peakValleyArbitrage).toBeCloseTo(925056, 0);
      expect(breakdown.capacityCompensation).toBe(0);
      expect(breakdown.demandResponse).toBeCloseTo(200000, 0);
      expect(breakdown.auxiliaryServices).toBe(0);
      expect(breakdown.total).toBeCloseTo(1125056, 0);
    });

    it('should calculate Shandong first year revenue breakdown', () => {
      const breakdown = calculator.calculateYearlyRevenue(
        shandongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay
      );

      // Arbitrage: 693,792 ¥/year
      // Capacity compensation: 50,000 ¥/year
      // Demand response: 135,000 ¥/year
      // Auxiliary services: 240,000 ¥/year
      // Total: 1,118,792 ¥/year

      expect(breakdown.peakValleyArbitrage).toBeCloseTo(693792, 0);
      expect(breakdown.capacityCompensation).toBeCloseTo(50000, 0);
      expect(breakdown.demandResponse).toBeCloseTo(135000, 0);
      expect(breakdown.auxiliaryServices).toBeCloseTo(240000, 0);
      expect(breakdown.total).toBeCloseTo(1118792, 0);
    });

    it('should apply degradation factor to capacity', () => {
      const normalBreakdown = calculator.calculateYearlyRevenue(
        guangdongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay,
        1 // No degradation
      );

      const degradedBreakdown = calculator.calculateYearlyRevenue(
        guangdongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay,
        0.98 // 2% degradation
      );

      // Only arbitrage revenue degrades (demand response stays the same)
      // Normal: 925056 (arbitrage) + 200000 (demand) = 1125056
      // Degraded: 925056 * 0.98 + 200000 = 1106554.88
      expect(degradedBreakdown.peakValleyArbitrage).toBeCloseTo(normalBreakdown.peakValleyArbitrage * 0.98, 3);
      expect(degradedBreakdown.demandResponse).toBe(normalBreakdown.demandResponse); // Unchanged
      expect(degradedBreakdown.total).toBeCloseTo(1106555, 0);
    });
  });

  describe('calculateLifetimeRevenue', () => {
    it('should calculate 10-year revenue with degradation', () => {
      const result = calculator.calculateLifetimeRevenue(
        guangdongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay,
        testParams.degradationRate,
        10
      );

      expect(result.annualRevenues.length).toBe(10);
      expect(result.annualBreakdown.length).toBe(10);

      // Year 0: no degradation
      expect(result.annualRevenues[0]).toBeCloseTo(1125056, 0);

      // Year 1: 2% degradation on arbitrage only
      // 925056 * 0.98 + 200000 = 1106554.88
      expect(result.annualRevenues[1]).toBeCloseTo(1106555, 0);

      // Year 9: 2% ^ 9 = 0.8337 degradation on arbitrage only
      // 925056 * (0.98)^9 + 200000 = 938012.92 + 200000 = 971263
      expect(result.annualRevenues[9]).toBeCloseTo(971263, 0);

      // First year breakdown should be available
      expect(result.firstYearBreakdown.total).toBeCloseTo(1125056, 0);
    });

    it('should handle zero degradation', () => {
      const result = calculator.calculateLifetimeRevenue(
        guangdongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay,
        0, // No degradation
        10
      );

      // All years should have same revenue
      for (let i = 0; i < 10; i++) {
        expect(result.annualRevenues[i]).toBeCloseTo(result.annualRevenues[0], 5);
      }
    });

    it('should support custom project lifetime', () => {
      const result5Years = calculator.calculateLifetimeRevenue(
        guangdongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay,
        testParams.degradationRate,
        5
      );

      expect(result5Years.annualRevenues.length).toBe(5);

      const result20Years = calculator.calculateLifetimeRevenue(
        guangdongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay,
        testParams.degradationRate,
        20
      );

      expect(result20Years.annualRevenues.length).toBe(20);
    });
  });

  describe('revenue comparison across provinces', () => {
    it('should compare revenue potential across provinces', () => {
      const guangdongResult = calculator.calculateLifetimeRevenue(
        guangdongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay,
        testParams.degradationRate,
        10
      );

      const shandongResult = calculator.calculateLifetimeRevenue(
        shandongProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay,
        testParams.degradationRate,
        10
      );

      const zhejiangResult = calculator.calculateLifetimeRevenue(
        zhejiangProvince,
        testParams.capacity,
        testParams.power,
        testParams.efficiency,
        testParams.dod,
        testParams.cyclesPerDay,
        testParams.degradationRate,
        10
      );

      // Zhejiang should have highest first year revenue (highest spread + discharge-based compensation)
      expect(zhejiangResult.firstYearBreakdown.total).toBeGreaterThan(
        guangdongResult.firstYearBreakdown.total
      );

      // Guangdong and Shandong have similar but not identical revenue
      // Guangdong: higher spread but no capacity compensation
      // Shandong: lower spread but has capacity + auxiliary services
      const gdTotal = guangdongResult.firstYearBreakdown.total;
      const sdTotal = shandongResult.firstYearBreakdown.total;
      // They should be within 10% of each other
      expect(Math.abs(gdTotal - sdTotal) / Math.max(gdTotal, sdTotal)).toBeLessThan(0.1);

      console.log('Guangdong first year:', guangdongResult.firstYearBreakdown.total);
      console.log('Shandong first year:', shandongResult.firstYearBreakdown.total);
      console.log('Zhejiang first year:', zhejiangResult.firstYearBreakdown.total);
    });
  });
});
