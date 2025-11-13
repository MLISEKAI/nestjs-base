import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoreDto, CreateStoreItemDto, UpdateStoreItemDto } from '../dto/store.dto';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async getStore(userId: string): Promise<StoreDto> {
    const items = await this.prisma.resStoreItem.findMany({ where: { user_id: userId } });
    return { items: items.map(item => ({ ...item, price: Number(item.price) })) };
  }

  async addStoreItem(userId: string, dto: CreateStoreItemDto) {
    return this.prisma.resStoreItem.create({ data: { user_id: userId, name: dto.name, price: dto.price } });
  }

  async updateStoreItem(userId: string, itemId: string, dto: UpdateStoreItemDto) {
    const existing = await this.prisma.resStoreItem.findFirst({ where: { id: itemId, user_id: userId } });
    if (!existing) throw new NotFoundException('Store item not found');
    return this.prisma.resStoreItem.update({ where: { id: itemId }, data: { name: dto.name ?? existing.name, price: dto.price ?? existing.price } });
  }

  async deleteStoreItem(userId: string, itemId: string) {
    const existing = await this.prisma.resStoreItem.findFirst({ where: { id: itemId, user_id: userId } });
    if (!existing) throw new NotFoundException('Store item not found');
    await this.prisma.resStoreItem.delete({ where: { id: itemId } });
    return { message: 'Store item deleted' };
  }
}