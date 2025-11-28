import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateRoomSettingsDto, SetRoomModeDto, SetSeatLayoutDto, AssignSeatDto } from '../dto/room-settings.dto';

@Injectable()
export class RoomSettingsService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách modes
  async getModes(room_id: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');

    return {
      room_id: room_id,
      current_mode: room.mode,
      modes: [
        { id: 'party', title: 'Tiệc tùng', icon: '🎉' },
        { id: 'make_friends', title: 'Kết bạn', icon: '🤝' },
        { id: 'chat', title: 'Trò chuyện', icon: '💬' },
        { id: 'game', title: 'Trò chơi', icon: '🎮' },
        { id: 'entertain', title: 'Giải trí', icon: '⭐' },
        { id: 'music', title: 'Âm nhạc', icon: '🎵' },
      ],
    };
  }

  // Chọn mode
  async setMode(room_id: string, user_id: string, dto: SetRoomModeDto) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== user_id) throw new ForbiddenException('Only host can change mode');

    await this.prisma.room.update({
      where: { id: room_id },
      data: { mode: dto.mode },
    });

    return {
      success: true,
      room_id: room_id,
      mode: dto.mode,
      updated_at: new Date(),
    };
  }

  // Lấy danh sách seat layouts
  async getSeatLayouts(room_id: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');

    return {
      room_id: room_id,
      current_layout_id: room.layout_id,
      layouts: [
        {
          id: 'layout_1',
          name: 'Chế độ 1',
          seats: 12,
          preview: Array(12).fill(1),
        },
        {
          id: 'layout_2',
          name: 'Chế độ 2',
          seats: 8,
          preview: Array(8).fill(1),
        },
        {
          id: 'layout_3',
          name: 'Chế độ 3',
          seats: 9,
          preview: Array(9).fill(1),
        },
        {
          id: 'layout_4',
          name: 'Chế độ 4',
          seats: 10,
          preview: Array(10).fill(1),
        },
      ],
    };
  }

  // Chọn seat layout
  async setSeatLayout(room_id: string, user_id: string, dto: SetSeatLayoutDto) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== user_id) throw new ForbiddenException('Only host can change layout');

    await this.prisma.room.update({
      where: { id: room_id },
      data: { layout_id: dto.layout_id },
    });

    return {
      success: true,
      room_id: room_id,
      layout_id: dto.layout_id,
    };
  }

  // Lấy danh sách ghế
  async getSeats(room_id: string) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');

    const seats = await this.prisma.roomSeat.findMany({
      where: { room_id: room_id },
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
    });

    return {
      room_id: room_id,
      layout_id: room.layout_id,
      seats: seats.map((seat) => ({
        seat_id: seat.seat_id,
        user: seat.user
          ? {
              id: seat.user.id,
              name: seat.user.nickname,
            }
          : null,
        locked: seat.locked,
      })),
    };
  }

  // Join ghế
  async joinSeat(room_id: string, user_id: string) {
    // Check if user in room
    const participant = await this.prisma.roomParticipant.findFirst({
      where: { room_id: room_id, user_id: user_id, left_at: null },
    });
    if (!participant) throw new ForbiddenException('Not in room');

    // Find empty seat
    const emptySeat = await this.prisma.roomSeat.findFirst({
      where: { room_id: room_id, user_id: null, locked: false },
      orderBy: { seat_id: 'asc' },
    });

    if (!emptySeat) throw new ForbiddenException('No empty seats');

    await this.prisma.roomSeat.update({
      where: { id: emptySeat.id },
      data: { user_id: user_id },
    });

    await this.prisma.roomParticipant.update({
      where: { id: participant.id },
      data: { seat_id: emptySeat.seat_id, role: 'speaker' },
    });

    return { success: true, seat_id: emptySeat.seat_id };
  }

  // Host assign ghế
  async assignSeat(room_id: string, hostId: string, dto: AssignSeatDto) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== hostId) throw new ForbiddenException('Only host can assign seats');

    const seat = await this.prisma.roomSeat.findUnique({
      where: {
        room_id_seat_id: {
          room_id: room_id,
          seat_id: dto.seat_id,
        },
      },
    });

    if (!seat) throw new NotFoundException('Seat not found');
    if (seat.locked) throw new ForbiddenException('Seat is locked');

    await this.prisma.roomSeat.update({
      where: { id: seat.id },
      data: { user_id: dto.user_id },
    });

    return { success: true };
  }

  // Lock/unlock ghế
  async lockSeat(room_id: string, hostId: string, seatId: number, lock: boolean) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== hostId) throw new ForbiddenException('Only host can lock seats');

    await this.prisma.roomSeat.update({
      where: {
        room_id_seat_id: {
          room_id: room_id,
          seat_id: seatId,
        },
      },
      data: { locked: lock },
    });

    return { success: true };
  }

  // Leave seat
  async leaveSeat(room_id: string, user_id: string) {
    const participant = await this.prisma.roomParticipant.findFirst({
      where: { room_id: room_id, user_id: user_id, left_at: null },
    });

    if (!participant || !participant.seat_id) {
      throw new NotFoundException('Not in a seat');
    }

    await this.prisma.roomSeat.update({
      where: {
        room_id_seat_id: {
          room_id: room_id,
          seat_id: participant.seat_id,
        },
      },
      data: { user_id: null },
    });

    await this.prisma.roomParticipant.update({
      where: { id: participant.id },
      data: { seat_id: null, role: 'listener' },
    });

    return { success: true };
  }

  // Update settings
  async updateSettings(room_id: string, user_id: string, dto: UpdateRoomSettingsDto) {
    const room = await this.prisma.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.host_id !== user_id) throw new ForbiddenException('Only host can update settings');

    const updateData: any = {};
    if (dto.name) updateData.title = dto.name;
    if (dto.description) updateData.description = dto.description;
    if (dto.notice) updateData.notice = dto.notice;

    if (dto.disableMessage !== undefined || dto.disableLuckyMoney !== undefined || dto.disableImage !== undefined) {
      const currentSettings = (room.settings as any) || {};
      updateData.settings = {
        ...currentSettings,
        ...(dto.disableMessage !== undefined && { disableMessage: dto.disableMessage }),
        ...(dto.disableLuckyMoney !== undefined && { disableLuckyMoney: dto.disableLuckyMoney }),
        ...(dto.disableImage !== undefined && { disableImage: dto.disableImage }),
      };
    }

    await this.prisma.room.update({
      where: { id: room_id },
      data: updateData,
    });

    return { success: true, room_id: room_id };
  }
}
