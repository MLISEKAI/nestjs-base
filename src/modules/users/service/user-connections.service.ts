// Import Injectable, exceptions, Inject, forwardRef và Logger từ NestJS
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import UserProfileService để xử lý user profile
import { UserProfileService } from './user-profile.service';
// Import DTO để validate và type-check dữ liệu
import { UserConnectionDto } from '../dto/connection-user.dto';
// Import utility function để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
// Import interfaces và types để type-check
import type { PaginationMeta } from '../../../common/interfaces/prisma.interface';
import type { IPaginatedResponse } from '../../../common/interfaces/pagination.interface';
import type { ResUser } from '@prisma/client';
// Import NotificationService với forwardRef để tránh circular dependency
import { NotificationService } from '../../notifications/service/notification.service';
import { NotificationType } from '@prisma/client';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * UserConnectionsService - Service xử lý business logic cho user connections (follow, unfollow, friends)
 *
 * Chức năng chính:
 * - Follow/unfollow users
 * - Lấy danh sách followers, following, friends
 * - Lấy connection stats (followers count, following count, friends count, posts count)
 * - Xử lý mutual follow (friends)
 * - Tạo notifications khi follow
 *
 * Lưu ý:
 * - Sử dụng forwardRef với NotificationService để tránh circular dependency
 * - Cache stats để tối ưu performance
 * - Tự động tạo friend relationship khi mutual follow
 */
