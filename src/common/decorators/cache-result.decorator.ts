import { SetMetadata } from '@nestjs/common';

/**
 * Cache decorator để cache kết quả của method
 * 
 * @param ttl - Time to live (seconds)
 * @param keyPrefix - Prefix cho cache key (optional)
 * 
 * @example
 * ```typescript
 * @CacheResult(300) // Cache 5 phút
 * async getUserProfile(userId: string) {
 *   return this.prisma.user.findUnique({ where: { id: userId } });
 * }
 * ```
 */
export const CACHE_TTL_KEY = 'cache:ttl';
export const CACHE_KEY_PREFIX = 'cache:key_prefix';

export function CacheResult(ttl: number = 60, keyPrefix?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_TTL_KEY, ttl)(target, propertyKey, descriptor);
    if (keyPrefix) {
      SetMetadata(CACHE_KEY_PREFIX, keyPrefix)(target, propertyKey, descriptor);
    }
  };
}
