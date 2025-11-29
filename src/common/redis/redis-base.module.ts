import { Module, Global } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { RedisCachingService } from './cache.adapter';

/**
 * @deprecated Use CacheModule from src/common/cache instead
 * 
 * This module is kept for backward compatibility during migration.
 * It now uses the new CacheService implementation under the hood.
 * 
 * Migration path:
 * 1. Replace RedisCachingService with CacheService in your services
 * 2. Update method calls (setItem -> set, getItem -> get, removeItem -> del)
 * 3. Remove this module import from app.module.ts
 * 4. Import CacheModule instead (it's global, so no need to import in other modules)
 * 
 * Old API (deprecated):
 * - setItem(key, value, seconds?)
 * - getItem<T>(key)
 * - removeItem(key)
 * 
 * New API (recommended):
 * - set(key, value, ttl?)
 * - get<T>(key)
 * - del(key)
 * - getOrSet<T>(key, fetchFn, ttl?) // Cache-aside pattern
 * - delPattern(pattern) // Delete multiple keys
 * - invalidateUserCache(user_id) // Invalidate user cache
 */
@Global()
@Module({
  imports: [CacheModule],
  providers: [RedisCachingService],
  exports: [RedisCachingService],
})
export class RedisBaseModule {}
