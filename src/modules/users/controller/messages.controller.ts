import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { SendMessageDto } from '../dto/send-message.dto';
import { UserMessagingService } from '../service/user-messaging.service';

@ApiTags('Messages')
@Controller('users')
export class MessagesController {
  constructor(private readonly messagingService: UserMessagingService) {}

  @Post(':id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn đến user khác' })
  @ApiParam({ name: 'id', description: 'ID người gửi' })
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
  async sendMessage(@Param('id') senderId: string, @Body() dto: SendMessageDto) {
    return this.messagingService.sendMessage(senderId, dto);
  }
}
