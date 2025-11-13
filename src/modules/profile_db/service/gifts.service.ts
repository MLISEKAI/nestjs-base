import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGiftDto, UpdateGiftDto } from '../dto/gift.dto';

@Injectable()
export class GiftsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGiftDto) {
    return this.prisma.resGift.create({
      data: {
        sender_id: dto.sender_id,
        receiver_id: dto.receiver_id,
        gift_item_id: dto.gift_item_id,
        quantity: dto.quantity ?? 1,
        message: dto.message,
      },
    });
  }

  async findAll() {
    return this.prisma.resGift.findMany();
  }

  async findOne(id: string) {
    const gift = await this.prisma.resGift.findUnique({ where: { id } });
    if (!gift) throw new NotFoundException('Gift not found');
    return gift;
  }

  async update(id: string, dto: UpdateGiftDto) {
    const gift = await this.prisma.resGift.findUnique({ where: { id } });
    if (!gift) throw new NotFoundException('Gift not found');
    return this.prisma.resGift.update({
      where: { id },
      data: {
        gift_item_id: dto.gift_item_id ?? gift.gift_item_id,
        quantity: dto.quantity ?? gift.quantity,
        message: dto.message ?? gift.message,
      },
    });
  }

  async remove(id: string) {
    const gift = await this.prisma.resGift.findUnique({ where: { id } });
    if (!gift) throw new NotFoundException('Gift not found');
    return this.prisma.resGift.delete({ where: { id } });
  }

  async getGiftsSummary(userId: string) {
    const gifts = await this.prisma.resGift.findMany({
      where: { receiver_id: userId },
    });
    return { total: gifts.length, gifts };
  }

  async getTopSupporters(userId: string) {
    const supporters = await this.prisma.resSupporter.findMany({
      where: { user_id: userId },
      orderBy: { amount: 'desc' },
      take: 5,
    });
    return supporters;
  }

  async getGiftCategories() {
    return this.prisma.resGiftCategory.findMany();
  }

  async getGiftItems(categoryId?: string) {
    return this.prisma.resGiftItem.findMany({
      where: categoryId ? { category_id: categoryId } : undefined,
    });
  }

  async getGiftMilestones(userId: string) {
    return this.prisma.resGiftMilestone.findMany({ where: { user_id: userId } });
  }

}
