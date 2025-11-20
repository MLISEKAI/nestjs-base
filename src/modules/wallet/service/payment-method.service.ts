import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { PaymentMethodDto } from '../dto/diamond-wallet.dto';

@Injectable()
export class PaymentMethodService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Get available payment methods from database
   * Cached for 1 hour (payment methods ít thay đổi)
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
