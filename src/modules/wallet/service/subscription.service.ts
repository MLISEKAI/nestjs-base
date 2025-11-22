import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  MonthlyCardDto,
  PurchaseSubscriptionDto,
  PurchaseSubscriptionResponseDto,
  SubscriptionDetailsResponseDto,
} from '../dto/diamond-wallet.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

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
   * Kiểm tra số dư và trừ tiền trước khi đăng ký
   */
  async purchaseSubscription(
    userId: string,
    dto: PurchaseSubscriptionDto,
  ): Promise<PurchaseSubscriptionResponseDto> {
    this.logger.log(`User ${userId} attempting to purchase monthly card ${dto.cardId}`);

    // Query card từ DB
    const cardData = await this.prisma.resMonthlyCard.findUnique({
      where: { card_id: dto.cardId },
    });

    if (!cardData) {
      this.logger.warn(`Monthly card with cardId ${dto.cardId} not found`);
      throw new NotFoundException(`Monthly card with cardId ${dto.cardId} not found`);
    }

    if (!cardData.is_active) {
      this.logger.warn(`Monthly card with cardId ${dto.cardId} is inactive`);
      throw new NotFoundException(`Monthly card with cardId ${dto.cardId} is inactive`);
    }

    const cardPrice = Number(cardData.price);
    this.logger.log(`Monthly card price: $${cardPrice} USD`);

    // Lấy hoặc tạo Diamond wallet
    let diamondWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: userId, currency: 'diamond' },
    });

    if (!diamondWallet) {
      diamondWallet = await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: 'diamond',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    const currentBalance = Number(diamondWallet.balance);
    this.logger.log(`User ${userId} current Diamond balance: ${currentBalance}`);

    // Kiểm tra số dư có đủ không
    if (currentBalance < cardPrice) {
      const insufficientAmount = cardPrice - currentBalance;
      this.logger.warn(
        `Insufficient balance for user ${userId}. Required: $${cardPrice}, Current: $${currentBalance}, Missing: $${insufficientAmount}`,
      );
      throw new BadRequestException(
        `Số dư không đủ để đăng ký thẻ tháng. Cần: $${cardPrice.toFixed(2)} USD, Hiện có: $${currentBalance.toFixed(2)} USD, Thiếu: $${insufficientAmount.toFixed(2)} USD`,
      );
    }

    // Số dư đủ, tiến hành trừ tiền và đăng ký
    const subscriptionId = `SUB${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startDate = new Date();
    const nextRenewal = new Date();
    nextRenewal.setDate(nextRenewal.getDate() + cardData.duration);

    // Trừ tiền và update VIP status trong transaction để đảm bảo atomicity
    await this.prisma.$transaction(async (tx) => {
      // Trừ tiền từ Diamond wallet
      const newBalance = currentBalance - cardPrice;
      await tx.resWallet.update({
        where: { id: diamondWallet.id },
        data: { balance: new Prisma.Decimal(newBalance) },
      });

      // Tạo transaction record
      await tx.resWalletTransaction.create({
        data: {
          wallet_id: diamondWallet.id,
          user_id: userId,
          type: 'subscription',
          amount: new Prisma.Decimal(-cardPrice), // Negative vì trừ tiền
          balance_before: diamondWallet.balance,
          balance_after: new Prisma.Decimal(newBalance),
          status: 'success',
          reference_id: subscriptionId,
        },
      });

      // Upsert VIP status
      await tx.resVipStatus.upsert({
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
    });

    this.logger.log(
      `Subscription purchased successfully for user ${userId}. Subscription ID: ${subscriptionId}, Price: $${cardPrice}, New balance: $${(currentBalance - cardPrice).toFixed(2)}`,
    );

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
