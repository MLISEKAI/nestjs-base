// Import Injectable từ NestJS
import { Injectable } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import utility function để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import các services khác để sử dụng
import { GiftCatalogService } from './gift-catalog.service';
import { GiftCrudService } from './gift-crud.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * GiftSummaryService - Service xử lý business logic cho gift summary và statistics
 *
 * Chức năng chính:
 * - Lấy tổng quan gifts (overview) với items mẫu và total count
 * - Lấy top supporters (người tặng quà nhiều nhất)
 * - Cache data để tối ưu performance
 *
 * Lưu ý:
 * - Overview chỉ trả về một số items mẫu (không phải tất cả)
 * - Top supporters được cache 5 phút
 * - Overview được cache 1 phút
 */
@Injectable()
export class GiftSummaryService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các services khi tạo instance của service
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private catalogService: GiftCatalogService,
    private crudService: GiftCrudService,
  ) {}

  /**
   * Lấy tổng quan gifts (overview) với items mẫu và total count
   *
   * @param userId - User ID
   * @param type - Filter theo gift type (optional)
   * @param limit - Số lượng items mẫu cần lấy (mặc định: 3)
   * @returns Object chứa items mẫu và total_count
   *
   * Quy trình:
   * 1. Check cache trước (TTL: 1 phút)
   * 2. Nếu không có cache, gọi 2 service methods song song
   * 3. Cache kết quả và return
   *
   * Lưu ý:
   * - Items chỉ cần id, name, image_url để hiển thị icon quà
   * - Khác với GET /gifts/items (trả về tất cả items), endpoint này chỉ trả về một số items mẫu
   * - Cache key: `user:{userId}:gifts:overview:{limit}:{type || 'all'}`
   * - Cache TTL: 1 phút (60 seconds)
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

  /**
   * Lấy top supporters (người tặng quà nhiều nhất)
   *
   * @param userId - User ID
   * @returns Array of top supporters (tối đa 5 người)
   *
   * Quy trình:
   * 1. Check cache trước (TTL: 5 phút)
   * 2. Nếu không có cache, query database
   * 3. Sort theo amount (descending)
   * 4. Lấy top 5 supporters
   * 5. Cache kết quả và return
   *
   * Lưu ý:
   * - Cache key: `user:{userId}:gifts:top-supporters`
   * - Cache TTL: 5 phút (300 seconds)
   * - Chỉ trả về top 5 supporters
   */
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
