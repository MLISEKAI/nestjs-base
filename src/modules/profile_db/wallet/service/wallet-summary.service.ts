import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletSummaryResponseDto } from '../dto/diamond-wallet.dto';

@Injectable()
export class WalletSummaryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get wallet summary: Diamond balance, VEX balance, Monthly card status
   */
  async getWalletSummary(userId: string): Promise<WalletSummaryResponseDto> {
    // Lấy Diamond wallet (currency = 'gem' hoặc 'diamond')
    const diamondWallet = await this.prisma.resWallet.findFirst({
      where: {
        user_id: userId,
        currency: { in: ['gem', 'diamond'] },
      },
    });

    // Lấy VEX wallet
    const vexWallet = await this.prisma.resWallet.findFirst({
      where: {
        user_id: userId,
        currency: 'vex',
      },
    });

    // Lấy subscription status (có thể dùng VIP status hoặc tạo model riêng)
    const vipStatus = await this.prisma.resVipStatus.findUnique({
      where: { user_id: userId },
    });

    const monthlyCardStatus =
      vipStatus && vipStatus.is_vip && vipStatus.expiry && vipStatus.expiry > new Date()
        ? 'active'
        : 'inactive';

    return {
      totalDiamondBalance: diamondWallet ? Number(diamondWallet.balance) : 0,
      vexBalance: vexWallet ? Number(vexWallet.balance) : 0,
      monthlyCardStatus,
    };
  }
}
