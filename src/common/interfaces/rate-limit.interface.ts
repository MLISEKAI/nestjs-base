/**
 * RateLimitConfig - Interface cho rate limit configuration
 *
 * Lưu ý:
 * - limit: Số requests cho phép trong time window
 * - ttl: Time window (milliseconds) - thời gian reset counter
 */
export interface RateLimitConfig {
  /** Số requests cho phép trong time window */
  readonly limit: number;
  /** Time window (milliseconds) - thời gian reset counter */
  readonly ttl: number;
}

/**
 * RateLimitResult - Interface cho rate limit check result
 *
 * Lưu ý:
 * - allowed: Request có được phép không
 * - remaining: Số requests còn lại trong time window
 * - resetTime: Thời điểm reset counter
 * - retryAfter: Số giây cần đợi trước khi retry (optional, chỉ có khi bị rate limit)
 */
export interface RateLimitResult {
  /** Request có được phép không */
  readonly allowed: boolean;
  /** Số requests còn lại trong time window */
  readonly remaining: number;
  /** Thời điểm reset counter */
  readonly resetTime: Date;
  /** Số giây cần đợi trước khi retry (optional, chỉ có khi bị rate limit) */
  readonly retryAfter?: number;
}
