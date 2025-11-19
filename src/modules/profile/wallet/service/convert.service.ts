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
   * Convert VEX to Diamond
   */
  async convertVexToDiamond(
    userId: string,
    dto: ConvertVexToDiamondDto,
  ): Promise<ConvertVexToDiamondResponseDto> {
    // Lấy VEX wallet
    const vexWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: userId, currency: 'vex' },
    });

    if (!vexWallet) {
      throw new NotFoundException('VEX wallet not found');
    }

    const vexBalance = Number(vexWallet.balance);
    if (vexBalance < dto.vexAmount) {
      throw new BadRequestException('Insufficient VEX balance');
    }

    // Tính số Diamond nhận được
    const diamondsReceived = Math.floor(dto.vexAmount * this.VEX_TO_DIAMOND_RATE);

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

      // Cộng Diamond
      const newDiamondBalance = Number(diamondWallet.balance) + diamondsReceived;
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
          amount: new Prisma.Decimal(diamondsReceived),
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
      diamondsReceived,
      newDiamondBalance: updatedDiamondWallet ? Number(updatedDiamondWallet.balance) : 0,
      newVexBalance: updatedVexWallet ? Number(updatedVexWallet.balance) : 0,
    };
  }
}
