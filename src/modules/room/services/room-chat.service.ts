import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto, SendGiftDto } from '../dto/room-message.dto';

@Injectable()
export class RoomChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(room_id: string, cursor?: string, limit: number = 50) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    const where: any = { room_id: room_id };
    if (cursor) where.id = { lt: parseInt(cursor) };
    const messages = await this.prisma.roomMessage.findMany({
      where,
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    return messages.map((msg) => ({
      id: msg.id.toString(),
      type: msg.type,
      user: msg.user ? { id: msg.user.id, name: msg.user.nickname, avatar: msg.user.avatar } : undefined,
      content: msg.content,
      text: msg.content,
      created_at: msg.created_at,
    }));
  }

  async sendMessage(room_id: string, user_id: string, dto: SendMessageDto) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    
    const participant = await this.prisma.roomParticipant.findFirst({
      where: { room_id: room_id, user_id: user_id, left_at: null },
    });
    if (!participant) throw new ForbiddenException('Not in room');

    // Chỉ cho phép gửi icon hoặc gift
    if (dto.type !== 'icon' && dto.type !== 'gift') {
      throw new ForbiddenException('Only icon and gift messages are allowed');
    }

    const message = await this.prisma.roomMessage.create({
      data: { room_id: room_id, user_id: user_id, type: dto.type, content: dto.content },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    });
    
    return {
      messageId: message.id.toString(),
      room_id: message.room_id,
      user_id: message.user_id,
      nickname: message.user.nickname,
      content: message.content,
      type: message.type,
      timestamp: message.created_at,
    };
  }

  async sendSystemMessage(room_id: string, text: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    const message = await this.prisma.roomMessage.create({
      data: { room_id: room_id, type: 'system', content: text },
    });
    return { id: message.id.toString(), type: 'system', text: message.content, created_at: message.created_at };
  }

  async sendGift(room_id: string, user_id: string, dto: SendGiftDto) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    const participant = await this.prisma.roomParticipant.findFirst({
      where: { room_id: room_id, user_id: user_id, left_at: null },
    });
    if (!participant) throw new ForbiddenException('Not in room');
    const giftCost = 100 * dto.quantity;
    const gift = await this.prisma.roomGift.create({
      data: {
        room_id: room_id,
        sender_id: user_id,
        recipient_id: dto.recipientId,
        gift_id: dto.gift_id,
        quantity: dto.quantity,
        total_cost: giftCost,
      },
    });
    return {
      gift_id: gift.gift_id,
      quantity: gift.quantity,
      totalCost: gift.total_cost,
      sender: { user_id },
      recipient: { user_id: dto.recipientId },
      timestamp: gift.created_at,
    };
  }

  async getRoomStats(room_id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: room_id },
      include: { _count: { select: { gifts: true, participants: true } } },
    });
    if (!room) throw new NotFoundException('Room not found');
    const totalGiftValue = await this.prisma.roomGift.aggregate({
      where: { room_id: room_id },
      _sum: { total_cost: true },
    });
    return {
      totalGifts: room._count.gifts,
      totalViewers: room.current_participants,
      totalPoints: totalGiftValue._sum.total_cost || 0,
    };
  }

  async getSpeakers(room_id: string) {
    const participants = await this.prisma.roomParticipant.findMany({
      where: { room_id: room_id, left_at: null, role: { in: ['host', 'speaker'] } },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    });
    return participants.map((p) => ({
      user_id: p.user_id,
      nickname: p.user.nickname,
      avatar: p.user.avatar,
      isMuted: p.is_muted,
      isCameraOn: p.is_camera_on,
      role: p.role,
    }));
  }

  async getListeners(room_id: string) {
    const participants = await this.prisma.roomParticipant.findMany({
      where: { room_id: room_id, left_at: null, role: 'listener' },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    });
    return participants.map((p) => ({
      user_id: p.user_id,
      nickname: p.user.nickname,
      avatar: p.user.avatar,
    }));
  }
}
