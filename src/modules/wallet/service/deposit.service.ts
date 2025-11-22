import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { Prisma } from '@prisma/client';
import {
  CreateDepositDto,
  CreateDepositResponseDto,
  WithdrawVexDto,
  WithdrawVexResponseDto,
  DepositInfoResponseDto,
  UpdateDepositNetworkDto,
} from '../dto/diamond-wallet.dto';
import { PayPalService } from '../../payment/service/paypal.service';

@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private paypalService: PayPalService,
  ) {}

  /**
   * Create deposit address (generate wallet address for VEX deposit)
   */
  async createDeposit(userId: string, dto?: CreateDepositDto): Promise<CreateDepositResponseDto> {
    const network = dto?.network || 'Ethereum';

    // Kiểm tra xem đã có deposit address chưa
    const existing = await this.prisma.resDepositAddress.findUnique({
      where: { user_id: userId },
    });

    if (existing) {
      // Nếu đã có và network giống nhau, trả về address hiện tại
      if (existing.network === network) {
        return {
          deposit_address: existing.deposit_address,
          qr_code: existing.qr_code || this.generateQrCode(existing.deposit_address),
          network: existing.network,
        };
      }
      // Nếu network khác, cần generate address mới từ blockchain service
      throw new BadRequestException(
        'Cannot change network. Please create new deposit address with blockchain service integration.',
      );
    }

    // TODO: Tích hợp với blockchain service để generate address thật
    // Cần implement integration với blockchain service (ví dụ: Infura, Alchemy, etc.)
    throw new BadRequestException(
      'Blockchain service not integrated. Please integrate with blockchain service to generate deposit addresses.',
    );
  }

  /**
   * Update deposit network
   */
  async updateDepositNetwork(
    userId: string,
    dto: UpdateDepositNetworkDto,
  ): Promise<CreateDepositResponseDto> {
    // Tạo hoặc update deposit với network mới
    return this.createDeposit(userId, { network: dto.network });
  }

  private generateQrCode(address: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`;
  }

  /**
   * Withdraw VEX về PayPal
   * VEX là tiền ảo nội bộ, rút về PayPal với tỷ giá 1 VEX = 1 USD
   */
  async withdrawVex(userId: string, dto: WithdrawVexDto): Promise<WithdrawVexResponseDto> {
    this.logger.log(
      `User ${userId} requesting VEX withdrawal: ${dto.amount} VEX to ${dto.paypalEmail}`,
    );

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
    if (vexBalance < dto.amount) {
      this.logger.warn(
        `Insufficient VEX balance for user ${userId}. Required: ${dto.amount}, Current: ${vexBalance}`,
      );
      throw new BadRequestException(
        `Số dư VEX không đủ. Cần: ${dto.amount} VEX, Hiện có: ${vexBalance} VEX`,
      );
    }

    const withdrawalId = `WD${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Convert VEX sang USD (1 VEX = 1 USD)
    const amountInUsd = dto.amount;

    try {
      // Tạo PayPal payout
      const payoutResult = await this.paypalService.createPayout(
        dto.paypalEmail,
        amountInUsd,
        'USD',
        `VEX withdrawal - ${dto.amount} VEX`,
      );

      // Trừ VEX từ wallet và tạo transaction record trong một transaction
      await this.prisma.$transaction(async (tx) => {
        // Trừ VEX từ wallet
        const newBalance = vexBalance - dto.amount;
        await tx.resWallet.update({
          where: { id: vexWallet.id },
          data: { balance: new Prisma.Decimal(newBalance) },
        });

        // Tạo withdrawal transaction
        await tx.resWalletTransaction.create({
          data: {
            wallet_id: vexWallet.id,
            user_id: userId,
            type: 'withdraw',
            amount: new Prisma.Decimal(-dto.amount), // Negative vì trừ tiền
            balance_before: vexWallet.balance,
            balance_after: new Prisma.Decimal(newBalance),
            status: 'success',
            reference_id: withdrawalId,
          },
        });
      });

      this.logger.log(
        `VEX withdrawal successful for user ${userId}. Amount: ${dto.amount} VEX ($${amountInUsd} USD) to ${dto.paypalEmail}. Payout ID: ${payoutResult.payoutId}`,
      );

      return {
        withdrawalId,
        status: payoutResult.status,
        message: `VEX withdrawal processed. $${amountInUsd} USD has been sent to ${dto.paypalEmail}`,
      };
    } catch (error) {
      this.logger.error(`Failed to process VEX withdrawal for user ${userId}`, error);

      // Tạo transaction với status failed
      await this.prisma.resWalletTransaction.create({
        data: {
          wallet_id: vexWallet.id,
          user_id: userId,
          type: 'withdraw',
          amount: new Prisma.Decimal(-dto.amount),
          balance_before: vexWallet.balance,
          status: 'failed',
          reference_id: withdrawalId,
        },
      });

      throw new BadRequestException(
        `Failed to process withdrawal: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get deposit info
   * Cached for 30 minutes (deposit address ít thay đổi)
   */
  async getDepositInfo(userId: string): Promise<DepositInfoResponseDto> {
    const cacheKey = `wallet:${userId}:deposit:info`;
    const cacheTtl = 1800; // 30 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy từ DB nếu đã có, nếu chưa có thì tạo mới
        const deposit = await this.createDeposit(userId);

        return {
          deposit_address: deposit.deposit_address,
          qr_code: deposit.qr_code,
          network: deposit.network,
        };
      },
      cacheTtl,
    );
  }
}
