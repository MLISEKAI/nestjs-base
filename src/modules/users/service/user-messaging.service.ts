import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { NotificationService } from '../../notifications/service/notification.service';
import { WebSocketGateway } from '../../realtime/gateway/websocket.gateway';

@Injectable()
export class UserMessagingService {
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
