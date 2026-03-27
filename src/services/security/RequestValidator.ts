/**
 * Request Validation Middleware
 *
 * Provides middleware for validating incoming requests.
 * Features:
 * - Schema validation using Zod
 * - Input sanitization
 * - Rate limiting integration
 * - Detailed error responses
 */

import type { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { InputSanitizer, type SanitizationResult } from './InputSanitizer';
import { RateLimiter, type RateLimitConfig } from './RateLimiter';

/**
 * Validation error response
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  path?: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  sanitized?: Record<string, SanitizationResult>;
}

/**
 * Middleware configuration
 */
export interface ValidationMiddlewareConfig {
  schema?: z.ZodSchema<any>;
  sanitizeFields?: string[];
  rateLimit?: RateLimitConfig;
  skipValidation?: (req: Request) => boolean;
}

/**
 * Create validation middleware
 */
export function createValidationMiddleware(config: ValidationMiddlewareConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip validation if condition matches
    if (config.skipValidation && config.skipValidation(req)) {
      return next();
    }

    const validationResults: ValidationResult = {
      valid: true,
    };

    // Sanitize specified fields
    if (config.sanitizeFields) {
      validationResults.sanitized = {};

      for (const field of config.sanitizeFields) {
        const value = getNestedValue(req.body, field);

        if (typeof value === 'string') {
          const sanitized = InputSanitizer.sanitize(value);
          validationResults.sanitized[field] = sanitized;

          // Store sanitized value back
          setNestedValue(req.body, field, sanitized.sanitized);

          // Log if sanitization modified the input
          if (sanitized.wasModified) {
            console.warn(`Sanitized input for field "${field}":`, {
              original: value,
              sanitized: sanitized.sanitized,
              reason: sanitized.reason,
            });
          }
        }
      }
    }

    // Validate against schema
    if (config.schema) {
      try {
        // Parse and validate request body
        const validated = config.schema.parse(req.body);

        // Replace body with validated data
        req.body = validated;
      } catch (error) {
        validationResults.valid = false;
        validationResults.errors = extractZodErrors(error);

        return res.status(400).json({
          error: 'Validation failed',
          errors: validationResults.errors,
        });
      }
    }

    // Attach validation results to request
    (req as any).validationResults = validationResults;

    next();
  };
}

/**
 * Extract errors from Zod validation error
 */
function extractZodErrors(error: any): ValidationError[] {
  if (!error || !error.errors) {
    return [{
      field: 'unknown',
      message: 'Unknown validation error',
      code: 'UNKNOWN_ERROR',
    }];
  }

  return error.errors.map((err: any) => ({
    field: err.path.join('.') || 'unknown',
    message: err.message,
    code: err.code,
    path: err.path,
  }));
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
}

/**
 * Create project input validation middleware
 */
export function createProjectValidationMiddleware() {
  return createValidationMiddleware({
    sanitizeFields: [
      'projectName',
      'description',
      'province',
    ],
    // Schema will be added when called
    schema: undefined,
  });
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  // Province validation
  province: {
    validProvinces: [
      'guangdong', 'shandong', 'shanghai', 'zhejiang', 'jiangsu', 'anhui', 'hunan',
      'hubei', 'henan', 'jiangxi', 'beijing', 'tianjin', 'hebei', 'shanxi',
      'neimenggu', 'liaoning', 'jilin', 'heilongjiang', 'shaanxi', 'gansu', 'qinghai',
      'ningxia', 'xinjiang', 'sichuan', 'chongqing', 'yunnan', 'guizhou', 'xizang',
      'guangxi', 'hainan', 'fujian',
    ],
  },

  // System size validation
  systemSize: {
    maxCapacity: 100, // MW
    maxDuration: 8, // hours
  },

  // Cost validation
  costs: {
    maxBatteryCost: 5000, // ¥/kWh
    maxPCSCost: 1000, // ¥/kW
  },

  // Operating params validation
  operatingParams: {
    minEfficiency: 0,
    maxEfficiency: 1,
    minDOD: 0,
    maxDOD: 1,
    minCyclesPerDay: 0.1,
    maxCyclesPerDay: 4,
    minDegradation: 0,
    maxDegradation: 0.1,
  },

  // Financing validation
  financing: {
    minEquityRatio: 0,
    maxEquityRatio: 1,
    minLoanRatio: 0,
    maxLoanRatio: 0.9,
    minInterestRate: 0,
    maxInterestRate: 0.2,
    minLoanTerm: 1,
    maxLoanTerm: 20,
  },
};

