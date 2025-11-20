import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, SendGroupMessageDto } from '../dto/group.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { buildPaginatedResponse } from '../../../common/utils/pagination.util';

@Injectable()
export class GroupService {
  constructor(private prisma: PrismaService) {}

  async getGroups(query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [groups, total] = await Promise.all([
      this.prisma.resGroup.findMany({
        where: { is_public: true },
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
      this.prisma.resGroup.count({
        where: { is_public: true },
      }),
    ]);

    const formattedGroups = groups.map((group) => ({
      ...group,
      members_count: group._count.members,
      _count: undefined,
    }));

    return buildPaginatedResponse(formattedGroups, total, page, take);
  }

  async getGroup(groupId: string) {
    const group = await this.prisma.resGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return {
      ...group,
      members_count: group._count.members,
      _count: undefined,
    };
  }

  async getUserGroups(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [memberships, total] = await Promise.all([
      this.prisma.resGroupMember.findMany({
        where: { user_id: userId },
        take,
        skip,
        orderBy: { joined_at: 'desc' },
        include: {
          group: {
            include: {
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.resGroupMember.count({
        where: { user_id: userId },
      }),
    ]);

    const groups = memberships.map((membership) => ({
      ...membership.group,
      members_count: membership.group._count.members,
      role: membership.role,
      joined_at: membership.joined_at,
      _count: undefined,
    }));

    return buildPaginatedResponse(groups, total, page, take);
  }

  async createGroup(userId: string, dto: CreateGroupDto) {
    const group = await this.prisma.resGroup.create({
      data: {
        name: dto.name,
        description: dto.description,
        avatar: dto.avatar,
        is_public: dto.is_public,
        created_by: userId,
        members: {
          create: {
            user_id: userId,
            role: 'admin',
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return {
      ...group,
      members_count: group._count.members,
      _count: undefined,
    };
  }

  async updateGroup(userId: string, groupId: string, dto: UpdateGroupDto) {
    // Check if user is admin of the group
    const membership = await this.prisma.resGroupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: userId,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Only group admin can update group');
    }

    try {
      const group = await this.prisma.resGroup.update({
        where: { id: groupId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.avatar !== undefined && { avatar: dto.avatar }),
          ...(dto.is_public !== undefined && { is_public: dto.is_public }),
        },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      return {
        ...group,
        members_count: group._count.members,
        _count: undefined,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Group not found');
      }
      throw error;
    }
  }

  async deleteGroup(userId: string, groupId: string) {
    // Check if user is admin of the group
    const membership = await this.prisma.resGroupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: userId,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Only group admin can delete group');
    }

    try {
      await this.prisma.resGroup.delete({
        where: { id: groupId },
      });

      return { message: 'Group deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Group not found');
      }
      throw error;
    }
  }

  async joinGroup(userId: string, groupId: string) {
    // Check if group exists
    const group = await this.prisma.resGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if already a member
    const existing = await this.prisma.resGroupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Already a member of this group');
    }

    const membership = await this.prisma.resGroupMember.create({
      data: {
        group_id: groupId,
        user_id: userId,
        role: 'member',
      },
    });

    return membership;
  }

  async leaveGroup(userId: string, groupId: string) {
    try {
      await this.prisma.resGroupMember.delete({
        where: {
          group_id_user_id: {
            group_id: groupId,
            user_id: userId,
          },
        },
      });

      return { message: 'Left group successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Membership not found');
      }
      throw error;
    }
  }

  async getGroupMembers(groupId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Check if group exists
    const group = await this.prisma.resGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const [members, total] = await Promise.all([
      this.prisma.resGroupMember.findMany({
        where: { group_id: groupId },
        take,
        skip,
        orderBy: [{ role: 'asc' }, { joined_at: 'asc' }],
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
      this.prisma.resGroupMember.count({
        where: { group_id: groupId },
      }),
    ]);

    return buildPaginatedResponse(members, total, page, take);
  }

  async sendGroupMessage(userId: string, groupId: string, dto: SendGroupMessageDto) {
    // Check if user is a member
    const membership = await this.prisma.resGroupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member to send messages');
    }

    const message = await this.prisma.resGroupMessage.create({
      data: {
        group_id: groupId,
        user_id: userId,
        content: dto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return message;
  }

  async getGroupMessages(groupId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 50;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Check if group exists
    const group = await this.prisma.resGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const [messages, total] = await Promise.all([
      this.prisma.resGroupMessage.findMany({
        where: { group_id: groupId },
        take,
        skip,
        orderBy: { created_at: 'desc' },
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
      this.prisma.resGroupMessage.count({
        where: { group_id: groupId },
      }),
    ]);

    return buildPaginatedResponse(messages.reverse(), total, page, take);
  }
}
