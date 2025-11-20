import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ConvertVexToDiamondDto, ConvertVexToDiamondResponseDto } from '../dto/diamond-wallet.dto';

@Injectable()
export class ConvertService {
  // Exchange rate: 1 VEX = 0.1 Diamond (có thể config trong env)
  private readonly VEX_TO_DIAMOND_RATE = 0.1;

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate bonus diamonds based on VEX amount
   * Bonus tiers:
   * - 435 VEX: +20 bonus
   * - 1230 VEX: +50 bonus
   * - 3210 VEX: +80 bonus
   * - 15380 VEX: +120 bonus
   * - 36920 VEX: +200 bonus
   * - 112300 VEX: +420 bonus
   */
  private calculateBonus(vexAmount: number): number {
    if (vexAmount >= 112300) return 420;
    if (vexAmount >= 36920) return 200;
    if (vexAmount >= 15380) return 120;
    if (vexAmount >= 3210) return 80;
    if (vexAmount >= 1230) return 50;
    if (vexAmount >= 435) return 20;
    return 0;
  }

  /**
   * Convert VEX to Diamond
   */
  async convertVexToDiamond(
    userId: string,
    dto: ConvertVexToDiamondDto,
  ): Promise<ConvertVexToDiamondResponseDto> {
    // Lấy hoặc tạo VEX wallet
    let vexWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: userId, currency: 'vex' },
    });

    if (!vexWallet) {
      vexWallet = await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: 'vex',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    const vexBalance = Number(vexWallet.balance);
    if (vexBalance < dto.vexAmount) {
      throw new BadRequestException('Insufficient VEX balance');
    }

    // Tính số Diamond nhận được (base)
    const baseDiamonds = Math.floor(dto.vexAmount * this.VEX_TO_DIAMOND_RATE);
    // Tính bonus
    const bonusDiamonds = this.calculateBonus(dto.vexAmount);
    const totalDiamondsReceived = baseDiamonds + bonusDiamonds;

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

    // Update balances trong transaction
    await this.prisma.$transaction(async (tx) => {
      // Trừ VEX
      await tx.resWallet.update({
        where: { id: vexWallet.id },
        data: {
          balance: new Prisma.Decimal(vexBalance - dto.vexAmount),
        },
      });

      // Cộng Diamond (base + bonus)
      const newDiamondBalance = Number(diamondWallet.balance) + totalDiamondsReceived;
      await tx.resWallet.update({
        where: { id: diamondWallet.id },
        data: {
          balance: new Prisma.Decimal(newDiamondBalance),
        },
      });

      // Tạo transaction record
      await tx.resWalletTransaction.create({
        data: {
          wallet_id: diamondWallet.id,
          user_id: userId,
          type: 'convert',
          amount: new Prisma.Decimal(totalDiamondsReceived),
          balance_before: diamondWallet.balance,
          balance_after: new Prisma.Decimal(newDiamondBalance),
          status: 'success',
          reference_id: `CONVERT-${Date.now()}`,
        },
      });
    });

    // Refresh wallet để lấy balance mới
    const updatedVexWallet = await this.prisma.resWallet.findUnique({
      where: { id: vexWallet.id },
    });
    const updatedDiamondWallet = await this.prisma.resWallet.findUnique({
      where: { id: diamondWallet.id },
    });

    return {
      diamondsReceived: baseDiamonds,
      bonusDiamonds,
      totalDiamondsReceived,
      newDiamondBalance: updatedDiamondWallet ? Number(updatedDiamondWallet.balance) : 0,
      newVexBalance: updatedVexWallet ? Number(updatedVexWallet.balance) : 0,
    };
  }
}
