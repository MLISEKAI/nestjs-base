import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comments.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async getComments(postId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Check if post exists
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [comments, total] = await Promise.all([
      this.prisma.resComment.findMany({
        where: { post_id: postId, parent_id: null }, // Only top-level comments
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
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      this.prisma.resComment.count({
        where: { post_id: postId, parent_id: null },
      }),
    ]);

    const formattedComments = comments.map((comment) => ({
      ...comment,
      replies_count: comment._count.replies,
      _count: undefined,
    }));

    return buildPaginatedResponse(formattedComments, total, page, take);
  }

  async getCommentReplies(commentId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [replies, total] = await Promise.all([
      this.prisma.resComment.findMany({
        where: { parent_id: commentId },
        take,
        skip,
        orderBy: { created_at: 'asc' },
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
      this.prisma.resComment.count({
        where: { parent_id: commentId },
      }),
    ]);

    return buildPaginatedResponse(replies, total, page, take);
  }

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    // Check if post exists
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If parent_id is provided, check if parent comment exists
    if (dto.parent_id) {
      const parentComment = await this.prisma.resComment.findUnique({
        where: { id: dto.parent_id },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.resComment.create({
      data: {
        post_id: postId,
        user_id: userId,
        content: dto.content,
        parent_id: dto.parent_id || null,
      },
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
            replies: true,
          },
        },
      },
    });

    return {
      ...comment,
      replies_count: comment._count.replies,
      _count: undefined,
    };
  }

  async updateComment(userId: string, commentId: string, dto: UpdateCommentDto) {
    try {
      const comment = await this.prisma.resComment.update({
        where: {
          id: commentId,
          user_id: userId, // Only owner can update
        },
        data: {
          content: dto.content,
        },
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
              replies: true,
            },
          },
        },
      });

      return {
        ...comment,
        replies_count: comment._count.replies,
        _count: undefined,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Comment not found or you do not have permission to update it');
      }
      throw error;
    }
  }

  async deleteComment(userId: string, commentId: string) {
    try {
      await this.prisma.resComment.delete({
        where: {
          id: commentId,
          user_id: userId, // Only owner can delete
        },
      });

      return { message: 'Comment deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Comment not found or you do not have permission to delete it');
      }
      throw error;
    }
  }
}
