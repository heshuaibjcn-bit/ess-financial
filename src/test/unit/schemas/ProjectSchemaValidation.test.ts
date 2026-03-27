/**
 * Tests for Project Schema Validation
 *
 * Tests cover:
 * - Input validation
 * - Cross-field validation
 * - Business logic rules
 * - Edge cases and error messages
 */

import { describe, it, expect } from 'vitest';
import {
  ProjectInputSchema,
  ProjectInputSchemaRefined,
  SystemSizeSchema,
  CostsSchema,
  FinancingSchema,
  OperatingParamsSchema,
  OperatingCostsSchema,
  ScenarioInputSchema,
} from '@/domain/schemas/ProjectSchema';

describe('ProjectInputSchema', () => {
  const validProjectInput = {
    province: 'guangdong',
    systemSize: {
      capacity: 2.0,
      duration: 2,
    },
    costs: {
      batteryCostPerKwh: 1200,
      pcsCostPerKw: 300,
      emsCost: 100000,
      installationCostPerKw: 150,
      gridConnectionCost: 200000,
      landCost: 0,
      developmentCost: 150000,
      permittingCost: 50000,
      contingencyPercent: 0.05,
    },
    operatingParams: {
      systemEfficiency: 0.88,
      depthOfDischarge: 0.9,
      cyclesPerDay: 1.5,
      degradationRate: 0.02,
      availabilityPercent: 0.97,
    },
    operatingCosts: {
      operationsStaffCost: 500000,
      managementCost: 300000,
      technicalSupportCost: 200000,
      officeRent: 100000,
      officeExpenses: 50000,
      regularMaintenanceCost: 200000,
      preventiveMaintenanceCost: 80000,
      equipmentInsurance: 100000,
      liabilityInsurance: 50000,
      propertyInsurance: 30000,
      licenseFee: 50000,
      regulatoryFee: 20000,
      trainingCost: 30000,
      utilitiesCost: 20000,
      vatRate: 0.06,
      surtaxRate: 0.12,
      corporateTaxRate: 0.25,
      salesExpenses: 303818,
      landLeaseCost: 100000,
    },
    projectName: 'Test Project',
    description: 'A test project for validation',
  };

  it('should validate a correct project input', () => {
    const result = ProjectInputSchema.safeParse(validProjectInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid province', () => {
    const invalidInput = {
      ...validProjectInput,
      province: 'invalid-province',
    };

    const result = ProjectInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject capacity > 100 MW', () => {
    const invalidInput = {
      ...validProjectInput,
      systemSize: {
        capacity: 150, // Too large
        duration: 2,
      },
    };

    const result = ProjectInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject battery cost > 5000 ¥/kWh', () => {
    const invalidInput = {
      ...validProjectInput,
      costs: {
        ...validProjectInput.costs,
        batteryCostPerKwh: 6000, // Too expensive
      },
    };

    const result = ProjectInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject negative system efficiency', () => {
    const invalidInput = {
      ...validProjectInput,
      operatingParams: {
        ...validProjectInput.operatingParams,
        systemEfficiency: -0.1, // Negative
      },
    };

    const result = ProjectInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject equity ratio > 100%', () => {
    const invalidInput = {
      ...validProjectInput,
      financing: {
        hasLoan: true,
        equityRatio: 1.5, // > 100%
      },
    };

    const result = ProjectInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should accept optional financing field', () => {
    const inputWithoutFinancing = {
      ...validProjectInput,
      financing: undefined,
    };

    const result = ProjectInputSchema.safeParse(inputWithoutFinancing);
    expect(result.success).toBe(true);
  });

  it('should validate cross-field: DOD should not exceed system efficiency', () => {
    const invalidInput = {
      ...validProjectInput,
      operatingParams: {
        systemEfficiency: 0.8,
        depthOfDischarge: 0.95, // Higher than efficiency
        cyclesPerDay: 1.5,
        degradationRate: 0.02,
        availabilityPercent: 0.97,
      },
    };

    const result = ProjectInputSchemaRefined.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe('SystemSizeSchema', () => {
  it('should use default values', () => {
    const result = SystemSizeSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capacity).toBe(2.0);
      expect(result.data.duration).toBe(2);
    }
  });

  it('should reject negative capacity', () => {
    const result = SystemSizeSchema.safeParse({
      capacity: -1,
      duration: 2,
    });
    expect(result.success).toBe(false);
  });
});

describe('CostsSchema', () => {
  it('should validate cost ranges', () => {
    const costs = {
      batteryCostPerKwh: 1500,
      pcsCostPerKw: 400,
      emsCost: 150000,
      installationCostPerKw: 200,
      gridConnectionCost: 300000,
      landCost: 100000,
      developmentCost: 200000,
      permittingCost: 80000,
      contingencyPercent: 0.08,
    };

    const result = CostsSchema.safeParse(costs);
    expect(result.success).toBe(true);
  });

  it('should use default values', () => {
    const result = CostsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.batteryCostPerKwh).toBe(1200);
      expect(result.data.pcsCostPerKw).toBe(300);
    }
  });
});

describe('FinancingSchema', () => {
  it('should validate loan financing', () => {
    const financing = {
      hasLoan: true,
      equityRatio: 0.3,
      loanRatio: 0.7,
      interestRate: 0.045,
      loanTerm: 10,
      taxHolidayYears: 6,
    };

    const result = FinancingSchema.safeParse(financing);
    expect(result.success).toBe(true);
  });

  it('should validate 100% equity financing', () => {
    const financing = {
      hasLoan: false,
      equityRatio: 1.0,
      taxHolidayYears: 6,
    };

    const result = FinancingSchema.safeParse(financing);
    expect(result.success).toBe(true);
  });
});

describe('OperatingParamsSchema', () => {
  it('should validate operating parameters', () => {
    const params = {
      systemEfficiency: 0.90,
      depthOfDischarge: 0.92,
      cyclesPerDay: 1.8,
      degradationRate: 0.015,
      availabilityPercent: 0.98,
    };

    const result = OperatingParamsSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it('should reject degradation rate > 10%', () => {
    const params = {
      systemEfficiency: 0.88,
      depthOfDischarge: 0.9,
      cyclesPerDay: 1.5,
      degradationRate: 0.12, // Too high
      availabilityPercent: 0.97,
    };

    const result = OperatingParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });
});

describe('OperatingCostsSchema', () => {
  it('should validate operating costs', () => {
    const costs = {
      operationsStaffCost: 600000,
      managementCost: 350000,
      technicalSupportCost: 250000,
      officeRent: 120000,
      officeExpenses: 60000,
      regularMaintenanceCost: 250000,
      preventiveMaintenanceCost: 100000,
      equipmentInsurance: 120000,
      liabilityInsurance: 60000,
      propertyInsurance: 40000,
      licenseFee: 60000,
      regulatoryFee: 25000,
      trainingCost: 40000,
      utilitiesCost: 25000,
      vatRate: 0.06,
      surtaxRate: 0.12,
      corporateTaxRate: 0.25,
      salesExpenses: 350000,
      landLeaseCost: 120000,
    };

    const result = OperatingCostsSchema.safeParse(costs);
    expect(result.success).toBe(true);
  });

  it('should use sensible defaults', () => {
    const result = OperatingCostsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.operationsStaffCost).toBe(500000);
      expect(result.data.vatRate).toBe(0.06);
    }
  });
});

describe('ScenarioInputSchema', () => {
  it('should validate scenario input', () => {
    const scenario = {
      variable: 'batteryCost' as const,
      change: 0.1, // +10%
    };

    const result = ScenarioInputSchema.safeParse(scenario);
    expect(result.success).toBe(true);
  });

  it('should use default change value', () => {
    const scenario = {
      variable: 'peakPrice' as const,
    };

    const result = ScenarioInputSchema.safeParse(scenario);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.change).toBe(0.1);
    }
  });

  it('should reject change > 50%', () => {
    const scenario = {
      variable: 'systemEfficiency' as const,
      change: 0.6, // Too large
    };

    const result = ScenarioInputSchema.safeParse(scenario);
    expect(result.success).toBe(false);
  });

  it('should reject change < -50%', () => {
    const scenario = {
      variable: 'compensationRate' as const,
      change: -0.6, // Too small
    };

    const result = ScenarioInputSchema.safeParse(scenario);
    expect(result.success).toBe(false);
  });
});
