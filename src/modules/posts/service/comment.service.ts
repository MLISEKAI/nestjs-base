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

  async getComments(postId: string, query?: BaseQueryDto, currentUserId?: string) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `post:${postId}:comments:page:${page}:limit:${take}:user:${currentUserId || 'guest'}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Check if post exists
        const post = await this.prisma.resPost.findUnique({
          where: { id: postId },
          include: {
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
                  bio: true,
                },
              },
              media: {
                orderBy: { order: 'asc' },
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

        // Nếu có currentUserId, lấy thông tin quan hệ với các user đã comment
        let relationshipData = null;
        if (currentUserId) {
          const commentUserIds = comments.map((c) => c.user_id);

          const [followings, friends, followers] = await Promise.all([
            // Users mà currentUser đang follow
            this.prisma.resFollow.findMany({
              where: {
                follower_id: currentUserId,
                following_id: { in: commentUserIds },
              },
              select: { following_id: true },
            }),
            // Users là bạn bè với currentUser
            this.prisma.resFriend.findMany({
              where: {
                OR: [
                  { user_a_id: currentUserId, user_b_id: { in: commentUserIds } },
                  { user_b_id: currentUserId, user_a_id: { in: commentUserIds } },
                ],
              },
              select: { user_a_id: true, user_b_id: true },
            }),
            // Users đang follow currentUser
            this.prisma.resFollow.findMany({
              where: {
                following_id: currentUserId,
                follower_id: { in: commentUserIds },
              },
              select: { follower_id: true },
            }),
          ]);

          relationshipData = {
            followingIds: new Set(followings.map((f) => f.following_id)),
            friendIds: new Set(
              friends.flatMap((f) => [f.user_a_id, f.user_b_id]).filter((id) => id !== currentUserId),
            ),
            followerIds: new Set(followers.map((f) => f.follower_id)),
          };
        }

        const formattedComments = comments.map((comment) => {
          const baseComment = {
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            content: comment.content,
            parent_id: comment.parent_id,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            user: comment.user,
            media: comment.media,
            like_count: 0, // Comment likes not implemented yet
            replies_count: comment._count.replies,
            is_liked: false, // Comment likes not implemented yet
          };

          // Thêm relationship status nếu có currentUserId
          if (relationshipData && currentUserId !== comment.user_id) {
            return {
              ...baseComment,
              user: {
                ...comment.user,
                is_following: relationshipData.followingIds.has(comment.user_id),
                is_friend: relationshipData.friendIds.has(comment.user_id),
                is_follower: relationshipData.followerIds.has(comment.user_id),
              },
            };
          }

          return baseComment;
        });

        // Trả về comments với pagination
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
              media: {
                orderBy: { order: 'asc' },
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
   * @param user_id - ID của user đang comment
   * @param postId - ID của bài viết được comment
   * @param dto - DTO chứa nội dung comment và parent_id (nếu là reply)
   * @returns Thông tin comment đã tạo
   */
  async createComment(user_id: string, postId: string, dto: CreateCommentDto) {
    // Validate: comment phải có content hoặc media
    if (!dto.content && (!dto.media || dto.media.length === 0)) {
      throw new NotFoundException('Comment must have content or media');
    }

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
    let actualParentId = dto.parent_id; // ID thực tế sẽ dùng để lưu vào DB
    
    if (dto.parent_id) {
      // Tìm parent comment theo ID
      parentComment = await this.prisma.resComment.findUnique({
        where: { id: dto.parent_id },
      });

      // Nếu không tìm thấy parent comment, throw exception
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // Nếu parent comment cũng là reply (có parent_id)
      // thì lấy parent_id của nó làm actualParentId
      // => Tất cả replies đều ngang hàng ở cấp 2, không có cấp 3
      if (parentComment.parent_id) {
        actualParentId = parentComment.parent_id;
        // Cập nhật parentComment để notification gửi đúng người
        const rootComment = await this.prisma.resComment.findUnique({
          where: { id: actualParentId },
        });
        if (rootComment) {
          parentComment = rootComment;
        }
      }
    }

    // Tạo comment mới trong database với transaction
    const comment = await this.prisma.$transaction(async (tx) => {
      // Tạo comment
      const newComment = await tx.resComment.create({
        data: {
          post_id: postId, // ID của bài viết
          user_id: user_id, // ID của user đang comment
          content: dto.content || null, // Nội dung comment (có thể null nếu chỉ có media)
          parent_id: actualParentId || null, // ID của comment cha thực tế (đã được normalize về cấp 1)
        },
      });

      // Tạo media nếu có
      if (dto.media && dto.media.length > 0) {
        await Promise.all(
          dto.media.map((media, index) =>
            tx.resCommentMedia.create({
              data: {
                comment_id: newComment.id,
                media_url: media.media_url,
                media_type: media.media_type,
                thumbnail_url: media.thumbnail_url,
                width: media.width,
                height: media.height,
                duration: media.duration,
                order: media.order !== undefined ? media.order : index,
              },
            }),
          ),
        );
      }

      // Lấy comment với relations
      return tx.resComment.findUnique({
        where: { id: newComment.id },
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
              replies: true,
            },
          },
        },
      });
    });

    // Xóa cache liên quan đến comments của post này
    // delPattern xóa tất cả cache key có pattern `post:${postId}:comments:*`
    await this.cacheService.delPattern(`post:${postId}:comments:*`);
    // Nếu là reply, cũng xóa cache của parent comment (dùng actualParentId)
    if (actualParentId) {
      await this.cacheService.delPattern(`comment:${actualParentId}:replies:*`);
    }

    // Tự động tạo notification cho các user liên quan
    try {
      // Nếu là reply (có actualParentId), gửi notification cho người comment gốc (cấp 1)
      // Ví dụ: User A comment cấp 1, User B reply => User A nhận notification
      // Hoặc: User A comment cấp 1, User B reply cấp 2, User C reply vào B => User A vẫn nhận notification (giống Facebook)
      if (actualParentId && parentComment) {
        // Chỉ gửi nếu người reply không phải là người comment gốc (tránh tự thông báo cho mình)
        if (parentComment.user_id !== user_id) {
          await this.notificationService.createNotification({
            user_id: parentComment.user_id, // Người comment gốc (cấp 1) nhận notification
            sender_id: user_id, // Người reply (user đang thực hiện hành động)
            type: NotificationType.COMMENT, // Loại notification là COMMENT
            title: 'New Reply', // Tiêu đề
            content: 'replied to your comment', // Content đơn giản, frontend sẽ ghép với sender.nickname
            link: `/posts/${postId}/comments/${comment.id}`, // Link đến comment
            data: JSON.stringify({
              post_id: postId,
              comment_id: comment.id,
              parent_id: actualParentId,
            }), // Dữ liệu bổ sung
          });
        }
      }

      // Gửi notification cho chủ bài viết (nếu không phải chủ bài viết tự comment)
      // Điều kiện:
      // 1. post.user_id !== user_id: Chủ bài viết không phải là người comment
      // 2. (!actualParentId || parentComment.user_id !== post.user_id):
      //    - Nếu là top-level comment (không có actualParentId) => gửi cho chủ bài viết
      //    - Nếu là reply nhưng người comment gốc không phải chủ bài viết => gửi cho chủ bài viết
      //    (Nếu người comment gốc là chủ bài viết thì đã gửi notification ở trên rồi, không cần gửi lại)
      if (post.user_id !== user_id && (!actualParentId || parentComment.user_id !== post.user_id)) {
        await this.notificationService.createNotification({
          user_id: post.user_id, // Chủ bài viết nhận notification
          sender_id: user_id, // Người comment (user đang thực hiện hành động)
          type: NotificationType.COMMENT, // Loại notification là COMMENT
          title: 'New Comment', // Tiêu đề
          content: 'commented on your post', // Content đơn giản, frontend sẽ ghép với sender.nickname
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

  async updateComment(user_id: string, commentId: string, dto: UpdateCommentDto) {
    try {
      // Kiểm tra comment tồn tại và thuộc về user
      const existing = await this.prisma.resComment.findFirst({
        where: { id: commentId, user_id: user_id },
      });

      if (!existing) {
        throw new NotFoundException('Comment not found or you do not have permission to update it');
      }

      // Update comment với transaction
      const comment = await this.prisma.$transaction(async (tx) => {
        // Update comment data
        const updateData: any = {};
        if (dto.content !== undefined) updateData.content = dto.content;

        const updatedComment = await tx.resComment.update({
          where: { id: commentId },
          data: updateData,
        });

        // Xử lý media - thay thế toàn bộ media cũ
        if (dto.media !== undefined) {
          // Xóa tất cả media cũ
          await tx.resCommentMedia.deleteMany({
            where: { comment_id: commentId },
          });

          // Tạo media mới
          if (dto.media.length > 0) {
            await Promise.all(
              dto.media.map((media, index) =>
                tx.resCommentMedia.create({
                  data: {
                    comment_id: commentId,
                    media_url: media.media_url,
                    media_type: media.media_type,
                    thumbnail_url: media.thumbnail_url,
                    width: media.width,
                    height: media.height,
                    duration: media.duration,
                    order: media.order !== undefined ? media.order : index,
                  },
                }),
              ),
            );
          }
        }

        // Lấy comment với relations
        return tx.resComment.findUnique({
          where: { id: commentId },
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
                replies: true,
              },
            },
          },
        });
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
      if (error.code === 'P2025' || error instanceof NotFoundException) {
        throw new NotFoundException('Comment not found or you do not have permission to update it');
      }
      throw error;
    }
  }

  async deleteComment(user_id: string, commentId: string) {
    try {
      // Get comment info before deleting to invalidate cache
      const comment = await this.prisma.resComment.findUnique({
        where: { id: commentId },
        select: { post_id: true, parent_id: true },
      });

      await this.prisma.resComment.delete({
        where: {
          id: commentId,
          user_id: user_id, // Only owner can delete
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
