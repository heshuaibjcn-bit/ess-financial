/**
 * Rate Limiter Service
 *
 * Prevents DoS attacks by limiting request rates.
 * Features:
 * - Sliding window rate limiting
 * - Per-IP and per-user limits
 * - Configurable limits per endpoint
 * - Automatic cleanup of expired records
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number; // seconds until retry
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private store: Map<string, RateLimitRecord>;
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.store = new Map();
    // Cleanup expired records every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RateLimiter {
    if (!this.instance) {
      this.instance = new RateLimiter();
    }
    return this.instance;
  }

  /**
   * Check if request is allowed
   */
  checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(identifier);

    // No existing record
    if (!record || now > record.resetTime) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      };

      this.store.set(identifier, newRecord);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newRecord.resetTime,
      };
    }

    // Existing record within window
    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter,
      };
    }

    // Increment counter
    record.count++;
    this.store.set(identifier, record);

    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  resetLimit(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Get current stats for identifier
   */
  getStats(identifier: string): {
    count: number;
    resetTime: number;
    timeRemaining: number;
  } | null {
    const record = this.store.get(identifier);
    if (!record) {
      return null;
    }

    const now = Date.now();
    return {
      count: record.count,
      resetTime: record.resetTime,
      timeRemaining: Math.max(0, record.resetTime - now),
    };
  }

  /**
   * Cleanup expired records
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get all active records
   */
  getAllRecords(): Map<string, RateLimitRecord> {
    return new Map(this.store);
  }

  /**
   * Clear all records (for testing)
   */
  clearAll(): void {
    this.store.clear();
  }

  /**
   * Destroy cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Pre-configured rate limits for different endpoints
 */
export const RateLimits = {
  // API endpoints
  calculate: {
    maxRequests: 10,
    windowMs: 60000, // 10 requests per minute
  },
  saveProject: {
    maxRequests: 20,
    windowMs: 60000, // 20 requests per minute
  },
  export: {
    maxRequests: 5,
    windowMs: 60000, // 5 exports per minute
  },

  // Auth endpoints
  login: {
    maxRequests: 5,
    windowMs: 300000, // 5 requests per 5 minutes
  },
  register: {
    maxRequests: 3,
    windowMs: 3600000, // 3 requests per hour
  },

  // General
  default: {
    maxRequests: 100,
    windowMs: 60000, // 100 requests per minute
  },

  // Strict limits for expensive operations
  benchmark: {
    maxRequests: 3,
    windowMs: 60000, // 3 requests per minute
  },
  sensitivity: {
    maxRequests: 5,
    windowMs: 60000, // 5 requests per minute
  },
} as const;

/**
 * Express middleware for rate limiting
 */
export function createRateLimitMiddleware(
  getIdentifier: (req: any) => string,
  getLimitConfig: (req: any) => RateLimitConfig
) {
  const limiter = RateLimiter.getInstance();

  return async (req: any, res: any, next: any) => {
    const identifier = getIdentifier(req);
    const config = getLimitConfig(req);

    const result = limiter.checkLimit(identifier, config);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      });
    }

    next();
  };
}

/**
 * Rate limiter utility for client-side usage
 */
export class ClientRateLimiter {
  private limit: number;
  private window: number;
  private requests: number[] = [];

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  /**
   * Check if request is allowed
   */
  check(): RateLimitResult {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.window);

    if (this.requests.length >= this.limit) {
      // Rate limit exceeded
      const oldestRequest = this.requests[0];
      const retryAfter = Math.ceil((oldestRequest + this.window - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestRequest + this.window,
        retryAfter,
      };
    }

    // Add current request
    this.requests.push(now);

    return {
      allowed: true,
      remaining: this.limit - this.requests.length,
      resetTime: now + this.window,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }

  /**
   * Get current usage
   */
  getUsage(): {
    current: number;
    limit: number;
    remaining: number;
  } {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);

    return {
      current: this.requests.length,
      limit: this.limit,
      remaining: this.limit - this.requests.length,
    };
  }
}
