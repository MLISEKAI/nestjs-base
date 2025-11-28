import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomChallengeService {
  constructor(private prisma: PrismaService) {}

  // Lấy trạng thái thử thách
  async getChallenge(room_id: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');

    let challenge = await this.prisma.roomChallenge.findUnique({
      where: { room_id: room_id },
    });

    if (!challenge) {
      challenge = await this.prisma.roomChallenge.create({
        data: {
          room_id: room_id,
          level: 1,
          current_points: 0,
          required_points: 100000,
        },
      });
    }

    return {
      level: challenge.level,
      currentPoints: challenge.current_points,
      requiredPoints: challenge.required_points,
      progressPercent: Math.floor((challenge.current_points / challenge.required_points) * 100),
      chests: [
        { id: 1, pointsRequired: 5000, rewardPreview: ['avatar_frame', 'gift_box'] },
        { id: 2, pointsRequired: 20000, rewardPreview: ['badge', 'coins'] },
        { id: 3, pointsRequired: 50000, rewardPreview: ['vip_badge', 'diamonds'] },
      ],
      hostReward: {
        id: 1,
        name: 'Vòng ánh sáng tím',
        pointsRequired: 987,
      },
    };
  }

  // Gửi điểm
  async addProgress(room_id: string, points: number) {
    const challenge = await this.prisma.roomChallenge.findUnique({
      where: { room_id: room_id },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');

    const updated = await this.prisma.roomChallenge.update({
      where: { room_id: room_id },
      data: {
        current_points: { increment: points },
      },
    });

    return {
      level: updated.level,
      currentPoints: updated.current_points,
      requiredPoints: updated.required_points,
    };
  }

  // Top đóng góp
  async getContributors(room_id: string, period: 'daily' | 'weekly' | 'monthly') {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const gifts = await this.prisma.roomGift.groupBy({
      by: ['sender_id'],
      where: {
        room_id: room_id,
        created_at: { gte: startDate },
      },
      _sum: {
        total_cost: true,
      },
      orderBy: {
        _sum: {
          total_cost: 'desc',
        },
      },
      take: 20,
    });

    const contributors = await Promise.all(
      gifts.map(async (gift, index) => {
        const user = await this.prisma.resUser.findUnique({
          where: { id: gift.sender_id },
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        });

        return {
          rank: index + 1,
          user_id: gift.sender_id,
          name: user?.nickname || 'Unknown',
          avatar: user?.avatar || '',
          badges: index === 0 ? ['gift-master', 'hot'] : index < 3 ? ['gift-buff'] : [],
          points: gift._sum.total_cost || 0,
        };
      }),
    );

    return {
      type: period,
      serverTime: new Date(),
      list: contributors,
      self: {
        rank: 0,
        user_id: 'user_123',
        points: 0,
      },
    };
  }
}
