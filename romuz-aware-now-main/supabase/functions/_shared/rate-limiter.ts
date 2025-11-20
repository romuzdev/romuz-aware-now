/**
 * ============================================================================
 * M23 - Rate Limiting Utility
 * Purpose: Prevent abuse and ensure fair resource usage
 * Strategy: In-memory rate limiting per user/tenant
 * ============================================================================
 */

// ============================================================================
// Rate Limit Configuration
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  keyPrefix: string;     // Prefix for rate limit key
}

export const RATE_LIMITS = {
  BACKUP_CREATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,           // 10 backups per hour
    keyPrefix: 'backup_create'
  },
  RESTORE_EXECUTE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,            // 5 restores per hour
    keyPrefix: 'restore_execute'
  },
  PITR_EXECUTE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,            // 3 PITR per hour
    keyPrefix: 'pitr_execute'
  },
  RECOVERY_TEST: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,           // 20 tests per hour
    keyPrefix: 'recovery_test'
  },
  DR_PLAN_CREATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,           // 10 plans per hour
    keyPrefix: 'dr_plan_create'
  }
} as const;

// ============================================================================
// In-Memory Rate Limiter
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private cleanupInterval: number;

  constructor() {
    this.store = new Map();
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   */
  async check(
    key: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const fullKey = `${config.keyPrefix}:${key}`;
    const entry = this.store.get(fullKey);

    // No entry or expired entry
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + config.windowMs;
      this.store.set(fullKey, {
        count: 1,
        resetAt
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt
      };
    }

    // Entry exists and not expired
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt
      };
    }

    // Increment count
    entry.count++;
    this.store.set(fullKey, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(key: string, config: RateLimitConfig): Promise<void> {
    const fullKey = `${config.keyPrefix}:${key}`;
    this.store.delete(fullKey);
  }

  /**
   * Get current rate limit status
   */
  async status(
    key: string,
    config: RateLimitConfig
  ): Promise<{ count: number; remaining: number; resetAt: number }> {
    const fullKey = `${config.keyPrefix}:${key}`;
    const entry = this.store.get(fullKey);
    const now = Date.now();

    if (!entry || now >= entry.resetAt) {
      return {
        count: 0,
        remaining: config.maxRequests,
        resetAt: now + config.windowMs
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetAt: entry.resetAt
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.store.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`[RateLimiter] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Destroy rate limiter and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// ============================================================================
// Public API
// ============================================================================

/**
 * Check rate limit for a request
 * @param identifier - User ID, Tenant ID, or IP address
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  return rateLimiter.check(identifier, config);
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  return rateLimiter.reset(identifier, config);
}

/**
 * Get rate limit status
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<{ count: number; remaining: number; resetAt: number }> {
  return rateLimiter.status(identifier, config);
}

/**
 * Helper to create rate limit error response
 */
export function createRateLimitError(
  resetAt: number,
  config: RateLimitConfig
): Response {
  const resetDate = new Date(resetAt);
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
      retryAfter,
      resetAt: resetDate.toISOString()
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetDate.toISOString()
      }
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: HeadersInit,
  result: { remaining: number; resetAt: number },
  config: RateLimitConfig
): HeadersInit {
  return {
    ...headers,
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString()
  };
}

// ============================================================================
// Storage Quota Checker
// ============================================================================

/**
 * Check if tenant has exceeded storage quota
 */
export async function checkStorageQuota(
  supabase: any,
  tenantId: string,
  additionalSizeBytes: number = 0
): Promise<{ allowed: boolean; currentUsage: number; limit: number; message?: string }> {
  try {
    // Get tenant's current storage usage
    const { data: backups, error } = await supabase
      .from('backup_jobs')
      .select('backup_size_bytes')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed');

    if (error) {
      console.error('Failed to check storage quota:', error);
      // Allow operation on error (fail-open)
      return { allowed: true, currentUsage: 0, limit: 0 };
    }

    const currentUsage = backups?.reduce(
      (sum: number, b: any) => sum + (b.backup_size_bytes || 0),
      0
    ) || 0;

    // Default limit: 100GB (can be made configurable per tenant)
    const limit = 100 * 1024 * 1024 * 1024; // 100GB in bytes
    const totalUsage = currentUsage + additionalSizeBytes;

    if (totalUsage > limit) {
      return {
        allowed: false,
        currentUsage,
        limit,
        message: `Storage quota exceeded. Current: ${formatBytes(currentUsage)}, Limit: ${formatBytes(limit)}`
      };
    }

    return {
      allowed: true,
      currentUsage,
      limit
    };
  } catch (error) {
    console.error('Storage quota check failed:', error);
    // Allow operation on error (fail-open)
    return { allowed: true, currentUsage: 0, limit: 0 };
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
