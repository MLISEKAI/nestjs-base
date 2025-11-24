import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class CommunityFeedService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getCategories() {
    const cacheKey = 'community:categories';
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy top hashtags có nhiều bài viết nhất
        const hashtags = await this.prisma.resHashtag.findMany({
          take: 20,
          orderBy: { post_count: 'desc' },
          select: {
            id: true,
            name: true,
            post_count: true,
            cover_image: true,
          },
        });

        return hashtags.map((h) => ({
          id: h.id,
          name: h.name,
          hashtag: `#${h.name}`,
          postCount: h.post_count,
          coverImage: h.cover_image,
        }));
      },
      cacheTtl,
    );
  }

  async getCategory(id: string) {
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
      throw new NotFoundException('Category not found');
    }

    return {
      id: hashtag.id,
      name: hashtag.name,
      hashtag: `#${hashtag.name}`,
      postCount: hashtag.post_count,
      viewCount: hashtag.view_count,
      coverImage: hashtag.cover_image,
      description: `Các bài viết về ${hashtag.name}`,
    };
  }

  async getCommunityFeed(userId: string, query?: BaseQueryDto) {
    const take = Math.min(query?.limit && query.limit > 0 ? query.limit : 20, 50); // Max 50
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `community:feed:${userId}:page:${page}:limit:${take}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy hot topics
        const hotTopics = await this.prisma.resHashtag.findMany({
          take: 10,
          orderBy: { post_count: 'desc' },
          select: {
            id: true,
            name: true,
            post_count: true,
            cover_image: true,
            view_count: true,
          },
        });

        // Tính engagement score (dựa trên post_count và view_count)
        const formattedHotTopics = hotTopics.map((h) => {
          const engagementScore = Math.min(
            100,
            (h.post_count / 1000) * 10 + (h.view_count / 10000) * 5,
          );
          return {
            id: h.id,
            hashtag: `#${h.name}`,
            post_count: h.post_count,
            thumbnail_url: h.cover_image,
            engagement_score: Math.round(engagementScore * 10) / 10,
          };
        });

        // Lấy posts (public only)
        const where: any = {
          privacy: 'public',
        };

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
        let userLikes: string[] = [];
        if (userId && postIds.length > 0) {
          const likes = await this.prisma.resPostLike.findMany({
            where: {
              post_id: { in: postIds },
              user_id: userId,
            },
            select: { post_id: true },
          });
          userLikes = likes.map((l) => l.post_id);
        }

        const formattedPosts = posts.map((post) => ({
          id: post.id,
          user: {
            id: post.user.id,
            username: post.user.nickname,
            display_name: post.user.nickname,
            avatar_url: post.user.avatar,
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

        return {
          hot_topics: formattedHotTopics,
          ...buildPaginatedResponse(formattedPosts, total, page, take),
        };
      },
      cacheTtl,
    );
  }

  async getPosts(categoryId?: string, query?: BaseQueryDto, userId?: string) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `community:posts:${categoryId || 'all'}:page:${page}:limit:${take}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const where: any = {
          privacy: 'public', // Chỉ lấy public posts
        };

        // Nếu có categoryId, lọc theo hashtag
        if (categoryId) {
          where.hashtags = {
            some: {
              hashtag_id: categoryId,
            },
          };
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
                take: 5, // Giới hạn số media
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
                take: 5,
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
        let userLikes: string[] = [];
        if (userId && postIds.length > 0) {
          const likes = await this.prisma.resPostLike.findMany({
            where: {
              post_id: { in: postIds },
              user_id: userId,
            },
            select: { post_id: true },
          });
          userLikes = likes.map((l) => l.post_id);
        }

        const formattedPosts = posts.map((post) => ({
          id: post.id,
          user: {
            id: post.user.id,
            username: post.user.nickname,
            display_name: post.user.nickname,
            avatar_url: post.user.avatar,
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

  async getPost(id: string, userId?: string) {
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

    // Check if user liked
    let isLiked = false;
    if (userId) {
      const like = await this.prisma.resPostLike.findUnique({
        where: {
          post_id_user_id: {
            post_id: id,
            user_id: userId,
          },
        },
      });
      isLiked = !!like;
    }

    return {
      id: post.id,
      title: post.content.substring(0, 100),
      content: post.content,
      author: {
        id: post.user.id,
        name: post.user.nickname,
        avatar: post.user.avatar,
      },
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
      hashtags: post.hashtags.map((ph) => ({
        id: ph.hashtag.id,
        name: ph.hashtag.name,
      })),
      images: post.media.filter((m) => m.media_type === 'image').map((m) => m.media_url),
      isLiked,
    };
  }
}
