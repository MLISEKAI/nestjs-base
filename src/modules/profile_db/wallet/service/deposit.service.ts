import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateDepositResponseDto,
  WithdrawVexDto,
  WithdrawVexResponseDto,
  DepositInfoResponseDto,
} from '../dto/diamond-wallet.dto';

@Injectable()
export class DepositService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create deposit address (generate wallet address for VEX deposit)
   */
  async createDeposit(userId: string): Promise<CreateDepositResponseDto> {
    // TODO: Tích hợp với blockchain service để generate address
    // Hiện tại mock
    const depositAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${depositAddress}`;

    // TODO: Lưu deposit address vào DB (có thể tạo model ResDepositAddress)

    return {
      depositAddress,
      qrCode,
      network: 'Ethereum',
    };
  }

  /**
   * Withdraw VEX
   */
  async withdrawVex(userId: string, dto: WithdrawVexDto): Promise<WithdrawVexResponseDto> {
    // Lấy VEX wallet
    const vexWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: userId, currency: 'vex' },
    });

    if (!vexWallet) {
      throw new NotFoundException('VEX wallet not found');
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
    // Hiện tại chỉ tạo transaction với status pending

    return {
      withdrawalId,
      status: 'pending',
      message: 'Withdrawal request submitted. Processing...',
    };
  }

  /**
   * Get deposit info
   */
  async getDepositInfo(userId: string): Promise<DepositInfoResponseDto> {
    // TODO: Lấy từ DB nếu đã tạo deposit address
    // Hiện tại tạo mới nếu chưa có
    const deposit = await this.createDeposit(userId);

    return {
      depositAddress: deposit.depositAddress,
      qrCode: deposit.qrCode,
      network: deposit.network || 'Ethereum',
    };
  }
}
