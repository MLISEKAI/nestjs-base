import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { CreateGiftDto } from '../dto/gift.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

@Injectable()
export class GiftCrudService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(dto: CreateGiftDto & { sender_id: string }) {
    // Kiểm tra gift item tồn tại
    const giftItem = await this.prisma.resGiftItem.findUnique({
      where: { id: dto.gift_item_id },
    });

    if (!giftItem) {
      throw new NotFoundException(`Gift item with ID ${dto.gift_item_id} not found`);
    }

    const gift = await this.prisma.resGift.create({
      data: {
        sender_id: dto.sender_id,
        receiver_id: dto.receiver_id,
        gift_item_id: dto.gift_item_id,
        quantity: dto.quantity ?? 1,
        message: dto.message,
      },
    });

    // Invalidate cache khi có gift mới
    // Invalidate cache của receiver (quà đã nhận)
    await this.cacheService.del(`user:${dto.receiver_id}:balance`);
    await this.cacheService.del(`user:${dto.receiver_id}:gift-wall`);
    await this.cacheService.del(`user:${dto.receiver_id}:gifts:count`);
    await this.cacheService.delPattern(`user:${dto.receiver_id}:gift-wall:*`);
    await this.cacheService.delPattern(`user:${dto.receiver_id}:gifts:*`);

    // Invalidate cache của sender (quà đã tặng - để cập nhật total_diamond_value)
    await this.cacheService.del(`user:${dto.sender_id}:balance`);
    await this.cacheService.del(`user:${dto.sender_id}:gift-wall`);
    await this.cacheService.delPattern(`user:${dto.sender_id}:gift-wall:*`);
    await this.cacheService.delPattern(`user:${dto.sender_id}:gifts:*`);

    return gift;
  }

  async getCount(userId: string) {
    const cacheKey = `user:${userId}:gifts:count`;
    const cacheTtl = 60; // 1 phút

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.resGift.count({
          where: { receiver_id: userId },
        });
      },
      cacheTtl,
    );
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

  /**
   * Find one gift by ID
   * @param id Gift ID (ID của ResGift record, không phải gift_item_id)
   * @param userId Optional: Check if user is sender or receiver (for authorization)
   */
  async findOne(id: string, userId?: string) {
    const gift = await this.prisma.resGift.findUnique({ where: { id } });
    if (!gift) {
      throw new NotFoundException(
        `Gift with ID ${id} not found. Note: This endpoint requires the gift ID (from POST /gifts response), not gift_item_id.`,
      );
    }

    // Authorization check: User chỉ có thể xem gift mà họ là sender hoặc receiver
    if (userId && gift.sender_id !== userId && gift.receiver_id !== userId) {
      throw new ForbiddenException('You can only view gifts you sent or received');
    }

    return gift;
  }

  /**
   * Delete gift
   * @param id Gift ID
   * @param userId Optional: Check if user is sender (only sender can delete)
   */
  async remove(id: string, userId?: string) {
    // Check if gift exists and user has permission
    let gift = null;
    if (userId) {
      gift = await this.prisma.resGift.findUnique({ where: { id } });
      if (!gift) throw new NotFoundException('Gift not found');

      // Authorization: Chỉ sender mới có thể delete gift
      if (gift.sender_id !== userId) {
        throw new ForbiddenException('You can only delete gifts you sent');
      }
    } else {
      gift = await this.prisma.resGift.findUnique({ where: { id } });
      if (!gift) throw new NotFoundException('Gift not found');
    }

    try {
      await this.prisma.resGift.delete({ where: { id } });

      // Invalidate cache khi xóa gift
      if (gift) {
        await this.cacheService.del(`user:${gift.receiver_id}:balance`);
        await this.cacheService.del(`user:${gift.receiver_id}:gift-wall`);
        await this.cacheService.delPattern(`user:${gift.receiver_id}:gift-wall:*`);
        await this.cacheService.delPattern(`user:${gift.receiver_id}:gifts:*`); // GiftSummaryService cache
      }

      return { message: 'Gift deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Gift not found');
      }
      throw error;
    }
  }
}
