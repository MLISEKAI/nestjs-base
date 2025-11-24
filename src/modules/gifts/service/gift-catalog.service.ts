import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import { IPaginatedResponse } from '../../../common/interfaces/pagination.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class GiftCatalogService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getGiftItems(type?: string, query?: BaseQueryDto): Promise<IPaginatedResponse<any>> {
    // Pagination
    const take = query?.limit && query.limit > 0 ? query.limit : 10;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

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
   * Get gift items mẫu cho phần tổng quan (chỉ lấy một số items để hiển thị)
   * Dùng cho GET /gifts - chỉ cần id, name, image_url, lấy limit items đầu tiên
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
