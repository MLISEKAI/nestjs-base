// Import Injectable và exceptions từ NestJS
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import các DTO để validate và type-check dữ liệu
import { CreateEventDto, UpdateEventDto, JoinEventDto } from '../dto/event.dto';
// Import BaseQueryDto cho pagination
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
// Import utility để build paginated response
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';
// Import Prisma types để type-check
import { Prisma } from '@prisma/client';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * EventService - Service xử lý business logic cho events (sự kiện)
 *
 * Chức năng chính:
 * - Lấy danh sách events công khai (chỉ events sắp diễn ra)
 * - Lấy chi tiết event với user participation status
 * - Lấy danh sách events mà user đã tham gia
 * - Tạo event mới
 * - Cập nhật thông tin event (chỉ creator)
 * - Xóa event (chỉ creator)
 * - Join/leave event với status (going/maybe/not_going)
 * - Lấy danh sách participants của event
 *
 * Lưu ý:
 * - Chỉ hiển thị events công khai (is_public = true)
 * - Chỉ hiển thị events sắp diễn ra (start_time >= now)
 * - Event có thể giới hạn số lượng participants (max_participants)
 * - Chỉ creator mới có thể update/delete event
 * - User có thể join với 3 status: going, maybe, not_going
 */
@Injectable()
export class EventService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject PrismaService khi tạo instance của service
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách events công khai (chỉ events sắp diễn ra)
   * @param query - Query parameters cho pagination (page, limit)
   * @returns Paginated list of public future events
   */
  async getEvents(query?: BaseQueryDto) {
    // Parse pagination parameters với default values
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Lấy thời gian hiện tại để filter events sắp diễn ra
    const now = new Date();

    // Query events và count total cùng lúc
    const [events, total] = await Promise.all([
      this.prisma.resEvent.findMany({
        where: {
          is_public: true, // Chỉ lấy events công khai
          start_time: { gte: now }, // Chỉ lấy events sắp diễn ra (greater than or equal now)
        },
        take,
        skip,
        orderBy: { start_time: 'asc' }, // Sắp xếp theo thời gian bắt đầu (sớm nhất trước)
        include: {
          _count: {
            select: {
              participants: true, // Đếm số lượng participants
            },
          },
        },
      }),
      this.prisma.resEvent.count({
        where: {
          is_public: true,
          start_time: { gte: now },
        },
      }),
    ]);

    // Format response: chuyển _count.participants thành participants_count
    const formattedEvents = events.map((event) => ({
      ...event,
      participants_count: event._count.participants,
      _count: undefined, // Xóa _count khỏi response
    }));

    return buildPaginatedResponse(formattedEvents, total, page, take);
  }

  /**
   * Lấy chi tiết event với user participation status
   * @param eventId - ID của event
   * @param user_id - ID của user (optional, để check participation status)
   * @returns Event details với user_status
   */
  async getEvent(eventId: string, user_id?: string) {
    // Query event với creator info và participants count
    const event = await this.prisma.resEvent.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
        creator: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Nếu có user_id, check participation status
    let userStatus = null;
    if (user_id) {
      const participation = await this.prisma.resEventParticipant.findUnique({
        where: {
          event_id_user_id: {
            event_id: eventId,
            user_id: user_id,
          },
        },
      });
      userStatus = participation?.status || null; // going, maybe, not_going, hoặc null
    }

    return {
      ...event,
      participants_count: event._count.participants,
      user_status: userStatus, // Trạng thái tham gia của user
      _count: undefined,
    };
  }

  /**
   * Lấy danh sách events mà user đã tham gia
   * @param user_id - ID của user
   * @param query - Query parameters cho pagination
   * @returns Paginated list of user's events
   */
  async getUserEvents(user_id: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Query participations của user
    const [participations, total] = await Promise.all([
      this.prisma.resEventParticipant.findMany({
        where: { user_id: user_id },
        take,
        skip,
        orderBy: { joined_at: 'desc' }, // Sắp xếp theo thời gian join (mới nhất trước)
        include: {
          event: {
            include: {
              _count: {
                select: {
                  participants: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.resEventParticipant.count({
        where: { user_id: user_id },
      }),
    ]);

    // Format response: extract event info và thêm user_status
    const events = participations.map((participation) => ({
      ...participation.event,
      participants_count: participation.event._count.participants,
      user_status: participation.status, // Trạng thái tham gia của user
      _count: undefined,
    }));

    return buildPaginatedResponse(events, total, page, take);
  }

  /**
   * Tạo event mới
   * @param user_id - ID của user tạo event (creator)
   * @param dto - DTO chứa thông tin event
   * @returns Event đã tạo
   * @throws BadRequestException nếu end_time <= start_time
   */
  async createEvent(user_id: string, dto: CreateEventDto) {
    // Parse dates từ string
    const startTime = new Date(dto.start_time);
    const endTime = dto.end_time ? new Date(dto.end_time) : null;

    // Validate: end_time phải sau start_time
    if (endTime && endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Tạo event mới
    const event = await this.prisma.resEvent.create({
      data: {
        created_by: user_id, // Creator của event
        title: dto.title,
        description: dto.description,
        location: dto.location,
        start_time: startTime,
        end_time: endTime,
        is_public: dto.is_public,
        max_participants: dto.max_participants,
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    return {
      ...event,
      participants_count: event._count.participants,
      _count: undefined,
    };
  }

  /**
   * Cập nhật thông tin event
   * @param user_id - ID của user (để verify creator)
   * @param eventId - ID của event cần update
   * @param dto - DTO chứa thông tin mới
   * @returns Event đã update
   * @throws NotFoundException nếu event không tồn tại
   * @throws ForbiddenException nếu user không phải creator
   * @throws BadRequestException nếu end_time <= start_time
   */
  async updateEvent(user_id: string, eventId: string, dto: UpdateEventDto) {
    // Check if user is the creator
    const event = await this.prisma.resEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.created_by !== user_id) {
      throw new ForbiddenException('Only event creator can update event');
    }

    // Build update data (chỉ update các fields được gửi lên)
    const updateData: Prisma.ResEventUpdateInput = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.start_time) updateData.start_time = new Date(dto.start_time);
    if (dto.end_time !== undefined) {
      updateData.end_time = dto.end_time ? new Date(dto.end_time) : null;
    }
    if (dto.is_public !== undefined) updateData.is_public = dto.is_public;
    if (dto.max_participants !== undefined) updateData.max_participants = dto.max_participants;

    // Validate: end_time phải sau start_time
    if (
      updateData.end_time &&
      updateData.start_time &&
      updateData.end_time <= updateData.start_time
    ) {
      throw new BadRequestException('End time must be after start time');
    }

    // Update event
    const updated = await this.prisma.resEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    return {
      ...updated,
      participants_count: updated._count.participants,
      _count: undefined,
    };
  }

  /**
   * Xóa event
   * @param user_id - ID của user (để verify creator)
   * @param eventId - ID của event cần xóa
   * @returns Message xác nhận đã xóa
   * @throws NotFoundException nếu event không tồn tại
   * @throws ForbiddenException nếu user không phải creator
   */
  async deleteEvent(user_id: string, eventId: string) {
    // Check if user is the creator
    const event = await this.prisma.resEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.created_by !== user_id) {
      throw new ForbiddenException('Only event creator can delete event');
    }

    try {
      await this.prisma.resEvent.delete({
        where: { id: eventId },
      });

      return { message: 'Event deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Event not found');
      }
      throw error;
    }
  }

  /**
   * Join event với status (going/maybe/not_going)
   * @param user_id - ID của user
   * @param eventId - ID của event
   * @param dto - DTO chứa status (going, maybe, not_going)
   * @returns Participation record
   * @throws NotFoundException nếu event không tồn tại
   * @throws BadRequestException nếu event đã full (max_participants reached)
   */
  async joinEvent(user_id: string, eventId: string, dto: JoinEventDto) {
    // Check if event exists
    const event = await this.prisma.resEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check max participants (chỉ check khi status = going)
    if (event.max_participants) {
      const currentCount = await this.prisma.resEventParticipant.count({
        where: {
          event_id: eventId,
          status: 'going', // Chỉ đếm những người going
        },
      });

      if (currentCount >= event.max_participants && dto.status === 'going') {
        throw new BadRequestException('Event is full');
      }
    }

    // Upsert participation (create nếu chưa có, update nếu đã có)
    const participation = await this.prisma.resEventParticipant.upsert({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: user_id,
        },
      },
      create: {
        event_id: eventId,
        user_id: user_id,
        status: dto.status, // going, maybe, not_going
      },
      update: {
        status: dto.status, // Update status nếu đã join trước đó
      },
    });

    return participation;
  }

  /**
   * Leave event (xóa participation)
   * @param user_id - ID của user
   * @param eventId - ID của event
   * @returns Message xác nhận đã leave
   * @throws NotFoundException nếu participation không tồn tại
   */
  async leaveEvent(user_id: string, eventId: string) {
    try {
      await this.prisma.resEventParticipant.delete({
        where: {
          event_id_user_id: {
            event_id: eventId,
            user_id: user_id,
          },
        },
      });

      return { message: 'Left event successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Participation not found');
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách participants của event
   * @param eventId - ID của event
   * @param query - Query parameters cho pagination
   * @returns Paginated list of participants
   * @throws NotFoundException nếu event không tồn tại
   */
  async getEventParticipants(eventId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Check if event exists
    const event = await this.prisma.resEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Query participants
    const [participants, total] = await Promise.all([
      this.prisma.resEventParticipant.findMany({
        where: { event_id: eventId },
        take,
        skip,
        orderBy: { joined_at: 'asc' }, // Sắp xếp theo thời gian join (người join sớm nhất trước)
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.resEventParticipant.count({
        where: { event_id: eventId },
      }),
    ]);

    return buildPaginatedResponse(participants, total, page, take);
  }
}
