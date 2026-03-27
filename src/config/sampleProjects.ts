/**
 * Sample project data for quick filling
 *
 * Provides realistic example data for different scenarios
 */

import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

/**
 * Sample project configurations
 */
export const SAMPLE_PROJECTS: Record<string, Omit<ProjectInput, 'id'>> = {
  // 基础示例 - 广东省2MW/2MWh储能项目
  basic: {
    province: '广东省',
    systemSize: {
      capacity: 2, // 2 MWh
      power: 1, // 1 MW
      duration: 2, // 2 hours
    },
    costStructure: {
      batteryCost: 1200,
      pcsCost: 300,
      emsCost: 100000,
      installationCost: 150,
      gridConnectionCost: 200000,
      landCost: 0,
      developmentCost: 150000,
      permitCost: 50000,
      contingencyPercent: 0.05,
    },
    operatingParameters: {
      systemEfficiency: 0.88,
      depthOfDischarge: 0.9,
      dailyCycles: 1.5,
      annualDegradationRate: 0.02,
      availability: 0.97,
    },
    operatingCosts: {
      staffSalary: 500000,
      managementFee: 300000,
      technicalSupportFee: 200000,
      officeRent: 100000,
      officeExpenses: 50000,
      regularMaintenance: 200000,
      preventiveMaintenance: 80000,
      equipmentInsurance: 100000,
      liabilityInsurance: 50000,
      propertyInsurance: 30000,
      licenseFee: 50000,
      regulatoryFee: 20000,
      trainingFee: 30000,
      utilities: 20000,
      landRent: 100000,
      salesTaxRate: 0.06,
      surchargeRate: 0.12,
      corporateTaxRate: 0.25,
    },
    financing: {
      hasLoan: false,
      loanAmount: 0,
      loanInterestRate: 0.04,
      loanTerm: 10,
    },
  },

  // 优化示例 - 浙江3MW/4MWh高收益项目
  optimized: {
    province: '浙江省',
    systemSize: {
      capacity: 4,
      power: 3,
      duration: 4,
    },
    costStructure: {
      batteryCost: 1100, // 更低的电池成本
      pcsCost: 280,
      emsCost: 80000,
      installationCost: 120,
      gridConnectionCost: 150000,
      landCost: 0,
      developmentCost: 120000,
      permitCost: 40000,
      contingencyPercent: 0.03,
    },
    operatingParameters: {
      systemEfficiency: 0.92, // 更高效率
      depthOfDischarge: 0.95,
      dailyCycles: 2.0, // 更多循环
      annualDegradationRate: 0.015,
      availability: 0.98,
    },
    operatingCosts: {
      staffSalary: 600000,
      managementFee: 350000,
      technicalSupportFee: 250000,
      officeRent: 120000,
      officeExpenses: 60000,
      regularMaintenance: 250000,
      preventiveMaintenance: 100000,
      equipmentInsurance: 120000,
      liabilityInsurance: 60000,
      propertyInsurance: 35000,
      licenseFee: 60000,
      regulatoryFee: 25000,
      trainingFee: 35000,
      utilities: 25000,
      landRent: 120000,
      salesTaxRate: 0.06,
      surchargeRate: 0.12,
      corporateTaxRate: 0.25,
    },
    financing: {
      hasLoan: true,
      loanAmount: 2000000,
      loanInterestRate: 0.035,
      loanTerm: 8,
    },
  },

  // 保守示例 - 小规模低风险项目
  conservative: {
    province: '江苏省',
    systemSize: {
      capacity: 1,
      power: 0.5,
      duration: 2,
    },
    costStructure: {
      batteryCost: 1500, // 更高质量但成本更高
      pcsCost: 400,
      emsCost: 150000,
      installationCost: 200,
      gridConnectionCost: 300000,
      landCost: 50000,
      developmentCost: 200000,
      permitCost: 80000,
      contingencyPercent: 0.1, // 更高的应急费用
    },
    operatingParameters: {
      systemEfficiency: 0.85,
      depthOfDischarge: 0.8, // 更保守的DOD
      dailyCycles: 1.0,
      annualDegradationRate: 0.03,
      availability: 0.95,
    },
    operatingCosts: {
      staffSalary: 400000,
      managementFee: 250000,
      technicalSupportFee: 150000,
      officeRent: 80000,
      officeExpenses: 40000,
      regularMaintenance: 300000, // 更高的维护预算
      preventiveMaintenance: 150000,
      equipmentInsurance: 150000,
      liabilityInsurance: 80000,
      propertyInsurance: 50000,
      licenseFee: 60000,
      regulatoryFee: 30000,
      trainingFee: 40000,
      utilities: 30000,
      landRent: 150000,
      salesTaxRate: 0.06,
      surchargeRate: 0.12,
      corporateTaxRate: 0.25,
    },
    financing: {
      hasLoan: false,
      loanAmount: 0,
      loanInterestRate: 0.04,
      loanTerm: 10,
    },
  },

  // 激进示例 - 大规模高回报项目
  aggressive: {
    province: '山东省',
    systemSize: {
      capacity: 10,
      power: 5,
      duration: 2,
    },
    costStructure: {
      batteryCost: 1000, // 激进的低成本假设
      pcsCost: 250,
      emsCost: 60000,
      installationCost: 100,
      gridConnectionCost: 100000,
      landCost: 0,
      developmentCost: 100000,
      permitCost: 30000,
      contingencyPercent: 0.02,
    },
    operatingParameters: {
      systemEfficiency: 0.95, // 乐观的效率
      depthOfDischarge: 0.98,
      dailyCycles: 2.5, // 高频使用
      annualDegradationRate: 0.01,
      availability: 0.99,
    },
    operatingCosts: {
      staffSalary: 800000,
      managementFee: 500000,
      technicalSupportFee: 300000,
      officeRent: 150000,
      officeExpenses: 80000,
      regularMaintenance: 200000,
      preventiveMaintenance: 80000,
      equipmentInsurance: 80000,
      liabilityInsurance: 40000,
      propertyInsurance: 25000,
      licenseFee: 40000,
      regulatoryFee: 15000,
      trainingFee: 25000,
      utilities: 15000,
      landRent: 80000,
      salesTaxRate: 0.06,
      surchargeRate: 0.12,
      corporateTaxRate: 0.15, // 假设税收优惠
    },
    financing: {
      hasLoan: true,
      loanAmount: 10000000,
      loanInterestRate: 0.03,
      loanTerm: 15,
    },
  },
};

/**
 * Get sample project by key
 */
export function getSampleProject(key: keyof typeof SAMPLE_PROJECTS): ProjectInput {
  return {
    id: `sample-${key}-${Date.now()}`,
    ...SAMPLE_PROJECTS[key],
  };
}

/**
 * Get all sample project keys with descriptions
 */
export const SAMPLE_PROJECT_DESCRIPTIONS = {
  basic: {
    name: '基础示例',
    description: '广东省2MW/2MWh储能项目',
    irr: '约9%',
    risk: '中等',
  },
  optimized: {
    name: '优化示例',
    description: '浙江省3MW/4MWh高收益项目',
    irr: '约12%',
    risk: '中等',
  },
  conservative: {
    name: '保守示例',
    description: '江苏省0.5MW/1MWh低风险项目',
    irr: '约6%',
    risk: '较低',
  },
  aggressive: {
    name: '激进示例',
    description: '山东省5MW/10MWh高回报项目',
    irr: '约15%',
    risk: '较高',
  },
};
