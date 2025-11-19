import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache.service';
import { CACHE_KEY, CACHE_TTL } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const cacheTtl = this.reflector.get<number>(CACHE_TTL, context.getHandler());

    if (!cacheKey) {
      return next.handle();
    }

    // Replace :param with actual values
    const key = this.replaceParams(cacheKey, request);

    // Try to get from cache
    const cached = await this.cacheService.get(key);
    if (cached !== null) {
      return of(cached);
    }

    // If not cached, execute and cache the result
    return next.handle().pipe(
      tap(async (data) => {
        await this.cacheService.set(key, data, cacheTtl || 3600);
      }),
    );
  }

  private replaceParams(key: string, request: any): string {
    // Replace :param with values from params, query, or body
    return key.replace(/:(\w+)/g, (match, paramName) => {
      return (
        request.params?.[paramName] ||
        request.query?.[paramName] ||
        request.body?.[paramName] ||
        match
      );
    });
  }
}
