import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { IapVerifyReceiptDto, IapVerifyReceiptResponseDto } from '../dto/diamond-wallet.dto';

@Injectable()
export class IapService {
  private readonly logger = new Logger(IapService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Verify IAP receipt (iOS/Android)
   */
  async verifyIapReceipt(
    userId: string,
    dto: IapVerifyReceiptDto,
  ): Promise<IapVerifyReceiptResponseDto> {
    // TODO: Tích hợp với Apple App Store / Google Play Store API để verify receipt
    // Hiện tại mock

    this.logger.log(`Verifying IAP receipt for user ${userId}, platform: ${dto.platform}`);

    // Mock: Parse receipt và extract diamonds
    // Trong thực tế, cần gọi Apple/Google API
    const diamondsAdded = 500; // Mock value

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

    // Update balance
    const newBalance = Number(diamondWallet.balance) + diamondsAdded;
    await this.prisma.resWallet.update({
      where: { id: diamondWallet.id },
      data: {
        balance: new Prisma.Decimal(newBalance),
      },
    });

    // Tạo transaction record
    await this.prisma.resWalletTransaction.create({
      data: {
        wallet_id: diamondWallet.id,
        user_id: userId,
        type: 'deposit',
        amount: new Prisma.Decimal(diamondsAdded),
        balance_before: diamondWallet.balance,
        balance_after: new Prisma.Decimal(newBalance),
        status: 'success',
        reference_id: `IAP-${dto.platform}-${Date.now()}`,
      },
    });

    return {
      status: 'success',
      diamondsAdded,
      newDiamondBalance: newBalance,
    };
  }
}
