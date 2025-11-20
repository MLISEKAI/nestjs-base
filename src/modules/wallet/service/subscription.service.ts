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
   * Get monthly cards from database
   */
  async getMonthlyCards(): Promise<MonthlyCardDto[]> {
    const cards = await this.prisma.resMonthlyCard.findMany({
      where: { is_active: true },
      orderBy: { card_id: 'asc' },
    });

    // Nếu chưa có data trong DB, trả về empty array
    // Admin có thể seed data sau
    return cards.map((card) => ({
      cardId: card.card_id,
      price: Number(card.price),
      diamondsDaily: card.diamonds_daily,
      name: card.name,
      duration: card.duration,
    }));
  }

  /**
   * Purchase subscription (Monthly Card)
   */
  async purchaseSubscription(
    userId: string,
    dto: PurchaseSubscriptionDto,
  ): Promise<PurchaseSubscriptionResponseDto> {
    // Query card từ DB
    const cardData = await this.prisma.resMonthlyCard.findUnique({
      where: { card_id: dto.cardId },
    });

    if (!cardData) {
      throw new NotFoundException(`Monthly card with cardId ${dto.cardId} not found`);
    }

    if (!cardData.is_active) {
      throw new NotFoundException(`Monthly card with cardId ${dto.cardId} is inactive`);
    }

    // Update VIP status
    const subscriptionId = `SUB${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startDate = new Date();
    const nextRenewal = new Date();
    nextRenewal.setDate(nextRenewal.getDate() + cardData.duration);

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

    if (!vipStatus) {
      throw new NotFoundException('No subscription found');
    }

    if (!vipStatus.is_vip) {
      throw new NotFoundException('No active subscription found');
    }

    // Check if subscription is expired
    if (vipStatus.expiry && vipStatus.expiry <= new Date()) {
      throw new NotFoundException('Subscription has expired');
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
