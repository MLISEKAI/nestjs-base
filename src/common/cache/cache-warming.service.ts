import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from './cache.service';

/**
 * Cache TTL Configuration
 */
export const CacheTTL = {
  USER_DETAIL: 1800, // 30 phút
  USER_STATS: 300, // 5 phút
  SEARCH_PAGE: 600, // 10 phút
};

/**
 * CacheWarmingService - Tự động warm up cache khi server start
 * 
 * Chức năng:
 * - Populate cache cho các queries phổ biến
 * - Giảm cold start time cho users đầu tiên
 * - Chạy async không block server startup
 * - Multi-instance safe (Redis lock)
 */
@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmingService.name);
  private lastWarmUp: Date | null = null;
  private warmUpDuration: number = 0;
  private warmUpStatus: 'idle' | 'running' | 'completed' | 'failed' = 'idle';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * onModuleInit - Lifecycle hook, chạy sau khi module được khởi tạo
   */
  async onModuleInit() {
    // Skip trong test environment
    if (process.env.NODE_ENV === 'test') {
      this.logger.log('Skipping cache warm-up in test environment');
      return;
    }

    // Skip nếu config disable
    if (process.env.SKIP_CACHE_WARMUP === '1') {
      this.logger.log('Cache warm-up disabled by config');
      return;
    }

    // Delay 500ms để DB/Redis ổn định
    setTimeout(() => {
      this.warmUpCache().catch((error) => {
        this.logger.error('Cache warming failed (non-critical):', error.message);
        this.warmUpStatus = 'failed';
      });
    }, 500);
  }

  /**
   * Get warm-up status
   */
  getStatus() {
    return {
      lastWarmUp: this.lastWarmUp,
      durationMs: this.warmUpDuration,
      status: this.warmUpStatus,
    };
  }

  /**
   * Warm up cache cho các queries phổ biến
   */
  private async warmUpCache() {
    // Check Redis lock để tránh warm-up nhiều lần (multi-instance)
    const lockKey = 'cache:warmup:lock';
    const lockAcquired = await this.cacheService.get(lockKey);
    
    if (lockAcquired) {
      this.logger.log('Cache warm-up already running in another instance, skipping...');
      return;
    }

    // Acquire lock (30 seconds)
    await this.cacheService.set(lockKey, '1', 30);

    this.logger.log('🔥 Starting cache warm-up...');
    this.warmUpStatus = 'running';
    const startTime = Date.now();

    try {
      // Chạy parallel để nhanh hơn
      await Promise.all([
        this.warmTopUsers(),
        this.warmUserSearch(),
      ]);

      this.warmUpDuration = Date.now() - startTime;
      this.lastWarmUp = new Date();
      this.warmUpStatus = 'completed';
      
      this.logger.log(`🎉 Cache warm-up completed in ${this.warmUpDuration}ms`);
    } catch (error) {
      this.warmUpStatus = 'failed';
      this.logger.error('Cache warm-up failed:', error.message);
      throw error;
    } finally {
      // Release lock
      await this.cacheService.del(lockKey);
    }
  }

  /**
   * Warm up top users (20% progress)
   */
  private async warmTopUsers() {
    try {
      this.logger.log('📊 20% - Warming top users...');

      // Lấy top 10 users gần đây (thay vì count followers - nhanh hơn)
      const topUsers = await this.prisma.resUser.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: { id: true },
      });

      this.logger.log(`Found ${topUsers.length} top users`);

      // Warm up parallel
      await Promise.all(
        topUsers.map(async (user) => {
          try {
            // User detail + stats parallel
            const [userDetail, followersCount, followingCount, friendsCount] = await Promise.all([
              this.prisma.resUser.findUnique({
                where: { id: user.id },
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                  bio: true,
                },
              }),
              this.prisma.resFollow.count({ where: { following_id: user.id } }),
              this.prisma.resFollow.count({ where: { follower_id: user.id } }),
              this.prisma.resFriend.count({
                where: { OR: [{ user_a_id: user.id }, { user_b_id: user.id }] },
              }),
            ]);

            if (userDetail) {
              await this.cacheService.set(`user:${user.id}:detail`, userDetail, CacheTTL.USER_DETAIL);
            }

            const stats = {
              followers_count: followersCount,
              following_count: followingCount,
              friends_count: friendsCount,
            };

            await this.cacheService.set(`connections:${user.id}:stats`, stats, CacheTTL.USER_STATS);
          } catch (error) {
            this.logger.warn(`Failed to warm user ${user.id}:`, error.message);
          }
        }),
      );

      this.logger.log('✅ 50% - Top users warmed');
    } catch (error) {
      this.logger.error('Failed to warm top users:', error.message);
    }
  }

  /**
   * Warm up user search (80% progress)
   */
  private async warmUserSearch() {
    try {
      this.logger.log('🔍 80% - Warming user search...');

      const [users, total] = await Promise.all([
        this.prisma.resUser.findMany({
          take: 20,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
          },
        }),
        this.prisma.resUser.count(),
      ]);

      const searchResult = {
        items: users,
        meta: {
          item_count: users.length,
          total_items: total,
          items_per_page: 20,
          total_pages: Math.ceil(total / 20),
          current_page: 1,
        },
      };

      await this.cacheService.set(
        'users:search:all:page:1:limit:20:sort:created_at:asc',
        searchResult,
        CacheTTL.SEARCH_PAGE,
      );

      this.logger.log('✅ 100% - User search warmed');
    } catch (error) {
      this.logger.error('Failed to warm user search:', error.message);
    }
  }

  /**
   * Manual warm up - có thể gọi từ admin endpoint
   */
  async manualWarmUp() {
    return this.warmUpCache();
  }
}
