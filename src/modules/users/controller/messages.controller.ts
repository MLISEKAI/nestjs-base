import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SendMessageDto } from '../dto/send-message.dto';
import { UserMessagingService } from '../service/user-messaging.service';

/**
 * User Messages Controller - Yêu cầu authentication
 * User chỉ có thể gửi messages từ chính mình
 */
@ApiTags('Messages (User)')
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagingService: UserMessagingService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi tin nhắn đến user khác (sender tự động từ JWT token)' })
  @ApiBody({ type: SendMessageDto })
  @ApiOkResponse({
    description: 'Tin nhắn đã gửi',
    schema: {
      type: 'object',
      properties: {
        id: { example: 'msg-123' },
        senderId: { example: 'user-1' },
        recipientId: { example: 'user-456' },
        content: { example: 'Xin chào, bạn khỏe không?' },
        created_at: { example: '2025-01-01T00:00:00.000Z' },
      },
    },
  })
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    const senderId = req.user.id;
    return this.messagingService.sendMessage(senderId, dto);
  }
}
