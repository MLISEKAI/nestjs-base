import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomMembersService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách người xem
  async getViewers(room_id: string, page: number = 1, pageSize: number = 50) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');

    // Get top 3 contributors
    const topGifts = await this.prisma.roomGift.groupBy({
      by: ['sender_id'],
      where: { room_id: room_id },
      _sum: { total_cost: true },
      orderBy: { _sum: { total_cost: 'desc' } },
      take: 3,
    });

    const topContributors = await Promise.all(
      topGifts.map(async (gift, index) => {
        const user = await this.prisma.resUser.findUnique({
          where: { id: gift.sender_id },
          select: { id: true, nickname: true, avatar: true },
        });

        const badges = ['crown_gold', 'crown_silver', 'crown_bronze'];

        return {
          rank: index + 1,
          user_id: user?.id || '',
          username: user?.nickname || 'Unknown',
          avatar: user?.avatar || '',
          level: 73,
          badge: badges[index],
          status: 'in_room',
          isBlocked: false,
          isBlacklisted: false,
        };
      }),
    );

    // Get regular viewers
    const participants = await this.prisma.roomParticipant.findMany({
      where: { room_id: room_id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { joined_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const regularViewers = participants.map((p) => ({
      user_id: p.user_id,
      username: p.user.nickname,
      avatar: p.user.avatar,
      level: 72,
      status: p.left_at ? 'left_room' : 'in_room',
      isBlocked: false,
      isBlacklisted: false,
      ...(p.left_at && { leftAt: p.left_at }),
    }));

    const total = await this.prisma.roomParticipant.count({ where: { room_id: room_id } });

    return {
      totalViewers: room.current_participants,
      topContributors,
      regularViewers,
      pagination: {
        page,
        pageSize,
        hasMore: page * pageSize < total,
      },
    };
  }

  // Kick user
  async kickUser(room_id: string, hostId: string, targetuser_id: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== hostId) throw new ForbiddenException('Only host can kick users');

    const participant = await this.prisma.roomParticipant.findFirst({
      where: { room_id: room_id, user_id: targetuser_id, left_at: null },
    });

    if (!participant) throw new NotFoundException('User not in room');

    await this.prisma.roomParticipant.update({
      where: { id: participant.id },
      data: { left_at: new Date() },
    });

    await this.prisma.room.update({
      where: { id: room_id },
      data: { current_participants: { decrement: 1 } },
    });

    return { success: true, message: 'User kicked' };
  }

  // Block user
  async blockUser(room_id: string, hostId: string, targetuser_id: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== hostId) throw new ForbiddenException('Only host can block users');

    // Kick if in room
    const participant = await this.prisma.roomParticipant.findFirst({
      where: { room_id: room_id, user_id: targetuser_id, left_at: null },
    });

    if (participant) {
      await this.prisma.roomParticipant.update({
        where: { id: participant.id },
        data: { left_at: new Date() },
      });

      await this.prisma.room.update({
        where: { id: room_id },
        data: { current_participants: { decrement: 1 } },
      });
    }

    // Add to blacklist
    await this.prisma.roomBlacklist.upsert({
      where: {
        room_id_user_id: {
          room_id: room_id,
          user_id: targetuser_id,
        },
      },
      create: {
        room_id: room_id,
        user_id: targetuser_id,
      },
      update: {},
    });

    return { success: true, message: 'User blocked' };
  }

  // Unblock user
  async unblockUser(room_id: string, hostId: string, targetuser_id: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== hostId) throw new ForbiddenException('Only host can unblock users');

    await this.prisma.roomBlacklist.delete({
      where: {
        room_id_user_id: {
          room_id: room_id,
          user_id: targetuser_id,
        },
      },
    });

    return { success: true, message: 'User unblocked' };
  }

  // Get blacklist
  async getBlacklist(room_id: string) {
    const blacklist = await this.prisma.roomBlacklist.findMany({
      where: { room_id: room_id },
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

    return blacklist.map((b) => ({
      user_id: b.user_id,
      username: b.user.nickname,
      avatar: b.user.avatar,
      reason: b.reason,
      blacklistedAt: b.created_at,
    }));
  }
}
