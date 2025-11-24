import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class FriendsFeedService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getFeed(userId: string, query?: BaseQueryDto) {
    const take = Math.min(query?.limit && query.limit > 0 ? query.limit : 20, 50); // Max 50
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const sinceKey = query?.since ? `:since:${query.since.getTime()}` : '';
    const cacheKey = `friends:feed:${userId}:page:${page}:limit:${take}${sinceKey}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy danh sách bạn bè (friends)
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

        // Nếu không có bạn bè, trả về empty
        if (friendIds.length === 0) {
          return buildPaginatedResponse([], 0, page, take);
        }

        // Lấy posts từ bạn bè (chỉ public hoặc friends privacy)
        const where: any = {
          user_id: { in: friendIds },
          OR: [{ privacy: 'public' }, { privacy: 'friends' }],
        };

        // Filter by since timestamp if provided
        if (query?.since) {
          where.created_at = { gt: query.since };
        }

        const [posts, total] = await Promise.all([
          this.prisma.resPost.findMany({
            where,
            take,
            skip,
            orderBy: { created_at: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                },
              },
              media: {
                orderBy: { order: 'asc' },
              },
              hashtags: {
                include: {
                  hashtag: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          }),
          this.prisma.resPost.count({ where }),
        ]);

        // Check if user liked each post
        const postIds = posts.map((p) => p.id);
        const likes = await this.prisma.resPostLike.findMany({
          where: {
            post_id: { in: postIds },
            user_id: userId,
          },
          select: { post_id: true },
        });
        const userLikes = likes.map((l) => l.post_id);

        const formattedPosts = posts.map((post) => ({
          id: post.id,
          user: {
            id: post.user.id,
            nickname: post.user.nickname,
            avatar: post.user.avatar,
          },
          content: post.content,
          media: post.media.map((m) => ({
            id: m.id,
            type: m.media_type,
            url: m.media_url,
            thumbnail_url: m.thumbnail_url,
            width: m.width,
            height: m.height,
          })),
          hashtags: post.hashtags.map((ph) => `#${ph.hashtag.name}`),
          like_count: post._count.likes,
          comment_count: post._count.comments,
          share_count: post.share_count,
          is_liked: userLikes.includes(post.id),
          created_at: post.created_at,
          privacy: post.privacy,
        }));

        return buildPaginatedResponse(formattedPosts, total, page, take);
      },
      cacheTtl,
    );
  }

  async getPost(id: string, userId: string) {
    const post = await this.prisma.resPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
        },
        comments: {
          take: 10,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
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

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is friend with post author
    const isFriend = await this.prisma.resFriend.findFirst({
      where: {
        OR: [
          { user_a_id: userId, user_b_id: post.user_id },
          { user_a_id: post.user_id, user_b_id: userId },
        ],
      },
    });

    // Check privacy
    if (post.privacy === 'private' || (post.privacy === 'friends' && !isFriend)) {
      throw new NotFoundException('Post not found');
    }

    // Check if user liked
    const like = await this.prisma.resPostLike.findUnique({
      where: {
        post_id_user_id: {
          post_id: id,
          user_id: userId,
        },
      },
    });

    return {
      id: post.id,
      author: {
        id: post.user.id,
        name: post.user.nickname,
        avatar: post.user.avatar,
      },
      content: post.content,
      createdAt: post.created_at,
      likesCount: post._count.likes,
      comments: post.comments.map((c) => ({
        id: c.id,
        author: {
          id: c.user.id,
          name: c.user.nickname,
          avatar: c.user.avatar,
        },
        content: c.content,
        createdAt: c.created_at,
      })),
      images: post.media.filter((m) => m.media_type === 'image').map((m) => m.media_url),
      isLiked: !!like,
    };
  }
}
