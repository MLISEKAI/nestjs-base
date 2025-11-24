// Import Injectable từ NestJS
import { Injectable } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import DTO để validate và type-check dữ liệu
import { PaymentMethodDto } from '../dto/diamond-wallet.dto';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * PaymentMethodService - Service xử lý business logic cho payment methods
 *
 * Chức năng chính:
 * - Lấy danh sách payment methods (phương thức thanh toán)
 * - Cache payment methods để tối ưu performance
 *
 * Lưu ý:
 * - Payment methods được cache 1 giờ (ít thay đổi)
 * - Chỉ trả về payment methods đang active
 * - Hỗ trợ nhiều loại: PayPal, Credit Card, Bank Transfer, etc.
 */
@Injectable()
export class PaymentMethodService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService và CacheService khi tạo instance của service
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Lấy danh sách payment methods (phương thức thanh toán)
   *
   * @returns Array of PaymentMethodDto chứa thông tin các payment methods
   *
   * Quy trình:
   * 1. Check cache trước (TTL: 1 giờ)
   * 2. Nếu không có cache, query database
   * 3. Filter chỉ lấy payment methods đang active
   * 4. Format response để frontend dễ sử dụng
   * 5. Cache kết quả và return
   *
   * Lưu ý:
   * - Cache key: `wallet:payment:methods`
   * - Cache TTL: 1 giờ (3600 seconds) - payment methods ít thay đổi
   * - Chỉ trả về payment methods có `is_active = true`
   */
  async getPaymentMethods(): Promise<PaymentMethodDto[]> {
    const cacheKey = 'wallet:payment:methods';
    const cacheTtl = 3600; // 1 giờ

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const methods = await this.prisma.resPaymentMethod.findMany({
          where: { is_active: true },
          orderBy: { created_at: 'asc' },
        });

        // Nếu chưa có data trong DB, trả về empty array
        // Admin có thể seed data sau
        return methods.map((method) => ({
          id: method.method_id,
          name: method.name,
          type: method.type,
          masked_info: method.masked_info || undefined,
          is_active: method.is_active,
        }));
      },
      cacheTtl,
    );
  }
}
