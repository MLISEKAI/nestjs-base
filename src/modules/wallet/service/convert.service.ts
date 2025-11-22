import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ConvertVexToDiamondDto,
  ConvertVexToDiamondResponseDto,
  VexPackageDto,
} from '../dto/diamond-wallet.dto';

@Injectable()
export class ConvertService {
  // VEX to Diamond conversion packages với bonus
  // Theo ảnh: các gói cố định với base diamonds và bonus
  private readonly VEX_CONVERSION_PACKAGES = [
    { vexAmount: 20, baseDiamonds: 435, bonus: 115 }, // 20 VEX → 435 + 115 = 550 diamonds
    { vexAmount: 50, baseDiamonds: 1230, bonus: 340 }, // 50 VEX → 1230 + 340 = 1570 diamonds
    { vexAmount: 80, baseDiamonds: 3210, bonus: 860 }, // 80 VEX → 3210 + 860 = 4070 diamonds
    { vexAmount: 120, baseDiamonds: 15380, bonus: 4620 }, // 120 VEX → 15380 + 4620 = 20000 diamonds
    { vexAmount: 200, baseDiamonds: 36920, bonus: 11080 }, // 200 VEX → 36920 + 11080 = 48000 diamonds
    { vexAmount: 420, baseDiamonds: 112300, bonus: 33700 }, // 420 VEX → 112300 + 33700 = 146000 diamonds
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách các gói mua Diamond bằng VEX
   */
  getVexPackages(): VexPackageDto[] {
    return this.VEX_CONVERSION_PACKAGES.map((pkg, index) => ({
      packageId: index + 1,
      vexAmount: pkg.vexAmount,
      baseDiamonds: pkg.baseDiamonds,
      bonusDiamonds: pkg.bonus,
      totalDiamonds: pkg.baseDiamonds + pkg.bonus,
    }));
  }

  /**
   * Tìm gói conversion phù hợp dựa trên VEX amount
   * Chỉ chấp nhận các gói cố định: 20, 50, 80, 120, 200, 420 VEX
   */
  private findConversionPackage(vexAmount: number): { baseDiamonds: number; bonus: number } | null {
    // Tìm gói chính xác
    const exactPackage = this.VEX_CONVERSION_PACKAGES.find((pkg) => pkg.vexAmount === vexAmount);
    if (exactPackage) {
      return { baseDiamonds: exactPackage.baseDiamonds, bonus: exactPackage.bonus };
    }

    // Không tìm thấy gói chính xác
    return null;
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

    // Tìm gói conversion phù hợp
    const conversionPackage = this.findConversionPackage(dto.vexAmount);
    if (!conversionPackage) {
      throw new BadRequestException(
        `Invalid VEX amount: ${dto.vexAmount}. Chỉ hỗ trợ các gói: 20, 50, 80, 120, 200, 420 VEX.`,
      );
    }

    // Tính số Diamond nhận được (base + bonus)
    const baseDiamonds = conversionPackage.baseDiamonds;
    const bonusDiamonds = conversionPackage.bonus;
    const totalDiamondsReceived = baseDiamonds + bonusDiamonds;

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
