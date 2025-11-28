import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto, SetPasswordDto, VerifyPasswordDto, JoinRoomDto } from '../dto/create-room.dto';
import * as bcrypt from 'bcrypt';

// Helper function to generate random ID
function generateId(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  // Tạo phòng mới
  async createRoom(user_id: string, dto: CreateRoomDto) {
    const room_id = `r${generateId(10)}`;

    // Hash password nếu có
    let hashedPassword = null;
    if (dto.is_protected && dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    // Nếu phòng không có password hoặc đã set password ngay → active luôn
    // Nếu is_protected = true nhưng chưa có password → created (chờ set password)
    const initialStatus = (dto.is_protected && !dto.password) ? 'created' : 'active';

    const room = await this.prisma.room.create({
      data: {
        id: room_id,
        title: dto.title,
        mode: dto.mode,
        labels: dto.labels || [],
        is_protected: dto.is_protected || false,
        password_hash: hashedPassword,
        status: initialStatus,
        host_id: user_id,
        max_participants: dto.maxParticipants || 10,
        current_participants: 1,
      },
      include: {
        host: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // Tạo slots cho phòng
    await this.createRoomSeats(room_id, dto.maxParticipants || 10);

    // Host tự động join vào slot 1
    await this.prisma.roomParticipant.create({
      data: {
        room_id: room_id,
        user_id: user_id,
        seat_id: 1,
        role: 'host',
      },
    });

    return {
      success: true,
      data: {
        room_id: room.id,
        title: room.title,
        mode: room.mode,
        labels: room.labels,
        is_protected: room.is_protected,
        password_set: !!hashedPassword,
        status: room.status,
        host: {
          id: room.host.id,
          name: room.host.nickname,
          avatar: room.host.avatar,
          badges: ['verified', 'idol'],
        },
        maxParticipants: room.max_participants,
        currentParticipants: room.current_participants,
        createdAt: room.created_at,
      },
    };
  }

  // Tạo ghế cho phòng
  private async createRoomSeats(room_id: string, maxSeats: number) {
    const seats = [];
    for (let i = 1; i <= maxSeats; i++) {
      seats.push({
        room_id: room_id,
        seat_id: i,
        locked: false,
      });
    }
    await this.prisma.roomSeat.createMany({ data: seats });
  }

  // Đặt mật khẩu phòng
  async setPassword(room_id: string, user_id: string, dto: SetPasswordDto) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== user_id) throw new ForbiddenException('Only host can set password');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.room.update({
      where: { id: room_id },
      data: {
        password_hash: hashedPassword,
        is_protected: true,
        status: 'active',
      },
    });

    return {
      success: true,
      data: {
        room_id: room_id,
        is_protected: true,
        password_set: true,
        status: 'active',
      },
    };
  }

  // Xác thực mật khẩu
  async verifyPassword(room_id: string, dto: VerifyPasswordDto) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (!room.is_protected) throw new BadRequestException('Room is not protected');
    if (!room.password_hash) throw new BadRequestException('Room password not set yet');

    const isValid = await bcrypt.compare(dto.password, room.password_hash);
    if (!isValid) throw new ForbiddenException('Incorrect password');

    const accessToken = generateId(32);
    // Store token in cache/redis (simplified here)
    
    return {
      success: true,
      data: {
        verified: true,
        accessToken,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    };
  }

  // Join phòng
  async joinRoom(room_id: string, user_id: string, dto: JoinRoomDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: room_id },
      include: { participants: true },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.status === 'closed') throw new ForbiddenException('Room has been closed');
    if (room.current_participants >= room.max_participants) {
      throw new ForbiddenException('Room is full');
    }

    // Check password if protected
    if (room.is_protected && dto.password) {
      const isValid = await bcrypt.compare(dto.password, room.password_hash);
      if (!isValid) throw new ForbiddenException('Incorrect password');
    }

    // Check if user already in room
    const existing = await this.prisma.roomParticipant.findFirst({
      where: { room_id: room_id, user_id: user_id, left_at: null },
    });
    if (existing) throw new BadRequestException('Already in room');

    // Find empty seat
    const emptySeat = await this.prisma.roomSeat.findFirst({
      where: { room_id: room_id, user_id: null, locked: false },
      orderBy: { seat_id: 'asc' },
    });

    const participant = await this.prisma.roomParticipant.create({
      data: {
        room_id: room_id,
        user_id: user_id,
        seat_id: emptySeat?.seat_id,
        role: 'listener',
      },
    });

    // Update room participant count
    await this.prisma.room.update({
      where: { id: room_id },
      data: { current_participants: { increment: 1 } },
    });

    return {
      success: true,
      data: {
        room_id: room_id,
        join_status: 'success',
        slot_assigned: emptySeat?.seat_id,
        participantId: participant.id,
        isMuted: false,
        isCameraOn: false,
        webRtcToken: generateId(32),
        chatWebSocketUrl: `wss://chat.example.com/rooms/${room_id}`,
        voiceWebSocketUrl: `wss://voice.example.com/rooms/${room_id}`,
      },
    };
  }

  // Lấy thông tin phòng
  async getRoomInfo(room_id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: room_id },
      include: {
        host: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        seats: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
          orderBy: { seat_id: 'asc' },
        },
      },
    });

    if (!room) throw new NotFoundException('Room not found');

    return {
      success: true,
      data: {
        room_id: room.id,
        title: room.title,
        mode: room.mode,
        labels: room.labels,
        is_protected: room.is_protected,
        host: {
          id: room.host.id,
          name: room.host.nickname,
          avatar: room.host.avatar,
        },
        members_count: room.current_participants,
        maxParticipants: room.max_participants,
        status: room.status,
        slots: room.seats.map((seat) => ({
          slot: seat.seat_id,
          user: seat.user
            ? {
                id: seat.user.id,
                name: seat.user.nickname,
                avatar: seat.user.avatar,
              }
            : null,
          locked: seat.locked,
        })),
        createdAt: room.created_at,
      },
    };
  }

  // Rời phòng
  async leaveRoom(room_id: string, user_id: string) {
    const participant = await this.prisma.roomParticipant.findFirst({
      where: { room_id: room_id, user_id: user_id, left_at: null },
    });

    if (!participant) throw new NotFoundException('Not in room');

    await this.prisma.roomParticipant.update({
      where: { id: participant.id },
      data: { left_at: new Date() },
    });

    // Update room participant count
    await this.prisma.room.update({
      where: { id: room_id },
      data: { current_participants: { decrement: 1 } },
    });

    // Clear seat
    if (participant.seat_id) {
      await this.prisma.roomSeat.update({
        where: {
          room_id_seat_id: {
            room_id: room_id,
            seat_id: participant.seat_id,
          },
        },
        data: { user_id: null },
      });
    }

    return {
      success: true,
      data: {
        message: 'left_room',
        room_id: room_id,
        user_id: user_id,
      },
    };
  }

  // Đóng phòng (host only)
  async closeRoom(room_id: string, user_id: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== user_id) throw new ForbiddenException('Only host can close room');

    await this.prisma.room.update({
      where: { id: room_id },
      data: {
        status: 'closed',
        closed_at: new Date(),
      },
    });

    // Update all participants
    await this.prisma.roomParticipant.updateMany({
      where: { room_id: room_id, left_at: null },
      data: { left_at: new Date() },
    });

    return {
      success: true,
      data: { message: 'Room closed', room_id: room_id },
    };
  }

  // Lấy danh sách phòng
  async getRooms(query: { tab?: string; mode?: string; page?: number; limit?: number; user_id?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { status: 'active' };

    if (query.mode) {
      where.mode = query.mode;
    }

    // Xử lý theo tab
    if (query.tab === 'all' || !query.tab) {
      // Tab "all": Lấy tất cả phòng công khai (không có password)
      where.is_protected = false;
    } else if (query.tab === 'my_rooms' && query.user_id) {
      // Tab "my_rooms": Lấy phòng của chính mình tạo (cả created và active)
      where.host_id = query.user_id;
      where.status = { in: ['created', 'active'] };
    } else if (query.tab === 'follow' && query.user_id) {
      // Tab "follow": Lấy phòng của người mình follow
      const following = await this.prisma.resFollow.findMany({
        where: { follower_id: query.user_id },
        select: { following_id: true },
      });
      const followingIds = following.map((f) => f.following_id);
      where.host_id = { in: followingIds };
    } else if (query.tab === 'friends' && query.user_id) {
      // Tab "friends": Lấy phòng của bạn bè
      const friends = await this.prisma.resFriend.findMany({
        where: {
          OR: [
            { user_a_id: query.user_id },
            { user_b_id: query.user_id },
          ],
        },
        select: { user_a_id: true, user_b_id: true },
      });
      const friendIds = friends.map((f) => 
        f.user_a_id === query.user_id ? f.user_b_id : f.user_a_id
      );
      where.host_id = { in: friendIds };
    }

    const rooms = await this.prisma.room.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    const total = await this.prisma.room.count({ where });

    return {
      success: true,
      data: {
        rooms: rooms.map((room) => ({
          room_id: room.id,
          title: room.title,
          mode: room.mode,
          host: {
            id: room.host.id,
            name: room.host.nickname,
            avatar: room.host.avatar,
          },
          viewer_count: room.current_participants,
          status: room.status,
          has_password: room.is_protected,
        })),
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + limit < total,
        },
      },
    };
  }
}
