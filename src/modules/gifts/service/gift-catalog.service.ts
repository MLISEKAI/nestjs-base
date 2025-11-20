import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GiftCatalogService {
  constructor(private prisma: PrismaService) {}

  async getGiftCategories() {
    return this.prisma.resGiftCategory.findMany();
  }

  async getGiftItems(categoryId?: string, type?: string) {
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
  }
}
