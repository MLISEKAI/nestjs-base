import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  WalletSummaryResponseDto,
  VexBalanceResponseDto,
  DiamondBalanceResponseDto,
  ExchangeRateDto,
  DailyLimitsDto,
} from '../dto/diamond-wallet.dto';

@Injectable()
export class WalletSummaryService {
  // Exchange rate: 1 VEX = 0.01657 USD (có thể lấy từ config hoặc external API)
  private readonly VEX_TO_USD_RATE = 0.01657;

  // Daily limits (có thể lấy từ config hoặc user level)
  private readonly DAILY_DEPOSIT_LIMIT = 5000.0;
  private readonly DAILY_WITHDRAW_LIMIT = 2000.0;
  private readonly DAILY_TRANSFER_LIMIT = 1000.0;

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

    // Lấy hoặc tạo VEX wallet
    let vexWallet = await this.prisma.resWallet.findFirst({
      where: {
        user_id: userId,
        currency: 'vex',
      },
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

  /**
   * Get VEX wallet balance with exchange rate and daily limits
   */
  async getVexBalance(userId: string): Promise<VexBalanceResponseDto> {
    // Lấy hoặc tạo VEX wallet
    let vexWallet = await this.prisma.resWallet.findFirst({
      where: {
        user_id: userId,
        currency: 'vex',
      },
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
    const vexBalanceUsd = vexBalance * this.VEX_TO_USD_RATE;

    // Tính daily limits dựa trên transactions VEX trong ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Tính tổng deposit VEX trong ngày
    const todayDeposits = await this.prisma.resWalletTransaction.aggregate({
      where: {
        user_id: userId,
        wallet_id: vexWallet.id,
        type: 'deposit',
        status: 'success',
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Tính tổng withdraw VEX trong ngày
    const todayWithdraws = await this.prisma.resWalletTransaction.aggregate({
      where: {
        user_id: userId,
        wallet_id: vexWallet.id,
        type: 'withdraw',
        status: 'success',
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Tính tổng transfer VEX trong ngày (chỉ outgoing)
    const todayTransfers = await this.prisma.resWalletTransaction.aggregate({
      where: {
        user_id: userId,
        wallet_id: vexWallet.id,
        type: 'transfer',
        status: 'success',
        amount: { lt: 0 }, // Chỉ lấy outgoing transfers (amount < 0)
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const depositUsed = Math.abs(Number(todayDeposits._sum.amount || 0));
    const withdrawUsed = Math.abs(Number(todayWithdraws._sum.amount || 0));
    const transferUsed = Math.abs(Number(todayTransfers._sum.amount || 0));

    const exchangeRate: ExchangeRateDto = {
      vex_to_usd: this.VEX_TO_USD_RATE,
      last_updated: new Date().toISOString(),
    };

    const dailyLimits: DailyLimitsDto = {
      deposit_remaining: Math.max(0, this.DAILY_DEPOSIT_LIMIT - depositUsed),
      withdraw_remaining: Math.max(0, this.DAILY_WITHDRAW_LIMIT - withdrawUsed),
      transfer_remaining: Math.max(0, this.DAILY_TRANSFER_LIMIT - transferUsed),
    };

    return {
      vex_balance: vexBalance,
      vex_balance_usd: Number(vexBalanceUsd.toFixed(2)),
      exchange_rate: exchangeRate,
      daily_limits: dailyLimits,
    };
  }

  /**
   * Get Diamond wallet balance
   */
  async getDiamondBalance(userId: string): Promise<DiamondBalanceResponseDto> {
    // Lấy Diamond wallet (currency = 'gem' hoặc 'diamond')
    const diamondWallet = await this.prisma.resWallet.findFirst({
      where: {
        user_id: userId,
        currency: { in: ['gem', 'diamond'] },
      },
    });

    return {
      diamond_balance: diamondWallet ? Number(diamondWallet.balance) : 0,
    };
  }
}
