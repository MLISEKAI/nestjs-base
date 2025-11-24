// Import các decorator và class từ NestJS để tạo service
import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
// Import PrismaService để thao tác với database
import { PrismaService } from 'src/prisma/prisma.service';
// Import CacheService để quản lý Redis cache
import { CacheService } from 'src/common/cache/cache.service';
// Import các DTO (Data Transfer Object) để validate và type-check dữ liệu
import {
  CreateNotificationDto,
  UpdateNotificationStatusDto,
  NotificationQueryDto,
} from '../dto/notification.dto';
// Import các enum từ Prisma schema (NotificationType, NotificationStatus)
import { NotificationType, NotificationStatus } from '@prisma/client';
// Import BaseQueryDto cho pagination và filtering
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
// Import utility function để build paginated response
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
// Import WebSocketGateway để gửi real-time notification
import { WebSocketGateway } from '../../realtime/gateway/websocket.gateway';

/**
 * @Injectable() - Decorator đánh dấu class này là một NestJS service, có thể được inject vào các class khác
 * NotificationService - Service xử lý tất cả logic liên quan đến notifications
 */
@Injectable()
export class NotificationService {
  // Logger để ghi log, giúp debug và theo dõi hoạt động của service
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các service này khi tạo instance của NotificationService
   */
  constructor(
    // PrismaService - Service để thao tác với database (CRUD operations)
    private readonly prisma: PrismaService,
    // CacheService - Service để quản lý Redis cache (get, set, delete cache)
    private readonly cacheService: CacheService,
    // @Inject(forwardRef()) - Dùng forwardRef để tránh circular dependency với WebSocketGateway
    // WebSocketGateway - Gateway để gửi real-time notification qua WebSocket
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  /**
   * Tạo notification mới
   * @param dto - DTO chứa thông tin notification cần tạo (user_id, sender_id, type, title, content, etc.)
   * @returns Object chứa status và notification_id
   */
  async createNotification(dto: CreateNotificationDto) {
    // Tạo notification mới trong database bằng Prisma
    // resNotification là tên table trong database (được map từ model ResNotification)
    const notification = await this.prisma.resNotification.create({
      data: {
        user_id: dto.user_id, // ID người nhận notification (receiver)
        sender_id: dto.sender_id, // ID người gửi notification (sender) - có thể null nếu là system notification
        type: dto.type, // Loại notification (LIKE, COMMENT, FOLLOW, MESSAGE, etc.)
        title: dto.title, // Tiêu đề notification
        content: dto.content, // Nội dung notification
        data: dto.data, // Dữ liệu bổ sung dạng JSON string (ví dụ: {post_id: "123"})
        link: dto.link, // Link đến nội dung liên quan (ví dụ: /posts/123)
        status: NotificationStatus.UNREAD, // Mặc định là UNREAD khi tạo mới
      },
      include: {
        // Include thông tin sender (người gửi) để trả về trong response
        sender: {
          select: {
            id: true, // ID của sender
            nickname: true, // Tên hiển thị của sender
            avatar: true, // Avatar của sender
          },
        },
      },
    });

    // Ghi log để theo dõi notification đã được tạo
    this.logger.log(`Notification created: ${notification.id} for user ${dto.user_id}`);

    // Gửi notification real-time qua WebSocket để user nhận được ngay lập tức
    // Nếu WebSocket fail, không làm fail việc tạo notification (graceful degradation)
    try {
      // Emit notification đến room của user nhận notification
      // User sẽ nhận được notification ngay lập tức nếu đang online
      this.websocketGateway.emitNotification(dto.user_id, {
        id: notification.id, // ID của notification
        type: notification.type, // Loại notification
        title: notification.title, // Tiêu đề
        content: notification.content, // Nội dung
        status: notification.status, // Trạng thái (UNREAD/READ)
        sender: notification.sender, // Thông tin người gửi
        created_at: notification.created_at, // Thời gian tạo
      });
    } catch (error) {
      // Log error nhưng không fail notification creation
      // Vì notification đã được lưu vào database, chỉ là không gửi được real-time
      this.logger.error('Failed to emit WebSocket notification:', error);
    }

    // Xóa cache của user nhận notification để đảm bảo dữ liệu mới nhất
    // delPattern xóa tất cả cache key có pattern `notifications:${user_id}:*`
    // Ví dụ: notifications:user-123:page:1:limit:20, notifications:user-123:unread:count, etc.
    await this.cacheService.delPattern(`notifications:${dto.user_id}:*`);

    // Trả về response thành công với notification_id
    return {
      status: 'success',
      notification_id: notification.id,
    };
  }

  /**
   * Lấy danh sách notifications của user với pagination và filtering
   * Cached for 1 minute (notifications thay đổi thường xuyên nên cache ngắn)
   * @param userId - ID của user cần lấy notifications
   * @param query - Query parameters (page, limit, type, status, etc.)
   * @returns Paginated response chứa danh sách notifications
   */
  async getUserNotifications(userId: string, query?: NotificationQueryDto) {
    // Xác định số lượng items mỗi trang (limit)
    // Nếu query.limit có và > 0 thì dùng, không thì mặc định 20
    const take = query?.limit && query.limit > 0 ? query.limit : 20;
    // Xác định trang hiện tại (page)
    // Nếu query.page có và > 0 thì dùng, không thì mặc định trang 1
    const page = query?.page && query.page > 0 ? query.page : 1;
    // Tính số lượng records cần skip (bỏ qua) để lấy đúng trang
    // Ví dụ: page 2, limit 20 => skip = (2-1) * 20 = 20 (bỏ qua 20 records đầu)
    const skip = (page - 1) * take;

    // Build where clause (điều kiện WHERE trong SQL) để filter notifications
    // Khởi tạo với điều kiện cơ bản: chỉ lấy notifications của user này
    const where: any = { user_id: userId };

    // Ghi log để debug
    this.logger.debug(
      `Getting notifications for user: ${userId}, filters: ${JSON.stringify(query)}`,
    );

    // Filter theo type (hỗ trợ nhiều types, comma-separated)
    // Ví dụ: type=LIKE,COMMENT,FOLLOW
    if (query?.type) {
      // Tách chuỗi type bằng dấu phẩy, loại bỏ khoảng trắng, và filter chỉ lấy các type hợp lệ
      const types = query.type
        .split(',') // Tách thành array: ["LIKE", "COMMENT", "FOLLOW"]
        .map((t) => t.trim()) // Loại bỏ khoảng trắng: ["LIKE", "COMMENT", "FOLLOW"]
        .filter((t) => Object.values(NotificationType).includes(t as NotificationType)); // Chỉ giữ các type hợp lệ
      // Nếu có ít nhất 1 type hợp lệ, thêm điều kiện filter
      if (types.length > 0) {
        where.type = { in: types }; // SQL: WHERE type IN ('LIKE', 'COMMENT', 'FOLLOW')
      }
    }

    // Filter theo status (READ hoặc UNREAD)
    if (query?.status) {
      where.status = query.status; // SQL: WHERE status = 'UNREAD'
    }

    // Build cache key với filters để cache riêng cho mỗi combination của filters
    // Ví dụ: notifications:user-123:page:1:limit:20:type:LIKE,COMMENT:status:UNREAD
    const typeKey = query?.type ? `:type:${query.type}` : ''; // Thêm type vào cache key nếu có
    const statusKey = query?.status ? `:status:${query.status}` : ''; // Thêm status vào cache key nếu có
    const cacheKey = `notifications:${userId}:page:${page}:limit:${take}${typeKey}${statusKey}`;
    const cacheTtl = 60; // Cache trong 60 giây (1 phút) vì notifications thay đổi thường xuyên

    // Sử dụng cache: nếu có trong cache thì trả về, không thì query database và cache lại
    return this.cacheService.getOrSet(
      cacheKey, // Key để lưu cache
      async () => {
        // Query database song song (parallel) để tối ưu performance
        // Promise.all chạy cả 2 query cùng lúc thay vì chạy tuần tự
        const [notifications, total] = await Promise.all([
          // Query 1: Lấy danh sách notifications với pagination
          this.prisma.resNotification.findMany({
            where, // Điều kiện filter (user_id, type, status)
            take, // Số lượng records cần lấy (limit)
            skip, // Số lượng records cần bỏ qua (offset)
            orderBy: { created_at: 'desc' }, // Sắp xếp theo thời gian tạo, mới nhất trước
            include: {
              // Include thông tin sender (người gửi) để hiển thị trong response
              sender: {
                select: {
                  id: true, // ID của sender
                  nickname: true, // Tên hiển thị
                  avatar: true, // Avatar
                },
              },
            },
          }),
          // Query 2: Đếm tổng số notifications (để tính total_pages)
          this.prisma.resNotification.count({ where }), // Count với cùng điều kiện filter
        ]);

        // Ghi log để debug
        this.logger.debug(
          `Found ${notifications.length} notifications for user ${userId} (total: ${total})`,
        );

        // Build paginated response với format chuẩn
        // Trả về: { items: [...], meta: { total_items, total_pages, current_page, etc. } }
        return buildPaginatedResponse(notifications, total, page, take);
      },
      cacheTtl, // Thời gian cache (60 giây)
    );
  }

  /**
   * Lấy số lượng unread notifications
   * Cached for 30 seconds (real-time data)
   */
  async getUnreadCount(userId: string) {
    const cacheKey = `notifications:${userId}:unread:count`;
    const cacheTtl = 30; // 30 giây (real-time)

    const count = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.resNotification.count({
          where: {
            user_id: userId,
            status: NotificationStatus.UNREAD,
          },
        });
      },
      cacheTtl,
    );

