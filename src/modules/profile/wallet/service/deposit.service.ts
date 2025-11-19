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
    // Kiểm tra xem đã có deposit address chưa
    const existing = await this.prisma.resDepositAddress.findUnique({
      where: { user_id: userId },
    });

    if (existing) {
      // Nếu đã có, trả về address hiện tại
      return {
        deposit_address: existing.deposit_address,
        qr_code: existing.qr_code || this.generateQrCode(existing.deposit_address),
        network: existing.network,
      };
    }

    // TODO: Tích hợp với blockchain service để generate address thật
    // Hiện tại generate mock address
    const depositAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
    const qrCode = this.generateQrCode(depositAddress);

    // Lưu deposit address vào DB
    await this.prisma.resDepositAddress.create({
      data: {
        user_id: userId,
        deposit_address: depositAddress,
        qr_code: qrCode,
        network: 'Ethereum',
      },
    });

    return {
      deposit_address: depositAddress,
      qr_code: qrCode,
      network: 'Ethereum',
    };
  }

  private generateQrCode(address: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`;
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
    // Lấy từ DB nếu đã có, nếu chưa có thì tạo mới
    const deposit = await this.createDeposit(userId);

    return {
      deposit_address: deposit.deposit_address,
      qr_code: deposit.qr_code,
      network: deposit.network,
    };
  }
}
