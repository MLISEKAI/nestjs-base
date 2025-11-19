import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

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

@Injectable()
export class UserRateLimitService {
  private readonly logger = new Logger(UserRateLimitService.name);
  // In-memory fallback nếu Redis không available
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private readonly cacheService: CacheService) {
    // Cleanup memory store mỗi phút
    setInterval(() => this.cleanupMemoryStore(), 60000);
  }

  /**
   * Check rate limit for a user
   */
  async checkRateLimit(
    userId: string,
    endpoint: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const key = this.getKey(userId, endpoint);
    const now = Date.now();
    const resetTime = new Date(now + config.ttl);

    try {
      // Try Redis first
      const cached = await this.cacheService.get<{ count: number; resetTime: number }>(key);

      if (cached !== null) {
        // Check if window expired
        if (cached.resetTime < now) {
          // Reset counter
          await this.cacheService.set(key, { count: 1, resetTime: now + config.ttl }, config.ttl);
          return {
            allowed: true,
            remaining: config.limit - 1,
            resetTime,
          };
        }

        // Check if limit exceeded
        if (cached.count >= config.limit) {
          const retryAfter = Math.ceil((cached.resetTime - now) / 1000);
          return {
            allowed: false,
            remaining: 0,
            resetTime: new Date(cached.resetTime),
            retryAfter,
          };
        }

        // Increment counter
        const newCount = cached.count + 1;
        await this.cacheService.set(
          key,
          { count: newCount, resetTime: cached.resetTime },
          config.ttl,
        );

        return {
          allowed: true,
          remaining: config.limit - newCount,
          resetTime: new Date(cached.resetTime),
        };
      } else {
        // First request in window
        await this.cacheService.set(key, { count: 1, resetTime: now + config.ttl }, config.ttl);
        return {
          allowed: true,
          remaining: config.limit - 1,
          resetTime,
        };
      }
    } catch (error) {
      // Fallback to memory store if Redis fails
      return this.checkRateLimitMemory(userId, endpoint, config);
    }
  }

  /**
   * Fallback to memory store
   */
  private checkRateLimitMemory(
    userId: string,
    endpoint: string,
    config: RateLimitConfig,
  ): RateLimitResult {
    const key = this.getKey(userId, endpoint);
    const now = Date.now();
    const resetTime = new Date(now + config.ttl);

    const stored = this.memoryStore.get(key);

    if (!stored || stored.resetTime < now) {
      // First request or window expired
      this.memoryStore.set(key, { count: 1, resetTime: now + config.ttl });
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetTime,
      };
    }

    if (stored.count >= config.limit) {
      const retryAfter = Math.ceil((stored.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(stored.resetTime),
        retryAfter,
      };
    }

    // Increment
    stored.count++;
    this.memoryStore.set(key, stored);

    return {
      allowed: true,
      remaining: config.limit - stored.count,
      resetTime: new Date(stored.resetTime),
    };
  }

  /**
   * Reset rate limit for a user
   */
  async resetRateLimit(userId: string, endpoint: string): Promise<void> {
    const key = this.getKey(userId, endpoint);
    await this.cacheService.del(key);
    this.memoryStore.delete(key);
  }

  /**
   * Get rate limit status for a user
   */
  async getRateLimitStatus(
    userId: string,
    endpoint: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const key = this.getKey(userId, endpoint);
    const now = Date.now();

    try {
      const cached = await this.cacheService.get<{ count: number; resetTime: number }>(key);

      if (cached !== null && cached.resetTime >= now) {
        return {
          allowed: cached.count < config.limit,
          remaining: Math.max(0, config.limit - cached.count),
          resetTime: new Date(cached.resetTime),
        };
      }
    } catch (error) {
      // Fallback to memory
      const stored = this.memoryStore.get(key);
      if (stored && stored.resetTime >= now) {
        return {
          allowed: stored.count < config.limit,
          remaining: Math.max(0, config.limit - stored.count),
          resetTime: new Date(stored.resetTime),
        };
      }
    }

    return {
      allowed: true,
      remaining: config.limit,
      resetTime: new Date(now + config.ttl),
    };
  }

  /**
   * Generate cache key
   */
  private getKey(userId: string, endpoint: string): string {
    return `rate_limit:user:${userId}:${endpoint}`;
  }

  /**
   * Cleanup expired entries from memory store
   */
  private cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryStore.entries()) {
      if (value.resetTime < now) {
        this.memoryStore.delete(key);
      }
    }
  }
}
