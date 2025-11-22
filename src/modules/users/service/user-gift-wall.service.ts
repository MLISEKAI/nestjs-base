import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class UserGiftWallService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Get gift wall overview (header info)
   * Cached for 5 minutes
   */
  async getGiftWall(userId: string) {
    const cacheKey = `user:${userId}:gift-wall`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await this.prisma.resUser.findUnique({
          where: { id: userId },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
          },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        // Get total daimon value (tổng giá trị daimon của tất cả quà đã TẶNG)
        // Giá trị daimon = sum(price * quantity) cho mỗi gift mà user đã tặng
        // total_diamond_value = tổng giá trị kim cương của tất cả quà đã TẶNG (sender)
        const giftsSent = await this.prisma.resGift.findMany({
          where: { sender_id: userId },
          select: {
            quantity: true,
            giftItem: {
              select: {
                price: true,
              },
            },
          },
        });

        // Tính tổng giá trị daimon (kim cương) từ quà đã tặng
        const totalDiamondValue = giftsSent.reduce((sum, gift) => {
          // Kiểm tra giftItem tồn tại và có price
          if (!gift.giftItem || !gift.giftItem.price) {
            console.warn(`[GiftWall] Gift item missing or no price for userId: ${userId}`);
            return sum;
          }
          const giftValue = Number(gift.giftItem.price) * gift.quantity;
          return sum + giftValue;
        }, 0);

        // Debug logging (có thể xóa sau)
        if (giftsSent.length > 0) {
          console.log(
            `[GiftWall] Found ${giftsSent.length} gifts sent by userId: ${userId}, totalDiamondValue: ${totalDiamondValue}`,
          );
        } else {
          console.log(`[GiftWall] No gifts sent found for userId: ${userId}`);
        }

        // Calculate level với xp_to_next_level tăng gấp đôi mỗi level
        // Level 1 → 2: cần 10 XP
        // Level 2 → 3: cần 20 XP
        // Level 3 → 4: cần 40 XP
        // Level 4 → 5: cần 80 XP
        // Level 5 → 6: cần 160 XP
        // Level 6 → 7: cần 320 XP
        // ...
        // Tổng XP tích lũy để đạt level N = 10 * (2^(N-1) - 1)
        // Level 1: 0 XP
        // Level 2: 10 XP
        // Level 3: 30 XP (10 + 20)
        // Level 4: 70 XP (10 + 20 + 40)
        // Level 5: 150 XP (10 + 20 + 40 + 80)
        // Level 6: 310 XP (10 + 20 + 40 + 80 + 160)
        // Level 7: 630 XP (10 + 20 + 40 + 80 + 160 + 320)

        const BASE_XP = 10; // XP cần cho level 1 → 2
        let level = 1;
        let totalXpForLevel = 0;
        let xpToNextLevel = BASE_XP;

        // Tìm level hiện tại dựa trên totalDiamondValue
        while (totalDiamondValue >= totalXpForLevel + xpToNextLevel) {
          totalXpForLevel += xpToNextLevel;
          level++;
          xpToNextLevel = BASE_XP * Math.pow(2, level - 1);
        }

        // Tính phần dư XP trong level hiện tại
        const current_xp = totalDiamondValue - totalXpForLevel;
        // XP còn lại cần để lên level tiếp theo
        const xp_to_next_level = xpToNextLevel - current_xp;

        // total_diamond_value chỉ hiển thị phần dư (remainder) sau khi tính level
        // Đây là giá trị kim cương còn lại trong level hiện tại
        const total_diamond_value_remainder = current_xp;

        return {
          user_id: user.id,
          username: user.nickname,
          avatar_url: user.avatar || null,
          total_diamond_value: total_diamond_value_remainder,
          xp_to_next_level: xp_to_next_level,
          level: level,
          description: user.bio || 'Help me light up the Gift Wall.',
        };
      },
      cacheTtl,
    );
  }

  /**
   * Get gift wall milestones with progress per gift item
   * Cached for 5 minutes
   * @param userId - User ID
   * @param milestoneId - Optional: ID của gift item (gift_item_id) để filter milestone cụ thể
   * @param query - Optional: Pagination query (page, limit)
   */
  async getGiftWallMilestones(
    userId: string,
    milestoneId?: string,
    query?: { page?: number; limit?: number },
  ) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const cacheKey = milestoneId
      ? `user:${userId}:gift-wall:milestones:${milestoneId}:${page}:${limit}`
      : `user:${userId}:gift-wall:milestones:${page}:${limit}`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Get gift items (filter by milestoneId nếu có)
        const where = milestoneId ? { id: milestoneId } : {};
        const [giftItems, total] = await Promise.all([
          this.prisma.resGiftItem.findMany({
            where,
            orderBy: { name: 'asc' },
            skip,
            take: limit,
          }),
          this.prisma.resGiftItem.count({ where }),
        ]);

        if (giftItems.length === 0) {
          return buildPaginatedResponse([], 0, page, limit);
        }

        // Get all gifts received by user, grouped by gift_item_id
        const giftsReceived = await this.prisma.resGift.findMany({
          where: { receiver_id: userId },
          select: {
            gift_item_id: true,
            quantity: true,
          },
        });

        // Count gifts per item
        const giftCounts = new Map<string, number>();
        giftsReceived.forEach((gift) => {
          const current = giftCounts.get(gift.gift_item_id) || 0;
          giftCounts.set(gift.gift_item_id, current + gift.quantity);
        });

        // Get milestones for each gift item (default: 10 gifts needed to unlock)
        const milestones = giftItems.map((item) => {
          const current_count = giftCounts.get(item.id) || 0;
          const required_count = 10; // Default milestone requirement

          return {
            id: item.id,
            name: item.name,
            image_url: item.image_url || null,
            required_count: required_count,
            current_count: current_count,
          };
        });

        return buildPaginatedResponse(milestones, total, page, limit);
      },
      cacheTtl,
    );
  }

  /**
   * Get recent gifts with sender info
   * Cached for 1 minute
   */
  async getRecentGifts(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const cacheKey = `user:${userId}:gift-wall:recent:page:${page}:limit:${limit}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [gifts, total] = await Promise.all([
          this.prisma.resGift.findMany({
            where: { receiver_id: userId },
            take: limit,
            skip: skip,
            orderBy: { created_at: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                },
              },
              giftItem: {
                select: {
                  id: true,
                  name: true,
                  image_url: true,
                },
              },
            },
          }),
          this.prisma.resGift.count({ where: { receiver_id: userId } }),
        ]);

        const items = gifts.map((gift) => ({
          transaction_id: gift.id,
          sender: {
            user_id: gift.sender.id,
            username: gift.sender.nickname,
            avatar_url: gift.sender.avatar || null,
          },
          gift_info: {
            name: gift.giftItem.name,
            image_url: gift.giftItem.image_url || null,
            quantity: gift.quantity,
          },
          timestamp: gift.created_at,
        }));

        return {
          items,
          meta: {
            item_count: items.length,
            total_items: total,
            items_per_page: limit,
            total_pages: Math.ceil(total / limit),
            current_page: page,
          },
        };
      },
      cacheTtl,
    );
  }
}
