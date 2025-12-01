import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from './cache.service';
import { MetricsService } from '../monitoring/metrics.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

/**
 * Cache TTL Configuration
 */
export const CacheTTL = {
  USER_DETAIL: 1800, // 30 phút
  USER_STATS: 300, // 5 phút
  SEARCH_PAGE: 600, // 10 phút
  FEED: 180, // 3 phút
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
  private keysWarmed: number = 0;
  private traceId: string = '';

  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly QUERY_TIMEOUT_MS = 1000;
  private readonly WARMUP_LOCK_TTL = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly metricsService: MetricsService,
    @InjectRedis() private readonly redis: Redis,
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
      keysWarmed: this.keysWarmed,
      traceId: this.traceId,
    };
  }

  /**
   * Scheduled auto-refresh every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledWarmUp() {
    if (process.env.NODE_ENV === 'test' || process.env.SKIP_CACHE_WARMUP === '1') {
      return;
    }

    this.logger.log('🕐 Scheduled cache warm-up triggered');
    await this.warmUpCache().catch((error) => {
      this.logger.error('Scheduled cache warm-up failed:', error.message);
    });
  }

  /**
   * Warm up cache + DB queries + connection pool
   */
  private async warmUpCache() {
    // Generate traceId for end-to-end tracing
    this.traceId = `warmup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Atomic lock with NX + expiry (Redis SET NX EX)
    const lockKey = 'cache:warmup:lock';
    const lockAcquired = await this.redis.set(lockKey, this.traceId, 'EX', this.WARMUP_LOCK_TTL, 'NX');
    
    if (!lockAcquired) {
      this.logger.log('Cache warm-up already running in another instance, skipping...', { traceId: this.traceId });
      return;
    }

    this.logger.log('🔥 Starting cache warm-up...', { traceId: this.traceId });
    this.warmUpStatus = 'running';
    this.metricsService.recordWarmupStart();
    const startTime = Date.now();
    this.keysWarmed = 0;

    try {
      // Step 1: Warm DB connection pool & query plans (10%)
      await this.retryWithBackoff(() => this.warmDatabaseConnection());

      // Step 2: Warm cache data (parallel)
      const results = await Promise.allSettled([
        this.retryWithBackoff(() => this.warmTopUsers()),
        this.retryWithBackoff(() => this.warmUserSearch()),
      ]);

      // Count successful operations
      results.forEach((result) => {
        if (result.status === 'rejected') {
          this.logger.warn('Warmup subtask failed:', result.reason?.message, { traceId: this.traceId });
        }
      });

      this.warmUpDuration = Date.now() - startTime;
      this.lastWarmUp = new Date();
      this.warmUpStatus = 'completed';
      
      // Record metrics
      this.metricsService.recordWarmupComplete(this.warmUpDuration, this.keysWarmed);
      
      this.logger.log(`🎉 Cache warm-up completed in ${this.warmUpDuration}ms, ${this.keysWarmed} keys warmed`, { 
        traceId: this.traceId,
        durationMs: this.warmUpDuration,
        keysWarmed: this.keysWarmed,
      });
    } catch (error) {
      this.warmUpStatus = 'failed';
      this.metricsService.recordWarmupFailed();
      this.logger.error('Cache warm-up failed:', error.message, { traceId: this.traceId });
      throw error;
    } finally {
      // Release lock only if we still own it
      const currentLock = await this.redis.get(lockKey);
      if (currentLock === this.traceId) {
        await this.redis.del(lockKey);
      }
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = this.MAX_RETRIES,
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.withTimeout(fn(), this.QUERY_TIMEOUT_MS);
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        this.logger.warn(`Retry attempt ${attempt}/${retries} after ${delay}ms`, { 
          traceId: this.traceId,
          error: error.message,
        });
        await this.sleep(delay);
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Add timeout to promise
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Warm database connection pool & query plans (10% progress)
   */
  private async warmDatabaseConnection() {
    try {
      this.logger.log('🔌 10% - Warming DB connection & query plans...', { traceId: this.traceId });

      // Warm connection pool + query plans với các queries phổ biến
      await Promise.all([
        // Warm user table
        this.prisma.$queryRaw`SELECT COUNT(*) FROM res_user WHERE is_deleted = false LIMIT 1`,
        // Warm follow table
        this.prisma.$queryRaw`SELECT COUNT(*) FROM res_follow LIMIT 1`,
        // Warm friend table
        this.prisma.$queryRaw`SELECT COUNT(*) FROM res_friend LIMIT 1`,
        // Warm notification table
        this.prisma.$queryRaw`SELECT COUNT(*) FROM res_notification LIMIT 1`,
        // Warm indexes
        this.prisma.resUser.findFirst({ where: { is_deleted: false }, select: { id: true } }),
        this.prisma.resFollow.findFirst({ select: { id: true } }),
      ]);

      this.logger.log('✅ DB connection & query plans warmed', { traceId: this.traceId });
    } catch (error) {
      this.logger.warn('Failed to warm DB connection:', error.message, { traceId: this.traceId });
      throw error;
    }
  }

  /**
   * Warm up top users (20% progress)
   */
  private async warmTopUsers() {
    try {
      this.logger.log('📊 20% - Warming top users...', { traceId: this.traceId });

      // Lấy top 10 users gần đây (thay vì count followers - nhanh hơn)
      const topUsers = await this.prisma.resUser.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: { id: true },
      });

      this.logger.log(`Found ${topUsers.length} top users`, { traceId: this.traceId });

      // Warm up parallel
      const results = await Promise.allSettled(
        topUsers.map(async (user) => {
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
            this.keysWarmed++;
          }

          const stats = {
            followers_count: followersCount,
            following_count: followingCount,
            friends_count: friendsCount,
          };

          await this.cacheService.set(`connections:${user.id}:stats`, stats, CacheTTL.USER_STATS);
          this.keysWarmed++;
        }),
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      this.logger.log(`✅ 50% - Top users warmed (${successCount}/${topUsers.length})`, { traceId: this.traceId });
    } catch (error) {
      this.logger.error('Failed to warm top users:', error.message, { traceId: this.traceId });
      throw error;
    }
  }

  /**
   * Warm up user search (80% progress)
   */
  private async warmUserSearch() {
    try {
      this.logger.log('🔍 80% - Warming user search...', { traceId: this.traceId });

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
      this.keysWarmed++;

      this.logger.log('✅ 100% - User search warmed', { traceId: this.traceId });
    } catch (error) {
      this.logger.error('Failed to warm user search:', error.message, { traceId: this.traceId });
      throw error;
    }
  }

  /**
   * Manual warm up - có thể gọi từ admin endpoint
   */
  async manualWarmUp() {
    return this.warmUpCache();
  }

  /**
   * Selective warmup - warmup specific users
   */
  async warmupUsers(userIds: string[], reason?: string) {
    const traceId = `selective-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logger.log(`🎯 Starting selective user warmup for ${userIds.length} users`, { 
      traceId, 
      userIds: userIds.slice(0, 5), // Log first 5 only
      reason,
    });

    const startTime = Date.now();
    let keysWarmed = 0;
    const failedTargets: string[] = [];

    const results = await Promise.allSettled(
      userIds.map(async (userId) => {
        try {
          // User detail + stats parallel
          const [userDetail, followersCount, followingCount, friendsCount] = await Promise.all([
            this.prisma.resUser.findUnique({
              where: { id: userId },
              select: {
                id: true,
                nickname: true,
                avatar: true,
                bio: true,
              },
            }),
            this.prisma.resFollow.count({ where: { following_id: userId } }),
            this.prisma.resFollow.count({ where: { follower_id: userId } }),
            this.prisma.resFriend.count({
              where: { OR: [{ user_a_id: userId }, { user_b_id: userId }] },
            }),
          ]);

          if (userDetail) {
            await this.cacheService.set(`user:${userId}:detail`, userDetail, CacheTTL.USER_DETAIL);
            keysWarmed++;
          }

          const stats = {
            followers_count: followersCount,
            following_count: followingCount,
            friends_count: friendsCount,
          };

          await this.cacheService.set(`connections:${userId}:stats`, stats, CacheTTL.USER_STATS);
          keysWarmed++;

          return { userId, success: true };
        } catch (error) {
          this.logger.warn(`Failed to warmup user ${userId}:`, error.message, { traceId });
          failedTargets.push(userId);
          return { userId, success: false, error: error.message };
        }
      }),
    );

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.status === 'fulfilled').length;

    this.logger.log(`✅ Selective user warmup completed: ${successCount}/${userIds.length} users`, {
      traceId,
      durationMs: duration,
      keysWarmed,
      failedCount: failedTargets.length,
    });

    return {
      success: true,
      keysWarmed,
      durationMs: duration,
      targetType: 'user',
      targetsProcessed: successCount,
      failedTargets,
      traceId,
    };
  }

  /**
   * Selective warmup - warmup specific posts
   */
  async warmupPosts(postIds: string[], reason?: string) {
    const traceId = `selective-post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logger.log(`🎯 Starting selective post warmup for ${postIds.length} posts`, { 
      traceId, 
      postIds: postIds.slice(0, 5),
      reason,
    });

    const startTime = Date.now();
    let keysWarmed = 0;
    const failedTargets: string[] = [];

    const results = await Promise.allSettled(
      postIds.map(async (postId) => {
        try {
          // Post detail + stats
          const [postDetail, likesCount, commentsCount] = await Promise.all([
            this.prisma.resPost.findUnique({
              where: { id: postId },
              select: {
                id: true,
                content: true,
                media: true,
                user_id: true,
                created_at: true,
              },
            }),
            this.prisma.resPostLike.count({ where: { post_id: postId } }),
            this.prisma.resComment.count({ where: { post_id: postId } }),
          ]);

          if (postDetail) {
            await this.cacheService.set(`post:${postId}:detail`, postDetail, CacheTTL.SEARCH_PAGE);
            keysWarmed++;

            const stats = {
              likes_count: likesCount,
              comments_count: commentsCount,
            };
            await this.cacheService.set(`post:${postId}:stats`, stats, CacheTTL.USER_STATS);
            keysWarmed++;
          }

          return { postId, success: true };
        } catch (error) {
          this.logger.warn(`Failed to warmup post ${postId}:`, error.message, { traceId });
          failedTargets.push(postId);
          return { postId, success: false, error: error.message };
        }
      }),
    );

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.status === 'fulfilled').length;

    this.logger.log(`✅ Selective post warmup completed: ${successCount}/${postIds.length} posts`, {
      traceId,
      durationMs: duration,
      keysWarmed,
      failedCount: failedTargets.length,
    });

    return {
      success: true,
      keysWarmed,
      durationMs: duration,
      targetType: 'post',
      targetsProcessed: successCount,
      failedTargets,
      traceId,
    };
  }

  /**
   * Selective warmup - warmup user feed
   */
  async warmupFeed(userId: string, reason?: string) {
    const traceId = `selective-feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logger.log(`🎯 Starting selective feed warmup for user ${userId}`, { traceId, reason });

    const startTime = Date.now();
    let keysWarmed = 0;

    try {
      // Get user's following list
      const following = await this.prisma.resFollow.findMany({
        where: { follower_id: userId },
        select: { following_id: true },
        take: 100, // Limit to 100 following
      });

      const followingIds = following.map((f) => f.following_id);

      // Get recent posts from following
      const feedPosts = await this.prisma.resPost.findMany({
        where: {
          user_id: { in: followingIds },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: {
          id: true,
          content: true,
          media: true,
          user_id: true,
          created_at: true,
        },
      });

      // Cache feed
      await this.cacheService.set(`feed:${userId}:page:1`, feedPosts, CacheTTL.FEED);
      keysWarmed++;

      const duration = Date.now() - startTime;

      this.logger.log(`✅ Selective feed warmup completed for user ${userId}`, {
        traceId,
        durationMs: duration,
        keysWarmed,
        postsCount: feedPosts.length,
      });

      return {
        success: true,
        keysWarmed,
        durationMs: duration,
        targetType: 'feed',
        targetsProcessed: 1,
        failedTargets: [],
        traceId,
      };
    } catch (error) {
      this.logger.error(`Failed to warmup feed for user ${userId}:`, error.message, { traceId });
      return {
        success: false,
        keysWarmed,
        durationMs: Date.now() - startTime,
        targetType: 'feed',
        targetsProcessed: 0,
        failedTargets: [userId],
        traceId,
      };
    }
  }

  /**
   * Selective warmup - warmup search results
   */
  async warmupSearch(query: string, reason?: string) {
    const traceId = `selective-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logger.log(`🎯 Starting selective search warmup for query: ${query}`, { traceId, reason });

    const startTime = Date.now();
    let keysWarmed = 0;

    try {
      // Search users
      const users = await this.prisma.resUser.findMany({
        where: {
          nickname: { contains: query, mode: 'insensitive' },
          is_deleted: false,
        },
        take: 20,
        select: {
          id: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      });

      // Cache search results
      const cacheKey = `search:users:${query.toLowerCase()}:page:1`;
      await this.cacheService.set(cacheKey, users, CacheTTL.SEARCH_PAGE);
      keysWarmed++;

      const duration = Date.now() - startTime;

      this.logger.log(`✅ Selective search warmup completed for query: ${query}`, {
        traceId,
        durationMs: duration,
        keysWarmed,
        resultsCount: users.length,
      });

      return {
        success: true,
        keysWarmed,
        durationMs: duration,
        targetType: 'search',
        targetsProcessed: 1,
        failedTargets: [],
        traceId,
      };
    } catch (error) {
      this.logger.error(`Failed to warmup search for query ${query}:`, error.message, { traceId });
      return {
        success: false,
        keysWarmed,
        durationMs: Date.now() - startTime,
        targetType: 'search',
        targetsProcessed: 0,
        failedTargets: [query],
        traceId,
      };
    }
  }
}
