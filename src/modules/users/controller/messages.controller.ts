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
  @ApiOkResponse({ description: 'Tin nhắn đã gửi' })
  async sendMessage(@Param('id') senderId: string, @Body() dto: SendMessageDto) {
    return this.messagingService.sendMessage(senderId, dto);
  }
}
