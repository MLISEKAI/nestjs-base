import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseQueryDto } from '../dto/base-query.dto';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(userId: string, query?: BaseQueryDto) {
    return this.prisma.resInventory.findMany({ where: { user_id: userId } });
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
