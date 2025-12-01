// Import các decorator và class từ NestJS để tạo service
import { Injectable, NotFoundException, Inject, forwardRef, Optional } from '@nestjs/common';
// Import PrismaService để thao tác với database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để quản lý Redis cache
import { CacheService } from 'src/common/cache/cache.service';
// Import các DTO để validate và type-check dữ liệu
import { PostDto, CreatePostDto, UpdatePostDto } from '../dto/posts.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import utility function để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
// Import WebSocketGateway để gửi real-time updates
import { WebSocketGateway } from '../../realtime/gateway/websocket.gateway';

/**
 * @Injectable() - Decorator đánh dấu class này là một NestJS service, có thể được inject vào các class khác
 * PostService - Service xử lý tất cả logic liên quan đến posts
 */
@Injectable()
export class PostService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các service này khi tạo instance của PostService
   */
  constructor(
    // PrismaService - Service để thao tác với database (CRUD operations)
    private prisma: PrismaService,
    // CacheService - Service để quản lý Redis cache (get, set, delete cache)
    private cacheService: CacheService,
    // @Inject(forwardRef()) - Dùng forwardRef để tránh circular dependency với WebSocketGateway
    // WebSocketGateway - Gateway để gửi real-time updates qua WebSocket
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  /**
   * Invalidate feed cache when post is created/updated/deleted
   */
  private async invalidateFeedCache(userId: string): Promise<void> {
    try {
      // Invalidate feed cache patterns
      await Promise.all([
        this.cacheService.delPattern(`feed:*:personalized:*`),
        this.cacheService.delPattern(`feed:*:following:*`),
        this.cacheService.delPattern(`feed:*:discover:*`),
        this.cacheService.delPattern(`feed:*:trending:*`),
        this.cacheService.del('feed:trending:global'),
      ]);
    } catch (error) {
      console.error('Failed to invalidate feed cache:', error);
    }
  }

  async getPosts(user_id: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `posts:${user_id}:page:${page}:limit:${take}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [posts, total] = await Promise.all([
          this.prisma.resPost.findMany({
            where: { user_id: user_id },
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
            take,
            skip,
            orderBy: { created_at: 'desc' },
          }),
          this.prisma.resPost.count({ where: { user_id: user_id } }),
        ]);

        // Format posts để match với PostDto
        const formattedPosts = posts.map((post) => ({
          ...post,
          media: (post.media || []).map((m) => ({
            id: m.id,
            media_url: m.media_url,
            thumbnail_url: m.thumbnail_url,
            media_type: m.media_type,
            width: m.width,
            height: m.height,
            order: m.order,
          })),
          hashtags: (post.hashtags || []).map((ph) => ({
            id: ph.hashtag.id,
            name: ph.hashtag.name,
          })),
          like_count: post._count?.likes || 0,
          comment_count: post._count?.comments || 0,
        }));

        return buildPaginatedResponse(formattedPosts, total, page, take);
      },
      cacheTtl,
    );
  }

  /**
   * Tạo post mới với media và hashtags
   * @param user_id - ID của user đang tạo post
   * @param dto - DTO chứa thông tin post (content, media, hashtags, privacy)
   * @returns Post đã tạo với đầy đủ relations (user, media, hashtags, counts)
   */
  async createPost(user_id: string, dto: CreatePostDto) {
    // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
    // Nếu bất kỳ operation nào fail, tất cả sẽ được rollback
    const post = await this.prisma.$transaction(async (tx) => {
      // Bước 1: Tạo post mới trong database
      const newPost = await tx.resPost.create({
        data: {
          user_id: user_id, // ID của user đang tạo post
          content: dto.content || '', // Nội dung post (có thể để trống nếu chỉ có media)
          privacy: dto.privacy || 'public', // Quyền riêng tư (public, friends, private)
        },
      });

      // Bước 2: Xử lý media (ảnh, video, audio) nếu có
      if (dto.media && dto.media.length > 0) {
        // Sử dụng Promise.all để tạo tất cả media records song song (parallel)
        await Promise.all(
          dto.media.map((media, index) =>
            tx.resPostMedia.create({
              data: {
                post_id: newPost.id, // Link media với post vừa tạo
                media_url: media.media_url, // URL của media file (từ Cloudinary)
                media_type: media.media_type, // Loại media (image, video, audio)
                thumbnail_url: media.thumbnail_url, // URL của thumbnail (cho video)
                width: media.width, // Chiều rộng (cho ảnh/video)
                height: media.height, // Chiều cao (cho ảnh/video)
                order: media.order !== undefined ? media.order : index, // Thứ tự hiển thị (nếu không có thì dùng index)
              },
            }),
          ),
        );
      }

      // Bước 3: Xử lý hashtags nếu có
      if (dto.hashtags && dto.hashtags.length > 0) {
        // Dùng for...of thay vì Promise.all vì cần xử lý tuần tự (tìm hoặc tạo hashtag trước khi link)
        for (const hashtagName of dto.hashtags) {
          // Tìm hashtag đã tồn tại (case-insensitive, trim whitespace)
          let hashtag = await tx.resHashtag.findFirst({
            where: { name: hashtagName.toLowerCase().trim() },
          });

          // Nếu chưa có hashtag thì tạo mới
          if (!hashtag) {
            hashtag = await tx.resHashtag.create({
              data: { name: hashtagName.toLowerCase().trim() },
            });
          }

          // Link hashtag với post (tạo record trong bảng resPostHashtag)
          await tx.resPostHashtag.create({
            data: {
              post_id: newPost.id, // ID của post
              hashtag_id: hashtag.id, // ID của hashtag
            },
          });
        }
      }

      // Lấy post với relations
      return tx.resPost.findUnique({
        where: { id: newPost.id },
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
      });
    });

    // Emit live update cho followers
    try {
      const followers = await this.prisma.resFollow.findMany({
        where: { following_id: user_id },
        select: { follower_id: true },
      });

      followers.forEach((follow) => {
        this.websocketGateway.emitLiveUpdate(follow.follower_id, {
          type: 'POST_CREATED',
          post: {
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            user: post.user,
            createdAt: post.created_at,
          },
        });
      });
    } catch (error) {
      console.error('Failed to emit live update for post:', error);
    }

    // Invalidate cache
    await this.cacheService.delPattern(`posts:${user_id}:*`);
    await this.cacheService.del(`connections:${user_id}:stats`);
    await this.cacheService.del(`post:${post.id}`);
    
    // Invalidate feed cache
    await this.invalidateFeedCache(user_id);

    // Format response
    return {
      ...post,
      media: (post.media || []).map((m) => ({
        id: m.id,
        media_url: m.media_url,
        thumbnail_url: m.thumbnail_url,
        media_type: m.media_type,
        width: m.width,
        height: m.height,
        order: m.order,
      })),
      hashtags: (post.hashtags || []).map((ph) => ({
        id: ph.hashtag.id,
        name: ph.hashtag.name,
      })),
      like_count: post._count?.likes || 0,
      comment_count: post._count?.comments || 0,
    };
  }

  async updatePost(user_id: string, postId: string, dto: UpdatePostDto) {
    try {
      // Kiểm tra post tồn tại và thuộc về user
      const existing = await this.prisma.resPost.findFirst({
        where: { id: postId, user_id: user_id },
      });

      if (!existing) {
        throw new NotFoundException('Post not found');
      }

      // Update post với media và hashtags
      const post = await this.prisma.$transaction(async (tx) => {
        // Update post data
        const updateData: any = {};
        if (dto.content !== undefined) updateData.content = dto.content;
        if (dto.privacy !== undefined) updateData.privacy = dto.privacy;

        const updatedPost = await tx.resPost.update({
          where: { id: postId },
          data: updateData,
        });

        // Xử lý media - thay thế toàn bộ media cũ
        if (dto.media !== undefined) {
          // Xóa tất cả media cũ
          await tx.resPostMedia.deleteMany({
            where: { post_id: postId },
          });

          // Tạo media mới
          if (dto.media.length > 0) {
            await Promise.all(
              dto.media.map((media, index) =>
                tx.resPostMedia.create({
                  data: {
                    post_id: postId,
                    media_url: media.media_url,
                    media_type: media.media_type,
                    thumbnail_url: media.thumbnail_url,
                    width: media.width,
                    height: media.height,
                    order: media.order !== undefined ? media.order : index,
                  },
                }),
              ),
            );
          }
        }

        // Xử lý hashtags - thay thế toàn bộ hashtags cũ
        if (dto.hashtags !== undefined) {
          // Xóa tất cả hashtags cũ
          await tx.resPostHashtag.deleteMany({
            where: { post_id: postId },
          });

          // Tạo hashtags mới
          if (dto.hashtags.length > 0) {
            for (const hashtagName of dto.hashtags) {
              // Tìm hoặc tạo hashtag
              let hashtag = await tx.resHashtag.findFirst({
                where: { name: hashtagName.toLowerCase().trim() },
              });

              if (!hashtag) {
                hashtag = await tx.resHashtag.create({
                  data: { name: hashtagName.toLowerCase().trim() },
                });
              }

              // Link hashtag với post
              await tx.resPostHashtag.create({
                data: {
                  post_id: postId,
                  hashtag_id: hashtag.id,
                },
              });
            }
          }
        }

        // Lấy post với relations
        return tx.resPost.findUnique({
          where: { id: postId },
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
        });
      });

      // Emit live update
      try {
        const followers = await this.prisma.resFollow.findMany({
          where: { following_id: user_id },
          select: { follower_id: true },
        });

        followers.forEach((follow) => {
          this.websocketGateway.emitLiveUpdate(follow.follower_id, {
            type: 'POST_UPDATED',
            post: {
              id: post.id,
              user_id: post.user_id,
              content: post.content,
              user: post.user,
              createdAt: post.created_at,
            },
          });
        });
      } catch (error) {
        console.error('Failed to emit live update for post update:', error);
      }

      // Invalidate cache
      await this.cacheService.delPattern(`posts:${user_id}:*`);
      await this.cacheService.del(`post:${postId}`);
      
      // Invalidate feed cache
      await this.invalidateFeedCache(user_id);

      // Format response
      return {
        ...post,
        media: (post.media || []).map((m) => ({
          id: m.id,
          media_url: m.media_url,
          thumbnail_url: m.thumbnail_url,
          media_type: m.media_type,
          width: m.width,
          height: m.height,
          order: m.order,
        })),
        hashtags: (post.hashtags || []).map((ph) => ({
          id: ph.hashtag.id,
          name: ph.hashtag.name,
        })),
        like_count: post._count?.likes || 0,
        comment_count: post._count?.comments || 0,
      };
    } catch (error) {
      if (error.code === 'P2025' || error instanceof NotFoundException) {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }

  async deletePost(user_id: string, postId: string) {
    try {
      await this.prisma.resPost.delete({
        where: { id: postId, user_id: user_id },
      });

      // Emit live update
      try {
        const followers = await this.prisma.resFollow.findMany({
          where: { following_id: user_id },
          select: { follower_id: true },
        });

        followers.forEach((follow) => {
          this.websocketGateway.emitLiveUpdate(follow.follower_id, {
            type: 'POST_DELETED',
            postId: postId,
            user_id: user_id,
          });
        });
      } catch (error) {
        console.error('Failed to emit live update for post delete:', error);
      }

      // Invalidate cache khi delete post
      await this.cacheService.delPattern(`posts:${user_id}:*`);
      await this.cacheService.del(`post:${postId}:media`); // Post media cache
      await this.cacheService.delPattern(`post:${postId}:likes:*`); // Post likes cache
      await this.cacheService.del(`post:${postId}:like:stats`); // Post like stats cache
      await this.cacheService.delPattern(`post:${postId}:comments:*`); // Post comments cache
      
      // Invalidate feed cache
      await this.invalidateFeedCache(user_id);

      return { message: 'Post deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }

  async getFeed(user_id: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `feed:${user_id}:page:${page}:limit:${take}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy danh sách users mà user đang follow
        const following = await this.prisma.resFollow.findMany({
          where: { follower_id: user_id },
          select: { following_id: true },
        });
        const followingIds = following.map((f) => f.following_id);
        followingIds.push(user_id); // Bao gồm cả posts của chính user

        // Lấy posts từ users đang follow (chỉ public hoặc friends)
        const where: any = {
          user_id: { in: followingIds },
          OR: [{ privacy: 'public' }, { privacy: 'friends' }],
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
                take: 5,
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
        const likes = await this.prisma.resPostLike.findMany({
          where: {
            post_id: { in: postIds },
            user_id: user_id,
          },
          select: { post_id: true },
        });
        const userLikes = likes.map((l) => l.post_id);

        const formattedPosts = posts.map((post) => ({
          post_id: post.id,
          user: {
            id: post.user.id,
            username: post.user.nickname,
            avatar_url: post.user.avatar,
          },
          content: post.content,
          media: post.media.map((m) => ({
            type: m.media_type,
            url: m.media_url,
            thumbnail: m.thumbnail_url,
          })),
          tags: post.hashtags.map((ph) => ({
            id: ph.hashtag.id,
            name: ph.hashtag.name,
          })),
          visibility: post.privacy,
          created_at: post.created_at,
          like_count: post._count.likes,
          comment_count: post._count.comments,
          is_liked: userLikes.includes(post.id),
        }));

        return buildPaginatedResponse(formattedPosts, total, page, take);
      },
      cacheTtl,
    );
  }

  async getPostById(postId: string, user_id?: string) {
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId },
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
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check privacy
    if (post.privacy === 'private' && post.user_id !== user_id) {
      throw new NotFoundException('Post not found');
    }

    // Check if user liked
    let isLiked = false;
    if (user_id) {
      const like = await this.prisma.resPostLike.findUnique({
        where: {
          post_id_user_id: {
            post_id: postId,
            user_id: user_id,
          },
        },
      });
      isLiked = !!like;
    }

    return {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      privacy: post.privacy,
      share_count: post.share_count,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user: post.user,
      media: post.media,
      hashtags: post.hashtags.map((ph) => ({
        id: ph.hashtag.id,
        name: ph.hashtag.name,
      })),
      like_count: post._count.likes,
      comment_count: post._count.comments,
      is_liked: isLiked,
    };
  }
}
