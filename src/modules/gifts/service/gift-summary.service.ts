import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { GiftCatalogService } from './gift-catalog.service';
import { GiftCrudService } from './gift-crud.service';

@Injectable()
export class GiftSummaryService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private catalogService: GiftCatalogService,
    private crudService: GiftCrudService,
  ) {}

  /**
   * Get gifts overview - Gộp items mẫu (chỉ một số items để hiển thị) và total_count
   * Items chỉ cần id, name, image_url để hiển thị icon quà
   * Khác với GET /gifts/items (trả về tất cả items), endpoint này chỉ trả về một số items mẫu
   */
  async getGiftsOverview(userId: string, type?: string, limit: number = 3) {
    const cacheKey = `user:${userId}:gifts:overview:${limit}:${type || 'all'}`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Gọi 2 service methods song song để tối ưu performance
        const [items, totalCount] = await Promise.all([
          this.catalogService.getGiftItemsSample(limit, type), // Chỉ lấy limit items mẫu
          this.crudService.getCount(userId),
        ]);

        return {
          items, // Danh sách quà mẫu (chỉ id, name, image_url) - không phải tất cả
          total_count: totalCount, // Tổng số quà đã nhận
        };
      },
      cacheTtl,
    );
  }

  async getTopSupporters(userId: string) {
    const cacheKey = `user:${userId}:gifts:top-supporters`;
    const cacheTtl = 300; // 5 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const supporters = await this.prisma.resSupporter.findMany({
          where: { user_id: userId },
          orderBy: { amount: 'desc' },
          take: 5,
        });
        return supporters;
      },
      cacheTtl,
    );
  }
}
