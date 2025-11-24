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
                },
              },
              media: {
                orderBy: { order: 'asc' },
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

        return buildPaginatedResponse(posts, total, page, take);
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

        return post;
      },
      cacheTtl,
    );
  }

  async createPost(userId: string, dto: CreatePostDto) {
    const post = await this.prisma.resPost.create({
      data: { user_id: userId, content: dto.content },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // Emit live update cho followers
    try {
      // Lấy danh sách followers
      const followers = await this.prisma.resFollow.findMany({
        where: { following_id: userId },
        select: { follower_id: true },
      });

      // Emit update đến từng follower
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

    // Invalidate cache khi tạo post mới
    await this.cacheService.delPattern(`posts:${userId}:*`);
    await this.cacheService.del(`connections:${userId}:stats`);
    await this.cacheService.del(`post:${post.id}:media`); // Post media cache

    return post;
  }

  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    try {
      let post;
      if (dto.content === undefined) {
        // Nếu không có content, cần lấy giá trị hiện tại
        const existing = await this.prisma.resPost.findFirst({
          where: { id: postId, user_id: userId },
          select: { content: true },
        });
        if (!existing) throw new NotFoundException('Post not found');
        post = await this.prisma.resPost.update({
          where: { id: postId },
          data: { content: existing.content },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        });
      } else {
        post = await this.prisma.resPost.update({
          where: { id: postId, user_id: userId },
          data: { content: dto.content },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        });
      }

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

      // Invalidate cache khi update post
      await this.cacheService.delPattern(`posts:${userId}:*`);
      await this.cacheService.del(`post:${postId}:media`); // Post media cache

      return post;
    } catch (error) {
      if (error.code === 'P2025') {
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
