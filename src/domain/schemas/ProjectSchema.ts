import { z } from 'zod';

/**
 * 31 Chinese provinces/regions for energy storage policy data
 */
export const PROVINCES = [
  'guangdong', 'shandong', 'shanghai', 'zhejiang', 'jiangsu', 'anhui', 'hunan',
  'hubei', 'henan', 'jiangxi', 'beijing', 'tianjin', 'hebei', 'shanxi',
  'neimenggu', 'liaoning', 'jilin', 'heilongjiang', 'shaanxi', 'gansu', 'qinghai',
  'ningxia', 'xinjiang', 'sichuan', 'chongqing', 'yunnan', 'guizhou', 'xizang',
  'guangxi', 'hainan', 'fujian',
] as const;

export type Province = (typeof PROVINCES)[number];

/**
 * Technology types for energy storage systems
 */
export const TECHNOLOGY_TYPES = ['lithium-ion', 'lead-acid', 'flow-battery', 'sodium-ion'] as const;
export type TechnologyType = (typeof TECHNOLOGY_TYPES)[number];

/**
 * Application types (customer categories)
 */
export const APPLICATION_TYPES = ['industrial', 'commercial', 'data-center', 'charging-station', 'zero-carbon-park'] as const;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];

/**
 * System size configuration
 */
export const SystemSizeSchema = z.object({
  capacity: z.number()
    .positive('Capacity must be positive (MW)')
    .max(100, 'Capacity cannot exceed 100 MW')
    .default(2.0),
  duration: z.number()
    .positive('Duration must be positive (hours)')
    .max(8, 'Duration cannot exceed 8 hours')
    .default(2),
});

export type SystemSize = z.infer<typeof SystemSizeSchema>;

/**
 * Cost breakdown structure
 */
export const CostsSchema = z.object({
  batteryCostPerKwh: z.number()
    .positive('Battery cost must be positive (¥/kWh)')
    .max(5000, 'Battery cost seems too high (>5000 ¥/kWh)')
    .default(1200),
  pcsCostPerKw: z.number()
    .positive('PCS cost must be positive (¥/kW)')
    .max(1000, 'PCS cost seems too high (>1000 ¥/kW)')
    .default(300),
  emsCost: z.number()
    .nonnegative('EMS cost cannot be negative (¥)')
    .max(1000000, 'EMS cost seems too high')
    .default(100000),
  installationCostPerKw: z.number()
    .nonnegative('Installation cost cannot be negative (¥/kW)')
    .max(500, 'Installation cost seems too high (>500 ¥/kW)')
    .default(150),
  gridConnectionCost: z.number()
    .nonnegative('Grid connection cost cannot be negative (¥)')
    .max(1000000, 'Grid connection cost seems too high')
    .default(200000),
  landCost: z.number()
    .nonnegative('Land cost cannot be negative (¥)')
    .default(0),
  developmentCost: z.number()
    .nonnegative('Development cost cannot be negative (¥)')
    .max(1000000, 'Development cost seems too high')
    .default(150000),
  permittingCost: z.number()
    .nonnegative('Permitting cost cannot be negative (¥)')
    .max(500000, 'Permitting cost seems too high')
    .default(50000),
  contingencyPercent: z.number()
    .min(0, 'Contingency cannot be negative')
    .max(0.3, 'Contingency seems too high (>30%)')
    .default(0.05),
});

export type Costs = z.infer<typeof CostsSchema>;

/**
 * Financing structure
 */
export const FinancingSchema = z.object({
  hasLoan: z.boolean()
    .default(false),
  // Equity ratio (0-100%) - percentage of self-funded investment
  equityRatio: z.number()
    .min(0, 'Equity ratio cannot be negative')
    .max(1, 'Equity ratio cannot exceed 100%')
    .default(1.0), // Default: 100% self-funded
  loanRatio: z.number()
    .min(0, 'Loan ratio cannot be negative')
    .max(0.9, 'Loan ratio cannot exceed 90%')
    .default(0.7)
    .optional(),
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(0.2, 'Interest rate cannot exceed 20% APR')
    .default(0.045)
    .optional(),
  loanTerm: z.number()
    .int('Loan term must be integer (years)')
    .min(1, 'Loan term must be at least 1 year')
    .max(20, 'Loan term cannot exceed 20 years')
    .default(10)
    .optional(),
  // Tax holiday: years before VAT/surcharges start (default: 6 years = start in year 7)
  taxHolidayYears: z.number()
    .int('Tax holiday years must be integer')
    .min(0, 'Tax holiday cannot be negative')
    .max(10, 'Tax holiday cannot exceed 10 years')
    .default(6),
});

