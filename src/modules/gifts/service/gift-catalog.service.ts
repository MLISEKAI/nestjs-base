import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class GiftCatalogService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getGiftCategories() {
    const cacheKey = 'gifts:categories';
    const cacheTtl = 3600; // 1 giờ (categories ít thay đổi)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.resGiftCategory.findMany();
      },
      cacheTtl,
    );
  }

  async getGiftItems(categoryId?: string, type?: string) {
    const cacheKey = `gifts:items:${categoryId || 'all'}:${type || 'all'}`;
    const cacheTtl = 1800; // 30 phút (items ít thay đổi)

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const where: any = {};

        if (categoryId) {
          where.category_id = categoryId;
        }

        if (type) {
          where.type = type;
        }

        return this.prisma.resGiftItem.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
        });
      },
      cacheTtl,
    );
  }
}
