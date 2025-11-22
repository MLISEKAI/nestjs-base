import { SetMetadata } from '@nestjs/common';
import { RateLimitConfig } from '../../interfaces';

export const RATE_LIMIT_KEY = 'rate_limit';
export const RATE_LIMIT_CONFIG = 'rate_limit_config';

/**
 * Enable rate limiting for this endpoint
 * @param config Rate limit configuration
 * @example
 * @UserRateLimit({ limit: 10, ttl: 60000 }) // 10 requests per minute
 */
export const UserRateLimit = (config: RateLimitConfig) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(RATE_LIMIT_KEY, true)(target, propertyKey, descriptor);
    SetMetadata(RATE_LIMIT_CONFIG, config)(target, propertyKey, descriptor);
  };
};

/**
 * Predefined rate limit configs
 */
export const RateLimitPresets = {
  /** 10 requests per minute */
  STRICT: { limit: 10, ttl: 60000 },
  /** 30 requests per minute */
  NORMAL: { limit: 30, ttl: 60000 },
  /** 60 requests per minute */
  RELAXED: { limit: 60, ttl: 60000 },
  /** 100 requests per hour */
  HOURLY: { limit: 100, ttl: 3600000 },
  /** 5 requests per minute (for sensitive operations) */
  SENSITIVE: { limit: 5, ttl: 60000 },
} as const;
