import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { PostDto, CreatePostDto, UpdatePostDto } from '../dto/posts.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import { WebSocketGateway } from '../../realtime/gateway/websocket.gateway';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  async getPosts(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `posts:${userId}:page:${page}:limit:${take}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [posts, total] = await Promise.all([
          this.prisma.resPost.findMany({
            where: { user_id: userId },
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
          this.prisma.resPost.count({ where: { user_id: userId } }),
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

  async getPostById(postId: string) {
    const cacheKey = `post:${postId}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const post = await this.prisma.resPost.findUnique({
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

        if (!post) {
          throw new NotFoundException('Post not found');
        }

        // Format post để match với PostDto
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
      },
      cacheTtl,
    );
  }

  async createPost(userId: string, dto: CreatePostDto) {
    // Tạo post với media và hashtags
    const post = await this.prisma.$transaction(async (tx) => {
      // Tạo post
      const newPost = await tx.resPost.create({
        data: {
          user_id: userId,
          content: dto.content || '',
          privacy: dto.privacy || 'public',
        },
      });

      // Xử lý media
      if (dto.media && dto.media.length > 0) {
        await Promise.all(
          dto.media.map((media, index) =>
            tx.resPostMedia.create({
              data: {
                post_id: newPost.id,
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

      // Xử lý hashtags
      if (dto.hashtags && dto.hashtags.length > 0) {
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
              post_id: newPost.id,
              hashtag_id: hashtag.id,
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
        where: { following_id: userId },
        select: { follower_id: true },
      });

      followers.forEach((follow) => {
        this.websocketGateway.emitLiveUpdate(follow.follower_id, {
          type: 'POST_CREATED',
          post: {
            id: post.id,
            userId: post.user_id,
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
    await this.cacheService.delPattern(`posts:${userId}:*`);
    await this.cacheService.del(`connections:${userId}:stats`);
    await this.cacheService.del(`post:${post.id}`);

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

  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    try {
      // Kiểm tra post tồn tại và thuộc về user
      const existing = await this.prisma.resPost.findFirst({
        where: { id: postId, user_id: userId },
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
          where: { following_id: userId },
          select: { follower_id: true },
        });

        followers.forEach((follow) => {
          this.websocketGateway.emitLiveUpdate(follow.follower_id, {
            type: 'POST_UPDATED',
            post: {
              id: post.id,
              userId: post.user_id,
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
      await this.cacheService.delPattern(`posts:${userId}:*`);
      await this.cacheService.del(`post:${postId}`);

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

  async deletePost(userId: string, postId: string) {
    try {
      await this.prisma.resPost.delete({
        where: { id: postId, user_id: userId },
      });

      // Emit live update
      try {
        const followers = await this.prisma.resFollow.findMany({
          where: { following_id: userId },
          select: { follower_id: true },
        });

        followers.forEach((follow) => {
          this.websocketGateway.emitLiveUpdate(follow.follower_id, {
            type: 'POST_DELETED',
            postId: postId,
            userId: userId,
          });
        });
      } catch (error) {
        console.error('Failed to emit live update for post delete:', error);
      }

      // Invalidate cache khi delete post
      await this.cacheService.delPattern(`posts:${userId}:*`);
      await this.cacheService.del(`post:${postId}:media`); // Post media cache
      await this.cacheService.delPattern(`post:${postId}:likes:*`); // Post likes cache
      await this.cacheService.del(`post:${postId}:like:stats`); // Post like stats cache
      await this.cacheService.delPattern(`post:${postId}:comments:*`); // Post comments cache

      return { message: 'Post deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }
}
