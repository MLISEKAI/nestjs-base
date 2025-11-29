/**
 * @deprecated Use CacheService from src/common/cache instead
 * 
 * Legacy Redis caching service with old API
 * Kept for backward compatibility during migration
 * 
 * This file re-exports the adapter for backward compatibility
 * The actual implementation is in cache.adapter.ts
 */
export { RedisCachingService } from './cache.adapter';
