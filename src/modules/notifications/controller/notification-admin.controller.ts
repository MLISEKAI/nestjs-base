import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { NotificationService } from '../service/notification.service';
import { CreateNotificationDto } from '../dto/notification.dto';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

/**
 * Admin Notifications Controller - Chỉ admin mới truy cập được
 * Dùng để quản lý notifications của bất kỳ user nào
 */
@ApiTags('Notifications (Admin)')
@UseGuards(AuthGuard('account-auth'), AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users/:user_id/notifications')
export class NotificationAdminController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách notifications của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user muốn xem' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getNotifications(@Param('user_id') userId: string, @Query() query: BaseQueryDto) {
    return this.notificationService.getUserNotifications(userId, query);
  }

  @Post()
  @ApiOperation({ summary: '[ADMIN] Tạo notification cho user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiBody({ type: CreateNotificationDto })
  createNotification(@Param('user_id') userId: string, @Body() dto: CreateNotificationDto) {
    return this.notificationService.createNotification({ ...dto, user_id: userId });
  }

  @Delete(':id')
  @ApiOperation({ summary: '[ADMIN] Xóa notification của user bất kỳ' })
  @ApiParam({ name: 'user_id', description: 'ID của user' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  deleteNotification(@Param('user_id') userId: string, @Param('id') id: string) {
    return this.notificationService.deleteNotification(id, userId);
  }
}