/**
 * Validate province code
 */
export function validateProvinceCode(code: string): boolean {
  return ValidationSchemas.province.validProvinces.includes(code.toLowerCase());
}

/**
 * Validate system capacity
 */
export function validateSystemCapacity(capacity: number): boolean {
  return capacity > 0 && capacity <= ValidationSchemas.systemSize.maxCapacity;
}

/**
 * Validate system duration
 */
export function validateSystemDuration(duration: number): boolean {
  return duration > 0 && duration <= ValidationSchemas.systemSize.maxDuration;
}

/**
 * Validate battery cost
 */
export function validateBatteryCost(cost: number): boolean {
  return cost > 0 && cost <= ValidationSchemas.costs.maxBatteryCost;
}

/**
 * Validate system efficiency
 */
export function validateSystemEfficiency(efficiency: number): boolean {
  return efficiency >= ValidationSchemas.operatingParams.minEfficiency &&
         efficiency <= ValidationSchemas.operatingParams.maxEfficiency;
}

/**
 * Validate depth of discharge
 */
export function validateDOD(dod: number): boolean {
  return dod >= ValidationSchemas.operatingParams.minDOD &&
         dod <= ValidationSchemas.operatingParams.maxDOD;
}

/**
 * Comprehensive validation for project input
 */
export function validateProjectInput(input: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate province
  if (input.province && !validateProvinceCode(input.province)) {
    errors.push({
      field: 'province',
      message: `Invalid province code: ${input.province}`,
      code: 'INVALID_PROVINCE',
    });
  }

  // Validate system size
  if (input.systemSize) {
    if (input.systemSize.capacity && !validateSystemCapacity(input.systemSize.capacity)) {
      errors.push({
        field: 'systemSize.capacity',
        message: `Capacity must be between 0 and ${ValidationSchemas.systemSize.maxCapacity} MW`,
        code: 'INVALID_CAPACITY',
      });
    }

    if (input.systemSize.duration && !validateSystemDuration(input.systemSize.duration)) {
      errors.push({
        field: 'systemSize.duration',
        message: `Duration must be between 0 and ${ValidationSchemas.systemSize.maxDuration} hours`,
        code: 'INVALID_DURATION',
      });
    }
  }

  // Validate costs
  if (input.costs) {
    if (input.costs.batteryCostPerKwh && !validateBatteryCost(input.costs.batteryCostPerKwh)) {
      errors.push({
        field: 'costs.batteryCostPerKwh',
        message: `Battery cost must be between 0 and ${ValidationSchemas.costs.maxBatteryCost} ¥/kWh`,
        code: 'INVALID_BATTERY_COST',
      });
    }
  }

  // Validate operating params
  if (input.operatingParams) {
    if (input.operatingParams.systemEfficiency !== undefined &&
        !validateSystemEfficiency(input.operatingParams.systemEfficiency)) {
      errors.push({
        field: 'operatingParams.systemEfficiency',
        message: 'System efficiency must be between 0 and 1',
        code: 'INVALID_EFFICIENCY',
      });
    }

    if (input.operatingParams.depthOfDischarge !== undefined &&
        !validateDOD(input.operatingParams.depthOfDischarge)) {
      errors.push({
        field: 'operatingParams.depthOfDischarge',
        message: 'Depth of discharge must be between 0 and 1',
        code: 'INVALID_DOD',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