export type Financing = z.infer<typeof FinancingSchema>;

/**
 * Operating parameters
 */
export const OperatingParamsSchema = z.object({
  systemEfficiency: z.number()
    .min(0, 'System efficiency cannot be negative')
    .max(1, 'System efficiency cannot exceed 100%')
    .default(0.88),
  depthOfDischarge: z.number()
    .min(0, 'DOD cannot be negative')
    .max(1, 'DOD cannot exceed 100% of battery capacity')
    .default(0.9),
  cyclesPerDay: z.number()
    .min(0.1, 'At least 0.1 cycles per day')
    .max(4, 'Cannot exceed 4 cycles per day')
    .default(1.5),
  degradationRate: z.number()
    .min(0, 'Degradation rate cannot be negative')
    .max(0.1, 'Degradation rate seems too high (>10% per year)')
    .default(0.02),
  availabilityPercent: z.number()
    .min(0, 'Availability cannot be negative')
    .max(1, 'Availability cannot exceed 100%')
    .default(0.97),
});

export type OperatingParams = z.infer<typeof OperatingParamsSchema>;

/**
 * Operating costs - Real business operation expenses
 * Annual recurring costs for running the储能project
 */
export const OperatingCostsSchema = z.object({
  // 人力成本
  operationsStaffCost: z.number()
    .nonnegative('Operations staff cost cannot be negative')
    .max(5000000, 'Operations staff cost seems too high (>500万/年)')
    .default(500000), // ¥50万/年 - 2名运维人员

  managementCost: z.number()
    .nonnegative('Management cost cannot be negative')
    .max(3000000, 'Management cost seems too high (>300万/年)')
    .default(300000), // ¥30万/年 - 兼职管理

  technicalSupportCost: z.number()
    .nonnegative('Technical support cost cannot be negative')
    .max(2000000, 'Technical support cost seems too high (>200万/年)')
    .default(200000), // ¥20万/年 - 技术支持

  // 办公成本
  officeRent: z.number()
    .nonnegative('Office rent cannot be negative')
    .max(1000000, 'Office rent seems too high (>100万/年)')
    .default(100000), // ¥10万/年

  officeExpenses: z.number()
    .nonnegative('Office expenses cannot be negative')
    .max(500000, 'Office expenses seem too high (>50万/年)')
    .default(50000), // ¥5万/年 - 办公用品、差旅等

  // 维护成本
  regularMaintenanceCost: z.number()
    .nonnegative('Regular maintenance cost cannot be negative')
    .max(1000000, 'Regular maintenance seems too high (>100万/年)')
    .default(200000), // ¥20万/年 - 定期检修

  preventiveMaintenanceCost: z.number()
    .nonnegative('Preventive maintenance cost cannot be negative')
    .max(500000, 'Preventive maintenance seems too high (>50万/年)')
    .default(80000), // ¥8万/年 - 预防性维护

  // 保险费用
  equipmentInsurance: z.number()
    .nonnegative('Equipment insurance cannot be negative')
    .max(500000, 'Equipment insurance seems too high (>50万/年)')
    .default(100000), // ¥10万/年 - 设备保险

  liabilityInsurance: z.number()
    .nonnegative('Liability insurance cannot be negative')
    .max(300000, 'Liability insurance seems too high (>30万/年)')
    .default(50000), // ¥5万/年 - 责任保险

  propertyInsurance: z.number()
    .nonnegative('Property insurance cannot be negative')
    .max(200000, 'Property insurance seems too high (>20万/年)')
    .default(30000), // ¥3万/年 - 财产保险

  // 其他运营费用
  licenseFee: z.number()
    .nonnegative('License fee cannot be negative')
    .max(200000, 'License fee seems too high (>20万/年)')
    .default(50000), // ¥5万/年 - 许可证年费

  regulatoryFee: z.number()
    .nonnegative('Regulatory fee cannot be negative')
    .max(100000, 'Regulatory fee seems too high (>10万/年)')
    .default(20000), // ¥2万/年 - 监管费用

  trainingCost: z.number()
    .nonnegative('Training cost cannot be negative')
    .max(200000, 'Training cost seems too high (>20万/年)')
    .default(30000), // ¥3万/年 - 培训

  utilitiesCost: z.number()
    .nonnegative('Utilities cost cannot be negative')
    .max(200000, 'Utilities cost seems too high (>20万/年)')
    .default(20000), // ¥2万/年 - 水电通讯

  // 税费（按年收入百分比或固定金额）
  vatRate: z.number()
    .min(0, 'VAT rate cannot be negative')
    .max(0.13, 'VAT rate cannot exceed 13%')
    .default(0.06), // 6% 增值税率（现代服务业）

  surtaxRate: z.number()
    .min(0, 'Surtax rate cannot be negative')
    .max(0.15, 'Surtax rate cannot exceed 15%')
    .default(0.12), // 12% 城建税及教育费附加

  corporateTaxRate: z.number()
    .min(0, 'Corporate tax rate cannot be negative')
    .max(0.25, 'Corporate tax rate cannot exceed 25%')
    .default(0.25), // 25% 企业所得税

  // 销售费用 - Fixed annual operating costs (from verified model)
  salesExpenses: z.number()
    .nonnegative('Sales expenses cannot be negative')
    .max(500000, 'Sales expenses seem too high (>50万/年)')
    .default(303818), // ¥30.38万/年 - 销售费用

  landLeaseCost: z.number()
    .nonnegative('Land lease cost cannot be negative')
    .max(2000000, 'Land lease seems too high (>200万/年)')
    .default(100000), // ¥10万/年 - 土地租金（如果未一次性购买）
});

