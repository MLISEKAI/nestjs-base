// Import Injectable để đánh dấu class là NestJS service
import { Injectable } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để cache data
import { CacheService } from 'src/common/cache/cache.service';
// Import BaseQueryDto cho pagination và filtering
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import utility function để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
// Import interface cho paginated response
import { IPaginatedResponse } from '../../../common/interfaces/pagination.interface';
// Import Prisma types để type-check
import { Prisma } from '@prisma/client';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * GiftCatalogService - Service xử lý business logic cho gift catalog
 *
 * Chức năng chính:
 * - Lấy danh sách gift items với pagination, filtering, và sorting
 * - Lấy sample gift items (cho preview/overview)
 * - Cache gift items để tối ưu performance
 *
 * Lưu ý:
 * - Gift items có thể là normal hoặc event gifts
 * - Event gifts có thời gian kết thúc (event_end_date)
 */
@Injectable()
export class GiftCatalogService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService và CacheService khi tạo instance của service
   */
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Lấy danh sách gift items với pagination, filtering, và sorting
   *
   * @param type - Filter theo gift type (optional)
   * @param query - BaseQueryDto chứa pagination, search, sort parameters
   * @returns IPaginatedResponse chứa danh sách gift items và pagination metadata
   *
   * Quy trình:
   * 1. Parse pagination parameters (page, limit)
   * 2. Build where clause (filter theo type và search)
   * 3. Build orderBy clause (sort theo field và order)
   * 4. Query database với pagination
   * 5. Format response để frontend dễ sử dụng
   * 6. Return paginated response
   *
   * Lưu ý:
   * - ResGiftItem không có created_at field, chỉ sort được theo: id, name, price, type
   * - Event gifts có event_end_date để hiển thị thời gian kết thúc event
   */
  async getGiftItems(type?: string, query?: BaseQueryDto): Promise<IPaginatedResponse<any>> {
    // Parse pagination parameters
    const take = query?.limit && query.limit > 0 ? query.limit : 10; // Default 10 items per page
    const page = query?.page && query.page > 0 ? query.page : 1; // Default page 1
    const skip = (page - 1) * take; // Calculate skip offset

    const where: Prisma.ResGiftItemWhereInput = {};

    if (type) {
      where.type = type;
    }

    // Search filter
    if (query?.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    // Build orderBy
    // ResGiftItem có các field: id, category_id, name, image_url, price, type, event_id
    // Không có created_at, nên chỉ cho phép sort theo các field hợp lệ
    const allowedSortFields = ['id', 'name', 'price', 'type'];
    let orderBy: Prisma.ResGiftItemOrderByWithRelationInput = { name: 'asc' }; // Default
    if (query?.sort) {
      const [field, order] = query.sort.split(':');
      if (field && allowedSortFields.includes(field) && (order === 'asc' || order === 'desc')) {
        orderBy = { [field]: order };
      }
    }

    // Query với pagination
    const [items, total] = await Promise.all([
      this.prisma.resGiftItem.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        skip,
        take,
        select: {
          id: true,
          name: true,
          image_url: true,
          price: true,
          type: true,
          event_id: true,
          event: {
            select: {
              end_time: true,
            },
          },
        },
        orderBy,
      }),
      this.prisma.resGiftItem.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    // Format response để frontend dễ sử dụng
    const formattedItems = items.map((item) => {
      // is_event = true nếu có event_id
      const isEvent = !!item.event_id;

      return {
        id: item.id, // UUID trực tiếp
        name: item.name,
        image_url: item.image_url,
        price: Number(item.price), // Convert Decimal to number
        type: item.type || 'normal',
        is_event: isEvent,
        event_end_date: item.event?.end_time ? item.event.end_time.toISOString() : null,
      };
    });

    return buildPaginatedResponse(formattedItems, total, page, take);
  }

  /**
   * Lấy gift items mẫu cho phần tổng quan (preview)
   * Chỉ lấy một số items để hiển thị, không cần pagination
   *
   * @param limit - Số lượng items cần lấy (mặc định: 3)
   * @param type - Filter theo gift type (optional)
   * @returns Array of gift items (chỉ có id, name, image_url)
   *
   * Quy trình:
   * 1. Check cache trước (TTL: 30 phút)
   * 2. Nếu không có cache, query database
   * 3. Cache kết quả và return
   *
   * Lưu ý:
   * - Dùng cho GET /gifts - chỉ cần id, name, image_url
   * - Cache key: `gifts:items:sample:{limit}:{type || 'all'}`
   * - Cache TTL: 30 phút (1800 seconds)
   */
  async getGiftItemsSample(limit: number = 3, type?: string) {
    const cacheKey = `gifts:items:sample:${limit}:${type || 'all'}`;
    const cacheTtl = 1800; // 30 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const where: Prisma.ResGiftItemWhereInput = {};

        if (type) {
          where.type = type;
        }

        const items = await this.prisma.resGiftItem.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
          take: limit, // Chỉ lấy limit items đầu tiên
          select: {
            id: true,
            name: true,
            image_url: true,
          },
          orderBy: { name: 'asc' }, // Sort để luôn lấy cùng items
        });

        // Format response đơn giản
        return items.map((item) => {
          return {
            id: item.id, // UUID trực tiếp
            name: item.name,
            image_url: item.image_url,
          };
        });
      },
      cacheTtl,
    );
  }
}
