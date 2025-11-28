// Import Injectable và exceptions từ NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
// Import các DTO để validate và type-check dữ liệu
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../dto/inventory.dto';
// Import utility function để build paginated response
import { buildPaginatedResponse } from '../../../../common/utils/pagination.util';
// Import Prisma types để type-check
import { Prisma } from '@prisma/client';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * InventoryService - Service xử lý business logic cho inventory (kho đồ của user)
 *
 * Chức năng chính:
 * - CRUD inventory items
 * - Lấy danh sách inventory với pagination và filtering
 * - Filter theo item type
 * - Format response với name và image_url từ ResItem
 *
 * Lưu ý:
 * - Inventory items được link với ResItem để lấy thông tin (name, image_url)
 * - ResInventory không có created_at field, dùng id để order
 */
@Injectable()
export class InventoryService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  async getInventory(user_id: string, query?: BaseQueryDto, itemType?: string) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Build where clause
    const where: Prisma.ResInventoryWhereInput = { user_id: user_id };

    // Nếu có itemType, filter theo type của ResItem
    if (itemType) {
      where.item = {
        type: itemType,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.resInventory.findMany({
        where,
        take,
        skip,
        // Note: ResInventory không có created_at field, dùng id để order
        orderBy: { id: 'desc' },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              type: true,
              image_url: true,
            },
          },
        },
      }),
      this.prisma.resInventory.count({ where }),
    ]);

    // Map để format response với name và image_url từ ResItem
    const formattedItems = items.map((inv) => ({
      id: inv.id,
      user_id: inv.user_id,
      item_id: inv.item_id,
      name: inv.item?.name || null,
      image_url: inv.item?.image_url || null,
      quantity: inv.quantity,
    }));

    return buildPaginatedResponse(formattedItems, total, page, take);
  }

  async addInventoryItem(user_id: string, dto: CreateInventoryItemDto) {
    return this.prisma.resInventory.create({
      data: { user_id: user_id, item_id: dto.item_id, quantity: dto.quantity ?? 1 },
    });
  }

  async updateInventoryItem(user_id: string, itemId: string, dto: UpdateInventoryItemDto) {
    const existing = await this.prisma.resInventory.findFirst({
      where: { id: itemId, user_id: user_id },
    });
    if (!existing) throw new NotFoundException('Inventory item not found');
    return this.prisma.resInventory.update({
      where: { id: itemId },
      data: { quantity: dto.quantity ?? existing.quantity },
    });
  }

  async deleteInventoryItem(user_id: string, itemId: string) {
    const existing = await this.prisma.resInventory.findFirst({
      where: { id: itemId, user_id: user_id },
    });
    if (!existing) throw new NotFoundException('Inventory item not found');
    await this.prisma.resInventory.delete({ where: { id: itemId } });
    return { message: 'Inventory item deleted' };
  }
}
