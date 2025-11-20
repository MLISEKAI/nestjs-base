import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto, UpdateEventDto, JoinEventDto } from '../dto/event.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async getEvents(query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const now = new Date();

    const [events, total] = await Promise.all([
      this.prisma.resEvent.findMany({
        where: {
          is_public: true,
          start_time: { gte: now }, // Only future events
        },
        take,
        skip,
        orderBy: { start_time: 'asc' },
        include: {
          _count: {
            select: {
              participants: true,
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

    const formattedEvents = events.map((event) => ({
      ...event,
      participants_count: event._count.participants,
      _count: undefined,
    }));

    return buildPaginatedResponse(formattedEvents, total, page, take);
  }

  async getEvent(eventId: string, userId?: string) {
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

    let userStatus = null;
    if (userId) {
      const participation = await this.prisma.resEventParticipant.findUnique({
        where: {
          event_id_user_id: {
            event_id: eventId,
            user_id: userId,
          },
        },
      });
      userStatus = participation?.status || null;
    }

    return {
      ...event,
      participants_count: event._count.participants,
      user_status: userStatus,
      _count: undefined,
    };
  }

  async getUserEvents(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [participations, total] = await Promise.all([
      this.prisma.resEventParticipant.findMany({
        where: { user_id: userId },
        take,
        skip,
        orderBy: { joined_at: 'desc' },
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
        where: { user_id: userId },
      }),
    ]);

    const events = participations.map((participation) => ({
      ...participation.event,
      participants_count: participation.event._count.participants,
      user_status: participation.status,
      _count: undefined,
    }));

    return buildPaginatedResponse(events, total, page, take);
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    const startTime = new Date(dto.start_time);
    const endTime = dto.end_time ? new Date(dto.end_time) : null;

    if (endTime && endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const event = await this.prisma.resEvent.create({
      data: {
        created_by: userId,
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

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    // Check if user is the creator
    const event = await this.prisma.resEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.created_by !== userId) {
      throw new ForbiddenException('Only event creator can update event');
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.start_time) updateData.start_time = new Date(dto.start_time);
    if (dto.end_time !== undefined) {
      updateData.end_time = dto.end_time ? new Date(dto.end_time) : null;
    }
    if (dto.is_public !== undefined) updateData.is_public = dto.is_public;
    if (dto.max_participants !== undefined) updateData.max_participants = dto.max_participants;

    if (
      updateData.end_time &&
      updateData.start_time &&
      updateData.end_time <= updateData.start_time
    ) {
      throw new BadRequestException('End time must be after start time');
    }

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

  async deleteEvent(userId: string, eventId: string) {
    // Check if user is the creator
    const event = await this.prisma.resEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.created_by !== userId) {
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

  async joinEvent(userId: string, eventId: string, dto: JoinEventDto) {
    // Check if event exists
    const event = await this.prisma.resEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check max participants
    if (event.max_participants) {
      const currentCount = await this.prisma.resEventParticipant.count({
        where: {
          event_id: eventId,
          status: 'going',
        },
      });

      if (currentCount >= event.max_participants && dto.status === 'going') {
        throw new BadRequestException('Event is full');
      }
    }

    // Upsert participation
    const participation = await this.prisma.resEventParticipant.upsert({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: userId,
        },
      },
      create: {
        event_id: eventId,
        user_id: userId,
        status: dto.status,
      },
      update: {
        status: dto.status,
      },
    });

    return participation;
  }

  async leaveEvent(userId: string, eventId: string) {
    try {
      await this.prisma.resEventParticipant.delete({
        where: {
          event_id_user_id: {
            event_id: eventId,
            user_id: userId,
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

    const [participants, total] = await Promise.all([
      this.prisma.resEventParticipant.findMany({
        where: { event_id: eventId },
        take,
        skip,
        orderBy: { joined_at: 'asc' },
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
