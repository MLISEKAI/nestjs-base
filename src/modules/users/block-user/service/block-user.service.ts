import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class BlockUserService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Block a user
   * @param blockerId - ID of user who is blocking
   * @param blockedId - ID of user who is being blocked
   */
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Tối ưu: Dùng upsert thay vì create để handle already blocked
    const block = await this.prisma.resBlock.upsert({
      where: {
        blocker_id_blocked_id: {
          blocker_id: blockerId,
          blocked_id: blockedId,
        },
      },
      create: {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
      update: {}, // Nếu đã tồn tại, không update gì (idempotent)
      include: {
        blocked: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // Remove follow relationships if they exist (bidirectional)
    await Promise.all([
      this.prisma.resFollow.deleteMany({
        where: {
          follower_id: blockerId,
          following_id: blockedId,
        },
      }),
      this.prisma.resFollow.deleteMany({
        where: {
          follower_id: blockedId,
          following_id: blockerId,
        },
      }),
    ]);

    // Remove friend relationships if they exist (bidirectional)
    await Promise.all([
      this.prisma.resFriend.deleteMany({
        where: {
          user_a_id: blockerId,
          user_b_id: blockedId,
        },
      }),
      this.prisma.resFriend.deleteMany({
        where: {
          user_a_id: blockedId,
          user_b_id: blockerId,
        },
      }),
    ]);

    // Invalidate cache
    await this.cacheService.delPattern(`cache:GET:*/block/*:${blockerId}`);
    await this.cacheService.delPattern(`cache:GET:*/block/*:${blockedId}`);

    return {
      message: 'User blocked successfully',
      data: block,
    };
  }

  /**
   * Unblock a user
   * @param blockerId - ID of user who is unblocking
   * @param blockedId - ID of user who is being unblocked
   */
  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.resBlock.findUnique({
      where: {
        blocker_id_blocked_id: {
          blocker_id: blockerId,
          blocked_id: blockedId,
        },
      },
    });

    if (!block) {
      throw new NotFoundException('User is not blocked');
    }

    await this.prisma.resBlock.delete({
      where: {
        id: block.id,
      },
    });

    // Invalidate cache
    await this.cacheService.delPattern(`cache:GET:*/block/*:${blockerId}`);
    await this.cacheService.delPattern(`cache:GET:*/block/*:${blockedId}`);

    return {
      message: 'User unblocked successfully',
    };
  }

  /**
   * Check if user A has blocked user B
   * @param blockerId - ID of potential blocker
   * @param blockedId - ID of potential blocked user
   */
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.resBlock.findUnique({
      where: {
        blocker_id_blocked_id: {
          blocker_id: blockerId,
          blocked_id: blockedId,
        },
      },
    });

    return !!block;
  }

  /**
   * Check block status between two users
   * @param currentUserId - Current user ID
   * @param targetUserId - Target user ID
   */
  async getBlockStatus(currentUserId: string, targetUserId: string) {
    const [isBlockedByMe, hasBlockedMe] = await Promise.all([
      this.isBlocked(currentUserId, targetUserId),
      this.isBlocked(targetUserId, currentUserId),
    ]);

    return {
      isBlockedByMe,
      hasBlockedMe,
    };
  }

  /**
   * Get list of users blocked by a user
   * @param user_id - ID of user
   */
  async getBlockedUsers(user_id: string) {
    const blocks = await this.prisma.resBlock.findMany({
      where: {
        blocker_id: user_id,
      },
      include: {
        blocked: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            gender: true,
            created_at: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return blocks.map((block) => ({
      id: block.id,
      blocked_at: block.created_at,
      user: block.blocked,
    }));
  }

  /**
   * Get list of users who blocked a user
   * @param user_id - ID of user
   */
  async getBlockedByUsers(user_id: string) {
    const blocks = await this.prisma.resBlock.findMany({
      where: {
        blocked_id: user_id,
      },
      include: {
        blocker: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            gender: true,
            created_at: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return blocks.map((block) => ({
      id: block.id,
      blocked_at: block.created_at,
      user: block.blocker,
    }));
  }
}
