/**
 * Input Sanitization Service
 *
 * Provides sanitization for user inputs to prevent injection attacks.
 * Handles:
 * - SQL injection prevention
 * - XSS prevention
 * - Command injection prevention
 * - Path traversal prevention
 * - NoSQL injection prevention
 */

/**
 * Sanitization result
 */
export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  removedChars?: string[];
  reason?: string;
}

/**
 * Input sanitizer class
 */
export class InputSanitizer {
  // Dangerous patterns for different attack vectors
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(;|--|\/\*|\*\/)/g,
    /(\bOR\b.*=.*=)/gi,
    /(\bAND\b.*=.*=)/gi,
    /(\'|\"|`|;|--|\bexec\b)/gi,
  ];

  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<embed\b/gi,
    /<object\b/gi,
  ];

  private static readonly COMMAND_INJECTION_PATTERNS = [
    /(;|\||&|\$\(|\`)/g,
    /(\/\s*\w+)/g, // Commands like /bin/sh
    /\b(eval|exec|system|passthru|shell_exec)\b/gi,
  ];

  private static readonly PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\./g,
    /%2e%2e/gi,
    /~\//g,
  ];

  private static readonly NOSQL_INJECTION_PATTERNS = [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$in/gi,
    /\$or/gi,
  ];

  /**
   * Sanitize a string input for SQL injection
   */
  static sanitizeForSQL(input: string): SanitizationResult {
    let sanitized = input;
    const removedChars: string[] = [];
    let wasModified = false;

    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        wasModified = true;
        removedChars.push(...matches);
        // Remove dangerous patterns
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // Also escape single quotes
    if (sanitized.includes("'")) {
      wasModified = true;
      sanitized = sanitized.replace(/'/g, "''");
    }

    return {
      sanitized: sanitized.trim(),
      wasModified,
      removedChars: wasModified ? removedChars : undefined,
      reason: wasModified ? 'SQL injection patterns removed' : undefined,
    };
  }

  /**
   * Sanitize HTML input to prevent XSS
   */
  static sanitizeForHTML(input: string): SanitizationResult {
    let sanitized = input;
    const removedChars: string[] = [];
    let wasModified = false;

    // Remove script tags and event handlers
    for (const pattern of this.XSS_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        wasModified = true;
        removedChars.push(...matches);
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // Escape HTML special characters
    const htmlEscapeMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };

    for (const [char, escape] of Object.entries(htmlEscapeMap)) {
      if (sanitized.includes(char)) {
        wasModified = true;
        sanitized = sanitized.replaceAll(char, escape);
      }
    }

    return {
      sanitized: sanitized.trim(),
      wasModified,
      removedChars: wasModified ? removedChars : undefined,
      reason: wasModified ? 'XSS patterns removed and HTML escaped' : undefined,
    };
  }

  /**
   * Sanitize for command injection
   */
  static sanitizeForCommand(input: string): SanitizationResult {
    let sanitized = input;
    const removedChars: string[] = [];
    let wasModified = false;

    for (const pattern of this.COMMAND_INJECTION_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        wasModified = true;
        removedChars.push(...matches);
        sanitized = sanitized.replace(pattern, '');
      }
    }

    return {
      sanitized: sanitized.trim(),
      wasModified,
      removedChars: wasModified ? removedChars : undefined,
      reason: wasModified ? 'Command injection patterns removed' : undefined,
    };
  }

  /**
   * Sanitize file paths to prevent directory traversal
   */
  static sanitizeFilePath(input: string): SanitizationResult {
    let sanitized = input;
    const removedChars: string[] = [];
    let wasModified = false;

    for (const pattern of this.PATH_TRAVERSAL_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        wasModified = true;
        removedChars.push(...matches);
        sanitized = sanitized.replace(pattern, '');
      }
    }

    return {
      sanitized: sanitized.trim(),
      wasModified,
      removedChars: wasModified ? removedChars : undefined,
      reason: wasModified ? 'Path traversal patterns removed' : undefined,
    };
  }

  /**
   * Sanitize for NoSQL injection
   */
  static sanitizeForNoSQL(input: string): SanitizationResult {
    let sanitized = input;
    const removedChars: string[] = [];
    let wasModified = false;

    for (const pattern of this.NOSQL_INJECTION_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        wasModified = true;
        removedChars.push(...matches);
        sanitized = sanitized.replace(pattern, '');
      }
    }

    return {
      sanitized: sanitized.trim(),
      wasModified,
      removedChars: wasModified ? removedChars : undefined,
      reason: wasModified ? 'NoSQL injection patterns removed' : undefined,
    };
  }

  /**
   * Comprehensive sanitization (all protections)
   */
  static sanitize(input: string, options?: {
    preventSQL?: boolean;
    preventXSS?: boolean;
    preventCommandInjection?: boolean;
    preventPathTraversal?: boolean;
    preventNoSQL?: boolean;
  }): SanitizationResult {
    const opts = {
      preventSQL: true,
      preventXSS: true,
      preventCommandInjection: true,
      preventPathTraversal: true,
      preventNoSQL: true,
      ...options,
    };

    let sanitized = input;
    let wasModified = false;
    const allRemovedChars: string[] = [];
    const reasons: string[] = [];

    if (opts.preventSQL) {
      const result = this.sanitizeForSQL(sanitized);
      sanitized = result.sanitized;
      if (result.wasModified) {
        wasModified = true;
        allRemovedChars.push(...(result.removedChars || []));
        reasons.push(result.reason || '');
      }
    }

    if (opts.preventXSS) {
      const result = this.sanitizeForHTML(sanitized);
      sanitized = result.sanitized;
      if (result.wasModified) {
        wasModified = true;
        allRemovedChars.push(...(result.removedChars || []));
        reasons.push(result.reason || '');
      }
    }

    if (opts.preventCommandInjection) {
      const result = this.sanitizeForCommand(sanitized);
      sanitized = result.sanitized;
      if (result.wasModified) {
        wasModified = true;
        allRemovedChars.push(...(result.removedChars || []));
        reasons.push(result.reason || '');
      }
    }

    if (opts.preventPathTraversal) {
      const result = this.sanitizeFilePath(sanitized);
      sanitized = result.sanitized;
      if (result.wasModified) {
        wasModified = true;
        allRemovedChars.push(...(result.removedChars || []));
        reasons.push(result.reason || '');
      }
    }

    if (opts.preventNoSQL) {
      const result = this.sanitizeForNoSQL(sanitized);
      sanitized = result.sanitized;
      if (result.wasModified) {
        wasModified = true;
        allRemovedChars.push(...(result.removedChars || []));
        reasons.push(result.reason || '');
      }
    }

    return {
      sanitized,
      wasModified,
      removedChars: wasModified ? allRemovedChars : undefined,
      reason: wasModified ? reasons.join(', ') : undefined,
    };
  }

  /**
   * Sanitize number input (remove non-numeric chars except decimal point and minus)
   */
  static sanitizeNumber(input: string): SanitizationResult {
    const sanitized = input.replace(/[^\d.-]/g, '');
    const wasModified = sanitized !== input;

    return {
      sanitized,
      wasModified,
      reason: wasModified ? 'Non-numeric characters removed' : undefined,
    };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize project name
   */
  static sanitizeProjectName(name: string): SanitizationResult {
    // Remove dangerous characters but keep letters, numbers, spaces, hyphens, underscores
    const sanitized = name.replace(/[^\p{L}\p{N}\s\-_]/gu, '');
    const wasModified = sanitized !== name;

    return {
      sanitized: sanitized.trim(),
      wasModified,
      reason: wasModified ? 'Special characters removed' : undefined,
    };
  }

  /**
   * Validate and sanitize province code
   */
  static sanitizeProvinceCode(code: string): SanitizationResult {
    // Only allow lowercase letters and hyphens
    const sanitized = code.toLowerCase().replace(/[^a-z-]/g, '');
    const wasModified = sanitized !== code;

    return {
      sanitized,
      wasModified,
      reason: wasModified ? 'Invalid characters removed' : undefined,
    };
  }
}
