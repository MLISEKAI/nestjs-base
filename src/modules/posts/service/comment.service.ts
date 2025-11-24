import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comments.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import { NotificationService } from '../../notifications/service/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  async getComments(postId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `post:${postId}:comments:page:${page}:limit:${take}`;
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
      },
      cacheTtl,
    );
  }

  async getCommentReplies(commentId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `comment:${commentId}:replies:page:${page}:limit:${take}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      cacheTtl,
    );
  }

  /**
   * Tạo comment mới cho một bài viết
   * @param userId - ID của user đang comment
   * @param postId - ID của bài viết được comment
   * @param dto - DTO chứa nội dung comment và parent_id (nếu là reply)
   * @returns Thông tin comment đã tạo
   */
  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    // Kiểm tra bài viết có tồn tại không
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId }, // Tìm post theo ID
    });

    // Nếu không tìm thấy post, throw exception
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Nếu có parent_id (là reply comment), kiểm tra parent comment có tồn tại không
    let parentComment = null;
    if (dto.parent_id) {
      // Tìm parent comment theo ID
      parentComment = await this.prisma.resComment.findUnique({
        where: { id: dto.parent_id },
      });

      // Nếu không tìm thấy parent comment, throw exception
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    // Tạo comment mới trong database
    const comment = await this.prisma.resComment.create({
      data: {
        post_id: postId, // ID của bài viết
        user_id: userId, // ID của user đang comment
        content: dto.content, // Nội dung comment
        parent_id: dto.parent_id || null, // ID của comment cha (null nếu là top-level comment)
      },
      include: {
        // Include thông tin user để trả về trong response
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        // Include _count để đếm số lượng replies của comment này
        _count: {
          select: {
            replies: true, // Đếm số lượng comment con (replies)
          },
        },
      },
    });

    // Xóa cache liên quan đến comments của post này
    // delPattern xóa tất cả cache key có pattern `post:${postId}:comments:*`
    await this.cacheService.delPattern(`post:${postId}:comments:*`);
    // Nếu là reply, cũng xóa cache của parent comment
    if (dto.parent_id) {
      await this.cacheService.delPattern(`comment:${dto.parent_id}:replies:*`);
    }

    // Tự động tạo notification cho các user liên quan
    try {
      // Lấy thông tin nickname của user đang comment để hiển thị trong notification
      const sender = await this.prisma.resUser.findUnique({
        where: { id: userId },
        select: { nickname: true }, // Chỉ lấy nickname để tối ưu
      });

      // Nếu là reply (có parent_id), gửi notification cho người comment cha
      // Ví dụ: User A comment, User B reply => User A nhận notification
      if (dto.parent_id && parentComment) {
        // Chỉ gửi nếu người reply không phải là người comment cha (tránh tự thông báo cho mình)
        if (parentComment.user_id !== userId) {
          await this.notificationService.createNotification({
            user_id: parentComment.user_id, // Người comment cha nhận notification
            sender_id: userId, // Người reply (user đang thực hiện hành động)
            type: NotificationType.COMMENT, // Loại notification là COMMENT
            title: 'New Reply', // Tiêu đề
            content: sender?.nickname
              ? `${sender.nickname} replied to your comment` // Nếu có nickname
              : 'Someone replied to your comment', // Không có thì dùng "Someone"
            link: `/posts/${postId}/comments/${comment.id}`, // Link đến comment
            data: JSON.stringify({
              post_id: postId,
              comment_id: comment.id,
              parent_id: dto.parent_id,
            }), // Dữ liệu bổ sung
          });
        }
      }

      // Gửi notification cho chủ bài viết (nếu không phải chủ bài viết tự comment)
      // Điều kiện:
      // 1. post.user_id !== userId: Chủ bài viết không phải là người comment
      // 2. (!dto.parent_id || parentComment.user_id !== post.user_id):
      //    - Nếu là top-level comment (không có parent_id) => gửi cho chủ bài viết
      //    - Nếu là reply nhưng người comment cha không phải chủ bài viết => gửi cho chủ bài viết
      //    (Nếu người comment cha là chủ bài viết thì đã gửi notification ở trên rồi, không cần gửi lại)
      if (post.user_id !== userId && (!dto.parent_id || parentComment.user_id !== post.user_id)) {
        await this.notificationService.createNotification({
          user_id: post.user_id, // Chủ bài viết nhận notification
          sender_id: userId, // Người comment (user đang thực hiện hành động)
          type: NotificationType.COMMENT, // Loại notification là COMMENT
          title: 'New Comment', // Tiêu đề
          content: sender?.nickname
            ? `${sender.nickname} commented on your post` // Nếu có nickname
            : 'Someone commented on your post', // Không có thì dùng "Someone"
          link: `/posts/${postId}/comments/${comment.id}`, // Link đến comment
          data: JSON.stringify({ post_id: postId, comment_id: comment.id }), // Dữ liệu bổ sung
        });
      }
    } catch (error) {
      // Log error nhưng không fail comment action
      // Nếu tạo notification fail, comment vẫn thành công (graceful degradation)
      this.logger.error(`Failed to create notification for comment: ${error.message}`);
    }

    // Trả về thông tin comment đã tạo
    // Loại bỏ _count khỏi response và thay bằng replies_count để response sạch hơn
    return {
      ...comment, // Spread tất cả properties của comment
      replies_count: comment._count.replies, // Thêm replies_count từ _count
      _count: undefined, // Xóa _count khỏi response
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

      // Invalidate cache
      await this.cacheService.delPattern(`post:${comment.post_id}:comments:*`);
      if (comment.parent_id) {
        await this.cacheService.delPattern(`comment:${comment.parent_id}:replies:*`);
      }

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
      // Get comment info before deleting to invalidate cache
      const comment = await this.prisma.resComment.findUnique({
        where: { id: commentId },
        select: { post_id: true, parent_id: true },
      });

      await this.prisma.resComment.delete({
        where: {
          id: commentId,
          user_id: userId, // Only owner can delete
        },
      });

      // Invalidate cache
      if (comment) {
        await this.cacheService.delPattern(`post:${comment.post_id}:comments:*`);
        if (comment.parent_id) {
          await this.cacheService.delPattern(`comment:${comment.parent_id}:replies:*`);
        }
      }

      return { message: 'Comment deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Comment not found or you do not have permission to delete it');
      }
      throw error;
    }
  }
}
