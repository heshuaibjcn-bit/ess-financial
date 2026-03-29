/**
 * Data Validator - Comprehensive Data Validation and Quality Monitoring
 *
 * Features:
 * - Field validation (required, format, range)
 * - Business rule validation
 * - Data quality scoring
 * - Anomaly detection
 * - Validation reporting
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'info' | 'warning';
}

export interface QualityReport {
  completeness: number; // 0-100
  accuracy: number; // 0-100
  timeliness: number; // 0-100
  consistency: number; // 0-100
  overallScore: number; // 0-100
  issues: string[];
  recommendations: string[];
}

/**
 * Base Validator Class
 */
export abstract class DataValidator<T> {
  abstract validate(data: T): ValidationResult;
  abstract checkQuality(data: T[]): QualityReport;

  /**
   * Validate required fields
   */
  protected validateRequiredFields(
    data: any,
    requiredFields: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of requiredFields) {
      const value = this.getNestedValue(data, field);

      if (value === undefined || value === null || value === '') {
        errors.push({
          field,
          message: `必填字段 "${field}" 不能为空`,
          code: 'REQUIRED_FIELD_MISSING',
          severity: 'error'
        });
      }
    }

    return errors;
  }

  /**
   * Validate field formats
   */
  protected validateFormats(
    data: any,
    formatRules: Record<string, RegExp>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [field, pattern] of Object.entries(formatRules)) {
      const value = this.getNestedValue(data, field);

      if (value !== undefined && value !== null && value !== '') {
        if (!pattern.test(String(value))) {
          errors.push({
            field,
            message: `字段 "${field}" 格式不正确`,
            code: 'INVALID_FORMAT',
            severity: 'error'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate field ranges
   */
  protected validateRanges(
    data: any,
    rangeRules: Record<string, { min?: number; max?: number }>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [field, rule] of Object.entries(rangeRules)) {
      const value = this.getNestedValue(data, field);

      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field,
            message: `字段 "${field}" 不能小于 ${rule.min}`,
            code: 'VALUE_TOO_SMALL',
            severity: 'error'
          });
        }

        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field,
            message: `字段 "${field}" 不能大于 ${rule.max}`,
            code: 'VALUE_TOO_LARGE',
            severity: 'error'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Calculate validation score
   */
  protected calculateScore(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    const errorWeight = 10;
    const warningWeight = 2;

    const totalPenalty =
      errors.length * errorWeight + warnings.length * warningWeight;

    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * Get nested object value by dot notation
   */
  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }
}

/**
 * Policy Data Validator
 */
export class PolicyDataValidator extends DataValidator<any> {
  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    errors.push(...this.validateRequiredFields(data, [
      'title',
      'category',
      'level',
      'publishDate'
    ]));

    // Format validation
    errors.push(...this.validateFormats(data, {
      'timeline.publishDate': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
      'source': /^https?:\/\//
    }));

    // Business rules
    if (data.level === 'national' && data.geographicScope?.provinces?.length > 0) {
      warnings.push({
        field: 'geographicScope.provinces',
        message: '国家级政策通常不应指定省份',
        code: 'NATIONAL_WITH_PROVINCES',
        severity: 'warning'
      });
    }

    if (!data.summary?.summary || data.summary.summary.length < 50) {
      warnings.push({
        field: 'summary.summary',
        message: '政策摘要过短，建议至少50个字符',
        code: 'SUMMARY_TOO_SHORT',
        severity: 'warning'
      });
    }

    const score = this.calculateScore(errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  checkQuality(policies: any[]): QualityReport {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Completeness check
    const completeness = this.checkCompleteness(policies, [
      'title',
      'category',
      'level',
      'timeline.publishDate',
      'summary.summary'
    ]);

    // Timeliness check
    const timeliness = this.checkTimeliness(policies, 30); // 30 days

    // Consistency check
    const consistency = this.checkConsistency(policies);

    // Accuracy check (based on validation scores)
    const accuracy = this.checkAccuracy(policies);

    // Generate issues and recommendations
    if (completeness < 80) {
      issues.push('部分政策数据缺少关键字段');
      recommendations.push('完善政策数据的必填字段');
    }

    if (timeliness < 60) {
      issues.push('政策数据更新不及时');
      recommendations.push('增加政策数据更新频率');
    }

    if (consistency < 80) {
      issues.push('政策数据存在不一致');
      recommendations.push('检查政策分类和级别的一致性');
    }

    const overallScore = (completeness + accuracy + timeliness + consistency) / 4;

    return {
      completeness,
      accuracy,
      timeliness,
      consistency,
      overallScore,
      issues,
      recommendations
    };
  }

  private checkCompleteness(data: any[], requiredFields: string[]): number {
    let totalFields = 0;
    let filledFields = 0;

    for (const item of data) {
      for (const field of requiredFields) {
        totalFields++;
        const value = this.getNestedValue(item, field);
        if (value !== undefined && value !== null && value !== '') {
          filledFields++;
        }
      }
    }

    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  }

  private checkTimeliness(data: any[], daysThreshold: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    const recentCount = data.filter(item => {
      const publishDate = new Date(item.timeline?.publishDate || 0);
      return publishDate >= cutoffDate;
    }).length;

    return data.length > 0 ? (recentCount / data.length) * 100 : 0;
  }

  private checkConsistency(data: any[]): number {
    let inconsistencies = 0;
    let checks = 0;

    for (const item of data) {
      // Check level-geography consistency
      checks++;
      if (item.level === 'national' && item.geographicScope?.provinces?.length > 0) {
        inconsistencies++;
      }

      // Check category-summary consistency
      checks++;
      const categoryKeywords: Record<string, string[]> = {
        tariff: ['电价', '价格', '峰谷'],
        subsidy: ['补贴', '奖励', '补助'],
        technical: ['技术', '标准', '规范'],
        market: ['市场', '交易', '竞价']
      };

      const keywords = categoryKeywords[item.category] || [];
      const hasKeyword = keywords.some((kw: string) =>
        item.summary?.summary?.includes(kw)
      );

      if (!hasKeyword && item.summary?.summary) {
        inconsistencies++;
      }
    }

    return checks > 0 ? ((checks - inconsistencies) / checks) * 100 : 100;
  }

  private checkAccuracy(data: any[]): number {
    let totalScore = 0;

    for (const item of data) {
      const validation = this.validate(item);
      totalScore += validation.score;
    }

    return data.length > 0 ? totalScore / data.length : 100;
  }
}

/**
 * Tariff Data Validator
 */
export class TariffDataValidator extends DataValidator<any> {
  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    errors.push(...this.validateRequiredFields(data, [
      'province',
      'priceType',
      'voltageLevel',
      'price'
    ]));

    // Format validation
    errors.push(...this.validateFormats(data, {
      'effectiveDate': /^\d{4}-\d{2}-\d{2}$/
    }));

    // Range validation
    errors.push(...this.validateRanges(data, {
      'price': { min: 0, max: 2 } // Max 2 RMB/kWh
    }));

    // Business rules
    if (data.priceType === 'peak' && data.priceType === 'valley') {
      warnings.push({
        field: 'priceType',
        message: '电价类型不应同时为峰时和谷时',
        code: 'INVALID_PRICE_TYPE',
        severity: 'warning'
      });
    }

    const score = this.calculateScore(errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  checkQuality(tariffs: any[]): QualityReport {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const completeness = this.checkCompleteness(tariffs, [
      'province',
      'priceType',
      'voltageLevel',
      'price',
      'effectiveDate'
    ]);

    const timeliness = this.checkTimeliness(tariffs, 90); // 90 days
    const consistency = this.checkConsistency(tariffs);
    const accuracy = this.checkAccuracy(tariffs);

    if (completeness < 90) {
      issues.push('部分电价数据缺少关键字段');
    }

    if (timeliness < 70) {
      issues.push('电价数据更新不及时');
      recommendations.push('确保电价数据至少每季度更新一次');
    }

    const overallScore = (completeness + accuracy + timeliness + consistency) / 4;

    return {
      completeness,
      accuracy,
      timeliness,
      consistency,
      overallScore,
      issues,
      recommendations
    };
  }

  private checkCompleteness(data: any[], requiredFields: string[]): number {
    let totalFields = 0;
    let filledFields = 0;

    for (const item of data) {
      for (const field of requiredFields) {
        totalFields++;
        const value = this.getNestedValue(item, field);
        if (value !== undefined && value !== null && value !== '') {
          filledFields++;
        }
      }
    }

    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  }

  private checkTimeliness(data: any[], daysThreshold: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    const recentCount = data.filter(item => {
      const effectiveDate = new Date(item.effectiveDate || 0);
      return effectiveDate >= cutoffDate;
    }).length;

    return data.length > 0 ? (recentCount / data.length) * 100 : 0;
  }

  private checkConsistency(data: any[]): number {
    let inconsistencies = 0;
    let checks = 0;

    // Check for duplicate entries
    const seen = new Set<string>();
    for (const item of data) {
      checks++;
      const key = `${item.province}-${item.priceType}-${item.voltageLevel}`;
      if (seen.has(key)) {
        inconsistencies++;
      }
      seen.add(key);
    }

    return checks > 0 ? ((checks - inconsistencies) / checks) * 100 : 100;
  }

  private checkAccuracy(data: any[]): number {
    let totalScore = 0;

    for (const item of data) {
      const validation = this.validate(item);
      totalScore += validation.score;
    }

    return data.length > 0 ? totalScore / data.length : 100;
  }
}

/**
 * Company Data Validator
 */
export class CompanyDataValidator extends DataValidator<any> {
  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    errors.push(...this.validateRequiredFields(data, [
      'name',
      'creditCode',
      'registrationDate'
    ]));

    // Format validation
    errors.push(...this.validateFormats(data, {
      'creditCode': /^[0-9A-Z]{18}$/, // 18-digit统一社会信用代码
      'registrationDate': /^\d{4}-\d{2}-\d{2}$/
    }));

    // Business rules
    const regDate = new Date(data.registrationDate);
    const now = new Date();
    if (regDate > now) {
      errors.push({
        field: 'registrationDate',
        message: '注册日期不能晚于当前日期',
        code: 'INVALID_REGISTRATION_DATE',
        severity: 'error'
      });
    }

    if (data.registeredCapital && data.registeredCapital < 0) {
      errors.push({
        field: 'registeredCapital',
        message: '注册资本不能为负数',
        code: 'INVALID_CAPITAL',
        severity: 'error'
      });
    }

    const score = this.calculateScore(errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  checkQuality(companies: any[]): QualityReport {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const completeness = this.checkCompleteness(companies, [
      'name',
      'creditCode',
      'registrationDate',
      'registeredCapital',
      'legalRepresentative'
    ]);

    const accuracy = this.checkAccuracy(companies);

    if (completeness < 80) {
      issues.push('部分企业数据缺少关键字段');
      recommendations.push('完善企业基本信息');
    }

    if (accuracy < 90) {
      issues.push('企业数据存在格式错误');
      recommendations.push('验证统一社会信用代码等关键字段');
    }

    return {
      completeness,
      accuracy,
      timeliness: 100, // Not applicable for company data
      consistency: 100, // Not applicable
      overallScore: (completeness + accuracy) / 2,
      issues,
      recommendations
    };
  }

  private checkCompleteness(data: any[], requiredFields: string[]): number {
    let totalFields = 0;
    let filledFields = 0;

    for (const item of data) {
      for (const field of requiredFields) {
        totalFields++;
        const value = this.getNestedValue(item, field);
        if (value !== undefined && value !== null && value !== '') {
          filledFields++;
        }
      }
    }

    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  }

  private checkAccuracy(data: any[]): number {
    let totalScore = 0;

    for (const item of data) {
      const validation = this.validate(item);
      totalScore += validation.score;
    }

    return data.length > 0 ? totalScore / data.length : 100;
  }
}
