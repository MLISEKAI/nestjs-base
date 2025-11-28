import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { IPaginatedResponse } from 'src/common/interfaces/pagination.interface';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CreateConversationDto } from '../dto/conversation.dto';
import { ConversationType } from '../../../common/enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách conversations của user với pagination
   */
  async getConversations(user_id: string, query?: BaseQueryDto): Promise<IPaginatedResponse<any>> {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    // Lấy conversations mà user là participant
    const where: Prisma.ResConversationWhereInput = {
      deleted_at: null,
      participants: {
        some: {
          user_id: user_id,
          left_at: null, // Chỉ lấy conversations mà user chưa rời
        },
      },
    };

    // Search filter
    if (query?.search) {
      where.OR = [
        {
          participants: {
            some: {
              user: {
                nickname: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
        {
          group: {
            name: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Sort: mặc định theo updated_at desc (mới nhất trước)
    const orderBy: Prisma.ResConversationOrderByWithRelationInput = { updated_at: 'desc' };
    if (query?.sort) {
      const [field, order] = query.sort.split(':');
      if (field && (order === 'asc' || order === 'desc')) {
        orderBy[field] = order;
      }
    }

    const [conversations, total] = await Promise.all([
      this.prisma.resConversation.findMany({
        where,
        take,
        skip,
        orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
        include: {
          participants: {
            where: {
              left_at: null,
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
          },
          messages: {
            take: 1,
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
          },
          group: {
            select: {
              id: true,
              name: true,
              avatar: true,
              classification: true,
            },
          },
          settings: true,
        },
      }),
      this.prisma.resConversation.count({ where }),
    ]);

    // Format response
    const formattedConversations = conversations.map((conv) => {
      const lastMessage = conv.messages[0] || null;
      const otherParticipants = conv.participants.filter((p) => p.user_id !== user_id);
      const unreadCount = 0; // TODO: Calculate unread count

      return {
        id: conv.id,
        type: conv.type,
        name: conv.type === 'group' ? conv.group?.name : otherParticipants[0]?.user.nickname,
        avatar: conv.type === 'group' ? conv.group?.avatar : otherParticipants[0]?.user.avatar,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              type: lastMessage.type,
              sender: lastMessage.sender,
              createdAt: lastMessage.created_at,
            }
          : null,
        unreadCount,
        updatedAt: conv.updated_at,
        participants: conv.participants.map((p) => ({
          id: p.user.id,
          nickname: p.user.nickname,
          avatar: p.user.avatar,
          displayName: p.display_name,
        })),
        group: conv.group,
        settings: conv.settings,
      };
    });

    return buildPaginatedResponse(formattedConversations, total, page, take);
  }

  /**
   * Lấy chi tiết conversation
   */
  async getConversationById(conversationId: string, user_id: string) {
    const conversation = await this.prisma.resConversation.findFirst({
      where: {
        id: conversationId,
        deleted_at: null,
        participants: {
          some: {
            user_id: user_id,
            left_at: null,
          },
        },
      },
      include: {
        participants: {
          where: {
            left_at: null,
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
        },
        group: {
          select: {
            id: true,
            name: true,
            avatar: true,
            description: true,
            introduction: true,
            classification: true,
            max_members: true,
            members: {
              where: {
                left_at: null,
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
            },
          },
        },
        settings: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * Tạo conversation mới
   */
  async createConversation(user_id: string, dto: CreateConversationDto) {
    // DIRECT CONVERSATION
    if (dto.type === ConversationType.DIRECT) {
      if (!dto.otherUserId) {
        throw new BadRequestException('Direct conversation requires exactly one memberId');
      }

      const otherUserId = Array.isArray(dto.otherUserId) ? dto.otherUserId[0] : dto.otherUserId;

      if (!otherUserId || otherUserId === user_id) {
        throw new BadRequestException('You cannot create a direct chat with yourself');
      }
      // Kiểm tra tồn tại direct room giữa 2 người
      const existing = await this.prisma.resConversation.findFirst({
        where: {
          type: 'direct',
          AND: [
            // user hiện tại phải là participant
            {
              participants: {
                some: { user_id: user_id },
              },
            },
            // người còn lại phải là participant
            {
              participants: {
                some: { user_id: otherUserId },
              },
            },
            // tổng số participant = 2
            {
              participants: {
                every: {
                  user_id: {
                    in: [user_id, otherUserId],
                  },
                },
              },
            },
          ],
        },
      });

      if (existing) {
        return this.getConversationById(existing.id, user_id);
      }

      // Tạo conversation mới
      return this.prisma.resConversation.create({
        data: {
          type: 'direct',
          created_by: user_id,
          participants: {
            create: [{ user_id: user_id }, { user_id: otherUserId }],
          },
          settings: { create: {} },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, nickname: true, avatar: true },
              },
            },
          },
          settings: true,
        },
      });
    }

    // GROUP — chưa implement
    if (dto.type === ConversationType.GROUP) {
      throw new BadRequestException('Group conversation not implemented yet');
    }

    throw new BadRequestException('Invalid conversation type');
  }

  /**
   * Xóa conversation (soft delete)
   */
  async deleteConversation(conversationId: string, user_id: string) {
    // Kiểm tra user có trong conversation không
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: user_id,
        left_at: null,
      },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    // Nếu là direct conversation, chỉ mark left_at
    // Nếu là group, có thể xóa hoàn toàn nếu là owner
    const conversation = await this.prisma.resConversation.findUnique({
      where: { id: conversationId },
    });

    if (conversation?.type === 'direct') {
      // Mark participant as left
      await this.prisma.resConversationParticipant.update({
        where: { id: participant.id },
        data: { left_at: new Date() },
      });
    } else {
      // Group: soft delete conversation
      await this.prisma.resConversation.update({
        where: { id: conversationId },
        data: { deleted_at: new Date() },
      });
    }

    return { message: 'Conversation deleted successfully' };
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, user_id: string, messageIds?: string[]) {
    const where: Prisma.ResMessageWhereInput = {
      conversation_id: conversationId,
      sender_id: { not: user_id }, // Không mark messages của chính mình
      is_read: false,
    };

    if (messageIds && messageIds.length > 0) {
      where.id = { in: messageIds };
    }

    const updated = await this.prisma.resMessage.updateMany({
      where,
      data: { is_read: true },
    });

    // Emit WebSocket event for read receipts
    // TODO: Import WebSocketGateway if needed
    // this.websocketGateway.emitMessageRead(conversationId, {
    //   messageIds: messageIds || [],
    //   user_id,
    //   readAt: new Date(),
    // });

    return {
      success: true,
      message: 'Messages marked as read',
      data: {
        count: updated.count,
        conversationId,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update notifications settings
   */
  async updateNotifications(conversationId: string, user_id: string, enabled: boolean) {
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: user_id,
        left_at: null,
      },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.resConversationParticipant.update({
      where: { id: participant.id },
      data: { is_muted: !enabled },
    });

    return { message: 'Notifications updated successfully' };
  }

  /**
   * Get conversation categories
   */
  async getCategories(user_id: string) {
    const conversations = await this.prisma.resConversation.findMany({
      where: {
        deleted_at: null,
        participants: {
          some: { user_id: user_id, left_at: null },
        },
      },
    });
    const directCount = conversations.filter((c) => c.type === 'direct').length;
    const groupCount = conversations.filter((c) => c.type === 'group').length;
    const allCount = conversations.length;
    return {
      categories: [
        { id: 'all', name: 'All', count: allCount },
        { id: 'direct', name: 'Direct Messages', count: directCount },
        { id: 'group', name: 'Groups', count: groupCount },
      ],
    };
  }

  /**
   * Get chat settings
   */
  async getChatSettings(conversationId: string, user_id: string) {
    const conversation = await this.prisma.resConversation.findFirst({
      where: {
        id: conversationId,
        deleted_at: null,
        participants: {
          some: {
            user_id: user_id,
            left_at: null,
          },
        },
      },
      include: {
        participants: {
          where: { left_at: null },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                bio: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const participant = conversation.participants.find((p) => p.user_id === user_id);
    const otherParticipant = conversation.participants.find((p) => p.user_id !== user_id);

    // Check if blocked
    const isBlocked = otherParticipant
      ? await this.prisma.resBlock.findFirst({
          where: {
            OR: [
              { blocker_id: user_id, blocked_id: otherParticipant.user_id },
              { blocker_id: otherParticipant.user_id, blocked_id: user_id },
            ],
          },
        })
      : null;

    return {
      conversationId: conversation.id,
      participant: otherParticipant
        ? {
            id: otherParticipant.user.id,
            nickname: otherParticipant.user.nickname,
            avatar: otherParticipant.user.avatar,
            bio: otherParticipant.user.bio,
            isOnline: false, // TODO: Get from WebSocket
            status: 'Active', // TODO: Get from user status
          }
        : conversation.group
          ? {
              id: conversation.group.id,
              nickname: conversation.group.name,
              avatar: conversation.group.avatar,
            }
          : null,
      displayName:
        participant?.display_name || otherParticipant?.user.nickname || conversation.group?.name,
      settings: {
        notificationsEnabled: !participant?.is_muted,
        isMuted: participant?.is_muted || false,
        giftSoundsEnabled: participant?.gift_sounds_enabled ?? true,
        isBlocked: !!isBlocked,
      },
      canChangeName: conversation.type === 'direct',
      canCreateGroup: conversation.type === 'direct',
      canReport: true,
      canBlock: conversation.type === 'direct' && !!otherParticipant,
    };
  }

  /**
   * Update display name
   */
  async updateDisplayName(conversationId: string, user_id: string, displayName: string) {
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: user_id,
        left_at: null,
      },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.resConversationParticipant.update({
      where: { id: participant.id },
      data: { display_name: displayName },
    });

    return {
      conversationId,
      displayName,
      updatedAt: new Date(),
    };
  }

  /**
   * Update gift sounds
   */
  async updateGiftSounds(conversationId: string, user_id: string, enabled: boolean) {
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: user_id,
        left_at: null,
      },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.resConversationParticipant.update({
      where: { id: participant.id },
      data: { gift_sounds_enabled: enabled },
    });

    return { message: 'Gift sounds updated successfully' };
  }

  /**
   * Report chat
   */
  async reportChat(conversationId: string, user_id: string, reason: string, details?: string) {
    const conversation = await this.prisma.resConversation.findFirst({
      where: {
        id: conversationId,
        deleted_at: null,
        participants: {
          some: {
            user_id: user_id,
            left_at: null,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // TODO: Create report record in database
    // For now, just return success
    return { message: 'Chat reported successfully' };
  }
}
