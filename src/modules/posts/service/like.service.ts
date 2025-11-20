import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { LikePostDto } from '../dto/likes.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class LikeService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getLikes(postId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `post:${postId}:likes:page:${page}:limit:${take}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Check if post exists
        const post = await this.prisma.resPost.findUnique({
          where: { id: postId },
        });

        if (!post) {
          throw new NotFoundException('Post not found');
        }

        const [likes, total] = await Promise.all([
          this.prisma.resPostLike.findMany({
            where: { post_id: postId },
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
            },
          }),
          this.prisma.resPostLike.count({
            where: { post_id: postId },
          }),
        ]);

        return buildPaginatedResponse(likes, total, page, take);
      },
      cacheTtl,
    );
  }

  async getLikeStats(postId: string) {
    const cacheKey = `post:${postId}:like:stats`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Check if post exists
        const post = await this.prisma.resPost.findUnique({
          where: { id: postId },
        });

        if (!post) {
          throw new NotFoundException('Post not found');
        }

        const stats = await this.prisma.resPostLike.groupBy({
          by: ['reaction'],
          where: { post_id: postId },
          _count: {
            reaction: true,
          },
        });

        const result: Record<string, number> = {};
        stats.forEach((stat) => {
          result[stat.reaction] = stat._count.reaction;
        });

        return {
          total: await this.prisma.resPostLike.count({
            where: { post_id: postId },
          }),
          reactions: result,
        };
      },
      cacheTtl,
    );
  }

  async likePost(userId: string, postId: string, dto: LikePostDto) {
    // Check if post exists
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked this post
    const existingLike = await this.prisma.resPostLike.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: userId,
        },
      },
    });

    if (existingLike) {
      // If same reaction, remove like (toggle)
      if (existingLike.reaction === dto.reaction) {
        await this.prisma.resPostLike.delete({
          where: {
            id: existingLike.id,
          },
        });

        // Invalidate cache
        await this.cacheService.delPattern(`post:${postId}:likes:*`);
        await this.cacheService.del(`post:${postId}:like:stats`);

        return { message: 'Like removed', liked: false };
      } else {
        // Update reaction
        const updated = await this.prisma.resPostLike.update({
          where: {
            id: existingLike.id,
          },
          data: {
            reaction: dto.reaction,
          },
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

        // Invalidate cache
        await this.cacheService.delPattern(`post:${postId}:likes:*`);
        await this.cacheService.del(`post:${postId}:like:stats`);

        return { ...updated, liked: true };
      }
    }

    // Create new like
    const like = await this.prisma.resPostLike.create({
      data: {
        post_id: postId,
        user_id: userId,
        reaction: dto.reaction,
      },
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

    // Invalidate cache
    await this.cacheService.delPattern(`post:${postId}:likes:*`);
    await this.cacheService.del(`post:${postId}:like:stats`);

    return { ...like, liked: true };
  }

  async unlikePost(userId: string, postId: string) {
    try {
      await this.prisma.resPostLike.delete({
        where: {
          post_id_user_id: {
            post_id: postId,
            user_id: userId,
          },
        },
      });

      // Invalidate cache
      await this.cacheService.delPattern(`post:${postId}:likes:*`);
      await this.cacheService.del(`post:${postId}:like:stats`);

      return { message: 'Like removed' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Like not found');
      }
      throw error;
    }
  }

  async checkUserLiked(userId: string, postId: string) {
    const like = await this.prisma.resPostLike.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: userId,
        },
      },
    });

    return {
      liked: !!like,
      reaction: like?.reaction || null,
    };
  }
}
