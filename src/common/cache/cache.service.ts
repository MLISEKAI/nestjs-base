import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl = 3600; // 1 hour
  private isRedisConnected = false;
  private hasLoggedConnectionError = false;

  constructor(@InjectRedis() private readonly redis: Redis) {
    // Setup Redis event handlers
    this.redis.on('connect', () => {
      this.isRedisConnected = true;
      this.hasLoggedConnectionError = false; // Reset flag on successful connection
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.isRedisConnected = false;
      // Only log connection error once to avoid spam
      if (!this.hasLoggedConnectionError) {
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Connection')) {
          this.logger.warn(
            'Redis is not available. Cache will be disabled. To enable caching, start Redis server.',
          );
        } else {
          this.logger.warn('Redis connection error:', errorMsg);
        }
        this.hasLoggedConnectionError = true;
      }
    });

    this.redis.on('close', () => {
      this.isRedisConnected = false;
      // Don't log close events to avoid spam
    });

    // Don't try to connect immediately - let it connect on first use
    // This prevents connection spam on startup if Redis is not available
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisConnected) {
      return null; // Fail silently if Redis is not connected
    }
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      // Don't log connection errors repeatedly
      if (!error.message?.includes('ECONNREFUSED') && !error.message?.includes('Connection')) {
        this.logger.debug(`Cache get error for key ${key}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Set value to cache
   */
  async set(key: string, value: any, ttl: number = this.defaultTtl): Promise<void> {
    if (!this.isRedisConnected) {
      return; // Fail silently if Redis is not connected
    }
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      // Don't log connection errors repeatedly
      if (!error.message?.includes('ECONNREFUSED') && !error.message?.includes('Connection')) {
        this.logger.debug(`Cache set error for key ${key}:`, error.message);
      }
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTtl,
  ): Promise<T> {
    // Try to get from cache, but if Redis is not connected, skip cache
    if (this.isRedisConnected) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch from source
    const value = await fetchFn();

    // Try to cache, but don't fail if Redis is not connected
    if (this.isRedisConnected) {
      await this.set(key, value, ttl);
    }

    return value;
  }

  /**
   * Invalidate cache by pattern (useful for user-specific caches)
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.delPattern(`user:${userId}:*`);
    await this.delPattern(`profile:${userId}:*`);
  }

  /**
   * Invalidate all cache
   */
  async flushAll(): Promise<void> {
    try {
      await this.redis.flushall();
    } catch (error) {
      this.logger.error('Cache flush all error:', error);
    }
  }
}
