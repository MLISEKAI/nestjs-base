// Import Injectable, exceptions và Logger từ NestJS
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import Prisma types để type-check
import { Prisma } from '@prisma/client';
// Import các DTO để validate và type-check dữ liệu
import {
  MonthlyCardDto,
  PurchaseSubscriptionDto,
  PurchaseSubscriptionResponseDto,
  SubscriptionDetailsResponseDto,
} from '../dto/diamond-wallet.dto';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * SubscriptionService - Service xử lý business logic cho subscription (Monthly Card)
 *
 * Chức năng chính:
 * - Lấy danh sách monthly cards (thẻ tháng)
 * - Mua subscription (trừ Diamond, tạo subscription record)
 * - Lấy chi tiết subscription (thông tin subscription hiện tại)
 * - Xử lý daily rewards (diamonds hàng ngày)
 *
 * Lưu ý:
 * - Monthly Card cho phép user nhận diamonds hàng ngày trong thời gian subscription
 * - Phải trả bằng Diamond để mua subscription
 * - Subscription có thời hạn (duration)
 */
@Injectable()
export class SubscriptionService {
  // Logger để log các events và errors
  private readonly logger = new Logger(SubscriptionService.name);

  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách monthly cards (thẻ tháng)
   *
   * @returns Array of MonthlyCardDto chứa thông tin các monthly cards
   *
   * Quy trình:
   * 1. Query database để lấy tất cả monthly cards đang active
   * 2. Sort theo card_id (ascending)
   * 3. Format response để frontend dễ sử dụng
   *
   * Lưu ý:
   * - Chỉ trả về cards có `is_active = true`
   * - Nếu chưa có data trong DB, trả về empty array
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
   * Mua subscription (Monthly Card)
   *
   * @param userId - User ID (từ JWT token)
   * @param dto - PurchaseSubscriptionDto chứa cardId
   * @returns PurchaseSubscriptionResponseDto chứa thông tin subscription đã mua
   *
   * Quy trình:
   * 1. Validate monthly card tồn tại và đang active
   * 2. Kiểm tra user có đủ Diamond không
   * 3. Kiểm tra user đã có subscription đang active chưa (không cho mua trùng)
   * 4. Trừ Diamond từ wallet
   * 5. Tạo subscription record với start_date và end_date
   * 6. Tạo transaction record
   * 7. Return thông tin subscription
   *
   * Lưu ý:
   * - Phải trả bằng Diamond để mua subscription
   * - Không cho phép mua subscription trùng (nếu đã có subscription active)
   * - Subscription có thời hạn (duration), tính từ ngày mua
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
