/**
 * RevenueCalculator - Calculate energy storage project revenue streams
 *
 * This service calculates 4 major revenue sources:
 * 1. Peak-Valley Arbitrage (峰谷价差套利)
 * 2. Capacity Compensation (容量补偿)
 * 3. Demand Response (需求响应)
 * 4. Auxiliary Services (辅助服务)
 */

import type { ProvinceData } from '../schemas/ProvinceSchema';
import type { ProjectInput } from '../schemas/ProjectSchema';

/**
 * Annual revenue breakdown by source
 */
export interface RevenueBreakdown {
  peakValleyArbitrage: number; // ¥/year
  capacityCompensation: number; // ¥/year
  demandResponse: number; // ¥/year
  auxiliaryServices: number; // ¥/year
  total: number; // ¥/year
}

/**
 * Revenue calculation result for multiple years
 */
export interface RevenueResult {
  annualRevenues: number[]; // Total revenue per year (¥/year)
  annualBreakdown: RevenueBreakdown[]; // Revenue breakdown per year
  firstYearBreakdown: RevenueBreakdown; // First year revenue breakdown
}

/**
 * Calculator for energy storage project revenues
 */
export class RevenueCalculator {
  /**
   * Calculate peak-valley arbitrage revenue
   *
   * Formula: (peakPrice - valleyPrice) * capacity * efficiency * DOD * cyclesPerDay * 365
   *
   * @param province - Province data with pricing info
   * @param capacity - System capacity (kWh)
   * @param efficiency - System efficiency (0-1)
   * @param dod - Depth of discharge (0-1)
   * @param cyclesPerDay - Number of charge/discharge cycles per day
   * @returns Annual arbitrage revenue (¥/year)
   */
  calculateArbitrage(
    province: ProvinceData,
    capacity: number,
    efficiency: number,
    dod: number,
    cyclesPerDay: number
  ): number {
    const { peakPrice, valleyPrice } = province.pricing;
    const spread = peakPrice - valleyPrice;

    // Energy charged/discharged per cycle
    const energyPerCycle = capacity * dod * efficiency;

    // Annual revenue
    const annualRevenue = spread * energyPerCycle * cyclesPerDay * 365;

    return annualRevenue;
  }

  /**
   * Calculate capacity compensation revenue
   *
   * Depends on province policy type:
   * - none: No compensation
   * - discharge-based: Based on actual discharge (¥/kWh)
   * - capacity-based: Based on installed capacity (¥/kW/year)
   *
   * @param province - Province data with compensation policy
   * @param capacity - System capacity (kWh)
   * @param power - System power (kW)
   * @param efficiency - System efficiency (0-1)
   * @param dod - Depth of discharge (0-1)
   * @param cyclesPerDay - Number of cycles per day
   * @returns Annual capacity compensation (¥/year)
   */
  calculateCapacityCompensation(
    province: ProvinceData,
    capacity: number,
    power: number,
    efficiency: number,
    dod: number,
    cyclesPerDay: number
  ): number {
    const { capacityCompensation } = province;

    if (!capacityCompensation.available || capacityCompensation.type === 'none') {
      return 0;
    }

    // Check if rate is defined
    const rate = capacityCompensation.rate ?? 0;

    switch (capacityCompensation.type) {
      case 'discharge-based':
        // Compensation based on actual discharge (¥/kWh)
        const annualDischarge = capacity * dod * cyclesPerDay * 365;
        return annualDischarge * rate;

      case 'capacity-based':
        // Compensation based on installed power (¥/kW/year)
        // Or capacity in some provinces
        return power * rate;

      default:
        return 0;
    }
  }

  /**
   * Calculate demand response revenue
   *
   * Formula: peakCompensation * power * maxAnnualCalls
   *
   * @param province - Province data with demand response policy
   * @param power - System power (kW)
   * @returns Annual demand response revenue (¥/year)
   */
  calculateDemandResponse(
    province: ProvinceData,
    power: number
  ): number {
    const { demandResponse } = province;

    if (!demandResponse.available) {
      return 0;
    }

    const peakCompensation = demandResponse.peakCompensation ?? 0;
    const maxAnnualCalls = demandResponse.maxAnnualCalls ?? 0;

    // Assume average response duration of 2 hours per call
    const avgHoursPerCall = 2;

    return peakCompensation * power * avgHoursPerCall * maxAnnualCalls;
  }

