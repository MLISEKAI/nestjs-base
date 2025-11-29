import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { KeyCachingSystem, CacheInterface } from './dto/cache.dto';

/**
 * Adapter để migrate từ RedisCachingService cũ sang CacheService mới
 * Giữ nguyên API cũ nhưng sử dụng implementation mới từ src/common/cache
 * 
 * @deprecated Sử dụng CacheService từ src/common/cache thay thế
 * Adapter này chỉ để backward compatibility trong quá trình migration
 */
@Injectable()
export class RedisCachingService {
  private logger = new Logger(RedisCachingService.name);

  constructor(private readonly cacheService: CacheService) {}

  /**
   * @deprecated Use cacheService.set() instead
   */
  async setItem(key: KeyCachingSystem, value: any, seconds?: number): Promise<void> {
    try {
      // Thêm prefix NODE_ENV như implementation cũ
      const prefixedKey = `${process.env.NODE_ENV}:${key}`;
      await this.cacheService.set(prefixedKey, value, seconds);
    } catch (error: any) {
      this.logger.error(`❌ Fn setStore ERROR: ${error?.message}`);
    }
  }

  /**
   * @deprecated Use cacheService.get() instead
   */
  async getItem<T extends CacheInterface | any>(key: KeyCachingSystem): Promise<T | undefined> {
    try {
      // Thêm prefix NODE_ENV như implementation cũ
      const prefixedKey = `${process.env.NODE_ENV}:${key}`;
      const data = await this.cacheService.get<T>(prefixedKey);
      
      // Trả về undefined thay vì null để match API cũ
      return data ?? undefined;
    } catch (error: any) {
      this.logger.error(`❌ Fn getStore ERROR: ${error?.message}`);
      return undefined;
    }
  }

  /**
   * @deprecated Use cacheService.del() instead
   */
  async removeItem(key: KeyCachingSystem): Promise<any> {
    try {
      // Thêm prefix NODE_ENV như implementation cũ
      const prefixedKey = `${process.env.NODE_ENV}:${key}`;
      await this.cacheService.del(prefixedKey);
    } catch (error: any) {
      this.logger.error(`❌ Fn getStore ERROR: ${error?.message}`);
    }
  }

  /**
   * @deprecated Không nên expose Redis client trực tiếp
   * Sử dụng các methods của CacheService thay thế
   */
  getClient() {
    this.logger.warn(
      'getClient() is deprecated and will be removed. Use CacheService methods instead.'
    );
    throw new Error(
      'getClient() is deprecated. Use CacheService methods instead of direct Redis access.'
    );
  }
}
