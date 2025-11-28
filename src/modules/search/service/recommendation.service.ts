import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { RecommendationQueryDto } from '../dto/search.dto';
import { UserConnectionsService } from '../../users/service/user-connections.service';

@Injectable()
export class RecommendationService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private connectionsService: UserConnectionsService,
  ) {}

  /**
   * Get recommended users based on mutual connections and similar interests
   * Cached for 10 minutes per user (user-specific recommendations)
   */
  async getRecommendedUsers(user_id: string, query: RecommendationQueryDto) {
    const limit = query.limit || 10;
    const cacheKey = `recommendations:users:${user_id}:${limit}`;
    const cacheTtl = 600; // 10 minutes

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // 1. Lấy danh sách users mà user hiện tại đang follow
        const following = await this.prisma.resFollow.findMany({
          where: { follower_id: user_id },
          select: { following_id: true },
        });
        const followingIds = following.map((f) => f.following_id);
        followingIds.push(user_id); // Exclude self

        // 2. Lấy danh sách users mà những người bạn đang follow (mutual connections)
        const mutualConnections = await this.prisma.resFollow.findMany({
          where: {
            follower_id: { in: followingIds },
            following_id: { notIn: followingIds },
          },
          select: { following_id: true },
          distinct: ['following_id'],
        });

        // 3. Đếm số mutual connections cho mỗi user
        const mutualCounts = new Map<string, number>();
        for (const connection of mutualConnections) {
          const count = mutualCounts.get(connection.following_id) || 0;
          mutualCounts.set(connection.following_id, count + 1);
        }

        // 4. Sắp xếp theo số mutual connections và lấy top N
        const sortedUsers = Array.from(mutualCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([user_id]) => user_id);

        // 5. Lấy thông tin chi tiết của recommended users
        if (sortedUsers.length === 0) {
          // Fallback: Lấy random active users
          const randomUsers = await this.prisma.resUser.findMany({
            where: {
              id: { notIn: followingIds },
            },
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              nickname: true,
              avatar: true,
              bio: true,
              created_at: true,
            },
          });
          return randomUsers;
        }

        const recommendedUsers = await this.prisma.resUser.findMany({
          where: {
            id: { in: sortedUsers },
          },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            created_at: true,
          },
        });

        // Attach connection status
        return this.connectionsService.attachStatus(user_id, recommendedUsers);
      },
      cacheTtl,
    );
  }

  /**
   * Get recommended posts based on user's interests and following
   * Cached for 5 minutes per user (user-specific recommendations)
   */
  async getRecommendedPosts(user_id: string, query: RecommendationQueryDto) {
    const limit = query.limit || 10;
    const cacheKey = `recommendations:posts:${user_id}:${limit}`;
    const cacheTtl = 300; // 5 minutes

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // 1. Lấy danh sách users mà user đang follow
        const following = await this.prisma.resFollow.findMany({
          where: { follower_id: user_id },
          select: { following_id: true },
        });
        const followingIds = following.map((f) => f.following_id);

        // 2. Lấy posts từ users đang follow, sắp xếp theo engagement
        const posts = await this.prisma.resPost.findMany({
          where: {
            user_id: { in: followingIds },
          },
          take: limit,
          orderBy: { created_at: 'desc' },
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
        });

        // 3. Nếu không đủ, lấy thêm posts trending từ 24h gần đây
        if (posts.length < limit) {
          const remaining = limit - posts.length;
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);

          const trendingPosts = await this.prisma.resPost.findMany({
            where: {
              created_at: { gte: oneDayAgo },
              user_id: { notIn: followingIds },
            },
            take: remaining,
            orderBy: { created_at: 'desc' },
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
          });
          return [...posts, ...trendingPosts];
        }

        return posts;
      },
      cacheTtl,
    );
  }
}
