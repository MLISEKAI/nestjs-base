import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { TrendingQueryDto, TrendingPeriod } from '../dto/search.dto';

@Injectable()
export class TrendingService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Get trending posts based on engagement metrics
   * Cached for 5 minutes to reduce database load
   */
  async getTrendingPosts(query: TrendingQueryDto) {
    const { period = TrendingPeriod.DAY, limit = 20 } = query;
    const cacheKey = `trending:posts:${period}:${limit}`;
    const cacheTtl = 300; // 5 minutes

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const dateThreshold = this.getDateThreshold(period);

        // Tính trending score dựa trên likes, comments, và views trong khoảng thời gian
        const posts = await this.prisma.resPost.findMany({
          where: {
            created_at: { gte: dateThreshold },
          },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        });

        // Tính trending score: (likes * 2) + (comments * 3) + (time_decay_factor)
        const postsWithScore = posts.map((post) => {
          const likes = post._count.likes || 0;
          const comments = post._count.comments || 0;
          const hoursSinceCreation = (Date.now() - post.created_at.getTime()) / (1000 * 60 * 60);
          const timeDecay = Math.max(0, 1 - hoursSinceCreation / 24); // Decay over 24 hours

          const trendingScore = likes * 2 + comments * 3 + timeDecay * 10;

          return {
            ...post,
            trending_score: trendingScore,
            _count: undefined,
          };
        });

        // Sắp xếp theo trending score
        postsWithScore.sort((a, b) => b.trending_score - a.trending_score);

        return postsWithScore.slice(0, limit);
      },
      cacheTtl,
    );
  }

  /**
   * Get trending users based on followers growth and engagement
   * Cached for 5 minutes to reduce database load
   * Tối ưu: Sử dụng single query với aggregation thay vì N+1 queries
   */
  async getTrendingUsers(query: TrendingQueryDto) {
    const { period = TrendingPeriod.DAY, limit = 20 } = query;
    const cacheKey = `trending:users:${period}:${limit}`;
    const cacheTtl = 300; // 5 minutes

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const dateThreshold = this.getDateThreshold(period);

        // Lấy users có nhiều followers mới trong khoảng thời gian
        const recentFollows = await this.prisma.resFollow.groupBy({
          by: ['following_id'],
          where: {
            created_at: { gte: dateThreshold },
          },
          _count: {
            following_id: true,
          },
          orderBy: {
            _count: {
              following_id: 'desc',
            },
          },
          take: limit,
        });

        const userIds = recentFollows.map((f) => f.following_id);

        if (userIds.length === 0) {
          return [];
        }

        // Tối ưu: Lấy tất cả followers count trong 1 query thay vì N queries
        const [users, allFollowersCounts] = await Promise.all([
          this.prisma.resUser.findMany({
            where: {
              id: { in: userIds },
            },
            select: {
              id: true,
              nickname: true,
              avatar: true,
              bio: true,
              created_at: true,
            },
          }),
          this.prisma.resFollow.groupBy({
            by: ['following_id'],
            where: {
              following_id: { in: userIds },
            },
            _count: {
              following_id: true,
            },
          }),
        ]);

        // Tạo map để lookup nhanh
        const followersCountMap = new Map(
          allFollowersCounts.map((item) => [item.following_id, item._count.following_id]),
        );
        const newFollowersMap = new Map(
          recentFollows.map((item) => [item.following_id, item._count.following_id]),
        );

        // Attach followers count (không cần Promise.all nữa vì đã có sẵn data)
        const usersWithStats = users.map((user) => {
          const followersCount = followersCountMap.get(user.id) || 0;
          const newFollowers = newFollowersMap.get(user.id) || 0;

          return {
            ...user,
            followers_count: followersCount,
            new_followers: newFollowers,
            trending_score: newFollowers, // Simple score based on new followers
          };
        });

        // Sắp xếp lại theo trending score
        usersWithStats.sort((a, b) => b.trending_score - a.trending_score);

        return usersWithStats;
      },
      cacheTtl,
    );
  }

  /**
   * Get date threshold based on period
   */
  private getDateThreshold(period: TrendingPeriod): Date {
    const now = new Date();
    const threshold = new Date();

    switch (period) {
      case TrendingPeriod.DAY:
        threshold.setHours(threshold.getHours() - 24);
        break;
      case TrendingPeriod.WEEK:
        threshold.setDate(threshold.getDate() - 7);
        break;
      case TrendingPeriod.MONTH:
        threshold.setDate(threshold.getDate() - 30);
        break;
      default:
        threshold.setHours(threshold.getHours() - 24);
    }

    return threshold;
  }
}
