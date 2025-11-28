// Import Injectable từ NestJS
import { Injectable } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * UserLevelService - Service xử lý business logic cho user level và balance
 *
 * Chức năng chính:
 * - Tính user level dựa trên tổng số quà đã nhận
 * - Tính XP và XP to next level
 * - Cache user balance để tối ưu performance
 *
 * Lưu ý:
 * - User balance được cache 5 phút (level thay đổi khi nhận gift)
 * - Level formula: level = Math.floor(totalGifts / 10) + 1
 * - XP = totalGifts % 10
 * - XP to next level = 10 - XP
 */
@Injectable()
export class UserLevelService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService và CacheService khi tạo instance của service
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Calculate user level based on total gifts received
   * Level formula: level = Math.floor(totalGifts / 10) + 1
   * XP = totalGifts % 10
   * XP to next level = 10 - XP
   * Cached for 5 minutes (level thay đổi khi nhận gift)
   */
  async getUserBalance(user_id: string) {
    const cacheKey = `user:${user_id}:balance`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Get total gifts received
        const totalGifts = await this.prisma.resGift.count({
          where: { receiver_id: user_id },
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
      },
      cacheTtl,
    );
  }
}
