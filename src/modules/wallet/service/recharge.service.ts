// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import Prisma types để type-check
import { Prisma } from '@prisma/client';
// Import các DTO để validate và type-check dữ liệu
import {
  RechargePackageDto,
  MonthlyCardDto,
  CheckoutRechargeDto,
  CheckoutRechargeResponseDto,
} from '../dto/diamond-wallet.dto';
// Import PayPalService để tích hợp thanh toán PayPal
import { PayPalService } from '../../payment/service/paypal.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * RechargeService - Service xử lý business logic cho nạp tiền (recharge)
 *
 * Chức năng chính:
 * - Lấy danh sách recharge packages (gói nạp tiền)
 * - Xử lý checkout recharge (tạo transaction và PayPal payment)
 * - Hỗ trợ nạp Diamond và VEX
 *
 * Lưu ý:
 * - Recharge packages được cache 1 giờ (ít thay đổi)
 * - Tích hợp PayPal để thanh toán
 * - Tự động tạo wallet nếu chưa có
 */
@Injectable()
export class RechargeService {
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
   * Lấy danh sách recharge packages (gói nạp tiền)
   *
   * @returns Array of RechargePackageDto chứa thông tin các gói nạp tiền
   *
   * Quy trình:
   * 1. Check cache trước (TTL: 1 giờ)
   * 2. Nếu không có cache, query database
   * 3. Filter chỉ lấy packages đang active
   * 4. Cache kết quả và return
   *
   * Lưu ý:
   * - Cache key: `wallet:recharge:packages`
   * - Cache TTL: 1 giờ (3600 seconds) - packages ít thay đổi
   * - Chỉ trả về packages có `is_active = true`
   */
  async getRechargePackages(): Promise<RechargePackageDto[]> {
    const cacheKey = 'wallet:recharge:packages';
    const cacheTtl = 3600; // 1 giờ

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const packages = await this.prisma.resRechargePackage.findMany({
          where: { is_active: true },
          orderBy: { package_id: 'asc' },
        });

        // Nếu chưa có data trong DB, trả về empty array
        // Admin có thể seed data sau
        return packages.map((pkg) => ({
          packageId: pkg.package_id,
          diamonds: pkg.diamonds,
          price: Number(pkg.price),
          bonus: pkg.bonus || undefined,
        }));
      },
      cacheTtl,
    );
  }

  /**
   * Checkout recharge - Tạo transaction và PayPal payment cho việc nạp tiền
   *
   * @param user_id - User ID (từ JWT token)
   * @param dto - CheckoutRechargeDto chứa packageId và currency
   * @returns CheckoutRechargeResponseDto chứa transactionId, price, paymentUrl
   *
   * Quy trình:
   * 1. Validate package tồn tại và đang active
   * 2. Tạo transaction ID unique
   * 3. Lấy hoặc tạo wallet theo currency (diamond hoặc vex)
   * 4. Tính số lượng currency nhận được (diamonds hoặc VEX)
   * 5. Tạo transaction record với status 'pending'
   * 6. Tích hợp PayPal để tạo payment session
   * 7. Return transaction info và PayPal payment URL
   *
   * Lưu ý:
   * - Currency mặc định: 'diamond'
   * - Nếu mua VEX: 1 USD = 1 VEX (có thể config tỷ giá)
   * - Nếu mua Diamond: dùng diamonds từ package
   * - Transaction status ban đầu là 'pending', sẽ update thành 'completed' sau khi PayPal payment thành công
   */
  async checkoutRecharge(
    user_id: string,
    dto: CheckoutRechargeDto,
  ): Promise<CheckoutRechargeResponseDto> {
    const currency = dto.currency || 'diamond'; // Mặc định là diamond

    // Query package từ DB
    const packageData = await this.prisma.resRechargePackage.findUnique({
      where: { package_id: dto.packageId },
    });

    if (!packageData || !packageData.is_active) {
      throw new NotFoundException('Recharge package not found or inactive');
    }

    // Tạo transaction
    const transactionId = `TX${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Lấy hoặc tạo wallet theo currency
    let wallet = await this.prisma.resWallet.findFirst({
      where: { user_id: user_id, currency },
    });

    if (!wallet) {
      wallet = await this.prisma.resWallet.create({
        data: {
          user_id: user_id,
          currency,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    // Tính số lượng currency nhận được
    // Nếu mua VEX: 1 USD = 1 VEX (có thể config tỷ giá)
    // Nếu mua Diamond: dùng diamonds từ package
    const amountToAdd =
      currency === 'vex'
        ? Number(packageData.price) // 1 USD = 1 VEX (có thể config)
        : packageData.diamonds;

    // Tạo transaction record
    await this.prisma.resWalletTransaction.create({
      data: {
        wallet_id: wallet.id,
        user_id: user_id,
        type: 'deposit',
        amount: new Prisma.Decimal(amountToAdd),
        balance_before: wallet.balance,
        status: 'pending',
        reference_id: transactionId,
      },
    });

    // Tích hợp PayPal để tạo payment session
    try {
      // Price trong database đã là USD
      const priceInUsd = Number(packageData.price);

      const { paymentUrl } = await this.paypalService.createOrder(transactionId, priceInUsd, 'USD');

      return {
        transactionId,
        price: priceInUsd, // Giá tiền phải thanh toán (USD)
        status: 'pending',
        paymentUrl, // ✅ PayPal payment URL
      };
    } catch (error) {
      // Nếu PayPal service chưa được config hoặc lỗi, vẫn trả về transactionId
      // Frontend có thể xử lý fallback hoặc hiển thị error
      return {
        transactionId,
        price: Number(packageData.price),
        status: 'pending',
        paymentUrl: undefined, // PayPal chưa được config hoặc có lỗi
      };
    }
  }
}
