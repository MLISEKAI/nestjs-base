import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotificationDto, UpdateNotificationStatusDto } from '../dto/notification.dto';
import { NotificationType, NotificationStatus } from '@prisma/client';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { WebSocketGateway } from '../../realtime/gateway/websocket.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  /**
   * Tạo notification mới
   */
  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.resNotification.create({
      data: {
        user_id: dto.user_id,
        sender_id: dto.sender_id,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        data: dto.data,
        link: dto.link,
        status: NotificationStatus.UNREAD,
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

    this.logger.log(`Notification created: ${notification.id} for user ${dto.user_id}`);

    // Emit real-time notification qua WebSocket
    try {
      this.websocketGateway.emitNotification(dto.user_id, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        status: notification.status,
        sender: notification.sender,
        created_at: notification.created_at,
      });
    } catch (error) {
      // Log error nhưng không fail notification creation
      this.logger.error('Failed to emit WebSocket notification:', error);
    }

    return notification;
  }

  /**
   * Lấy danh sách notifications của user
   */
  async getUserNotifications(userId: string, query?: BaseQueryDto) {
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    const page = query?.page && query.page > 0 ? query.page : 1;
    const skip = (page - 1) * take;

    const [notifications, total] = await Promise.all([
      this.prisma.resNotification.findMany({
        where: { user_id: userId },
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
      this.prisma.resNotification.count({ where: { user_id: userId } }),
    ]);

    return buildPaginatedResponse(notifications, total, page, take);
  }

  /**
   * Lấy số lượng unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.resNotification.count({
      where: {
        user_id: userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  /**
   * Cập nhật status của notification
   */
  async updateNotificationStatus(notificationId: string, dto: UpdateNotificationStatusDto) {
    try {
      return await this.prisma.resNotification.update({
        where: { id: notificationId },
        data: { status: dto.status },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Notification not found');
      }
      throw error;
    }
  }

  /**
   * Đánh dấu tất cả notifications là đã đọc
   */
  async markAllAsRead(userId: string) {
    await this.prisma.resNotification.updateMany({
      where: {
        user_id: userId,
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
      },
    });

    return { message: 'All notifications marked as read' };
  }

  /**
   * Xóa notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      await this.prisma.resNotification.delete({
        where: {
          id: notificationId,
          user_id: userId, // Đảm bảo chỉ user sở hữu mới xóa được
        },
      });
      return { message: 'Notification deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Notification not found');
      }
      throw error;
    }
  }

  /**
   * Helper: Tạo notification cho message
   */
  async createMessageNotification(receiverId: string, senderId: string, messageId: string) {
    return this.createNotification({
      user_id: receiverId,
      sender_id: senderId,
      type: NotificationType.MESSAGE,
      title: 'New Message',
      content: 'You have a new message',
      data: JSON.stringify({ messageId }),
      link: `/messages/${messageId}`,
    });
  }

  /**
   * Helper: Tạo notification cho follow
   */
  async createFollowNotification(userId: string, followerId: string) {
    return this.createNotification({
      user_id: userId,
      sender_id: followerId,
      type: NotificationType.FOLLOW,
      title: 'New Follower',
      content: 'Someone started following you',
      link: `/users/${followerId}`,
    });
  }

  /**
   * Helper: Tạo notification cho gift
   */
  async createGiftNotification(receiverId: string, senderId: string, giftId: string) {
    return this.createNotification({
      user_id: receiverId,
      sender_id: senderId,
      type: NotificationType.GIFT,
      title: 'New Gift',
      content: 'You received a gift',
      data: JSON.stringify({ giftId }),
      link: `/gifts/${giftId}`,
    });
  }
}
