import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoreDto, CreateStoreItemDto, UpdateStoreItemDto } from '../dto/store.dto';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async getStore(userId: string, query?: BaseQueryDto): Promise<any> {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.resStoreItem.findMany({
        where: { user_id: userId },
        take,
        skip,
        // Note: ResStoreItem không có created_at field, dùng id để order
        orderBy: { id: 'desc' },
      }),
      this.prisma.resStoreItem.count({ where: { user_id: userId } }),
    ]);

    const itemsWithPrice = items.map((item) => ({ ...item, price: Number(item.price) }));
    return buildPaginatedResponse(itemsWithPrice, total, page, take);
  }

  async addStoreItem(userId: string, dto: CreateStoreItemDto) {
    return this.prisma.resStoreItem.create({
      data: { user_id: userId, name: dto.name, price: dto.price },
    });
  }

  async updateStoreItem(userId: string, itemId: string, dto: UpdateStoreItemDto) {
    try {
      if (dto.name === undefined || dto.price === undefined) {
        // Nếu thiếu một trong hai, cần lấy giá trị hiện tại
        const existing = await this.prisma.resStoreItem.findFirst({
          where: { id: itemId, user_id: userId },
          select: { name: true, price: true },
        });
        if (!existing) throw new NotFoundException('Store item not found');
        return this.prisma.resStoreItem.update({
          where: { id: itemId },
          data: {
            name: dto.name ?? existing.name,
            price: dto.price !== undefined ? dto.price : existing.price,
          },
        });
      }
      return await this.prisma.resStoreItem.update({
        where: { id: itemId, user_id: userId },
        data: { name: dto.name, price: dto.price },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Store item not found');
      }
      throw error;
    }
  }

  async deleteStoreItem(userId: string, itemId: string) {
    try {
      await this.prisma.resStoreItem.delete({
        where: { id: itemId, user_id: userId },
      });
      return { message: 'Store item deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Store item not found');
      }
      throw error;
    }
  }
}
