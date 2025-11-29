import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_TTL_KEY, CACHE_KEY_PREFIX } from '../decorators/cache-result.decorator';
import { CacheService } from '../cache/cache.service';

/**
 * CacheInterceptor - Interceptor để cache response
 * 
 * Chức năng:
 * - Cache response dựa trên cache key
 * - Tự động generate cache key từ request params
 * - Support TTL (time to live)
 * - Log cache hit/miss
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler());
    const keyPrefix = this.reflector.get<string>(CACHE_KEY_PREFIX, context.getHandler());

    // Nếu không có TTL, skip caching
    if (!ttl) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request, keyPrefix);

    try {
      // Check cache
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData) {
        this.logger.debug(`✅ Cache HIT: ${cacheKey}`);
        return of(cachedData);
      }

      this.logger.debug(`❌ Cache MISS: ${cacheKey}`);

      // Cache miss - execute handler và cache result
      return next.handle().pipe(
        tap(async (data) => {
          try {
            await this.cacheService.set(cacheKey, data, ttl);
            this.logger.debug(`💾 Cached: ${cacheKey} (TTL: ${ttl}s)`);
          } catch (error) {
            this.logger.error(`Failed to cache: ${cacheKey}`, error);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error: ${error.message}`);
      return next.handle();
    }
  }

  private generateCacheKey(request: any, prefix?: string): string {
    const { method, url, user } = request;
    const userId = user?.id || 'anonymous';
    const baseKey = prefix || `${method}:${url}`;
    return `cache:${baseKey}:${userId}`;
  }
}
