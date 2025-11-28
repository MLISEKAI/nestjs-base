import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TypingIndicatorDto } from '../dto/typing.dto';
import { WebSocketGateway } from '../../realtime/gateway/websocket.gateway';

@Injectable()
export class TypingService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string, user_id: string, dto: TypingIndicatorDto) {
    // Kiểm tra user có trong conversation không
    const participant = await this.prisma.resConversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: user_id,
        left_at: null,
      },
    });

    if (!participant) {
      throw new Error('Conversation not found');
    }

    // Emit WebSocket event
    try {
      this.websocketGateway.emitTyping(conversationId, {
        user_id,
        isTyping: dto.isTyping,
      });
    } catch (error) {
      console.error('Failed to emit typing indicator:', error);
    }

    return { message: 'Typing indicator sent' };
  }
}
