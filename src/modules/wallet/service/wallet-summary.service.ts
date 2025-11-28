// Import Injectable từ NestJS
import { Injectable } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import Prisma types để type-check
import { Prisma } from '@prisma/client';
// Import các DTO để validate và type-check dữ liệu
import {
  WalletSummaryResponseDto,
  VexBalanceResponseDto,
  DiamondBalanceResponseDto,
  ExchangeRateDto,
  DailyLimitsDto,
} from '../dto/diamond-wallet.dto';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * WalletSummaryService - Service xử lý business logic cho wallet summary và statistics
 *
 * Chức năng chính:
 * - Lấy wallet summary (Diamond balance, VEX balance, Monthly card status)
 * - Lấy VEX balance
 * - Lấy Diamond balance
 * - Lấy exchange rate (VEX to USD)
 * - Lấy daily limits (deposit, withdraw, transfer)
 *
 * Lưu ý:
 * - Wallet summary được cache 1 phút (balance thay đổi thường xuyên)
 * - Exchange rate: 1 VEX = 0.01657 USD (có thể lấy từ config hoặc external API)
 * - Daily limits có thể config theo user level
 */
@Injectable()
export class WalletSummaryService {
  /**
   * Exchange rate: 1 VEX = 0.01657 USD
   * Có thể lấy từ config hoặc external API trong tương lai
   */
  private readonly VEX_TO_USD_RATE = 0.01657;

  /**
   * Daily limits (có thể lấy từ config hoặc user level)
   * - Deposit limit: 5000 VEX/ngày
   * - Withdraw limit: 2000 VEX/ngày
   * - Transfer limit: 1000 VEX/ngày
   */
  private readonly DAILY_DEPOSIT_LIMIT = 5000.0;
  private readonly DAILY_WITHDRAW_LIMIT = 2000.0;
  private readonly DAILY_TRANSFER_LIMIT = 1000.0;

  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService và CacheService khi tạo instance của service
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Lấy wallet summary: Diamond balance, VEX balance, Monthly card status
   *
   * @param user_id - User ID (từ JWT token)
   * @returns WalletSummaryResponseDto chứa totalDiamondBalance, vexBalance, monthlyCardStatus
   *
   * Quy trình:
   * 1. Check cache trước (TTL: 1 phút)
   * 2. Nếu không có cache, query database
   * 3. Lấy Diamond wallet (currency = 'diamond')
   * 4. Lấy hoặc tạo VEX wallet (currency = 'vex')
   * 5. Lấy subscription status (VIP status)
   * 6. Cache kết quả và return
   *
   * Lưu ý:
   * - Cache key: `wallet:{user_id}:summary`
   * - Cache TTL: 1 phút (60 seconds) - balance thay đổi thường xuyên
   * - Tự động tạo VEX wallet nếu chưa có
   * - Monthly card status dựa trên VIP status và expiry date
   */
  async getWalletSummary(user_id: string): Promise<WalletSummaryResponseDto> {
    const cacheKey = `wallet:${user_id}:summary`;
    const cacheTtl = 60; // 1 phút (balance thay đổi thường xuyên)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy Diamond wallet (currency = 'diamond')
        // Đồng bộ currency: chỉ dùng 'diamond' cho Diamond và 'vex' cho VEX
        const diamondWallet = await this.prisma.resWallet.findFirst({
          where: {
            user_id: user_id,
            currency: 'diamond',
          },
        });

        // Lấy hoặc tạo VEX wallet
        let vexWallet = await this.prisma.resWallet.findFirst({
          where: {
            user_id: user_id,
            currency: 'vex',
          },
        });

        if (!vexWallet) {
          vexWallet = await this.prisma.resWallet.create({
            data: {
              user_id: user_id,
              currency: 'vex',
              balance: new Prisma.Decimal(0),
            },
          });
        }

        // Lấy subscription status (có thể dùng VIP status hoặc tạo model riêng)
        const vipStatus = await this.prisma.resVipStatus.findUnique({
          where: { user_id: user_id },
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
      },
      cacheTtl,
    );
  }

  /**
   * Get VEX wallet balance with exchange rate and daily limits
   * Cached for 1 minute (balance thay đổi thường xuyên)
   */
  async getVexBalance(user_id: string): Promise<VexBalanceResponseDto> {
    const cacheKey = `wallet:${user_id}:vex:balance`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy hoặc tạo VEX wallet
        let vexWallet = await this.prisma.resWallet.findFirst({
          where: {
            user_id: user_id,
            currency: 'vex',
          },
        });

        if (!vexWallet) {
          vexWallet = await this.prisma.resWallet.create({
            data: {
              user_id: user_id,
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
            user_id: user_id,
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
            user_id: user_id,
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
            user_id: user_id,
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
      },
      cacheTtl,
    );
  }

  /**
   * Get Diamond wallet balance
   * Cached for 1 minute (balance thay đổi thường xuyên)
   */
  async getDiamondBalance(user_id: string): Promise<DiamondBalanceResponseDto> {
    const cacheKey = `wallet:${user_id}:diamond:balance`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy Diamond wallet (currency = 'diamond')
        // Đồng bộ currency: chỉ dùng 'diamond' cho Diamond và 'vex' cho VEX
        const diamondWallet = await this.prisma.resWallet.findFirst({
          where: {
            user_id: user_id,
            currency: 'diamond',
          },
        });

        return {
          diamond_balance: diamondWallet ? Number(diamondWallet.balance) : 0,
        };
      },
      cacheTtl,
    );
  }
}
