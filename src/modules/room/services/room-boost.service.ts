import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomBoostService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách thẻ boost (Cao cấp)
  async getBoostItems(room_id: string, user_id: string) {
    // Mock data - trong thực tế lấy từ inventory của user
    return {
      room_id: room_id,
      items: [
        {
          id: 'boost_warmup_4',
          name: 'Làm nóng 4 phút',
          duration_minutes: 4,
          icon: '/icons/fire.png',
          quantity: 2,
          expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'boost_warmup_10',
          name: 'Làm nóng 10 phút',
          duration_minutes: 10,
          icon: '/icons/fire_big.png',
          quantity: 1,
          expire_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      ],
    };
  }

  // Lấy danh sách gói boost (Siêu cấp)
  async getSuperPackages() {
    return {
      packages: [
        {
          id: 'super_5',
          name: 'Tăng tốc 5 phút',
          duration_minutes: 5,
          price: 20,
          currency: 'coin',
        },
        {
          id: 'super_15',
          name: 'Tăng tốc 15 phút',
          duration_minutes: 15,
          price: 45,
          currency: 'coin',
        },
        {
          id: 'super_30',
          name: 'Tăng tốc 30 phút',
          duration_minutes: 30,
          price: 80,
          currency: 'coin',
        },
      ],
    };
  }

  // Sử dụng thẻ boost
  async useBoostItem(room_id: string, user_id: string, itemId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');

    // TODO: Check if user has item, deduct from inventory

    const durationMap: any = {
      boost_warmup_4: 4,
      boost_warmup_10: 10,
    };

    const duration = durationMap[itemId] || 4;
    const endAt = new Date(Date.now() + duration * 60 * 1000);

    await this.prisma.roomBoostHistory.create({
      data: {
        room_id: room_id,
        user_id: user_id,
        boost_type: 'item',
        duration_minutes: duration,
        ended_at: endAt,
      },
    });

    return {
      room_id: room_id,
      item_id: itemId,
      duration_minutes: duration,
      status: 'activated',
      boost_end_at: endAt,
      boosting: true,
      remaining_seconds: duration * 60,
    };
  }

  // Mua gói boost
  async purchaseBoost(room_id: string, user_id: string, packageId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');

    const priceMap: any = {
      super_5: { duration: 5, price: 20 },
      super_15: { duration: 15, price: 45 },
      super_30: { duration: 30, price: 80 },
    };

    const pkg = priceMap[packageId];
    if (!pkg) throw new NotFoundException('Package not found');

    // TODO: Check user balance, deduct coins

    const endAt = new Date(Date.now() + pkg.duration * 60 * 1000);

    await this.prisma.roomBoostHistory.create({
      data: {
        room_id: room_id,
        user_id: user_id,
        boost_type: 'purchase',
        duration_minutes: pkg.duration,
        ended_at: endAt,
      },
    });

    return {
      room_id: room_id,
      package_id: packageId,
      duration_minutes: pkg.duration,
      payment: {
        total: pkg.price,
        currency: 'coin',
      },
      status: 'activated',
      boost_end_at: endAt,
    };
  }

  // Lịch sử boost
  async getBoostHistory(room_id: string) {
    const history = await this.prisma.roomBoostHistory.findMany({
      where: { room_id: room_id },
      orderBy: { started_at: 'desc' },
      take: 20,
    });

    return { history };
  }
}
