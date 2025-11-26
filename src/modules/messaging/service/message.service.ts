import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { IPaginatedResponse } from 'src/common/interfaces/pagination.interface';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { SendMessageDto, ForwardMessageDto } from '../dto/message.dto';
import { MessageType } from '../../../common/enums';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../../notifications/service/notification.service';
import { WebSocketGateway } from '../../realtime/gateway/websocket.gateway';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  /**
   * Lấy danh sách messages trong conversation với pagination
   */
  async getMessages(
    conversationId: string,
    userId: string,
    query?: BaseQueryDto,
  ): Promise<IPaginatedResponse<any>> {
    // Kiểm tra user có trong conversation không
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        left_at: null,
      },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    const take = query?.limit && query.limit > 0 ? query.limit : 50;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const where: Prisma.ResMessageWhereInput = {
      conversation_id: conversationId,
      deleted_at: null,
    };

    // Search filter
    if (query?.search) {
      where.content = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    // Sort: mặc định theo created_at desc (mới nhất trước)
    const orderBy: Prisma.ResMessageOrderByWithRelationInput = { created_at: 'desc' };
    if (query?.sort) {
      const [field, order] = query.sort.split(':');
      if (field && (order === 'asc' || order === 'desc')) {
        orderBy[field] = order;
      }
    }

    const [messages, total] = await Promise.all([
      this.prisma.resMessage.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          sender: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          gift: {
            include: {
              giftItem: {
                select: {
                  id: true,
                  name: true,
                  image_url: true,
                  price: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.resMessage.count({ where }),
    ]);

    // Format response
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      sender: msg.sender,
      type: msg.type,
      content: msg.content,
      mediaUrl: msg.media_url,
      mediaThumbnail: msg.media_thumbnail,
      mediaSize: msg.media_size,
      mediaDuration: msg.media_duration,
      waveform: msg.waveform ? JSON.parse(msg.waveform) : null,
      isRead: msg.is_read,
      isForwarded: msg.is_forwarded,
      gift: msg.gift
        ? {
            id: msg.gift.id,
            giftItem: msg.gift.giftItem,
            quantity: msg.gift.quantity,
            message: msg.gift.message,
          }
        : null,
      businessCardUserId: msg.business_card_user_id,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
    }));

    return buildPaginatedResponse(formattedMessages, total, page, take);
  }

  /**
   * Gửi message
   */
  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    // Kiểm tra user có trong conversation không
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        left_at: null,
      },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    // Validate message type và content
    if (dto.type === MessageType.TEXT && !dto.content) {
      throw new BadRequestException('Content is required for text messages');
    }

    if (
      (dto.type === MessageType.IMAGE ||
        dto.type === MessageType.VIDEO ||
        dto.type === MessageType.AUDIO) &&
      !dto.mediaUrl
    ) {
      throw new BadRequestException('mediaUrl is required for media messages');
    }

    if (dto.type === MessageType.GIFT && !dto.giftId && !dto.giftItemId) {
      throw new BadRequestException('giftId or giftItemId is required for gift messages');
    }

    const businessCardUserId = userId;

    if (dto.type === MessageType.BUSINESS_CARD) {
      const businessCardUser = await this.prisma.resUser.findUnique({
        where: { id: businessCardUserId },
        select: { id: true, nickname: true, avatar: true, bio: true },
      });

      if (!businessCardUser) {
        throw new NotFoundException('Business card user not found');
      }
    }

    // Tạo gift nếu là gift message
    let giftId: string | null = null;
    if (dto.type === MessageType.GIFT && dto.giftItemId) {
      // Lấy conversation để biết receiver
      const conversation = await this.prisma.resConversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            where: {
              user_id: { not: userId },
              left_at: null,
            },
          },
        },
      });

      if (conversation && conversation.participants.length > 0) {
        const receiverId = conversation.participants[0].user_id;
        const gift = await this.prisma.resGift.create({
          data: {
            sender_id: userId,
            receiver_id: receiverId,
            gift_item_id: dto.giftItemId.toString(),
            message: dto.content,
          },
        });
        giftId = gift.id;
      }
    }

    // Tạo message
    const message = await this.prisma.resMessage.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        type: dto.type,
        content: dto.content,
        media_url: dto.mediaUrl,
        media_thumbnail: dto.mediaThumbnail,
        media_size: dto.mediaSize,
        media_duration: dto.mediaDuration,
        waveform: dto.waveform ? JSON.stringify(dto.waveform) : null,
        gift_id: giftId,
        business_card_user_id: dto.type === MessageType.BUSINESS_CARD ? businessCardUserId : null,
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
        gift: {
          include: {
            giftItem: {
              select: {
                id: true,
                name: true,
                image_url: true,
                price: true,
              },
            },
          },
        },
      },
    });

    // Update conversation updated_at
    await this.prisma.resConversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    // Tạo notifications cho participants (trừ sender)
    const participants = await this.prisma.resConversationParticipant.findMany({
      where: {
        conversation_id: conversationId,
        user_id: { not: userId },
        left_at: null,
        is_muted: false,
      },
    });

    // Dùng Promise.all để tạo notification song song
    await Promise.all(
      participants.map((p) =>
        this.notificationService
          .createMessageNotification(p.user_id, userId, message.id)
          .catch(console.error),
      ),
    );

    // Emit WebSocket event
    try {
      this.websocketGateway.emitMessage(conversationId, {
        id: message.id,
        conversationId: message.conversation_id,
        sender: message.sender,
        type: message.type,
        content: message.content,
        mediaUrl: message.media_url,
        createdAt: message.created_at,
      });
    } catch (error) {
      console.error('Failed to emit WebSocket message:', error);
    }

    // Format response based on message type
    const responseData: any = {
      id: message.id,
      conversationId: message.conversation_id,
      sender: message.sender,
      type: message.type,
      content: message.content,
      mediaUrl: message.media_url,
      mediaThumbnail: message.media_thumbnail,
      mediaSize: message.media_size,
      mediaDuration: message.media_duration,
      isRead: message.is_read,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    };

    // Add gift info if gift message
    if (message.gift) {
      responseData.gift = {
        id: message.gift.id,
        giftItem: message.gift.giftItem,
        quantity: message.gift.quantity,
        message: message.gift.message,
      };
    }

    // Validate user exists
    if (dto.type === MessageType.BUSINESS_CARD) {
      const businessCardUser = await this.prisma.resUser.findUnique({
        where: { id: businessCardUserId },
        select: { id: true, nickname: true, avatar: true, bio: true, gender: true },
      });

      if (!businessCardUser) {
        throw new NotFoundException('Business card user not found');
      }

      // Trả về thông tin đầy đủ
      responseData.businessCard = {
        userId: businessCardUser.id,
        nickname: businessCardUser.nickname,
        avatar: businessCardUser.avatar,
        bio: businessCardUser.bio,
        gender: businessCardUser.gender,
      };
    }

    return {
      success: true,
      message: 'Message sent successfully',
      data: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Xóa message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.resMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Chỉ cho phép xóa message của chính mình
    if (message.sender_id !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    await this.prisma.resMessage.update({
      where: { id: messageId },
      data: { deleted_at: new Date() },
    });

    return { message: 'Message deleted successfully' };
  }

  /**
   * Forward messages
   */
  async forwardMessages(userId: string, dto: ForwardMessageDto) {
    // Lấy messages cần forward
    const messages = await this.prisma.resMessage.findMany({
      where: {
        id: { in: dto.messageIds },
        conversation_id: dto.conversationId,
        deleted_at: null,
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

    if (messages.length === 0) {
      throw new NotFoundException('Messages not found');
    }

    // Forward đến từng recipient
    const forwardedMessages = [];
    for (const recipientId of dto.recipientIds) {
      // Tìm hoặc tạo conversation
      let conversation = await this.prisma.resConversation.findFirst({
        where: {
          type: 'direct',
          participants: {
            every: {
              user_id: {
                in: [userId, recipientId],
              },
            },
          },
        },
      });

      if (!conversation) {
        conversation = await this.prisma.resConversation.create({
          data: {
            type: 'direct',
            created_by: userId,
            participants: {
              create: [{ user_id: userId }, { user_id: recipientId }],
            },
            settings: {
              create: {},
            },
          },
        });
      }

      // Forward từng message với đầy đủ thông tin
      for (const msg of messages) {
        const forwarded = await this.prisma.resMessage.create({
          data: {
            conversation_id: conversation.id,
            sender_id: userId,
            type: msg.type,
            content: msg.content,
            media_url: msg.media_url,
            media_thumbnail: msg.media_thumbnail,
            media_size: msg.media_size,
            media_duration: msg.media_duration,
            waveform: msg.waveform,
            gift_id: msg.gift_id,
            business_card_user_id: msg.business_card_user_id,
            is_forwarded: true,
            original_message_id: msg.id,
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
            gift: msg.gift_id
              ? {
                  include: {
                    giftItem: {
                      select: {
                        id: true,
                        name: true,
                        image_url: true,
                        price: true,
                      },
                    },
                  },
                }
              : false,
          },
        });

        // Update conversation updated_at
        await this.prisma.resConversation.update({
          where: { id: conversation.id },
          data: { updated_at: new Date() },
        });

        forwardedMessages.push(forwarded);

        // Emit WebSocket với đầy đủ thông tin
        try {
          this.websocketGateway.emitMessage(conversation.id, {
            id: forwarded.id,
            conversationId: forwarded.conversation_id,
            sender: forwarded.sender,
            type: forwarded.type,
            content: forwarded.content,
            mediaUrl: forwarded.media_url,
            mediaThumbnail: forwarded.media_thumbnail,
            isForwarded: true,
            originalMessageId: msg.id,
            createdAt: forwarded.created_at,
          });
        } catch (error) {
          console.error('Failed to emit WebSocket message:', error);
        }

        // Create notification
        try {
          await this.notificationService.createMessageNotification(
            recipientId,
            userId,
            forwarded.id,
          );
        } catch (error) {
          console.error('Failed to create notification:', error);
        }
      }
    }

    return {
      success: true,
      message: 'Messages forwarded successfully',
      data: forwardedMessages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        sender: msg.sender,
        type: msg.type,
        content: msg.content,
        mediaUrl: msg.media_url,
        mediaThumbnail: msg.media_thumbnail,
        isForwarded: true,
        originalMessageId: msg.original_message_id,
        createdAt: msg.created_at,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Lấy media gallery của conversation
   */
  async getMediaGallery(conversationId: string, userId: string, query?: BaseQueryDto) {
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        left_at: null,
      },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const where: Prisma.ResMessageWhereInput = {
      conversation_id: conversationId,
      deleted_at: null,
      type: {
        in: ['image', 'video', 'audio'],
      },
      media_url: { not: null },
    };

    const [messages, total] = await Promise.all([
      this.prisma.resMessage.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          type: true,
          media_url: true,
          media_thumbnail: true,
          media_size: true,
          media_duration: true,
          created_at: true,
        },
      }),
      this.prisma.resMessage.count({ where }),
    ]);

    // Format response với đầy đủ thông tin media
    const formattedMedia = messages.map((msg) => ({
      id: msg.id,
      type: msg.type,
      mediaUrl: msg.media_url,
      mediaThumbnail: msg.media_thumbnail,
      mediaSize: msg.media_size,
      mediaDuration: msg.media_duration,
      createdAt: msg.created_at,
    }));

    return buildPaginatedResponse(formattedMedia, total, page, take);
  }
}
