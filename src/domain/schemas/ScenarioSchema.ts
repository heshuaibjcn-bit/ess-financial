import { z } from 'zod';
import type { CalculationResult } from './CalculationResultSchema';

/**
 * Scenario Variable Types
 */
export const SCENARIO_VARIABLES = [
  'batteryCost',
  'pcsCost',
  'systemEfficiency',
  'peakPrice',
  'valleyPrice',
  'compensationRate',
  'cyclesPerDay',
  'degradationRate',
  'interestRate',
] as const;

export type ScenarioVariable = typeof SCENARIO_VARIABLES[number];

/**
 * Scenario Input Schema
 */
export const ScenarioInputSchema = z.object({
  variable: z.enum(SCENARIO_VARIABLES),
  change: z.number()
    .min(-0.5, 'Change cannot be less than -50%')
    .max(0.5, 'Change cannot exceed +50%')
    .default(0.1),
  label: z.string().optional(),
});

export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;

/**
 * Scenario Schema
 */
export const ScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  baseProjectId: z.string().min(1),
  modifiedInputs: z.array(ScenarioInputSchema).min(1),
  result: z.any(), // CalculationResult - using any to avoid circular dependency
  comparison: z.object({
    irrChange: z.number(),
    irrChangePercent: z.number(),
    npvChange: z.number(),
    npvChangePercent: z.number(),
    paybackPeriodChange: z.number(),
  }),
  createdAt: z.string().or(z.date()),
  createdBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type Scenario = z.infer<typeof ScenarioSchema>;

/**
 * One-way Sensitivity Schema
 */
export const OneWaySensitivitySchema = z.object({
  variable: z.enum(SCENARIO_VARIABLES),
  baseValue: z.number(),
  baseResult: z.object({
    irr: z.number(),
    npv: z.number(),
  }),
  scenarios: z.array(z.object({
    change: z.number(),
    value: z.number(),
    irr: z.number(),
    npv: z.number(),
    irrChange: z.number(),
    npvChange: z.number(),
  })),
  sensitivity: z.object({
    elasticityIRR: z.number(),
    elasticityNPV: z.number(),
    mostSensitive: z.boolean(),
  }),
});

export type OneWaySensitivity = z.infer<typeof OneWaySensitivitySchema>;

/**
 * Two-way Sensitivity Schema
 */
export const TwoWaySensitivitySchema = z.object({
  primaryVariable: z.enum(SCENARIO_VARIABLES),
  secondaryVariable: z.enum(SCENARIO_VARIABLES),
  irrMatrix: z.array(z.object({
    primaryValue: z.number(),
    secondaryValues: z.array(z.object({
      secondaryValue: z.number(),
      irr: z.number(),
    })),
  })),
  analysis: z.object({
    bestCase: z.object({
      irr: z.number(),
      primaryValue: z.number(),
      secondaryValue: z.number(),
    }),
    worstCase: z.object({
      irr: z.number(),
      primaryValue: z.number(),
      secondaryValue: z.number(),
    }),
    correlation: z.number().min(-1).max(1),
  }),
});

export type TwoWaySensitivity = z.infer<typeof TwoWaySensitivitySchema>;

/**
 * Scenario Analysis Schema
 */
export const ScenarioAnalysisSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  baseCase: z.any(), // CalculationResult
  oneWaySensitivity: z.array(OneWaySensitivitySchema),
  twoWaySensitivity: z.array(TwoWaySensitivitySchema),
  insights: z.object({
    mostSensitiveVariable: z.enum(SCENARIO_VARIABLES),
    leastSensitiveVariable: z.enum(SCENARIO_VARIABLES),
    criticalThresholds: z.array(z.object({
      variable: z.enum(SCENARIO_VARIABLES),
      threshold: z.number(),
      impact: z.string(),
    })),
    recommendations: z.array(z.string()),
  }),
  generatedAt: z.string().or(z.date()),
  analysisVersion: z.string().min(1),
});

export type ScenarioAnalysis = z.infer<typeof ScenarioAnalysisSchema>;

/**
 * Scenario Comparison Schema
 */
export const ScenarioComparisonSchema = z.object({
  scenarios: z.array(ScenarioSchema),
  comparison: z.object({
    bestIRR: z.object({
      scenarioId: z.string(),
      irr: z.number(),
    }),
    worstIRR: z.object({
      scenarioId: z.string(),
      irr: z.number(),
    }),
    highestNPV: z.object({
      scenarioId: z.string(),
      npv: z.number(),
    }),
    lowestPayback: z.object({
      scenarioId: z.string(),
      period: z.number(),
    }),
  }),
  ranking: z.array(z.object({
    scenarioId: z.string(),
    rank: z.number().int().positive(),
    score: z.number(),
  })),
});

export type ScenarioComparison = z.infer<typeof ScenarioComparisonSchema>;

/**
 * Scenario Analysis Options Schema
 */
export const ScenarioAnalysisOptionsSchema = z.object({
  variables: z.array(z.enum(SCENARIO_VARIABLES)).optional(),
  includeTwoWay: z.boolean().default(false),
  changePoints: z.array(z.number().min(-0.5).max(0.5)).optional(),
});

export type ScenarioAnalysisOptions = z.infer<typeof ScenarioAnalysisOptionsSchema>;
