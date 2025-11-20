import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  RechargePackageDto,
  MonthlyCardDto,
  CheckoutRechargeDto,
  CheckoutRechargeResponseDto,
} from '../dto/diamond-wallet.dto';

@Injectable()
export class RechargeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get recharge packages from database
   */
  async getRechargePackages(): Promise<RechargePackageDto[]> {
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
  }

  /**
   * Checkout recharge - Create transaction for diamond purchase
   */
  async checkoutRecharge(
    userId: string,
    dto: CheckoutRechargeDto,
  ): Promise<CheckoutRechargeResponseDto> {
    // Query package từ DB
    const packageData = await this.prisma.resRechargePackage.findUnique({
      where: { package_id: dto.packageId },
    });

    if (!packageData || !packageData.is_active) {
      throw new NotFoundException('Recharge package not found or inactive');
    }

    // Tạo transaction
    const transactionId = `TX${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Lấy hoặc tạo Diamond wallet
    let diamondWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: userId, currency: { in: ['gem', 'diamond'] } },
    });

    if (!diamondWallet) {
      diamondWallet = await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: 'gem',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    // Tạo transaction record
    await this.prisma.resWalletTransaction.create({
      data: {
        wallet_id: diamondWallet.id,
        user_id: userId,
        type: 'deposit',
        amount: new Prisma.Decimal(packageData.diamonds),
        balance_before: diamondWallet.balance,
        status: 'pending',
        reference_id: transactionId,
      },
    });

    // TODO: Tích hợp payment gateway thật (Stripe, PayPal, VNPay, etc.)
    // Cần implement:
    // - Tạo payment session với payment gateway
    // - Lưu payment session ID vào transaction
    // - Webhook handler để update transaction status khi payment thành công

    return {
      transactionId,
      amount: Number(packageData.price),
      status: 'pending',
      // paymentUrl sẽ được tạo từ payment gateway integration
      // paymentUrl: await this.paymentGateway.createCheckoutSession(transactionId, amount),
    };
  }
}
