import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format post for response
   */
  private formatPost(post: any, currentUserId?: string): any {
    const isLiked = currentUserId
      ? post.likes?.some((like: any) => like.user_id === currentUserId) || false
      : false;

    return {
      id: post.id,
      user: {
        id: post.user?.id,
        nickname: post.user?.nickname,
        avatar: post.user?.avatar,
        username: post.user?.union_id, // Using union_id as username
        display_name: post.user?.nickname,
        avatar_url: post.user?.avatar,
      },
      content: post.content,
      media: (post.media || []).map((media: any) => ({
        id: media.id,
        type: media.media_type,
        url: media.media_url,
        thumbnail_url: media.thumbnail_url || media.media_url,
        width: media.width || 1080,
        height: media.height || 1080,
      })),
      hashtags: [], // Will be populated after migration and prisma generate
      like_count: post._count?.likes || post.likes?.length || 0,
      comment_count: post._count?.comments || post.comments?.length || 0,
      share_count: post.share_count || 0,
      is_liked: isLiked,
      created_at: post.created_at,
      privacy: post.privacy || 'public',
    };
  }

  /**
   * Get friends feed
   */
  async getFriendsFeed(userId: string, query?: BaseQueryDto & { since?: string }) {
    const page = query?.page !== undefined && query.page >= 0 ? query.page : 0;
    const limit = query?.limit && query.limit > 0 && query.limit <= 50 ? query.limit : 20;
    const skip = page * limit;

    // Get user's friends
    const friends = await this.prisma.resFriend.findMany({
      where: {
        OR: [{ user_a_id: userId }, { user_b_id: userId }],
      },
      select: {
        user_a_id: true,
        user_b_id: true,
      },
    });

    const friendIds = friends.map((f) => (f.user_a_id === userId ? f.user_b_id : f.user_a_id));
    friendIds.push(userId); // Include own posts

    // Build where clause
    const where: any = {
      user_id: { in: friendIds },
      privacy: { in: ['public', 'friends'] },
    };

    if (query?.since) {
      where.created_at = { gt: new Date(query.since) };
    }

    // Get posts
    const [posts, total] = await Promise.all([
      this.prisma.resPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              union_id: true,
            },
          },
          media: {
            orderBy: { order: 'asc' },
          },
          // hashtags: {
          //   include: {
          //     hashtag: {
          //       select: {
          //         name: true,
          //       },
          //     },
          //   },
          // },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: userId ? { where: { user_id: userId }, select: { user_id: true } } : false,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.resPost.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      error: false,
      code: 0,
      message: 'Success',
      data: {
        items: posts.map((post) => this.formatPost(post, userId)),
        meta: {
          item_count: posts.length,
          total_items: total,
          items_per_page: limit,
          total_pages: totalPages,
          current_page: page,
        },
      },
      traceId: this.generateTraceId(),
    };
  }

  /**
   * Get latest feed (all posts)
   */
  async getLatestFeed(userId: string, query?: BaseQueryDto & { since?: string }) {
    const page = query?.page !== undefined && query.page >= 0 ? query.page : 0;
    const limit = query?.limit && query.limit > 0 && query.limit <= 50 ? query.limit : 20;
    const skip = page * limit;

    // Build where clause
    const where: any = {
      privacy: 'public',
    };

    if (query?.since) {
      where.created_at = { gt: new Date(query.since) };
    }

    // Get posts
    const [posts, total] = await Promise.all([
      this.prisma.resPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              union_id: true,
            },
          },
          media: {
            orderBy: { order: 'asc' },
          },
          // hashtags: {
          //   include: {
          //     hashtag: {
          //       select: {
          //         name: true,
          //       },
          //     },
          //   },
          // },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: userId ? { where: { user_id: userId }, select: { user_id: true } } : false,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.resPost.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      error: false,
      code: 0,
      message: 'Success',
      data: {
        items: posts.map((post) => this.formatPost(post, userId)),
        meta: {
          item_count: posts.length,
          total_items: total,
          items_per_page: limit,
          total_pages: totalPages,
          current_page: page,
        },
      },
      traceId: this.generateTraceId(),
    };
  }

  /**
   * Get community feed with hot topics
   */
  async getCommunityFeed(userId: string, query?: BaseQueryDto) {
    const page = query?.page !== undefined && query.page >= 0 ? query.page : 0;
    const limit = query?.limit && query.limit > 0 && query.limit <= 50 ? query.limit : 20;
    const skip = page * limit;

    // Get hot topics (trending hashtags) - using raw query since model might not be generated yet
    const hotTopics = (await this.prisma.$queryRaw`
      SELECT id, name, post_count, cover_image
      FROM res_hashtag
      ORDER BY post_count DESC, view_count DESC
      LIMIT 10
    `) as any[];

    // Build where clause
    const where: any = {
      privacy: 'public',
    };

    // Get posts
    const [posts, total] = await Promise.all([
      this.prisma.resPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              union_id: true,
            },
          },
          media: {
            orderBy: { order: 'asc' },
          },
          // hashtags: {
          //   include: {
          //     hashtag: {
          //       select: {
          //         name: true,
          //       },
          //     },
          //   },
          // },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: userId ? { where: { user_id: userId }, select: { user_id: true } } : false,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.resPost.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Format hot topics
    const formattedHotTopics = hotTopics.map((topic) => ({
      id: topic.id,
      hashtag: `#${topic.name}`,
      post_count: topic.post_count,
      thumbnail_url:
        topic.cover_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      engagement_score: Math.min(100, (topic.post_count / 1000) * 10), // Mock engagement score
    }));

    return {
      error: false,
      code: 0,
      message: 'Success',
      data: {
        hot_topics: formattedHotTopics,
        items: posts.map((post) => this.formatPost(post, userId)),
        meta: {
          item_count: posts.length,
          total_items: total,
          items_per_page: limit,
          total_pages: totalPages,
          current_page: page,
        },
      },
      traceId: this.generateTraceId(),
    };
  }
}
