import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGiftDto, UpdateGiftDto } from '../dto/gift.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import { BaseQueryDto } from '../dto/base-query.dto';

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

  async findAll(userId?: string, query?: BaseQueryDto) {
    const where = userId ? { receiver_id: userId } : {};
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [gifts, total] = await Promise.all([
      this.prisma.resGift.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          sender: { select: { id: true, nickname: true, avatar: true } },
          receiver: { select: { id: true, nickname: true, avatar: true } },
          giftItem: { select: { id: true, name: true, image_url: true, price: true } },
        },
      }),
      this.prisma.resGift.count({ where }),
    ]);

    return buildPaginatedResponse(gifts, total, page, take);
  }

  async findOne(id: string) {
    const gift = await this.prisma.resGift.findUnique({ where: { id } });
    if (!gift) throw new NotFoundException('Gift not found');
    return gift;
  }

  async update(id: string, dto: UpdateGiftDto) {
    try {
      return await this.prisma.resGift.update({
        where: { id },
        data: {
          ...(dto.gift_item_id && { gift_item_id: dto.gift_item_id }),
          ...(dto.quantity !== undefined && { quantity: dto.quantity }),
          ...(dto.message !== undefined && { message: dto.message }),
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Gift not found');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.resGift.delete({ where: { id } });
      return { message: 'Gift deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Gift not found');
      }
      throw error;
    }
  }

  async getGiftsSummary(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [gifts, total] = await Promise.all([
      this.prisma.resGift.findMany({
        where: { receiver_id: userId },
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          sender: { select: { id: true, nickname: true, avatar: true } },
          giftItem: { select: { id: true, name: true, image_url: true, price: true } },
        },
      }),
      this.prisma.resGift.count({ where: { receiver_id: userId } }),
    ]);

    return buildPaginatedResponse(gifts, total, page, take);
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
