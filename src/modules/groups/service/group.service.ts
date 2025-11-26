import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, SendGroupMessageDto } from '../dto/group.dto';
import {
  UpdateGroupIntroductionDto,
  UpdateGroupNameDto,
  UpdateGroupAvatarDto,
  UpdateGroupNotificationsDto,
  UpdateGroupGiftEffectDto,
  UpdateGroupClassificationDto,
  ReportGroupDto,
  AddGroupMembersDto,
  UpdateMemberRoleDto,
  UpdateGroupSettingsDto,
} from '../dto/group-settings.dto';
import { GroupClassification } from '../../../common/enums';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { GroupMemberQueryDto } from '../dto/group.dto';
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

  async getGroup(group_id: string) {
    const group = await this.prisma.resGroup.findUnique({
      where: { id: group_id },
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
            role: 'admin', // First member is admin
          },
        },
        conversation: {
          create: {
            type: 'group',
            created_by: userId,
            settings: {
              create: {},
            },
            participants: {
              create: {
                user_id: userId,
              },
            },
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

  async updateGroup(userId: string, group_id: string, dto: UpdateGroupDto) {
    // Check if user is admin of the group
    const membership = await this.prisma.resGroupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: group_id,
          user_id: userId,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Only group admin can update group');
    }

    try {
      const group = await this.prisma.resGroup.update({
        where: { id: group_id },
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

  async deleteGroup(userId: string, group_id: string) {
    // Check if user is admin of the group
    const membership = await this.prisma.resGroupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: group_id,
          user_id: userId,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Only group admin can delete group');
    }

    try {
      await this.prisma.resGroup.delete({
        where: { id: group_id },
      });

      return { message: 'Group deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Group not found');
      }
      throw error;
    }
  }

  async joinGroup(userId: string, group_id: string) {
    // Check if group exists
    const group = await this.prisma.resGroup.findUnique({
      where: { id: group_id },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if already an active member (left_at is null)
    const existing = await this.prisma.resGroupMember.findFirst({
      where: {
        group_id: group_id,
        user_id: userId,
        left_at: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Already a member of this group');
    }

    // Check if there's an inactive membership (user previously left)
    const inactiveMembership = await this.prisma.resGroupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: group_id,
          user_id: userId,
        },
      },
    });

    if (inactiveMembership) {
      // Rejoin by updating the existing record
      const membership = await this.prisma.resGroupMember.update({
        where: {
          group_id_user_id: {
            group_id: group_id,
            user_id: userId,
          },
        },
        data: {
          left_at: null,
          joined_at: new Date(),
        },
      });

      // Re-add to conversation if exists
      const conversation = await this.prisma.resConversation.findFirst({
        where: { group_id: group_id },
      });

      if (conversation) {
        const participant = await this.prisma.resConversationParticipant.findFirst({
          where: {
            conversation_id: conversation.id,
            user_id: userId,
          },
        });

        if (participant) {
          // Update existing participant
          await this.prisma.resConversationParticipant.update({
            where: { id: participant.id },
            data: { left_at: null },
          });
        } else {
          // Create new participant
          await this.prisma.resConversationParticipant.create({
            data: {
              conversation_id: conversation.id,
              user_id: userId,
            },
          });
        }
      }

      return membership;
    }

    // Create new membership
    // Handle potential race condition where membership might be created between checks
    let membership;
    try {
      membership = await this.prisma.resGroupMember.create({
        data: {
          group_id: group_id,
          user_id: userId,
          role: 'member',
        },
      });
    } catch (error) {
      // If unique constraint violation (P2002), check if it's an active membership
      if (error.code === 'P2002') {
        // Race condition: membership was created between our checks
        // Check if it's active (left_at is null)
        const raceConditionMembership = await this.prisma.resGroupMember.findUnique({
          where: {
            group_id_user_id: {
              group_id: group_id,
              user_id: userId,
            },
          },
        });

        if (raceConditionMembership && raceConditionMembership.left_at === null) {
          throw new BadRequestException('Already a member of this group');
        }

        // If it's inactive, update it (same as rejoin logic above)
        if (raceConditionMembership) {
          membership = await this.prisma.resGroupMember.update({
            where: {
              group_id_user_id: {
                group_id: group_id,
                user_id: userId,
              },
            },
            data: {
              left_at: null,
              joined_at: new Date(),
            },
          });
        } else {
          // Shouldn't happen, but rethrow if it's not a membership issue
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Add to conversation if exists
    const conversation = await this.prisma.resConversation.findFirst({
      where: { group_id: group_id },
    });

    if (conversation) {
      try {
        await this.prisma.resConversationParticipant.create({
          data: {
            conversation_id: conversation.id,
            user_id: userId,
          },
        });
      } catch (error) {
        // Skip if already a participant (shouldn't happen, but handle gracefully)
        if (error.code !== 'P2002') {
          throw error;
        }
      }
    }

    return membership;
  }

  async leaveGroup(userId: string, group_id: string) {
    try {
      await this.prisma.resGroupMember.update({
        where: {
          group_id_user_id: {
            group_id: group_id,
            user_id: userId,
          },
        },
        data: { left_at: new Date() },
      });

      // Remove from conversation
      const conversation = await this.prisma.resConversation.findFirst({
        where: { group_id: group_id },
      });

      if (conversation) {
        const participant = await this.prisma.resConversationParticipant.findFirst({
          where: {
            conversation_id: conversation.id,
            user_id: userId,
            left_at: null,
          },
        });

        if (participant) {
          await this.prisma.resConversationParticipant.update({
            where: { id: participant.id },
            data: { left_at: new Date() },
          });
        }
      }

      return { message: 'Left group successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Membership not found');
      }
      throw error;
    }
  }

  async getGroupMembers(group_id: string, query?: GroupMemberQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Check if group exists
    const group = await this.prisma.resGroup.findUnique({
      where: { id: group_id },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const where: any = {
      group_id: group_id,
      left_at: null,
    };
    if (query?.role) {
      where.role = query.role;
    }
    if (query?.since) {
      where.joined_at = { gt: query.since };
    }
    if (query?.search) {
      where.user = { nickname: { contains: query.search, mode: 'insensitive' } };
    }

    let orderBy: any = [{ role: 'asc' }, { joined_at: 'asc' }];
    if (query?.sort) {
      const [fieldRaw, orderRaw] = String(query.sort).split(':');
      const fieldMap: Record<string, string> = {
        created_at: 'joined_at',
        joined_at: 'joined_at',
        role: 'role',
      };
      const field = fieldMap[fieldRaw] ?? 'joined_at';
      const order = orderRaw === 'asc' ? 'asc' : 'desc';
      orderBy = [{ [field]: order }];
    }

    const [members, total] = await Promise.all([
      this.prisma.resGroupMember.findMany({
        where,
        take,
        skip,
        orderBy,
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
      this.prisma.resGroupMember.count({ where }),
    ]);

    return buildPaginatedResponse(members, total, page, take);
  }

  async sendGroupMessage(userId: string, group_id: string, dto: SendGroupMessageDto) {
    // Check if user is a member
    const membership = await this.prisma.resGroupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: group_id,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member to send messages');
    }

    // Get or create conversation
    const conversation = await this.getOrCreateGroupConversation(group_id);

    // Create message in conversation system
    const message = await this.prisma.resMessage.create({
      data: {
        conversation_id: conversation.id,
        sender_id: userId,
        type: 'text',
        content: dto.content,
        is_read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation updated_at
    await this.prisma.resConversation.update({
      where: { id: conversation.id },
      data: { updated_at: new Date() },
    });

    // Map to GroupMessageDto format
    return {
      id: message.id,
      group_id: group_id,
      user_id: message.sender_id,
      content: message.content,
      created_at: message.created_at,
      user: message.sender
        ? {
            id: message.sender.id,
            nickname: message.sender.nickname,
            avatar: message.sender.avatar || undefined,
          }
        : undefined,
    };
  }

  async getGroupMessages(group_id: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 50;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Check if group exists
    const group = await this.prisma.resGroup.findUnique({
      where: { id: group_id },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Get conversation
    const conversation = await this.prisma.resConversation.findFirst({
      where: { group_id: group_id },
    });

    if (!conversation) {
      return buildPaginatedResponse([], 0, page, take);
    }

    const [messages, total] = await Promise.all([
      this.prisma.resMessage.findMany({
        where: {
          conversation_id: conversation.id,
          deleted_at: null,
        },
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.resMessage.count({
        where: {
          conversation_id: conversation.id,
          deleted_at: null,
        },
      }),
    ]);

    // Map messages to GroupMessageDto format
    const mappedMessages = messages.reverse().map((message) => ({
      id: message.id,
      group_id: group_id,
      user_id: message.sender_id,
      content: message.content,
      created_at: message.created_at,
      user: message.sender
        ? {
            id: message.sender.id,
            nickname: message.sender.nickname,
            avatar: message.sender.avatar || undefined,
          }
        : undefined,
    }));

    return buildPaginatedResponse(mappedMessages, total, page, take);
  }

  /**
   * Get group settings
   */
  async getGroupSettings(group_id: string, userId: string) {
    const group = await this.prisma.resGroup.findUnique({
      where: { id: group_id },
      include: {
        conversation: {
          include: {
            settings: true,
            participants: {
              where: { user_id: userId },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const participant = group.conversation?.participants[0];

    return {
      group: {
        id: group.id,
        name: group.name,
        avatar: group.avatar,
        introduction: group.introduction,
        classification: group.classification,
        max_members: group.max_members,
      },
      notifications: {
        enabled: !participant?.is_muted,
      },
      giftSounds: {
        enabled: participant?.gift_sounds_enabled ?? true,
      },
    };
  }

  async updateGroupSettings(group_id: string, userId: string, dto: UpdateGroupSettingsDto) {
    const requiresAdmin =
      dto.name !== undefined ||
      dto.introduction !== undefined ||
      dto.avatar !== undefined ||
      dto.classification !== undefined ||
      dto.description !== undefined ||
      dto.is_public !== undefined;

    if (requiresAdmin) {
      await this.checkAdminPermission(group_id, userId);
      await this.prisma.resGroup.update({
        where: { id: group_id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.introduction !== undefined && { introduction: dto.introduction }),
          ...(dto.avatar !== undefined && { avatar: dto.avatar }),
          ...(dto.classification !== undefined && { classification: dto.classification }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.is_public !== undefined && { is_public: dto.is_public }),
        },
      });
    }

    if (dto.notifications_enabled !== undefined || dto.gift_sounds_enabled !== undefined) {
      const conversation = await this.getOrCreateGroupConversation(group_id);
      const participant = await this.prisma.resConversationParticipant.findFirst({
        where: { conversation_id: conversation.id, user_id: userId, left_at: null },
      });

      if (!participant) {
        throw new NotFoundException('You are not a member of this group');
      }

      const participantData: Record<string, any> = {};
      if (dto.notifications_enabled !== undefined) {
        participantData.is_muted = !dto.notifications_enabled;
      }
      if (dto.gift_sounds_enabled !== undefined) {
        participantData.gift_sounds_enabled = dto.gift_sounds_enabled;
      }

      if (Object.keys(participantData).length > 0) {
        await this.prisma.resConversationParticipant.update({
          where: { id: participant.id },
          data: participantData,
        });
      }
    }

    return this.getGroupSettings(group_id, userId);
  }

  /**
   * Update group introduction
   */
  async updateGroupIntroduction(group_id: string, userId: string, dto: UpdateGroupIntroductionDto) {
    await this.checkAdminPermission(group_id, userId);

    const group = await this.prisma.resGroup.update({
      where: { id: group_id },
      data: { introduction: dto.introduction },
    });

    return { message: 'Introduction updated successfully', data: group };
  }

  /**
   * Update group name
   */
  async updateGroupName(group_id: string, userId: string, dto: UpdateGroupNameDto) {
    await this.checkAdminPermission(group_id, userId);

    const group = await this.prisma.resGroup.update({
      where: { id: group_id },
      data: { name: dto.name },
    });

    return { message: 'Group name updated successfully', data: group };
  }

  /**
   * Update group avatar
   */
  async updateGroupAvatar(group_id: string, userId: string, dto: UpdateGroupAvatarDto) {
    await this.checkAdminPermission(group_id, userId);

    const group = await this.prisma.resGroup.update({
      where: { id: group_id },
      data: { avatar: dto.avatar },
    });

    return { message: 'Group avatar updated successfully', data: group };
  }

  /**
   * Update group notifications
   */
  async updateGroupNotifications(
    group_id: string,
    userId: string,
    dto: UpdateGroupNotificationsDto,
  ) {
    const conversation = await this.getOrCreateGroupConversation(group_id);
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversation.id,
        user_id: userId,
        left_at: null,
      },
    });

    if (!participant) {
      throw new NotFoundException('You are not a member of this group');
    }

    await this.prisma.resConversationParticipant.update({
      where: { id: participant.id },
      data: { is_muted: !dto.enabled },
    });

    return { message: 'Notifications updated successfully' };
  }

  /**
   * Update group gift effect
   */
  async updateGroupGiftEffect(group_id: string, userId: string, dto: UpdateGroupGiftEffectDto) {
    const conversation = await this.getOrCreateGroupConversation(group_id);
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversation.id,
        user_id: userId,
        left_at: null,
      },
    });

    if (!participant) {
      throw new NotFoundException('You are not a member of this group');
    }

    await this.prisma.resConversationParticipant.update({
      where: { id: participant.id },
      data: { gift_sounds_enabled: dto.enabled },
    });

    return { message: 'Gift sounds updated successfully' };
  }

  /**
   * Get group classifications
   */
  async getClassifications() {
    return {
      classifications: Object.values(GroupClassification).map((value) => ({
        id: value,
        name: value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
    };
  }

  /**
   * Update group classification
   */
  async updateGroupClassification(
    group_id: string,
    userId: string,
    dto: UpdateGroupClassificationDto,
  ) {
    await this.checkAdminPermission(group_id, userId);

    const group = await this.prisma.resGroup.update({
      where: { id: group_id },
      data: { classification: dto.classification },
    });

    return { message: 'Classification updated successfully', data: group };
  }

  /**
   * Report group
   */
  async reportGroup(group_id: string, userId: string, dto: ReportGroupDto) {
    const group = await this.prisma.resGroup.findUnique({
      where: { id: group_id },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // TODO: Create report record in database
    // For now, just return success
    return { message: 'Group reported successfully' };
  }

  /**
   * Add members to group
   */
  async addGroupMembers(group_id: string, userId: string, dto: AddGroupMembersDto) {
    await this.checkAdminPermission(group_id, userId);

    const group = await this.prisma.resGroup.findUnique({
      where: { id: group_id },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check max members
    const currentCount = await this.prisma.resGroupMember.count({
      where: { group_id: group_id, left_at: null },
    });

    if (currentCount + dto.userIds.length > group.max_members) {
      throw new BadRequestException('Exceeds maximum members limit');
    }

    // Add members
    const members = [];
    for (const memberId of dto.userIds) {
      try {
        const member = await this.prisma.resGroupMember.create({
          data: {
            group_id: group_id,
            user_id: memberId,
            role: 'member',
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
        members.push(member);
      } catch (error) {
        // Skip if already a member
        if (error.code !== 'P2002') {
          throw error;
        }
      }
    }

    // Add to conversation if exists
    const conversation = await this.getOrCreateGroupConversation(group_id);
    for (const memberId of dto.userIds) {
      try {
        await this.prisma.resConversationParticipant.create({
          data: {
            conversation_id: conversation.id,
            user_id: memberId,
          },
        });
      } catch (error) {
        // Skip if already a participant
        if (error.code !== 'P2002') {
          throw error;
        }
      }
    }

    return { message: 'Members added successfully', data: members };
  }

  /**
   * Remove member from group
   */
  async removeGroupMember(group_id: string, userId: string, memberId: string) {
    await this.checkAdminPermission(group_id, userId);

    // Cannot remove yourself
    if (userId === memberId) {
      throw new BadRequestException('Cannot remove yourself. Use leave group instead.');
    }

    try {
      await this.prisma.resGroupMember.update({
        where: {
          group_id_user_id: {
            group_id: group_id,
            user_id: memberId,
          },
        },
        data: { left_at: new Date() },
      });

      // Remove from conversation
      const conversation = await this.prisma.resConversation.findFirst({
        where: { group_id: group_id },
      });

      if (conversation) {
        const participant = await this.prisma.resConversationParticipant.findFirst({
          where: {
            conversation_id: conversation.id,
            user_id: memberId,
            left_at: null,
          },
        });

        if (participant) {
          await this.prisma.resConversationParticipant.update({
            where: { id: participant.id },
            data: { left_at: new Date() },
          });
        }
      }

      return { message: 'Member removed successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Member not found');
      }
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    group_id: string,
    userId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    await this.checkAdminPermission(group_id, userId);

    // Cannot change your own role
    if (userId === memberId) {
      throw new BadRequestException('Cannot change your own role');
    }

    try {
      const member = await this.prisma.resGroupMember.update({
        where: {
          group_id_user_id: {
            group_id: group_id,
            user_id: memberId,
          },
        },
        data: { role: dto.role },
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

      return { message: 'Member role updated successfully', data: member };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Member not found');
      }
      throw error;
    }
  }

  /**
   * Get member summary
   */
  async getMemberSummary(group_id: string) {
    const [total, owners, admins, members] = await Promise.all([
      this.prisma.resGroupMember.count({
        where: { group_id: group_id, left_at: null },
      }),
      this.prisma.resGroupMember.count({
        where: { group_id: group_id, role: 'owner', left_at: null },
      }),
      this.prisma.resGroupMember.count({
        where: { group_id: group_id, role: 'admin', left_at: null },
      }),
      this.prisma.resGroupMember.count({
        where: { group_id: group_id, role: 'member', left_at: null },
      }),
    ]);

    return {
      total,
      owners,
      admins,
      members,
    };
  }

  /**
   * Helper: Check if user is admin
   */
  private async checkAdminPermission(group_id: string, userId: string) {
    const membership = await this.prisma.resGroupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: group_id,
          user_id: userId,
        },
      },
    });

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      throw new ForbiddenException('Only group admin can perform this action');
    }
  }

  /**
   * Helper: Lấy hoặc tạo hội thoại nhóm
   * Xử lý tình huống race-condition: nếu hai request cùng lúc tạo hội thoại,
   * chỉ một cái thành công, request còn lại sẽ bắt lỗi unique constraint và truy vấn lại thông tin hội thoại đã có.
   */
  private async getOrCreateGroupConversation(group_id: string) {
    // First, try to find existing conversation
    let conversation = await this.prisma.resConversation.findFirst({
      where: { group_id: group_id },
    });

    if (!conversation) {
      // Verify group exists before creating conversation
      const group = await this.prisma.resGroup.findUnique({
        where: { id: group_id },
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      // Try to create conversation
      // If another request creates it concurrently, we'll catch the unique constraint violation
      try {
        conversation = await this.prisma.resConversation.create({
          data: {
            type: 'group',
            group_id: group_id,
            created_by: group.created_by,
            settings: {
              create: {},
            },
          },
        });

        // Add all group members to conversation (only if we successfully created it)
        const groupMembers = await this.prisma.resGroupMember.findMany({
          where: { group_id: group_id, left_at: null },
        });

        // Use createMany with skipDuplicates to handle concurrent participant additions
        if (groupMembers.length > 0) {
          await this.prisma.resConversationParticipant.createMany({
            data: groupMembers.map((member) => ({
              conversation_id: conversation.id,
              user_id: member.user_id,
            })),
            skipDuplicates: true,
          });
        }
      } catch (error) {
        // Handle unique constraint violation (P2002) - another request created the conversation
        if (error.code === 'P2002') {
          // Fetch the conversation that was created by the other request
          conversation = await this.prisma.resConversation.findFirst({
            where: { group_id: group_id },
          });

          if (!conversation) {
            // Shouldn't happen, but handle edge case
            throw new BadRequestException('Failed to create or retrieve group conversation');
          }

          // Still try to add participants (they might not have been added yet)
          // Use skipDuplicates to avoid errors if participants already exist
          const groupMembers = await this.prisma.resGroupMember.findMany({
            where: { group_id: group_id, left_at: null },
          });

          if (groupMembers.length > 0) {
            await this.prisma.resConversationParticipant.createMany({
              data: groupMembers.map((member) => ({
                conversation_id: conversation.id,
                user_id: member.user_id,
              })),
              skipDuplicates: true,
            });
          }
        } else {
          // Re-throw if it's not a unique constraint violation
          throw error;
        }
      }
    }

    return conversation;
  }
}
