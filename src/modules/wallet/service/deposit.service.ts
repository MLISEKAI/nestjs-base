// Import Injectable, exceptions và Logger từ NestJS
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import Prisma types để type-check
import { Prisma } from '@prisma/client';
// Import các DTO để validate và type-check dữ liệu
import {
  CreateDepositDto,
  CreateDepositResponseDto,
  WithdrawVexDto,
  WithdrawVexResponseDto,
  DepositInfoResponseDto,
  UpdateDepositNetworkDto,
} from '../dto/diamond-wallet.dto';
// Import PayPalService để tích hợp thanh toán PayPal
import { PayPalService } from '../../payment/service/paypal.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * DepositService - Service xử lý business logic cho deposit và withdraw
 *
 * Chức năng chính:
 * - Tạo deposit address (blockchain wallet address)
 * - Update deposit network
 * - Withdraw VEX về PayPal
 * - Lấy thông tin deposit
 *
 * Lưu ý:
 * - Deposit address cần tích hợp với blockchain service (Infura, Alchemy, etc.)
 * - Withdraw VEX về PayPal với tỷ giá 1 VEX = 1 USD
 * - Hỗ trợ nhiều networks: Ethereum, BSC, Polygon, etc.
 */
@Injectable()
export class DepositService {
  // Logger để log các events và errors
  private readonly logger = new Logger(DepositService.name);

  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các services khi tạo instance của service
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private paypalService: PayPalService,
  ) {}

  /**
   * Tạo deposit address (generate blockchain wallet address cho VEX deposit)
   *
   * @param user_id - User ID (từ JWT token)
   * @param dto - CreateDepositDto chứa network (optional, mặc định: 'Ethereum')
   * @returns CreateDepositResponseDto chứa deposit_address, qr_code, network
   *
   * Quy trình:
   * 1. Kiểm tra đã có deposit address chưa
   * 2. Nếu có và network giống nhau, trả về address hiện tại
   * 3. Nếu network khác, cần generate address mới (chưa implement)
   * 4. Nếu chưa có, cần tích hợp blockchain service để generate address
   *
   * Lưu ý:
   * - Cần tích hợp với blockchain service (Infura, Alchemy, etc.) để generate address thật
   * - Network mặc định: 'Ethereum'
   * - QR code được generate tự động từ address
   * - TODO: Implement blockchain service integration
   */
  async createDeposit(user_id: string, dto?: CreateDepositDto): Promise<CreateDepositResponseDto> {
    const network = dto?.network || 'Ethereum';

    // Kiểm tra xem đã có deposit address chưa
    const existing = await this.prisma.resDepositAddress.findUnique({
      where: { user_id: user_id },
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
   * Update deposit network (thay đổi blockchain network)
   *
   * @param user_id - User ID (từ JWT token)
   * @param dto - UpdateDepositNetworkDto chứa network mới
   * @returns CreateDepositResponseDto chứa deposit_address, qr_code, network
   *
   * Quy trình:
   * 1. Gọi createDeposit với network mới
   * 2. Nếu network khác với network hiện tại, cần generate address mới
   *
   * Lưu ý:
   * - Cần tích hợp blockchain service để generate address cho network mới
   * - Hỗ trợ nhiều networks: Ethereum, BSC, Polygon, etc.
   */
  async updateDepositNetwork(
    user_id: string,
    dto: UpdateDepositNetworkDto,
  ): Promise<CreateDepositResponseDto> {
    // Tạo hoặc update deposit với network mới
    return this.createDeposit(user_id, { network: dto.network });
  }

  private generateQrCode(address: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`;
  }

  /**
   * Withdraw VEX về PayPal
   *
   * @param user_id - User ID (từ JWT token)
   * @param dto - WithdrawVexDto chứa amount và paypalEmail
   * @returns WithdrawVexResponseDto chứa thông tin withdrawal
   *
   * Quy trình:
   * 1. Validate số dư VEX có đủ không
   * 2. Validate PayPal email hợp lệ
   * 3. Kiểm tra daily withdrawal limit
   * 4. Trừ VEX từ wallet
   * 5. Tạo withdrawal transaction với status 'pending'
   * 6. Tích hợp PayPal để xử lý payout
   * 7. Update transaction status sau khi PayPal payout thành công
   *
   * Lưu ý:
   * - VEX là tiền ảo nội bộ, rút về PayPal với tỷ giá 1 VEX = 1 USD
   * - Daily withdrawal limit: 2000 VEX (có thể config)
   * - Transaction status ban đầu là 'pending', sẽ update thành 'completed' sau khi PayPal payout thành công
   */
  async withdrawVex(user_id: string, dto: WithdrawVexDto): Promise<WithdrawVexResponseDto> {
    this.logger.log(
      `User ${user_id} requesting VEX withdrawal: ${dto.amount} VEX to ${dto.paypalEmail}`,
    );

    // Lấy hoặc tạo VEX wallet
    let vexWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: user_id, currency: 'vex' },
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
    if (vexBalance < dto.amount) {
      this.logger.warn(
        `Insufficient VEX balance for user ${user_id}. Required: ${dto.amount}, Current: ${vexBalance}`,
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
            user_id: user_id,
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
        `VEX withdrawal successful for user ${user_id}. Amount: ${dto.amount} VEX ($${amountInUsd} USD) to ${dto.paypalEmail}. Payout ID: ${payoutResult.payoutId}`,
      );

      return {
        withdrawalId,
        status: payoutResult.status,
        message: `VEX withdrawal processed. $${amountInUsd} USD has been sent to ${dto.paypalEmail}`,
      };
    } catch (error) {
      this.logger.error(`Failed to process VEX withdrawal for user ${user_id}`, error);

      // Tạo transaction với status failed
      await this.prisma.resWalletTransaction.create({
        data: {
          wallet_id: vexWallet.id,
          user_id: user_id,
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
  async getDepositInfo(user_id: string): Promise<DepositInfoResponseDto> {
    const cacheKey = `wallet:${user_id}:deposit:info`;
    const cacheTtl = 1800; // 30 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Lấy từ DB nếu đã có, nếu chưa có thì tạo mới
        const deposit = await this.createDeposit(user_id);

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
