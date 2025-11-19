import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache:key';
export const CACHE_TTL = 'cache:ttl';

/**
 * Cache decorator for methods
 * @param key - Cache key (can use :param syntax)
 * @param ttl - Time to live in seconds (default: 3600)
 */
export const Cacheable = (key: string, ttl: number = 3600) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY, key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL, ttl)(target, propertyKey, descriptor);
  };
};