  /**
   * Calculate auxiliary services revenue
   *
   * Includes peaking, frequency regulation, etc.
   *
   * @param province - Province data with auxiliary services policy
   * @param power - System power (kW)
   * @returns Annual auxiliary services revenue (¥/year)
   */
  calculateAuxiliaryServices(
    province: ProvinceData,
    power: number
  ): number {
    const { auxiliaryServices } = province;

    if (!auxiliaryServices.available) {
      return 0;
    }

    let totalRevenue = 0;

    // Peaking service
    if (auxiliaryServices.peaking) {
      const { price, availableHours } = auxiliaryServices.peaking;
      if (price && availableHours) {
        totalRevenue += price * power * availableHours;
      }
    }

    // Frequency regulation (can be added later)
    if (auxiliaryServices.frequencyRegulation) {
      // Frequency regulation revenue calculation
      // This is more complex and depends on market rules
      // For now, return 0
    }

    return totalRevenue;
  }

  /**
   * Calculate revenue breakdown for a single year
   *
   * @param province - Province data
   * @param capacity - System capacity (kWh)
   * @param power - System power (kW)
   * @param efficiency - System efficiency (0-1)
   * @param dod - Depth of discharge (0-1)
   * @param cyclesPerDay - Number of cycles per day
   * @param degradationFactor - Capacity degradation factor (0-1, 1 = no degradation)
   * @returns Revenue breakdown for the year
   */
  calculateYearlyRevenue(
    province: ProvinceData,
    capacity: number,
    power: number,
    efficiency: number,
    dod: number,
    cyclesPerDay: number,
    degradationFactor: number = 1
  ): RevenueBreakdown {
    // Apply degradation to capacity
    const effectiveCapacity = capacity * degradationFactor;

    // Calculate each revenue source
    const peakValleyArbitrage = this.calculateArbitrage(
      province,
      effectiveCapacity,
      efficiency,
      dod,
      cyclesPerDay
    );

    const capacityCompensation = this.calculateCapacityCompensation(
      province,
      effectiveCapacity,
      power,
      efficiency,
      dod,
      cyclesPerDay
    );

    const demandResponse = this.calculateDemandResponse(
      province,
      power
    );

    const auxiliaryServices = this.calculateAuxiliaryServices(
      province,
      power
    );

    const total = peakValleyArbitrage + capacityCompensation + demandResponse + auxiliaryServices;

    return {
      peakValleyArbitrage,
      capacityCompensation,
      demandResponse,
      auxiliaryServices,
      total,
    };
  }

  /**
   * Calculate revenue for project lifetime (10 years)
   *
   * @param province - Province data
   * @param capacity - System capacity (kWh)
   * @param power - System power (kW)
   * @param efficiency - System efficiency (0-1)
   * @param dod - Depth of discharge (0-1)
   * @param cyclesPerDay - Number of cycles per day
   * @param degradationRate - Annual degradation rate (0-1)
   * @param years - Project lifetime in years (default: 10)
   * @returns Revenue result with annual breakdowns
   */
  calculateLifetimeRevenue(
    province: ProvinceData,
    capacity: number,
    power: number,
    efficiency: number,
    dod: number,
    cyclesPerDay: number,
    degradationRate: number,
    years: number = 10
  ): RevenueResult {
    const annualRevenues: number[] = [];
    const annualBreakdown: RevenueBreakdown[] = [];

    for (let year = 0; year < years; year++) {
      // Calculate degradation factor: (1 - degradationRate)^year
      const degradationFactor = Math.pow(1 - degradationRate, year);

      const breakdown = this.calculateYearlyRevenue(
        province,
        capacity,
        power,
        efficiency,
        dod,
        cyclesPerDay,
        degradationFactor
      );

      annualRevenues.push(breakdown.total);
      annualBreakdown.push(breakdown);
    }

    return {
      annualRevenues,
      annualBreakdown,
      firstYearBreakdown: annualBreakdown[0],
    };
  }

  /**
   * Convenience method to calculate from ProjectInput
   *
   * @param input - Project input parameters
   * @param province - Province data
   * @param years - Project lifetime in years
   * @returns Revenue result
   */
  calculateFromProjectInput(
    input: ProjectInput,
    province: ProvinceData,
    years: number = 10
  ): RevenueResult {
    const { systemSize, operatingParams } = input;

    return this.calculateLifetimeRevenue(
      province,
      systemSize.capacity,
      systemSize.power,
      operatingParams.systemEfficiency,
      operatingParams.dod,
      operatingParams.cyclesPerDay,
      operatingParams.degradationRate,
      years
    );
  }
}

// Singleton instance
export const revenueCalculator = new RevenueCalculator();
