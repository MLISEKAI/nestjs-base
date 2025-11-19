import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../dto/inventory.dto';
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.resInventory.findMany({
        where: { user_id: userId },
        take,
        skip,
        // Note: ResInventory không có created_at field, dùng id để order
        orderBy: { id: 'desc' },
        include: {
          item: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.resInventory.count({ where: { user_id: userId } }),
    ]);

    // Map để format response với name từ ResItem
    const formattedItems = items.map((inv) => ({
      id: inv.id,
      user_id: inv.user_id,
      item_id: inv.item_id,
      name: inv.item?.name || null,
      quantity: inv.quantity,
    }));

    return buildPaginatedResponse(formattedItems, total, page, take);
  }

  async addInventoryItem(userId: string, dto: CreateInventoryItemDto) {
    return this.prisma.resInventory.create({
      data: { user_id: userId, item_id: dto.item_id, quantity: dto.quantity ?? 1 },
    });
  }

  async updateInventoryItem(userId: string, itemId: string, dto: UpdateInventoryItemDto) {
    const existing = await this.prisma.resInventory.findFirst({
      where: { id: itemId, user_id: userId },
    });
    if (!existing) throw new NotFoundException('Inventory item not found');
    return this.prisma.resInventory.update({
      where: { id: itemId },
      data: { quantity: dto.quantity ?? existing.quantity },
    });
  }

  async deleteInventoryItem(userId: string, itemId: string) {
    const existing = await this.prisma.resInventory.findFirst({
      where: { id: itemId, user_id: userId },
    });
    if (!existing) throw new NotFoundException('Inventory item not found');
    await this.prisma.resInventory.delete({ where: { id: itemId } });
    return { message: 'Inventory item deleted' };
  }
}
