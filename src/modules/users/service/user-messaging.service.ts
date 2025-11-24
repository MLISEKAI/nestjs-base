// Import Injectable, Inject và forwardRef từ NestJS
import { Injectable, Inject, forwardRef } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from 'src/prisma/prisma.service';
// Import DTO để validate và type-check dữ liệu
import { SendMessageDto } from '../dto/send-message.dto';
// Import NotificationService với forwardRef để tránh circular dependency
import { NotificationService } from '../../notifications/service/notification.service';
// Import WebSocketGateway với forwardRef để tránh circular dependency
import { WebSocketGateway } from '../../realtime/gateway/websocket.gateway';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * UserMessagingService - Service xử lý business logic cho messaging (gửi/nhận tin nhắn)
 *
 * Chức năng chính:
 * - Gửi tin nhắn giữa các users
 * - Tạo notification khi có tin nhắn mới
 * - Emit real-time message qua WebSocket
 *
 * Lưu ý:
 * - Sử dụng forwardRef với NotificationService và WebSocketGateway để tránh circular dependency
 * - Nếu notification hoặc WebSocket fail, không làm fail việc gửi message (graceful degradation)
 */
@Injectable()
export class UserMessagingService {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các services khi tạo instance của service
   * @Inject(forwardRef(...)) - Dùng forwardRef để tránh circular dependency
   */
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  async sendMessage(senderId: string, dto: SendMessageDto) {
    // Tạo message trong database
    const message = await this.prisma.resMessage.create({
      data: { sender_id: senderId, receiver_id: dto.recipient_id, content: dto.content },
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

    // Tạo notification
    try {
      await this.notificationService.createMessageNotification(
        dto.recipient_id,
        senderId,
        message.id,
      );
    } catch (error) {
      // Log error nhưng không fail message send
      console.error('Failed to create notification:', error);
    }

    // Emit real-time message qua WebSocket
    try {
      this.websocketGateway.emitMessage(dto.recipient_id, {
        id: message.id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        content: message.content,
        sender: message.sender,
        createdAt: message.created_at,
      });
    } catch (error) {
      // Log error nhưng không fail message send
      console.error('Failed to emit WebSocket message:', error);
    }

    return { message: 'Message sent', data: message };
  }
}
