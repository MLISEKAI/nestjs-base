import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CacheWarmingService } from './cache-warming.service';
import { CacheService } from './cache.service';
import { MemoryCacheService } from './memory-cache.service';

/**
 * CacheAdminController - Admin endpoints cho cache management
 */
@ApiTags('Admin - Cache')
@Controller('admin/cache')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
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
  async warmUp() {
    await this.cacheWarmingService.manualWarmUp();
    return { message: 'Cache warm-up completed' };
  }

  @Post('clear')
  @ApiOperation({ summary: '[Admin] Clear all cache' })
  async clearCache() {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear Redis cache (pattern matching)
    await this.cacheService.delPattern('*');
    
    return { message: 'All cache cleared (memory + Redis)' };
  }
}
