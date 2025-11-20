import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserProfileService } from './user-profile.service';
import { UserConnectionDto } from '../dto/connection-user.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class UserConnectionsService {
  constructor(
    private prisma: PrismaService,
    private profile: UserProfileService,
  ) {}

  async getStats(userId: string) {
    const [followers, following, friendsResult] = await Promise.all([
      this.prisma.resFollow.count({ where: { following_id: userId } }),
      this.prisma.resFollow.count({ where: { follower_id: userId } }),
      this.getFriends(userId, 1, 1), // Chỉ cần lấy total, không cần data
    ]);
    return {
      followers_count: followers,
      following_count: following,
      friends_count: friendsResult.meta.total_items,
    };
  }

  async followUser(
    userId: string,
    targetId: string,
    currentUser?: any, // Optional: user object từ req.user để tránh query lại
  ) {
    if (userId === targetId) return { message: 'Cannot follow yourself' };

    // Tối ưu: Nếu đã có currentUser từ req.user, không cần query lại
    const user = currentUser && currentUser.id === userId ? currentUser : null;
    const target = await this.profile.findUser(targetId);

    if (!target) return { message: 'Target user not found' };
    // Nếu không có user và không phải từ req.user, query để verify
    if (!user) {
      const userCheck = await this.profile.findUser(userId);
      if (!userCheck) return { message: 'User not found' };
    }

    await this.prisma.resFollow.upsert({
      where: { follower_id_following_id: { follower_id: userId, following_id: targetId } },
      create: { follower_id: userId, following_id: targetId },
      update: {},
    });

    const reverse = await this.prisma.resFollow.findUnique({
      where: { follower_id_following_id: { follower_id: targetId, following_id: userId } },
    });

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
        return { message: `User ${userId} followed ${targetId} and became friends` };
      }
    }

    return { message: `User ${userId} followed ${targetId}` };
  }

  async unfollowUser(userId: string, targetId: string) {
    await this.prisma.resFollow.deleteMany({
      where: { follower_id: userId, following_id: targetId },
    });
    return { message: `User ${userId} unfollowed ${targetId}` };
  }

  async removeFollower(userId: string, followerId: string) {
    await this.prisma.resFollow.deleteMany({
      where: { follower_id: followerId, following_id: userId },
    });
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
    const take = limit > 0 ? limit : 20;
    const currentPage = page > 0 ? page : 1;
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
    const take = limit > 0 ? limit : 20;
    const currentPage = page > 0 ? page : 1;
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
    const take = limit > 0 ? limit : 20;
    const currentPage = page > 0 ? page : 1;
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
    let result: { items: UserConnectionDto[]; meta: any };

    if (type === 'followers') result = await this.getFollowers(userId, page, limit);
    else if (type === 'following') result = await this.getFollowing(userId, page, limit);
    else if (type === 'friends') result = await this.getFriends(userId, page, limit);
    else {
      return buildPaginatedResponse([], 0, page, limit);
    }

    if (search) {
      const q = search.toLowerCase();
      const filteredItems = result.items.filter(
        (u) => u.nickname.toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
      );
      // Recalculate meta for filtered results
      return buildPaginatedResponse(filteredItems, filteredItems.length, page, limit);
    }

    return result;
  }
}
