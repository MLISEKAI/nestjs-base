import { Controller, Post, Body, UsePipes, ValidationPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessageService } from '../service/message.service';
import { ForwardMessageDto } from '../dto/message.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Messages Forward')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('messages')
export class ForwardController {
  constructor(private readonly messageService: MessageService) {}

  @Post('forward')
  @ApiOperation({
    summary: 'Chuyển tiếp tin nhắn',
    description:
      'Chuyển tiếp một hoặc nhiều tin nhắn từ cuộc trò chuyện này sang các cuộc trò chuyện khác. Có thể chuyển tiếp đến nhiều người cùng lúc',
  })
  @ApiBody({ type: ForwardMessageDto })
  @ApiOkResponse({
    description: 'Các tin nhắn đã được chuyển tiếp thành công đến các người nhận',
    example: {
      message: 'Messages forwarded successfully',
      forwardedCount: 2,
      recipients: ['user-1', 'user-2'],
    },
  })
  async forwardMessages(@Req() req: AuthenticatedRequest, @Body() dto: ForwardMessageDto) {
    return this.messageService.forwardMessages(req.user.id, dto);
  }
}