    return { unread_count: count };
  }

  /**
   * Cập nhật status của notification
   */
  async updateNotificationStatus(notificationId: string, dto: UpdateNotificationStatusDto) {
    try {
      // Lấy notification để biết user_id
      const notification = await this.prisma.resNotification.findUnique({
        where: { id: notificationId },
        select: { user_id: true },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      const updated = await this.prisma.resNotification.update({
        where: { id: notificationId },
        data: { status: dto.status },
      });

      // Invalidate cache
      await this.cacheService.delPattern(`notifications:${notification.user_id}:*`);

      return updated;
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

    // Invalidate cache
    await this.cacheService.delPattern(`notifications:${userId}:*`);

    return {
      status: 'success',
      message: 'All notifications have been marked as read.',
    };
  }

  /**
   * Lấy chi tiết notification theo ID
   */
  async getNotificationById(notificationId: string, userId: string) {
    const notification = await this.prisma.resNotification.findFirst({
      where: {
        id: notificationId,
        user_id: userId, // Đảm bảo chỉ user sở hữu mới xem được
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

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Đánh dấu một notification là đã đọc
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.resNotification.findFirst({
        where: {
          id: notificationId,
          user_id: userId,
        },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      const updated = await this.prisma.resNotification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.READ },
      });

      // Invalidate cache
      await this.cacheService.delPattern(`notifications:${userId}:*`);

      return {
        status: 'success',
        message: 'Notification marked as read.',
      };
    } catch (error) {
      if (error.code === 'P2025' || error instanceof NotFoundException) {
        throw new NotFoundException('Notification not found');
      }
      throw error;
    }
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

      // Invalidate cache
      await this.cacheService.delPattern(`notifications:${userId}:*`);

      return {
        status: 'success',
        message: 'Notification deleted.',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Notification not found');
      }
      throw error;
    }
  }

  /**
   * Xóa tất cả notifications của user
   */
  async deleteAllNotifications(userId: string) {
    await this.prisma.resNotification.deleteMany({
      where: {
        user_id: userId,
      },
    });

    // Invalidate cache
    await this.cacheService.delPattern(`notifications:${userId}:*`);

    return {
      status: 'success',
      message: 'All notifications cleared.',
    };
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
