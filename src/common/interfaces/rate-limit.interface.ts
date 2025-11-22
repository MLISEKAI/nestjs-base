/**
 * Rate limit interfaces
 */
export interface RateLimitConfig {
  limit: number; // Số requests cho phép
  ttl: number; // Time window (milliseconds)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // Seconds until retry
}
