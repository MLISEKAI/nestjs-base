import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { UserMessagingService } from '../service/user-messaging.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * Admin Messages Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý messages của bất kỳ user nào (moderation)
 */
@ApiTags('Messages (Admin)')
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/messages')
export class MessagesAdminController {
  constructor(private readonly messagingService: UserMessagingService) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách messages của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem messages' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang (mặc định: 20)',
  })
  @ApiOkResponse({
    description: 'Danh sách messages với pagination',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { example: 'msg-123' },
              sender_id: { example: 'user-1' },
              receiver_id: { example: 'user-2' },
              content: { example: 'Message content' },
              created_at: { example: '2025-01-01T00:00:00.000Z' },
            },
          },
        },
        meta: { type: 'object' },
      },
    },
  })
  async getMessages(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    // TODO: Implement getMessages method in service
    // For now, return placeholder
    return {
      items: [],
      meta: { total_items: 0, current_page: 1, items_per_page: 20 },
    };
  }

  @Delete(':message_id')
  @ApiOperation({ summary: '[ADMIN] Xóa message của user bất kỳ (moderation)' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'message_id', description: 'ID của message cần xóa' })
  @ApiOkResponse({
    description: 'Message đã bị xóa',
    schema: {
      type: 'object',
      properties: {
        message: { example: 'Message deleted successfully' },
      },
    },
  })
  async deleteMessage(@Param('user_id') userId: string, @Param('message_id') messageId: string) {
    // TODO: Implement deleteMessage method in service
    return { message: 'Message deleted successfully' };
  }
}
