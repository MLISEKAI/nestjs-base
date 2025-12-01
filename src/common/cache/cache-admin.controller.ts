import { Controller, Post, Get, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { CacheWarmingService } from './cache-warming.service';
import { CacheService } from './cache.service';
import { MemoryCacheService } from './memory-cache.service';
import { 
  SelectiveWarmupDto, 
  WarmupUserDto, 
  SelectiveWarmupResponseDto,
  WarmupTargetType,
} from './dto';

/**
 * CacheAdminController - Admin endpoints cho cache management
 * Rate limited to prevent abuse: 5 requests per minute
 */
@ApiTags('Admin - Cache')
@Controller('admin/cache')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
export class CacheAdminController {
  constructor(
    private readonly cacheWarmingService: CacheWarmingService,
    private readonly cacheService: CacheService,
    private readonly memoryCache: MemoryCacheService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: '[Admin] Get cache warm-up status' })
  @ApiOkResponse({
    description: 'Cache warm-up status',
    schema: {
      type: 'object',
      properties: {
        lastWarmUp: { type: 'string', example: '2025-12-01T09:00:00.000Z' },
        durationMs: { type: 'number', example: 2500 },
        status: { type: 'string', example: 'completed' },
        memoryCache: {
          type: 'object',
          properties: {
            size: { type: 'number', example: 150 },
            max: { type: 'number', example: 1000 },
          },
        },
      },
    },
  })
  getStatus() {
    return {
      ...this.cacheWarmingService.getStatus(),
      memoryCache: this.memoryCache.getStats(),
    };
  }

  @Post('warm-up')
  @ApiOperation({ summary: '[Admin] Manual cache warm-up' })
  @Throttle({ default: { limit: 2, ttl: 60000 } }) // Extra strict: 2 per minute
  async warmUp() {
    await this.cacheWarmingService.manualWarmUp();
    return { 
      message: 'Cache warm-up completed',
      status: this.cacheWarmingService.getStatus(),
    };
  }

  @Post('clear')
  @ApiOperation({ summary: '[Admin] Clear all cache' })
  @Throttle({ default: { limit: 2, ttl: 60000 } }) // Extra strict: 2 per minute
  async clearCache() {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear Redis cache (pattern matching)
    await this.cacheService.delPattern('*');
    
    return { message: 'All cache cleared (memory + Redis)' };
  }

  @Post('selective-warmup')
  @ApiOperation({ 
    summary: '[Admin] Selective cache warm-up for specific data',
    description: 'Warmup cache for specific users, posts, feeds, or search queries. Max 100 targets per request.',
  })
  @ApiOkResponse({
    description: 'Selective warmup completed',
    type: SelectiveWarmupResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async selectiveWarmup(@Body() dto: SelectiveWarmupDto): Promise<SelectiveWarmupResponseDto> {
    const { targetType, targetIds, reason } = dto;

    switch (targetType) {
      case WarmupTargetType.USER:
        if (!targetIds || targetIds.length === 0) {
          throw new Error('targetIds is required for user warmup');
        }
        return await this.cacheWarmingService.warmupUsers(targetIds, reason);

      case WarmupTargetType.POST:
        if (!targetIds || targetIds.length === 0) {
          throw new Error('targetIds is required for post warmup');
        }
        return await this.cacheWarmingService.warmupPosts(targetIds, reason);

      case WarmupTargetType.FEED:
        if (!targetIds || targetIds.length === 0) {
          throw new Error('targetIds is required for feed warmup (user IDs)');
        }
        // Warmup feeds for multiple users
        const feedResults = await Promise.all(
          targetIds.map((userId) => this.cacheWarmingService.warmupFeed(userId, reason)),
        );
        
        // Aggregate results
        const totalKeys = feedResults.reduce((sum, r) => sum + r.keysWarmed, 0);
        const totalDuration = feedResults.reduce((sum, r) => sum + r.durationMs, 0);
        const allFailed = feedResults.flatMap((r) => r.failedTargets || []);
        
        return {
          success: true,
          keysWarmed: totalKeys,
          durationMs: totalDuration,
          targetType: 'feed',
          targetsProcessed: targetIds.length - allFailed.length,
          failedTargets: allFailed,
          traceId: feedResults[0]?.traceId || 'batch-feed-warmup',
        };

      case WarmupTargetType.SEARCH:
        if (!targetIds || targetIds.length === 0) {
          throw new Error('targetIds is required for search warmup (search queries)');
        }
        // Warmup search results for multiple queries
        const searchResults = await Promise.all(
          targetIds.map((query) => this.cacheWarmingService.warmupSearch(query, reason)),
        );
        
        // Aggregate results
        const totalSearchKeys = searchResults.reduce((sum, r) => sum + r.keysWarmed, 0);
        const totalSearchDuration = searchResults.reduce((sum, r) => sum + r.durationMs, 0);
        const allSearchFailed = searchResults.flatMap((r) => r.failedTargets || []);
        
        return {
          success: true,
          keysWarmed: totalSearchKeys,
          durationMs: totalSearchDuration,
          targetType: 'search',
          targetsProcessed: targetIds.length - allSearchFailed.length,
          failedTargets: allSearchFailed,
          traceId: searchResults[0]?.traceId || 'batch-search-warmup',
        };

      default:
        throw new Error(`Unsupported target type: ${targetType}`);
    }
  }

  @Post('warmup-user')
  @ApiOperation({ 
    summary: '[Admin] Warmup cache for a single user',
    description: 'Warmup user profile, stats, and optionally posts and notifications',
  })
  @ApiOkResponse({
    description: 'User warmup completed',
    type: SelectiveWarmupResponseDto,
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async warmupUser(@Body() dto: WarmupUserDto): Promise<SelectiveWarmupResponseDto> {
    const { userId, includePosts, includeNotifications } = dto;
    
    // Warmup user basic data
    const result = await this.cacheWarmingService.warmupUsers([userId], 'Single user warmup');
    
    // TODO: Add posts and notifications warmup if requested
    if (includePosts) {
      // Warmup user's recent posts
    }
    
    if (includeNotifications) {
      // Warmup user's notifications
    }
    
    return result;
  }
}
