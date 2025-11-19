import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  MonthlyCardDto,
  PurchaseSubscriptionDto,
  PurchaseSubscriptionResponseDto,
  SubscriptionDetailsResponseDto,
} from '../dto/diamond-wallet.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get monthly cards
   */
  async getMonthlyCards(): Promise<MonthlyCardDto[]> {
    // TODO: Có thể lưu trong DB table ResMonthlyCard
    // Hiện tại hardcode
    return [
      { cardId: 1, price: 99000, diamondsDaily: 50, name: 'Basic Monthly Card', duration: 30 },
      {
        cardId: 2,
        price: 199000,
        diamondsDaily: 120,
        name: 'Premium Monthly Card',
        duration: 30,
      },
      { cardId: 3, price: 299000, diamondsDaily: 200, name: 'VIP Monthly Card', duration: 30 },
    ];
  }

  /**
   * Purchase subscription (Monthly Card)
   */
  async purchaseSubscription(
    userId: string,
    dto: PurchaseSubscriptionDto,
  ): Promise<PurchaseSubscriptionResponseDto> {
    const cards = await this.getMonthlyCards();
    const cardData = cards.find((c) => c.cardId === dto.cardId);

    if (!cardData) {
      throw new NotFoundException('Monthly card not found');
    }

    // Update VIP status (hoặc tạo subscription model riêng)
    const subscriptionId = `SUB${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startDate = new Date();
    const nextRenewal = new Date();
    nextRenewal.setDate(nextRenewal.getDate() + (cardData.duration || 30));

    // Upsert VIP status
    await this.prisma.resVipStatus.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        is_vip: true,
        expiry: nextRenewal,
      },
      update: {
        is_vip: true,
        expiry: nextRenewal,
      },
    });

    return {
      subscriptionId,
      status: 'active',
      startDate: startDate.toISOString().split('T')[0],
      nextRenewal: nextRenewal.toISOString().split('T')[0],
    };
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(userId: string): Promise<SubscriptionDetailsResponseDto> {
    const vipStatus = await this.prisma.resVipStatus.findUnique({
      where: { user_id: userId },
    });

    if (!vipStatus || !vipStatus.is_vip) {
      throw new NotFoundException('No active subscription found');
    }

    const user = await this.prisma.resUser.findUnique({
      where: { id: userId },
      select: { nickname: true },
    });

    return {
      subscriptionId: `SUB-${userId}`,
      status: vipStatus.expiry && vipStatus.expiry > new Date() ? 'active' : 'expired',
      nextRenewal: vipStatus.expiry ? vipStatus.expiry.toISOString().split('T')[0] : '',
      username: user?.nickname || '',
    };
  }
}