@Injectable()
export class UserConnectionsService {
  // Logger để log các events và errors
  private readonly logger = new Logger(UserConnectionsService.name);

  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các services khi tạo instance của service
   * @Inject(forwardRef(() => NotificationService)) - Dùng forwardRef để tránh circular dependency
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private profile: UserProfileService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  async getStats(user_id: string) {
    const cacheKey = `connections:${user_id}:stats`;
    const cacheTtl = 300; // 5 phút (stats thay đổi thường xuyên)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [followers, following, friendsResult, posts] = await Promise.all([
          this.prisma.resFollow.count({ where: { following_id: user_id } }),
          this.prisma.resFollow.count({ where: { follower_id: user_id } }),
          this.getFriends(user_id, 1, 1), // Chỉ cần lấy total, không cần data
          this.prisma.resPost.count({ where: { user_id: user_id } }),
        ]);
        return {
          posts,
          followers_count: followers,
          following_count: following,
          friends_count: friendsResult.meta.total_items,
          views_count: Math.floor(Math.random() * 1000), // TODO: Tính từ profile views nếu có
        };
      },
      cacheTtl,
    );
  }

  /**
   * Follow một user
   * @param user_id - ID của user đang follow (follower)
   * @param targetId - ID của user được follow (following)
   * @param currentUser - Optional: user object từ req.user để tránh query lại database
   * @returns Thông tin follow relationship đã tạo/cập nhật
   */
  async followUser(
    user_id: string,
    targetId: string,
    currentUser?: any, // Optional: user object từ req.user để tránh query lại
  ) {
    // Kiểm tra: không cho phép follow chính mình
    if (user_id === targetId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Tối ưu: Bỏ validation queries, để DB foreign key constraint handle
    // Nếu target không tồn tại, upsert sẽ fail với foreign key error
    // Điều này giảm 1-2 queries (234-468ms)

    // Tạo hoặc cập nhật follow relationship
    let follow;
    try {
      follow = await this.prisma.resFollow.upsert({
        where: {
          follower_id_following_id: { follower_id: user_id, following_id: targetId },
        },
        create: {
          follower_id: user_id,
          following_id: targetId,
        },
        update: {},
        include: {
          following: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });
    } catch (error) {
      // Handle foreign key constraint errors
      if (error.code === 'P2003') {
        throw new NotFoundException('Target user not found');
      }
      throw error;
    }

    // Parallel: Check reverse follow và existing friend
    const [reverse, existingFriend] = await Promise.all([
      this.prisma.resFollow.findUnique({
        where: {
          follower_id_following_id: { follower_id: targetId, following_id: user_id },
        },
      }),
      this.prisma.resFriend.findFirst({
        where: {
          OR: [
            { user_a_id: user_id, user_b_id: targetId },
            { user_a_id: targetId, user_b_id: user_id },
          ],
        },
      }),
    ]);

    // Kiểm tra và tạo friend relationship nếu cả 2 đều follow nhau
    let isFriend = false;
    if (reverse && !existingFriend) {
      await this.prisma.resFriend.create({
        data: { user_a_id: user_id, user_b_id: targetId },
      });
      isFriend = true;
    } else if (existingFriend) {
      isFriend = true;
    }

    // Xóa cache khi follow để đảm bảo dữ liệu mới nhất
    // Xóa cache stats và connections của cả 2 user (follower và following)
    await Promise.all([
      this.cacheService.del(`connections:${user_id}:stats`),
      this.cacheService.del(`connections:${targetId}:stats`),
      this.cacheService.del(`user:${user_id}:connections`),
      this.cacheService.del(`user:${targetId}:connections`),
    ]);

    // Tự động tạo notification (async, không chờ để không block response)
    this.createFollowNotification(user_id, targetId).catch((error) => {
      this.logger.error(`Failed to create notification for follow: ${error.message}`);
    });

    // Trả về dữ liệu thực tế thay vì chỉ message
    return {
      follower_id: follow.follower_id, // ID của user đang follow
      following_id: follow.following_id, // ID của user được follow
      following: follow.following, // Thông tin user được follow (nickname, avatar, etc.)
      is_friend: isFriend, // Có phải bạn bè không (cả 2 đều follow nhau)
      created_at: follow.created_at, // Thời gian tạo follow relationship
    };
  }

  async unfollowUser(user_id: string, targetId: string) {
    // Check if follow relationship exists
    const followExists = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: user_id, following_id: targetId } },
    });

    if (!followExists) {
      return { message: 'Follow relationship not found' };
    }

    // Delete the follow relationship
    await this.prisma.resFollow.deleteMany({
      where: { follower_id: user_id, following_id: targetId },
    });

    // Check if reverse follow exists (they were friends)
    const reverseFollow = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: targetId, following_id: user_id } },
    });

    // If reverse follow exists, they were friends, so remove friend relationship
    if (reverseFollow) {
      await this.prisma.resFriend.deleteMany({
        where: {
          OR: [
            { user_a_id: user_id, user_b_id: targetId },
            { user_a_id: targetId, user_b_id: user_id },
          ],
        },
      });
    }

    // Invalidate cache khi unfollow
    await Promise.all([
      this.cacheService.del(`connections:${user_id}:stats`),
      this.cacheService.del(`connections:${targetId}:stats`),
      this.cacheService.del(`user:${user_id}:connections`),
      this.cacheService.del(`user:${targetId}:connections`),
    ]);

    return { message: `User ${user_id} unfollowed ${targetId}` };
  }

  async removeFollower(user_id: string, followerId: string) {
    // Check if follower relationship exists
    const followerExists = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: followerId, following_id: user_id } },
    });

    if (!followerExists) {
      return { message: 'Follower relationship not found' };
    }

    // Delete the follower relationship
    await this.prisma.resFollow.deleteMany({
      where: { follower_id: followerId, following_id: user_id },
    });

    // Check if reverse follow exists (they were friends)
    const reverseFollow = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: user_id, following_id: followerId } },
    });

    // If reverse follow exists, they were friends, so remove friend relationship
    if (reverseFollow) {
      await this.prisma.resFriend.deleteMany({
        where: {
          OR: [
            { user_a_id: user_id, user_b_id: followerId },
            { user_a_id: followerId, user_b_id: user_id },
          ],
        },
      });
    }

    // Invalidate cache khi remove follower
    await Promise.all([
      this.cacheService.del(`connections:${user_id}:stats`),
      this.cacheService.del(`connections:${followerId}:stats`),
      this.cacheService.del(`user:${user_id}:connections`),
      this.cacheService.del(`user:${followerId}:connections`),
    ]);

    return { message: `Follower ${followerId} removed from user ${user_id}` };
  }

  async unfriend(user_id: string, friendId: string) {
    await this.prisma.resFriend.deleteMany({
      where: {
        OR: [
          { user_a_id: user_id, user_b_id: friendId },
          { user_a_id: friendId, user_b_id: user_id },
        ],
      },
    });

    // Invalidate cache khi unfriend
    await Promise.all([
      this.cacheService.del(`connections:${user_id}:stats`),
      this.cacheService.del(`connections:${friendId}:stats`),
      this.cacheService.del(`user:${user_id}:connections`),
      this.cacheService.del(`user:${friendId}:connections`),
    ]);

    return { message: `User ${user_id} unfriended ${friendId}` };
  }

  // --- helper để tạo notification async ---
  private async createFollowNotification(user_id: string, targetId: string) {
    const sender = await this.prisma.resUser.findUnique({
      where: { id: user_id },
      select: { nickname: true },
    });

    await this.notificationService.createNotification({
      user_id: targetId,
      sender_id: user_id,
      type: NotificationType.FOLLOW,
      title: 'New Follower',
      content: sender?.nickname
        ? `${sender.nickname} started following you`
        : 'Someone started following you',
      link: `/users/${user_id}`,
      data: JSON.stringify({ follower_id: user_id }),
    });
  }

  // --- helper để get is_following + is_friend ---
  private async attachFollowStatus(
    currentuser_id: string,
    users: any[],
  ): Promise<UserConnectionDto[]> {
    // Cache following và friend sets để tránh query lại nhiều lần
    const cacheKey = `user:${currentuser_id}:connections`;
    const cacheTtl = 300; // 5 phút - tăng để giảm query DB
    
    const connections = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [followingIds, friendIds] = await Promise.all([
          this.prisma.resFollow.findMany({
            where: { follower_id: currentuser_id },
            select: { following_id: true },
          }),
          this.prisma.resFriend.findMany({
            where: { OR: [{ user_a_id: currentuser_id }, { user_b_id: currentuser_id }] },
            select: { user_a_id: true, user_b_id: true },
          }),
        ]);

        const followingSet = new Set(followingIds.map((f) => f.following_id));
        const friendSet = new Set<string>();
        friendIds.forEach((f) => {
          if (f.user_a_id === currentuser_id) friendSet.add(f.user_b_id);
          else friendSet.add(f.user_a_id);
        });

        return {
          following: Array.from(followingSet),
          friends: Array.from(friendSet),
        };
      },
      cacheTtl,
    );

    const followingSet = new Set(connections.following);
    const friendSet = new Set(connections.friends);

    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      avatar: u.avatar,
      bio: u.bio,
      is_following: followingSet.has(u.id),
      is_friend: friendSet.has(u.id),
    }));
  }

  async attachStatus(
    currentuser_id: string | null,
    users: Array<Pick<ResUser, 'id' | 'nickname' | 'avatar' | 'bio'>>,
  ): Promise<UserConnectionDto[]> {
    if (!currentuser_id) {
      return users.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        bio: u.bio,
        is_following: false,
        is_friend: false,
      }));
    }
    return this.attachFollowStatus(currentuser_id, users);
  }

  async getFollowing(user_id: string, page = 1, limit = 20) {
    const take = Number(limit) > 0 ? Number(limit) : 20;
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const skip = (currentPage - 1) * take;

    const [following, total] = await Promise.all([
      this.prisma.resFollow.findMany({
        where: { follower_id: user_id },
        include: { following: true },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resFollow.count({ where: { follower_id: user_id } }),
    ]);

    const users = following.map((f) => f.following);
    const data = await this.attachFollowStatus(user_id, users);
    return buildPaginatedResponse(data, total, currentPage, take);
  }

  async getFollowers(user_id: string, page = 1, limit = 20) {
    const take = Number(limit) > 0 ? Number(limit) : 20;
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const skip = (currentPage - 1) * take;

    const [followers, total] = await Promise.all([
      this.prisma.resFollow.findMany({
        where: { following_id: user_id },
        include: { follower: true },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resFollow.count({ where: { following_id: user_id } }),
    ]);

    const users = followers.map((f) => f.follower);
    const data = await this.attachFollowStatus(user_id, users);
    return buildPaginatedResponse(data, total, currentPage, take);
  }

  async getFriends(user_id: string, page = 1, limit = 20) {
    const take = Number(limit) > 0 ? Number(limit) : 20;
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const skip = (currentPage - 1) * take;

    const where = { OR: [{ user_a_id: user_id }, { user_b_id: user_id }] };

    const [friends, total] = await Promise.all([
      this.prisma.resFriend.findMany({
        where,
        include: { userA: true, userB: true },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resFriend.count({ where }),
    ]);

    const users = friends.map((f) => (f.user_a_id === user_id ? f.userB : f.userA));
    const data = await this.attachFollowStatus(user_id, users);
    return buildPaginatedResponse(data, total, currentPage, take);
  }

  async getConnections(
    user_id: string,
    type: 'followers' | 'following' | 'friends',
    search?: string,
    page = 1,
    limit = 20,
  ) {
    const take = Number(limit) > 0 ? Number(limit) : 20;
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const skip = (currentPage - 1) * take;

    // Tối ưu: Filter ở database level thay vì fetch all rồi filter trong memory
    if (search) {
      const searchFilter = {
        OR: [
          { nickname: { contains: search, mode: 'insensitive' as const } },
          { id: { contains: search, mode: 'insensitive' as const } },
        ],
      };

      if (type === 'followers') {
        const [follows, total] = await Promise.all([
          this.prisma.resFollow.findMany({
            where: {
              following_id: user_id,
              follower: searchFilter,
            },
            include: {
              follower: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                  bio: true,
                  created_at: true,
                },
              },
            },
            orderBy: { created_at: 'desc' },
            take,
            skip,
          }),
          this.prisma.resFollow.count({
            where: {
              following_id: user_id,
              follower: searchFilter,
            },
          }),
        ]);
        const users = follows.map((f) => f.follower);
        const data = await this.attachFollowStatus(user_id, users);
        return buildPaginatedResponse(data, total, currentPage, take);
      } else if (type === 'following') {
        const [follows, total] = await Promise.all([
          this.prisma.resFollow.findMany({
            where: {
              follower_id: user_id,
              following: searchFilter,
            },
            include: {
              following: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                  bio: true,
                  created_at: true,
                },
              },
            },
            orderBy: { created_at: 'desc' },
            take,
            skip,
          }),
          this.prisma.resFollow.count({
            where: {
              follower_id: user_id,
              following: searchFilter,
            },
          }),
        ]);
        const users = follows.map((f) => f.following);
        const data = await this.attachFollowStatus(user_id, users);
        return buildPaginatedResponse(data, total, currentPage, take);
      } else if (type === 'friends') {
        // Friends: Cần query cả 2 trường hợp (user_a_id hoặc user_b_id)
        const [friendsA, friendsB, totalA, totalB] = await Promise.all([
          this.prisma.resFriend.findMany({
            where: {
              user_a_id: user_id,
              userB: searchFilter,
            },
            include: {
              userB: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                  bio: true,
                  created_at: true,
                },
              },
            },
            orderBy: { created_at: 'desc' },
          }),
          this.prisma.resFriend.findMany({
            where: {
              user_b_id: user_id,
              userA: searchFilter,
            },
            include: {
              userA: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                  bio: true,
                  created_at: true,
                },
              },
            },
            orderBy: { created_at: 'desc' },
          }),
          this.prisma.resFriend.count({
            where: {
              user_a_id: user_id,
              userB: searchFilter,
            },
          }),
          this.prisma.resFriend.count({
            where: {
              user_b_id: user_id,
              userA: searchFilter,
            },
          }),
        ]);

        const allFriends = [...friendsA.map((f) => f.userB), ...friendsB.map((f) => f.userA)];
        const total = totalA + totalB;

        // Sort by created_at desc và paginate
        allFriends.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        const paginatedFriends = allFriends.slice(skip, skip + take);
        const data = await this.attachFollowStatus(user_id, paginatedFriends);

        return buildPaginatedResponse(data, total, currentPage, take);
      } else {
        return buildPaginatedResponse([], 0, currentPage, take);
      }
    }

    // No search - use existing methods with pagination
    let result: IPaginatedResponse<UserConnectionDto>;

    if (type === 'followers') {
      result = await this.getFollowers(user_id, page, limit);
    } else if (type === 'following') {
      result = await this.getFollowing(user_id, page, limit);
    } else if (type === 'friends') {
      result = await this.getFriends(user_id, page, limit);
    } else {
      return buildPaginatedResponse([], 0, page, limit);
    }

    return result;
  }
}
