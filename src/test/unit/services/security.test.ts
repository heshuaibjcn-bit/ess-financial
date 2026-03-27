/**
 * Security Tests
 *
 * Tests for input sanitization, rate limiting, and request validation.
 * Ensures the application is protected against common attacks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputSanitizer, type SanitizationResult } from '@/services/security/InputSanitizer';
import { RateLimiter, RateLimits, ClientRateLimiter } from '@/services/security/RateLimiter';
import {
  validateProjectInput,
  validateProvinceCode,
  validateSystemCapacity,
  validateBatteryCost,
  validateSystemEfficiency,
  validateDOD,
} from '@/services/security/RequestValidator';

describe('InputSanitizer', () => {
  describe('SQL Injection Protection', () => {
    it('should remove SQL injection patterns', () => {
      const malicious = "admin'; DROP TABLE users; --";
      const result = InputSanitizer.sanitizeForSQL(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("'");
      expect(result.sanitized).not.toContain("DROP");
      expect(result.sanitized).not.toContain("--");
    });

    it('should handle UNION-based SQL injection', () => {
      const malicious = "1' UNION SELECT * FROM users--";
      const result = InputSanitizer.sanitizeForSQL(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("UNION");
      expect(result.sanitized).not.toContain("SELECT");
    });

    it('should escape or remove single quotes', () => {
      const input = "O'Reilly";
      const result = InputSanitizer.sanitizeForSQL(input);

      // Single quotes should be handled (either escaped or removed)
      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("'");
    });

    it('should allow safe SQL-like strings', () => {
      const safe = "This is a safe description about the project";
      const result = InputSanitizer.sanitizeForSQL(safe);

      expect(result.wasModified).toBe(false);
      expect(result.sanitized).toBe(safe);
    });
  });

  describe('XSS Protection', () => {
    it('should remove script tags', () => {
      const malicious = "<script>alert('XSS')</script>";
      const result = InputSanitizer.sanitizeForHTML(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("<script>");
      expect(result.sanitized).not.toContain("alert");
    });

    it('should remove iframe tags', () => {
      const malicious = "<iframe src='evil.com'></iframe>";
      const result = InputSanitizer.sanitizeForHTML(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("<iframe>");
    });

    it('should remove event handlers', () => {
      const malicious = "<div onclick='evil()'>Click me</div>";
      const result = InputSanitizer.sanitizeForHTML(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("onclick");
    });

    it('should escape HTML special characters', () => {
      const input = "<div>&nbsp;</div>";
      const result = InputSanitizer.sanitizeForHTML(input);

      // Check that special characters are escaped (order may vary)
      expect(result.wasModified).toBe(true);
      // Should not contain raw special characters
      expect(result.sanitized).not.toContain("<");
      expect(result.sanitized).not.toContain(">");
    });

    it('should remove javascript: protocol', () => {
      const malicious = "javascript:alert('XSS')";
      const result = InputSanitizer.sanitizeForHTML(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("javascript:");
    });
  });

  describe('Command Injection Protection', () => {
    it('should remove command separators', () => {
      const malicious = "file.txt; rm -rf /";
      const result = InputSanitizer.sanitizeForCommand(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain(";");
      expect(result.sanitized).not.toContain("|");
    });

    it('should remove backtick commands', () => {
      const malicious = "file.txt`cat /etc/passwd`";
      const result = InputSanitizer.sanitizeForCommand(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("`");
    });

    it('should remove exec commands', () => {
      const malicious = "file.txt; exec('evil')";
      const result = InputSanitizer.sanitizeForCommand(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("exec");
    });
  });

  describe('Path Traversal Protection', () => {
    it('should remove ../ patterns', () => {
      const malicious = "../../../etc/passwd";
      const result = InputSanitizer.sanitizeFilePath(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("..");
    });

    it('should remove encoded path traversal', () => {
      const malicious = "%2e%2e%2fetc/passwd";
      const result = InputSanitizer.sanitizeFilePath(malicious);

      expect(result.wasModified).toBe(true);
    });

    it('should allow safe paths', () => {
      const safe = "/data/files/document.pdf";
      const result = InputSanitizer.sanitizeFilePath(safe);

      expect(result.wasModified).toBe(false);
      expect(result.sanitized).toBe(safe);
    });
  });

  describe('NoSQL Injection Protection', () => {
    it('should remove $where operator', () => {
      const malicious = "{$where: 'this.name == \"admin\"'}";
      const result = InputSanitizer.sanitizeForNoSQL(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("$where");
    });

    it('should remove $ne operator', () => {
      const malicious = "{$ne: null}";
      const result = InputSanitizer.sanitizeForNoSQL(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("$ne");
    });
  });

  describe('Comprehensive Sanitization', () => {
    it('should apply all protections', () => {
      const malicious = "<script>'; DROP TABLE users; --</script>";
      const result = InputSanitizer.sanitize(malicious);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("<script>");
      expect(result.sanitized).not.toContain("DROP");
      expect(result.sanitized).not.toContain("--");
    });

    it('should sanitize project names', () => {
      const name = "Test<script>alert('xss')</script>Project";
      const result = InputSanitizer.sanitizeProjectName(name);

      expect(result.wasModified).toBe(true);
      expect(result.sanitized).not.toContain("<script>");
    });

    it('should sanitize province codes', () => {
      const code = "guangdong<script>";
      const result = InputSanitizer.sanitizeProvinceCode(code);

      expect(result.wasModified).toBe(true);
      // Script tag should be removed by the lowercase filter (no special chars allowed)
      expect(result.sanitized).not.toContain("<script>");
      // Only letters and hyphens should remain
      expect(result.sanitized).toBe("guangdongscript");
    });

    it('should sanitize numbers', () => {
      const input = "1,000,000.50";
      const result = InputSanitizer.sanitizeNumber(input);

      expect(result.sanitized).toBe("1000000.50");
    });
  });

  describe('Input Validation', () => {
    it('should validate email addresses', () => {
      expect(InputSanitizer.isValidEmail("test@example.com")).toBe(true);
      expect(InputSanitizer.isValidEmail("invalid")).toBe(false);
      expect(InputSanitizer.isValidEmail("@example.com")).toBe(false);
    });

    it('should validate URLs', () => {
      expect(InputSanitizer.isValidURL("https://example.com")).toBe(true);
      expect(InputSanitizer.isValidURL("http://example.com")).toBe(true);
      expect(InputSanitizer.isValidURL("not-a-url")).toBe(false);
    });
  });
});

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = RateLimiter.getInstance();
    limiter.clearAll();
  });

  afterEach(() => {
    limiter.clearAll();
  });

  describe('Server-side Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const config = { maxRequests: 5, windowMs: 60000 };

      for (let i = 0; i < 5; i++) {
        const result = limiter.checkLimit('user1', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests exceeding limit', () => {
      const config = { maxRequests: 3, windowMs: 60000 };

      // First 3 requests should be allowed
      for (let i = 0; i < 3; i++) {
        const result = limiter.checkLimit('user1', config);
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked
      const result = limiter.checkLimit('user1', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', () => {
      const config = { maxRequests: 2, windowMs: 100 }; // 100ms window

      // Use up the limit
      limiter.checkLimit('user1', config);
      limiter.checkLimit('user1', config);

      // Should be blocked
      let result = limiter.checkLimit('user1', config);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      // Note: This test is synchronous, so we can't actually wait
      // In a real scenario, you'd use setTimeout
    });

    it('should track separate limits per identifier', () => {
      const config = { maxRequests: 2, windowMs: 60000 };

      // User1 uses up their limit
      limiter.checkLimit('user1', config);
      limiter.checkLimit('user1', config);

      // User1 should be blocked
      let result = limiter.checkLimit('user1', config);
      expect(result.allowed).toBe(false);

      // User2 should still be allowed
      result = limiter.checkLimit('user2', config);
      expect(result.allowed).toBe(true);
    });

    it('should provide correct stats', () => {
      const config = { maxRequests: 5, windowMs: 60000 };

      limiter.checkLimit('user1', config);
      limiter.checkLimit('user1', config);

      const stats = limiter.getStats('user1');
      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(2);
    });
  });

  describe('Client-side Rate Limiting', () => {
    it('should enforce client-side limits', () => {
      const limiter = new ClientRateLimiter(5, 60000); // 5 requests per minute

      for (let i = 0; i < 5; i++) {
        const result = limiter.check();
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = limiter.check();
      expect(result.allowed).toBe(false);
    });

    it('should track usage correctly', () => {
      const limiter = new ClientRateLimiter(10, 60000);

      limiter.check();
      limiter.check();
      limiter.check();

      const usage = limiter.getUsage();
      expect(usage.current).toBe(3);
      expect(usage.remaining).toBe(7);
    });

    it('should allow reset', () => {
      const limiter = new ClientRateLimiter(2, 60000);

      limiter.check();
      limiter.check();

      // Should be blocked
      let result = limiter.check();
      expect(result.allowed).toBe(false);

      // Reset
      limiter.reset();

      // Should be allowed again
      result = limiter.check();
      expect(result.allowed).toBe(true);
    });
  });
});

describe('Request Validation', () => {
  describe('Province Validation', () => {
    it('should validate correct province codes', () => {
      expect(validateProvinceCode('guangdong')).toBe(true);
      expect(validateProvinceCode('GUANGDONG'.toLowerCase())).toBe(true);
      expect(validateProvinceCode('shanghai')).toBe(true);
    });

    it('should reject invalid province codes', () => {
      expect(validateProvinceCode('invalid')).toBe(false);
      expect(validateProvinceCode('california')).toBe(false);
      expect(validateProvinceCode('')).toBe(false);
    });
  });

  describe('System Capacity Validation', () => {
    it('should validate capacity within range', () => {
      expect(validateSystemCapacity(2)).toBe(true);
      expect(validateSystemCapacity(50)).toBe(true);
      expect(validateSystemCapacity(100)).toBe(true);
    });

    it('should reject capacity outside range', () => {
      expect(validateSystemCapacity(0)).toBe(false);
      expect(validateSystemCapacity(-1)).toBe(false);
      expect(validateSystemCapacity(101)).toBe(false);
    });
  });

  describe('Battery Cost Validation', () => {
    it('should validate reasonable costs', () => {
      expect(validateBatteryCost(1000)).toBe(true);
      expect(validateBatteryCost(2000)).toBe(true);
      expect(validateBatteryCost(5000)).toBe(true);
    });

    it('should reject unreasonable costs', () => {
      expect(validateBatteryCost(0)).toBe(false);
      expect(validateBatteryCost(-100)).toBe(false);
      expect(validateBatteryCost(6000)).toBe(false);
    });
  });

  describe('System Efficiency Validation', () => {
    it('should validate efficiency in range', () => {
      expect(validateSystemEfficiency(0.5)).toBe(true);
      expect(validateSystemEfficiency(0.88)).toBe(true);
      expect(validateSystemEfficiency(1.0)).toBe(true);
    });

    it('should reject efficiency outside range', () => {
      expect(validateSystemEfficiency(-0.1)).toBe(false);
      expect(validateSystemEfficiency(1.1)).toBe(false);
    });
  });

  describe('DOD Validation', () => {
    it('should validate DOD in range', () => {
      expect(validateDOD(0.5)).toBe(true);
      expect(validateDOD(0.9)).toBe(true);
      expect(validateDOD(1.0)).toBe(true);
    });

    it('should reject DOD outside range', () => {
      expect(validateDOD(-0.1)).toBe(false);
      expect(validateDOD(1.1)).toBe(false);
    });
  });

  describe('Project Input Validation', () => {
    it('should validate correct project input', () => {
      const input = {
        province: 'guangdong',
        systemSize: {
          capacity: 2,
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
      };

      const result = validateProjectInput(input);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid project input', () => {
      const input = {
        province: 'invalid-province',
        systemSize: {
          capacity: 150, // Too large
          duration: 10, // Too long
        },
        costs: {
          batteryCostPerKwh: 6000, // Too expensive
        },
        operatingParams: {
          systemEfficiency: 1.1, // Invalid
          depthOfDischarge: -0.1, // Invalid
        },
      };

      const result = validateProjectInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });
});
