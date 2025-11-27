import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { LikePostDto } from '../dto/likes.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import { NotificationService } from '../../notifications/service/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class LikeService {
  private readonly logger = new Logger(LikeService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  async getLikes(postId: string, query?: BaseQueryDto, currentUserId?: string) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const cacheKey = `post:${postId}:likes:page:${page}:limit:${take}:user:${currentUserId || 'guest'}`;
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
                  bio: true,
                  gender: true,
                },
              },
            },
          }),
          this.prisma.resPostLike.count({
            where: { post_id: postId },
          }),
        ]);

        // Nếu có currentUserId, lấy thông tin relationship
        let relationshipData = null;
        if (currentUserId) {
          const likedUserIds = likes.map((like) => like.user_id);

          const [followings, friends, followers] = await Promise.all([
            // Users mà currentUser đang follow
            this.prisma.resFollow.findMany({
              where: {
                follower_id: currentUserId,
                following_id: { in: likedUserIds },
              },
              select: { following_id: true },
            }),
            // Users là bạn bè với currentUser (cả 2 đều follow nhau)
            this.prisma.resFriend.findMany({
              where: {
                OR: [
                  { user_a_id: currentUserId, user_b_id: { in: likedUserIds } },
                  { user_b_id: currentUserId, user_a_id: { in: likedUserIds } },
                ],
              },
              select: { user_a_id: true, user_b_id: true },
            }),
            // Users đang follow currentUser (followers)
            this.prisma.resFollow.findMany({
              where: {
                following_id: currentUserId,
                follower_id: { in: likedUserIds },
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

        // Format response với relationship status
        const formattedLikes = likes.map((like) => {
          if (relationshipData && currentUserId !== like.user_id) {
            return {
              ...like,
              user: {
                ...like.user,
                is_following: relationshipData.followingIds.has(like.user_id),
                is_friend: relationshipData.friendIds.has(like.user_id),
                is_follower: relationshipData.followerIds.has(like.user_id),
              },
            };
          }
          return like;
        });

        const response = buildPaginatedResponse(formattedLikes, total, page, take);

        // Thêm message khi không có dữ liệu
        if (total === 0) {
          this.logger.log(`No likes found for post ${postId}`);
          return {
            ...response,
            message: 'No one has liked this post yet',
          };
        }

        return response;
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

  /**
   * Like một bài viết
   * @param userId - ID của user đang like
   * @param postId - ID của bài viết được like
   * @param dto - DTO chứa reaction type (like, love, haha, etc.)
   * @returns Thông tin like đã tạo/cập nhật
   */
  async likePost(userId: string, postId: string, dto: LikePostDto) {
    // Kiểm tra bài viết có tồn tại không
    // findUnique tìm 1 record duy nhất theo primary key hoặc unique field
    const post = await this.prisma.resPost.findUnique({
      where: { id: postId }, // Tìm post theo ID
    });

    // Nếu không tìm thấy post, throw exception
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Kiểm tra user đã like bài viết này chưa
    // post_id_user_id là composite unique key (mỗi user chỉ có thể like 1 lần mỗi post)
    const existingLike = await this.prisma.resPostLike.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId, // ID của post
          user_id: userId, // ID của user
        },
      },
    });

    // Nếu reaction giống nhau (ví dụ: đã like rồi, like lại) => toggle (bỏ like)
    if (existingLike && existingLike.reaction === dto.reaction) {
      // Xóa like khỏi database
      await this.prisma.resPostLike.delete({
        where: {
          id: existingLike.id, // Xóa theo ID của like record
        },
      });

      // Xóa cache liên quan đến likes của post này
      // delPattern xóa tất cả cache key có pattern `post:${postId}:likes:*`
      await this.cacheService.delPattern(`post:${postId}:likes:*`);
      // Xóa cache thống kê likes (tổng số likes, số lượng mỗi reaction)
      await this.cacheService.del(`post:${postId}:like:stats`);

      // Trả về thông báo đã bỏ like
      return { message: 'Like removed', liked: false };
    }

    // Nếu đã like với reaction khác => update reaction
    // Nếu chưa like => tạo like mới
    let like;
    if (existingLike) {
      // Update reaction
      like = await this.prisma.resPostLike.update({
        where: { id: existingLike.id },
        data: { reaction: dto.reaction },
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
      // Create new like
      like = await this.prisma.resPostLike.create({
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
    }

    // Xóa cache để đảm bảo dữ liệu mới nhất
    await this.cacheService.delPattern(`post:${postId}:likes:*`);
    await this.cacheService.del(`post:${postId}:like:stats`);

    // Tự động tạo notification cho chủ bài viết (nếu không phải chủ bài viết tự like)
    // Kiểm tra: nếu user like không phải là chủ bài viết thì mới gửi notification
    if (post.user_id !== userId) {
      try {
        // Tạo notification cho chủ bài viết
        await this.notificationService.createNotification({
          user_id: post.user_id, // Chủ bài viết nhận notification
          sender_id: userId, // Người like (user đang thực hiện hành động)
          type: NotificationType.LIKE, // Loại notification là LIKE
          title: 'New Like', // Tiêu đề notification
          content: 'liked your post', // Content đơn giản, frontend sẽ ghép với sender.nickname
          link: `/posts/${postId}`, // Link đến bài viết được like
          data: JSON.stringify({ post_id: postId, like_id: like.id }), // Dữ liệu bổ sung dạng JSON
        });
      } catch (error) {
        // Log error nhưng không fail like action
        // Nếu tạo notification fail, like vẫn thành công (graceful degradation)
        this.logger.error(`Failed to create notification for like: ${error.message}`);
      }
    }

    // Trả về thông tin like đã tạo
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
