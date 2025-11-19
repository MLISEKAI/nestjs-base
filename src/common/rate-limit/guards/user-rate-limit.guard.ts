import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRateLimitService, RateLimitConfig } from '../user-rate-limit.service';
import { RATE_LIMIT_KEY, RATE_LIMIT_CONFIG } from '../decorators/user-rate-limit.decorator';

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: UserRateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Check if rate limit is enabled
    const isRateLimited = this.reflector.getAllAndOverride<boolean>(RATE_LIMIT_KEY, [
      handler,
      controller,
    ]);

    if (!isRateLimited) {
      return true; // No rate limit for this endpoint
    }

    // Get rate limit config
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_CONFIG, [
      handler,
      controller,
    ]);

    if (!config) {
      return true; // No config, allow
    }

    // Get user ID from request
    const userId = this.getUserId(request);

    if (!userId) {
      // If no user ID, use IP address as fallback
      const ip = request.ip || request.connection?.remoteAddress || 'unknown';
      return this.checkRateLimit(context, `ip:${ip}`, request.path, config);
    }

    // Check rate limit for user
    return this.checkRateLimit(context, userId, request.path, config);
  }

  private async checkRateLimit(
    context: ExecutionContext,
    identifier: string,
    endpoint: string,
    config: RateLimitConfig,
  ): Promise<boolean> {
    const result = await this.rateLimitService.checkRateLimit(identifier, endpoint, config);

    if (!result.allowed) {
      throw new HttpException(
        {
          error: true,
          code: 429,
          message: `Rate limit exceeded. Please try again after ${result.retryAfter} seconds.`,
          data: {
            retryAfter: result.retryAfter,
            resetTime: result.resetTime,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers to response
    const response = this.getResponse(context);
    if (response) {
      response.setHeader('X-RateLimit-Limit', config.limit);
      response.setHeader('X-RateLimit-Remaining', result.remaining);
      response.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime.getTime() / 1000));
    }

    return true;
  }

  private getUserId(request: any): string | null {
    // Try to get user ID from different sources
    return (
      request.user?.id ||
      request.user?.userId ||
      request.params?.user_id ||
      request.body?.user_id ||
      request.query?.user_id ||
      null
    );
  }

  private getResponse(context: ExecutionContext): any {
    return context.switchToHttp().getResponse();
  }
}