export type OperatingCosts = z.infer<typeof OperatingCostsSchema>;

/**
 * Complete project input schema
 */
export const ProjectInputSchema = z.object({
  province: z.enum(PROVINCES, {
    errorMap: () => ({ message: 'Invalid province. Must be one of the 31 supported regions.' }),
  }),
  systemSize: SystemSizeSchema,
  costs: CostsSchema,
  financing: FinancingSchema.optional().default({}),
  operatingParams: OperatingParamsSchema,
  operatingCosts: OperatingCostsSchema.optional().default({}),
  projectName: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name is too long')
    .optional(),
  description: z.string()
    .max(1000, 'Description is too long')
    .optional(),
});

export type ProjectInput = z.infer<typeof ProjectInputSchema>;

/**
 * Scenario parameter for sensitivity analysis
 */
export const ScenarioInputSchema = z.object({
  variable: z.enum([
    'batteryCost',
    'pcsCost',
    'systemEfficiency',
    'peakPrice',
    'valleyPrice',
    'compensationRate',
  ]),
  change: z.number()
    .min(-0.5, 'Change cannot be less than -50%')
    .max(0.5, 'Change cannot exceed +50%')
    .default(0.1),
});

export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;

/**
 * Cross-field validation: Ensure total installed cost doesn't exceed reasonable bounds
 */
export const ProjectInputSchemaRefined = ProjectInputSchema.refine((data) => {
  // Calculate total installed cost per Wh
  const totalCostPerWh = Object.values(data.costs).reduce((sum, val) => sum + val, 0);

  // Check if total cost is within reasonable bounds (0.5 - 5 ¥/Wh)
  if (totalCostPerWh < 0.3) {
    return false;
  }
  if (totalCostPerWh > 8) {
    return false;
  }

  // Check if DOD is reasonable relative to system efficiency
  // Support both old (dod) and new (depthOfDischarge) field names
  const dod = 'depthOfDischarge' in data.operatingParams
    ? data.operatingParams.depthOfDischarge
    : (data.operatingParams as any).dod;

  if (dod > data.operatingParams.systemEfficiency) {
    return false;
  }

  return true;
}, {
  message: 'Project configuration is invalid',
  path: ['costs', 'operatingParams'],
});

export type ProjectInputRefined = z.infer<typeof ProjectInputSchemaRefined>;
