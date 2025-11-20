import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { UserProfileService } from './user-profile.service';
import { UserConnectionDto } from '../dto/connection-user.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class UserConnectionsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private profile: UserProfileService,
  ) {}

  async getStats(userId: string) {
    const cacheKey = `connections:${userId}:stats`;
    const cacheTtl = 300; // 5 phút (stats thay đổi thường xuyên)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [followers, following, friendsResult, posts] = await Promise.all([
          this.prisma.resFollow.count({ where: { following_id: userId } }),
          this.prisma.resFollow.count({ where: { follower_id: userId } }),
          this.getFriends(userId, 1, 1), // Chỉ cần lấy total, không cần data
          this.prisma.resPost.count({ where: { user_id: userId } }),
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

  async followUser(
    userId: string,
    targetId: string,
    currentUser?: any, // Optional: user object từ req.user để tránh query lại
  ) {
    if (userId === targetId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Tối ưu: Nếu đã có currentUser từ req.user, không cần query lại
    const user = currentUser && currentUser.id === userId ? currentUser : null;
    const target = await this.profile.findUser(targetId);

    if (!target) {
      throw new NotFoundException('Target user not found');
    }
    // Nếu không có user và không phải từ req.user, query để verify
    if (!user) {
      const userCheck = await this.profile.findUser(userId);
      if (!userCheck) {
        throw new NotFoundException('User not found');
      }
    }

    // Tạo hoặc cập nhật follow relationship
    const follow = await this.prisma.resFollow.upsert({
      where: { follower_id_following_id: { follower_id: userId, following_id: targetId } },
      create: { follower_id: userId, following_id: targetId },
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

    const reverse = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: targetId, following_id: userId } },
    });

    let isFriend = false;
    if (reverse) {
      const existingFriend = await this.prisma.resFriend.findFirst({
        where: {
          OR: [
            { user_a_id: userId, user_b_id: targetId },
            { user_a_id: targetId, user_b_id: userId },
          ],
        },
      });
      if (!existingFriend) {
        await this.prisma.resFriend.create({ data: { user_a_id: userId, user_b_id: targetId } });
        isFriend = true;
      } else {
        isFriend = true;
      }
    }

    // Trả về dữ liệu thực tế thay vì chỉ message
    return {
      follower_id: follow.follower_id,
      following_id: follow.following_id,
      following: follow.following,
      is_friend: isFriend,
      created_at: follow.created_at,
    };
  }

  async unfollowUser(userId: string, targetId: string) {
    // Check if follow relationship exists
    const followExists = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: userId, following_id: targetId } },
    });

    if (!followExists) {
      return { message: 'Follow relationship not found' };
    }

    // Delete the follow relationship
    await this.prisma.resFollow.deleteMany({
      where: { follower_id: userId, following_id: targetId },
    });

    // Check if reverse follow exists (they were friends)
    const reverseFollow = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: targetId, following_id: userId } },
    });

    // If reverse follow exists, they were friends, so remove friend relationship
    if (reverseFollow) {
      await this.prisma.resFriend.deleteMany({
        where: {
          OR: [
            { user_a_id: userId, user_b_id: targetId },
            { user_a_id: targetId, user_b_id: userId },
          ],
        },
      });
    }

    // Invalidate cache khi unfollow
    await this.cacheService.del(`connections:${userId}:stats`);
    await this.cacheService.del(`connections:${targetId}:stats`);

    return { message: `User ${userId} unfollowed ${targetId}` };
  }

  async removeFollower(userId: string, followerId: string) {
    // Check if follower relationship exists
    const followerExists = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: followerId, following_id: userId } },
    });

    if (!followerExists) {
      return { message: 'Follower relationship not found' };
    }

    // Delete the follower relationship
    await this.prisma.resFollow.deleteMany({
      where: { follower_id: followerId, following_id: userId },
    });

    // Check if reverse follow exists (they were friends)
    const reverseFollow = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: userId, following_id: followerId } },
    });

    // If reverse follow exists, they were friends, so remove friend relationship
    if (reverseFollow) {
      await this.prisma.resFriend.deleteMany({
        where: {
          OR: [
            { user_a_id: userId, user_b_id: followerId },
            { user_a_id: followerId, user_b_id: userId },
          ],
        },
      });
    }

    // Invalidate cache khi remove follower
    await this.cacheService.del(`connections:${userId}:stats`);
    await this.cacheService.del(`connections:${followerId}:stats`);

    return { message: `Follower ${followerId} removed from user ${userId}` };
  }

  async unfriend(userId: string, friendId: string) {
    await this.prisma.resFriend.deleteMany({
      where: {
        OR: [
          { user_a_id: userId, user_b_id: friendId },
          { user_a_id: friendId, user_b_id: userId },
        ],
      },
    });

    // Invalidate cache khi unfriend
    await this.cacheService.del(`connections:${userId}:stats`);
    await this.cacheService.del(`connections:${friendId}:stats`);

    return { message: `User ${userId} unfriended ${friendId}` };
  }

  // --- helper để get is_following + is_friend ---
  private async attachFollowStatus(
    currentUserId: string,
    users: any[],
  ): Promise<UserConnectionDto[]> {
    const followingIds = await this.prisma.resFollow.findMany({
      where: { follower_id: currentUserId },
      select: { following_id: true },
    });
    const followingSet = new Set(followingIds.map((f) => f.following_id));

    const friendIds = await this.prisma.resFriend.findMany({
      where: { OR: [{ user_a_id: currentUserId }, { user_b_id: currentUserId }] },
      select: { user_a_id: true, user_b_id: true },
    });
    const friendSet = new Set<string>();
    friendIds.forEach((f) => {
      if (f.user_a_id === currentUserId) friendSet.add(f.user_b_id);
      else friendSet.add(f.user_a_id);
    });

    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      avatar: u.avatar,
      bio: u.bio,
      is_following: followingSet.has(u.id),
      is_friend: friendSet.has(u.id),
    }));
  }

  async attachStatus(currentUserId: string | null, users: any[]): Promise<UserConnectionDto[]> {
    if (!currentUserId) {
      return users.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        bio: u.bio,
        is_following: false,
        is_friend: false,
      }));
    }
    return this.attachFollowStatus(currentUserId, users);
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const take = Number(limit) > 0 ? Number(limit) : 20;
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const skip = (currentPage - 1) * take;

    const [following, total] = await Promise.all([
      this.prisma.resFollow.findMany({
        where: { follower_id: userId },
        include: { following: true },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resFollow.count({ where: { follower_id: userId } }),
    ]);

    const users = following.map((f) => f.following);
    const data = await this.attachFollowStatus(userId, users);
    return buildPaginatedResponse(data, total, currentPage, take);
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const take = Number(limit) > 0 ? Number(limit) : 20;
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const skip = (currentPage - 1) * take;

    const [followers, total] = await Promise.all([
      this.prisma.resFollow.findMany({
        where: { following_id: userId },
        include: { follower: true },
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.resFollow.count({ where: { following_id: userId } }),
    ]);

    const users = followers.map((f) => f.follower);
    const data = await this.attachFollowStatus(userId, users);
    return buildPaginatedResponse(data, total, currentPage, take);
  }

  async getFriends(userId: string, page = 1, limit = 20) {
    const take = Number(limit) > 0 ? Number(limit) : 20;
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const skip = (currentPage - 1) * take;

    const where = { OR: [{ user_a_id: userId }, { user_b_id: userId }] };

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

    const users = friends.map((f) => (f.user_a_id === userId ? f.userB : f.userA));
    const data = await this.attachFollowStatus(userId, users);
    return buildPaginatedResponse(data, total, currentPage, take);
  }

  async getConnections(
    userId: string,
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
              following_id: userId,
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
              following_id: userId,
              follower: searchFilter,
            },
          }),
        ]);
        const users = follows.map((f) => f.follower);
        const data = await this.attachFollowStatus(userId, users);
        return buildPaginatedResponse(data, total, currentPage, take);
      } else if (type === 'following') {
        const [follows, total] = await Promise.all([
          this.prisma.resFollow.findMany({
            where: {
              follower_id: userId,
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
              follower_id: userId,
              following: searchFilter,
            },
          }),
        ]);
        const users = follows.map((f) => f.following);
        const data = await this.attachFollowStatus(userId, users);
        return buildPaginatedResponse(data, total, currentPage, take);
      } else if (type === 'friends') {
        // Friends: Cần query cả 2 trường hợp (user_a_id hoặc user_b_id)
        const [friendsA, friendsB, totalA, totalB] = await Promise.all([
          this.prisma.resFriend.findMany({
            where: {
              user_a_id: userId,
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
              user_b_id: userId,
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
              user_a_id: userId,
              userB: searchFilter,
            },
          }),
          this.prisma.resFriend.count({
            where: {
              user_b_id: userId,
              userA: searchFilter,
            },
          }),
        ]);

        const allFriends = [...friendsA.map((f) => f.userB), ...friendsB.map((f) => f.userA)];
        const total = totalA + totalB;

        // Sort by created_at desc và paginate
        allFriends.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        const paginatedFriends = allFriends.slice(skip, skip + take);
        const data = await this.attachFollowStatus(userId, paginatedFriends);

        return buildPaginatedResponse(data, total, currentPage, take);
      } else {
        return buildPaginatedResponse([], 0, currentPage, take);
      }
    }

    // No search - use existing methods with pagination
    let result: { items: UserConnectionDto[]; meta: any };

    if (type === 'followers') {
      result = await this.getFollowers(userId, page, limit);
    } else if (type === 'following') {
      result = await this.getFollowing(userId, page, limit);
    } else if (type === 'friends') {
      result = await this.getFriends(userId, page, limit);
    } else {
      return buildPaginatedResponse([], 0, page, limit);
    }

    return result;
  }
}
