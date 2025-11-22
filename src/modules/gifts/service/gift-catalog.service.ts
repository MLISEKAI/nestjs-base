import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class GiftCatalogService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getGiftItems(type?: string) {
    const cacheKey = `gifts:items:${type || 'all'}`;
    const cacheTtl = 1800; // 30 phút (items ít thay đổi)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const where: any = {};

        if (type) {
          where.type = type;
        }

        const items = await this.prisma.resGiftItem.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
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
        });

        // Format response để frontend dễ sử dụng
        return items.map((item) => {
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
      },
      cacheTtl,
    );
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
        const where: any = {};

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
