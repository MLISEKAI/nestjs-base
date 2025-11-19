import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserLevelService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate user level based on total gifts received
   * Level formula: level = Math.floor(totalGifts / 10) + 1
   * XP = totalGifts % 10
   * XP to next level = 10 - XP
   */
  async getUserBalance(userId: string) {
    // Get total gifts received
    const totalGifts = await this.prisma.resGift.count({
      where: { receiver_id: userId },
    });

    // Calculate level (every 10 gifts = 1 level, starting from level 1)
    const level = Math.floor(totalGifts / 10) + 1;
    const current_xp = totalGifts % 10;
    const xp_to_next_level = 10 - current_xp;

    return {
      level,
      current_xp: current_xp,
      xp_to_next_level: xp_to_next_level,
    };
  }
}
