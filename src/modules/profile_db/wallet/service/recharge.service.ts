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
   * Get recharge packages (có thể lưu trong DB hoặc hardcode)
   */
  async getRechargePackages(): Promise<RechargePackageDto[]> {
    // TODO: Có thể lưu trong DB table ResRechargePackage
    // Hiện tại hardcode
    return [
      { packageId: 1, diamonds: 100, price: 10000, bonus: 'Bonus 10 diamonds' },
      { packageId: 2, diamonds: 500, price: 45000, bonus: 'Bonus 50 diamonds' },
      { packageId: 3, diamonds: 1000, price: 85000, bonus: 'Bonus 100 diamonds' },
      { packageId: 4, diamonds: 2000, price: 160000, bonus: 'Bonus 200 diamonds' },
      { packageId: 5, diamonds: 5000, price: 380000, bonus: 'Bonus 500 diamonds' },
    ];
  }

  /**
   * Checkout recharge - Create transaction for diamond purchase
   */
  async checkoutRecharge(
    userId: string,
    dto: CheckoutRechargeDto,
  ): Promise<CheckoutRechargeResponseDto> {
    const packages = await this.getRechargePackages();
    const packageData = packages.find((p) => p.packageId === dto.packageId);

    if (!packageData) {
      throw new NotFoundException('Recharge package not found');
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

    return {
      transactionId,
      amount: packageData.price,
      status: 'pending',
      paymentUrl: `https://payment.gateway/checkout/${transactionId}`, // Mock URL
    };
  }
}
