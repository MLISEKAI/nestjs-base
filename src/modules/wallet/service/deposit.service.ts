import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class DepositService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
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
   * Withdraw VEX
   */
  async withdrawVex(userId: string, dto: WithdrawVexDto): Promise<WithdrawVexResponseDto> {
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
      throw new BadRequestException('Insufficient VEX balance');
    }

    const withdrawalId = `WD${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Tạo withdrawal transaction
    await this.prisma.resWalletTransaction.create({
      data: {
        wallet_id: vexWallet.id,
        user_id: userId,
        type: 'withdraw',
        amount: new Prisma.Decimal(dto.amount),
        balance_before: vexWallet.balance,
        status: 'pending',
        reference_id: withdrawalId,
      },
    });

    // TODO: Gửi request đến blockchain service để process withdrawal
    // Cần implement integration với blockchain service để thực hiện withdrawal thật

    // Hiện tại chỉ tạo transaction với status pending
    // Trong production, cần gọi blockchain service API để process withdrawal

    return {
      withdrawalId,
      status: 'pending',
      message: 'Withdrawal request submitted. Please integrate with blockchain service to process.',
    };
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
