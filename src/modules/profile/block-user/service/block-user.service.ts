import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BlockUserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Block a user
   * @param blockerId - ID of user who is blocking
   * @param blockedId - ID of user who is being blocked
   */
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Check if users exist
    const [blocker, blocked] = await Promise.all([
      this.prisma.resUser.findUnique({ where: { id: blockerId } }),
      this.prisma.resUser.findUnique({ where: { id: blockedId } }),
    ]);

    if (!blocker) {
      throw new NotFoundException('Blocker user not found');
    }

    if (!blocked) {
      throw new NotFoundException('User to block not found');
    }

    // Check if already blocked
    const existingBlock = await this.prisma.resBlock.findUnique({
      where: {
        blocker_id_blocked_id: {
          blocker_id: blockerId,
          blocked_id: blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new BadRequestException('User is already blocked');
    }

    // Create block relationship
    const block = await this.prisma.resBlock.create({
      data: {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
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
   * @param userId - ID of user
   */
  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.resBlock.findMany({
      where: {
        blocker_id: userId,
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
   * @param userId - ID of user
   */
  async getBlockedByUsers(userId: string) {
    const blocks = await this.prisma.resBlock.findMany({
      where: {
        blocked_id: userId,
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
