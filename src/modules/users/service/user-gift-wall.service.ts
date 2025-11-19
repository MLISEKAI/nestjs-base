import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserGiftWallService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get gift wall overview (header info)
   */
  async getGiftWall(userId: string) {
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

    // Get total gifts received
    const totalGifts = await this.prisma.resGift.count({
      where: { receiver_id: userId },
    });

    // Calculate level
    const level = Math.floor(totalGifts / 10) + 1;
    const current_xp = totalGifts % 10;
    const xp_to_next_level = 10 - current_xp;

    return {
      user_id: user.id,
      username: user.nickname,
      avatar_url: user.avatar || null,
      total_gifts: totalGifts,
      xp_to_next_level: xp_to_next_level,
      level: level,
      description: user.bio || 'Help me light up the Gift Wall.',
    };
  }

  /**
   * Get gift wall milestones with progress per gift item
   */
  async getGiftWallMilestones(userId: string) {
    // Get all gift items
    const giftItems = await this.prisma.resGiftItem.findMany({
      orderBy: { name: 'asc' },
    });

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
      const is_unlocked = current_count >= required_count;

      return {
        milestone_id: item.id,
        name: item.name,
        icon_url: item.image_url || null,
        required_count: required_count,
        current_count: current_count,
        is_unlocked: is_unlocked,
        progress: current_count / required_count,
      };
    });

    return milestones;
  }

  /**
   * Get recent gifts with sender info
   */
  async getRecentGifts(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

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
        gift_name: gift.giftItem.name,
        icon_url: gift.giftItem.image_url || null,
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
  }
}
