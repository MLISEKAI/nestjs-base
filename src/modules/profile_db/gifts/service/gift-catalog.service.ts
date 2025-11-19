import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GiftCatalogService {
  constructor(private prisma: PrismaService) {}

  async getGiftCategories() {
    return this.prisma.resGiftCategory.findMany();
  }

  async getGiftItems(categoryId?: string) {
    return this.prisma.resGiftItem.findMany({
      where: categoryId ? { category_id: categoryId } : undefined,
    });
  }
}
