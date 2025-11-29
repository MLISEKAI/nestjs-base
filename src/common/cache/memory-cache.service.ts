import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

/**
 * MemoryCacheService - In-memory cache layer using LRU
 * 
 * Chức năng:
 * - Cache hot data trong memory để giảm Redis latency
 * - Tự động evict data cũ khi đầy (LRU - Least Recently Used)
 * - Rất nhanh (<1ms) so với Redis (~50-100ms)
 * 
 * Use cases:
 * - User search results (hot data)
 * - User connections (frequently accessed)
 * - Profile data (high read frequency)
 */
@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private cache: LRUCache<string, any>;

  constructor() {
    this.cache = new LRUCache({
      max: 1000, // Tối đa 1000 items
      ttl: 1000 * 60 * 5, // TTL 5 phút
      updateAgeOnGet: true, // Reset TTL khi get
      updateAgeOnHas: false,
    });

    this.logger.log('Memory cache initialized with max 1000 items, TTL 5 minutes');
  }

  /**
   * Get value from memory cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  /**
   * Set value to memory cache
   */
  set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
  }

  /**
   * Delete key from memory cache
   */
  del(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete keys matching pattern
   */
  delPattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keys = Array.from(this.cache.keys());
    
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
    };
  }
}
