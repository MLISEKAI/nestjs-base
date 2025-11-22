import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { CreateGiftDto, PurchaseGiftResponseDto } from '../dto/gift.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GiftCrudService {
  private readonly logger = new Logger(GiftCrudService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(dto: CreateGiftDto & { sender_id: string }) {
    const quantity = dto.quantity ?? 1;
    this.logger.log(
      `User ${dto.sender_id} attempting to send gift ${dto.gift_item_id}${dto.item_id ? ` (from inventory item_id: ${dto.item_id})` : ''} x${quantity} to ${dto.receiver_id}`,
    );

    let giftItem;
    let inventoryItem = null;

    // Nếu có item_id (gửi từ inventory), tìm ResItem trước
    if (dto.item_id) {
      inventoryItem = await this.prisma.resItem.findUnique({
        where: { id: dto.item_id },
      });

      if (!inventoryItem) {
        throw new NotFoundException(`Inventory item with ID ${dto.item_id} not found`);
      }

      // Kiểm tra số lượng trong inventory có đủ không
      const userInventory = await this.prisma.resInventory.findUnique({
        where: {
          user_id_item_id: {
            user_id: dto.sender_id,
            item_id: dto.item_id,
          },
        },
      });

      if (!userInventory || userInventory.quantity < quantity) {
        throw new BadRequestException(
          `Không đủ số lượng trong túi. Bạn có: ${userInventory?.quantity || 0}, Cần: ${quantity}`,
        );
      }

      // Tìm ResGiftItem tương ứng theo name
      giftItem = await this.prisma.resGiftItem.findFirst({
        where: { name: inventoryItem.name },
      });

      if (!giftItem) {
        throw new NotFoundException(
          `Không tìm thấy gift item tương ứng với inventory item "${inventoryItem.name}". Vui lòng dùng gift_item_id từ catalog.`,
        );
      }

      this.logger.log(
        `Found gift item from inventory: ${inventoryItem.name} -> gift_item_id: ${giftItem.id}`,
      );
    } else {
      // Dùng gift_item_id trực tiếp từ catalog
      giftItem = await this.prisma.resGiftItem.findUnique({
        where: { id: dto.gift_item_id },
      });

      if (!giftItem) {
        throw new NotFoundException(`Gift item with ID ${dto.gift_item_id} not found`);
      }
    }

    // Tính tổng giá (price là Decimal trong Prisma)
    const giftPrice = Number(giftItem.price);
    const totalPrice = giftPrice * quantity;

    this.logger.log(
      `Gift price: ${giftPrice} Diamond, Quantity: ${quantity}, Total: ${totalPrice} Diamond`,
    );

    // Lấy hoặc tạo Diamond wallet của sender
    let diamondWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: dto.sender_id, currency: 'diamond' },
    });

    if (!diamondWallet) {
      diamondWallet = await this.prisma.resWallet.create({
        data: {
          user_id: dto.sender_id,
          currency: 'diamond',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    const currentBalance = Number(diamondWallet.balance);
    this.logger.log(`Sender ${dto.sender_id} current Diamond balance: ${currentBalance}`);

    // Kiểm tra số dư có đủ không
    if (currentBalance < totalPrice) {
      const insufficientAmount = totalPrice - currentBalance;
      this.logger.warn(
        `Insufficient balance for sender ${dto.sender_id}. Required: ${totalPrice}, Current: ${currentBalance}, Missing: ${insufficientAmount}`,
      );
      throw new BadRequestException(
        `Số dư không đủ để gửi quà. Cần: ${totalPrice} Diamond, Hiện có: ${currentBalance} Diamond, Thiếu: ${insufficientAmount} Diamond`,
      );
    }

    // Số dư đủ, tiến hành trừ tiền và tạo gift trong transaction
    const transactionId = `GIFT${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let gift;

    await this.prisma.$transaction(async (tx) => {
      // Trừ tiền từ Diamond wallet của sender
      const newBalance = currentBalance - totalPrice;
      await tx.resWallet.update({
        where: { id: diamondWallet.id },
        data: { balance: new Prisma.Decimal(newBalance) },
      });

      // Tạo transaction record
      await tx.resWalletTransaction.create({
        data: {
          wallet_id: diamondWallet.id,
          user_id: dto.sender_id,
          type: 'gift', // Dùng type 'gift' cho việc gửi quà
          amount: new Prisma.Decimal(-totalPrice), // Negative vì trừ tiền
          balance_before: diamondWallet.balance,
          balance_after: new Prisma.Decimal(newBalance),
          status: 'success',
          reference_id: transactionId,
        },
      });

      // Nếu gửi từ inventory, trừ quantity từ inventory của sender
      if (inventoryItem && dto.item_id) {
        const userInventory = await tx.resInventory.findUnique({
          where: {
            user_id_item_id: {
              user_id: dto.sender_id,
              item_id: dto.item_id,
            },
          },
        });

        if (userInventory) {
          const newQuantity = userInventory.quantity - quantity;
          if (newQuantity > 0) {
            // Còn lại, giảm quantity
            await tx.resInventory.update({
              where: { id: userInventory.id },
              data: { quantity: newQuantity },
            });
          } else {
            // Hết, xóa khỏi inventory
            await tx.resInventory.delete({
              where: { id: userInventory.id },
            });
          }
          this.logger.log(
            `Deducted ${quantity} from sender inventory. Remaining: ${newQuantity > 0 ? newQuantity : 0}`,
          );
        }
      }

      // Tạo gift record (dùng gift_item_id thực tế, không phải dto.gift_item_id nếu là từ inventory)
      gift = await tx.resGift.create({
        data: {
          sender_id: dto.sender_id,
          receiver_id: dto.receiver_id,
          gift_item_id: giftItem.id, // Dùng giftItem.id thực tế
          quantity,
          message: dto.message,
        },
      });
    });

    // Tự động thêm gift vào inventory của receiver (sau khi transaction thành công)
    await this.addGiftToInventory(dto.receiver_id, giftItem, quantity);

    // Invalidate cache khi có gift mới
    // Invalidate cache của receiver (quà đã nhận)
    await this.cacheService.del(`user:${dto.receiver_id}:balance`);
    await this.cacheService.del(`user:${dto.receiver_id}:gift-wall`);
    await this.cacheService.del(`user:${dto.receiver_id}:gifts:count`);
    await this.cacheService.delPattern(`user:${dto.receiver_id}:gift-wall:*`);
    await this.cacheService.delPattern(`user:${dto.receiver_id}:gifts:*`);

    // Invalidate cache của sender (quà đã tặng - để cập nhật total_diamond_value và wallet balance)
    await this.cacheService.del(`user:${dto.sender_id}:balance`);
    await this.cacheService.del(`wallet:${dto.sender_id}:diamond:balance`);
    await this.cacheService.del(`wallet:${dto.sender_id}:summary`);
    await this.cacheService.delPattern(`wallet:${dto.sender_id}:*`);
    await this.cacheService.del(`user:${dto.sender_id}:gift-wall`);
    await this.cacheService.delPattern(`user:${dto.sender_id}:gift-wall:*`);
    await this.cacheService.delPattern(`user:${dto.sender_id}:gifts:*`);

    // Nếu gửi từ inventory, invalidate inventory cache của sender
    if (inventoryItem && dto.item_id) {
      await this.cacheService.delPattern(`inventory:${dto.sender_id}:*`);
    }

    this.logger.log(
      `Gift sent successfully. Sender: ${dto.sender_id}, Receiver: ${dto.receiver_id}, Gift: ${giftItem.name}, Quantity: ${quantity}, Total price: ${totalPrice}, New sender balance: ${currentBalance - totalPrice}`,
    );

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

  /**
   * Mua quà và bỏ vào túi của chính mình
   * Trừ Diamond từ wallet và thêm gift vào inventory
   */
  async purchaseGift(
    userId: string,
    giftItemId: string,
    quantity: number = 1,
  ): Promise<PurchaseGiftResponseDto> {
    this.logger.log(`User ${userId} attempting to purchase gift ${giftItemId} x${quantity}`);

    // Kiểm tra gift item tồn tại
    const giftItem = await this.prisma.resGiftItem.findUnique({
      where: { id: giftItemId },
    });

    if (!giftItem) {
      throw new NotFoundException(`Gift item with ID ${giftItemId} not found`);
    }

    // Tính tổng giá (price là Decimal trong Prisma)
    const giftPrice = Number(giftItem.price);
    const totalPrice = giftPrice * quantity;

    this.logger.log(
      `Gift price: ${giftPrice} Diamond, Quantity: ${quantity}, Total: ${totalPrice} Diamond`,
    );

    // Lấy hoặc tạo Diamond wallet
    let diamondWallet = await this.prisma.resWallet.findFirst({
      where: { user_id: userId, currency: 'diamond' },
    });

    if (!diamondWallet) {
      diamondWallet = await this.prisma.resWallet.create({
        data: {
          user_id: userId,
          currency: 'diamond',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    const currentBalance = Number(diamondWallet.balance);
    this.logger.log(`User ${userId} current Diamond balance: ${currentBalance}`);

    // Kiểm tra số dư có đủ không
    if (currentBalance < totalPrice) {
      const insufficientAmount = totalPrice - currentBalance;
      this.logger.warn(
        `Insufficient balance for user ${userId}. Required: ${totalPrice}, Current: ${currentBalance}, Missing: ${insufficientAmount}`,
      );
      throw new BadRequestException(
        `Số dư không đủ để mua quà. Cần: ${totalPrice} Diamond, Hiện có: ${currentBalance} Diamond, Thiếu: ${insufficientAmount} Diamond`,
      );
    }

    // Số dư đủ, tiến hành trừ tiền và thêm vào inventory trong transaction
    const transactionId = `GIFT${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let createdItemId: string;

    await this.prisma.$transaction(async (tx) => {
      // Trừ tiền từ Diamond wallet
      const newBalance = currentBalance - totalPrice;
      await tx.resWallet.update({
        where: { id: diamondWallet.id },
        data: { balance: new Prisma.Decimal(newBalance) },
      });

      // Tạo transaction record
      await tx.resWalletTransaction.create({
        data: {
          wallet_id: diamondWallet.id,
          user_id: userId,
          type: 'gift', // Dùng type 'gift' cho việc mua quà
          amount: new Prisma.Decimal(-totalPrice), // Negative vì trừ tiền
          balance_before: diamondWallet.balance,
          balance_after: new Prisma.Decimal(newBalance),
          status: 'success',
          reference_id: transactionId,
        },
      });

      // Tìm hoặc tạo ResItem từ ResGiftItem
      let item = await tx.resItem.findFirst({
        where: {
          name: giftItem.name,
        },
      });

      if (!item) {
        item = await tx.resItem.create({
          data: {
            name: giftItem.name,
            type: 'gift',
            image_url: giftItem.image_url,
            price: giftItem.price,
          },
        });
        this.logger.log(`Created new ResItem from gift: ${giftItem.name} (${item.id})`);
      }

      createdItemId = item.id;

      // Thêm vào inventory (upsert: nếu đã có thì tăng quantity)
      const existingInventory = await tx.resInventory.findUnique({
        where: {
          user_id_item_id: {
            user_id: userId,
            item_id: item.id,
          },
        },
      });

      if (existingInventory) {
        // Đã có trong inventory, tăng quantity
        await tx.resInventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: existingInventory.quantity + quantity,
          },
        });
        this.logger.log(
          `Updated inventory: ${giftItem.name} quantity ${existingInventory.quantity} -> ${existingInventory.quantity + quantity}`,
        );
      } else {
        // Chưa có, tạo mới
        await tx.resInventory.create({
          data: {
            user_id: userId,
            item_id: item.id,
            quantity,
          },
        });
        this.logger.log(`Added to inventory: ${giftItem.name} x${quantity}`);
      }
    });

    // Invalidate cache
    await this.cacheService.del(`wallet:${userId}:diamond:balance`);
    await this.cacheService.del(`wallet:${userId}:summary`);
    await this.cacheService.delPattern(`wallet:${userId}:*`);

    this.logger.log(
      `Gift purchased successfully for user ${userId}. Gift: ${giftItem.name}, Quantity: ${quantity}, Total price: ${totalPrice}, New balance: ${currentBalance - totalPrice}`,
    );

    return {
      gift_item_id: giftItemId,
      gift_name: giftItem.name,
      quantity,
      total_price: totalPrice,
      remaining_balance: currentBalance - totalPrice,
      item_id: createdItemId,
    };
  }

  /**
   * Tự động thêm gift vào inventory khi user nhận gift
   * Tạo ResItem từ ResGiftItem nếu chưa có, sau đó thêm vào inventory
   */
  private async addGiftToInventory(
    receiverId: string,
    giftItem: { id: string; name: string; image_url: string | null; price: any },
    quantity: number,
  ): Promise<void> {
    try {
      // Tìm hoặc tạo ResItem từ ResGiftItem
      // Sử dụng gift_item_id làm mapping key (có thể dùng name hoặc tạo mapping table)
      let item = await this.prisma.resItem.findFirst({
        where: {
          name: giftItem.name,
          // Có thể thêm điều kiện khác để match chính xác hơn
        },
      });

      // Nếu chưa có ResItem, tạo mới từ ResGiftItem
      if (!item) {
        item = await this.prisma.resItem.create({
          data: {
            name: giftItem.name,
            type: 'gift', // Đánh dấu là gift item
            image_url: giftItem.image_url,
            price: giftItem.price,
          },
        });
        this.logger.log(`Created new ResItem from gift: ${giftItem.name} (${item.id})`);
      }

      // Thêm vào inventory (upsert: nếu đã có thì tăng quantity)
      const existingInventory = await this.prisma.resInventory.findUnique({
        where: {
          user_id_item_id: {
            user_id: receiverId,
            item_id: item.id,
          },
        },
      });

      if (existingInventory) {
        // Đã có trong inventory, tăng quantity
        await this.prisma.resInventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: existingInventory.quantity + quantity,
          },
        });
        this.logger.log(
          `Updated inventory: ${giftItem.name} quantity ${existingInventory.quantity} -> ${existingInventory.quantity + quantity}`,
        );
      } else {
        // Chưa có, tạo mới
        await this.prisma.resInventory.create({
          data: {
            user_id: receiverId,
            item_id: item.id,
            quantity,
          },
        });
        this.logger.log(`Added to inventory: ${giftItem.name} x${quantity}`);
      }
    } catch (error) {
      // Log error nhưng không throw để không ảnh hưởng đến việc tạo gift
      this.logger.error(`Failed to add gift to inventory: ${error.message}`, error.stack);
    }
  }
}
