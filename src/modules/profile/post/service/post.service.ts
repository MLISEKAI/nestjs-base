import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostDto, CreatePostDto, UpdatePostDto } from '../dto/posts.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';
import { WebSocketGateway } from '../../../realtime/gateway/websocket.gateway';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  async getPosts(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [posts, total] = await Promise.all([
      this.prisma.resPost.findMany({
        where: { user_id: userId },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resPost.count({ where: { user_id: userId } }),
    ]);

    return buildPaginatedResponse(posts, total, page, take);
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

      return { message: 'Post deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }
}
