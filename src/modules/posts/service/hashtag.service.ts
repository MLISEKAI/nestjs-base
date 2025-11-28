// Import Injectable và exceptions từ NestJS
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import các DTO để validate và type-check dữ liệu
import { CreateHashtagDto, AttachHashtagsDto } from '../dto/hashtag.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import utility function để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * HashtagService - Service xử lý business logic cho hashtags
 *
 * Chức năng chính:
 * - Lấy trending hashtags (cached 5 phút)
 * - Tìm kiếm hashtags
 * - Tạo hashtag mới
 * - Attach/detach hashtags vào/khỏi posts
 * - Follow/unfollow hashtags
 * - Lấy posts theo hashtag với pagination
 *
 * Lưu ý:
 * - Trending hashtags được cache 5 phút
 * - Hashtag name không có dấu # (chỉ lưu tên)
 * - Có thể follow hashtags để nhận updates
 */
@Injectable()
export class HashtagService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService và CacheService khi tạo instance của service
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getTrending(limit: number = 20) {
    const cacheKey = `hashtags:trending:${limit}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const hashtags = await this.prisma.resHashtag.findMany({
          take: limit,
          orderBy: { post_count: 'desc' },
          select: {
            id: true,
            name: true,
            post_count: true,
            view_count: true,
            cover_image: true,
          },
        });

        return hashtags.map((h) => ({
          id: h.id,
          name: h.name,
          count: h.post_count,
          viewCount: h.view_count,
          coverImage: h.cover_image,
        }));
      },
      cacheTtl,
    );
  }

  async search(query: string) {
    if (!query || query.trim().length === 0) {
      return { query, result: [], can_create: false };
    }

    const searchTerm = query.trim().toLowerCase();

    const hashtags = await this.prisma.resHashtag.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      take: 10,
      orderBy: { post_count: 'desc' },
      select: {
        id: true,
        name: true,
      },
    });

    return {
      query: searchTerm,
      result: hashtags.map((h) => ({
        id: h.id,
        name: h.name,
      })),
      can_create: hashtags.length === 0, // Có thể tạo mới nếu không tìm thấy
    };
  }

  async getHashtag(id: string, user_id?: string) {
    const hashtag = await this.prisma.resHashtag.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        post_count: true,
        view_count: true,
        cover_image: true,
        created_at: true,
      },
    });

    if (!hashtag) {
      throw new NotFoundException('Hashtag not found');
    }

    // Tăng view count
    await this.prisma.resHashtag.update({
      where: { id },
      data: { view_count: { increment: 1 } },
    });

    // Check if user is following
    let isFollowing = false;
    if (user_id) {
      const follow = await this.prisma.resHashtagFollow.findUnique({
        where: {
          user_id_hashtag_id: {
            user_id: user_id,
            hashtag_id: id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      id: hashtag.id,
      name: hashtag.name,
      cover_image: hashtag.cover_image,
      total_posts: hashtag.post_count,
      total_views: hashtag.view_count + 1, // +1 vì vừa tăng
      is_following: isFollowing,
    };
  }

  async getHashtagPosts(
    id: string,
    sort: 'popular' | 'latest',
    query?: BaseQueryDto,
    user_id?: string,
  ) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `hashtag:${id}:posts:${sort}:page:${page}:limit:${take}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const where: any = {
          hashtags: {
            some: {
              hashtag_id: id,
            },
          },
          privacy: 'public',
        };

        // For popular sort, we need to get all posts first, then sort in memory
        // For latest sort, we can use Prisma orderBy
        const shouldFetchAll = sort === 'popular';

        const [allPosts, total] = await Promise.all([
          this.prisma.resPost.findMany({
            where,
            take: shouldFetchAll ? undefined : take,
            skip: shouldFetchAll ? undefined : skip,
            orderBy: sort === 'latest' ? { created_at: 'desc' } : undefined,
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                },
              },
              media: {
                select: {
                  id: true,
                  media_type: true,
                  media_url: true,
                  thumbnail_url: true,
                  width: true,
                  height: true,
                },
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

        // Sort by popularity if needed
        let sortedPosts = allPosts;
        if (sort === 'popular') {
          sortedPosts = allPosts.sort((a, b) => {
            const aScore = a._count.likes * 2 + a._count.comments * 3;
            const bScore = b._count.likes * 2 + b._count.comments * 3;
            return bScore - aScore;
          });
          // Apply pagination after sorting
          sortedPosts = sortedPosts.slice(skip, skip + take);
        }

        // Check if user liked each post
        const postIds = sortedPosts.map((p) => p.id);
        let userLikes: string[] = [];
        if (user_id && postIds.length > 0) {
          const likes = await this.prisma.resPostLike.findMany({
            where: {
              post_id: { in: postIds },
              user_id: user_id,
            },
            select: { post_id: true },
          });
          userLikes = likes.map((l) => l.post_id);
        }

        const formattedPosts = sortedPosts.map((post) => ({
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
            thumbnailUrl: m.thumbnail_url,
            width: m.width,
            height: m.height,
            duration: null, // ResPostMedia doesn't have duration field
          })),
          hashtags: post.hashtags.map((ph) => ({
            id: ph.hashtag.id,
            name: ph.hashtag.name,
          })),
          like_count: post._count.likes,
          comment_count: post._count.comments,
          share_count: post.share_count,
          is_liked: userLikes.includes(post.id),
          is_bookmarked: false, // TODO: Implement bookmark feature
          created_at: post.created_at,
          privacy: post.privacy,
          location: null, // ResPost doesn't have location field yet
          updated_at: post.updated_at,
        }));

        return buildPaginatedResponse(formattedPosts, total, page, take);
      },
      cacheTtl,
    );
  }

  async createHashtag(dto: CreateHashtagDto) {
    // Normalize name: remove #, lowercase, trim
    const normalizedName = dto.name.replace(/^#/, '').trim().toLowerCase();

    if (!normalizedName || normalizedName.length === 0) {
      throw new BadRequestException('Hashtag name cannot be empty');
    }

    try {
      const hashtag = await this.prisma.resHashtag.create({
        data: {
          name: normalizedName,
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Invalidate cache
      await this.cacheService.delPattern('hashtags:trending:*');
      await this.cacheService.delPattern('hashtags:search:*');

      return hashtag;
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        const existing = await this.prisma.resHashtag.findUnique({
          where: { name: normalizedName },
          select: { id: true, name: true },
        });
        return existing;
      }
      throw error;
    }
  }

  async followHashtag(user_id: string, hashtagId: string) {
    // Check if hashtag exists
    const hashtag = await this.prisma.resHashtag.findUnique({
      where: { id: hashtagId },
    });

    if (!hashtag) {
      throw new NotFoundException('Hashtag not found');
    }

    try {
      await this.prisma.resHashtagFollow.create({
        data: {
          user_id: user_id,
          hashtag_id: hashtagId,
        },
      });

      return { success: true, message: 'Hashtag followed' };
    } catch (error) {
      if (error.code === 'P2002') {
        // Already following
        return { success: true, message: 'Already following' };
      }
      throw error;
    }
  }

  async unfollowHashtag(user_id: string, hashtagId: string) {
    try {
      await this.prisma.resHashtagFollow.delete({
        where: {
          user_id_hashtag_id: {
            user_id: user_id,
            hashtag_id: hashtagId,
          },
        },
      });

      return { success: true, message: 'Hashtag unfollowed' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Not following this hashtag');
      }
      throw error;
    }
  }

  async getFollowStatus(user_id: string, hashtagId: string) {
    const follow = await this.prisma.resHashtagFollow.findUnique({
      where: {
        user_id_hashtag_id: {
          user_id: user_id,
          hashtag_id: hashtagId,
        },
      },
    });

    return {
      is_following: !!follow,
    };
  }

  async attachHashtags(user_id: string, postId: string, dto: AttachHashtagsDto) {
    // Verify post ownership
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId },
      select: { user_id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user_id !== user_id) {
      throw new ForbiddenException('You can only attach hashtags to your own posts');
    }

    // Verify all hashtags exist
    const hashtags = await this.prisma.resHashtag.findMany({
      where: {
        id: { in: dto.hashtags },
      },
      select: { id: true },
    });

    if (hashtags.length !== dto.hashtags.length) {
      throw new BadRequestException('Some hashtags not found');
    }

    // Check which hashtags are already attached
    const existingAttachments = await this.prisma.resPostHashtag.findMany({
      where: {
        post_id: postId,
        hashtag_id: { in: dto.hashtags },
      },
      select: { hashtag_id: true },
    });

    const existingHashtagIds = existingAttachments.map((a) => a.hashtag_id);
    const newHashtagIds = dto.hashtags.filter((id) => !existingHashtagIds.includes(id));

    // Attach only new hashtags
    if (newHashtagIds.length > 0) {
      await this.prisma.resPostHashtag.createMany({
        data: newHashtagIds.map((hashtagId) => ({
          post_id: postId,
          hashtag_id: hashtagId,
        })),
      });

      // Update post_count only for newly attached hashtags
      await Promise.all(
        newHashtagIds.map((hashtagId) =>
          this.prisma.resHashtag.update({
            where: { id: hashtagId },
            data: { post_count: { increment: 1 } },
          }),
        ),
      );
    }

    // Invalidate cache
    await this.cacheService.delPattern(`hashtag:${postId}:*`);
    await this.cacheService.delPattern('hashtags:trending:*');

    return { success: true };
  }

  async detachHashtag(user_id: string, postId: string, hashtagId: string) {
    // Verify post ownership
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId },
      select: { user_id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user_id !== user_id) {
      throw new ForbiddenException('You can only detach hashtags from your own posts');
    }

    try {
      await this.prisma.resPostHashtag.delete({
        where: {
          post_id_hashtag_id: {
            post_id: postId,
            hashtag_id: hashtagId,
          },
        },
      });

      // Decrease post_count
      await this.prisma.resHashtag.update({
        where: { id: hashtagId },
        data: { post_count: { decrement: 1 } },
      });

      // Invalidate cache
      await this.cacheService.delPattern(`hashtag:${postId}:*`);
      await this.cacheService.delPattern('hashtags:trending:*');

      return { success: true };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Hashtag not attached to this post');
      }
      throw error;
    }
  }

  async getPostHashtags(postId: string) {
    const postHashtags = await this.prisma.resPostHashtag.findMany({
      where: { post_id: postId },
      include: {
        hashtag: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return postHashtags.map((ph) => ({
      id: ph.hashtag.id,
      name: ph.hashtag.name,
    }));
  }
}
