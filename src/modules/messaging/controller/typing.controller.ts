import {
  Controller,
  Post,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TypingService } from '../service/typing.service';
import { TypingIndicatorDto } from '../dto/typing.dto';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';

@ApiTags('Messages Typing')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard('account-auth'))
@ApiBearerAuth('JWT-auth')
@Controller('messages/:conversationId')
export class TypingController {
  constructor(private readonly typingService: TypingService) {}

  @Post('typing')
  @ApiOperation({
    summary: 'Gửi tín hiệu đang gõ tin nhắn',
    description:
      'Thông báo cho các thành viên khác trong cuộc trò chuyện biết bạn đang gõ tin nhắn. Gửi isTyping=true khi bắt đầu gõ, gửi isTyping=false khi dừng gõ',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID của cuộc trò chuyện muốn gửi tín hiệu đang gõ',
  })
  @ApiBody({ type: TypingIndicatorDto })
  @ApiOkResponse({
    description: 'Tín hiệu đang gõ đã được gửi thành công',
    example: {
      message: 'Typing indicator sent successfully',
      conversationId: 'conv-1',
      user_id: 'user-1',
      isTyping: true,
    },
  })
  async sendTypingIndicator(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: TypingIndicatorDto,
  ) {
    return this.typingService.sendTypingIndicator(conversationId, req.user.id, dto);
  }
}
