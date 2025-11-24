import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { CreateGiftItemDto, UpdateGiftItemDto } from '../dto/gift-item-admin.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GiftItemAdminService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Tạo gift item mới
   */
  async create(dto: CreateGiftItemDto) {
    // Kiểm tra category tồn tại
    const category = await this.prisma.resGiftCategory.findUnique({
      where: { id: dto.category_id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${dto.category_id} not found`);
    }

    // Kiểm tra event tồn tại (nếu có)
    if (dto.event_id) {
      const event = await this.prisma.resEvent.findUnique({
        where: { id: dto.event_id },
      });
      if (!event) {
        throw new NotFoundException(`Event with ID ${dto.event_id} not found`);
      }
    }

    // Tạo gift item
    const giftItem = await this.prisma.resGiftItem.create({
      data: {
        category_id: dto.category_id,
        name: dto.name,
        image_url: dto.image_url,
        price: dto.price,
        type: dto.type || 'normal',
        event_id: dto.event_id,
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return giftItem;
  }

  /**
   * Lấy danh sách gift items (admin - không format, trả về UUID)
   */
  async findAll(type?: string) {
    const where: Prisma.ResGiftItemWhereInput = {};
    if (type) {
      where.type = type;
    }

    return this.prisma.resGiftItem.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            end_time: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Lấy gift item theo ID (admin - trả về UUID)
   */
  async findOne(id: string) {
    const giftItem = await this.prisma.resGiftItem.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            end_time: true,
          },
        },
      },
    });

    if (!giftItem) {
      throw new NotFoundException(`Gift item with ID ${id} not found`);
    }

    return giftItem;
  }

  /**
   * Cập nhật gift item
   */
  async update(id: string, dto: UpdateGiftItemDto) {
    // Kiểm tra gift item tồn tại
    const existing = await this.prisma.resGiftItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Gift item with ID ${id} not found`);
    }

    // Kiểm tra category tồn tại (nếu có update)
    if (dto.category_id) {
      const category = await this.prisma.resGiftCategory.findUnique({
        where: { id: dto.category_id },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.category_id} not found`);
      }
    }

    // Kiểm tra event tồn tại (nếu có update)
    if (dto.event_id) {
      const event = await this.prisma.resEvent.findUnique({
        where: { id: dto.event_id },
      });
      if (!event) {
        throw new NotFoundException(`Event with ID ${dto.event_id} not found`);
      }
    }

    // Update gift item
    const updated = await this.prisma.resGiftItem.update({
      where: { id },
      data: {
        ...(dto.category_id && { category_id: dto.category_id }),
        ...(dto.name && { name: dto.name }),
        ...(dto.image_url !== undefined && { image_url: dto.image_url }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.event_id !== undefined && { event_id: dto.event_id }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            end_time: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return updated;
  }

  /**
   * Xóa gift item
   */
  async remove(id: string) {
    // Kiểm tra gift item tồn tại
    const existing = await this.prisma.resGiftItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Gift item with ID ${id} not found`);
    }

    // Kiểm tra xem có gifts nào đang dùng item này không
    const giftsCount = await this.prisma.resGift.count({
      where: { gift_item_id: id },
    });

    if (giftsCount > 0) {
      throw new BadRequestException(
        `Cannot delete gift item. There are ${giftsCount} gift(s) using this item.`,
      );
    }

    // Xóa gift item
    await this.prisma.resGiftItem.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache();

    return { message: 'Gift item deleted successfully' };
  }

  /**
   * Invalidate tất cả cache liên quan đến gift items
   */
  private async invalidateCache() {
    // Invalidate tất cả cache patterns liên quan
    await this.cacheService.delPattern('gifts:items:*');
  }
}
