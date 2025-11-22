import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { Prisma } from '@prisma/client';
import {
  RechargePackageDto,
  MonthlyCardDto,
  CheckoutRechargeDto,
  CheckoutRechargeResponseDto,
} from '../dto/diamond-wallet.dto';
import { PayPalService } from '../../payment/service/paypal.service';

@Injectable()
export class RechargeService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private paypalService: PayPalService,
  ) {}

  /**
   * Get recharge packages from database
   * Cached for 1 hour (packages ít thay đổi)
   */
  async getRechargePackages(): Promise<RechargePackageDto[]> {
    const cacheKey = 'wallet:recharge:packages';
    const cacheTtl = 3600; // 1 giờ

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const packages = await this.prisma.resRechargePackage.findMany({
          where: { is_active: true },
          orderBy: { package_id: 'asc' },
        });

        // Nếu chưa có data trong DB, trả về empty array
        // Admin có thể seed data sau
        return packages.map((pkg) => ({
          packageId: pkg.package_id,
          diamonds: pkg.diamonds,
          price: Number(pkg.price),
          bonus: pkg.bonus || undefined,
        }));
      },
      cacheTtl,
    );
  }

  /**
   * Checkout recharge - Create transaction for diamond or VEX purchase
   * @param currency - 'diamond' hoặc 'vex'. Mặc định: 'diamond'
   */
  async checkoutRecharge(
    userId: string,
    dto: CheckoutRechargeDto,
  ): Promise<CheckoutRechargeResponseDto> {
    const currency = dto.currency || 'diamond'; // Mặc định là diamond

    // Query package từ DB
    const packageData = await this.prisma.resRechargePackage.findUnique({
      where: { package_id: dto.packageId },
    });

    if (!packageData || !packageData.is_active) {
      throw new NotFoundException('Recharge package not found or inactive');
    }

    // Tạo transaction
    const transactionId = `TX${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Lấy hoặc tạo wallet theo currency
    let wallet = await this.prisma.resWallet.findFirst({
      where: { user_id: userId, currency },
    });

    if (!wallet) {
      wallet = await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    // Tính số lượng currency nhận được
    // Nếu mua VEX: 1 USD = 1 VEX (có thể config tỷ giá)
    // Nếu mua Diamond: dùng diamonds từ package
    const amountToAdd =
      currency === 'vex'
        ? Number(packageData.price) // 1 USD = 1 VEX (có thể config)
        : packageData.diamonds;

    // Tạo transaction record
    await this.prisma.resWalletTransaction.create({
      data: {
        wallet_id: wallet.id,
        user_id: userId,
        type: 'deposit',
        amount: new Prisma.Decimal(amountToAdd),
        balance_before: wallet.balance,
        status: 'pending',
        reference_id: transactionId,
      },
    });

    // Tích hợp PayPal để tạo payment session
    try {
      // Price trong database đã là USD
      const priceInUsd = Number(packageData.price);

      const { paymentUrl } = await this.paypalService.createOrder(transactionId, priceInUsd, 'USD');

      return {
        transactionId,
        price: priceInUsd, // Giá tiền phải thanh toán (USD)
        status: 'pending',
        paymentUrl, // ✅ PayPal payment URL
      };
    } catch (error) {
      // Nếu PayPal service chưa được config hoặc lỗi, vẫn trả về transactionId
      // Frontend có thể xử lý fallback hoặc hiển thị error
      return {
        transactionId,
        price: Number(packageData.price),
        status: 'pending',
        paymentUrl: undefined, // PayPal chưa được config hoặc có lỗi
      };
    }
  }
}
